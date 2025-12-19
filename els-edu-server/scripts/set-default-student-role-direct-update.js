/**
 * Direct update script - updates users using the existing updateByDocumentId endpoint
 * This bypasses the migration route and updates users directly
 *
 * Usage:
 *   node scripts/set-default-student-role-direct-update.js --token YOUR_TOKEN --yes
 */

const axios = require("axios");

// Configuration
const STRAPI_URL =
  process.env.STRAPI_URL || process.env.BACKEND_URL || "http://localhost:1337";
const args = process.argv.slice(2);
const tokenIndex = args.indexOf("--token");
const API_TOKEN =
  tokenIndex !== -1 && args[tokenIndex + 1]
    ? args[tokenIndex + 1]
    : process.env.API_TOKEN || process.env.BEARER_TOKEN || "";

const replaceAll = args.includes("--replace");
const addOnly = args.includes("--add-only") || !replaceAll;
const skipConfirm = args.includes("--yes") || args.includes("-y");

const headers = {
  "Content-Type": "application/json",
};

if (API_TOKEN) {
  headers["Authorization"] = `Bearer ${API_TOKEN}`;
}

function getUserRoles(user) {
  if (!user.assigned_roles) return [];

  let rolesArray = user.assigned_roles;
  if (typeof rolesArray === "string") {
    try {
      rolesArray = JSON.parse(rolesArray);
    } catch (e) {
      return [];
    }
  }

  if (Array.isArray(rolesArray)) {
    return rolesArray.map((item) => item?.role || item);
  }

  return [];
}

function getNewRoles(user) {
  const currentRoles = getUserRoles(user);

  if (replaceAll) {
    return [{ role: "STUDENT" }];
  }

  if (addOnly && currentRoles.length === 0) {
    return [{ role: "STUDENT" }];
  }

  if (!currentRoles.includes("STUDENT")) {
    const newRoles = currentRoles.map((role) => ({ role }));
    newRoles.push({ role: "STUDENT" });
    return newRoles;
  }

  return currentRoles.map((role) => ({ role }));
}

function getActiveRole(user) {
  const currentRoles = getUserRoles(user);

  if (currentRoles.includes("SUPERADMIN")) {
    return "SUPERADMIN";
  }
  if (currentRoles.includes("ADMIN")) {
    return "ADMIN";
  }
  if (currentRoles.includes("TEACHER")) {
    return "TEACHER";
  }
  if (currentRoles.includes("PARENT")) {
    return "PARENT";
  }
  if (currentRoles.includes("MARKETING")) {
    return "MARKETING";
  }
  if (currentRoles.includes("STUDENT")) {
    return "STUDENT";
  }

  return "STUDENT";
}

function shouldUpdateUser(user) {
  const currentRoles = getUserRoles(user);
  const currentActiveRole = user.user_role;
  const expectedActiveRole = getActiveRole(user);

  const activeRoleNeedsUpdate = currentActiveRole !== expectedActiveRole;

  if (replaceAll) {
    return true;
  }

  if (addOnly) {
    return (
      currentRoles.length === 0 || activeRoleNeedsUpdate || !currentActiveRole
    );
  }

  return (
    !currentRoles.includes("STUDENT") ||
    activeRoleNeedsUpdate ||
    !currentActiveRole
  );
}

async function getAllUsers() {
  try {
    let allUsers = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    console.log("Fetching all users...");

    while (hasMore) {
      const response = await axios.get(`${STRAPI_URL}/api/users`, {
        headers,
        params: {
          "pagination[page]": page,
          "pagination[pageSize]": pageSize,
          populate: "*",
        },
      });

      let users = [];
      if (Array.isArray(response.data)) {
        users = response.data;
      } else if (Array.isArray(response.data?.data)) {
        users = response.data.data;
      }

      allUsers = allUsers.concat(users);

      const pagination =
        response.data.meta?.pagination || response.data?.meta?.pagination;
      if (pagination) {
        hasMore = page < pagination.pageCount;
      } else {
        hasMore = users.length === pageSize;
      }

      page++;

      if (page > 1000) {
        console.warn("⚠️  Safety limit reached (1000 pages), stopping...");
        break;
      }
    }

    console.log(`✅ Fetched ${allUsers.length} users\n`);
    return allUsers;
  } catch (error) {
    console.error("\n❌ Error fetching users:", error.message);
    throw error;
  }
}

