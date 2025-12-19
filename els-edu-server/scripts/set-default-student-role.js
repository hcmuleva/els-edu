/**
 * Script to set default STUDENT role for all users in Strapi
 *
 * Usage:
 *   # Basic usage (adds STUDENT to users with no roles)
 *   node scripts/set-default-student-role.js --token YOUR_API_TOKEN
 *
 *   # Or use npm script
 *   npm run set-default-student-role -- --token YOUR_API_TOKEN
 *
 *   # Replace all roles with STUDENT
 *   node scripts/set-default-student-role.js --replace --token YOUR_API_TOKEN
 *
 *   # Skip confirmation prompt
 *   node scripts/set-default-student-role.js --yes --token YOUR_API_TOKEN
 *
 * Environment Variables:
 *   STRAPI_URL - Strapi server URL (default: http://localhost:1337)
 *   API_TOKEN or BEARER_TOKEN - Admin API token
 *
 * This script will:
 * 1. Fetch all users from the database
 * 2. Set assigned_roles (JSON array) to [{ role: "STUDENT" }] for users who don't have any roles (default)
 * 3. Set user_role (enumeration) to "STUDENT" if it's null/undefined
 * 4. Or replace all roles with STUDENT if --replace flag is used
 *
 * Options:
 *   --replace: Replace all existing roles with just STUDENT
 *   --add-only: Only add STUDENT if user has no roles (default behavior)
 *   --token <token>: Provide API token as command line argument
 *   --yes, -y: Skip confirmation prompt
 */

const axios = require("axios");

// Configuration - Update these if needed
const STRAPI_URL =
  process.env.STRAPI_URL || process.env.BACKEND_URL || "http://localhost:1337";
// Get API token from environment or command line
const args = process.argv.slice(2);
const tokenIndex = args.indexOf("--token");
const API_TOKEN =
  tokenIndex !== -1 && args[tokenIndex + 1]
    ? args[tokenIndex + 1]
    : process.env.API_TOKEN || process.env.BEARER_TOKEN || "";

// Parse command line arguments
const replaceAll = args.includes("--replace");
const addOnly = args.includes("--add-only") || !replaceAll;
const skipConfirm = args.includes("--yes") || args.includes("-y");

const headers = {
  "Content-Type": "application/json",
};

if (API_TOKEN) {
  headers["Authorization"] = `Bearer ${API_TOKEN}`;
}

async function getAllUsers() {
  try {
    let allUsers = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    console.log("Fetching all users...");
    console.log(`API URL: ${STRAPI_URL}/api/users`);
    console.log(`Headers:`, JSON.stringify(headers, null, 2));

    while (hasMore) {
      const url = `${STRAPI_URL}/api/users`;
      const params = {
        "pagination[page]": page,
        "pagination[pageSize]": pageSize,
        populate: "*",
      };

      console.log(`\n📡 Requesting page ${page}...`);
      console.log(`URL: ${url}`);
      console.log(`Params:`, params);

      const response = await axios.get(url, {
        headers,
        params,
      });

      console.log(`\n📥 Response status: ${response.status}`);
      console.log(`Response data keys:`, Object.keys(response.data || {}));
      console.log(`Response structure:`, {
        hasData: !!response.data,
        hasDataData: !!response.data?.data,
        hasMeta: !!response.data?.meta,
        dataType: Array.isArray(response.data) ? "array" : typeof response.data,
        dataDataType: Array.isArray(response.data?.data)
          ? "array"
          : typeof response.data?.data,
      });

      // Try different response structures
      let users = [];
      if (Array.isArray(response.data)) {
        users = response.data;
        console.log(`✅ Found users as direct array: ${users.length}`);
      } else if (Array.isArray(response.data?.data)) {
        users = response.data.data;
        console.log(`✅ Found users in response.data.data: ${users.length}`);
      } else if (
        response.data?.data &&
        typeof response.data.data === "object"
      ) {
        // Sometimes Strapi returns { data: { id: 1, ... } } for single items
        users = Array.isArray(response.data.data) ? response.data.data : [];
        console.log(
          `⚠️  Response.data.data is not an array, trying to parse...`
        );
      } else {
        console.log(
          `⚠️  Unexpected response structure:`,
          JSON.stringify(response.data, null, 2).substring(0, 500)
        );
      }

      allUsers = allUsers.concat(users);

      const pagination =
        response.data.meta?.pagination || response.data?.meta?.pagination;
      console.log(`Pagination info:`, pagination);

      if (pagination) {
        hasMore = page < pagination.pageCount;
        console.log(
          `Page ${page} of ${pagination.pageCount}, hasMore: ${hasMore}`
        );
      } else {
        // If no pagination info, assume no more pages if we got fewer users than pageSize
        hasMore = users.length === pageSize;
        console.log(
          `No pagination info, hasMore: ${hasMore} (got ${users.length} users, pageSize: ${pageSize})`
        );
      }

      page++;

      console.log(
        `✅ Fetched page ${page - 1}: ${users.length} users (Total so far: ${allUsers.length})`
      );

      // Safety check to prevent infinite loops
      if (page > 1000) {
        console.warn("⚠️  Safety limit reached (1000 pages), stopping...");
        break;
      }
    }

    console.log(`\n📊 Total users fetched: ${allUsers.length}`);
    if (allUsers.length > 0) {
      console.log(
        `Sample user structure:`,
        JSON.stringify(allUsers[0], null, 2).substring(0, 300)
      );
    }

    return allUsers;
  } catch (error) {
    console.error("\n❌ Error fetching users:");
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error status text:", error.response?.statusText);
    console.error("Error data:", JSON.stringify(error.response?.data, null, 2));
    console.error("Full error:", error);
    throw error;
  }
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

  return rolesArray.map((item) => item?.role || item);
}

