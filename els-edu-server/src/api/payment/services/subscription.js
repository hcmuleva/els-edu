"use strict";

const { publishToAbly } = require("../../../../config/ably");

module.exports = ({ strapi }) => ({
  /**
   * Check if user has an active subscription for a Course or Subject
   */
  async hasActiveSubscription(userDocumentId, pricing, purchaseType) {
    try {
      const filters = {
        user: { documentId: userDocumentId },
        paymentstatus: "ACTIVE",
      };

      // Check based on purchase type
      if (purchaseType === "COURSE") {
        const courseId =
          pricing.course?.documentId || pricing.course?.id || pricing.course;
        if (!courseId) {
          strapi.log.warn(
            `[hasActiveSubscription] No course ID found in pricing`
          );
          return false;
        }
        filters.course = { documentId: courseId };
      } else if (purchaseType === "SUBJECT") {
        const subjectId =
          pricing.subject?.documentId || pricing.subject?.id || pricing.subject;
        if (!subjectId) {
          strapi.log.warn(
            `[hasActiveSubscription] No subject ID found in pricing`
          );
          return false;
        }
        // Check if user already has this subject in any active subscription
        filters.subjects = { documentId: subjectId };
      }

      const existingSubscriptions = await strapi
        .documents("api::usersubscription.usersubscription")
        .findMany({
          filters,
        });

      return existingSubscriptions && existingSubscriptions.length > 0;
    } catch (error) {
      strapi.log.error("Error checking active subscription:", error);
      throw error;
    }
  },

  /**
   * Create a user subscription after successful payment
   */
  async createSubscription({
    user,
    pricing,
    invoice,
    type,
    cashfreeOrderId,
    transactionId,
    paymentMethod,
    org,
  }) {
    try {
      const userDocId = user.documentId || user.id || user;

      // IDEMPOTENCY CHECK:
      // Check if a subscription already exists for this transaction or order
      // likely to happen if webhook fires multiple times
      if (cashfreeOrderId || transactionId) {
        const filters = {
          $or: [],
        };
        if (cashfreeOrderId)
          filters.$or.push({ cashfree_order_id: cashfreeOrderId });
        if (transactionId) filters.$or.push({ transactionid: transactionId });

        if (filters.$or.length > 0) {
          const existingSub = await strapi
            .documents("api::usersubscription.usersubscription")
            .findFirst({
              filters: filters,
              populate: ["course", "subjects"],
            });

          if (existingSub) {
            strapi.log.info(
              `[createSubscription] Idempotency hit: Subscription ${existingSub.documentId} already exists for Order ${cashfreeOrderId}`
            );
            return existingSub;
          }
        }
      }

      const courseId =
        pricing.course?.documentId || pricing.course?.id || pricing.course;
      const subjectId =
        pricing.subject?.documentId || pricing.subject?.id || pricing.subject;
      const orgId = org?.documentId || org?.id || org;

      // Calculate dates (1 year from now as default)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      // Determine subscription type based on amount
      const amount = parseFloat(pricing.amount || 0);
      const subscriptionType = amount === 0 ? "FREE" : "PAID";

      // Prepare subscription data
      const subscriptionData = {
        user: userDocId,
        org: orgId,
        transactionid: transactionId,
        paymentstatus: "ACTIVE",
        subscription_type: subscriptionType,
        startdate: startDate,
        enddate: endDate,
        last_payment_at: new Date(),
        next_billing_date: endDate, // For one-time purchases, this is the end date
        auto_renew: false,
        cashfree_order_id: cashfreeOrderId,
        payment_method: paymentMethod,
        amount_paid: amount,
      };

      if (type === "COURSE") {
        // Course purchase
        subscriptionData.course = courseId;
        subscriptionData.course_pricing = pricing.documentId || null;

        // Get all subjects in the course
        const course = await strapi.documents("api::course.course").findOne({
          documentId: courseId,
          populate: ["subjects"],
        });

        const subjectIds =
          course?.subjects?.map((s) => s.documentId || s.id || s) || [];

        strapi.log.info(
          `[createSubscription] Creating COURSE subscription with ${subjectIds.length} subjects`
        );

        // Add subjects to subscription data for manyToMany connection
        if (subjectIds.length > 0) {
          subscriptionData.subjects = subjectIds;
        }

        // Create subscription for the course with subjects connected
        const subscription = await strapi
          .documents("api::usersubscription.usersubscription")
          .create({
            data: subscriptionData,
            status: "published",
          });

        strapi.log.info(
          `[createSubscription] Created COURSE subscription: ${subscription.documentId} with ${subjectIds.length} subjects`
        );
        return subscription;
      } else if (type === "SUBJECT") {
        // Subject purchase
        subscriptionData.subject_pricing = pricing.documentId || null;

        // Add the subject to subscription data for manyToMany connection
        if (subjectId) {
          subscriptionData.subjects = [subjectId];
        }

        // Create new subscription for this subject
        const subscription = await strapi
          .documents("api::usersubscription.usersubscription")
          .create({
            data: subscriptionData,
            status: "published",
          });

        strapi.log.info(
          `[createSubscription] Created SUBJECT subscription: ${subscription.documentId} with subject ${subjectId}`
        );
        return subscription;
      }

      throw new Error(`Unknown subscription type: ${type}`);
    } catch (error) {
      strapi.log.error("Error creating subscription:", error);
      throw error;
    }
  },
});
