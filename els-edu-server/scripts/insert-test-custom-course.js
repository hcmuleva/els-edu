/**
 * Script to insert a test custom course into MongoDB
 * 
 * Usage:
 *   node scripts/insert-test-custom-course.js <userDocumentId> [courseName] [subjectDocId1] [subjectDocId2] ...
 * 
 * Example:
 *   node scripts/insert-test-custom-course.js qi1fzo7wzqxd57jsr8mk3ekf "My Custom Course" cxkfk9ys267ggcghros595cd s374iqwcwz0rgoiymxsa9zi2
 */

const mongoose = require("mongoose");
const mongoConfig = require("../config/mongo");

// Define the schema (same as in mongoService.js)
const userCourseSchema = new mongoose.Schema(
  {
    userDocumentId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    cover: { type: String, default: null },
    category: {
      type: String,
      enum: [
        "KIDS",
        "PRIMARY",
        "MIDDLE",
        "SCHOOL",
        "COLLEGE",
        "OLDAGE",
        "SANSKAR",
        "COMPETION",
        "PROJECT",
        "DIY",
        "EDUCATION",
      ],
      default: "EDUCATION",
    },
    subcategory: {
      type: String,
      enum: [
        "CREATIVITY",
        "COMPETION",
        "ACADEMIC",
        "ELECTROICS",
        "SOFTWARE",
        "DHARM",
        "SIKSHA",
        "GYAN",
        "SOCH",
      ],
      default: "ACADEMIC",
    },
    subjectDocumentIds: [{ type: String }],
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "COMPLETED", "PAUSED"],
      default: "ACTIVE",
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: "userCustomCourses",
  }
);

async function insertTestCourse() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      console.error("❌ Usage: node scripts/insert-test-custom-course.js <userDocumentId> [courseName] [subjectDocId1] [subjectDocId2] ...");
      console.error("\nExample:");
      console.error('  node scripts/insert-test-custom-course.js qi1fzo7wzqxd57jsr8mk3ekf "My Custom Course" cxkfk9ys267ggcghros595cd s374iqwcwz0rgoiymxsa9zi2');
      process.exit(1);
    }

    const userDocumentId = args[0];
    const courseName = args[1] || "Test Custom Course";
    const subjectDocIds = args.slice(2);

    console.log("🔄 Inserting test custom course...");
    console.log(`   User Document ID: ${userDocumentId}`);
    console.log(`   Course Name: ${courseName}`);
    console.log(`   Subject Document IDs: ${subjectDocIds.length > 0 ? subjectDocIds.join(", ") : "None"}`);

    // Connect to MongoDB
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    console.log("✅ Connected to MongoDB");

    const UserCourse = mongoose.model("UserCourse", userCourseSchema);

    // MongoDB will auto-generate _id, no need for custom courseId
    const courseData = {
      userDocumentId,
      name: courseName,
      description: `This is a test custom course created for user ${userDocumentId}`,
      category: "EDUCATION",
      subcategory: "ACADEMIC",
      subjectDocumentIds: subjectDocIds,
      status: "ACTIVE",
      progress: 0,
      startedAt: new Date(),
      completedAt: null,
      metadata: {
        createdBy: "test-script",
        createdAt: new Date().toISOString(),
      },
    };

    const course = new UserCourse(courseData);
    const savedCourse = await course.save();
    const courseId = savedCourse._id?.toString() || savedCourse.id?.toString();

    console.log("\n✅ Course inserted successfully!");
    console.log(`   Course ID (MongoDB _id): ${courseId}`);
    console.log(`   Course Name: ${savedCourse.name}`);
    console.log(`   Status: ${savedCourse.status}`);
    console.log(`   Subjects: ${savedCourse.subjectDocumentIds.length}`);

    // Verify by fetching it back
    const verify = await UserCourse.findById(savedCourse._id).lean();
    console.log("\n📊 Verification:");
    console.log(`   Found course: ${verify ? "Yes" : "No"}`);
    if (verify) {
      console.log(`   Document ID: ${verify._id}`);
      console.log(`   Created At: ${verify.createdAt}`);
    }

    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.code === 11000) {
      console.error("   Duplicate courseId - this shouldn't happen with generated IDs");
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run the script
insertTestCourse();

