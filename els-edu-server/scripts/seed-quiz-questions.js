const http = require("http");
const https = require("https");

const API_BASE_URL = process.env.API_URL || "http://localhost:1337";
const BEARER_TOKEN = process.env.BEARER_TOKEN;

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
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE_URL);
        const options = {
            method: method,
            hostname: url.hostname,
            port: url.port || 1337,
            path: url.pathname + url.search,
            headers: {
                "Content-Type": "application/json",
            },
        };

        if (BEARER_TOKEN) {
            options.headers["Authorization"] = `Bearer ${BEARER_TOKEN}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const responseData = JSON.parse(body);
                    resolve({ status: res.statusCode, data: responseData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: {} });
                }
            });
        });

        req.on('error', (err) => {
            reject(new Error(`Request failed: ${err.message}`));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Question templates by topic
const QUESTION_TEMPLATES = {
    // BeBrainee topics
    "ImpossibleToPossible": [
        {
            questionText: "What does 'impossible' become when you believe in yourself?",
            options: ["Still impossible", "I'm possible", "Maybe possible", "Definitely impossible"],
            correctAnswer: 1,
            explanation: "When you add I'm before possible, impossible becomes I'm possible!",
            difficulty: "EASY"
        },
        {
            questionText: "Which quality helps turn impossible tasks into possible achievements?",
            options: ["Giving up quickly", "Hard work and determination", "Waiting for others", "Avoiding challenges"],
            correctAnswer: 1,
            explanation: "Hard work and determination help us overcome difficulties!",
            difficulty: "MEDIUM"
        }
    ],
    "magicofScience": [
        {
            questionText: "What makes plants green?",
            options: ["Water", "Chlorophyll", "Sunlight", "Soil"],
            correctAnswer: 1,
            explanation: "Chlorophyll is the green pigment in plants that helps them make food!",
            difficulty: "EASY"
        },
        {
            questionText: "What happens when you mix vinegar and baking soda?",
            options: ["Nothing", "It freezes", "It fizzes and bubbles", "It turns blue"],
            correctAnswer: 2,
            explanation: "This creates a chemical reaction that produces carbon dioxide gas, making bubbles!",
            difficulty: "MEDIUM"
        }
    ],
    "MindCalculation": [
        {
            questionText: "What is 25 + 25?",
            options: ["40", "45", "50", "55"],
            correctAnswer: 2,
            explanation: "25 + 25 = 50. You can also think of it as 2 quarters make a half!",
            difficulty: "EASY"
        },
        {
            questionText: "If you have 3 groups of 4 apples, how many apples do you have in total?",
            options: ["7", "10", "12", "16"],
            correctAnswer: 2,
            explanation: "3 × 4 = 12 apples!",
            difficulty: "MEDIUM"
        }
    ],
    // GK topics
    "History": [
        {
            questionText: "Who was the first President of India?",
            options: ["Mahatma Gandhi", "Dr. Rajendra Prasad", "Jawaharlal Nehru", "Dr. APJ Abdul Kalam"],
            correctAnswer: 1,
            explanation: "Dr. Rajendra Prasad was India's first President!",
            difficulty: "EASY"
        }
    ],
    "Geography": [
        {
            questionText: "Which is the largest ocean on Earth?",
            options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
            correctAnswer: 3,
            explanation: "The Pacific Ocean is the largest and deepest ocean!",
            difficulty: "EASY"
        }
    ],
    // Add minimal questions for other topics
    "default": [
        {
            questionText: "What did you learn from this topic?",
            options: ["Something new", "Nothing", "Everything", "I need to review"],
            correctAnswer: 0,
            explanation: "Great! Keep learning new things every day!",
            difficulty: "EASY"
        }
    ]
};

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedQuizzes() {
    log.header("🎯 Starting Quiz Seeding...");

    try {
        // Fetch all subjects with topics
        const subjectsResp = await makeRequest("GET", "/api/subjects?populate=topics");
        const subjects = subjectsResp.data.data;

        log.info(`Found ${subjects.length} subjects`);

        for (const subject of subjects) {
            log.header(`Processing Subject: ${subject.name}`);

            for (const topic of subject.topics || []) {
                log.info(`  Creating quiz for topic: ${topic.name}`);

                // Get questions for this topic or use default
                const questions = QUESTION_TEMPLATES[topic.name] || QUESTION_TEMPLATES.default;

                // Create quiz
                const quizPayload = {
                    data: {
                        title: `${topic.name} Quiz`,
                        description: `Test your knowledge about ${topic.name}!`,
                        difficulty: "MEDIUM",
                        timeLimit: 10,
                        subject: { connect: [{ documentId: subject.documentId }] },
                        topic: { connect: [{ documentId: topic.documentId }] }
                    }
                };

                const quizResp = await makeRequest("POST", "/api/quizzes", quizPayload);

                if (quizResp.status !== 200 && quizResp.status !== 201) {
                    log.error(`    Failed to create quiz: ${quizResp.status}`);
                    continue;
                }

                const quizId = quizResp.data.data.documentId;
                log.success(`    Created quiz: ${quizId}`);

                // Create questions
                for (const q of questions) {
                    const questionPayload = {
                        data: {
                            questionText: q.questionText,
                            options: q.options,
                            correctAnswer: q.correctAnswer,
                            explanation: q.explanation,
                            difficulty: q.difficulty,
                            quizzes: { connect: [{ documentId: quizId }] }
                        }
                    };

                    const questionResp = await makeRequest("POST", "/api/questions", questionPayload);

                    if (questionResp.status === 200 || questionResp.status === 201) {
                        process.stdout.write(".");
                    } else {
                        process.stdout.write("✗");
                    }
                    await delay(100);
                }
                console.log(""); // New line after dots
                log.success(`    Added ${questions.length} questions`);
                await delay(300);
            }
        }

        log.header("✅ Quiz Seeding Completed!");

    } catch (err) {
        log.error(`Fatal error: ${err.message}`);
        console.error(err);
    }
}

seedQuizzes();
