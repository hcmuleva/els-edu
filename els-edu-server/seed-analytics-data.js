const mongoose = require("mongoose");
const {
  subDays,
  format,
  startOfMonth,
  eachDayOfInterval,
  endOfMonth,
} = require("date-fns");
require("dotenv").config();

// Configuration
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://admin:password@localhost:27018/els_mongo?authSource=admin";

// Get User Document ID from command line or use default
const USER_DOCUMENT_ID = process.argv[2] || "qi1fzo7wzqxd57jsr8mk3ekf";

const skillList = [
  "Mathematics",
  "Science",
  "Logical Reasoning",
  "English",
  "General Knowledge",
];

// Connect
async function connect() {
  await mongoose.connect(MONGO_URI, {});
  console.log("🔗 Connected to MongoDB");
}

async function seedData(targetUserDocId) {
  if (!targetUserDocId) {
    console.error("❌ Please provide a userDocumentId");
    console.log("Usage: node seed-analytics-data.js <userDocumentId>");
    return;
  }

  console.log(
    `\n📊 Seeding comprehensive analytics data for User: ${targetUserDocId}\n`,
  );

  const db = mongoose.connection.db;
  const quizCollection = db.collection("userquizzes");

  // Clear existing data for this user
  const deleteResult = await quizCollection.deleteMany({
    userDocumentId: targetUserDocId,
  });
  console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing quizzes`);

  // Generate data for current month AND last month (for comprehensive coverage)
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const lastMonthStart = startOfMonth(subDays(currentMonthStart, 1));

  // Get all days from last month start to today
  const allDays = eachDayOfInterval({
    start: lastMonthStart,
    end: today,
  });

  const quizzes = [];

  allDays.forEach((day) => {
    // Random number of quizzes per day (0-4, weighted toward 0-2)
    const quizCount =
      Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < quizCount; i++) {
      const score = 40 + Math.floor(Math.random() * 60); // Score 40-100

      // Generate skill results
      const skillResults = skillList.map((skill) => {
        const skillScore = Math.max(
          0,
          Math.min(100, score + (Math.random() * 30 - 15)),
        ); // Variation around base score
        return {
          skillName: skill,
          percentage: Math.round(skillScore),
          questionsAttempted: 5,
          correctAnswers: Math.floor(5 * (skillScore / 100)),
          actualLevel:
            skillScore > 80 ? 5 : skillScore > 60 ? 4 : skillScore > 40 ? 3 : 2,
        };
      });

      quizzes.push({
        userDocumentId: targetUserDocId,
        type: "SKILL",
        context: { type: "DIRECT", label: "Practice Quiz" },
        totalQuestions: 25,
        totalCorrect: Math.floor(25 * (score / 100)),
        overallPercentage: score,
        isPassed: score >= 60,
        skillResults: skillResults,
        createdAt: day,
        completedAt: day,
        updatedAt: day,
      });
    }
  });

  // Insert all quizzes
  if (quizzes.length > 0) {
    await quizCollection.insertMany(quizzes);
  }

  console.log(
    `✅ Seeded ${quizzes.length} quizzes across ${allDays.length} days`,
  );

  // ... (Quizzes seeding logic remains above)

  // ==========================================
  // SEED TEACHER DATA (Classrooms & Progress)
  // ==========================================
  const classroomCollection = db.collection("classrooms");
  const classProgressCollection = db.collection("classProgress");

  // Clear existing classrooms for this teacher
  await classroomCollection.deleteMany({ creatorDocumentId: targetUserDocId });
  await classProgressCollection.deleteMany({ orgDocumentId: "SEED_ORG" }); // Cleanup mock progress

  console.log(`\n👨‍🏫 Seeding Teacher Data for ${targetUserDocId}...`);

  const mockClasses = [
    {
      title: "Mathematics - Grade 10",
      type: "Math",
      students: 25,
      avgGrade: 85,
    },
    {
      title: "Science - Physics Intro",
      type: "Science",
      students: 18,
      avgGrade: 72,
    },
    {
      title: "Advanced Algebra",
      type: "Math",
      students: 12,
      avgGrade: 92,
    },
  ];

  const createdClassrooms = [];

  for (const cls of mockClasses) {
    const classId = new mongoose.Types.ObjectId();

    // Create Classroom
    createdClassrooms.push({
      _id: classId,
      orgDocumentId: "SEED_ORG", // Mock Org
      title: cls.title,
      description: `Mock seeded class for ${cls.title}`,
      status: "live",
      creatorDocumentId: targetUserDocId,
      startDate: subDays(today, 30),
      endDate: endOfMonth(today),
      classTypes: ["10th"],
      createdAt: subDays(today, 30),
      updatedAt: today,
    });

    // Create Mock Students Progress for this class
    // We'll generate 'cls.students' number of progress records
    const progressRecords = [];
    for (let i = 0; i < cls.students; i++) {
      progressRecords.push({
        orgDocumentId: "SEED_ORG",
        userDocumentId: `MOCK_STUDENT_${i}`,
        classroomId: classId,
        progress: {
          progressPercentage: Math.floor(Math.random() * 100),
          lastAccessedAt: subDays(today, Math.floor(Math.random() * 7)),
        },
        createdAt: subDays(today, 30),
        updatedAt: today,
      });
    }

    if (progressRecords.length > 0) {
      await classProgressCollection.insertMany(progressRecords);
    }
  }

  if (createdClassrooms.length > 0) {
    await classroomCollection.insertMany(createdClassrooms);
  }

  console.log(
    `✅ Seeded ${createdClassrooms.length} classrooms for Teacher Dashboard`,
  );
  console.log(`✅ Seeded mock student progress for these classes`);

  console.log(
    "\n🎉 Seed complete! Dashboard should now show rich data for STUDENT and TEACHER roles.",
  );

  process.exit(0);
}

// Run
connect().then(() => {
  seedData(USER_DOCUMENT_ID);
});
