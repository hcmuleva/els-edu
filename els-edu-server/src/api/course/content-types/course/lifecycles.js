"use strict";

/**
 * Course Lifecycle Hooks
 *
 * Detects when course subjects are modified and triggers subscription sync.
 * Any user with permission to modify courses (admin, superadmin, teacher) will trigger these updates.
 */

module.exports = {
  /**
   * After course is updated, check if subjects changed and sync subscriptions
   */
  async afterUpdate(event) {
    const { result, params } = event;

    // Check if subjects relation was modified in this update
    // Strapi includes the relation in params.data when it's being updated
    if (params.data?.subjects !== undefined) {
      try {
        const courseDocumentId = result.documentId;

        // Fetch the updated course with its subjects
        // Fetch the updated course with its subjects using Query Engine (no limits)
        const updatedCourse = await strapi.db
          .query("api::course.course")
          .findOne({
            where: { documentId: courseDocumentId },
            populate: {
              subjects: {
                select: ["documentId"],
              },
            },
          });

        if (updatedCourse) {
          console.log(
            `[LIFECYCLE] Course ${courseDocumentId} subjects updated, syncing subscriptions...`
          );

          // Trigger subscription sync
          const syncResult = await strapi
            .service("api::usersubscription.subscription-sync")
            .syncCourseSubscriptions(
              courseDocumentId,
              updatedCourse.subjects || []
            );

          console.log(
            `[LIFECYCLE] Sync complete: ${syncResult.updatedCount} subscriptions updated`
          );
        }
      } catch (error) {
        // Log error but don't block the course update
        console.error(
          "[LIFECYCLE] Error syncing subscriptions after course update:",
          error
        );
      }
    }
  },
};
