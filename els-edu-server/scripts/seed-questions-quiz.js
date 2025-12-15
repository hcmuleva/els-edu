const fetch = require("node-fetch");

const API_BASE_URL = "http://127.0.0.1:1337";
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc";
const SUBJECT_ID = "pmbwp36a1m1njlsmgfdmrk03";
const TOPIC_ID = "nwrm9dm201bio8cof4ee4gi0";

const QUESTIONS = [
    {
        questionText: "A person walks 1 km south, then 1 km east, then 1 km north and returns to the starting point. Where did they start?",
        questionType: "MCQ",
        points: 10,
        timeLimit: 45,
        explanation: "This is possible at the North Pole. Walking south takes you away from the pole, walking east moves you along a latitude circle, and walking north brings you back to the pole.",
        difficulty: "medium",
        tags: ["Logic", "Geography"],
        subjectRef: { connect: [{ documentId: SUBJECT_ID }] },
        topicRef: { connect: [{ documentId: TOPIC_ID }] },
        options: [
            { id: "a", text: "The South Pole" },
            { id: "b", text: "The North Pole" },
            { id: "c", text: "The Equator" },
            { id: "d", text: "Anywhere on Earth" }
        ],
        correctAnswers: ["b"],
        level: 2
    },
    {
        questionText: "Is 0.999... (repeating) equal to 1?",
        questionType: "MCQ",
        points: 10,
        timeLimit: 45,
        explanation: "Yes. 1/3 = 0.333... Multiplying both sides by 3 gives 1 = 0.999... Algebraically, x = 0.999..., 10x = 9.999..., 9x = 9, so x = 1.",
        difficulty: "medium",
        tags: ["Math", "Logic"],
        subjectRef: { connect: [{ documentId: SUBJECT_ID }] },
        topicRef: { connect: [{ documentId: TOPIC_ID }] },
        options: [
            { id: "a", text: "Yes, they are exactly equal" },
            { id: "b", text: "No, 0.999... is slightly less than 1" },
            { id: "c", text: "It depends on the number system" },
            { id: "d", text: "Only in calculus, not in algebra" }
        ],
        correctAnswers: ["a"],
        level: 2
    },
    {
        questionText: "If you drop a feather and a hammer in a vacuum chamber on Earth, which hits the ground first?",
        questionType: "MCQ",
        points: 10,
        timeLimit: 45,
        explanation: "In a vacuum, there is no air resistance. Gravity acts on all objects with the same acceleration regardless of mass. Therefore, they hit the ground at the same time.",
        difficulty: "medium",
        tags: ["Physics", "Conceptual"],
        subjectRef: { connect: [{ documentId: SUBJECT_ID }] },
        topicRef: { connect: [{ documentId: TOPIC_ID }] },
        options: [
            { id: "a", text: "The hammer" },
            { id: "b", text: "The feather" },
            { id: "c", text: "They hit at the same time" },
            { id: "d", text: "Neither will fall" }
        ],
        correctAnswers: ["c"],
        level: 2
    },
    {
        questionText: "What is the sum of angles in a triangle drawn on a sphere?",
        questionType: "MCQ",
        points: 10,
        timeLimit: 45,
        explanation: "On a sphere (non-Euclidean geometry), the sum of angles in a triangle is always greater than 180 degrees. For example, a triangle with one vertex at the pole and two on the equator can have three 90-degree angles (270 degrees total).",
        difficulty: "hard",
        tags: ["Geometry", "Math"],
        subjectRef: { connect: [{ documentId: SUBJECT_ID }] },
        topicRef: { connect: [{ documentId: TOPIC_ID }] },
        options: [
            { id: "a", text: "Exactly 180 degrees" },
            { id: "b", text: "Less than 180 degrees" },
            { id: "c", text: "Greater than 180 degrees" },
            { id: "d", text: "It depends on the size of the sphere" }
        ],
        correctAnswers: ["c"],
        level: 2
    },
    {
        questionText: "In the Monty Hall problem, you pick one of three doors. The host opens another door revealing a goat. Should you switch your choice?",
        questionType: "MCQ",
        points: 10,
        timeLimit: 60,
        explanation: "Yes. Your initial probability of winning is 1/3. The other two doors combined have a 2/3 chance. When the host eliminates one wrong door, that 2/3 chance shifts to the remaining unchosen door.",
        difficulty: "hard",
        tags: ["Probability", "Logic"],
        subjectRef: { connect: [{ documentId: SUBJECT_ID }] },
        topicRef: { connect: [{ documentId: TOPIC_ID }] },
        options: [
            { id: "a", text: "No, it doesn't matter" },
            { id: "b", text: "Yes, switching doubles your chances" },
            { id: "c", text: "No, stick with your gut" },
            { id: "d", text: "It depends on the goat" }
        ],
        correctAnswers: ["b"],
        level: 2
    },
    {
        questionText: "Which planet has a day longer than its year?",
        questionType: "MCQ",
        points: 10,
        timeLimit: 45,
        explanation: "Venus rotates very slowly on its axis. It takes 243 Earth days to rotate once (a sidereal day) but only 225 Earth days to orbit the Sun (a year).",
        difficulty: "medium",
        tags: ["Space", "Astronomy"],
        subjectRef: { connect: [{ documentId: SUBJECT_ID }] },
        topicRef: { connect: [{ documentId: TOPIC_ID }] },
        options: [
            { id: "a", text: "Mercury" },
            { id: "b", text: "Venus" },
            { id: "c", text: "Mars" },
            { id: "d", text: "Jupiter" }
        ],
        correctAnswers: ["b"],
        level: 2
    },
    {
        questionText: "If you have 23 people in a room, what is the approximate probability that two of them share a birthday?",
        questionType: "MCQ",
        points: 10,
        timeLimit: 60,
        explanation: "This is the Birthday Paradox. With 23 people, the probability is about 50%. It seems counterintuitive, but the number of possible pairs grows quadratically.",
        difficulty: "hard",
        tags: ["Math", "Probability"],
        subjectRef: { connect: [{ documentId: SUBJECT_ID }] },
        topicRef: { connect: [{ documentId: TOPIC_ID }] },
        options: [
            { id: "a", text: "About 5%" },
            { id: "b", text: "About 23%" },
            { id: "c", text: "About 50%" },
            { id: "d", text: "About 99%" }
        ],
        correctAnswers: ["c"],
        level: 2
    },
    {
        questionText: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?",
        questionType: "MCQ",
        points: 10,
        timeLimit: 45,
        explanation: "Let ball = x. Bat = x + 1.00. Total = x + (x + 1.00) = 1.10. 2x = 0.10. x = 0.05. The ball costs $0.05.",
        difficulty: "medium",
        tags: ["Logic", "Math"],
        subjectRef: { connect: [{ documentId: SUBJECT_ID }] },
        topicRef: { connect: [{ documentId: TOPIC_ID }] },
        options: [
            { id: "a", text: "$0.10" },
            { id: "b", text: "$0.05" },
            { id: "c", text: "$0.01" },
            { id: "d", text: "$0.55" }
        ],
        correctAnswers: ["b"],
        level: 2
    },
    {
        questionText: "If a ship has all its wooden parts replaced one by one, is it still the same ship?",
        questionType: "MCQ",
        points: 10,
        timeLimit: 60,
        explanation: "This is the Ship of Theseus paradox. There is no single correct answer, but it challenges our concept of identity. In legal/functional terms, it's often treated as the same, but philosophically it's debated.",
        difficulty: "hard",
        tags: ["Philosophy", "Paradox"],
        subjectRef: { connect: [{ documentId: SUBJECT_ID }] },
        topicRef: { connect: [{ documentId: TOPIC_ID }] },
        options: [
            { id: "a", text: "Yes, absolutely" },
            { id: "b", text: "No, it is a new ship" },
            { id: "c", text: "It depends on the definition of identity" },
            { id: "d", text: "Only if the name stays the same" }
        ],
        correctAnswers: ["c"],
        level: 2
    },
    {
        questionText: "You are in a race and you overtake the person in second place. What place are you in now?",
        questionType: "MCQ",
        points: 10,
        timeLimit: 30,
        explanation: "If you overtake the person in second place, you take their position. You are now in second place.",
        difficulty: "easy",
        tags: ["Logic", "Trick"],
        subjectRef: { connect: [{ documentId: SUBJECT_ID }] },
        topicRef: { connect: [{ documentId: TOPIC_ID }] },
        options: [
            { id: "a", text: "First place" },
            { id: "b", text: "Second place" },
            { id: "c", text: "Third place" },
            { id: "d", text: "Last place" }
        ],
        correctAnswers: ["b"],
        level: 2
    }
];

