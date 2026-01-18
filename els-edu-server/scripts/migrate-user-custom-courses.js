/**
 * Migration Script: Drop and Recreate userCustomCourses Collection
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Drops the existing userCustomCourses collection (if exists)
 * 3. Creates a new collection with the proper schema and indexes
 * 
 * Usage:
 *   node scripts/migrate-user-custom-courses.js
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

// Create indexes
userCourseSchema.index({ userDocumentId: 1, status: 1 });

async function migrateUserCustomCourses() {
  try {
    console.log("🔄 Starting migration: userCustomCourses collection...");

    // Connect to MongoDB
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    // Check if collection exists and drop it
    const collections = await db.listCollections({ name: "userCustomCourses" }).toArray();
    
    if (collections.length > 0) {
      console.log("📦 Found existing userCustomCourses collection");
      
      // Get count before dropping
      const count = await db.collection("userCustomCourses").countDocuments();
      console.log(`   Current documents: ${count}`);

      if (count > 0) {
        console.log("⚠️  WARNING: Collection contains data that will be deleted!");
      }

      // Drop the collection
      await db.collection("userCustomCourses").drop();
      console.log("🗑️  Dropped userCustomCourses collection");
    } else {
      console.log("ℹ️  Collection userCustomCourses does not exist (nothing to drop)");
    }

    // Create the model to initialize the collection with schema and indexes
    const UserCourse = mongoose.model("UserCourse", userCourseSchema);
    console.log("📝 Created UserCourse model with schema");

    // Create the collection explicitly with validation
    await db.createCollection("userCustomCourses");
    console.log("✅ Created new userCustomCourses collection");

    // Ensure indexes are created
    await UserCourse.createIndexes();
    console.log("✅ Created indexes:");
    console.log("   - _id (MongoDB auto-generated, unique)");
    console.log("   - userDocumentId (indexed)");
    console.log("   - userDocumentId + status (compound index)");

    // Verify collection structure
    const indexes = await db.collection("userCustomCourses").indexes();
    console.log("\n📊 Collection indexes:");
    indexes.forEach((index) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log("\n✅ Migration complete!");
    console.log("   Collection 'userCustomCourses' is ready with the new schema structure.");

    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run migration
migrateUserCustomCourses();

