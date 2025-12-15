module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/invoice-payments',
            handler: 'invoice-payment.find',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/invoice-payments/:id',
            handler: 'invoice-payment.findOne',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/invoice-payments',
            handler: 'invoice-payment.create',
            config: {
                policies: []
            }
        },
        {
            method: 'PUT',
            path: '/invoice-payments/:id',
            handler: 'invoice-payment.update',
            config: {
                policies: []
            }
        },
        {
            method: 'DELETE',
            path: '/invoice-payments/:id',
            handler: 'invoice-payment.delete',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/invoice-payments/process-payment',
            handler: 'invoice-payment.processPayment',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/invoice-payments/:paymentId/confirm',
            handler: 'invoice-payment.confirmPayment',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/invoice-payments/webhook/:gateway',
            handler: 'invoice-payment.handleWebhook',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/invoices/:invoiceId/payment-history',
            handler: 'invoice-payment.getPaymentHistory',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/invoice-payments/:paymentId/refund',
            handler: 'invoice-payment.initiateRefund',
            config: {
                policies: []
            }
        }
    ]
};