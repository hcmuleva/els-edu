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

/**
 * Connect to MongoDB
 */
async function connect() {
  if (isConnected) return;

  try {
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    isConnected = true;
    console.log("🍃 MongoDB connected for Analytics");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
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
  return Company.find().lean();
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
  if (filters.company) query.company = filters.company;
  if (filters.domain) query.domain = filters.domain;
  return Role.find(query).lean();
}

/**
 * Get role by name and company
 */
async function getRoleByNameAndCompany(name, company) {
  await connect();
  return Role.findOne({ name, company }).lean();
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
  // Export models for direct access if needed
  models: { Skill, Company, Domain, Role, UserSurvey, UserQuiz },
};