async function seedQuestionsAndQuiz() {
    console.log("🚀 Starting Question and Quiz Seeding...");
    const createdQuestionIds = [];

    // 1. Create Questions
    for (const q of QUESTIONS) {
        try {
            const payload = {
                data: {
                    ...q,
                    // subjectRef and topicRef are already in the q object in this version
                }
            };

            const response = await fetch(`${API_BASE_URL}/api/questions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${BEARER_TOKEN}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Created question: "${q.questionText.substring(0, 30)}..."`);
                createdQuestionIds.push(result.data.documentId); // Use documentId for relations
            } else {
                const error = await response.json();
                console.error(`❌ Failed to create question:`, JSON.stringify(error, null, 2));
            }
        } catch (err) {
            console.error(`❌ Error creating question:`, err.message);
        }
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (createdQuestionIds.length === 0) {
        console.error("⚠️ No questions created. Aborting quiz creation.");
        return;
    }

    // 2. Create Quiz
    console.log(`📝 Creating Quiz with ${createdQuestionIds.length} questions...`);
    try {
        const quizPayload = {
            data: {
                title: "Logic & Reasoning Challenge",
                description: "Test your lateral thinking and logical reasoning skills with these tricky questions!",
                quizType: "standalone",
                difficulty: "intermediate",
                timeLimit: 600, // 10 mins total
                passingScore: 70,
                questions: { connect: createdQuestionIds.map(id => ({ documentId: id })) },
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

seedQuestionsAndQuiz();
