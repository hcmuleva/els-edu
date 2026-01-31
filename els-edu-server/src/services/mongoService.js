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
  { timestamps: true },
);

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    domain: { type: String, required: true },
    logo: { type: String, default: null },
  },
  { timestamps: true },
);

const domainSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
  },
  { timestamps: true },
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
  { timestamps: true },
);

// Academic Subject Schema - For School surveys
const academicSubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["academic", "non-academic"],
      required: true,
    },
    icon: { type: String, default: "BookOpen" },
    description: { type: String, default: "" },
    gradeRange: {
      min: { type: String, default: "PLAYSCHOOL" }, // Minimum grade level
      max: { type: String, default: "TWELFTH" }, // Maximum grade level
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Learning Path Skill Schema - For College surveys
const learningPathSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    learningPath: {
      type: String,
      enum: [
        "development",
        "devops",
        "data-science",
        "testing",
        "design",
        "cybersecurity",
        "other",
      ],
      required: true,
    },
    icon: { type: String, default: "Code" },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const userSurveySchema = new mongoose.Schema(
  {
    userDocumentId: { type: String, required: true }, // Strapi v5 documentId
    surveyType: {
      type: String,
      enum: ["company", "self", "school", "college", "professional"],
      required: true,
    },

    // School-specific fields
    academicCategories: [{ type: String }], // ["academic", "non-academic"]
    subjects: [
      {
        subjectId: { type: String },
        subjectName: { type: String },
        category: { type: String }, // "academic" or "non-academic"
        selfRating: { type: Number, min: 1, max: 5 },
      },
    ],

    // College-specific fields
    learningPaths: [{ type: String }], // ["development", "devops", "data-science", etc.]

    // Professional/Company fields (existing)
    company: { type: String },
    domain: { type: String },
    role: { type: String },

    // Skills (used by college and professional)
    skills: [
      {
        skillId: { type: String },
        skillName: { type: String, required: true },
        learningPath: { type: String }, // For college flow
        selfRating: { type: Number, min: 1, max: 5, required: true },
      },
    ],
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// User Quiz Results - Skill Assessment
const userQuizSchema = new mongoose.Schema(
  {
    userDocumentId: { type: String, required: true },
    type: {
      type: String,
      enum: ["SKILL", "COURSE", "CLASS"],
      default: "SKILL",
    },
    // Context: Where was this quiz taken?
    context: {
      type: {
        type: String,
        enum: [
          "COURSE",
          "CLASSROOM",
          "SKILL_ASSESSMENT",
          "DIRECT",
          "ASSIGNMENT",
        ],
        default: "DIRECT",
      },
      id: { type: String }, // Document ID of the Context Source (Classroom, Course, etc.)
      label: { type: String }, // Human readable label e.g., "Math Class 101"
    },
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
  { timestamps: true },
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
  },
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
  },
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
  },
);

// Indexes for progress tracking
classProgressSchema.index({ orgDocumentId: 1, userDocumentId: 1 });
classProgressSchema.index(
  { userDocumentId: 1, classroomId: 1 },
  { unique: true },
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
  },
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
  },
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
const AcademicSubject =
  mongoose.models.AcademicSubject ||
  mongoose.model("AcademicSubject", academicSubjectSchema);
const LearningPathSkill =
  mongoose.models.LearningPathSkill ||
  mongoose.model("LearningPathSkill", learningPathSkillSchema);
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
        idx.name === "courseId_1" ||
        (idx.key && idx.key.courseId !== undefined),
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
            `🔧 Dropping incorrect index classroomId_1 from ${name}...`,
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
    }),
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
    }),
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
 * Get academic subjects by category and grade
 * @param {Object} filters - { category, grade, search }
 */
