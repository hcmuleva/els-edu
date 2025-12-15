"use strict";

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    console.log("🚀 [STRAPI] Registering application...");

    // Monitor database connection pool in development
    if (process.env.NODE_ENV === "development") {
      const logPoolStats = () => {
        const db = strapi.db?.connection;
        if (db && db.pool) {
          const { numUsed, numFree, numPendingAcquires, numPendingCreates } =
            db.pool;
          const total = numUsed + numFree;
          const max = db.pool.max || 10;

          // Only log if pool usage is high (>70%) or there are pending requests
          const usagePercent = (total / max) * 100;
          if (usagePercent > 70 || numPendingAcquires > 0) {
            console.warn(
              `⚠️ [DB-POOL] High usage: ${numUsed}/${max} used, ${numFree} free, ${numPendingAcquires} waiting`
            );
          }
        }
      };

      // Check pool stats every 3 seconds
      setInterval(logPoolStats, 3000);
      console.log(
        "✅ [DB-POOL] Connection pool monitoring enabled (checking every 3s)"
      );
    }
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    console.log("✅ [STRAPI] Strapi initialized successfully!");
    console.log("✅ [STRAPI] Server is ready to accept requests");
    console.log("✅ [STRAPI] Custom progress API routes registered");

    // Grant permissions for Offer content type
    try {
      const roles = await strapi.documents('plugin::users-permissions.role').findMany({
        filters: { type: { $in: ['public', 'authenticated'] } },
        populate: ['permissions']
      });

      const offerPermissions = [
        'api::offer.offer.find',
        'api::offer.offer.findOne'
      ];

      for (const role of roles) {
        const existingPermissions = role.permissions.map(p => p.action);
        const newPermissions = offerPermissions.filter(action => !existingPermissions.includes(action));

        if (newPermissions.length > 0) {
          console.log(`ℹ️  [PERMISSIONS] Granting Offer permissions to ${role.type} role...`);
          
          // Create permissions
          for (const action of newPermissions) {
            await strapi.documents('plugin::users-permissions.permission').create({
              data: {
                action,
                role: role.documentId
              }
            });
          }
          console.log(`✅ [PERMISSIONS] Granted ${newPermissions.length} permissions to ${role.type}`);
        }
      }
    } catch (error) {
      console.error("❌ [PERMISSIONS] Failed to update permissions:", error);
    }
  },
};
