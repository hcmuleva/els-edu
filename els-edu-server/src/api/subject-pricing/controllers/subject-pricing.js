'use strict';

/**
 * subject-pricing controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::subject-pricing.subject-pricing', ({ strapi }) => ({

    // Bulk create/update subject pricing for a course
    async bulkUpdateForCourse(ctx) {
        try {
            const { courseId } = ctx.params;
            const { subjectPricings, publisherId } = ctx.request.body;

            // Validate input
            if (!subjectPricings || !Array.isArray(subjectPricings) || subjectPricings.length === 0) {
                return ctx.badRequest('Invalid subject pricing data');
            }

            // Check if course exists - try by documentId first, then by numeric ID
            let course;
            try {
                // First try finding by documentId
                const courses = await strapi.entityService.findMany('api::course.course', {
                    filters: { documentId: courseId },
                    populate: ['subjects']
                });

                if (courses.length > 0) {
                    course = courses[0];
                } else {
                    // Try by numeric ID as fallback
                    course = await strapi.entityService.findOne('api::course.course', courseId, {
                        populate: ['subjects']
                    });
                }
            } catch (error) {
                console.error('Error finding course:', error);
                return ctx.notFound('Course not found');
            }

            if (!course) {
                return ctx.notFound('Course not found');
            }

            const results = [];

            for (const subjectPricingData of subjectPricings) {
                try {
                    const { subjectId, baseAmount, publisherCommissionPercent, complexityMultiplier, contentCountMultiplier } = subjectPricingData;

                    // Check if subject exists - try by documentId first, then by numeric ID
                    let subject;
                    try {
                        // First try finding by documentId
                        const subjects = await strapi.entityService.findMany('api::subject.subject', {
                            filters: { documentId: subjectId }
                        });

                        if (subjects.length > 0) {
                            subject = subjects[0];
                        } else {
                            // Try by numeric ID as fallback
                            subject = await strapi.entityService.findOne('api::subject.subject', subjectId);
                        }
                    } catch (error) {
                        console.warn(`Subject ${subjectId} not found, skipping:`, error.message);
                        continue;
                    }

                    if (!subject) {
                        console.warn(`Subject ${subjectId} not found, skipping`);
                        continue;
                    }

                    // Check if pricing already exists
                    let existingPricing = [];
                    try {
                        existingPricing = await strapi.entityService.findMany('api::subject-pricing.subject-pricing', {
                            filters: {
                                subject: subjectId,
                                publisher: publisherId,
                                is_active: true
                            }
                        });
                    } catch (error) {
                        console.warn('Error checking existing pricing, will create new:', error.message);
                    }

                    let pricing;
                    const pricingData = {
                        base_amount: baseAmount,
                        publisher_commission_percent: publisherCommissionPercent || 70,
                        platform_commission_percent: 100 - (publisherCommissionPercent || 70),
                        complexity_multiplier: complexityMultiplier || 1.0,
                        content_count_multiplier: contentCountMultiplier || 1.0,
                        is_active: true
                    };

                    if (existingPricing.length > 0) {
                        // Update existing pricing
                        pricing = await strapi.entityService.update('api::subject-pricing.subject-pricing', existingPricing[0].id, {
                            data: pricingData
                        });
                    } else {
                        // Create new pricing
                        pricing = await strapi.entityService.create('api::subject-pricing.subject-pricing', {
                            data: {
                                name: `${subject.name} - Pricing`,
                                subject: subjectId,
                                publisher: publisherId,
                                ...pricingData
                            }
                        });
                    }

                    results.push(pricing);
                } catch (itemError) {
                    console.error(`Error processing pricing for subject ${subjectPricingData.subjectId}:`, itemError);
                    // Continue with other items instead of failing entirely
                }
            }

            // Skip course total recalculation for now to avoid additional errors
            // TODO: Implement after course-pricing collection is properly set up

            ctx.send({
                success: true,
                data: results,
                message: `Successfully processed ${results.length} subject pricing records`
            });

        } catch (error) {
            console.error('Bulk update error:', error);
            ctx.throw(500, `Failed to update subject pricing: ${error.message}`);
        }
    },

    // Auto-calculate subject pricing based on content
    async autoCalculatePricing(ctx) {
        try {
            const { subjectId } = ctx.params;
            const { basePricePerTopic = 100, basePricePerQuiz = 50 } = ctx.request.body;

            const subject = await strapi.entityService.findOne('api::subject.subject', subjectId, {
                populate: ['topics', 'quizzes']
            });

            if (!subject) {
                return ctx.notFound('Subject not found');
            }

            const topicCount = subject.topics ? subject.topics.length : 0;
            const quizCount = subject.quizzes ? subject.quizzes.length : 0;

            // Calculate base amount
            const baseAmount = (topicCount * basePricePerTopic) + (quizCount * basePricePerQuiz);

            // Apply complexity multiplier based on grade level
            let complexityMultiplier = 1.0;
            if (subject.grade) {
                const gradeMultipliers = {
                    'PLAYSCHOOL': 0.8, 'LKG': 0.8, 'UKG': 0.9,
                    'FIRST': 1.0, 'SECOND': 1.0, 'THIRD': 1.1, 'FOURTH': 1.1, 'FIFTH': 1.2,
                    'SIXTH': 1.3, 'SEVENTH': 1.4, 'EIGHTH': 1.5, 'NINTH': 1.6, 'TENTH': 1.7,
                    'ELEVENTH': 1.8, 'TWELFTH': 1.9,
                    'DIPLOMA': 2.0, 'GRADUATION': 2.2, 'POSTGRADUATION': 2.5, 'PHD': 3.0
                };
                complexityMultiplier = gradeMultipliers[subject.grade] || 1.0;
            }

            const finalAmount = Math.round(baseAmount * complexityMultiplier);

            ctx.send({
                success: true,
                data: {
                    subjectId: subject.id,
                    subjectName: subject.name,
                    topicCount,
                    quizCount,
                    basePricePerTopic,
                    basePricePerQuiz,
                    baseAmount,
                    complexityMultiplier,
                    finalAmount,
                    calculation: {
                        topicsTotal: topicCount * basePricePerTopic,
                        quizzesTotal: quizCount * basePricePerQuiz,
                        complexityAdjustment: (finalAmount - baseAmount)
                    }
                }
            });

        } catch (error) {
            ctx.throw(500, `Failed to calculate subject pricing: ${error.message}`);
        }
    },

    // Get pricing by publisher
    async getByPublisher(ctx) {
        try {
            const { publisherId } = ctx.params;
            const { page = 1, pageSize = 25 } = ctx.query;

            const pricings = await strapi.entityService.findMany('api::subject-pricing.subject-pricing', {
                filters: {
                    publisher: publisherId,
                    is_active: true
                },
                populate: ['subject', 'course_pricing'],
                start: (page - 1) * pageSize,
                limit: pageSize,
                sort: { createdAt: 'desc' }
            });

            const total = await strapi.entityService.count('api::subject-pricing.subject-pricing', {
                filters: {
                    publisher: publisherId,
                    is_active: true
                }
            });

            ctx.send({
                success: true,
                data: pricings,
                meta: {
                    pagination: {
                        page,
                        pageSize,
                        total,
                        pageCount: Math.ceil(total / pageSize)
                    }
                }
            });

        } catch (error) {
            ctx.throw(500, `Failed to get publisher pricing: ${error.message}`);
        }
    }

}));