// const fetch = require("node-fetch"); // Use native fetch

const API_BASE_URL = process.env.API_URL || "http://localhost:1337";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const BEARER_TOKEN = process.env.BEARER_TOKEN;

// Topics that are missing content
const MISSING_CONTENT = [
    { subject: "BeBrainee", topic: "ImpossibleToPossible" },
    { subject: "BeBrainee", topic: "magicofScience" },
    { subject: "GK", topic: "hospital&Doctors" }
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

    try {
        const res = await fetch(url.toString(), options);
        const responseData = await res.json().catch(() => ({}));
        return { status: res.status, data: responseData };
    } catch (err) {
        throw new Error(`Request failed: ${err.message}`);
    }
}

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

async function reseed() {
    log.header("🔄 Re-seeding Missing Content...");

    if (!YOUTUBE_API_KEY) {
        log.error("YOUTUBE_API_KEY is required!");
        process.exit(1);
    }

    try {
        for (const missing of MISSING_CONTENT) {
            log.header(`Processing: ${missing.subject} -> ${missing.topic}`);

            // Find subject and topic IDs
            const subjectsResp = await makeRequest("GET", `/api/subjects?filters[name][$eq]=${missing.subject}&populate=topics`);
            const subjects = subjectsResp.data.data;

            if (!subjects || subjects.length === 0) {
                log.error(`Subject "${missing.subject}" not found`);
                continue;
            }

            const subject = subjects[0];
            const topic = subject.topics.find(t => t.name === missing.topic);

            if (!topic) {
                log.error(`Topic "${missing.topic}" not found in subject "${missing.subject}"`);
                continue;
            }

            log.info(`Found subject ID: ${subject.documentId}, topic ID: ${topic.documentId}`);

            // Fetch and create content
            try {
                const query = `kids learning ${missing.subject} ${missing.topic}`;
                log.info(`Searching YouTube: "${query}"`);
                const videos = await fetchYoutubeVideos(query, 5);

                log.info(`Found ${videos.length} videos`);

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
                            subjects: { connect: [{ documentId: subject.documentId }] },
                            topic: { connect: [{ documentId: topic.documentId }] }
                        }
                    };

                    const contentResp = await makeRequest("POST", "/api/contents", contentPayload);

                    if (contentResp.status === 200 || contentResp.status === 201) {
                        process.stdout.write(".");
                    } else {
                        log.warn(`Failed to add video: ${contentResp.status}`);
                    }
                    await delay(100);
                }
                console.log("");
                log.success(`Added ${videos.length} videos to ${missing.topic}`);
            } catch (vidErr) {
                log.error(`Error fetching/adding videos: ${vidErr.message}`);
            }

            await delay(500);
        }

        log.header("✅ Re-seeding Completed!");

    } catch (err) {
        log.error(`Fatal error: ${err.message}`);
    }
}

reseed();
