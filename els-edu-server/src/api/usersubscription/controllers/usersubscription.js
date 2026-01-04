"use strict";

/**
 * usersubscription controller
 * Extended with custom endpoints for subscription sync and counts
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::usersubscription.usersubscription",
  ({ strapi }) => ({
    /**
     * Manual refresh subscription to sync with course subjects
     * POST /api/usersubscriptions/:id/refresh
     */
    async refresh(ctx) {
      const { id } = ctx.params;

      try {
        const result = await strapi
          .service("api::usersubscription.subscription-sync")
          .refreshSubscription(id);

        return { data: result };
      } catch (error) {
        console.error("[CONTROLLER] Refresh error:", error);
        ctx.throw(400, error.message);
      }
    },

    /**
     * Check sync status of a subscription
     * GET /api/usersubscriptions/:id/sync-status
     */
    async syncStatus(ctx) {
      const { id } = ctx.params;

      try {
        const result = await strapi
          .service("api::usersubscription.subscription-sync")
          .checkSyncStatus(id);

        return { data: result };
      } catch (error) {
        console.error("[CONTROLLER] Sync status error:", error);
        ctx.throw(400, error.message);
      }
    },
  })
);
