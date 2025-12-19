#!/usr/bin/env node

/**
 * Simple script to query subjects by creator using Strapi API
 * Requires Strapi server to be running
 * 
 * Usage:
 *   node scripts/query-subjects-by-creator-simple.js
 *   or
 *   npm run query-subjects-by-creator-simple
 */

const axios = require('axios');

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
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
  try {
    log('🔍 Querying Strapi API...', 'blue');
    log(`📡 API URL: ${STRAPI_URL}`, 'cyan');
    log(`📋 Creator DocumentId: ${CREATOR_DOCUMENT_ID}`, 'cyan');

    // Step 1: Find the creator user
    log('\n📋 Step 1: Finding creator user...', 'blue');
    const userResponse = await axios.get(`${STRAPI_URL}/api/users`, {
      params: {
        'filters[documentId][$eq]': CREATOR_DOCUMENT_ID,
        'populate': '*',
      },
    });

    const users = Array.isArray(userResponse.data) 
      ? userResponse.data 
      : (userResponse.data?.data || []);

    if (users.length === 0) {
      log(`❌ Error: User with documentId "${CREATOR_DOCUMENT_ID}" not found`, 'red');
      process.exit(1);
    }

    const creator = users[0];
    log(`✅ Found creator: ${creator.username || creator.email}`, 'green');
    log(`   ID: ${creator.id}`, 'cyan');
    log(`   DocumentId: ${creator.documentId}`, 'cyan');

    // Step 2: Query subjects with this creator
    log('\n📚 Step 2: Querying subjects with this creator...', 'blue');
    const subjectsResponse = await axios.get(`${STRAPI_URL}/api/subjects`, {
      params: {
        'filters[creator][id][$eq]': creator.id,
        'populate': '*',
        'pagination[pageSize]': 1000,
      },
    });

    const subjects = Array.isArray(subjectsResponse.data)
      ? subjectsResponse.data
      : (subjectsResponse.data?.data || []);

    log(`\n📊 Found ${subjects.length} subjects with this creator`, 'blue');

    // Display all subjects
    if (subjects.length > 0) {
      log('\n📋 Subjects with this creator:', 'bright');
      log('='.repeat(80), 'blue');
      subjects.forEach((subject, index) => {
        const isExpected = EXPECTED_SUBJECT_DOCUMENT_IDS.includes(subject.documentId);
        const status = isExpected ? '✅' : '⚠️ ';
        log(`${status} [${index + 1}] ID: ${subject.id} | DocumentId: ${subject.documentId} | Name: ${subject.name || 'unnamed'}`, isExpected ? 'green' : 'yellow');
      });
      log('='.repeat(80), 'blue');
    } else {
      log('⚠️  No subjects found with this creator', 'yellow');
    }

    // Step 3: Verify against expected list
    log('\n🔍 Step 3: Verification against expected subjects:', 'blue');
    log('='.repeat(80), 'blue');
    
    const foundDocumentIds = subjects.map(s => s.documentId);
    const matched = EXPECTED_SUBJECT_DOCUMENT_IDS.filter(id => foundDocumentIds.includes(id));
    const missing = EXPECTED_SUBJECT_DOCUMENT_IDS.filter(id => !foundDocumentIds.includes(id));
    const extra = foundDocumentIds.filter(id => !EXPECTED_SUBJECT_DOCUMENT_IDS.includes(id));

    log(`✅ Matched (in expected list): ${matched.length}/${EXPECTED_SUBJECT_DOCUMENT_IDS.length}`, 'green');
    if (matched.length > 0) {
      log('\n   Matched subjects:', 'green');
      matched.forEach(docId => {
        const subject = subjects.find(s => s.documentId === docId);
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
        const subject = subjects.find(s => s.documentId === docId);
        log(`   ℹ️  ${subject.name || 'unnamed'} (ID: ${subject.id}, DocId: ${docId})`, 'cyan');
      });
    }

    log('='.repeat(80), 'blue');

    // Step 4: Check each expected subject individually
    log('\n🔍 Step 4: Checking each expected subject individually:', 'blue');
    log('='.repeat(80), 'blue');
    
    for (const expectedDocId of EXPECTED_SUBJECT_DOCUMENT_IDS) {
      try {
        const subjectResponse = await axios.get(`${STRAPI_URL}/api/subjects`, {
          params: {
            'filters[documentId][$eq]': expectedDocId,
            'populate': ['creator'],
          },
        });

        const subjectData = Array.isArray(subjectResponse.data)
          ? subjectResponse.data[0]
          : (subjectResponse.data?.data?.[0] || null);

        if (!subjectData) {
          log(`❌ ${expectedDocId}: Subject not found in database`, 'red');
          continue;
        }

        const currentCreatorId = typeof subjectData.creator === 'object' 
          ? subjectData.creator?.id 
          : subjectData.creator;

        const hasCorrectCreator = currentCreatorId === creator.id;
        const status = hasCorrectCreator ? '✅' : '❌';
        const color = hasCorrectCreator ? 'green' : 'red';
        
        log(`${status} ${expectedDocId}: ${subjectData.name || 'unnamed'} (ID: ${subjectData.id})`, color);
        if (!hasCorrectCreator) {
          log(`   Current creator ID: ${currentCreatorId || 'null'}, Expected: ${creator.id}`, 'red');
        }
      } catch (error) {
        log(`❌ ${expectedDocId}: Error checking - ${error.message}`, 'red');
      }
    }
    log('='.repeat(80), 'blue');

    // Summary
    log('\n📊 Summary:', 'bright');
    log('='.repeat(60), 'blue');
    log(`Total subjects with this creator: ${subjects.length}`, 'blue');
    log(`Expected subjects: ${EXPECTED_SUBJECT_DOCUMENT_IDS.length}`, 'blue');
    log(`✅ Matched: ${matched.length}`, 'green');
    log(`⚠️  Missing: ${missing.length}`, missing.length > 0 ? 'yellow' : 'blue');
    log(`ℹ️  Extra: ${extra.length}`, extra.length > 0 ? 'cyan' : 'blue');
    log('='.repeat(60), 'blue');

    log('\n✅ Query completed successfully!', 'green');
    
    return {
      success: true,
      creator: {
        id: creator.id,
        documentId: creator.documentId,
        username: creator.username || creator.email,
      },
      totalSubjectsWithCreator: subjects.length,
      expectedCount: EXPECTED_SUBJECT_DOCUMENT_IDS.length,
      matched: matched.length,
      missing: missing.length,
      extra: extra.length,
      matchedIds: matched,
      missingIds: missing,
      extraIds: extra,
      allSubjects: subjects,
    };
  } catch (error) {
    if (error.response) {
      log(`\n❌ API Error: ${error.response.status} ${error.response.statusText}`, 'red');
      log(`   URL: ${error.config?.url}`, 'red');
      log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else if (error.code === 'ECONNREFUSED') {
      log(`\n❌ Connection Error: Cannot connect to Strapi at ${STRAPI_URL}`, 'red');
      log('   Make sure Strapi server is running!', 'yellow');
    } else {
      log(`\n❌ Fatal error: ${error.message}`, 'red');
      console.error(error);
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

