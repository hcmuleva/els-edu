'use strict';

/**
 * invoice controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::invoice.invoice', ({ strapi }) => ({

    // Generate invoice for course purchase
    async generateCourseInvoice(ctx) {
        try {
            const { courseId, userId, orgId, appliedOffers } = ctx.request.body;

            // Get course and pricing details
            const course = await strapi.entityService.findOne('api::course.course', courseId, {
                populate: ['subjects', 'publisher']
            });

            if (!course) {
                return ctx.notFound('Course not found');
            }

            // Calculate pricing with offers
            const pricingCalculation = await strapi.controller('api::course-pricing.course-pricing').calculateWithOffers({
                request: { body: { courseId, userId, orgId, offerCodes: appliedOffers } },
                send: (data) => data
            });

            const pricing = pricingCalculation.data;

            // Generate invoice number
            const invoiceNumber = await this.generateInvoiceNumber();

            // Create main invoice
            const invoice = await strapi.entityService.create('api::invoice.invoice', {
                data: {
                    invoice_number: invoiceNumber,
                    invoice_type: orgId ? 'ORG_INVOICE' : 'CONSUMER_INVOICE',
                    invoice_status: 'DRAFT',
                    customer: userId,
                    org: orgId,
                    course: courseId,
                    subtotal: pricing.baseAmount,
                    discount_amount: pricing.totalDiscount,
                    total_amount: pricing.finalAmount,
                    currency: pricing.currency,
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                    billing_address: await this.getBillingAddress(userId, orgId)
                }
            });

            // Create invoice items for each subject
            const invoiceItems = [];

            for (const subject of course.subjects) {
                const subjectPricing = await strapi.entityService.findMany('api::subject-pricing.subject-pricing', {
                    filters: {
                        subject: subject.id,
                        is_active: true
                    }
                });

                if (subjectPricing && subjectPricing.length > 0) {
                    const pricing = subjectPricing[0];

                    // Create subject item
                    const subjectItem = await strapi.entityService.create('api::invoice-item.invoice-item', {
                        data: {
                            invoice: invoice.id,
                            item_type: 'SUBJECT',
                            item_name: subject.name,
                            subject: subject.id,
                            course: courseId,
                            quantity: 1,
                            unit_price: pricing.base_amount,
                            line_total: pricing.base_amount,
                            net_amount: pricing.base_amount,
                            publisher: course.publisher.id,
                            publisher_commission_rate: pricing.publisher_commission_percent,
                            publisher_commission_amount: pricing.base_amount * (pricing.publisher_commission_percent / 100),
                            platform_fee_rate: pricing.platform_commission_percent,
                            platform_fee_amount: pricing.base_amount * (pricing.platform_commission_percent / 100)
                        }
                    });

                    invoiceItems.push(subjectItem);
                }
            }

            // Apply discount items if any
            if (pricing.appliedOffers && pricing.appliedOffers.length > 0) {
                for (const offer of pricing.appliedOffers) {
                    await strapi.entityService.create('api::invoice-item.invoice-item', {
                        data: {
                            invoice: invoice.id,
                            item_type: 'DISCOUNT',
                            item_name: `Discount - ${offer.name}`,
                            quantity: 1,
                            unit_price: -offer.discountAmount,
                            line_total: -offer.discountAmount,
                            net_amount: -offer.discountAmount
                        }
                    });
                }
            }

            // Generate publisher invoice if needed
            let publisherInvoice = null;
            if (course.publisher) {
                publisherInvoice = await this.generatePublisherInvoice(invoice.id, course.publisher.id, invoiceItems);
            }

            // Get complete invoice with items
            const completeInvoice = await strapi.entityService.findOne('api::invoice.invoice', invoice.id, {
                populate: ['invoice_items', 'applied_offers', 'customer', 'course', 'org']
            });

            ctx.send({
                success: true,
                data: {
                    invoice: completeInvoice,
                    publisherInvoice,
                    invoiceItems
                }
            });

        } catch (error) {
            ctx.throw(500, `Failed to generate invoice: ${error.message}`);
        }
    },

    // Generate publisher payout invoice
    async generatePublisherInvoice(parentInvoiceId, publisherId, invoiceItems) {
        const invoiceNumber = await this.generateInvoiceNumber('PUB');

        let totalCommission = 0;
        const publisherItems = [];

        for (const item of invoiceItems) {
            if (item.publisher_commission_amount > 0) {
                totalCommission += item.publisher_commission_amount;

                const publisherItem = await strapi.entityService.create('api::invoice-item.invoice-item', {
                    data: {
                        item_type: 'PUBLISHER_COMMISSION',
                        item_name: `Commission - ${item.item_name}`,
                        subject: item.subject,
                        course: item.course,
                        quantity: 1,
                        unit_price: item.publisher_commission_amount,
                        line_total: item.publisher_commission_amount,
                        net_amount: item.publisher_commission_amount,
                        publisher: publisherId
                    }
                });

                publisherItems.push(publisherItem);
            }
        }

        const publisherInvoice = await strapi.entityService.create('api::invoice.invoice', {
            data: {
                invoice_number: invoiceNumber,
                invoice_type: 'PUBLISHER_INVOICE',
                invoice_status: 'PENDING',
                customer: publisherId,
                subtotal: totalCommission,
                total_amount: totalCommission,
                currency: 'INR',
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days for publisher payout
                parent_invoice: parentInvoiceId
            }
        });

        // Link items to publisher invoice
        for (const item of publisherItems) {
            await strapi.entityService.update('api::invoice-item.invoice-item', item.id, {
                data: { invoice: publisherInvoice.id }
            });
        }

        return publisherInvoice;
    },

    // Process payment and update invoice
    async processPayment(ctx) {
        try {
            const { invoiceId } = ctx.params;
            const { paymentData, paymentGateway, gatewayResponse } = ctx.request.body;

            const invoice = await strapi.entityService.findOne('api::invoice.invoice', invoiceId);

            if (!invoice) {
                return ctx.notFound('Invoice not found');
            }

            // Create payment record
            const payment = await strapi.entityService.create('api::invoice-payment.invoice-payment', {
                data: {
                    invoice: invoiceId,
                    payment_reference: paymentData.transactionId,
                    payment_gateway: paymentGateway,
                    gateway_transaction_id: paymentData.gatewayTransactionId,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    payment_status: paymentData.status,
                    payment_date: new Date(),
                    gateway_response: gatewayResponse,
                    payment_method_details: paymentData.methodDetails
                }
            });

            // Update invoice status based on payment
            let newStatus = 'PENDING';
            if (paymentData.status === 'SUCCESS') {
                const totalPaid = await this.calculateTotalPaid(invoiceId);
                if (totalPaid >= invoice.total_amount) {
                    newStatus = 'PAID';
                } else {
                    newStatus = 'PARTIALLY_PAID';
                }
            } else if (paymentData.status === 'FAILED') {
                newStatus = 'PENDING';
            }

            const updatedInvoice = await strapi.entityService.update('api::invoice.invoice', invoiceId, {
                data: {
                    invoice_status: newStatus,
                    paid_date: paymentData.status === 'SUCCESS' ? new Date() : null
                }
            });

            // If payment successful, activate user subscription
            if (paymentData.status === 'SUCCESS' && newStatus === 'PAID') {
                await this.activateSubscription(invoice);
            }

            ctx.send({
                success: true,
                data: {
                    invoice: updatedInvoice,
                    payment
                }
            });

        } catch (error) {
            ctx.throw(500, `Failed to process payment: ${error.message}`);
        }
    },

    // Helper methods
    async generateInvoiceNumber(prefix = 'INV') {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        const count = await strapi.entityService.count('api::invoice.invoice', {
            filters: {
                invoice_number: { $startsWith: `${prefix}-${year}${month}${day}` }
            }
        });

        const sequence = String(count + 1).padStart(4, '0');
        return `${prefix}-${year}${month}${day}-${sequence}`;
    },

    async getBillingAddress(userId, orgId) {
        if (orgId) {
            const org = await strapi.entityService.findOne('api::org.org', orgId);
            return {
                type: 'organization',
                name: org.name,
                address: org.address,
                city: org.city,
                state: org.state,
                country: org.country,
                pincode: org.pincode
            };
        } else {
            const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId);
            return {
                type: 'individual',
                name: `${user.firstname} ${user.lastname}`,
                email: user.email,
                phone: user.phone
            };
        }
    },

    async calculateTotalPaid(invoiceId) {
        const payments = await strapi.entityService.findMany('api::invoice-payment.invoice-payment', {
            filters: {
                invoice: invoiceId,
                payment_status: 'SUCCESS'
            }
        });

        return payments.reduce((total, payment) => total + parseFloat(payment.amount), 0);
    },

    async activateSubscription(invoice) {
        // Create or update user subscription
        const subscription = await strapi.entityService.create('api::usersubscription.usersubscription', {
            data: {
                user: invoice.customer,
                course: invoice.course,
                org: invoice.org,
                subscription_type: 'PAID',
                status: 'ACTIVE',
                start_date: new Date(),
                end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year access
                pricing: invoice.total_amount
            }
        });

        return subscription;
    }

}));