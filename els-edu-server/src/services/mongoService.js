/**
 * MongoDB Service for Analytics
 * Handles all MongoDB operations for survey and skills data
 */

const mongoose = require("mongoose");
const mongoConfig = require("../../config/mongo");

// Connection state
let isConnected = false;

// Schemas
const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    category: { type: String, default: "General" },
    topicDocumentIds: [{ type: String }], // Many-to-many: skill can have multiple topics
    subjectDocumentIds: [{ type: String }], // Many-to-many: skill can have multiple subjects
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    domain: { type: String, required: true },
    logo: { type: String, default: null },
  },
  { timestamps: true }
);

const domainSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    company: { type: String, required: true },
    domain: { type: String, required: true },
    requiredSkills: [
      {
        skillName: { type: String, required: true },
        requiredLevel: { type: Number, min: 1, max: 5, required: true },
      },
    ],
  },
  { timestamps: true }
);

const userSurveySchema = new mongoose.Schema(
  {
    userDocumentId: { type: String, required: true }, // Strapi v5 documentId
    surveyType: { type: String, enum: ["company", "self"], required: true },
    company: { type: String },
    domain: { type: String },
    role: { type: String },
    skills: [
      {
        skillName: { type: String, required: true },
        selfRating: { type: Number, min: 1, max: 5, required: true },
      },
    ],
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// User Quiz Results - Skill Assessment
const userQuizSchema = new mongoose.Schema(
  {
    userDocumentId: { type: String, required: true },
    surveyId: { type: mongoose.Schema.Types.ObjectId, ref: "UserSurvey" },
    company: { type: String },
    role: { type: String },
    domain: { type: String },
    skillResults: [
      {
        skillName: { type: String, required: true },
        topicDocumentIds: [{ type: String }],
        questionsAttempted: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        actualLevel: { type: Number, min: 1, max: 5, default: 1 },
      },
    ],
    questionDetails: [
      {
        questionId: { type: String },
        topicDocumentId: { type: String },
        skillName: { type: String },
        isCorrect: { type: Boolean },
        selectedAnswer: { type: String },
        correctAnswer: { type: String },
        timeSpent: { type: Number, default: 0 },
      },
    ],
    totalQuestions: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    overallPercentage: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Custom User Course Schema - Courses stored in MongoDB
const userCourseSchema = new mongoose.Schema(
  {
    userDocumentId: { type: String, required: true, index: true }, // Strapi v5 documentId
    name: { type: String, required: true },
    description: { type: String, default: "" },
    cover: { type: String, default: null }, // URL to cover image
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
    subjectDocumentIds: [{ type: String }], // Array of Strapi subject documentIds
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "COMPLETED", "PAUSED"],
      default: "ACTIVE",
    },
    progress: { type: Number, min: 0, max: 100, default: 0 }, // Course completion percentage
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // Additional flexible data
  },
  {
    timestamps: true,
    collection: "userCustomCourses", // Use the existing collection name
  }
);

// Create compound index for efficient queries
userCourseSchema.index({ userDocumentId: 1, status: 1 });

// ============================================
// CLASSROOM SYSTEM SCHEMAS
// ============================================

/**
 * Classroom Schema - Scheduled classes with content
 * Org-isolated: Each classroom belongs to one organization
 */
const classroomSchema = new mongoose.Schema(
  {
    orgDocumentId: { type: String, required: true, index: true }, // Strapi org documentId - REQUIRED for isolation
    title: { type: String, required: true },
    description: { type: String, default: "" },
    contentDocumentIds: [{ type: String }], // Ordered array of Strapi content documentIds
    assignmentDocumentIds: [{ type: String }], // Strapi assignment documentIds
    quizIds: [{ type: String }], // Strapi quiz documentIds
    startDate: { type: Date, default: null }, // null for instant classes
    endDate: { type: Date, required: true },
    isInstant: { type: Boolean, default: false }, // true = instant class, false = scheduled
    classTypes: [{ type: String }], // e.g., ["4th", "6th"] - which class standards can see this
    status: {
      type: String,
      enum: ["draft", "scheduled", "live", "completed", "cancelled"],
      default: "draft",
    },
    creatorDocumentId: { type: String, required: true }, // Teacher's user documentId
    thumbnail: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "classrooms",
  }
);

// Indexes for org isolation and performance
classroomSchema.index({ orgDocumentId: 1, status: 1, classTypes: 1 });
classroomSchema.index({ orgDocumentId: 1, startDate: 1 });
classroomSchema.index({ orgDocumentId: 1, creatorDocumentId: 1 });

/**
 * ClassProgress Schema - Tracks student progress in a class
 * Auto-created when student first accesses a class (NO ENROLLMENT)
 */
const classProgressSchema = new mongoose.Schema(
  {
    orgDocumentId: { type: String, required: true, index: true },
    userDocumentId: { type: String, required: true },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    progress: {
      completedContentIds: [{ type: String }], // Content documentIds completed
      lastAccessedContentId: { type: String, default: null },
      progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
      lastAccessedAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
    collection: "classProgress",
  }
);

// Indexes for progress tracking
classProgressSchema.index({ orgDocumentId: 1, userDocumentId: 1 });
classProgressSchema.index(
  { userDocumentId: 1, classroomId: 1 },
  { unique: true }
);
classProgressSchema.index({ orgDocumentId: 1, classroomId: 1 });

/**
 * UserAssignment Schema - Tracks assignments assigned to students
 * Auto-created when teacher creates assignment for a class standard
 */
const userAssignmentSchema = new mongoose.Schema(
  {
    orgDocumentId: { type: String, required: true, index: true },
    userDocumentId: { type: String, required: true },
    assignmentDocumentId: { type: String, required: true }, // Strapi assignment documentId
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      default: null,
    }, // Optional - if linked to specific classroom
    classStandard: { type: String, required: true }, // e.g., "6th" - the class standard this was assigned for
    assignedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },
    submission: {
      mediaUrls: [{ type: String }], // Uploaded files
      youtubeUrl: { type: String, default: null },
      textResponse: { type: String, default: null },
      submittedAt: { type: Date, default: null },
    },
    grade: {
      score: { type: Number, default: null },
      maxScore: { type: Number, default: 100 },
      feedback: { type: String, default: null },
      gradedBy: { type: String, default: null }, // Teacher documentId
      gradedAt: { type: Date, default: null },
    },
    status: {
      type: String,
      enum: ["assigned", "submitted", "graded", "returned"],
      default: "assigned",
    },
  },
  {
    timestamps: true,
    collection: "userAssignments",
  }
);

// Indexes for user assignments
userAssignmentSchema.index({ orgDocumentId: 1, userDocumentId: 1 });
userAssignmentSchema.index({ orgDocumentId: 1, assignmentDocumentId: 1 });
userAssignmentSchema.index({ orgDocumentId: 1, classStandard: 1 });
userAssignmentSchema.index({ orgDocumentId: 1, status: 1 });

/**
 * Notification Schema - Org and user scoped notifications
 * Used for class alerts, assignment notifications, grades
 */
const notificationSchema = new mongoose.Schema(
  {
    orgDocumentId: { type: String, required: true, index: true },
    userDocumentId: { type: String, default: null }, // Recipient (null for org-wide broadcast)
    classStandards: [{ type: String }], // Target class standards (empty = all)
    type: {
      type: String,
      enum: [
        "class_starting",
        "class_live",
        "new_assignment",
        "new_class",
        "grade_available",
        "class_reminder",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    relatedClassroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      default: null,
    },
    relatedAssignmentId: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

// Indexes for notifications
notificationSchema.index({ orgDocumentId: 1, userDocumentId: 1, isRead: 1 });
notificationSchema.index({
  orgDocumentId: 1,
  classStandards: 1,
  createdAt: -1,
});
notificationSchema.index({ orgDocumentId: 1, createdAt: -1 });

// Models (with check to prevent re-compilation)
const Skill = mongoose.models.Skill || mongoose.model("Skill", skillSchema);
const Company =
  mongoose.models.Company || mongoose.model("Company", companySchema);
const Domain = mongoose.models.Domain || mongoose.model("Domain", domainSchema);
const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);
const UserSurvey =
  mongoose.models.UserSurvey || mongoose.model("UserSurvey", userSurveySchema);
const UserQuiz =
  mongoose.models.UserQuiz || mongoose.model("UserQuiz", userQuizSchema);
const UserCourse =
  mongoose.models.UserCourse || mongoose.model("UserCourse", userCourseSchema);

// Classroom System Models
const Classroom =
  mongoose.models.Classroom || mongoose.model("Classroom", classroomSchema);
const ClassProgress =
  mongoose.models.ClassProgress ||
  mongoose.model("ClassProgress", classProgressSchema);
const UserAssignment =
  mongoose.models.UserAssignment ||
  mongoose.model("UserAssignment", userAssignmentSchema);
const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

/**
 * Drop old courseId index if it exists (migration helper)
 * This fixes the E11000 duplicate key error for courseId: null
 */
async function dropOldCourseIdIndex() {
  try {
    const db = mongoose.connection.db;
    if (!db) return; // Not connected yet

    const collection = db.collection("userCustomCourses");

    // Get all indexes
    const indexes = await collection.indexes();

    // Check if courseId index exists
    const courseIdIndex = indexes.find(
      (idx) =>
        idx.name === "courseId_1" || (idx.key && idx.key.courseId !== undefined)
    );

    if (courseIdIndex) {
      console.log("🔧 Dropping old courseId index from userCustomCourses...");
      await collection.dropIndex(courseIdIndex.name);
      console.log("✅ Dropped old courseId index");
    }
  } catch (error) {
    // Index might not exist, which is fine
    if (error.code !== 27 && error.codeName !== "IndexNotFound") {
      console.error("Error dropping courseId index:", error.message);
    }
  }
}

/**
 * Connect to MongoDB
 */
async function connect() {
  if (isConnected) return;

  try {
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    isConnected = true;
    console.log("🍃 MongoDB connected for Analytics");

    // Drop old courseId index if it exists (one-time migration)
    await dropOldCourseIdIndex();
    await dropIncorrectClassProgressIndex();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

/**
 * Drop incorrect unique index on classroomId if it exists
 * This fixes the issue where only one user can join a class
 */
async function dropIncorrectClassProgressIndex() {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    // Check both potential collection names
    const collectionNames = ["classProgress", "classProgresses"];

    for (const name of collectionNames) {
      const collection = db.collection(name);
      try {
        const indexes = await collection.indexes();
        const badIndex = indexes.find((idx) => idx.name === "classroomId_1");

        if (badIndex) {
          console.log(
            `🔧 Dropping incorrect index classroomId_1 from ${name}...`
          );
          await collection.dropIndex("classroomId_1");
          console.log(`✅ Dropped incorrect index from ${name}`);
        }
      } catch (err) {
        // Collection might not exist, ignore
      }
    }
  } catch (error) {
    console.error("Error dropping classroomId index:", error.message);
  }
}

/**
 * Get all skills
 */
async function getSkills() {
  await connect();
  return Skill.find().lean();
}

/**
 * Get all companies
 */
async function getCompanies() {
  await connect();
  const companies = await Company.find().lean();
  // Convert domain ObjectIds to names (for backward compatibility)
  const mongoose = require("mongoose");
  return Promise.all(
    companies.map(async (company) => {
      if (company.domain && mongoose.Types.ObjectId.isValid(company.domain)) {
        const domainDoc = await Domain.findById(company.domain).lean();
        if (domainDoc) {
          company.domain = domainDoc.name;
        }
      }
      return company;
    })
  );
}

/**
 * Get all domains
 */
async function getDomains() {
  await connect();
  return Domain.find().lean();
}

/**
 * Get roles by company and/or domain
 */
async function getRoles(filters = {}) {
  await connect();
  const query = {};
  const mongoose = require("mongoose");

  // Handle both ObjectId and name for company filter
  if (filters.company) {
    if (mongoose.Types.ObjectId.isValid(filters.company)) {
      // If it's an ObjectId, find the company name first
      const companyDoc = await Company.findById(filters.company).lean();
      if (companyDoc) {
        query.company = companyDoc.name;
      } else {
        query.company = filters.company; // Fallback
      }
    } else {
      query.company = filters.company; // It's already a name
    }
  }

  // Handle both ObjectId and name for domain filter
  if (filters.domain) {
    if (mongoose.Types.ObjectId.isValid(filters.domain)) {
      // If it's an ObjectId, find the domain name first
      const domainDoc = await Domain.findById(filters.domain).lean();
      if (domainDoc) {
        query.domain = domainDoc.name;
      } else {
        query.domain = filters.domain; // Fallback
      }
    } else {
      query.domain = filters.domain; // It's already a name
    }
  }

  const roles = await Role.find(query).lean();

  // Convert company and domain ObjectIds to names (for backward compatibility)
  return Promise.all(
    roles.map(async (role) => {
      if (role.company && mongoose.Types.ObjectId.isValid(role.company)) {
        const companyDoc = await Company.findById(role.company).lean();
        if (companyDoc) {
          role.company = companyDoc.name;
        }
      }
      if (role.domain && mongoose.Types.ObjectId.isValid(role.domain)) {
        const domainDoc = await Domain.findById(role.domain).lean();
        if (domainDoc) {
          role.domain = domainDoc.name;
        }
      }
      return role;
    })
  );
}

/**
 * Get role by name and company
 */
async function getRoleByNameAndCompany(name, company) {
  await connect();
  const mongoose = require("mongoose");

  // Handle both ObjectId and name for company
  let companyName = company;
  if (company && mongoose.Types.ObjectId.isValid(company)) {
    const companyDoc = await Company.findById(company).lean();
    if (companyDoc) {
      companyName = companyDoc.name;
    }
  }

  const role = await Role.findOne({ name, company: companyName }).lean();

  // Convert company and domain ObjectIds to names (for backward compatibility)
  if (role) {
    if (role.company && mongoose.Types.ObjectId.isValid(role.company)) {
      const companyDoc = await Company.findById(role.company).lean();
      if (companyDoc) {
        role.company = companyDoc.name;
      }
    }
    if (role.domain && mongoose.Types.ObjectId.isValid(role.domain)) {
      const domainDoc = await Domain.findById(role.domain).lean();
      if (domainDoc) {
        role.domain = domainDoc.name;
      }
    }
  }

  return role;
}

/**
 * Save user survey
 */
async function saveSurvey(surveyData) {
  await connect();
  const survey = new UserSurvey(surveyData);
  return survey.save();
}

/**
 * Get user surveys by documentId
 */
async function getUserSurveys(userDocumentId) {
  await connect();
  return UserSurvey.find({ userDocumentId }).sort({ createdAt: -1 }).lean();
}

/**
 * Get skills with topic mappings
 */
async function getSkillsWithTopics(skillNames) {
  await connect();
  return Skill.find({ name: { $in: skillNames } }).lean();
}

/**
 * Seed initial data (for development)
 */
async function seedData(data) {
  await connect();

  const { companies, domains, roles, skills } = data;

  // Upsert companies
  if (companies && companies.length) {
    for (const company of companies) {
      await Company.findOneAndUpdate({ name: company.name }, company, {
        upsert: true,
        new: true,
      });
    }
  }

  // Upsert domains
  if (domains && domains.length) {
    for (const domain of domains) {
      await Domain.findOneAndUpdate({ name: domain.name }, domain, {
        upsert: true,
        new: true,
      });
    }
  }

  // Upsert roles
  if (roles && roles.length) {
    for (const role of roles) {
      await Role.findOneAndUpdate(
        { name: role.name, company: role.company },
        role,
        { upsert: true, new: true }
      );
    }
  }

  // Upsert skills
  if (skills && skills.length) {
    for (const skill of skills) {
      await Skill.findOneAndUpdate({ name: skill.name }, skill, {
        upsert: true,
        new: true,
      });
    }
  }

  return { success: true };
}

/**
 * Save user quiz results
 */
async function saveQuizResult(quizData) {
  await connect();
  const quiz = new UserQuiz(quizData);
  return quiz.save();
}

/**
 * Get user quiz results
 */
async function getUserQuizzes(userDocumentId) {
  await connect();
  return UserQuiz.find({ userDocumentId }).sort({ createdAt: -1 }).lean();
}

/**
 * Get latest quiz for user
 */
async function getLatestQuiz(userDocumentId) {
  await connect();
  return UserQuiz.findOne({ userDocumentId }).sort({ createdAt: -1 }).lean();
}

/**
 * Calculate actual level from percentage
 * 0-39% → L1, 40-59% → L2, 60-74% → L3, 75-89% → L4, 90-100% → L5
 */
function calculateLevelFromPercentage(percentage) {
  if (percentage >= 90) return 5;
  if (percentage >= 75) return 4;
  if (percentage >= 60) return 3;
  if (percentage >= 40) return 2;
  return 1;
}

/**
 * Get custom user courses from MongoDB
 * @param {string} userDocumentId - User's Strapi documentId
 * @param {Object} filters - Optional filters (status, etc.)
 * @returns {Promise<Array>} Array of custom courses
 */
async function getUserCourses(userDocumentId, filters = {}) {
  await connect();
  const query = { userDocumentId };
  if (filters.status) query.status = filters.status;
  return UserCourse.find(query).sort({ createdAt: -1 }).lean();
}

/**
 * Save or update a custom user course
 * @param {Object} courseData - Course data
 * @returns {Promise<Object>} Saved course
 */
async function saveUserCourse(courseData) {
  await connect();

  // Remove courseId if present (old field, not used anymore)
  // This prevents issues with old indexes
  const cleanedData = { ...courseData };
  delete cleanedData.courseId;

  const course = new UserCourse(cleanedData);
  return course.save();
}

/**
 * Update a custom user course
 * @param {string} courseId - Course MongoDB _id (as string or ObjectId)
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated course
 */
async function updateUserCourse(courseId, updateData) {
  await connect();

  // Remove courseId if present (old field, not used anymore)
  const cleanedData = { ...updateData };
  delete cleanedData.courseId;

  return UserCourse.findByIdAndUpdate(courseId, cleanedData, {
    new: true,
  }).lean();
}

/**
 * Delete a custom user course
 * @param {string} courseId - Course MongoDB _id (as string or ObjectId)
 * @returns {Promise<Object>} Deletion result
 */
async function deleteUserCourse(courseId) {
  await connect();
  return UserCourse.findByIdAndDelete(courseId);
}

module.exports = {
  connect,
  getSkills,
  getCompanies,
  getDomains,
  getRoles,
  getRoleByNameAndCompany,
  saveSurvey,
  getUserSurveys,
  getSkillsWithTopics,
  seedData,
  saveQuizResult,
  getUserQuizzes,
  getLatestQuiz,
  calculateLevelFromPercentage,
  getUserCourses,
  saveUserCourse,
  updateUserCourse,
  deleteUserCourse,
  // Export models for direct access if needed
  models: {
    Skill,
    Company,
    Domain,
    Role,
    UserSurvey,
    UserQuiz,
    UserCourse,
    Classroom,
    ClassProgress,
    UserAssignment,
    Notification,
  },
};
