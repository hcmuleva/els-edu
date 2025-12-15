const fetch = require("node-fetch");

const API_BASE_URL = "http://127.0.0.1:1337";
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc";
const SUBJECT_ID = "pmbwp36a1m1njlsmgfdmrk03";
const TOPIC_ID = "nwrm9dm201bio8cof4ee4gi0";

async function seedQuiz() {
    console.log("🚀 Starting Quiz Creation...");

    // 1. Fetch existing questions for the topic
    let questionIds = [];
    try {
        const response = await fetch(`${API_BASE_URL}/api/questions?filters[topicRef][documentId][$eq]=${TOPIC_ID}&fields[0]=documentId`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${BEARER_TOKEN}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            questionIds = result.data.map(q => q.documentId);
            console.log(`✅ Found ${questionIds.length} questions for topic.`);
        } else {
            const error = await response.json();
            console.error(`❌ Failed to fetch questions:`, JSON.stringify(error, null, 2));
            return;
        }
    } catch (err) {
        console.error(`❌ Error fetching questions:`, err.message);
        return;
    }

    if (questionIds.length === 0) {
        console.error("⚠️ No questions found. Aborting quiz creation.");
        return;
    }

    // 2. Create Quiz
    console.log(`📝 Creating Quiz with ${questionIds.length} questions...`);
    try {
        const quizPayload = {
            data: {
                title: "Logic & Reasoning Challenge",
                description: "Test your lateral thinking and logical reasoning skills with these tricky questions!",
                quizType: "standalone",
                difficulty: "intermediate",
                timeLimit: 300, // Fixed: Max 300
                passingScore: 70,
                questions: { connect: questionIds.map(id => ({ documentId: id })) },
                topic: { connect: [{ documentId: TOPIC_ID }] },
                subject: { connect: [{ documentId: SUBJECT_ID }] },
                isActive: true
            }
        };

        const response = await fetch(`${API_BASE_URL}/api/quizzes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${BEARER_TOKEN}`
            },
            body: JSON.stringify(quizPayload)
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Created Quiz: "${result.data.title}" (ID: ${result.data.documentId})`);
        } else {
            const error = await response.json();
            console.error(`❌ Failed to create quiz:`, JSON.stringify(error, null, 2));
        }

    } catch (err) {
        console.error(`❌ Error creating quiz:`, err.message);
    }

    console.log("✨ Seeding process completed!");
}

seedQuiz();
