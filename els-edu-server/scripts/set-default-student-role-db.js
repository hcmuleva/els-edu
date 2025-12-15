/**
 * Direct database update script - updates user roles directly in the database
 * Bypasses Strapi API and updates PostgreSQL directly
 * 
 * Usage:
 *   node scripts/set-default-student-role-db.js --yes
 * 
 * Options:
 *   --replace: Replace all existing roles with just STUDENT
 *   --add-only: Only add STUDENT if user has no roles (default)
 *   --yes, -y: Skip confirmation prompt
 */

// Try to load dotenv if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, use environment variables directly
}

const { Client } = require('pg');

// Parse command line arguments
const args = process.argv.slice(2);
const replaceAll = args.includes('--replace');
const addOnly = args.includes('--add-only') || !replaceAll;
const skipConfirm = args.includes('--yes') || args.includes('-y');

// Database configuration from environment
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'strapi',
  user: process.env.DATABASE_USERNAME || 'strapi',
  password: process.env.DATABASE_PASSWORD || 'strapi',
  schema: process.env.DATABASE_SCHEMA || 'public',
};

// If DATABASE_URL is set, use it instead
if (process.env.DATABASE_URL) {
  dbConfig.connectionString = process.env.DATABASE_URL;
}

function getUserRoles(userRolesJson) {
  if (!userRolesJson) return [];
  
  try {
    if (typeof userRolesJson === 'string') {
      const parsed = JSON.parse(userRolesJson);
      if (Array.isArray(parsed)) {
        return parsed.map(item => item?.role || item);
      }
      return [];
    } else if (Array.isArray(userRolesJson)) {
      return userRolesJson.map(item => item?.role || item);
    }
    return [];
  } catch (e) {
    return [];
  }
}

function getNewRoles(currentRoles, replaceAll, addOnly) {
  if (replaceAll) {
    return [{ role: 'STUDENT' }];
  }
  
  if (addOnly && currentRoles.length === 0) {
    return [{ role: 'STUDENT' }];
  }
  
  if (!currentRoles.includes('STUDENT')) {
    const newRoles = currentRoles.map(role => ({ role }));
    newRoles.push({ role: 'STUDENT' });
    return newRoles;
  }
  
  return currentRoles.map(role => ({ role }));
}

function getActiveRole(roles) {
  if (roles.includes('SUPERADMIN')) return 'SUPERADMIN';
  if (roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('TEACHER')) return 'TEACHER';
  if (roles.includes('PARENT')) return 'PARENT';
  if (roles.includes('MARKETING')) return 'MARKETING';
  if (roles.includes('STUDENT')) return 'STUDENT';
  return 'STUDENT';
}

function shouldUpdateUser(user, replaceAll, addOnly) {
  const currentRoles = getUserRoles(user.user_roles);
  const currentActiveRole = user.user_role;
  const expectedActiveRole = getActiveRole(currentRoles);
  
  const activeRoleNeedsUpdate = currentActiveRole !== expectedActiveRole;
  
  if (replaceAll) {
    return true;
  }
  
  if (addOnly) {
    return currentRoles.length === 0 || activeRoleNeedsUpdate || !currentActiveRole;
  }
  
  return !currentRoles.includes('STUDENT') || activeRoleNeedsUpdate || !currentActiveRole;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Setting default STUDENT role for all users (Direct DB Update)');
  console.log('='.repeat(60));
  console.log(`Mode: ${replaceAll ? 'REPLACE ALL ROLES' : 'ADD STUDENT (if missing)'}`);
  console.log(`Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
  console.log('');

  if (!skipConfirm) {
    console.log('⚠️  WARNING: This will update the database directly!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const client = new Client(dbConfig);

  try {
    // Connect to database
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Fetch all users
    console.log('Fetching all users...');
    const result = await client.query(`
      SELECT id, username, email, user_role, user_roles, document_id
      FROM ${dbConfig.schema}.up_users
      ORDER BY id
    `);

    const users = result.rows;
    console.log(`✅ Fetched ${users.length} users\n`);

    // Filter users that need updating
    const usersToUpdate = users.filter(user => shouldUpdateUser(user, replaceAll, addOnly));
    console.log(`Users to update: ${usersToUpdate.length}`);
    console.log(`Users that will be skipped: ${users.length - usersToUpdate.length}\n`);

    if (usersToUpdate.length === 0) {
      console.log('✅ No users need updating. All users already have the STUDENT role.');
      await client.end();
      return;
    }

    // Show preview
    console.log('Preview of users to be updated:');
    usersToUpdate.slice(0, 5).forEach(user => {
      const currentRoles = getUserRoles(user.user_roles);
      const newRoles = getNewRoles(currentRoles, replaceAll, addOnly);
      const newActiveRole = getActiveRole(newRoles.map(r => r.role));
      console.log(`  - ${user.username || user.email} (ID: ${user.id})`);
      console.log(`    Current roles: [${currentRoles.join(', ') || 'none'}]`);
      console.log(`    Current user_role: ${user.user_role || 'null'}`);
      console.log(`    New roles: [${newRoles.map(r => r.role).join(', ')}]`);
      console.log(`    New user_role: ${newActiveRole}`);
    });
    if (usersToUpdate.length > 5) {
      console.log(`  ... and ${usersToUpdate.length - 5} more users`);
    }
    console.log('');

    if (!skipConfirm) {
      console.log('⚠️  Ready to update. Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Update users
    let successCount = 0;
    let errorCount = 0;

    console.log('Updating users in database...\n');

    for (let i = 0; i < usersToUpdate.length; i++) {
      const user = usersToUpdate[i];
      try {
        const currentRoles = getUserRoles(user.user_roles);
        const newRoles = getNewRoles(currentRoles, replaceAll, addOnly);
        const newActiveRole = getActiveRole(newRoles.map(r => r.role));

        // Update the user in database
        const updateQuery = `
          UPDATE ${dbConfig.schema}.up_users
          SET 
            user_roles = $1::jsonb,
            user_role = $2,
            updated_at = NOW()
          WHERE id = $3
        `;

        await client.query(updateQuery, [
          JSON.stringify(newRoles),
          newActiveRole,
          user.id
        ]);

        successCount++;
        
        if (i < 5 || successCount % 50 === 0) {
          console.log(`✅ Updated user ${user.id} (${user.username || user.email})`);
        }

        if (successCount % 10 === 0 && i > 0) {
          console.log(`📊 Progress: ${i + 1}/${usersToUpdate.length} users processed...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating user ${user.id} (${user.username || user.email}):`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Update Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`❌ Failed: ${errorCount} users`);
    console.log(`⏭️  Skipped: ${users.length - usersToUpdate.length} users`);
    console.log('');

    await client.end();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    console.error(error);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main };

