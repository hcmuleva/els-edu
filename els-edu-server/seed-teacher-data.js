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

// Teacher and Student Document IDs
const TEACHER_DOC_ID = process.argv[2] || "hp47j4z1f2i6ur5g3tjmhv81";
const STUDENT_DOC_ID = "qi1fzo7wzqxd57jsr8mk3ekf";

const skillList = [
  "Mathematics",
  "Science",
  "Logical Reasoning",
  "English",
  "General Knowledge",
];

// Mock student names for realistic data
const studentNames = [
  "Rahul Sharma",
  "Priya Mehta",
  "Arjun Kumar",
  "Sneha Reddy",
  "Vikram Patel",
  "Ananya Singh",
  "Rohit Gupta",
  "Kavya Nair",
  "Aditya Joshi",
  "Neha Verma",
  "Siddharth Rao",
  "Pooja Iyer",
  "Karthik Menon",
  "Divya Pillai",
  "Varun Bhat",
];

async function connect() {
  await mongoose.connect(MONGO_URI, {});
  console.log("🔗 Connected to MongoDB");
}

async function seedTeacherData(teacherDocId) {
  console.log(`\n👨‍🏫 Seeding Enhanced Teacher Data for: ${teacherDocId}\n`);

  const db = mongoose.connection.db;
  const classroomCollection = db.collection("classrooms");
  const classProgressCollection = db.collection("classProgress");
  const userAssignmentCollection = db.collection("userAssignments");
  const quizCollection = db.collection("userquizzes");

  const today = new Date();

  // Clear existing data for this teacher
  await classroomCollection.deleteMany({ creatorDocumentId: teacherDocId });
  await classProgressCollection.deleteMany({ orgDocumentId: "SEED_ORG" });
  await userAssignmentCollection.deleteMany({ orgDocumentId: "SEED_ORG" });
  console.log("🗑️  Cleared existing teacher data");

  // Define classrooms
  const classDefinitions = [
    { title: "Mathematics - Grade 10", type: "Math", numStudents: 8 },
    { title: "Science - Physics Intro", type: "Science", numStudents: 6 },
    { title: "English Literature", type: "English", numStudents: 10 },
  ];

  const createdClasses = [];

  for (let c = 0; c < classDefinitions.length; c++) {
    const clsDef = classDefinitions[c];
    const classId = new mongoose.Types.ObjectId();

    // Create Classroom
    await classroomCollection.insertOne({
      _id: classId,
      orgDocumentId: "SEED_ORG",
      title: clsDef.title,
      description: `Seeded class for ${clsDef.title}`,
      status: "live",
      creatorDocumentId: teacherDocId,
      startDate: subDays(today, 30),
      endDate: endOfMonth(today),
      classTypes: ["10th"],
      createdAt: subDays(today, 30),
      updatedAt: today,
    });

    console.log(`📚 Created class: ${clsDef.title}`);

    // Create Students for this class
    const classStudents = [];
    for (let s = 0; s < clsDef.numStudents; s++) {
      const studentDocId = `MOCK_STUDENT_${c}_${s}`;
      const studentName = studentNames[s % studentNames.length];

      // Random performance tier
      const performanceTier = Math.random();
      let avgScore;
      if (performanceTier > 0.8) {
        avgScore = 85 + Math.floor(Math.random() * 15); // Top performer: 85-100
      } else if (performanceTier < 0.2) {
        avgScore = 30 + Math.floor(Math.random() * 25); // Needs attention: 30-55
      } else {
        avgScore = 55 + Math.floor(Math.random() * 30); // Average: 55-85
      }

      // Attendance rate
      const attendanceRate = 0.6 + Math.random() * 0.4; // 60-100%

      classStudents.push({
        studentDocId,
        studentName,
        avgScore,
        attendanceRate,
        performanceTier,
      });

      // Create ClassProgress record
      await classProgressCollection.insertOne({
        orgDocumentId: "SEED_ORG",
        userDocumentId: studentDocId,
        studentName: studentName,
        classroomId: classId,
        progress: {
          progressPercentage: Math.floor(Math.random() * 100),
          lastAccessedAt: subDays(today, Math.floor(Math.random() * 7)),
          avgScore: avgScore,
          attendanceRate: Math.round(attendanceRate * 100),
        },
        createdAt: subDays(today, 30),
        updatedAt: today,
      });

      // Create quiz data for student
      const numQuizzes = 2 + Math.floor(Math.random() * 4);
      for (let q = 0; q < numQuizzes; q++) {
        const quizScore = Math.max(
          0,
          Math.min(100, avgScore + (Math.random() * 20 - 10)),
        );
        await quizCollection.insertOne({
          userDocumentId: studentDocId,
          classroomId: classId,
          type: "SKILL",
          context: { type: "CLASS", label: clsDef.title },
          totalQuestions: 20,
          totalCorrect: Math.floor(20 * (quizScore / 100)),
          overallPercentage: Math.round(quizScore),
          isPassed: quizScore >= 60,
          skillResults: skillList.map((skill) => ({
            skillName: skill,
            percentage: Math.round(quizScore + (Math.random() * 20 - 10)),
            questionsAttempted: 4,
            correctAnswers: Math.floor(4 * (quizScore / 100)),
            actualLevel:
              quizScore > 80 ? 5 : quizScore > 60 ? 4 : quizScore > 40 ? 3 : 2,
          })),
          createdAt: subDays(today, Math.floor(Math.random() * 14)),
          completedAt: subDays(today, Math.floor(Math.random() * 14)),
        });
      }
    }

    // Create assignments for this class
    const assignmentStatuses = ["completed", "submitted", "assigned", "missed"];
    for (let a = 0; a < 3; a++) {
      const assignmentId = new mongoose.Types.ObjectId();

      for (const student of classStudents) {
        // Determine status based on performance and randomness
        let status;
        if (student.performanceTier > 0.8) {
          status = Math.random() > 0.1 ? "completed" : "submitted";
        } else if (student.performanceTier < 0.2) {
          status = Math.random() > 0.5 ? "missed" : "assigned";
        } else {
          status = assignmentStatuses[Math.floor(Math.random() * 3)];
        }

        await userAssignmentCollection.insertOne({
          orgDocumentId: "SEED_ORG",
          userDocumentId: student.studentDocId,
          studentName: student.studentName,
          classroomId: classId,
          assignmentId: assignmentId,
          assignmentTitle: `Assignment ${a + 1}: ${clsDef.type} Fundamentals`,
          status: status,
          grade:
            status === "completed"
              ? { score: student.avgScore + Math.floor(Math.random() * 10 - 5) }
              : null,
          submittedAt:
            status === "completed" || status === "submitted"
              ? subDays(today, Math.floor(Math.random() * 7))
              : null,
          dueDate: subDays(today, a * 7),
          createdAt: subDays(today, 14 + a * 7),
          updatedAt: today,
        });
      }
    }

    createdClasses.push({
      classId,
      title: clsDef.title,
      studentCount: classStudents.length,
      topPerformers: classStudents
        .filter((s) => s.performanceTier > 0.8)
        .map((s) => s.studentName),
      needsAttention: classStudents
        .filter((s) => s.performanceTier < 0.2)
        .map((s) => s.studentName),
    });
  }

  console.log(
    `\n✅ Created ${createdClasses.length} classes with student data`,
  );
  createdClasses.forEach((c) => {
    console.log(`   - ${c.title}: ${c.studentCount} students`);
    console.log(`     Top: ${c.topPerformers.join(", ") || "None"}`);
    console.log(
      `     Needs Attention: ${c.needsAttention.join(", ") || "None"}`,
    );
  });

  console.log("\n🎉 Teacher data seeding complete!");
}

// Run
connect().then(() => {
  seedTeacherData(TEACHER_DOC_ID).then(() => process.exit(0));
});
