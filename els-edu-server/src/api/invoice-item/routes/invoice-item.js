module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/invoice-items',
            handler: 'invoice-item.find',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/invoice-items/:id',
            handler: 'invoice-item.findOne',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/invoice-items',
            handler: 'invoice-item.create',
            config: {
                policies: []
            }
        },
        {
            method: 'PUT',
            path: '/invoice-items/:id',
            handler: 'invoice-item.update',
            config: {
                policies: []
            }
        },
        {
            method: 'DELETE',
            path: '/invoice-items/:id',
            handler: 'invoice-item.delete',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/invoices/:invoiceId/items',
            handler: 'invoice-item.getByInvoice',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/invoice-items/create-from-course',
            handler: 'invoice-item.createFromCourse',
            config: {
                policies: []
            }
        },
        {
            method: 'PUT',
            path: '/invoice-items/:id/update-item',
            handler: 'invoice-item.updateItem',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/invoice-items/:itemId/apply-offer/:offerId',
            handler: 'invoice-item.applyOfferToItem',
            config: {
                policies: []
            }
        }
    ]
};