function shouldUpdateUser(user) {
  const currentRoles = getUserRoles(user);
  const currentActiveRole = user.user_role;
  const expectedActiveRole = getActiveRole(user);

  // Check if user_role needs to be updated to match assigned_roles
  const activeRoleNeedsUpdate = currentActiveRole !== expectedActiveRole;

  if (replaceAll) {
    // Always update if replace mode - replace all roles with STUDENT
    return true;
  }

  if (addOnly) {
    // Only update if user has no roles at all OR active role doesn't match
    // Also update if user_role is null/undefined
    return (
      currentRoles.length === 0 || activeRoleNeedsUpdate || !currentActiveRole
    );
  }

  // Default: Add STUDENT if not present (but keep existing roles)
  // Also update if user_role doesn't match the roles in assigned_roles or is null/undefined
  return (
    !currentRoles.includes("STUDENT") ||
    activeRoleNeedsUpdate ||
    !currentActiveRole
  );
}

function getNewRoles(user) {
  const currentRoles = getUserRoles(user);

  if (replaceAll) {
    // Replace all with just STUDENT
    return [{ role: "STUDENT" }];
  }

  if (addOnly && currentRoles.length === 0) {
    // Add STUDENT if no roles
    return [{ role: "STUDENT" }];
  }

  // Add STUDENT if not present, keep existing roles
  if (!currentRoles.includes("STUDENT")) {
    const newRoles = currentRoles.map((role) => ({ role }));
    newRoles.push({ role: "STUDENT" });
    return newRoles;
  }

  // Already has STUDENT, return current roles
  return currentRoles.map((role) => ({ role }));
}

function getActiveRole(user) {
  // user_role should match the roles in assigned_roles
  // Priority: SUPERADMIN > ADMIN > TEACHER > PARENT > MARKETING > STUDENT
  // Map assigned_roles to user_role based on what roles the user has
  const currentRoles = getUserRoles(user);

  // Priority: SUPERADMIN > ADMIN > TEACHER > PARENT > MARKETING > STUDENT
  // If user has SUPERADMIN in assigned_roles, set user_role to "SUPERADMIN"
  if (currentRoles.includes("SUPERADMIN")) {
    return "SUPERADMIN";
  }

  // If user has ADMIN in assigned_roles, set user_role to "ADMIN"
  if (currentRoles.includes("ADMIN")) {
    return "ADMIN";
  }

  // If user has TEACHER in assigned_roles, set user_role to "TEACHER"
  if (currentRoles.includes("TEACHER")) {
    return "TEACHER";
  }

  // If user has PARENT in assigned_roles, set user_role to "PARENT"
  if (currentRoles.includes("PARENT")) {
    return "PARENT";
  }

  // If user has MARKETING in assigned_roles, set user_role to "MARKETING"
  if (currentRoles.includes("MARKETING")) {
    return "MARKETING";
  }

  // If user has STUDENT in assigned_roles, set user_role to "STUDENT"
  if (currentRoles.includes("STUDENT")) {
    return "STUDENT";
  }

  // If no roles, default to "STUDENT"
  return "STUDENT";
}