async function getAcademicSubjects(filters = {}) {
  await connect();
  const query = { isActive: true };

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.categories && Array.isArray(filters.categories)) {
    query.category = { $in: filters.categories };
  }

  if (filters.search) {
    query.name = { $regex: filters.search, $options: "i" };
  }

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const subjects = await AcademicSubject.find(query)
    .sort({ category: 1, name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await AcademicSubject.countDocuments(query);

  return {
    data: subjects,
    pagination: {
      page,
      limit,
      total,
      hasMore: skip + subjects.length < total,
    },
  };
}

/**
 * Get learning path skills by path
 * @param {Object} filters - { learningPath, search }
 */
async function getLearningPathSkills(filters = {}) {
  await connect();
  const query = { isActive: true };

  if (filters.learningPath) {
    query.learningPath = filters.learningPath;
  }

  if (filters.learningPaths && Array.isArray(filters.learningPaths)) {
    query.learningPath = { $in: filters.learningPaths };
  }

  if (filters.search) {
    query.name = { $regex: filters.search, $options: "i" };
  }

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const skills = await LearningPathSkill.find(query)
    .sort({ learningPath: 1, name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await LearningPathSkill.countDocuments(query);

  return {
    data: skills,
    pagination: {
      page,
      limit,
      total,
      hasMore: skip + skills.length < total,
    },
  };
}

/**
 * Seed academic subjects (one-time setup)
 */
async function seedAcademicSubjects() {
  await connect();

  const subjects = [
    // Academic subjects
    { name: "Mathematics", category: "academic", icon: "Calculator" },
    { name: "Science", category: "academic", icon: "Beaker" },
    { name: "English", category: "academic", icon: "BookOpen" },
    { name: "Hindi", category: "academic", icon: "BookOpen" },
    { name: "Social Studies", category: "academic", icon: "Globe" },
    { name: "Physics", category: "academic", icon: "Atom" },
    { name: "Chemistry", category: "academic", icon: "FlaskConical" },
    { name: "Biology", category: "academic", icon: "Leaf" },
    { name: "Computer Science", category: "academic", icon: "Monitor" },
    { name: "Economics", category: "academic", icon: "TrendingUp" },
    { name: "History", category: "academic", icon: "Clock" },
    { name: "Geography", category: "academic", icon: "Map" },
    { name: "Political Science", category: "academic", icon: "Landmark" },
    { name: "Environmental Science", category: "academic", icon: "Trees" },

    // Non-academic subjects
    { name: "Art & Drawing", category: "non-academic", icon: "Palette" },
    { name: "Music", category: "non-academic", icon: "Music" },
    { name: "Dance", category: "non-academic", icon: "HeartPulse" },
    { name: "Sports", category: "non-academic", icon: "Trophy" },
    { name: "Drama & Theatre", category: "non-academic", icon: "Theater" },
    { name: "Craft & DIY", category: "non-academic", icon: "Scissors" },
    { name: "Cooking", category: "non-academic", icon: "ChefHat" },
    { name: "Gardening", category: "non-academic", icon: "Flower2" },
    { name: "Photography", category: "non-academic", icon: "Camera" },
    { name: "Public Speaking", category: "non-academic", icon: "Mic" },
    { name: "Chess", category: "non-academic", icon: "Crown" },
    { name: "Yoga & Meditation", category: "non-academic", icon: "Sparkles" },
  ];

  for (const subject of subjects) {
    await AcademicSubject.findOneAndUpdate({ name: subject.name }, subject, {
      upsert: true,
      new: true,
    });
  }

  return { success: true, count: subjects.length };
}

/**
 * Seed learning path skills (one-time setup)
 */
async function seedLearningPathSkills() {
  await connect();

  const skills = [
    // Development
    { name: "JavaScript", learningPath: "development", icon: "Code" },
    { name: "TypeScript", learningPath: "development", icon: "Code" },
    { name: "React", learningPath: "development", icon: "Code" },
    { name: "Node.js", learningPath: "development", icon: "Server" },
    { name: "Python", learningPath: "development", icon: "Code" },
    { name: "Java", learningPath: "development", icon: "Code" },
    { name: "SQL", learningPath: "development", icon: "Database" },
    { name: "MongoDB", learningPath: "development", icon: "Database" },
    { name: "Git", learningPath: "development", icon: "GitBranch" },
    { name: "HTML/CSS", learningPath: "development", icon: "Layout" },
    { name: "Vue.js", learningPath: "development", icon: "Code" },
    { name: "Angular", learningPath: "development", icon: "Code" },
    { name: "Flutter", learningPath: "development", icon: "Smartphone" },
    { name: "React Native", learningPath: "development", icon: "Smartphone" },

    // DevOps
    { name: "Docker", learningPath: "devops", icon: "Container" },
    { name: "Kubernetes", learningPath: "devops", icon: "Cloud" },
    { name: "AWS", learningPath: "devops", icon: "Cloud" },
    { name: "Azure", learningPath: "devops", icon: "Cloud" },
    { name: "GCP", learningPath: "devops", icon: "Cloud" },
    { name: "Jenkins", learningPath: "devops", icon: "Cog" },
    { name: "Terraform", learningPath: "devops", icon: "Blocks" },
    { name: "Linux", learningPath: "devops", icon: "Terminal" },
    { name: "CI/CD", learningPath: "devops", icon: "RefreshCw" },
    { name: "Ansible", learningPath: "devops", icon: "Cog" },

    // Data Science
    { name: "Machine Learning", learningPath: "data-science", icon: "Brain" },
    { name: "Deep Learning", learningPath: "data-science", icon: "Brain" },
    { name: "Pandas", learningPath: "data-science", icon: "BarChart3" },
    { name: "NumPy", learningPath: "data-science", icon: "Calculator" },
    { name: "TensorFlow", learningPath: "data-science", icon: "Brain" },
    { name: "PyTorch", learningPath: "data-science", icon: "Brain" },
    { name: "Tableau", learningPath: "data-science", icon: "BarChart3" },
    { name: "Power BI", learningPath: "data-science", icon: "BarChart3" },
    {
      name: "Data Visualization",
      learningPath: "data-science",
      icon: "PieChart",
    },
    { name: "Statistics", learningPath: "data-science", icon: "TrendingUp" },

    // Testing
    { name: "Selenium", learningPath: "testing", icon: "Bug" },
    { name: "Cypress", learningPath: "testing", icon: "Bug" },
    { name: "Jest", learningPath: "testing", icon: "Bug" },
    { name: "Postman", learningPath: "testing", icon: "Send" },
    { name: "JMeter", learningPath: "testing", icon: "Activity" },
    { name: "Manual Testing", learningPath: "testing", icon: "ClipboardCheck" },
    { name: "API Testing", learningPath: "testing", icon: "Plug" },
    { name: "Performance Testing", learningPath: "testing", icon: "Zap" },

    // Design
    { name: "Figma", learningPath: "design", icon: "Palette" },
    { name: "Sketch", learningPath: "design", icon: "Palette" },
    { name: "Adobe XD", learningPath: "design", icon: "Palette" },
    { name: "Photoshop", learningPath: "design", icon: "Image" },
    { name: "Illustrator", learningPath: "design", icon: "PenTool" },
    { name: "UI Design", learningPath: "design", icon: "Layout" },
    { name: "UX Research", learningPath: "design", icon: "Users" },
    { name: "Prototyping", learningPath: "design", icon: "Layers" },

    // Cybersecurity
    { name: "Networking", learningPath: "cybersecurity", icon: "Network" },
    {
      name: "Penetration Testing",
      learningPath: "cybersecurity",
      icon: "ShieldAlert",
    },
    { name: "Cryptography", learningPath: "cybersecurity", icon: "Lock" },
    { name: "SIEM Tools", learningPath: "cybersecurity", icon: "Shield" },
    {
      name: "Vulnerability Assessment",
      learningPath: "cybersecurity",
      icon: "Search",
    },
    {
      name: "Firewall Management",
      learningPath: "cybersecurity",
      icon: "Shield",
    },
    {
      name: "Incident Response",
      learningPath: "cybersecurity",
      icon: "AlertTriangle",
    },
  ];

  for (const skill of skills) {
    await LearningPathSkill.findOneAndUpdate({ name: skill.name }, skill, {
      upsert: true,
      new: true,
    });
  }

  return { success: true, count: skills.length };
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
        { upsert: true, new: true },
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
async function getUserQuizzes(userDocumentId, filters = {}) {
  await connect();
  const query = { userDocumentId };
  if (filters.type) query.type = filters.type;
  return UserQuiz.find(query).sort({ createdAt: -1 }).lean();
}

/**
 * Get latest quiz for user
 */
async function getLatestQuiz(userDocumentId, type = "SKILL") {
  await connect();
  return UserQuiz.findOne({ userDocumentId, type })
    .sort({ createdAt: -1 })
    .lean();
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
  // Survey System
  getAcademicSubjects,
  getLearningPathSkills,
  seedAcademicSubjects,
  seedLearningPathSkills,
  // Export models for direct access if needed
  models: {
    Skill,
    Company,
    Domain,
    Role,
    AcademicSubject,
    LearningPathSkill,
    UserSurvey,
    UserQuiz,
    UserCourse,
    Classroom,
    ClassProgress,
    UserAssignment,
    Notification,
  },
};
