const fetch = require("node-fetch");

const API_BASE_URL = "http://localhost:1337";
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0NjQ2NDUzLCJleHAiOjE3NjcyMzg0NTN9.jLD62cozlLtpijLSnWDQWRCU7BbCynMmGVQGZ12REgI";
const SUBJECT_ID = "gvzucbgegjcfiz5ojzugwj9l";

const TOPICS = [
    { name: "Ages", icon: "👨‍👩‍👦" },
    { name: "Average", icon: "📊" },
    { name: "Percentage", icon: "💯" },
    { name: "Area & Volume", icon: "📐" },
    { name: "Interest", icon: "🏦" },
    { name: "Boats & Streams", icon: "⛵" },
    { name: "Calendar", icon: "📅" },
    { name: "Clock", icon: "⏰" },
    { name: "Cubes", icon: "🎲" },
    { name: "Time & Distance", icon: "⏱️" },
    { name: "Number Series", icon: "🔢" },
    { name: "Mixtures", icon: "🧪" },
    { name: "Trains", icon: "🚆" },
    { name: "Numbers", icon: "🧮" },
    { name: "Time & Work", icon: "🏗️" },
    { name: "Partnership", icon: "🤝" },
    { name: "Probability", icon: "🃏" },
    { name: "Pipes & Cisterns", icon: "🚰" },
    { name: "Profit & Loss", icon: "💹" },
    { name: "Permutations", icon: "🔠" }
];

async function seedGK3() {
    console.log("🌱 Starting GK3 Topic Seeding...");

    for (const topic of TOPICS) {
        try {
            const payload = {
                data: {
                    name: topic.name,
                    description: `Learn about ${topic.name}`,
                    icon: topic.icon,
                    subject: { connect: [{ documentId: SUBJECT_ID }] }
                }
            };

            const response = await fetch(`${API_BASE_URL}/api/topics`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${BEARER_TOKEN}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log(`✅ Created topic: ${topic.name}`);
            } else {
                const error = await response.json();
                console.error(`❌ Failed to create ${topic.name}:`, error);
            }
        } catch (err) {
            console.error(`❌ Error processing ${topic.name}:`, err.message);
        }

        // Small delay to be nice to the server
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log("✨ Seeding completed!");
}

seedGK3();
