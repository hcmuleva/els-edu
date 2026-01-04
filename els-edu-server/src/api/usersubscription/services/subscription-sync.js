"use strict";

/**
 * Subscription Sync Service
 *
 * Handles automatic synchronization of user subscriptions when course subjects change.
 * Any user with permission to modify courses (admin, superadmin, teacher) will trigger these updates.
 */

const { publishToAbly } = require("../../../../config/ably");

module.exports = ({ strapi }) => ({
  /**
   * Sync all subscriptions for a course with its current subjects
   * Called automatically when course subjects are modified
   *
   * @param {string} courseDocumentId - Course document ID
   * @param {Array} currentSubjects - Array of subject objects with documentId
   * @returns {Object} - { updatedCount, changes }
   */
  async syncCourseSubscriptions(courseDocumentId, currentSubjects) {
    try {
      // Find all subscriptions for this course
      const subscriptions = await strapi
        .documents("api::usersubscription.usersubscription")
        .findMany({
          filters: {
            course: { documentId: courseDocumentId },
            paymentstatus: "ACTIVE", // Only sync active subscriptions
          },
          populate: ["user", "subjects"],
          limit: 1000, // Process up to 1000 subscriptions (should use batching for more)
        });

      if (!subscriptions || subscriptions.length === 0) {
        console.log(
          `[SYNC] No active subscriptions found for course ${courseDocumentId}`
        );
        return { updatedCount: 0, changes: { added: [], removed: [] } };
      }

      const newSubjectDocIds = (currentSubjects || []).map((s) => s.documentId);
      let updatedCount = 0;
      const allChanges = [];

      // Update each subscription
      for (const sub of subscriptions) {
        const oldSubjectIds = (sub.subjects || []).map((s) => s.documentId);

        // Calculate diff for notification
        const added = newSubjectDocIds.filter(
          (id) => !oldSubjectIds.includes(id)
        );
        const removed = oldSubjectIds.filter(
          (id) => !newSubjectDocIds.includes(id)
        );

        if (added.length > 0 || removed.length > 0) {
          // Update subscription subjects using document service
          await strapi
            .documents("api::usersubscription.usersubscription")
            .update({
              documentId: sub.documentId,
              data: { subjects: newSubjectDocIds },
              status: "published",
            });

          updatedCount++;
          const changes = { added, removed };
          allChanges.push({
            subscriptionId: sub.documentId,
            userId: sub.user?.documentId,
            changes,
          });

          // Notify user via Ably (if user exists)
          if (sub.user?.documentId) {
            await publishToAbly(
              `user:${sub.user.documentId}:subscriptions`,
              "course:subjects-updated",
              {
                courseDocumentId,
                subscriptionId: sub.documentId,
                changes,
                autoSynced: true,
                timestamp: new Date().toISOString(),
              }
            );
          }
        }
      }

      console.log(
        `[SYNC] Updated ${updatedCount}/${subscriptions.length} subscriptions for course ${courseDocumentId}`
      );
      return {
        updatedCount,
        totalSubscriptions: subscriptions.length,
        changes: allChanges,
      };
    } catch (error) {
      console.error("[SYNC] Error syncing course subscriptions:", error);
      // Non-blocking - users can manually refresh
      return { updatedCount: 0, error: error.message };
    }
  },

  /**
   * Refresh a single subscription to match current course subjects
   * Called when user manually clicks refresh button
   *
   * @param {string} subscriptionDocumentId - Subscription document ID
   * @returns {Object} - { success, subjectCount, changes }
   */
  async refreshSubscription(subscriptionDocumentId) {
    // Use Query Engine to fetch all relations without default limits
    const subscription = await strapi.db
      .query("api::usersubscription.usersubscription")
      .findOne({
        where: { documentId: subscriptionDocumentId },
        populate: {
          course: {
            populate: {
              subjects: {
                select: ["documentId"],
              },
            },
          },
          subjects: {
            select: ["documentId"],
          },
        },
      });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (!subscription.course) {
      throw new Error("Course not found for this subscription");
    }

    const courseSubjects = subscription.course.subjects || [];
    const newSubjectDocIds = courseSubjects.map((s) => s.documentId);
    const oldSubjectIds = (subscription.subjects || []).map(
      (s) => s.documentId
    );

    // Calculate changes
    const added = newSubjectDocIds.filter((id) => !oldSubjectIds.includes(id));
    const removed = oldSubjectIds.filter(
      (id) => !newSubjectDocIds.includes(id)
    );

    // Update subscription subjects
    await strapi.documents("api::usersubscription.usersubscription").update({
      documentId: subscriptionDocumentId,
      data: { subjects: newSubjectDocIds },
      status: "published",
    });

    console.log(
      `[SYNC] Manually refreshed subscription ${subscriptionDocumentId}: ${added.length} added, ${removed.length} removed`
    );

    return {
      success: true,
      subjectCount: newSubjectDocIds.length,
      changes: { added, removed },
      hasChanges: added.length > 0 || removed.length > 0,
    };
  },

  /**
   * Check if subscription is out of sync with course
   * Can be used by frontend to show sync status
   *
   * @param {string} subscriptionDocumentId
   * @returns {Object} - { inSync, changes }
   */
  async checkSyncStatus(subscriptionDocumentId) {
    const subscription = await strapi
      .documents("api::usersubscription.usersubscription")
      .findOne({
        documentId: subscriptionDocumentId,
        populate: {
          course: {
            populate: ["subjects"],
          },
          subjects: true,
        },
      });

    if (!subscription || !subscription.course) {
      return { inSync: true, changes: { added: [], removed: [] } };
    }

    const courseSubjectIds = (subscription.course.subjects || []).map(
      (s) => s.documentId
    );
    const subSubjectIds = (subscription.subjects || []).map(
      (s) => s.documentId
    );

    const added = courseSubjectIds.filter((id) => !subSubjectIds.includes(id));
    const removed = subSubjectIds.filter(
      (id) => !courseSubjectIds.includes(id)
    );

    return {
      inSync: added.length === 0 && removed.length === 0,
      changes: { added, removed },
    };
  },
});
