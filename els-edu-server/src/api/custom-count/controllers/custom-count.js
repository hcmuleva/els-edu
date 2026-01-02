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
};
