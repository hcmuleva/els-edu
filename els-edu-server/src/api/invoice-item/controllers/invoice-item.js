'use strict';

/**
 * invoice-item controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::invoice-item.invoice-item', ({ strapi }) => ({

    // Get items for an invoice
    async getByInvoice(ctx) {
        try {
            const { invoiceId } = ctx.params;

            const items = await strapi.entityService.findMany('api::invoice-item.invoice-item', {
                filters: {
                    invoice: invoiceId
                },
                populate: ['course', 'subject', 'applied_offers'],
                sort: { createdAt: 'asc' }
            });

            ctx.send({
                success: true,
                data: items
            });

        } catch (error) {
            ctx.throw(500, `Failed to get invoice items: ${error.message}`);
        }
    },

    // Create invoice items from course/subjects
    async createFromCourse(ctx) {
        try {
            const { invoiceId, courseId, subjectIds = [], appliedOffers = [] } = ctx.request.body;

            const course = await strapi.entityService.findOne('api::course.course', courseId, {
                populate: ['subjects']
            });

            if (!course) {
                return ctx.notFound('Course not found');
            }

            // Get course pricing
            const coursePricing = await strapi.entityService.findMany('api::course-pricing.course-pricing', {
                filters: {
                    course: courseId,
                    is_active: true
                }
            });

            const items = [];

            if (coursePricing.length > 0 && coursePricing[0].pricing_type === 'COURSE_BUNDLE') {
                // Create single item for entire course
                const item = await strapi.entityService.create('api::invoice-item.invoice-item', {
                    data: {
                        invoice: invoiceId,
                        item_type: 'COURSE',
                        course: courseId,
                        name: course.title,
                        description: `Complete ${course.title} course bundle`,
                        quantity: 1,
                        unit_price: coursePricing[0].total_amount,
                        subtotal: coursePricing[0].total_amount,
                        applied_offers: appliedOffers
                    }
                });
                items.push(item);

            } else {
                // Create individual items for each subject
                for (const subjectId of subjectIds) {
                    const subject = course.subjects.find(s => s.id.toString() === subjectId.toString());
                    if (!subject) continue;

                    // Get subject pricing
                    const subjectPricing = await strapi.entityService.findMany('api::subject-pricing.subject-pricing', {
                        filters: {
                            subject: subjectId,
                            is_active: true
                        }
                    });

                    if (subjectPricing.length > 0) {
                        const pricing = subjectPricing[0];
                        const finalAmount = Math.round(
                            pricing.base_amount *
                            pricing.complexity_multiplier *
                            pricing.content_count_multiplier
                        );

                        const item = await strapi.entityService.create('api::invoice-item.invoice-item', {
                            data: {
                                invoice: invoiceId,
                                item_type: 'SUBJECT',
                                subject: subjectId,
                                course: courseId,
                                name: subject.name,
                                description: `${subject.name} - Individual subject access`,
                                quantity: 1,
                                unit_price: finalAmount,
                                subtotal: finalAmount
                            }
                        });
                        items.push(item);
                    }
                }
            }

            ctx.send({
                success: true,
                data: items
            });

        } catch (error) {
            ctx.throw(500, `Failed to create invoice items: ${error.message}`);
        }
    },

    // Update item quantities or pricing
    async updateItem(ctx) {
        try {
            const { id } = ctx.params;
            const { quantity, customPrice } = ctx.request.body;

            const item = await strapi.entityService.findOne('api::invoice-item.invoice-item', id);
            if (!item) {
                return ctx.notFound('Invoice item not found');
            }

            const updateData = {};

            if (quantity !== undefined) {
                updateData.quantity = quantity;
                updateData.subtotal = (customPrice || item.unit_price) * quantity;
            }

            if (customPrice !== undefined) {
                updateData.unit_price = customPrice;
                updateData.subtotal = customPrice * (quantity || item.quantity);
                updateData.has_custom_pricing = true;
            }

            const updatedItem = await strapi.entityService.update('api::invoice-item.invoice-item', id, {
                data: updateData
            });

            // Recalculate invoice total
            await this.recalculateInvoiceTotal(item.invoice);

            ctx.send({
                success: true,
                data: updatedItem
            });

        } catch (error) {
            ctx.throw(500, `Failed to update invoice item: ${error.message}`);
        }
    },

    // Apply offer to specific item
    async applyOfferToItem(ctx) {
        try {
            const { itemId, offerId } = ctx.params;

            const item = await strapi.entityService.findOne('api::invoice-item.invoice-item', itemId);
            const offer = await strapi.entityService.findOne('api::pricing-offer.pricing-offer', offerId);

            if (!item || !offer) {
                return ctx.notFound('Item or offer not found');
            }

            // Calculate discount
            const discount = this.calculateItemDiscount(item, offer);
            const newSubtotal = Math.max(0, item.subtotal - discount);

            const updatedItem = await strapi.entityService.update('api::invoice-item.invoice-item', itemId, {
                data: {
                    applied_offers: [...(item.applied_offers || []), offerId],
                    discount_amount: (item.discount_amount || 0) + discount,
                    subtotal: newSubtotal
                }
            });

            // Recalculate invoice total
            await this.recalculateInvoiceTotal(item.invoice);

            ctx.send({
                success: true,
                data: updatedItem
            });

        } catch (error) {
            ctx.throw(500, `Failed to apply offer to item: ${error.message}`);
        }
    },

    // Helper methods
    calculateItemDiscount(item, offer) {
        switch (offer.discount_type) {
            case 'PERCENTAGE':
                return Math.round(item.subtotal * (offer.discount_value / 100));

            case 'FIXED_AMOUNT':
                return Math.min(offer.discount_value, item.subtotal);

            case 'BUY_X_GET_Y':
                if (item.quantity >= offer.buy_quantity) {
                    const freeQuantity = Math.floor(item.quantity / offer.buy_quantity) * offer.get_quantity;
                    return Math.round((item.unit_price * freeQuantity));
                }
                return 0;

            default:
                return 0;
        }
    },

    async recalculateInvoiceTotal(invoiceId) {
        const items = await strapi.entityService.findMany('api::invoice-item.invoice-item', {
            filters: { invoice: invoiceId }
        });

        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const totalDiscount = items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);

        await strapi.entityService.update('api::invoice.invoice', invoiceId, {
            data: {
                subtotal,
                total_discount: totalDiscount,
                final_amount: subtotal - totalDiscount
            }
        });
    }

}));