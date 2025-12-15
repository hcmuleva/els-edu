'use strict';

/**
 * course-pricing controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::course-pricing.course-pricing', ({ strapi }) => ({

    // Custom create method to handle relationships properly
    async create(ctx) {
        try {
            const { data } = ctx.request.body;
            
            // Validate required fields
            if (!data.name || !data.course || !data.base_amount) {
                return ctx.badRequest('Missing required fields: name, course, or base_amount');
            }

            // Find the course by documentId (Strapi v5 format)
            const courses = await strapi.entityService.findMany('api::course.course', {
                filters: {
                    documentId: data.course
                }
            });
            
            if (!courses || courses.length === 0) {
                return ctx.notFound(`Course not found with documentId: ${data.course}`);
            }
            const course = courses[0];

            // Find the publisher/user by ID
            const publisher = await strapi.entityService.findOne('plugin::users-permissions.user', data.publisher);
            if (!publisher) {
                return ctx.notFound(`Publisher not found with ID: ${data.publisher}`);
            }

            // Check if course pricing already exists for this course
            const existingPricing = await strapi.entityService.findMany('api::course-pricing.course-pricing', {
                filters: {
                    course: course.id,
                    is_active: true
                }
            });

            // Prepare the data with proper IDs
            const pricingData = {
                ...data,
                course: course.id, // Use the integer ID for the relationship
                publisher: data.publisher // Keep the publisher ID as is
            };

            // If exists, update it instead of creating new
            if (existingPricing && existingPricing.length > 0) {
                const updated = await strapi.entityService.update('api::course-pricing.course-pricing', existingPricing[0].id, {
                    data: pricingData
                });
                
                return ctx.send({
                    data: updated,
                    success: true,
                    message: 'Course pricing updated successfully'
                });
            }

            // Create new course pricing
            const entity = await strapi.entityService.create('api::course-pricing.course-pricing', {
                data: {
                    ...pricingData,
                    publishedAt: new Date()
                }
            });

            return ctx.send({
                data: entity,
                success: true,
                message: 'Course pricing created successfully'
            });

        } catch (error) {
            console.error('Course pricing creation error:', error);
            return ctx.internalServerError('Failed to create course pricing: ' + error.message);
        }
    },

    // Calculate course pricing based on subjects
    async calculateCourseTotal(ctx) {
        try {
            const { courseId } = ctx.params;

            const course = await strapi.entityService.findOne('api::course.course', courseId, {
                populate: ['subjects', 'subjects.subject_pricing']
            });

            if (!course) {
                return ctx.notFound('Course not found');
            }

            let totalAmount = 0;
            const subjectBreakdown = [];

            for (const subject of course.subjects) {
                const subjectPricing = await strapi.entityService.findMany('api::subject-pricing.subject-pricing', {
                    filters: {
                        subject: subject.id,
                        is_active: true
                    }
                });

                if (subjectPricing && subjectPricing.length > 0) {
                    const pricing = subjectPricing[0];
                    totalAmount += parseFloat(pricing.base_amount);
                    subjectBreakdown.push({
                        subject: subject.name,
                        subjectId: subject.id,
                        amount: pricing.base_amount,
                        currency: pricing.currency
                    });
                }
            }

            // Update or create course pricing
            const existingPricing = await strapi.entityService.findMany('api::course-pricing.course-pricing', {
                filters: {
                    course: courseId,
                    is_active: true
                }
            });

            let coursePricing;
            if (existingPricing.length > 0) {
                coursePricing = await strapi.entityService.update('api::course-pricing.course-pricing', existingPricing[0].id, {
                    data: {
                        calculated_total: totalAmount,
                        final_amount: totalAmount * (1 - existingPricing[0].discount_percent / 100)
                    }
                });
            } else {
                coursePricing = await strapi.entityService.create('api::course-pricing.course-pricing', {
                    data: {
                        name: `${course.name} - Pricing`,
                        course: courseId,
                        calculated_total: totalAmount,
                        final_amount: totalAmount,
                        currency: 'INR',
                        is_active: true,
                        auto_calculate_from_subjects: true
                    }
                });
            }

            ctx.send({
                success: true,
                data: {
                    coursePricing,
                    subjectBreakdown,
                    totalAmount,
                    currency: 'INR'
                }
            });

        } catch (error) {
            ctx.throw(500, `Failed to calculate course pricing: ${error.message}`);
        }
    },

    // Apply offers and calculate final pricing
    async calculateWithOffers(ctx) {
        try {
            const { courseId, userId, orgId, offerCodes } = ctx.request.body;

            // Get course pricing
            const coursePricing = await strapi.entityService.findMany('api::course-pricing.course-pricing', {
                filters: {
                    course: courseId,
                    is_active: true
                },
                populate: ['course', 'subject_pricings']
            });

            if (!coursePricing || coursePricing.length === 0) {
                return ctx.notFound('Course pricing not found');
            }

            const pricing = coursePricing[0];
            let baseAmount = pricing.calculated_total || pricing.base_amount;

            // Get applicable offers
            const currentDate = new Date();
            const offerFilters = {
                is_active: true,
                start_date: { $lte: currentDate },
                end_date: { $gte: currentDate },
                $or: [
                    { applicable_to: 'ALL_COURSES' },
                    { target_courses: courseId }
                ]
            };

            if (orgId) {
                offerFilters.$or.push({ target_orgs: orgId });
            }

            const availableOffers = await strapi.entityService.findMany('api::pricing-offer.pricing-offer', {
                filters: offerFilters,
                sort: { priority: 'desc' }
            });

            // Apply offers based on priority and stackability
            let totalDiscount = 0;
            let appliedOffers = [];

            for (const offer of availableOffers) {
                // Check if offer can be applied
                const canApply = await this.canApplyOffer(offer, userId, baseAmount);

                if (canApply) {
                    let discountAmount = 0;

                    if (offer.discount_type === 'PERCENTAGE') {
                        discountAmount = baseAmount * (offer.discount_value / 100);
                    } else if (offer.discount_type === 'FIXED_AMOUNT') {
                        discountAmount = offer.discount_value;
                    }

                    totalDiscount += discountAmount;
                    appliedOffers.push({
                        offerId: offer.id,
                        name: offer.name,
                        type: offer.discount_type,
                        value: offer.discount_value,
                        discountAmount
                    });

                    // If not stackable, break after first offer
                    if (!offer.stackable) {
                        break;
                    }

                    // Update base amount for next calculation if stackable
                    if (offer.stackable) {
                        baseAmount -= discountAmount;
                    }
                }
            }

            const finalAmount = Math.max(0, (pricing.calculated_total || pricing.base_amount) - totalDiscount);

            ctx.send({
                success: true,
                data: {
                    baseAmount: pricing.calculated_total || pricing.base_amount,
                    totalDiscount,
                    finalAmount,
                    appliedOffers,
                    currency: pricing.currency
                }
            });

        } catch (error) {
            ctx.throw(500, `Failed to calculate pricing with offers: ${error.message}`);
        }
    },

    // Helper method to check if offer can be applied
    async canApplyOffer(offer, userId, purchaseAmount) {
        // Check minimum purchase amount
        if (offer.min_purchase_amount && purchaseAmount < offer.min_purchase_amount) {
            return false;
        }

        // Check usage limits
        if (offer.total_usage_limit && offer.current_usage_count >= offer.total_usage_limit) {
            return false;
        }

        // Check per-user usage limit
        if (userId && offer.max_usage_per_user) {
            const userUsage = await strapi.entityService.count('api::invoice.invoice', {
                filters: {
                    customer: userId,
                    applied_offers: offer.id,
                    invoice_status: { $in: ['PAID', 'PARTIALLY_PAID'] }
                }
            });

            if (userUsage >= offer.max_usage_per_user) {
                return false;
            }
        }

        return true;
    }

}));