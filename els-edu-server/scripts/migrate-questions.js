const fetch = require("node-fetch");

const API_BASE_URL = "http://localhost:1337";
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0NjQ2NDUzLCJleHAiOjE3NjcyMzg0NTN9.jLD62cozlLtpijLSnWDQWRCU7BbCynMmGVQGZ12REgI";

async function fetchAll(endpoint) {
    let allData = [];
    let page = 1;
    const pageSize = 100;

    while (true) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/${endpoint}?pagination[page]=${page}&pagination[pageSize]=${pageSize}`, {
                headers: { "Authorization": `Bearer ${BEARER_TOKEN}` }
            });
            const json = await response.json();

            if (!json.data || json.data.length === 0) break;

            allData = allData.concat(json.data);

            if (page >= json.meta.pagination.pageCount) break;
            page++;
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            break;
        }
    }
    return allData;
}

const SUBJECT_ID = "gvzucbgegjcfiz5ojzugwj9l";

function normalize(str) {
    if (!str) return "";
    return str.toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9\s]/g, "") // Remove special chars
        .replace(/\s+/g, " ") // Collapse whitespace
        .trim();
}

async function migrateQuestions() {
    console.log("🚀 Starting Enhanced Question Migration...");

    // 1. Fetch GK3 Subject and its Topics
    console.log(`📦 Fetching GK3 Subject (${SUBJECT_ID})...`);
    let gk3Topics = [];
    try {
        const response = await fetch(`${API_BASE_URL}/api/subjects/${SUBJECT_ID}?populate=topics`, {
            headers: { "Authorization": `Bearer ${BEARER_TOKEN}` }
        });
        const json = await response.json();
        if (json.data && json.data.topics) {
            gk3Topics = json.data.topics;
        }
    } catch (error) {
        console.error("❌ Failed to fetch GK3 topics:", error);
        return;
    }

    console.log(`✅ Found ${gk3Topics.length} Topics in GK3.`);

    // Build Topic Map (Normalized Name -> DocumentId)
    const topicMap = {};
    gk3Topics.forEach(t => {
        if (t.name) {
            const norm = normalize(t.name);
            topicMap[norm] = t.documentId;
            console.log(`   Mapped: "${t.name}" -> "${norm}"`);
        }
    });

    // 2. Fetch all Questions
    console.log("❓ Fetching Questions...");
    const questions = await fetchAll("questions");
    console.log(`✅ Found ${questions.length} Questions to process.`);

    // 3. Update Questions
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const q of questions) {
        const chapterName = q.chapter;

        let updates = {};
        let needsUpdate = false;

        // Try to match Topic
        if (chapterName) {
            const normChapter = normalize(chapterName);
            const topicId = topicMap[normChapter];

            if (topicId) {
                updates.topicRef = topicId;
                updates.subjectRef = SUBJECT_ID; // Force GK3 Subject if topic matches
                needsUpdate = true;
                console.log(`✅ Match: "${chapterName}" -> Topic ID ${topicId}`);
            } else {
                // console.warn(`⚠️ No match for chapter: "${chapterName}" (norm: "${normChapter}")`);
            }
        }

        if (needsUpdate) {
            try {
                const updateResp = await fetch(`${API_BASE_URL}/api/questions/${q.documentId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${BEARER_TOKEN}`
                    },
                    body: JSON.stringify({ data: updates })
                });

                if (updateResp.ok) {
                    updatedCount++;
                } else {
                    const err = await updateResp.json();
                    console.error(`❌ Failed to update question ${q.documentId}:`, JSON.stringify(err));
                    errorCount++;
                }
            } catch (error) {
                console.error(`❌ Error updating question ${q.documentId}:`, error.message);
                errorCount++;
            }
        } else {
            skippedCount++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 20));
    }

    console.log("\n\n🎉 Migration Completed!");
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
}

migrateQuestions();
