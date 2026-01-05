"use strict";

/**
 * Course Lifecycle Hooks
 *
 * Detects when course subjects are modified and triggers subscription sync.
 * Any user with permission to modify courses (admin, superadmin, teacher) will trigger these updates.
 */

const { publishToAbly } = require("../../../../../config/ably");

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

        let newSubjectDocIds = [];
        const strapiInstance = global.strapi || event.strapi;

        // Determine new subjects list
        if (params.data.subjects) {
          // Handle { set: [...] } or [...] format
          const subjectsData = Array.isArray(params.data.subjects)
            ? params.data.subjects
            : params.data.subjects.set || [];

          // Extract numerical IDs
          const subjectIds = subjectsData.map((s) =>
            typeof s === "object" ? s.id : s
          );

          if (subjectIds.length > 0) {
            // Fetch documentIds for these numerical IDs
            const subjects = await strapiInstance.db
              .query("api::subject.subject")
              .findMany({
                where: { id: { $in: subjectIds } },
                select: ["documentId"],
              });
            newSubjectDocIds = subjects.map((s) => s.documentId);
          }
        } else {
          // Fallback: Fetch from DB if params doesn't have it (unlikely given the if check)
          const updatedCourse = await strapiInstance.db
            .query("api::course.course")
            .findOne({
              where: { documentId: courseDocumentId },
              populate: {
                subjects: {
                  select: ["documentId"],
                },
              },
            });
          newSubjectDocIds = (updatedCourse?.subjects || []).map(
            (s) => s.documentId
          );
        }

        console.log(
          `[LIFECYCLE] Course ${courseDocumentId} subjects updated, syncing subscriptions...`
        );

        // Prepare subjects object array for sync function (it expects { documentId: ... })
        const subjectObjects = newSubjectDocIds.map((docId) => ({
          documentId: docId,
        }));

        // Trigger subscription sync
        const syncResult = await strapiInstance
          .service("api::usersubscription.subscription-sync")
          .syncCourseSubscriptions(courseDocumentId, subjectObjects);

        console.log(
          `[LIFECYCLE] Sync complete: ${syncResult.updatedCount} subscriptions updated`
        );

        // Broadcast global course update for Browse Courses page
        await publishToAbly("global:courses", "course:subjects-updated", {
          courseDocumentId,
          subjectCount: newSubjectDocIds.length,
          timestamp: new Date().toISOString(),
        });
        console.log(
          `[LIFECYCLE] Global course update broadcasted for ${courseDocumentId}`
        );
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
