/**
 * Migration utility to set default STUDENT role for all users
 *
 * This script populates the assigned_roles and user_role fields for all existing users
 * who don't have roles set, setting them to STUDENT by default.
 *
 * To run this migration:
 * 1. Call it from a custom admin endpoint (recommended)
 * 2. Or run it manually via Strapi console
 */

async function setDefaultStudentRoles(strapi, options = {}) {
  try {
    const { replaceAll = false, addOnly = true } = options;

    strapi.log.info("Starting set default STUDENT roles migration...");
    strapi.log.info(
      `Mode: ${replaceAll ? "REPLACE ALL ROLES" : "ADD STUDENT (if missing)"}`
    );

    // Fetch all users
    const users = await strapi.entityService.findMany(
      "plugin::users-permissions.user",
      {
        fields: ["id", "username", "email", "user_role", "assigned_roles"],
        limit: -1, // Get all users
      }
    );

    strapi.log.info(`Found ${users.length} users to check`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Get current roles
        let currentRoles = [];
        if (user.assigned_roles) {
          if (typeof user.assigned_roles === "string") {
            try {
              currentRoles = JSON.parse(user.assigned_roles);
            } catch (e) {
              currentRoles = [];
            }
          } else if (Array.isArray(user.assigned_roles)) {
            currentRoles = user.assigned_roles.map(
              (item) => item?.role || item
            );
          }
        }

        // Determine if user needs update
        let needsUpdate = false;
        let newRoles = [];
        let newActiveRole = null;

        if (replaceAll) {
          // Replace all with just STUDENT
          needsUpdate = true;
          newRoles = [{ role: "STUDENT" }];
          newActiveRole = "STUDENT";
        } else if (addOnly) {
          // Only add STUDENT if user has no roles
          if (currentRoles.length === 0 || !user.user_role) {
            needsUpdate = true;
            if (currentRoles.length === 0) {
              newRoles = [{ role: "STUDENT" }];
            } else {
              newRoles = currentRoles.map((role) => ({ role }));
              if (!currentRoles.includes("STUDENT")) {
                newRoles.push({ role: "STUDENT" });
              }
            }
            newActiveRole = getActiveRoleFromRoles(newRoles.map((r) => r.role));
          }
        } else {
          // Add STUDENT if not present, keep existing roles
          if (!currentRoles.includes("STUDENT") || !user.user_role) {
            needsUpdate = true;
            if (!currentRoles.includes("STUDENT")) {
              newRoles = currentRoles.map((role) => ({ role }));
              newRoles.push({ role: "STUDENT" });
            } else {
              newRoles = currentRoles.map((role) => ({ role }));
            }
            newActiveRole = getActiveRoleFromRoles(newRoles.map((r) => r.role));
          }
        }

        // Also check if user_role needs to be updated to match assigned_roles
        if (!needsUpdate && user.user_role) {
          const expectedRole = getActiveRoleFromRoles(currentRoles);
          if (user.user_role !== expectedRole) {
            needsUpdate = true;
            newRoles = currentRoles.map((role) => ({ role }));
            newActiveRole = expectedRole;
          }
        }

        if (!needsUpdate) {
          skipped++;
          continue;
        }

        // Prepare update data
        const updateData = {
          assigned_roles: newRoles,
        };

        if (newActiveRole !== null) {
          updateData.user_role = newActiveRole;
        }

        // Update user using entity service
        await strapi.entityService.update(
          "plugin::users-permissions.user",
          user.id,
          {
            data: updateData,
          }
        );

        updated++;

        if (updated % 10 === 0) {
          strapi.log.info(`Updated ${updated} users so far...`);
        }
      } catch (error) {
        errors++;
        strapi.log.error(
          `Error updating user ${user.id} (${user.username || user.email}):`,
          error
        );
      }
    }

    strapi.log.info("=".repeat(50));
    strapi.log.info("Migration completed!");
    strapi.log.info(`Total users: ${users.length}`);
    strapi.log.info(`Updated: ${updated}`);
    strapi.log.info(`Skipped (no changes needed): ${skipped}`);
    strapi.log.info(`Errors: ${errors}`);
    strapi.log.info("=".repeat(50));

    return {
      success: true,
      total: users.length,
      updated,
      skipped,
      errors,
    };
  } catch (error) {
    strapi.log.error("Migration failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get the active role (user_role enum) based on roles in assigned_roles
 * Priority: SUPERADMIN > ADMIN > TEACHER > PARENT > MARKETING > STUDENT
 */
function getActiveRoleFromRoles(roles) {
  if (roles.includes("SUPERADMIN")) {
    return "SUPERADMIN";
  }
  if (roles.includes("ADMIN")) {
    return "ADMIN";
  }
  if (roles.includes("TEACHER")) {
    return "TEACHER";
  }
  if (roles.includes("PARENT")) {
    return "PARENT";
  }
  if (roles.includes("MARKETING")) {
    return "MARKETING";
  }
  if (roles.includes("STUDENT")) {
    return "STUDENT";
  }
  // Default to STUDENT if no roles
  return "STUDENT";
}

module.exports = { setDefaultStudentRoles };
