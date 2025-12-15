module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/pricing-offers',
            handler: 'pricing-offer.find',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/pricing-offers/:id',
            handler: 'pricing-offer.findOne',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/pricing-offers',
            handler: 'pricing-offer.create',
            config: {
                policies: []
            }
        },
        {
            method: 'PUT',
            path: '/pricing-offers/:id',
            handler: 'pricing-offer.update',
            config: {
                policies: []
            }
        },
        {
            method: 'DELETE',
            path: '/pricing-offers/:id',
            handler: 'pricing-offer.delete',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/pricing-offers/applicable',
            handler: 'pricing-offer.getApplicableOffers',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/pricing-offers/calculate-with-offers',
            handler: 'pricing-offer.calculateWithOffers',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/publishers/:publisherId/pricing-offers',
            handler: 'pricing-offer.createPublisherOffer',
            config: {
                policies: []
            }
        }
    ]
};