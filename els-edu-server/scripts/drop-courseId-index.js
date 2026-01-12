/**
 * Script to drop the old courseId index from userCustomCourses collection
 * 
 * This fixes the E11000 duplicate key error:
 * "E11000 duplicate key error collection: els_mongo.userCustomCourses index: courseId_1 dup key: { courseId: null }"
 * 
 * Usage:
 *   node scripts/drop-courseId-index.js
 */

const mongoose = require("mongoose");
const mongoConfig = require("../config/mongo");

async function dropCourseIdIndex() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("userCustomCourses");

    // Get all indexes
    console.log("📊 Checking indexes...");
    const indexes = await collection.indexes();
    
    console.log("\nCurrent indexes:");
    indexes.forEach((idx) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    // Check if courseId index exists
    const courseIdIndex = indexes.find((idx) => 
      idx.name === "courseId_1" || 
      (idx.key && idx.key.courseId !== undefined)
    );

    if (courseIdIndex) {
      console.log(`\n🔧 Found courseId index: ${courseIdIndex.name}`);
      console.log("   Dropping index...");
      await collection.dropIndex(courseIdIndex.name);
      console.log("✅ Successfully dropped courseId index");
    } else {
      console.log("\n✅ No courseId index found (already removed or never existed)");
    }

    // Show updated indexes
    console.log("\n📊 Updated indexes:");
    const updatedIndexes = await collection.indexes();
    updatedIndexes.forEach((idx) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    await mongoose.connection.close();
    console.log("\n✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code === 27 || error.codeName === "IndexNotFound") {
      console.log("ℹ️  Index doesn't exist (this is fine)");
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

dropCourseIdIndex();

