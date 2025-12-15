"use strict";

/**
 * Custom Progress Update Controller
 * Handles progress updates with Ably real-time notifications
 */

const progressService = require("../services/progress-service");

module.exports = {
  /**
   * Mark a lesson as complete and cascade updates
   * POST /api/custom-progress-update/complete-lesson
   * Body: { lessonDocumentId, userDocumentId, orgDocumentId }
   */
  completeLesson: async (ctx) => {
    try {
      const { lessonDocumentId, userDocumentId, orgDocumentId } =
        ctx.request.body;

      // Validate required fields
      if (!lessonDocumentId || !userDocumentId) {
        console.warn(
          `⚠️ [CONTROLLER] Missing fields: lesson=${lessonDocumentId}, user=${userDocumentId}`
        );
        return ctx.badRequest(
          "Missing required fields: lessonDocumentId, userDocumentId"
        );
      }

      // Call the progress service
      const result = await progressService.markLessonComplete(strapi, {
        lessonDocumentId,
        userDocumentId,
        orgDocumentId,
      });

      ctx.body = {
        success: true,
        message: "Lesson marked as complete",
        data: result,
      };
    } catch (err) {
      console.error("❌ Error in completeLesson controller:", err);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: err.message || "Failed to complete lesson",
        error: err.message,
      };
    }
  },

  /**
   * Start a kit
   * POST /api/custom-progress-update/start-kit
   * Body: { kitDocumentId, userDocumentId, orgDocumentId }
   */
  startKit: async (ctx) => {
    try {
      const { kitDocumentId, userDocumentId, orgDocumentId } = ctx.request.body;

      // Validate required fields
      if (!kitDocumentId || !userDocumentId) {
        console.warn(
          `⚠️ [CONTROLLER] Missing fields: kit=${kitDocumentId}, user=${userDocumentId}`
        );
        return ctx.badRequest(
          "Missing required fields: kitDocumentId, userDocumentId"
        );
      }

      // Call the progress service
      const result = await progressService.startKit(strapi, {
        kitDocumentId,
        userDocumentId,
        orgDocumentId,
      });

      ctx.body = {
        success: true,
        message: "Kit started successfully",
        data: result,
      };
    } catch (err) {
      console.error("❌ Error in startKit controller:", err);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: err.message || "Failed to start kit",
        error: err.message,
      };
    }
  },

  /**
   * Start a lesson
   * POST /api/custom-progress-update/start-lesson
   * Body: { lessonDocumentId, userDocumentId, orgDocumentId }
   */
  startLesson: async (ctx) => {
    try {
      const { lessonDocumentId, userDocumentId, orgDocumentId } =
        ctx.request.body;

      // Validate required fields
      if (!lessonDocumentId || !userDocumentId) {
        console.warn(
          `⚠️ [CONTROLLER] Missing fields: lesson=${lessonDocumentId}, user=${userDocumentId}`
        );
        return ctx.badRequest(
          "Missing required fields: lessonDocumentId, userDocumentId"
        );
      }

      // Call the progress service
      const result = await progressService.startLesson(strapi, {
        lessonDocumentId,
        userDocumentId,
        orgDocumentId,
      });

      ctx.body = {
        success: true,
        message: "Lesson started successfully",
        data: result,
      };
    } catch (err) {
      console.error("❌ Error in startLesson controller:", err);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: err.message || "Failed to start lesson",
        error: err.message,
      };
    }
  },

  /**
   * Check for duplicate lessons and kitlevels
   * GET /api/custom-progress-update/check-duplicates
   */
  checkDuplicates: async (ctx) => {
    try {
      const duplicateChecker = require("../services/duplicate-checker");
      const report = await duplicateChecker.reportDuplicates(strapi);

      console.log(
        `✅ [CONTROLLER] Duplicates: ${report.lessons.count} lessons, ${report.kitlevels.count} kitlevels`
      );

      ctx.body = {
        success: true,
        message: "Duplicate check completed",
        data: report,
      };
    } catch (err) {
      console.error("❌ Error in checkDuplicates controller:", err);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: err.message || "Failed to check duplicates",
        error: err.message,
      };
    }
  },

  async cleanupDuplicates(ctx) {
    try {
      const duplicateCleanup = strapi.service(
        "api::custom-progress-update.duplicate-cleanup"
      );

      const result = await duplicateCleanup.cleanupAllDuplicates();

      console.log(
        `✅ [CONTROLLER] Cleanup: deleted ${result.lessons.deletedCount} lessons, ${result.kitlevels.deletedCount} kitlevels`
      );

      ctx.status = 200;
      ctx.body = {
        success: true,
        message: "Cleanup completed",
        data: result,
      };
    } catch (err) {
      console.error("❌ Error in cleanupDuplicates controller:", err);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: err.message || "Failed to cleanup duplicates",
        error: err.message,
      };
    }
  },
  async diagnosticsLevels(ctx) {
    try {
      const { userDocumentId } = ctx.query;
      if (!userDocumentId) {
        return ctx.badRequest("Missing userDocumentId query param");
      }
      const diagnosticService = strapi.service(
        "api::custom-progress-update.diagnostic-service"
      );
      const report =
        await diagnosticService.getLevelDiagnostics(userDocumentId);
      ctx.body = { success: true, data: report };
    } catch (err) {
      console.error("❌ Error in diagnosticsLevels controller:", err);
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  },
};
