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

    // Monitor database connection pool in development (logged once at register)
    if (process.env.NODE_ENV === "development") {
      const db = strapi.db?.connection;
      if (db && db.pool) {
        console.log(`✅ [DB-POOL] Max connections: ${db.pool.max || 10}`);
      }
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
      const roles = await strapi
        .documents("plugin::users-permissions.role")
        .findMany({
          filters: { type: { $in: ["public", "authenticated"] } },
          populate: ["permissions"],
        });

      const offerPermissions = [
        "api::offer.offer.find",
        "api::offer.offer.findOne",
      ];

      for (const role of roles) {
        const existingPermissions = role.permissions.map((p) => p.action);
        const newPermissions = offerPermissions.filter(
          (action) => !existingPermissions.includes(action)
        );

        if (newPermissions.length > 0) {
          console.log(
            `ℹ️  [PERMISSIONS] Granting Offer permissions to ${role.type} role...`
          );

          // Create permissions
          for (const action of newPermissions) {
            await strapi
              .documents("plugin::users-permissions.permission")
              .create({
                data: {
                  action,
                  role: role.documentId,
                },
              });
          }
          console.log(
            `✅ [PERMISSIONS] Granted ${newPermissions.length} permissions to ${role.type}`
          );
        }
      }
    } catch (error) {
      console.error("❌ [PERMISSIONS] Failed to update permissions:", error);
    }
  },
};
