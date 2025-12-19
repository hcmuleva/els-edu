const bcrypt = require("bcryptjs");
const {
  setDefaultStudentRoles,
} = require("../../../utils/migrations/set-default-student-roles");

module.exports = {
  async adminResetPassword(ctx) {
    try {
      const { userId, password, sendEmail } = ctx.request.body;
      if (!userId || !password)
        return ctx.badRequest("Missing userId or password");

      // find user by documentId
      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { documentId: userId },
        });
      if (!user) return ctx.notFound("User not found");

      // hash password manually using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // update password
      const updatedUser = await strapi.db
        .query("plugin::users-permissions.user")
        .update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });

      // optionally send reset email
      if (sendEmail) {
        // e.g., await strapi.plugins['email'].services.email.send({...})
      }

      ctx.body = {
        data: { message: "Password updated successfully", id: updatedUser.id },
      };
    } catch (err) {
      console.error("Password reset error:", err);
      ctx.badRequest("Error resetting password", { error: err.message });
    }
  },

  async updateByDocumentId(ctx) {
    try {
      const { documentId } = ctx.params;
      const payload = ctx.request.body?.data;
      if (!documentId || !payload)
        return ctx.badRequest("Missing documentId or data");

      const authUser = ctx.state.user;
      if (!authUser) return ctx.unauthorized("Authentication required");

      const target = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { documentId },
          select: ["id", "documentId"],
        });

      if (!target) return ctx.notFound("User not found");

      // Allow ADMIN or SUPERADMIN or self-update
      // Also allow if updating assigned_roles/user_role via API token (for script usage)
      const roleVal =
        authUser.user_role || (authUser.role && authUser.role.name) || "";
      const isAdminRole = ["ADMIN", "SUPERADMIN"].includes(
        String(roleVal).toUpperCase()
      );
      const isUpdatingRoles =
        payload.assigned_roles !== undefined || payload.user_role !== undefined;
      const isSelfUpdate = authUser.documentId === documentId;

      // Allow if: admin, self-update, or updating roles via API token (for bulk operations)
      if (!isAdminRole && !isSelfUpdate && !isUpdatingRoles) {
        return ctx.forbidden("Not allowed");
      }

      const allowedFields = [
        "first_name",
        "last_name",
        "mobile_number",
        "user_experience_level",
        "user_role",
        "assigned_roles",
      ];
      const data = {};
      for (const key of allowedFields) {
        if (payload[key] !== undefined) data[key] = payload[key];
      }
      if (Object.keys(data).length === 0)
        return ctx.badRequest("No permitted fields provided to update");

      const updated = await strapi.entityService.update(
        "plugin::users-permissions.user",
        target.id,
        { data }
      );

      ctx.body = {
        data: {
          documentId: updated.documentId,
          username: updated.username,
          first_name: updated.first_name,
          last_name: updated.last_name,
          user_role: updated.user_role,
          assigned_roles: updated.assigned_roles,
          mobile_number: updated.mobile_number,
        },
      };
    } catch (err) {
      ctx.badRequest("Error updating user", { error: err.message });
    }
  },

  async runSetDefaultStudentRoles(ctx) {
    try {
      // Check if user is authenticated and is a SUPERADMIN
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("Authentication required");
      }

      const roleVal = user.user_role || (user.role && user.role.name) || "";
      if (roleVal !== "SUPERADMIN" && roleVal !== "ADMIN") {
        return ctx.forbidden("Only ADMIN or SUPERADMIN can run this migration");
      }

      // Get options from request body
      const { replaceAll = false, addOnly = true } = ctx.request.body || {};

      // Run the migration
      const result = await setDefaultStudentRoles(strapi, {
        replaceAll,
        addOnly,
      });

      return ctx.send({
        success: true,
        migration: "set_default_student_roles",
        result,
      });
    } catch (error) {
      strapi.log.error("Set default student roles endpoint error:", error);
      return ctx.internalServerError("Migration failed", {
        error: error.message,
      });
    }
  },

  async createUserWithOrg(ctx) {
    try {
      const authUser = ctx.state.user;
      if (!authUser) return ctx.unauthorized("Authentication required");

      // Check if user is SUPERADMIN
      const roleVal =
        authUser.user_role || (authUser.role && authUser.role.name) || "";
      console.log("\n\n *********roleVal*****\n\n", roleVal);
      if (roleVal !== "SUPERADMIN") {
        return ctx.forbidden("Only SUPERADMIN can create users");
      }

      const payload = ctx.request.body?.data || ctx.request.body;
      const { username, email, password, org, ...userData } = payload;

      if (!username || !email || !password) {
        return ctx.badRequest(
          "Missing required fields: username, email, password"
        );
      }

      // Step 1: Register user (creates basic user account)
      const registerService = strapi.plugins["users-permissions"].services.user;
      const registeredUser = await registerService.add({
        username,
        email,
        password,
        confirmed: userData.confirmed !== undefined ? userData.confirmed : true,
        blocked: userData.blocked !== undefined ? userData.blocked : false,
      });

      if (!registeredUser) {
        return ctx.badRequest("Failed to register user");
      }

      // Step 2: If org is provided, convert documentId to numeric id and assign it
      if (org) {
        try {
          // Convert org documentId to numeric id (required for user.org relation)
          let orgNumericId = null;
          if (typeof org === "string") {
            // Query org by documentId to get numeric id
            const orgRecord = await strapi.db.query("api::org.org").findOne({
              where: { documentId: org },
              select: ["id"],
            });
            if (orgRecord) {
              orgNumericId = orgRecord.id;
              strapi.log.info(
                `Converted org documentId ${org} to numeric id ${orgNumericId}`
              );
            } else {
              throw new Error(`Org not found with documentId: ${org}`);
            }
          } else if (typeof org === "number") {
            orgNumericId = org;
          }

          // Update user with org and other fields
          await strapi.entityService.update(
            "plugin::users-permissions.user",
            registeredUser.id,
            {
              data: {
                ...userData,
                org: orgNumericId, // Use numeric id for relation
              },
            }
          );
        } catch (orgError) {
          strapi.log.error("Failed to assign org to user:", orgError);
          // Continue - user is created even if org assignment fails
          // But log the error for debugging
        }
      } else {
        // Update user with other fields if no org
        if (Object.keys(userData).length > 0) {
          await strapi.entityService.update(
            "plugin::users-permissions.user",
            registeredUser.id,
            {
              data: userData,
            }
          );
        }
      }

      // Fetch updated user with relations populated
      const updatedUser = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        registeredUser.id,
        {
          populate: ["org"],
        }
      );

      ctx.body = {
        data: {
          id: updatedUser.id,
          documentId: updatedUser.documentId,
          username: updatedUser.username,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          user_role: updatedUser.user_role,
          user_status: updatedUser.user_status,
          org: updatedUser.org,
        },
      };
    } catch (error) {
      strapi.log.error("Create user with org error:", error);
      return ctx.badRequest("Failed to create user", { error: error.message });
    }
  },
};
