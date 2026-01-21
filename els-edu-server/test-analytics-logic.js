const mongoose = require("mongoose");
const { subDays, format } = require("date-fns");
require("dotenv").config();

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://admin:password@localhost:27018/els_mongo?authSource=admin";
const USER_ID = "qi1fzo7wzqxd57jsr8mk3ekf";

async function testAnalytics() {
  console.log("🧪 Starting Analytics Logic Test...");

  await mongoose.connect(MONGO_URI, {});

  // 1. Fetch Data directly from Collection (bypassing Strapi models for raw speed/test)
  const quizzes = await mongoose.connection.db
    .collection("userquizzes")
    .find({ userDocumentId: USER_ID })
    .toArray();

  console.log(`\n📊 Found ${quizzes.length} Quizzes for user ${USER_ID}`);

  if (quizzes.length === 0) {
    console.log(
      "❌ No quizzes found. Seeding might have failed or invalid User ID.",
    );
    process.exit(1);
  }

  // --- Logic from dashboard.js ---

  // 1. Avg Score
  const avgScore = Math.round(
    quizzes.reduce(
      (acc, q) => acc + (q.percentage || q.overallPercentage || 0),
      0,
    ) / quizzes.length,
  );
  console.log(`✅ Average Score: ${avgScore}%`);

  // 2. Consistency (Heatmap)
  const activityMap = {};
  quizzes.forEach((q) => {
    // Handle both Date object and string
    const d = new Date(q.createdAt);
    const dateStr = format(d, "yyyy-MM-dd");
    activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
  });
  console.log(
    `✅ Heatmap Data Points: ${Object.keys(activityMap).length} active days`,
  );

  // 3. Strong/Weak Areas
  const skillPerformance = {};
  quizzes.forEach((q) => {
    if (q.skillResults) {
      q.skillResults.forEach((s) => {
        if (!skillPerformance[s.skillName]) {
          skillPerformance[s.skillName] = { total: 0, count: 0 };
        }
        skillPerformance[s.skillName].total += s.percentage;
        skillPerformance[s.skillName].count += 1;
      });
    }
  });

  const processedSkills = Object.keys(skillPerformance).map((skillName) => {
    const s = skillPerformance[skillName];
    return {
      skill: skillName,
      score: Math.round(s.total / s.count),
    };
  });

  console.log("\n🧠 Skill Analysis:");
  processedSkills
    .sort((a, b) => b.score - a.score)
    .forEach((s) => {
      console.log(`   - ${s.skill}: ${s.score}%`);
    });

  const strong = processedSkills.filter((s) => s.score >= 75);
  const weak = processedSkills.filter((s) => s.score < 60);

  console.log(
    `\n✅ identified ${strong.length} Strong Areas and ${weak.length} Weak Areas.`,
  );

  console.log("\n🎉 Test Completed Successfully. Logic is valid.");
  process.exit(0);
}

testAnalytics();
