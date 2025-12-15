'use strict';

/**
 * pricing-offer controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::pricing-offer.pricing-offer', ({ strapi }) => ({

    // Custom create method to handle relationships properly
    async create(ctx) {
        try {
            const { data } = ctx.request.body;
            
            // Validate required fields
            if (!data.name || !data.offer_type || !data.discount_type || !data.discount_value) {
                return ctx.badRequest('Missing required fields: name, offer_type, discount_type, or discount_value');
            }

            // Validate dates
            if (!data.start_date || !data.end_date) {
                return ctx.badRequest('Missing required fields: start_date or end_date');
            }

            // Validate created_by user exists
            if (data.created_by) {
                const user = await strapi.entityService.findOne('plugin::users-permissions.user', data.created_by);
                if (!user) {
                    return ctx.notFound(`User not found with ID: ${data.created_by}`);
                }
            }

            // Handle target_courses relationship if provided
            if (data.target_courses && Array.isArray(data.target_courses)) {
                // Validate that all course IDs exist
                for (const courseId of data.target_courses) {
                    const course = await strapi.entityService.findOne('api::course.course', courseId);
                    if (!course) {
                        return ctx.notFound(`Course not found with ID: ${courseId}`);
                    }
                }
            }

            // Handle target_subjects relationship if provided
            if (data.target_subjects && Array.isArray(data.target_subjects)) {
                // Validate that all subject IDs exist
                for (const subjectId of data.target_subjects) {
                    const subject = await strapi.entityService.findOne('api::subject.subject', subjectId);
                    if (!subject) {
                        return ctx.notFound(`Subject not found with ID: ${subjectId}`);
                    }
                }
            }

            // Create the offer
            const entity = await strapi.entityService.create('api::pricing-offer.pricing-offer', {
                data: {
                    ...data,
                    publishedAt: new Date()
                }
            });

            return ctx.send({
                data: entity,
                success: true,
                message: 'Pricing offer created successfully'
            });

        } catch (error) {
            console.error('Pricing offer creation error:', error);
            return ctx.internalServerError('Failed to create pricing offer: ' + error.message);
        }
    },

    // Get applicable offers for a course/subject
    async getApplicableOffers(ctx) {
        try {
            const {
                courseId,
                subjectIds = [],
                userId,
                organizationId,
                totalAmount = 0
            } = ctx.query;

            // Build base filters
            let filters = {
                is_active: true,
                $or: [
                    {
                        start_date: { $null: true }
                    },
                    {
                        start_date: { $lte: new Date() }
                    }
                ],
                $and: [
                    {
                        $or: [
                            {
                                end_date: { $null: true }
                            },
                            {
                                end_date: { $gte: new Date() }
                            }
                        ]
                    }
                ]
            };

            // Add course/subject filters
            if (courseId) {
                filters.$or = [
                    { courses: courseId },
                    { subjects: { $in: subjectIds } },
                    { offer_type: 'SPECIAL_OFFER' } // Global offers
                ];
            }

            // Add user/org specific filters
            if (organizationId) {
                filters.organization = organizationId;
            }

            // Find all applicable offers
            const offers = await strapi.entityService.findMany('api::pricing-offer.pricing-offer', {
                filters,
                populate: ['courses', 'subjects', 'publisher', 'organization'],
                sort: { priority: 'asc' } // Higher priority (lower number) first
            });

            // Filter offers based on conditions and usage
            const applicableOffers = [];

            for (const offer of offers) {
                // Check minimum amount
                if (offer.minimum_amount && totalAmount < offer.minimum_amount) {
                    continue;
                }

                // Check usage limit
                if (offer.usage_limit) {
                    const usageCount = await this.getOfferUsageCount(offer.id, userId, organizationId);
                    if (usageCount >= offer.usage_limit) {
                        continue;
                    }
                }

                // Check if user can use this offer
                const canUse = await this.canUserUseOffer(offer, userId, organizationId);
                if (!canUse) {
                    continue;
                }

                applicableOffers.push({
                    ...offer,
                    calculatedDiscount: this.calculateOfferDiscount(offer, totalAmount, subjectIds.length)
                });
            }

            ctx.send({
                success: true,
                data: applicableOffers
            });

        } catch (error) {
            ctx.throw(500, `Failed to get applicable offers: ${error.message}`);
        }
    },

    // Apply offers to calculate final amount
    async calculateWithOffers(ctx) {
        try {
            const {
                courseId,
                subjectIds = [],
                userId,
                organizationId,
                baseAmount,
                offerIds = []
            } = ctx.request.body;

            let currentAmount = baseAmount;
            const appliedOffers = [];
            let totalDiscount = 0;

            // Get offers ordered by priority
            const offers = await strapi.entityService.findMany('api::pricing-offer.pricing-offer', {
                filters: {
                    id: { $in: offerIds },
                    is_active: true
                },
                sort: { priority: 'asc' }
            });

            // Apply stackable offers in order
            for (const offer of offers) {
                const canApply = await strapi.controller('api::course-pricing.course-pricing').canApplyOffer(
                    offer,
                    courseId,
                    subjectIds,
                    userId,
                    organizationId,
                    currentAmount
                );

                if (canApply.canApply) {
                    const discount = this.calculateOfferDiscount(offer, currentAmount, subjectIds.length);

                    if (offer.can_stack || appliedOffers.length === 0) {
                        appliedOffers.push({
                            ...offer,
                            discount
                        });
                        currentAmount = Math.max(0, currentAmount - discount);
                        totalDiscount += discount;
                    }
                }
            }

            ctx.send({
                success: true,
                data: {
                    baseAmount,
                    finalAmount: currentAmount,
                    totalDiscount,
                    appliedOffers,
                    savings: totalDiscount
                }
            });

        } catch (error) {
            ctx.throw(500, `Failed to calculate with offers: ${error.message}`);
        }
    },

    // Create publisher offer
    async createPublisherOffer(ctx) {
        try {
            const { publisherId } = ctx.params;
            const offerData = ctx.request.body;

            const offer = await strapi.entityService.create('api::pricing-offer.pricing-offer', {
                data: {
                    ...offerData,
                    offer_type: 'PUBLISHER_OFFER',
                    publisher: publisherId,
                    created_by: ctx.state.user.id
                }
            });

            ctx.send({
                success: true,
                data: offer
            });

        } catch (error) {
            ctx.throw(500, `Failed to create publisher offer: ${error.message}`);
        }
    },

    // Helper methods
    calculateOfferDiscount(offer, amount, itemCount = 1) {
        switch (offer.discount_type) {
            case 'PERCENTAGE':
                return Math.round(amount * (offer.discount_value / 100));

            case 'FIXED_AMOUNT':
                return Math.min(offer.discount_value, amount);

            case 'BUY_X_GET_Y':
                const freeItems = Math.floor(itemCount / offer.buy_quantity) * offer.get_quantity;
                const pricePerItem = amount / itemCount;
                return Math.round(freeItems * pricePerItem);

            default:
                return 0;
        }
    },

    async canUserUseOffer(offer, userId, organizationId) {
        // Check offer type specific conditions
        switch (offer.offer_type) {
            case 'PUBLISHER_OFFER':
                // Publisher offers are generally available
                return true;

            case 'ORG_LEVEL_OFFER':
                // Must have matching organization
                return offer.organization && offer.organization.toString() === organizationId;

            case 'SPECIAL_OFFER':
                // Special offers might have specific user conditions
                if (offer.eligible_users && offer.eligible_users.length > 0) {
                    return offer.eligible_users.includes(userId);
                }
                return true;

            default:
                return false;
        }
    },

    async getOfferUsageCount(offerId, userId, organizationId) {
        // Count how many times this offer has been used
        const invoices = await strapi.entityService.findMany('api::invoice.invoice', {
            filters: {
                user: userId,
                applied_offers: offerId,
                status: { $in: ['PAID', 'PARTIALLY_PAID'] }
            }
        });

        return invoices.length;
    }

}));