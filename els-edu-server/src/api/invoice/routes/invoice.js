module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/invoices',
            handler: 'invoice.find',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/invoices/:id',
            handler: 'invoice.findOne',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/invoices',
            handler: 'invoice.create',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/invoices/:id',
            handler: 'invoice.update',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'DELETE',
            path: '/invoices/:id',
            handler: 'invoice.delete',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/invoices/generate-course-invoice',
            handler: 'invoice.generateCourseInvoice',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/invoices/:invoiceId/process-payment',
            handler: 'invoice.processPayment',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};