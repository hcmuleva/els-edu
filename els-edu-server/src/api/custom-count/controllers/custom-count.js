"use strict";

/**
 * Custom Count Controller
 */

module.exports = {
  /**
   * Get subscription counts
   * GET /api/custom-counts/subscription-counts/:userDocumentId
   */
  async getSubscriptionCounts(ctx) {
    const { userDocumentId } = ctx.params;

    try {
      const result = await strapi
        .service("api::custom-count.custom-count")
        .getUserSubscriptionCounts(userDocumentId);

      ctx.body = { data: result };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Get course counts
   * GET /api/custom-counts/course-counts/:courseDocumentId
   */
  async getCourseCounts(ctx) {
    const { courseDocumentId } = ctx.params;

    try {
      const result = await strapi
        .service("api::custom-count.custom-count")
        .getCourseCounts(courseDocumentId);

      ctx.body = { data: result };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Get subject counts
   * GET /api/custom-counts/subject-counts/:subjectDocumentId
   */
  async getSubjectCounts(ctx) {
    const { subjectDocumentId } = ctx.params;

    try {
      const result = await strapi
        .service("api::custom-count.custom-count")
        .getSubjectCounts(subjectDocumentId);

      ctx.body = { data: result };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Get batch counts for multiple MongoDB custom courses
   * POST /api/custom-counts/batch-custom-course-counts
   * Body: { courseIds: ["id1", "id2", ...] }
   */
  async getBatchCustomCourseCounts(ctx) {
    console.log("[getBatchCustomCourseCounts] Request received:", ctx.request.body);
    const { courseIds } = ctx.request.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      console.log("[getBatchCustomCourseCounts] Invalid request: courseIds is not an array or is empty");
      ctx.status = 400;
      ctx.body = { error: "courseIds array is required" };
      return;
    }

    try {
      console.log("[getBatchCustomCourseCounts] Processing", courseIds.length, "course IDs");
      const result = await strapi
        .service("api::custom-count.custom-count")
        .getBatchCustomCourseCounts(courseIds);
      console.log("[getBatchCustomCourseCounts] Result:", Object.keys(result).length, "courses processed");
      ctx.body = { data: result };
    } catch (error) {
      console.error("[getBatchCustomCourseCounts] Error:", error);
      ctx.throw(500, error);
    }
  },
};
