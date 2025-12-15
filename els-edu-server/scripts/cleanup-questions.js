const fetch = require("node-fetch");

const API_BASE_URL = process.env.API_URL || "http://localhost:1337";
const BEARER_TOKEN = process.env.BEARER_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0NjQ2NDUzLCJleHAiOjE3NjcyMzg0NTN9.jLD62cozlLtpijLSnWDQWRCU7BbCynMmGVQGZ12REgI";

/**
 * Configuration for cleanup criteria
 * You can modify these functions to match different cleanup needs
 */
const CLEANUP_CONFIG = {
    // Check if question has generic placeholder options
    isGenericQuestion: (question) => {
        if (!question.options || !Array.isArray(question.options)) {
            return false;
        }

        // Check for generic "Option A", "Option B" pattern
        const hasGenericOptions = question.options.every(opt => {
            if (typeof opt === 'object' && opt.text) {
                return opt.text === "Option A" || opt.text === "Option B" || 
                       opt.text === "Option C" || opt.text === "Option D";
            }
            return false;
        });

        // Also check if question text contains generic patterns
        const hasGenericText = question.questionText && (
            question.questionText.includes("Intermediate question") ||
            question.questionText.includes("Advanced question") ||
            question.questionText.includes("question 1 about") ||
            question.questionText.includes("question 2 about") ||
            question.questionText.includes("question 3 about")
        );

        return hasGenericOptions || hasGenericText;
    },

    // Additional filter: Check for specific option structure
    hasInvalidOptions: (question) => {
        if (!question.options || !Array.isArray(question.options)) {
            return false;
        }

        // Check if options array has exactly 2 items with "Option A" and "Option B"
        if (question.options.length === 2) {
            const opt1 = question.options[0];
            const opt2 = question.options[1];
            
            if (typeof opt1 === 'object' && typeof opt2 === 'object') {
                return opt1.text === "Option A" && opt2.text === "Option B";
            }
        }

        return false;
    },

    // Filter by subject (optional)
    filterBySubject: (question, subjectId) => {
        if (!subjectId) return true; // No filter if subjectId not provided
        return question.subjectRef === subjectId || 
               (question.subjectRef && question.subjectRef.documentId === subjectId);
    },

    // Filter by level (optional)
    filterByLevel: (question, level) => {
        if (level === null || level === undefined) return true; // No filter if level not provided
        return question.level === level;
    }
};

/**
 * Fetch all questions with pagination
 */
async function fetchAllQuestions() {
    let allQuestions = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    console.log("📦 Fetching all questions...");

    while (hasMore) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/questions?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`,
                {
                    headers: { "Authorization": `Bearer ${BEARER_TOKEN}` }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const json = await response.json();
            const questions = json.data || [];

            if (questions.length === 0) {
                hasMore = false;
            } else {
                allQuestions = allQuestions.concat(questions);
                console.log(`  Fetched page ${page}: ${questions.length} questions (Total: ${allQuestions.length})`);
                page++;
                
                // Check if there are more pages
                const pagination = json.meta?.pagination;
                if (pagination && page > pagination.pageCount) {
                    hasMore = false;
                }
            }
        } catch (error) {
            console.error(`❌ Error fetching page ${page}:`, error.message);
            hasMore = false;
        }
    }

    console.log(`✅ Total questions fetched: ${allQuestions.length}\n`);
    return allQuestions;
}

/**
 * Filter questions based on cleanup criteria
 */
function filterQuestions(questions, options = {}) {
    const {
        subjectId = null,
        level = null,
        dryRun = false
    } = options;

    console.log("🔍 Filtering questions...");
    console.log(`  Subject filter: ${subjectId || 'None'}`);
    console.log(`  Level filter: ${level !== null ? level : 'None'}`);
    console.log(`  Mode: ${dryRun ? 'DRY RUN (no deletions)' : 'DELETE MODE'}\n`);

    const filtered = questions.filter(q => {
        // Apply subject filter
        if (!CLEANUP_CONFIG.filterBySubject(q, subjectId)) {
            return false;
        }

        // Apply level filter
        if (!CLEANUP_CONFIG.filterByLevel(q, level)) {
            return false;
        }

        // Check if it's a generic question
        return CLEANUP_CONFIG.isGenericQuestion(q) || CLEANUP_CONFIG.hasInvalidOptions(q);
    });

    return filtered;
}

/**
 * Delete a question by ID
 */
async function deleteQuestion(questionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/questions/${questionId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${BEARER_TOKEN}` }
        });

        if (response.ok) {
            return { success: true, questionId };
        } else {
            const error = await response.json();
            return { success: false, questionId, error };
        }
    } catch (error) {
        return { success: false, questionId, error: error.message };
    }
}