async function runMigration() {
  try {
    console.log(`\n📤 Calling migration endpoint...`);
    console.log(
      `   URL: ${STRAPI_URL}/api/user-update/migrations/set-default-student-roles`
    );
    console.log(`   Options:`, { replaceAll, addOnly });

    const response = await axios.post(
      `${STRAPI_URL}/api/user-update/migrations/set-default-student-roles`,
      {
        replaceAll,
        addOnly,
      },
      { headers }
    );

    const result = response.data?.result;
    if (result && result.success) {
      console.log(`\n✅ Migration completed successfully!`);
      console.log(`   Total users: ${result.total}`);
      console.log(`   Updated: ${result.updated}`);
      console.log(`   Skipped: ${result.skipped}`);
      console.log(`   Errors: ${result.errors}`);
      return { success: true, result };
    } else {
      console.error(`\n❌ Migration failed:`, result?.error || "Unknown error");
      return { success: false, error: result?.error };
    }
  } catch (error) {
    console.error(
      `\n❌ Migration endpoint failed:`,
      error.response?.status,
      error.message
    );
    if (error.response?.data) {
      console.error(
        `   Error details:`,
        JSON.stringify(error.response.data, null, 2)
      );
    }
    throw error;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("Setting default STUDENT role for all users");
  console.log("=".repeat(60));
  console.log(
    `Mode: ${replaceAll ? "REPLACE ALL ROLES" : "ADD STUDENT (if missing)"}`
  );
  console.log(`Strapi URL: ${STRAPI_URL}`);
  console.log("");

  if (!API_TOKEN) {
    console.error("❌ ERROR: No API_TOKEN provided!");
    console.error("");
    console.error("Please provide an API token in one of these ways:");
    console.error(
      "  1. Set API_TOKEN environment variable: API_TOKEN=your_token node scripts/set-default-student-role.js"
    );
    console.error(
      "  2. Use --token flag: node scripts/set-default-student-role.js --token your_token"
    );
    console.error("  3. Update the script with your admin API token");
    console.error("");
    console.error("To get an API token:");
    console.error("  1. Log into Strapi admin panel");
    console.error("  2. Go to Settings > API Tokens");
    console.error('  3. Create a new token with "Full access" permissions');
    console.error("");
    console.error("Note: The token must be from an ADMIN or SUPERADMIN user");
    console.error("");
    process.exit(1);
  }

  if (!skipConfirm) {
    console.log("⚠️  This will update user roles for all users.");
    console.log(
      "   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n"
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } else {
    console.log("Proceeding with update (--yes flag provided)...\n");
  }

  try {
    // Call the migration endpoint
    const result = await runMigration();

    if (result.success) {
      console.log("\n" + "=".repeat(60));
      console.log("Migration Complete!");
      console.log("=".repeat(60));
      console.log(`✅ Total users processed: ${result.result.total}`);
      console.log(`✅ Successfully updated: ${result.result.updated} users`);
      console.log(
        `⏭️  Skipped (no changes needed): ${result.result.skipped} users`
      );
      if (result.result.errors > 0) {
        console.log(`❌ Errors: ${result.result.errors} users`);
      }
      console.log("");
    } else {
      console.error("\n❌ Migration failed:", result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Script failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error(
        "Response data:",
        JSON.stringify(error.response.data, null, 2)
      );

      if (error.response.status === 401) {
        console.error(
          "\n💡 Tip: Make sure your API token is valid and from an ADMIN or SUPERADMIN user"
        );
      } else if (error.response.status === 403) {
        console.error(
          "\n💡 Tip: Your user must have ADMIN or SUPERADMIN role to run this migration"
        );
      } else if (error.response.status === 404) {
        console.error(
          "\n💡 Tip: Make sure your Strapi server is running and the route is registered"
        );
        console.error(
          "   Try restarting your Strapi server to register the new route"
        );
      }
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

module.exports = { getAllUsers, getUserRoles, getNewRoles, runMigration };
