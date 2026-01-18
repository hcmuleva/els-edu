"use strict";

/**
 * User Courses Controller
 * Fetches courses from both Strapi (subscriptions) and MongoDB (custom courses)
 */

const mongoService = require("../../../services/mongoService");
const { publishToAbly } = require("../../../../config/ably");

module.exports = {
  /**
   * Get all courses for the authenticated user
   * Combines Strapi courses (from subscriptions) and MongoDB custom courses
   * GET /api/user-courses/my-courses
   */
  async getMyCourses(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      const userDocumentId = user.documentId;
      const { status, includeInactive } = ctx.query;

      // Fetch Strapi courses from subscriptions
      const strapiInstance = global.strapi || strapi;
      const strapiSubscriptions = await strapiInstance
        .documents("api::usersubscription.usersubscription")
        .findMany({
          filters: {
            user: { documentId: userDocumentId },
            paymentstatus: "ACTIVE",
          },
          populate: {
            course: {
              fields: [
                "documentId",
                "name",
                "description",
                "category",
                "subcategory",
                "condition",
                "privacy",
                "visibility",
              ],
              populate: {
                cover: {
                  fields: ["url", "formats", "alternativeText"],
                },
                subjects: {
                  fields: ["documentId", "name", "grade", "level"],
                  populate: {
                    coverpage: { fields: ["url"] },
                  },
                },
              },
            },
            subjects: {
              fields: ["documentId", "name", "grade", "level"],
              populate: {
                coverpage: { fields: ["url"] },
              },
            },
          },
        });

      // Transform Strapi subscriptions to course format
      const strapiCourses = strapiSubscriptions
        .filter((sub) => sub.course !== null)
        .map((sub) => {
          const course = sub.course;
          return {
            id: course.documentId,
            documentId: course.documentId,
            name: course.name,
            description: course.description || "",
            category: course.category,
            subcategory: course.subcategory,
            condition: course.condition,
            privacy: course.privacy,
            visibility: course.visibility,
            cover: course.cover
              ? {
                  url: course.cover.url,
                  formats: course.cover.formats,
                  alternativeText: course.cover.alternativeText,
                }
              : null,
            subjects: sub.subjects || course.subjects || [],
            source: "strapi",
            subscriptionId: sub.documentId,
            subscriptionType: sub.subscription_type,
            startDate: sub.startdate,
            endDate: sub.enddate,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
          };
        });

      // Fetch custom courses from MongoDB
      const mongoFilters = {};
      if (status) {
        mongoFilters.status = status;
      } else if (!includeInactive) {
        // By default, only show active courses
        mongoFilters.status = "ACTIVE";
      }

      const mongoCourses = await mongoService.getUserCourses(
        userDocumentId,
        mongoFilters
      );

      // Fetch subject details from Strapi for MongoDB courses
      const allSubjectDocIds = [
        ...new Set(
          mongoCourses
            .flatMap((course) => course.subjectDocumentIds || [])
            .filter(Boolean)
        ),
      ];

      let subjectMap = {};
      if (allSubjectDocIds.length > 0) {
        const strapiInstance = global.strapi || strapi;
        const subjects = await strapiInstance
          .documents("api::subject.subject")
          .findMany({
            filters: {
              documentId: { $in: allSubjectDocIds },
            },
            fields: ["documentId", "name", "grade", "level", "description"],
            populate: {
              coverpage: { fields: ["url", "formats"] },
              topics: {
                fields: ["documentId", "name", "description"],
              },
              quizzes: {
                fields: ["documentId", "title"],
              },
            },
          });

        // Create a map for quick lookup
        subjects.forEach((subject) => {
          subjectMap[subject.documentId] = subject;
        });
      }

      // Transform MongoDB courses to match Strapi course format
      const transformedMongoCourses = mongoCourses.map((course) => {
        const courseId = course._id?.toString() || course.id?.toString();
        return {
          id: courseId,
          documentId: courseId, // Use MongoDB _id as documentId
          name: course.name,
          description: course.description || "",
          category: course.category,
          subcategory: course.subcategory,
          cover: course.cover ? { url: course.cover } : null,
          subjects: (course.subjectDocumentIds || []).map((docId) =>
            subjectMap[docId] ? subjectMap[docId] : { documentId: docId }
          ),
          source: "mongodb",
          status: course.status,
          progress: course.progress,
          startedAt: course.startedAt,
          completedAt: course.completedAt,
          metadata: course.metadata || {},
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        };
      });

      // Combine both sources
      const allCourses = [...strapiCourses, ...transformedMongoCourses];

      // Sort by creation date (newest first)
      allCourses.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      ctx.body = {
        data: {
          courses: allCourses,
          summary: {
            total: allCourses.length,
            strapi: strapiCourses.length,
            mongodb: transformedMongoCourses.length,
          },
        },
      };
    } catch (error) {
      console.error("[USER-COURSES] Error fetching courses:", error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get only Strapi courses (from subscriptions)
   * GET /api/user-courses/strapi-courses
   */
  async getStrapiCourses(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      const userDocumentId = user.documentId;
      const strapiInstance = global.strapi || strapi;

      const strapiSubscriptions = await strapiInstance
        .documents("api::usersubscription.usersubscription")
        .findMany({
          filters: {
            user: { documentId: userDocumentId },
            paymentstatus: "ACTIVE",
          },
          populate: {
            course: {
              fields: [
                "documentId",
                "name",
                "description",
                "category",
                "subcategory",
                "condition",
                "privacy",
                "visibility",
              ],
              populate: {
                cover: {
                  fields: ["url", "formats", "alternativeText"],
                },
                subjects: {
                  fields: ["documentId", "name", "grade", "level"],
                },
              },
            },
              subjects: {
                fields: ["documentId", "name", "grade", "level"],
              },
          },
        });

      const courses = strapiSubscriptions
        .filter((sub) => sub.course !== null)
        .map((sub) => {
          const course = sub.course;
          return {
            id: course.documentId,
            documentId: course.documentId,
            name: course.name,
            description: course.description || "",
            category: course.category,
            subcategory: course.subcategory,
            condition: course.condition,
            privacy: course.privacy,
            visibility: course.visibility,
            cover: course.cover
              ? {
                  url: course.cover.url,
                  formats: course.cover.formats,
                  alternativeText: course.cover.alternativeText,
                }
              : null,
            subjects: sub.subjects || course.subjects || [],
            source: "strapi",
            subscriptionId: sub.documentId,
            subscriptionType: sub.subscription_type,
            startDate: sub.startdate,
            endDate: sub.enddate,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
          };
        });

      ctx.body = {
        data: courses,
        meta: {
          total: courses.length,
          source: "strapi",
        },
      };
    } catch (error) {
      console.error("[USER-COURSES] Error fetching Strapi courses:", error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get only MongoDB custom courses
   * GET /api/user-courses/custom-courses
   * Query params: status (optional) - filter by status (ACTIVE, INACTIVE, COMPLETED, PAUSED)
   */
  async getCustomCourses(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      const userDocumentId = user.documentId;
      const { status, includeInactive } = ctx.query;

      const filters = {};
      if (status) {
        filters.status = status;
      } else if (!includeInactive) {
        // By default, only show active courses
        filters.status = "ACTIVE";
      }

      const mongoCourses = await mongoService.getUserCourses(
        userDocumentId,
        filters
      );

      // Fetch subject details from Strapi for MongoDB courses
      const allSubjectDocIds = [
        ...new Set(
          mongoCourses
            .flatMap((course) => course.subjectDocumentIds || [])
            .filter(Boolean)
        ),
      ];

      let subjectMap = {};
      if (allSubjectDocIds.length > 0) {
        const strapiInstance = global.strapi || strapi;
        const subjects = await strapiInstance
          .documents("api::subject.subject")
          .findMany({
            filters: {
              documentId: { $in: allSubjectDocIds },
            },
            fields: ["documentId", "name", "grade", "level", "description"],
            populate: {
              coverpage: { fields: ["url", "formats"] },
              topics: {
                fields: ["documentId", "name", "description"],
              },
              quizzes: {
                fields: ["documentId", "title"],
              },
            },
          });

        // Create a map for quick lookup
        subjects.forEach((subject) => {
          subjectMap[subject.documentId] = subject;
        });
      }

      // Transform MongoDB courses to match Strapi course format for consistency
      const transformedCourses = mongoCourses.map((course) => {
        const courseId = course._id?.toString() || course.id?.toString();
        return {
          id: courseId,
          documentId: courseId, // Use MongoDB _id as documentId
          name: course.name,
          description: course.description || "",
          category: course.category,
          subcategory: course.subcategory,
          cover: course.cover ? { url: course.cover } : null,
          subjects: (course.subjectDocumentIds || []).map((docId) =>
            subjectMap[docId] ? subjectMap[docId] : { documentId: docId }
          ),
          source: "mongodb",
          status: course.status,
          progress: course.progress,
          startedAt: course.startedAt,
          completedAt: course.completedAt,
          metadata: course.metadata || {},
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        };
      });

      ctx.body = {
        data: transformedCourses,
        meta: {
          total: transformedCourses.length,
          source: "mongodb",
        },
      };
    } catch (error) {
      console.error("[USER-COURSES] Error fetching custom courses:", error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Create a new custom course in MongoDB
   * POST /api/user-courses/custom-courses
   * Body: { name, description?, category?, subcategory?, subjectDocumentIds?, cover?, status? }
   */
  async createCustomCourse(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      const userDocumentId = user.documentId;
      const {
        name,
        description = "",
        category = "EDUCATION",
        subcategory = "ACADEMIC",
        subjectDocumentIds = [],
        cover = null,
        status = "ACTIVE",
      } = ctx.request.body;

      if (!name) {
        ctx.status = 400;
        ctx.body = { error: "Course name is required" };
        return;
      }

      // MongoDB will auto-generate _id, no need for custom courseId
      const courseData = {
        userDocumentId,
        name,
        description,
        category,
        subcategory,
        subjectDocumentIds: Array.isArray(subjectDocumentIds)
          ? subjectDocumentIds
          : [],
        cover,
        status,
        progress: 0,
        startedAt: new Date(),
        completedAt: null,
        metadata: {},
      };

      const savedCourse = await mongoService.saveUserCourse(courseData);
      const courseId = savedCourse._id?.toString() || savedCourse.id?.toString();

      const responseData = {
        id: courseId,
        documentId: courseId, // Use MongoDB _id as documentId
        name: savedCourse.name,
        description: savedCourse.description,
        category: savedCourse.category,
        subcategory: savedCourse.subcategory,
        subjectDocumentIds: savedCourse.subjectDocumentIds,
        cover: savedCourse.cover,
        status: savedCourse.status,
        progress: savedCourse.progress,
        createdAt: savedCourse.createdAt,
      };

      // Publish Ably notification for real-time updates
      try {
        await publishToAbly(
          "global:custom-courses",
          "custom-course:created",
          {
            course: responseData,
            createdBy: userDocumentId,
            userRole: user.user_role || "STUDENT",
            timestamp: new Date().toISOString(),
          }
        );
      } catch (ablyError) {
        console.error("[USER-COURSES] Ably publish error (non-blocking):", ablyError);
      }

      ctx.body = {
        data: responseData,
      };
    } catch (error) {
      console.error("[USER-COURSES] Error creating custom course:", error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get surveys for a specific user (for admin/teacher to assign courses)
   * GET /api/user-courses/user/:userDocumentId/surveys
   */
  async getUserSurveys(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      // Check if user has permission (TEACHER, ADMIN, SUPERADMIN)
      const userRole = user.user_role || "STUDENT";
      const hasPermission = ["TEACHER", "ADMIN", "SUPERADMIN"].includes(userRole);
      
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied. Only Teachers and above can access this." };
        return;
      }

      const { userDocumentId } = ctx.params;
      const surveys = await mongoService.getUserSurveys(userDocumentId);

      ctx.body = { data: surveys };
    } catch (error) {
      console.error("[USER-COURSES] Error fetching user surveys:", error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get subjects from skills based on survey
   * Skills have topicDocumentIds, topics have subjects relation
   * GET /api/user-courses/survey/:surveyId/subjects
   */
  async getSubjectsFromSurvey(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      // Check permission
      const userRole = user.user_role || "STUDENT";
      const hasPermission = ["TEACHER", "ADMIN", "SUPERADMIN"].includes(userRole);
      
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

      const { surveyId } = ctx.params;
      await mongoService.connect();
      
      // Get survey from MongoDB
      const survey = await mongoService.models.UserSurvey.findById(surveyId).lean();
      
      if (!survey) {
        ctx.status = 404;
        ctx.body = { error: "Survey not found" };
        return;
      }

      // Get skill names from survey with their self ratings (required level)
      const surveySkills = survey.skills || [];
      const skillNames = surveySkills.map((s) => s.skillName);
      
      // Get skills with topicDocumentIds
      const skillsWithTopics = await mongoService.getSkillsWithTopics(skillNames);
      
      // Create a map of skill name to self rating (required level)
      const skillRatingMap = {};
      surveySkills.forEach((s) => {
        skillRatingMap[s.skillName] = s.selfRating;
      });

      // Get all unique topicDocumentIds from skills
      const topicDocumentIds = [
        ...new Set(
          skillsWithTopics
            .flatMap((skill) => skill.topicDocumentIds || [])
            .filter(Boolean)
        ),
      ];

      // Fetch topics from Strapi and get their subjects
      const strapiInstance = global.strapi || strapi;
      const allSubjectsMap = new Map(); // All unique subjects
      const skillsWithSubjects = []; // Skills grouped with their subjects
      
      if (topicDocumentIds.length > 0) {
        const topics = await strapiInstance
          .documents("api::topic.topic")
          .findMany({
            filters: {
              documentId: { $in: topicDocumentIds },
            },
            fields: ["documentId", "name"],
            populate: {
              subjects: {
                fields: ["documentId", "name", "grade", "level", "description"],
              },
            },
          });

        // Create a map of topic to subjects
        const topicToSubjectsMap = new Map();
        topics.forEach((topic) => {
          if (topic.subjects && Array.isArray(topic.subjects)) {
            topicToSubjectsMap.set(topic.documentId, topic.subjects);
            topic.subjects.forEach((subject) => {
              if (subject.documentId && !allSubjectsMap.has(subject.documentId)) {
                allSubjectsMap.set(subject.documentId, subject);
              }
            });
          }
        });

        // Group subjects by skill
        skillsWithTopics.forEach((skill) => {
          const skillSubjects = [];
          const skillTopicIds = skill.topicDocumentIds || [];
          
          skillTopicIds.forEach((topicId) => {
            const topicSubjects = topicToSubjectsMap.get(topicId) || [];
            topicSubjects.forEach((subject) => {
              if (subject.documentId && !skillSubjects.find(s => s.documentId === subject.documentId)) {
                skillSubjects.push(subject);
              }
            });
          });

          skillsWithSubjects.push({
            skillName: skill.name,
            skillCategory: skill.category,
            skillDescription: skill.description,
            requiredLevel: skillRatingMap[skill.name] || null, // Self rating from survey
            currentLevel: null, // Will be populated from quiz results if available
            topicDocumentIds: skill.topicDocumentIds || [],
            subjects: skillSubjects,
          });
        });

        // Try to get current level from quiz results
        try {
          await mongoService.connect();
          const UserQuiz = mongoService.models.UserQuiz;
          const latestQuiz = await UserQuiz.findOne({
            userDocumentId: survey.userDocumentId,
            surveyId: survey._id,
          }).sort({ completedAt: -1 }).lean();

          if (latestQuiz && latestQuiz.skillResults) {
            const skillLevelMap = {};
            latestQuiz.skillResults.forEach((sr) => {
              skillLevelMap[sr.skillName] = sr.actualLevel;
            });

            skillsWithSubjects.forEach((skillData) => {
              skillData.currentLevel = skillLevelMap[skillData.skillName] || null;
            });
          }
        } catch (quizError) {
          console.log("No quiz results found for current level");
        }
      }

      ctx.body = {
        data: {
          survey,
          skills: skillsWithSubjects, // Skills with grouped subjects
          allSubjects: Array.from(allSubjectsMap.values()), // Flat list of all unique subjects
          summary: {
            skillCount: skillsWithSubjects.length,
            topicCount: topicDocumentIds.length,
            subjectCount: allSubjectsMap.size,
          },
        },
      };
    } catch (error) {
      console.error("[USER-COURSES] Error fetching subjects from survey:", error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Update a custom course
   * PUT /api/user-courses/custom-courses/:courseId
   */
  async updateCustomCourse(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      // Check permission
      const userRole = user.user_role || "STUDENT";
      const hasPermission = ["TEACHER", "ADMIN", "SUPERADMIN"].includes(userRole);
      
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

      const { courseId } = ctx.params;
      const updateData = ctx.request.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.userDocumentId;
      delete updateData._id;
      delete updateData.createdAt;

      const updatedCourse = await mongoService.updateUserCourse(courseId, updateData);
      
      if (!updatedCourse) {
        ctx.status = 404;
        ctx.body = { error: "Course not found" };
        return;
      }

      const courseIdStr = updatedCourse._id?.toString() || updatedCourse.id?.toString();

      const responseData = {
        id: courseIdStr,
        documentId: courseIdStr,
        ...updatedCourse,
      };

      // Publish Ably notification for real-time updates
      try {
        await publishToAbly(
          "global:custom-courses",
          "custom-course:updated",
          {
            course: responseData,
            updatedBy: user.documentId,
            userRole: user.user_role || "STUDENT",
            timestamp: new Date().toISOString(),
          }
        );
      } catch (ablyError) {
        console.error("[USER-COURSES] Ably publish error (non-blocking):", ablyError);
      }

      ctx.body = {
        data: responseData,
      };
    } catch (error) {
      console.error("[USER-COURSES] Error updating custom course:", error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Delete a custom course
   * DELETE /api/user-courses/custom-courses/:courseId
   */
  async deleteCustomCourse(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      // Check permission
      const userRole = user.user_role || "STUDENT";
      const hasPermission = ["TEACHER", "ADMIN", "SUPERADMIN"].includes(userRole);
      
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

      const { courseId } = ctx.params;
      const result = await mongoService.deleteUserCourse(courseId);
      
      if (!result) {
        ctx.status = 404;
        ctx.body = { error: "Course not found" };
        return;
      }

      // Publish Ably notification for real-time updates
      try {
        await publishToAbly(
          "global:custom-courses",
          "custom-course:deleted",
          {
            courseId,
            deletedBy: user.documentId,
            userRole: user.user_role || "STUDENT",
            timestamp: new Date().toISOString(),
          }
        );
      } catch (ablyError) {
        console.error("[USER-COURSES] Ably publish error (non-blocking):", ablyError);
      }

      ctx.body = {
        data: {
          message: "Course deleted successfully",
          courseId,
        },
      };
    } catch (error) {
      console.error("[USER-COURSES] Error deleting custom course:", error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get custom courses for a specific user (for admin/teacher)
   * GET /api/user-courses/user/:userDocumentId/custom-courses
   */
  async getUserCustomCourses(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      // Check permission
      const userRole = user.user_role || "STUDENT";
      const hasPermission = ["TEACHER", "ADMIN", "SUPERADMIN"].includes(userRole);
      
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

      const { userDocumentId } = ctx.params;
      const { status } = ctx.query;

      const filters = {};
      if (status) filters.status = status;

      const courses = await mongoService.getUserCourses(userDocumentId, filters);

      // Populate subject details
      const allSubjectDocIds = [
        ...new Set(
          courses
            .flatMap((course) => course.subjectDocumentIds || [])
            .filter(Boolean)
        ),
      ];

      let subjectMap = {};
      if (allSubjectDocIds.length > 0) {
        const strapiInstance = global.strapi || strapi;
        const subjects = await strapiInstance
          .documents("api::subject.subject")
          .findMany({
            filters: {
              documentId: { $in: allSubjectDocIds },
            },
            fields: ["documentId", "name", "grade", "level"],
          });

        subjects.forEach((subject) => {
          subjectMap[subject.documentId] = subject;
        });
      }

      const transformedCourses = courses.map((course) => {
        const courseId = course._id?.toString() || course.id?.toString();
        return {
          id: courseId,
          documentId: courseId,
          name: course.name,
          description: course.description,
          category: course.category,
          subcategory: course.subcategory,
          subjectDocumentIds: course.subjectDocumentIds || [],
          subjects: (course.subjectDocumentIds || []).map((docId) =>
            subjectMap[docId] || { documentId: docId }
          ),
          cover: course.cover,
          status: course.status,
          progress: course.progress,
          startedAt: course.startedAt,
          completedAt: course.completedAt,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        };
      });

      ctx.body = { data: transformedCourses };
    } catch (error) {
      console.error("[USER-COURSES] Error fetching user custom courses:", error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Create custom course for a specific user (admin/teacher can create for any user)
   * POST /api/user-courses/user/:userDocumentId/custom-courses
   */
  async createUserCustomCourse(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      // Check permission
      const userRole = user.user_role || "STUDENT";
      const hasPermission = ["TEACHER", "ADMIN", "SUPERADMIN"].includes(userRole);
      
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

      const { userDocumentId } = ctx.params; // Target user's documentId
      const {
        name,
        description = "",
        category = "EDUCATION",
        subcategory = "ACADEMIC",
        subjectDocumentIds = [],
        cover = null,
        status = "ACTIVE",
      } = ctx.request.body;

      if (!name) {
        ctx.status = 400;
        ctx.body = { error: "Course name is required" };
        return;
      }

      const courseData = {
        userDocumentId, // Use the target user's documentId
        name,
        description,
        category,
        subcategory,
        subjectDocumentIds: Array.isArray(subjectDocumentIds)
          ? subjectDocumentIds
          : [],
        cover,
        status,
        progress: 0,
        startedAt: new Date(),
        completedAt: null,
        metadata: {
          createdBy: user.documentId,
          createdByRole: userRole,
        },
      };

      const savedCourse = await mongoService.saveUserCourse(courseData);
      const courseId = savedCourse._id?.toString() || savedCourse.id?.toString();

      const responseData = {
        id: courseId,
        documentId: courseId,
        name: savedCourse.name,
        description: savedCourse.description,
        category: savedCourse.category,
        subcategory: savedCourse.subcategory,
        subjectDocumentIds: savedCourse.subjectDocumentIds,
        cover: savedCourse.cover,
        status: savedCourse.status,
        progress: savedCourse.progress,
        createdAt: savedCourse.createdAt,
      };

      // Publish Ably notification for real-time updates
      try {
        // Global channel for MongoDB Studio
        await publishToAbly(
          "global:custom-courses",
          "custom-course:created",
          {
            course: responseData,
            createdBy: user.documentId,
            userRole: user.user_role || "STUDENT",
            targetUserId: userDocumentId,
            timestamp: new Date().toISOString(),
          }
        );
        // User-specific channel for org assignment section
        await publishToAbly(
          `user:${userDocumentId}:custom-courses`,
          "custom-course:assigned",
          {
            course: responseData,
            assignedBy: user.documentId,
            timestamp: new Date().toISOString(),
          }
        );
      } catch (ablyError) {
        console.error("[USER-COURSES] Ably publish error (non-blocking):", ablyError);
      }

      ctx.body = {
        data: responseData,
      };
    } catch (error) {
      console.error("[USER-COURSES] Error creating user custom course:", error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },
};

