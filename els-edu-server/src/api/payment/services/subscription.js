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
   * ✅ Implements double-check idempotency to prevent duplicates
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
    const debugId = `SUB-${Date.now()}`;
    strapi.log.info(
      `[DEBUG-SUBSCRIPTION] ========== CREATE SUBSCRIPTION START ==========`
    );

    try {
      const userDocId = user.documentId || user.id || user;

      strapi.log.info(`[DEBUG-SUBSCRIPTION] Creating subscription with:`);
      strapi.log.info(`[DEBUG-SUBSCRIPTION]   User: ${userDocId}`);
      strapi.log.info(`[DEBUG-SUBSCRIPTION]   Order ID: ${cashfreeOrderId}`);
      strapi.log.info(
        `[DEBUG-SUBSCRIPTION]   Transaction ID: ${transactionId}`
      );
      strapi.log.info(`[DEBUG-SUBSCRIPTION]   Type: ${type}`);

      // ✅ IDEMPOTENCY CHECK #1: Check if subscription already exists for this transaction or order
      if (cashfreeOrderId || transactionId) {
        strapi.log.info(
          `[DEBUG-SUBSCRIPTION] Idempotency check #1: Looking for existing subscription...`
        );

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
              `[DEBUG-SUBSCRIPTION] ✅ IDEMPOTENCY HIT #1: Subscription ${existingSub.documentId} already exists`
            );
            strapi.log.info(
              `[DEBUG-SUBSCRIPTION] Returning existing subscription (no duplicate created)`
            );
            return existingSub;
          }

          // ✅ IDEMPOTENCY CHECK #2: Add small random delay + re-check to handle race conditions
          const delay = Math.floor(Math.random() * 100);
          strapi.log.info(
            `[DEBUG-SUBSCRIPTION] No existing found. Adding ${delay}ms delay before recheck...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Check again after delay in case another request just created it
          const recheckSub = await strapi
            .documents("api::usersubscription.usersubscription")
            .findFirst({
              filters: filters,
              populate: ["course", "subjects"],
            });

          if (recheckSub) {
            strapi.log.info(
              `[DEBUG-SUBSCRIPTION] ✅ IDEMPOTENCY HIT #2 (after delay): Subscription ${recheckSub.documentId} found`
            );
            strapi.log.info(
              `[DEBUG-SUBSCRIPTION] Returning existing subscription (race condition prevented)`
            );
            return recheckSub;
          }

          strapi.log.info(
            `[DEBUG-SUBSCRIPTION] Recheck complete. No duplicate found. Proceeding to create...`
          );
        }
      } else {
        strapi.log.warn(
          `[DEBUG-SUBSCRIPTION] No cashfreeOrderId or transactionId provided - skipping idempotency check`
        );
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

      strapi.log.info(
        `[DEBUG-SUBSCRIPTION] Course ID: ${courseId}, Subject ID: ${subjectId}, Org ID: ${orgId}`
      );
      strapi.log.info(
        `[DEBUG-SUBSCRIPTION] Subscription type: ${subscriptionType}, Amount: ${amount}`
      );

      if (type === "COURSE") {
        // Course purchase
        subscriptionData.course = courseId;
        subscriptionData.course_pricing = pricing.documentId || null;

        strapi.log.info(
          `[DEBUG-SUBSCRIPTION] Fetching course subjects for course: ${courseId}`
        );

        // Get all subjects in the course
        const course = await strapi.documents("api::course.course").findOne({
          documentId: courseId,
          populate: ["subjects"],
        });

        const subjectIds =
          course?.subjects?.map((s) => s.documentId || s.id || s) || [];

        strapi.log.info(
          `[DEBUG-SUBSCRIPTION] Found ${subjectIds.length} subjects in course`
        );

        // Add subjects to subscription data for manyToMany connection
        if (subjectIds.length > 0) {
          subscriptionData.subjects = subjectIds;
        }

        // Create subscription for the course with subjects connected
        strapi.log.info(`[DEBUG-SUBSCRIPTION] Creating COURSE subscription...`);
        const subscription = await strapi
          .documents("api::usersubscription.usersubscription")
          .create({
            data: subscriptionData,
            status: "published",
          });

        strapi.log.info(
          `[DEBUG-SUBSCRIPTION] ✅ COURSE subscription created: ${subscription.documentId}`
        );
        strapi.log.info(
          `[DEBUG-SUBSCRIPTION]   With ${subjectIds.length} subjects attached`
        );
        strapi.log.info(
          `[DEBUG-SUBSCRIPTION] ========== CREATE SUBSCRIPTION SUCCESS ==========`
        );
        return subscription;
      } else if (type === "SUBJECT") {
        // Subject purchase
        strapi.log.info(
          `[DEBUG-SUBSCRIPTION] Processing SUBJECT purchase for subject: ${subjectId}`
        );
        subscriptionData.subject_pricing = pricing.documentId || null;

        // Add the subject to subscription data for manyToMany connection
        if (subjectId) {
          subscriptionData.subjects = [subjectId];
        }

        // Create new subscription for this subject
        strapi.log.info(
          `[DEBUG-SUBSCRIPTION] Creating SUBJECT subscription...`
        );
        const subscription = await strapi
          .documents("api::usersubscription.usersubscription")
          .create({
            data: subscriptionData,
            status: "published",
          });

        strapi.log.info(
          `[DEBUG-SUBSCRIPTION] ✅ SUBJECT subscription created: ${subscription.documentId}`
        );
        strapi.log.info(`[DEBUG-SUBSCRIPTION]   With subject: ${subjectId}`);
        strapi.log.info(
          `[DEBUG-SUBSCRIPTION] ========== CREATE SUBSCRIPTION SUCCESS ==========`
        );
        return subscription;
      }

      strapi.log.error(
        `[DEBUG-SUBSCRIPTION] Unknown subscription type: ${type}`
      );
      throw new Error(`Unknown subscription type: ${type}`);
    } catch (error) {
      strapi.log.error(
        `[DEBUG-SUBSCRIPTION] ========== CREATE SUBSCRIPTION ERROR ==========`
      );
      strapi.log.error(`[DEBUG-SUBSCRIPTION] Error:`, error);
      throw error;
    }
  },
});
