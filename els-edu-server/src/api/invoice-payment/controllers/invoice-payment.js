'use strict';

/**
 * invoice-payment controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::invoice-payment.invoice-payment', ({ strapi }) => ({

    // Process new payment
    async processPayment(ctx) {
        try {
            const {
                invoiceId,
                paymentMethod,
                paymentGateway,
                amount,
                gatewayTransactionId,
                gatewayResponse
            } = ctx.request.body;

            const invoice = await strapi.entityService.findOne('api::invoice.invoice', invoiceId);
            if (!invoice) {
                return ctx.notFound('Invoice not found');
            }

            // Create payment record
            const payment = await strapi.entityService.create('api::invoice-payment.invoice-payment', {
                data: {
                    invoice: invoiceId,
                    payment_method: paymentMethod,
                    payment_gateway: paymentGateway,
                    amount: amount,
                    currency: invoice.currency || 'INR',
                    gateway_transaction_id: gatewayTransactionId,
                    gateway_response: gatewayResponse,
                    status: 'PENDING',
                    payment_date: new Date()
                }
            });

            // Update payment status based on gateway response
            if (gatewayResponse && gatewayResponse.status === 'SUCCESS') {
                await this.confirmPayment(payment.id, gatewayResponse);
            }

            ctx.send({
                success: true,
                data: payment
            });

        } catch (error) {
            ctx.throw(500, `Failed to process payment: ${error.message}`);
        }
    },

    // Confirm payment and update invoice status
    async confirmPayment(paymentId, gatewayData = null) {
        try {
            const payment = await strapi.entityService.findOne('api::invoice-payment.invoice-payment', paymentId, {
                populate: ['invoice']
            });

            if (!payment) {
                throw new Error('Payment not found');
            }

            // Update payment status
            await strapi.entityService.update('api::invoice-payment.invoice-payment', paymentId, {
                data: {
                    status: 'COMPLETED',
                    confirmed_at: new Date(),
                    gateway_response: gatewayData || payment.gateway_response
                }
            });

            // Calculate total paid amount for this invoice
            const allPayments = await strapi.entityService.findMany('api::invoice-payment.invoice-payment', {
                filters: {
                    invoice: payment.invoice.id,
                    status: 'COMPLETED'
                }
            });

            const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
            const invoice = payment.invoice;

            // Update invoice status
            let invoiceStatus = 'PENDING';
            if (totalPaid >= invoice.final_amount) {
                invoiceStatus = 'PAID';
            } else if (totalPaid > 0) {
                invoiceStatus = 'PARTIALLY_PAID';
            }

            await strapi.entityService.update('api::invoice.invoice', invoice.id, {
                data: {
                    status: invoiceStatus,
                    paid_amount: totalPaid,
                    paid_at: invoiceStatus === 'PAID' ? new Date() : null
                }
            });

            // If fully paid, activate subscriptions/access
            if (invoiceStatus === 'PAID') {
                await this.activateSubscriptions(invoice);
            }

            return { success: true, invoiceStatus, totalPaid };

        } catch (error) {
            throw new Error(`Failed to confirm payment: ${error.message}`);
        }
    },

    // Handle payment webhooks
    async handleWebhook(ctx) {
        try {
            const { gateway } = ctx.params;
            const webhookData = ctx.request.body;

            let paymentId, status, transactionId;

            // Parse webhook data based on gateway
            switch (gateway) {
                case 'cashfree':
                    paymentId = webhookData.order_id;
                    status = webhookData.order_status;
                    transactionId = webhookData.cf_payment_id;
                    break;

                case 'razorpay':
                    paymentId = webhookData.payload.payment.entity.order_id;
                    status = webhookData.payload.payment.entity.status;
                    transactionId = webhookData.payload.payment.entity.id;
                    break;

                default:
                    return ctx.badRequest('Unsupported gateway');
            }

            // Find payment by gateway transaction ID or order ID
            const payments = await strapi.entityService.findMany('api::invoice-payment.invoice-payment', {
                filters: {
                    $or: [
                        { gateway_transaction_id: transactionId },
                        { gateway_order_id: paymentId }
                    ]
                }
            });

            if (payments.length > 0) {
                const payment = payments[0];

                if (status === 'PAID' || status === 'captured') {
                    await this.confirmPayment(payment.id, webhookData);
                } else if (status === 'FAILED' || status === 'failed') {
                    await strapi.entityService.update('api::invoice-payment.invoice-payment', payment.id, {
                        data: {
                            status: 'FAILED',
                            gateway_response: webhookData,
                            failed_at: new Date()
                        }
                    });
                }
            }

            ctx.send({ success: true, received: true });

        } catch (error) {
            ctx.throw(500, `Webhook processing failed: ${error.message}`);
        }
    },

    // Get payment history for invoice
    async getPaymentHistory(ctx) {
        try {
            const { invoiceId } = ctx.params;

            const payments = await strapi.entityService.findMany('api::invoice-payment.invoice-payment', {
                filters: { invoice: invoiceId },
                sort: { payment_date: 'desc' }
            });

            const summary = {
                totalPaid: payments
                    .filter(p => p.status === 'COMPLETED')
                    .reduce((sum, p) => sum + p.amount, 0),
                totalPending: payments
                    .filter(p => p.status === 'PENDING')
                    .reduce((sum, p) => sum + p.amount, 0),
                totalFailed: payments
                    .filter(p => p.status === 'FAILED')
                    .reduce((sum, p) => sum + p.amount, 0),
                paymentCount: payments.length
            };

            ctx.send({
                success: true,
                data: {
                    payments,
                    summary
                }
            });

        } catch (error) {
            ctx.throw(500, `Failed to get payment history: ${error.message}`);
        }
    },

    // Refund payment
    async initiateRefund(ctx) {
        try {
            const { paymentId } = ctx.params;
            const { refundAmount, reason } = ctx.request.body;

            const payment = await strapi.entityService.findOne('api::invoice-payment.invoice-payment', paymentId, {
                populate: ['invoice']
            });

            if (!payment || payment.status !== 'COMPLETED') {
                return ctx.badRequest('Payment not found or not completed');
            }

            // Create refund record
            const refund = await strapi.entityService.create('api::invoice-payment.invoice-payment', {
                data: {
                    invoice: payment.invoice.id,
                    parent_payment: paymentId,
                    payment_method: payment.payment_method,
                    payment_gateway: payment.payment_gateway,
                    amount: -Math.abs(refundAmount), // Negative amount for refund
                    currency: payment.currency,
                    status: 'PENDING',
                    payment_date: new Date(),
                    refund_reason: reason,
                    is_refund: true
                }
            });

            // TODO: Integrate with actual payment gateway refund APIs
            // This would depend on the specific gateway being used

            ctx.send({
                success: true,
                data: refund
            });

        } catch (error) {
            ctx.throw(500, `Failed to initiate refund: ${error.message}`);
        }
    },

    // Helper method to activate subscriptions after payment
    async activateSubscriptions(invoice) {
        try {
            // Get invoice items to activate access
            const items = await strapi.entityService.findMany('api::invoice-item.invoice-item', {
                filters: { invoice: invoice.id },
                populate: ['course', 'subject']
            });

            for (const item of items) {
                if (item.item_type === 'COURSE' && item.course) {
                    // Create course subscription
                    await strapi.entityService.create('api::subscription.subscription', {
                        data: {
                            user: invoice.user,
                            course: item.course.id,
                            status: 'ACTIVE',
                            start_date: new Date(),
                            // Add end_date based on course duration or make it lifetime
                            subscription_type: 'COURSE_ACCESS'
                        }
                    });
                } else if (item.item_type === 'SUBJECT' && item.subject) {
                    // Create subject subscription
                    await strapi.entityService.create('api::subscription.subscription', {
                        data: {
                            user: invoice.user,
                            subject: item.subject.id,
                            status: 'ACTIVE',
                            start_date: new Date(),
                            subscription_type: 'SUBJECT_ACCESS'
                        }
                    });
                }
            }

        } catch (error) {
            console.error('Failed to activate subscriptions:', error);
        }
    }

}));