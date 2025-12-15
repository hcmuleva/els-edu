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

async function listData() {
    console.log("📦 Fetching Data...");

    const topics = await fetchAll("topics");
    const questions = await fetchAll("questions");

    // Table 1: Available Topics
    console.log("\n### Table 1: Available Topics (in DB)");
    console.log("| Topic Name | Document ID |");
    console.log("|---|---|");
    topics.sort((a, b) => (a.name || "").localeCompare(b.name || "")).forEach(t => {
        console.log(`| ${t.name} | ${t.documentId} |`);
    });

    // Table 2: Question Chapters
    const chapterCounts = {};
    questions.forEach(q => {
        const ch = q.chapter ? q.chapter.trim() : "(No Chapter)";
        chapterCounts[ch] = (chapterCounts[ch] || 0) + 1;
    });

    console.log("\n### Table 2: Question Chapters (from Questions)");
    console.log("| Chapter Name | Question Count |");
    console.log("|---|---|");
    Object.keys(chapterCounts).sort().forEach(ch => {
        console.log(`| ${ch} | ${chapterCounts[ch]} |`);
    });
}

listData();
