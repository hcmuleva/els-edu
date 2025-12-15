const http = require("http");
const https = require("https");
// const fetch = require("node-fetch"); // Use native fetch

const API_BASE_URL = process.env.API_URL || "http://localhost:1337";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Data Structure
const SUBJECTS_DATA = [
    {
        title: "BeBrainee",
        topics: ["ImpossibleToPossible", "magicofScience", "MindCalculation"],
        grade: "FOURTH" // Default grade
    },
    {
        title: "GK",
        topics: ["History", "Geography", "state", "country", "animal", "hospital&Doctors"],
        grade: "FOURTH"
    },
    {
        title: "Creativity",
        topics: ["Waste2Best", "ProductOfWaste"],
        grade: "FOURTH"
    },
    {
        title: "Competition",
        topics: ["Navodaya", "Olympiads"],
        grade: "FOURTH"
    },
    {
        title: "News",
        topics: ["Science", "GK", "DIY", "ThoughOftheDay", "Puzzle"],
        grade: "FOURTH"
    },
    {
        title: "Stories",
        topics: ["moral", "motivation", "isnpiring"],
        grade: "FOURTH"
    }
];

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.blue}${msg}${colors.reset}`),
};

const BEARER_TOKEN = process.env.BEARER_TOKEN;

/**
 * REST request helper
 */
async function makeRequest(method, path, data = null) {
    const url = new URL(path, API_BASE_URL);
    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json",
        },
    };

    if (BEARER_TOKEN) {
        options.headers["Authorization"] = `Bearer ${BEARER_TOKEN}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    console.log(`[DEBUG] Fetching: ${url.toString()}`);

    try {
        const res = await fetch(url.toString(), options);
        const responseData = await res.json().catch(() => ({}));
        return { status: res.status, data: responseData };
    } catch (err) {
        throw new Error(`Request failed: ${err.message}`);
    }
}

/**
 * Fetch videos from YouTube
 */
async function fetchYoutubeVideos(query, limit = 5) {
    if (!YOUTUBE_API_KEY) {
        throw new Error("YOUTUBE_API_KEY is missing");
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${limit}&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.items.map(item => ({
        title: item.snippet.title,
        description: item.snippet.description,
        youtubeurl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.high.url
    }));
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seed() {
    log.header("🌱 Starting Content Seeding...");

    if (!YOUTUBE_API_KEY) {
        log.error("YOUTUBE_API_KEY is required!");
        process.exit(1);
    }

    try {
        for (const subjectData of SUBJECTS_DATA) {
            log.header(`Processing Subject: ${subjectData.title}`);

            // 1. Create Subject
            let subjectId;
            try {
                // Check if exists first (optional, but good for idempotency)
                // For simplicity, we just try to create. Strapi might duplicate if not unique, 
                // but typically we'd check. Let's assume fresh seed or just create new.
                const subjectPayload = {
                    data: {
                        name: subjectData.title,
                        grade: subjectData.grade
                    }
                };

                const subResp = await makeRequest("POST", "/api/subjects", subjectPayload);

                if (subResp.status === 200 || subResp.status === 201) {
                    subjectId = subResp.data.data.documentId;
                    log.success(`Created Subject: ${subjectData.title}`);
                } else {
                    log.error(`Failed to create subject ${subjectData.title}: ${subResp.status}`);
                    continue;
                }
            } catch (err) {
                console.error(err);
                log.error(`Error creating subject: ${err.message}`);
                continue;
            }

            // 2. Process Topics
            for (const topicName of subjectData.topics) {
                let topicId;
                try {
                    const topicPayload = {
                        data: {
                            name: topicName,
                            description: `Learn about ${topicName}`,
                            subject: { connect: [{ documentId: subjectId }] } // Assuming relation exists
                        }
                    };

                    const topicResp = await makeRequest("POST", "/api/topics", topicPayload);

                    if (topicResp.status === 200 || topicResp.status === 201) {
                        topicId = topicResp.data.data.documentId;
                        log.success(`  Created Topic: ${topicName}`);
                    } else {
                        log.error(`  Failed to create topic ${topicName}: ${topicResp.status}`);
                        continue;
                    }

                    // 3. Fetch and Create Content
                    log.info(`    Fetching videos for ${topicName}...`);
                    try {
                        // Search query: "kids learning [Subject] [Topic]"
                        const query = `kids learning ${subjectData.title} ${topicName}`;
                        const videos = await fetchYoutubeVideos(query, 5);

                        for (const video of videos) {
                            const contentPayload = {
                                data: {
                                    title: video.title,
                                    type: "YOUTUBE",
                                    youtubeurl: video.youtubeurl,
                                    json_description: [
                                        {
                                            type: "paragraph",
                                            children: [{ text: video.description || "No description", type: "text" }]
                                        }
                                    ],
                                    // Relations
                                    subjects: { connect: [{ documentId: subjectId }] },
                                    topic: { connect: [{ documentId: topicId }] }
                                }
                            };

                            const contentResp = await makeRequest("POST", "/api/contents", contentPayload);

                            if (contentResp.status === 200 || contentResp.status === 201) {
                                // log.success(`    Added video: ${video.title.substring(0, 30)}...`);
                                process.stdout.write(".");
                            } else {
                                log.warn(`    Failed to add video: ${contentResp.status}`);
                            }
                            await delay(100); // Rate limiting
                        }
                        console.log(""); // Newline after dots
                    } catch (vidErr) {
                        log.error(`    Error fetching/adding videos: ${vidErr.message}`);
                    }

                } catch (topicErr) {
                    log.error(`  Error processing topic ${topicName}: ${topicErr.message}`);
                }
                await delay(500);
            }
        }

        log.header("✅ Content Seeding Completed!");

    } catch (err) {
        log.error(`Fatal error: ${err.message}`);
    }
}

seed();