async function updateUser(user) {
  try {
    const newRoles = getNewRoles(user);
    const activeRole = getActiveRole(user);

    const updateData = {
      assigned_roles: newRoles,
      user_role: activeRole,
    };

    // Try multiple endpoints
    let response;
    let updated = null;

    // Try 1: Custom updateByDocumentId endpoint (requires server restart)
    try {
      response = await axios.put(
        `${STRAPI_URL}/api/user-update/users/update-doc/${user.documentId}`,
        { data: updateData },
        { headers }
      );
      updated = response.data?.data;
      if (updated && updated.user_role === activeRole) {
        return {
          success: true,
          assigned_roles: updated.assigned_roles,
          user_role: updated.user_role,
        };
      }
    } catch (err) {
      // If 405, route not registered - need server restart
      if (err.response?.status === 405) {
        throw new Error(
          "ROUTE_NOT_REGISTERED: Server needs restart to register custom routes"
        );
      }
    }

    // Try 2: Standard Strapi users endpoint (may not work for these fields)
    try {
      response = await axios.put(
        `${STRAPI_URL}/api/users/${user.id}`,
        { data: updateData },
        { headers }
      );
      updated = response.data?.data || response.data;
      // Verify if it actually updated
      if (
        updated &&
        (updated.user_role === activeRole ||
          JSON.stringify(updated.assigned_roles) === JSON.stringify(newRoles))
      ) {
        return {
          success: true,
          assigned_roles: updated.assigned_roles,
          user_role: updated.user_role,
        };
      }
    } catch (err) {
      // Continue to next method
    }

    // If we get here, updates didn't work
    return {
      success: false,
      error:
        "Update endpoints not working. Server may need restart or fields are read-only via REST API.",
    };
  } catch (error) {
    if (error.message.includes("ROUTE_NOT_REGISTERED")) {
      throw error; // Re-throw to stop the script
    }
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("Setting default STUDENT role for all users (Direct Update)");
  console.log("=".repeat(60));
  console.log(
    `Mode: ${replaceAll ? "REPLACE ALL ROLES" : "ADD STUDENT (if missing)"}`
  );
  console.log(`Strapi URL: ${STRAPI_URL}`);
  console.log("");

  if (!API_TOKEN) {
    console.error("❌ ERROR: No API_TOKEN provided!");
    console.error("");
    console.error("Please provide an API token:");
    console.error(
      "  node scripts/set-default-student-role-direct-update.js --token YOUR_TOKEN --yes"
    );
    console.error("");
    process.exit(1);
  }

  if (!skipConfirm) {
    console.log("⚠️  This will update user roles for all users.");
    console.log(
      "   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n"
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  try {
    // Get all users
    const users = await getAllUsers();

    // Filter users that need updating
    const usersToUpdate = users.filter(shouldUpdateUser);
    console.log(`Users to update: ${usersToUpdate.length}`);
    console.log(
      `Users that will be skipped: ${users.length - usersToUpdate.length}\n`
    );

    if (usersToUpdate.length === 0) {
      console.log(
        "✅ No users need updating. All users already have the STUDENT role."
      );
      return;
    }

    // Show preview
    console.log("Preview of users to be updated:");
    usersToUpdate.slice(0, 5).forEach((user) => {
      const currentRoles = getUserRoles(user);
      const newRoles = getNewRoles(user);
      console.log(`  - ${user.username || user.email} (ID: ${user.id})`);
      console.log(
        `    Current: [${currentRoles.join(", ") || "none"}] -> New: [${newRoles.map((r) => r.role).join(", ")}]`
      );
    });
    if (usersToUpdate.length > 5) {
      console.log(`  ... and ${usersToUpdate.length - 5} more users`);
    }
    console.log("");

    // Update users
    let successCount = 0;
    let errorCount = 0;

    console.log("Updating users...\n");

    for (let i = 0; i < usersToUpdate.length; i++) {
      const user = usersToUpdate[i];
      try {
        if (i % 10 === 0 && i > 0) {
          console.log(
            `\n📊 Progress: ${i}/${usersToUpdate.length} users processed...`
          );
        }

        const result = await updateUser(user);

        if (result.success) {
          successCount++;
          if (i < 5 || successCount % 50 === 0) {
            console.log(
              `✅ Updated user ${user.id} (${user.username || user.email})`
            );
          }
        } else {
          errorCount++;
          // Check if it's a route registration issue
          if (result.error && result.error.includes("ROUTE_NOT_REGISTERED")) {
            throw new Error("ROUTE_NOT_REGISTERED");
          }
          if (i < 5) {
            console.error(
              `❌ Failed user ${user.id} (${user.username || user.email}): ${result.error}`
            );
          }
        }

        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        if (error.message.includes("ROUTE_NOT_REGISTERED")) {
          console.error("\n" + "=".repeat(60));
          console.error("❌ CRITICAL: Custom routes are not registered!");
          console.error("=".repeat(60));
          console.error("");
          console.error(
            "The update endpoints require the server to be restarted."
          );
          console.error("");
          console.error("To fix this:");
          console.error("1. Stop your Strapi server (Ctrl+C)");
          console.error("2. Restart: npm run develop");
          console.error("3. Wait for server to fully start");
          console.error("4. Run this script again");
          console.error("");
          console.error(
            `Progress so far: ${successCount} updated, ${errorCount + 1} failed`
          );
          process.exit(1);
        }
        errorCount++;
        if (i < 5) {
          console.error(`❌ Error updating user ${user.id}:`, error.message);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("Update Complete!");
    console.log("=".repeat(60));
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`❌ Failed: ${errorCount} users`);
    console.log(`⏭️  Skipped: ${users.length - usersToUpdate.length} users`);
    console.log("");
  } catch (error) {
    console.error("\n❌ Script failed:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = {
  main,
  getAllUsers,
  updateUser,
  getUserRoles,
  getNewRoles,
  getActiveRole,
};
