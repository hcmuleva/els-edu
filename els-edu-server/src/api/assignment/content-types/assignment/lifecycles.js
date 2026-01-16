"use strict";

const mongoService = require("../../../../services/mongoService");
const { publishToAbly } = require("../../../../../config/ably");

module.exports = {
  async afterCreate(event) {
    const { result, params } = event;

    // Auto-assign to students based on class standards
    try {
      if (
        !result.classStandards ||
        !result.classStandards.length ||
        !result.org
      ) {
        return;
      }

      const orgDocumentId =
        typeof result.org === "object" ? result.org.documentId : result.org;

      if (!orgDocumentId) {
        console.warn(
          "[Lifecycle] Assignment created without orgDocumentId, skipping auto-assign"
        );
        return;
      }

      // Connect to MongoDB
      await mongoService.connect();
      const UserAssignment = mongoService.models.UserAssignment;

      // Find students in this org with matching class standards
      const users = await strapi
        .documents("plugin::users-permissions.user")
        .findMany({
          filters: {
            org: { documentId: { $eq: orgDocumentId } },
            class_standard: { $in: result.classStandards },
            user_role: { $eq: "STUDENT" },
          },
          populate: ["org"],
        });

      if (!users || users.length === 0) {
        console.log(
          `[Lifecycle] No matching students found for assignment ${result.documentId}`
        );
        return;
      }

      console.log(
        `[Lifecycle] Auto-assigning assignment ${result.documentId} to ${users.length} students`
      );

      // Prepare bulk operations
      const operations = users.map((user) => ({
        updateOne: {
          filter: {
            orgDocumentId: orgDocumentId,
            userDocumentId: user.documentId,
            assignmentDocumentId: result.documentId,
          },
          update: {
            $setOnInsert: {
              orgDocumentId: orgDocumentId,
              userDocumentId: user.documentId,
              assignmentDocumentId: result.documentId,
              classStandard: user.class_standard,
              assignedAt: new Date(),
              dueDate: result.dueDate ? new Date(result.dueDate) : null,
              status: "assigned",
              submission: {
                mediaUrls: [],
                youtubeUrl: null,
                textResponse: null,
                submittedAt: null,
              },
              grade: {
                score: null,
                maxScore: result.maxScore || 100,
                feedback: null,
                gradedBy: null,
                gradedAt: null,
              },
            },
          },
          upsert: true,
        },
      }));

      if (operations.length > 0) {
        await UserAssignment.bulkWrite(operations);
        console.log(
          `[Lifecycle] Successfully created/updated ${operations.length} user assignments`
        );
      }

      // ----------------------------------------------------
      // Real-time Notification via Ably
      // ----------------------------------------------------

      // 1. Notify the Classroom Channel (for teacher dashboard updates)
      await publishToAbly(
        `classroom:${orgDocumentId}:assignments`,
        "new-assignment",
        {
          assignmentId: result.documentId,
          title: result.title,
          classStandards: result.classStandards,
          dueDate: result.dueDate,
        }
      );

      // 2. Notify Individual Students
      // We publish to a user-specific channel so the frontend NotificationBell can pick it up
      await Promise.all(
        users.map(async (user) => {
          await publishToAbly(
            `notification:${orgDocumentId}:${user.documentId}`,
            "new-assignment",
            {
              type: "new_assignment",
              title: "New Assignment: " + result.title,
              message: `You have a new assignment due ${
                result.dueDate
                  ? new Date(result.dueDate).toLocaleDateString()
                  : "soon"
              }.`,
              link: "/classroom", // Redirect to classroom main page where assignments are listed
              relatedId: result.documentId,
              timestamp: new Date().toISOString(),
            }
          );
        })
      );

      console.log(
        `[Lifecycle] Ably notifications sent for assignment ${result.documentId}`
      );
    } catch (error) {
      console.error(
        "[Lifecycle] Error in assignment structure afterCreate:",
        error
      );
    }
  },
};
