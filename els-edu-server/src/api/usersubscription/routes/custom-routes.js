"use strict";

/**
 * usersubscription custom routes
 * Additional routes for subscription sync and counts functionality
 */

module.exports = {
  routes: [
    {
      method: "POST",
      path: "/usersubscriptions/:id/refresh",
      handler: "usersubscription.refresh",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/usersubscriptions/:id/sync-status",
      handler: "usersubscription.syncStatus",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
