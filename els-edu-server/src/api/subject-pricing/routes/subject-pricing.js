module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/subject-pricings',
            handler: 'subject-pricing.find',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/subject-pricings/:id',
            handler: 'subject-pricing.findOne',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/subject-pricings',
            handler: 'subject-pricing.create',
            config: {
                policies: []
            }
        },
        {
            method: 'PUT',
            path: '/subject-pricings/:id',
            handler: 'subject-pricing.update',
            config: {
                policies: []
            }
        },
        {
            method: 'DELETE',
            path: '/subject-pricings/:id',
            handler: 'subject-pricing.delete',
            config: {
                policies: []
            }
        },
        {
            method: 'PUT',
            path: '/courses/:courseId/subject-pricings/bulk-update',
            handler: 'subject-pricing.bulkUpdateForCourse',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/subjects/:subjectId/pricing/auto-calculate',
            handler: 'subject-pricing.autoCalculatePricing',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/publishers/:publisherId/subject-pricings',
            handler: 'subject-pricing.getByPublisher',
            config: {
                policies: []
            }
        }
    ]
};