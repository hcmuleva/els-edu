#!/usr/bin/env node

/**
 * Script to update specific subjects with a specific creator
 * 
 * Usage:
 *   node scripts/update-specific-subjects-creator.js
 *   or
 *   npm run update-specific-subjects-creator
 * 
 * Configuration:
 *   Set SUBJECT_DOCUMENT_IDS array and CREATOR_DOCUMENT_ID in the script
 */

const path = require('path');
const { createStrapi } = require('@strapi/strapi');

// Configuration - Update these values
const CREATOR_DOCUMENT_ID = process.env.CREATOR_DOCUMENT_ID || 'fx8zgcrfld6q6cr1s541i3am';

// List of subject documentIds to update
const SUBJECT_DOCUMENT_IDS = [
  'noow6dbbjk57wy7jot8xutag',
  'cty35cwddzn0q8fw3s2yyu5u',
  'pwynwua4ma7yy37jie6ft7jz',
  'lt07din33djoqgfd8a5j7tzx',
  'mhnz0flz1fu7gbogtuv5k0j8',
  'gvzucbgegjcfiz5ojzugwj9l',
  'yqnb97tgy7czk3elk8oybp2a',
  'b89surspc1lna9ci6oclmyod',
  'wp9ewqp70k2sls329nmbpv0m',
  'pmbwp36a1m1njlsmgfdmrk03',
  't5vjbozr5hkrl0c5il64c3vy',
  'kxqe6wmtua5ti2865zx2bea5',
  'iqs0sxyby1hg6qgvyk0pi7tp',
  'g8ftn6180xn6v3rfpysjmipv',
  'uxu8a34yzafp46vzzfxb834y',
  'phejqvnnjc75w7azr6no6rsx',
  'fo0sbcbewd0l7q4o25qcm79f',
  'enyiutsr31jyl7dfqvpk9ht9',
  'olbkut04p0faru7mpqtlhwow',
];

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

async function updateSpecificSubjectsCreator() {
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

    // Validate subject documentIds
    if (!SUBJECT_DOCUMENT_IDS || SUBJECT_DOCUMENT_IDS.length === 0) {
      log('❌ Error: No subject documentIds specified', 'red');
      await strapi.destroy();
      process.exit(1);
    }

    log(`📚 Processing ${SUBJECT_DOCUMENT_IDS.length} specific subjects...`, 'blue');

    let updated = 0;
    let notFound = 0;
    let skipped = 0;
    let errors = 0;
    const notFoundIds = [];
    const skippedIds = [];
    const errorIds = [];

    // Process each subject documentId
    for (const subjectDocumentId of SUBJECT_DOCUMENT_IDS) {
      try {
        // Find subject by documentId
        const subject = await strapi.db.query('api::subject.subject').findOne({
          where: { documentId: subjectDocumentId },
          select: ['id', 'documentId', 'name', 'creator'],
        });

        if (!subject) {
          notFound++;
          notFoundIds.push(subjectDocumentId);
          log(`⚠️  Subject not found: ${subjectDocumentId}`, 'yellow');
          continue;
        }

        // Check if creator is already set to the target creator
        const currentCreatorId = typeof subject.creator === 'object' 
          ? subject.creator?.id 
          : subject.creator;

        if (currentCreatorId === creator.id) {
          skipped++;
          skippedIds.push({
            documentId: subjectDocumentId,
            name: subject.name || 'unnamed',
          });
          log(`⏭️  Skipped: ${subject.name || subjectDocumentId} (already has correct creator)`, 'yellow');
          continue;
        }

        // Update the subject with the new creator
        await strapi.entityService.update('api::subject.subject', subject.id, {
          data: {
            creator: creator.id, // Use numeric ID for relations in Strapi v5
          },
        });

        updated++;
        log(`✅ Updated: ${subject.name || subjectDocumentId} (ID: ${subject.id})`, 'green');
        
      } catch (error) {
        errors++;
        errorIds.push({
          documentId: subjectDocumentId,
          error: error.message,
        });
        log(`❌ Error updating subject ${subjectDocumentId}: ${error.message}`, 'red');
      }
    }

    // Summary
    log('\n' + '='.repeat(60), 'blue');
    log('📊 Migration Summary', 'bright');
    log('='.repeat(60), 'blue');
    log(`Total subjects to process: ${SUBJECT_DOCUMENT_IDS.length}`, 'blue');
    log(`✅ Successfully updated: ${updated}`, 'green');
    log(`⏭️  Skipped (already correct): ${skipped}`, 'yellow');
    log(`⚠️  Not found: ${notFound}`, 'yellow');
    log(`❌ Errors: ${errors}`, errors > 0 ? 'red' : 'blue');
    log('='.repeat(60), 'blue');

    // Detailed breakdown
    if (notFoundIds.length > 0) {
      log('\n⚠️  Subjects not found:', 'yellow');
      notFoundIds.forEach(id => log(`   - ${id}`, 'yellow'));
    }

    if (skippedIds.length > 0) {
      log('\n⏭️  Subjects skipped (already have correct creator):', 'yellow');
      skippedIds.forEach(item => log(`   - ${item.name} (${item.documentId})`, 'yellow'));
    }

    if (errorIds.length > 0) {
      log('\n❌ Subjects with errors:', 'red');
      errorIds.forEach(item => log(`   - ${item.documentId}: ${item.error}`, 'red'));
    }

    // Verify the updates
    if (updated > 0) {
      log('\n🔍 Verifying updates...', 'blue');
      const verifyCount = await strapi.db.query('api::subject.subject').count({
        where: {
          documentId: { $in: SUBJECT_DOCUMENT_IDS },
          creator: creator.id,
        },
      });

      log(`✅ Verification: ${verifyCount} out of ${SUBJECT_DOCUMENT_IDS.length} subjects now have the creator set`, 'green');
    }

    await strapi.destroy();
    log('\n✅ Script completed successfully!', 'green');
    
    return {
      success: true,
      total: SUBJECT_DOCUMENT_IDS.length,
      updated,
      skipped,
      notFound,
      errors,
      notFoundIds,
      skippedIds,
      errorIds,
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
  updateSpecificSubjectsCreator()
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

module.exports = { updateSpecificSubjectsCreator };

