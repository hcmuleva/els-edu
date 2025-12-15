module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/course-pricings',
            handler: 'course-pricing.find',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/course-pricings/:id',
            handler: 'course-pricing.findOne',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/course-pricings',
            handler: 'course-pricing.create',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/course-pricings/:id',
            handler: 'course-pricing.update',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'DELETE',
            path: '/course-pricings/:id',
            handler: 'course-pricing.delete',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/course-pricings/:courseId/calculate',
            handler: 'course-pricing.calculateCourseTotal',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/course-pricings/calculate-with-offers',
            handler: 'course-pricing.calculateWithOffers',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};