/**
 * Main cleanup function
 */
async function cleanupQuestions(options = {}) {
    const {
        subjectId = null,
        level = null,
        dryRun = false,
        batchSize = 10,
        delayMs = 100
    } = options;

    console.log("=".repeat(60));
    console.log("🧹 Question Cleanup Script");
    console.log("=".repeat(60));
    console.log(`API URL: ${API_BASE_URL}`);
    console.log(`Dry Run: ${dryRun ? 'YES (no deletions will be made)' : 'NO (will delete questions)'}`);
    console.log("=".repeat(60));
    console.log();

    // Fetch all questions
    const allQuestions = await fetchAllQuestions();

    // Filter questions
    const questionsToDelete = filterQuestions(allQuestions, { subjectId, level, dryRun });

    if (questionsToDelete.length === 0) {
        console.log("✅ No questions found matching cleanup criteria!");
        return;
    }

    console.log(`\n📋 Found ${questionsToDelete.length} questions to ${dryRun ? 'review' : 'delete'}:`);
    console.log("-".repeat(60));

    // Display questions that will be deleted
    questionsToDelete.forEach((q, index) => {
        const qText = q.questionText ? q.questionText.substring(0, 50) + "..." : "No text";
        const qId = q.documentId || q.id;
        const qLevel = q.level || "N/A";
        const qSubject = q.subject || q.subjectRef?.name || "N/A";
        console.log(`${index + 1}. [ID: ${qId}] Level ${qLevel} | ${qSubject}`);
        console.log(`   "${qText}"`);
        if (q.options && Array.isArray(q.options)) {
            const optTexts = q.options.map(opt => 
                typeof opt === 'object' ? opt.text : opt
            ).join(", ");
            console.log(`   Options: [${optTexts}]`);
        }
        console.log();
    });

    console.log("-".repeat(60));

    if (dryRun) {
        console.log(`\n⚠️  DRY RUN MODE: No questions were deleted.`);
        console.log(`   To actually delete these questions, run with dryRun=false`);
        return;
    }

    // Confirm deletion
    console.log(`\n⚠️  WARNING: About to delete ${questionsToDelete.length} questions!`);
    console.log("   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n");
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete questions in batches
    console.log(`\n🗑️  Deleting questions in batches of ${batchSize}...\n`);

    let deletedCount = 0;
    let failedCount = 0;
    const failedQuestions = [];

    for (let i = 0; i < questionsToDelete.length; i += batchSize) {
        const batch = questionsToDelete.slice(i, i + batchSize);
        
        for (const question of batch) {
            const questionId = question.documentId || question.id;
            process.stdout.write(`Deleting question ${i + batch.indexOf(question) + 1}/${questionsToDelete.length}... `);

            const result = await deleteQuestion(questionId);
            
            if (result.success) {
                console.log("✅");
                deletedCount++;
            } else {
                console.log(`❌ Failed: ${result.error?.message || JSON.stringify(result.error)}`);
                failedCount++;
                failedQuestions.push({ question, error: result.error });
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Cleanup Summary");
    console.log("=".repeat(60));
    console.log(`✅ Successfully deleted: ${deletedCount} questions`);
    console.log(`❌ Failed to delete: ${failedCount} questions`);
    console.log(`📋 Total processed: ${questionsToDelete.length} questions`);
    console.log("=".repeat(60));

    if (failedQuestions.length > 0) {
        console.log("\n❌ Failed Questions:");
        failedQuestions.forEach(({ question, error }) => {
            const qId = question.documentId || question.id;
            console.log(`  - Question ID: ${qId}`);
            console.log(`    Error: ${JSON.stringify(error)}`);
        });
    }
}

// Command line interface
const args = process.argv.slice(2);
const options = {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    subjectId: process.env.SUBJECT_ID || null,
    level: process.env.LEVEL ? parseInt(process.env.LEVEL) : null,
    batchSize: parseInt(process.env.BATCH_SIZE) || 10,
    delayMs: parseInt(process.env.DELAY_MS) || 100
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--subject-id' && args[i + 1]) {
        options.subjectId = args[i + 1];
    }
    if (args[i] === '--level' && args[i + 1]) {
        options.level = parseInt(args[i + 1]);
    }
    if (args[i] === '--batch-size' && args[i + 1]) {
        options.batchSize = parseInt(args[i + 1]);
    }
    if (args[i] === '--delay' && args[i + 1]) {
        options.delayMs = parseInt(args[i + 1]);
    }
}

// Run cleanup
cleanupQuestions(options).catch(error => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
});


