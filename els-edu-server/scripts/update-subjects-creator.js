#!/usr/bin/env node

/**
 * Script to update all subjects with a specific creator
 * 
 * Usage:
 *   node scripts/update-subjects-creator.js
 *   or
 *   npm run update-subjects-creator
 * 
 * Configuration:
 *   Set CREATOR_DOCUMENT_ID in the script or pass as environment variable
 */

const path = require('path');
const { createStrapi } = require('@strapi/strapi');

// Configuration
const CREATOR_DOCUMENT_ID = process.env.CREATOR_DOCUMENT_ID || 'fx8zgcrfld6q6cr1s541i3am';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function updateSubjectsCreator() {
  let strapi;
  
  try {
    log('🚀 Starting Strapi application...', 'blue');
    
    // Initialize Strapi
    strapi = createStrapi({
      distDir: path.resolve(__dirname, '../dist'),
      appDir: path.resolve(__dirname, '..'),
    });
    await strapi.load();

    log('✅ Strapi initialized successfully', 'green');
    log(`📋 Looking for creator with documentId: ${CREATOR_DOCUMENT_ID}`, 'blue');

    // Find the creator user by documentId using db.query (more reliable)
    const creator = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { documentId: CREATOR_DOCUMENT_ID },
      select: ['id', 'documentId', 'username', 'email'],
    });

    if (!creator) {
      log(`❌ Error: User with documentId "${CREATOR_DOCUMENT_ID}" not found`, 'red');
      await strapi.destroy();
      process.exit(1);
    }
    log(`✅ Found creator: ${creator.username || creator.email} (ID: ${creator.id}, documentId: ${creator.documentId})`, 'green');

    // Fetch all subjects
    log('📚 Fetching all subjects...', 'blue');
    const subjects = await strapi.entityService.findMany('api::subject.subject', {
      fields: ['id', 'documentId', 'name', 'creator'],
      limit: -1, // Get all subjects
    });

    log(`📊 Found ${subjects.length} subjects to process`, 'blue');

    if (subjects.length === 0) {
      log('ℹ️  No subjects found. Nothing to update.', 'yellow');
      await strapi.destroy();
      process.exit(0);
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Update each subject
    for (const subject of subjects) {
      try {
        // Check if creator is already set to the target creator
        const currentCreatorId = typeof subject.creator === 'object' 
          ? subject.creator?.id 
          : subject.creator;

        if (currentCreatorId === creator.id) {
          skipped++;
          continue;
        }

        // Update the subject with the new creator
        await strapi.entityService.update('api::subject.subject', subject.id, {
          data: {
            creator: creator.id, // Use numeric ID for relations in Strapi v5
          },
        });

        updated++;
        
        // Log progress every 10 updates
        if (updated % 10 === 0) {
          log(`⏳ Updated ${updated} subjects so far...`, 'yellow');
        }
      } catch (error) {
        errors++;
        log(`❌ Error updating subject ${subject.id} (${subject.name || 'unnamed'}): ${error.message}`, 'red');
      }
    }

    // Summary
    log('\n' + '='.repeat(60), 'blue');
    log('📊 Migration Summary', 'bright');
    log('='.repeat(60), 'blue');
    log(`Total subjects: ${subjects.length}`, 'blue');
    log(`✅ Updated: ${updated}`, 'green');
    log(`⏭️  Skipped (already correct): ${skipped}`, 'yellow');
    log(`❌ Errors: ${errors}`, errors > 0 ? 'red' : 'blue');
    log('='.repeat(60), 'blue');

    // Verify the update
    log('\n🔍 Verifying updates...', 'blue');
    const verifySubjects = await strapi.entityService.findMany('api::subject.subject', {
      filters: {
        creator: creator.id,
      },
      fields: ['id', 'name'],
      limit: 5, // Sample check
    });

    log(`✅ Verification: Found ${verifySubjects.length} subjects with creator set (sample check)`, 'green');

    await strapi.destroy();
    log('\n✅ Script completed successfully!', 'green');
    
    return {
      success: true,
      total: subjects.length,
      updated,
      skipped,
      errors,
    };
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    
    if (strapi) {
      await strapi.destroy();
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  updateSubjectsCreator()
    .then((result) => {
      if (result && result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      log(`\n❌ Unhandled error: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { updateSubjectsCreator };

