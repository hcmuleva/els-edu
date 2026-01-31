"use strict";

/**
 * Analytics Controller
 * Handles API requests for analytics survey and skill recommendations
 */

const mongoService = require("../../../services/mongoService");

module.exports = {
  /**
   * Get all companies
   * GET /api/analytics/companies
   */
  async getCompanies(ctx) {
    try {
      const companies = await mongoService.getCompanies();
      ctx.body = { data: companies };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get all domains
   * GET /api/analytics/domains
   */
  async getDomains(ctx) {
    try {
      const domains = await mongoService.getDomains();
      ctx.body = { data: domains };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get roles (with optional company/domain filter)
   * GET /api/analytics/roles?company=Google&domain=Technology
   */
  async getRoles(ctx) {
    try {
      const { company, domain } = ctx.query;
      const filters = {};
      if (company) filters.company = company;
      if (domain) filters.domain = domain;

      const roles = await mongoService.getRoles(filters);
      ctx.body = { data: roles };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get skills (all or for a specific role)
   * GET /api/analytics/skills?role=Software%20Engineer&company=Google
   */
  async getSkills(ctx) {
    try {
      const { role, company } = ctx.query;

      if (role && company) {
        // Get role's required skills
        const roleData = await mongoService.getRoleByNameAndCompany(
          role,
          company,
        );
        if (roleData && roleData.requiredSkills) {
          const skillNames = roleData.requiredSkills.map((s) => s.skillName);
          const skills = await mongoService.getSkillsWithTopics(skillNames);

          // Merge with required levels
          const enrichedSkills = skills.map((skill) => {
            const req = roleData.requiredSkills.find(
              (r) => r.skillName === skill.name,
            );
            return {
              ...skill,
              requiredLevel: req ? req.requiredLevel : null,
            };
          });

          ctx.body = { data: enrichedSkills };
        } else {
          ctx.body = { data: [] };
        }
      } else {
        // Get all skills
        const skills = await mongoService.getSkills();
        ctx.body = { data: skills };
      }
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Submit survey
   * POST /api/analytics/survey
   * Regular users: single survey (replaces previous)
   * Admin/SuperAdmin: multiple surveys allowed
   */
  async submitSurvey(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      const userDocumentId = user.documentId;
      const userRole = user.user_role || "STUDENT";
      const isAdmin = ["ADMIN", "SUPERADMIN"].includes(userRole);

      // For non-admin users, delete existing survey (only 1 allowed)
      if (!isAdmin) {
        const existingSurveys =
          await mongoService.getUserSurveys(userDocumentId);
        if (existingSurveys.length > 0) {
          // Delete existing surveys for regular users
          await mongoService.models.UserSurvey.deleteMany({ userDocumentId });
        }
      }

      const surveyData = {
        userDocumentId,
        ...ctx.request.body,
      };

      const survey = await mongoService.saveSurvey(surveyData);

      // Update user's is_survey_completed flag
      await strapi.entityService.update(
        "plugin::users-permissions.user",
        user.id,
        {
          data: {
            is_survey_completed: true,
          },
        },
      );

      // Get skill-topic mappings for recommendations
      const skillNames = surveyData.skills.map((s) => s.skillName);
      const skillsWithTopics =
        await mongoService.getSkillsWithTopics(skillNames);

      // Fetch topic details from Strapi (flatten array of arrays)
      const topicDocIds = skillsWithTopics
        .filter((s) => s.topicDocumentIds && s.topicDocumentIds.length > 0)
        .flatMap((s) => s.topicDocumentIds);

      let topics = [];
      if (topicDocIds.length > 0) {
        topics = await strapi.db.query("api::topic.topic").findMany({
          where: {
            documentId: { $in: topicDocIds },
          },
          select: ["id", "documentId", "name", "topic_level"],
        });
      }

      ctx.body = {
        data: {
          survey,
          isAdmin,
          recommendations: {
            skills: skillsWithTopics,
            topics,
          },
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get user survey results
   * GET /api/analytics/survey-results
   */
  async getSurveyResults(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      const userDocumentId = user.documentId;
      const userRole = user.user_role || "STUDENT";
      const isAdmin = ["ADMIN", "SUPERADMIN"].includes(userRole);

      const surveys = await mongoService.getUserSurveys(userDocumentId);

      // Enrich with topic data for the latest survey
      if (surveys.length > 0) {
        const latestSurvey = surveys[0];
        const skillNames = latestSurvey.skills.map((s) => s.skillName);
        const skillsWithTopics =
          await mongoService.getSkillsWithTopics(skillNames);

        const topicDocIds = skillsWithTopics
          .filter((s) => s.topicDocumentIds && s.topicDocumentIds.length > 0)
          .flatMap((s) => s.topicDocumentIds);

        let topics = [];
        if (topicDocIds.length > 0) {
          topics = await strapi.db.query("api::topic.topic").findMany({
            where: {
              documentId: { $in: topicDocIds },
            },
            select: ["id", "documentId", "name", "topic_level"],
          });
        }

        ctx.body = {
          data: {
            surveys,
            isAdmin,
            latestRecommendations: {
              skills: skillsWithTopics,
              topics,
            },
          },
        };
      } else {
        ctx.body = {
          data: { surveys: [], isAdmin, latestRecommendations: null },
        };
      }
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get topics for skill quiz
   * GET /api/analytics/quiz/topics?skills=Python,JavaScript
   */
  async getQuizTopics(ctx) {
    try {
      const { skills } = ctx.query;
      if (!skills) {
        ctx.status = 400;
        ctx.body = { error: "Skills parameter required" };
        return;
      }

      const skillNames = skills.split(",").map((s) => s.trim());
      const skillsWithTopics =
        await mongoService.getSkillsWithTopics(skillNames);

      // Get unique topic documentIds from skills
      const topicDocIds = [
        ...new Set(
          skillsWithTopics
            .filter((s) => s.topicDocumentIds && s.topicDocumentIds.length > 0)
            .flatMap((s) => s.topicDocumentIds),
        ),
      ];

      if (topicDocIds.length === 0) {
        ctx.body = { data: { skills: skillsWithTopics, topics: [] } };
        return;
      }

      // Fetch topic details from Strapi (use document service for proper published filtering if needed)
      // Standardizing on unique documentId is safest
      const rawTopics = await strapi.db.query("api::topic.topic").findMany({
        where: { documentId: { $in: topicDocIds } },
        select: ["id", "documentId", "name", "topic_level"],
      });

      // Deduplicate topics by documentId (handle potential draft/published duplicates)
      const topics = Object.values(
        rawTopics.reduce((acc, topic) => {
          if (!acc[topic.documentId]) acc[topic.documentId] = topic;
          return acc;
        }, {}),
      );

      ctx.body = {
        data: {
          skills: skillsWithTopics,
          topics,
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get random questions for quiz
   * GET /api/analytics/quiz/questions?topicIds=abc,def&perTopic=5&level=3
   */
  async getQuizQuestions(ctx) {
    try {
      const { topicIds, perTopic = 5, level } = ctx.query;
      if (!topicIds) {
        ctx.status = 400;
        ctx.body = { error: "topicIds parameter required" };
        return;
      }

      // Deduplicate topic IDs
      const topicDocIds = [
        ...new Set(topicIds.split(",").map((s) => s.trim())),
      ];
      const questionsPerTopic = parseInt(perTopic, 10) || 5;
      const targetLevel = level ? parseInt(level, 10) : null;
      const allQuestions = [];

      for (const topicDocId of topicDocIds) {
        try {
          console.log(
            `Fetching questions for topic: ${topicDocId}, level: ${targetLevel || "any"}`,
          );

          // Fetch ALL questions for this topic (not limited by level initially)
          const allTopicQuestions = await strapi
            .documents("api::question.question")
            .findMany({
              filters: {
                topics: {
                  documentId: {
                    $eq: topicDocId,
                  },
                },
              },
              populate: ["topics"],
              limit: 100, // Get all available questions
            });

          if (!allTopicQuestions || allTopicQuestions.length === 0) {
            console.log(`No questions found for topic ${topicDocId}`);
            continue;
          }

          let selectedQuestions = [];

          // If level specified, prioritize by proximity to target level
          if (targetLevel) {
            // Sort by distance from target level
            const sorted = allTopicQuestions.sort((a, b) => {
              const levelA = a.level || 3; // Default to level 3 if not set
              const levelB = b.level || 3;
              const distA = Math.abs(levelA - targetLevel);
              const distB = Math.abs(levelB - targetLevel);
              return distA - distB;
            });
            selectedQuestions = sorted.slice(0, questionsPerTopic);
            console.log(
              `Found ${allTopicQuestions.length} total, selected ${selectedQuestions.length} closest to level ${targetLevel}`,
            );
          } else {
            // No level preference, just shuffle and take required amount
            const shuffled = allTopicQuestions.sort(() => Math.random() - 0.5);
            selectedQuestions = shuffled.slice(0, questionsPerTopic);
            console.log(
              `Found ${allTopicQuestions.length} total, selected ${selectedQuestions.length} random`,
            );
          }

          allQuestions.push(
            ...selectedQuestions.map((q) => ({
              ...q,
              topicDocumentId: topicDocId,
            })),
          );
        } catch (err) {
          console.error(
            `Error fetching questions for topic ${topicDocId}:`,
            err,
          );
        }
      }

      ctx.body = {
        data: {
          questions: allQuestions,
          totalQuestions: allQuestions.length,
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Submit skill quiz and calculate results
   * POST /api/analytics/quiz/submit
   */
  async submitQuiz(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      const {
        surveyId,
        company,
        role,
        domain,
        answers, // [{ questionId, topicDocumentId, skillName, selectedAnswer, correctAnswer, isCorrect, timeSpent }]
      } = ctx.request.body;

      // Calculate per-skill results
      const skillMap = {};
      for (const answer of answers) {
        if (!skillMap[answer.skillName]) {
          skillMap[answer.skillName] = {
            skillName: answer.skillName,
            topicDocumentIds: [],
            questionsAttempted: 0,
            correctAnswers: 0,
          };
        }
        skillMap[answer.skillName].questionsAttempted++;
        if (answer.isCorrect) skillMap[answer.skillName].correctAnswers++;
        if (
          answer.topicDocumentId &&
          !skillMap[answer.skillName].topicDocumentIds.includes(
            answer.topicDocumentId,
          )
        ) {
          skillMap[answer.skillName].topicDocumentIds.push(
            answer.topicDocumentId,
          );
        }
      }

      // Calculate percentage and level for each skill
      const skillResults = Object.values(skillMap).map((skill) => {
        const percentage =
          skill.questionsAttempted > 0
            ? Math.round(
                (skill.correctAnswers / skill.questionsAttempted) * 100,
              )
            : 0;
        return {
          ...skill,
          percentage,
          actualLevel: mongoService.calculateLevelFromPercentage(percentage),
        };
      });

      const totalQuestions = answers.length;
      const totalCorrect = answers.filter((a) => a.isCorrect).length;
      const overallPercentage =
        totalQuestions > 0
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : 0;

      const quizData = {
        userDocumentId: user.documentId,
        surveyId,
        company,
        role,
        domain,
        skillResults,
        questionDetails: answers,
        totalQuestions,
        totalCorrect,
        overallPercentage,
      };

      const savedQuiz = await mongoService.saveQuizResult(quizData);

      ctx.body = {
        data: {
          quiz: savedQuiz,
          summary: {
            totalQuestions,
            totalCorrect,
            overallPercentage,
            skillResults,
          },
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get user's quiz results
   * GET /api/analytics/quiz-results
   */
  async getQuizResults(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      // Use mongoService method to fetch quizzes
      // Note: getUserQuizzes returns all matching quizzes sorted by date
      const allQuizzes = await mongoService.getUserQuizzes(user.documentId, {
        type: "SKILL",
      });

      // Limit to latest 10
      const quizzes = allQuizzes.slice(0, 10);

      // Populate question details from Strapi
      for (const quiz of quizzes) {
        if (quiz.questionDetails && quiz.questionDetails.length > 0) {
          for (const detail of quiz.questionDetails) {
            try {
              // Fetch full question from Strapi
              const question = await strapi
                .documents("api::question.question")
                .findOne({
                  documentId: detail.questionId,
                });

              if (question) {
                detail.questionText = question.questionText;
                detail.options = question.options;

                // Map answer IDs to text
                if (detail.selectedAnswer) {
                  const selectedOpt = question.options?.find(
                    (o) =>
                      String(o.id) === String(detail.selectedAnswer) ||
                      o.documentId === detail.selectedAnswer,
                  );
                  // The field in JSON is 'option', not 'text'
                  detail.selectedAnswerText = selectedOpt
                    ? selectedOpt.option
                    : "Unknown";
                }

                if (detail.correctAnswer) {
                  const correctOpt = question.options?.find(
                    (o) =>
                      String(o.id) === String(detail.correctAnswer) ||
                      o.documentId === detail.correctAnswer,
                  );
                  detail.correctAnswerText = correctOpt
                    ? correctOpt.option
                    : "Unknown";
                }
              } else {
                console.warn(`Question not found: ${detail.questionId}`);
              }
            } catch (err) {
              console.error(
                `Error populating question ${detail.questionId}:`,
                err,
              );
            }
          }
        }
      }

      ctx.body = {
        data: {
          quizzes,
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Link topics to a skill
   * POST /api/analytics/skills/link-topics
   * Body: { skillName: "Python", topicDocumentIds: ["abc"], subjectDocumentIds: ["xyz"] }
   */
  async linkTopicsToSkill(ctx) {
    try {
      const { skillName, topicDocumentIds, subjectDocumentIds } =
        ctx.request.body;

      if (!skillName || !topicDocumentIds) {
        ctx.status = 400;
        ctx.body = { error: "skillName and topicDocumentIds required" };
        return;
      }

      await mongoService.connect();

      // Build update object
      const updateData = { topicDocumentIds: topicDocumentIds };
      if (subjectDocumentIds) {
        updateData.subjectDocumentIds = subjectDocumentIds;
      }

      const result = await mongoService.models.Skill.findOneAndUpdate(
        { name: skillName },
        { $set: updateData },
        { new: true },
      );

      if (!result) {
        ctx.status = 404;
        ctx.body = { error: `Skill "${skillName}" not found` };
        return;
      }

      ctx.body = {
        data: {
          message: `Linked ${topicDocumentIds.length} topics${subjectDocumentIds ? " and " + subjectDocumentIds.length + " subjects" : ""} to ${skillName}`,
          skill: result,
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get all Strapi topics (for linking)
   * GET /api/analytics/strapi-topics
   */
  async getStrapiTopics(ctx) {
    try {
      const topics = await strapi.db.query("api::topic.topic").findMany({
        select: ["id", "documentId", "name", "topic_level"],
        limit: 100,
      });
      ctx.body = { data: topics };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Seed data (for development)
   * POST /api/analytics/seed
   */
  async seedData(ctx) {
    try {
      // Job roles data from reference
      const jobRoles = [
        {
          role: "Software Engineer",
          company: "Google",
          domain: "Technology",
          skills: [
            { skill: "Python", requiredLevel: 4 },
            { skill: "Algorithms", requiredLevel: 4 },
            { skill: "System Design", requiredLevel: 4 },
            { skill: "Git", requiredLevel: 3 },
            { skill: "Unit Testing", requiredLevel: 3 },
          ],
        },
        {
          role: "Data Scientist",
          company: "Amazon",
          domain: "Technology",
          skills: [
            { skill: "Python", requiredLevel: 5 },
            { skill: "Statistics", requiredLevel: 4 },
            { skill: "Machine Learning", requiredLevel: 4 },
            { skill: "SQL", requiredLevel: 4 },
            { skill: "Data Visualization", requiredLevel: 3 },
          ],
        },
        {
          role: "Frontend Developer",
          company: "Meta",
          domain: "Technology",
          skills: [
            { skill: "JavaScript", requiredLevel: 5 },
            { skill: "React", requiredLevel: 4 },
            { skill: "CSS", requiredLevel: 4 },
            { skill: "Unit Testing", requiredLevel: 3 },
            { skill: "Git", requiredLevel: 3 },
          ],
        },
        {
          role: "DevOps Engineer",
          company: "Netflix",
          domain: "Technology",
          skills: [
            { skill: "Docker", requiredLevel: 5 },
            { skill: "Kubernetes", requiredLevel: 4 },
            { skill: "CI/CD", requiredLevel: 4 },
            { skill: "AWS", requiredLevel: 4 },
            { skill: "Python", requiredLevel: 3 },
          ],
        },
        {
          role: "Backend Engineer",
          company: "Uber",
          domain: "Technology",
          skills: [
            { skill: "System Design", requiredLevel: 4 },
            { skill: "SQL", requiredLevel: 4 },
            { skill: "Python", requiredLevel: 4 },
            { skill: "Git", requiredLevel: 3 },
            { skill: "Unit Testing", requiredLevel: 3 },
          ],
        },
        {
          role: "ML Engineer",
          company: "OpenAI",
          domain: "Technology",
          skills: [
            { skill: "Python", requiredLevel: 5 },
            { skill: "Machine Learning", requiredLevel: 5 },
            { skill: "Statistics", requiredLevel: 4 },
            { skill: "Algorithms", requiredLevel: 4 },
            { skill: "System Design", requiredLevel: 3 },
          ],
        },
      ];

      // Extract unique data
      const companies = [...new Set(jobRoles.map((j) => j.company))].map(
        (name) => ({
          name,
          domain: jobRoles.find((j) => j.company === name).domain,
        }),
      );

      const domains = [...new Set(jobRoles.map((j) => j.domain))].map(
        (name) => ({
          name,
          description: `${name} sector`,
        }),
      );

      const allSkills = new Set();
      jobRoles.forEach((jr) =>
        jr.skills.forEach((s) => allSkills.add(s.skill)),
      );
      const skills = [...allSkills].map((name) => ({
        name,
        category: "Technical",
        topicDocumentIds: [], // Will be mapped manually later (many-to-many)
        description: `${name} skill`,
      }));

      const roles = jobRoles.map((jr) => ({
        name: jr.role,
        company: jr.company,
        domain: jr.domain,
        requiredSkills: jr.skills.map((s) => ({
          skillName: s.skill,
          requiredLevel: s.requiredLevel,
        })),
      }));

      await mongoService.seedData({ companies, domains, skills, roles });

      ctx.body = {
        data: {
          message: "Data seeded successfully",
          counts: {
            companies: companies.length,
            domains: domains.length,
            skills: skills.length,
            roles: roles.length,
          },
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get academic subjects for school surveys
   * GET /api/analytics/subjects?categories=academic,non-academic&search=math&page=1&limit=20
   */
  async getAcademicSubjects(ctx) {
    try {
      const { categories, category, search, page, limit } = ctx.query;

      const filters = {};
      if (categories) {
        filters.categories = categories.split(",").map((c) => c.trim());
      } else if (category) {
        filters.category = category;
      }
      if (search) filters.search = search;
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);

      const result = await mongoService.getAcademicSubjects(filters);
      ctx.body = result;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get learning path skills for college surveys
   * GET /api/analytics/learning-skills?learningPaths=development,devops&search=react&page=1&limit=20
   */
  async getLearningPathSkills(ctx) {
    try {
      const { learningPaths, learningPath, search, page, limit } = ctx.query;

      const filters = {};
      if (learningPaths) {
        filters.learningPaths = learningPaths.split(",").map((lp) => lp.trim());
      } else if (learningPath) {
        filters.learningPath = learningPath;
      }
      if (search) filters.search = search;
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);

      const result = await mongoService.getLearningPathSkills(filters);
      ctx.body = result;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Seed academic subjects and learning path skills
   * POST /api/analytics/seed-survey-data
   */
  async seedSurveyData(ctx) {
    try {
      const subjectsResult = await mongoService.seedAcademicSubjects();
      const skillsResult = await mongoService.seedLearningPathSkills();

      ctx.body = {
        data: {
          message: "Survey data seeded successfully",
          subjects: subjectsResult,
          skills: skillsResult,
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },
};
