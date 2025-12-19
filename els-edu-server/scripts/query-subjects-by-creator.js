#!/usr/bin/env node

/**
 * Script to query and verify subjects by creator
 * 
 * Usage:
 *   node scripts/query-subjects-by-creator.js
 *   or
 *   npm run query-subjects-by-creator
 */

const path = require('path');
const { createStrapi } = require('@strapi/strapi');

// Configuration
const CREATOR_DOCUMENT_ID = process.env.CREATOR_DOCUMENT_ID || 'fx8zgcrfld6q6cr1s541i3am';

// Expected subject documentIds to verify
const EXPECTED_SUBJECT_DOCUMENT_IDS = [
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
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function querySubjectsByCreator() {
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

    // Find the creator user by documentId
    const creator = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { documentId: CREATOR_DOCUMENT_ID },
      select: ['id', 'documentId', 'username', 'email'],
    });

    if (!creator) {
      log(`❌ Error: User with documentId "${CREATOR_DOCUMENT_ID}" not found`, 'red');
      await strapi.destroy();
      process.exit(1);
    }

    log(`✅ Found creator: ${creator.username || creator.email}`, 'green');
    log(`   ID: ${creator.id}`, 'cyan');
    log(`   DocumentId: ${creator.documentId}`, 'cyan');

    // Query all subjects with this creator
    log('\n📚 Querying subjects with this creator...', 'blue');
    
    const subjectsWithCreator = await strapi.db.query('api::subject.subject').findMany({
      where: { creator: creator.id },
      select: ['id', 'documentId', 'name', 'createdAt'],
      orderBy: { id: 'asc' },
    });

    log(`\n📊 Found ${subjectsWithCreator.length} subjects with this creator`, 'blue');

    // Display all subjects
    if (subjectsWithCreator.length > 0) {
      log('\n📋 Subjects with this creator:', 'bright');
      log('='.repeat(80), 'blue');
      subjectsWithCreator.forEach((subject, index) => {
        const isExpected = EXPECTED_SUBJECT_DOCUMENT_IDS.includes(subject.documentId);
        const status = isExpected ? '✅' : '⚠️ ';
        log(`${status} [${index + 1}] ID: ${subject.id} | DocumentId: ${subject.documentId} | Name: ${subject.name || 'unnamed'}`, isExpected ? 'green' : 'yellow');
      });
      log('='.repeat(80), 'blue');
    } else {
      log('⚠️  No subjects found with this creator', 'yellow');
    }

    // Verify against expected list
    log('\n🔍 Verification against expected subjects:', 'blue');
    log('='.repeat(80), 'blue');
    
    const foundDocumentIds = subjectsWithCreator.map(s => s.documentId);
    const foundIds = subjectsWithCreator.map(s => s.id);
    
    const missing = EXPECTED_SUBJECT_DOCUMENT_IDS.filter(id => !foundDocumentIds.includes(id));
    const extra = foundDocumentIds.filter(id => !EXPECTED_SUBJECT_DOCUMENT_IDS.includes(id));
    const matched = EXPECTED_SUBJECT_DOCUMENT_IDS.filter(id => foundDocumentIds.includes(id));

    log(`✅ Matched (in expected list): ${matched.length}/${EXPECTED_SUBJECT_DOCUMENT_IDS.length}`, 'green');
    if (matched.length > 0) {
      log('\n   Matched subjects:', 'green');
      matched.forEach(docId => {
        const subject = subjectsWithCreator.find(s => s.documentId === docId);
        log(`   ✅ ${subject.name || 'unnamed'} (ID: ${subject.id}, DocId: ${docId})`, 'green');
      });
    }

    if (missing.length > 0) {
      log(`\n⚠️  Missing (expected but not found): ${missing.length}`, 'yellow');
      log('   Missing subject documentIds:', 'yellow');
      missing.forEach(docId => {
        log(`   ⚠️  ${docId}`, 'yellow');
      });
    }

    if (extra.length > 0) {
      log(`\nℹ️  Extra (found but not in expected list): ${extra.length}`, 'cyan');
      log('   Extra subjects:', 'cyan');
      extra.forEach(docId => {
        const subject = subjectsWithCreator.find(s => s.documentId === docId);
        log(`   ℹ️  ${subject.name || 'unnamed'} (ID: ${subject.id}, DocId: ${docId})`, 'cyan');
      });
    }

    log('='.repeat(80), 'blue');

    // Summary
    log('\n📊 Summary:', 'bright');
    log('='.repeat(60), 'blue');
    log(`Total subjects with this creator: ${subjectsWithCreator.length}`, 'blue');
    log(`Expected subjects: ${EXPECTED_SUBJECT_DOCUMENT_IDS.length}`, 'blue');
    log(`✅ Matched: ${matched.length}`, 'green');
    log(`⚠️  Missing: ${missing.length}`, missing.length > 0 ? 'yellow' : 'blue');
    log(`ℹ️  Extra: ${extra.length}`, extra.length > 0 ? 'cyan' : 'blue');
    log('='.repeat(60), 'blue');

    // Check individual expected subjects
    log('\n🔍 Checking each expected subject:', 'blue');
    log('='.repeat(80), 'blue');
    
    for (const expectedDocId of EXPECTED_SUBJECT_DOCUMENT_IDS) {
      const subject = await strapi.db.query('api::subject.subject').findOne({
        where: { documentId: expectedDocId },
        select: ['id', 'documentId', 'name', 'creator'],
      });

      if (!subject) {
        log(`❌ ${expectedDocId}: Subject not found in database`, 'red');
        continue;
      }

      const currentCreatorId = typeof subject.creator === 'object' 
        ? subject.creator?.id 
        : subject.creator;

      const hasCorrectCreator = currentCreatorId === creator.id;
      const status = hasCorrectCreator ? '✅' : '❌';
      const color = hasCorrectCreator ? 'green' : 'red';
      
      log(`${status} ${expectedDocId}: ${subject.name || 'unnamed'} (ID: ${subject.id})`, color);
      if (!hasCorrectCreator) {
        log(`   Current creator ID: ${currentCreatorId}, Expected: ${creator.id}`, 'red');
      }
    }
    log('='.repeat(80), 'blue');

    await strapi.destroy();
    log('\n✅ Query completed successfully!', 'green');
    
    return {
      success: true,
      creator: {
        id: creator.id,
        documentId: creator.documentId,
        username: creator.username || creator.email,
      },
      totalSubjectsWithCreator: subjectsWithCreator.length,
      expectedCount: EXPECTED_SUBJECT_DOCUMENT_IDS.length,
      matched: matched.length,
      missing: missing.length,
      extra: extra.length,
      matchedIds: matched,
      missingIds: missing,
      extraIds: extra,
      allSubjects: subjectsWithCreator,
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
  querySubjectsByCreator()
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

module.exports = { querySubjectsByCreator };

