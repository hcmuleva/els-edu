"use strict";

/**
 * Custom Counts Service
 *
 * Centralized service for fetching various metrics and counts using efficient database queries.
 */

const mongoService = require("../../../services/mongoService");

module.exports = ({ strapi }) => ({
  /**
   * Get counts for all subscriptions of a user
   * @param {string} userDocumentId
   * @returns {Object} Map of subscriptionDocumentId -> counts
   */
  async getUserSubscriptionCounts(userDocumentId) {
    const knex = strapi.db.connection;

    // Get all user subscriptions with subjects
    const subscriptions = await strapi
      .documents("api::usersubscription.usersubscription")
      .findMany({
        filters: {
          user: { documentId: userDocumentId },
          paymentstatus: "ACTIVE",
        },
        populate: ["subjects", "course"],
      });

    const result = {};

    for (const sub of subscriptions) {
      const subjectIds = (sub.subjects || []).map((s) => s.id);
      const subjectCount = subjectIds.length;

      let topicCount = 0;
      let quizCount = 0;

      if (subjectCount > 0) {
        // Count topics
        topicCount = await strapi.db.query("api::topic.topic").count({
          where: {
            subjects: {
              id: { $in: subjectIds },
            },
          },
        });

        // Count quizzes
        quizCount = await strapi.db.query("api::quiz.quiz").count({
          where: {
            subjects: {
              id: { $in: subjectIds },
            },
          },
        });
      }

      result[sub.documentId] = {
        subjectCount,
        topicCount,
        quizCount,
        courseDocumentId: sub.course?.documentId,
        courseName: sub.course?.name,
      };
    }

    return result;
  },

  /**
   * Get counts for a course (subjects, topics, quizzes)
   * Handles both Strapi courses and MongoDB custom courses
   * @param {string} courseDocumentId - Can be Strapi course documentId or MongoDB course _id
   * @returns {Object} { subjectCount, topicCount, quizCount, breakdown }
   */
  async getCourseCounts(courseDocumentId) {
    // First, try to find it as a Strapi course
    const strapiCourse = await strapi.documents("api::course.course").findOne({
      documentId: courseDocumentId,
      populate: ["subjects"],
    });

    if (strapiCourse) {
      // It's a Strapi course - use existing logic
      const subjects = strapiCourse.subjects || [];
      const subjectIds = subjects.map((s) => s.documentId);
      const subjectCount = subjectIds.length;

      let topicCount = 0;
      let quizCount = 0;
      const breakdown = {};

      // Parallel processing for all subjects
      await Promise.all(
        subjects.map(async (subject) => {
          // Count topics for this subject
          const tCount = await strapi.db.query("api::topic.topic").count({
            where: {
              subjects: {
                documentId: subject.documentId,
              },
              publishedAt: {
                $ne: null,
              },
            },
          });

          // Count quizzes for this subject
          const qCount = await strapi.db.query("api::quiz.quiz").count({
            where: {
              subjects: {
                documentId: subject.documentId,
              },
              publishedAt: {
                $ne: null,
              },
            },
          });

          breakdown[subject.documentId] = {
            topicCount: tCount,
            quizCount: qCount,
          };

          // Add to totals
          topicCount += tCount;
          quizCount += qCount;
        })
      );

      return { subjectCount, topicCount, quizCount, breakdown };
    }

    // If not found in Strapi, check if it's a MongoDB custom course
    try {
      await mongoService.connect();
      const mongoose = require("mongoose");
      const ObjectId = mongoose.Types.ObjectId;

      // Try to find by MongoDB _id
      let mongoCourse = null;
      if (ObjectId.isValid(courseDocumentId)) {
        mongoCourse = await mongoService.models.UserCourse.findById(
          courseDocumentId
        ).lean();
      }

      if (!mongoCourse) {
        // Not found in either Strapi or MongoDB
        return {
          subjectCount: 0,
          topicCount: 0,
          quizCount: 0,
          breakdown: {},
        };
      }

      // It's a MongoDB custom course - calculate counts from subjectDocumentIds
      const subjectDocumentIds = mongoCourse.subjectDocumentIds || [];
      const subjectCount = subjectDocumentIds.length;

      if (subjectCount === 0) {
        return {
          subjectCount: 0,
          topicCount: 0,
          quizCount: 0,
          breakdown: {},
        };
      }

      let topicCount = 0;
      let quizCount = 0;
      const breakdown = {};

      // Parallel processing for all subjects
      await Promise.all(
        subjectDocumentIds.map(async (subjectDocId) => {
          // Count topics for this subject
          const tCount = await strapi.db.query("api::topic.topic").count({
            where: {
              subjects: {
                documentId: subjectDocId,
              },
              publishedAt: {
                $ne: null,
              },
            },
          });

          // Count quizzes for this subject
          const qCount = await strapi.db.query("api::quiz.quiz").count({
            where: {
              subjects: {
                documentId: subjectDocId,
              },
              publishedAt: {
                $ne: null,
              },
            },
          });

          breakdown[subjectDocId] = {
            topicCount: tCount,
            quizCount: qCount,
          };

          // Add to totals
          topicCount += tCount;
          quizCount += qCount;
        })
      );

      return { subjectCount, topicCount, quizCount, breakdown };
    } catch (error) {
      console.error(
        "[getCourseCounts] Error checking MongoDB custom course:",
        error
      );
      return { subjectCount: 0, topicCount: 0, quizCount: 0, breakdown: {} };
    }
  },

  /**
   * Get counts for a subject (topics, quizzes)
   * @param {string} subjectDocumentId
   * @returns {Object} { topicCount, quizCount }
   */
  async getSubjectCounts(subjectDocumentId) {
    const subject = await strapi.documents("api::subject.subject").findOne({
      documentId: subjectDocumentId,
    });

    if (!subject) return { topicCount: 0, quizCount: 0 };

    // Count topics explicitly linked to this subject
    const topicCount = await strapi.db.query("api::topic.topic").count({
      where: {
        subjects: {
          documentId: subjectDocumentId,
        },
        publishedAt: {
          $ne: null,
        },
      },
    });

    // Count quizzes explicitly linked to this subject
    const quizCount = await strapi.db.query("api::quiz.quiz").count({
      where: {
        subjects: {
          documentId: subjectDocumentId,
        },
        publishedAt: {
          $ne: null,
        },
      },
    });

    console.log(
      `[getSubjectCounts] Subject: ${subjectDocumentId}, TopicCount: ${topicCount}, QuizCount: ${quizCount}`
    );

    return { topicCount, quizCount };
  },

  /**
   * Get counts for multiple MongoDB custom courses in batch
   * @param {Array<string>} courseIds - Array of MongoDB course _id strings
   * @returns {Object} Map of courseId -> { subjectCount, topicCount, quizCount, breakdown }
   */
  async getBatchCustomCourseCounts(courseIds) {
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return {};
    }

    try {
      await mongoService.connect();
      const mongoose = require("mongoose");
      const ObjectId = mongoose.Types.ObjectId;

      // Filter valid ObjectIds
      const validIds = courseIds.filter((id) => ObjectId.isValid(id));
      if (validIds.length === 0) {
        return {};
      }

      // Fetch all courses in one query
      const mongoCourses = await mongoService.models.UserCourse.find({
        _id: { $in: validIds.map((id) => new ObjectId(id)) },
      }).lean();

      const result = {};

      // Process all courses in parallel
      await Promise.all(
        mongoCourses.map(async (course) => {
          const courseId = course._id?.toString();
          const subjectDocumentIds = course.subjectDocumentIds || [];
          const subjectCount = subjectDocumentIds.length;

          if (subjectCount === 0) {
            result[courseId] = {
              subjectCount: 0,
              topicCount: 0,
              quizCount: 0,
              breakdown: {},
            };
            return;
          }

          let topicCount = 0;
          let quizCount = 0;
          const breakdown = {};

          // Process all subjects in parallel
          await Promise.all(
            subjectDocumentIds.map(async (subjectDocId) => {
              // Count topics for this subject
              const tCount = await strapi.db.query("api::topic.topic").count({
                where: {
                  subjects: {
                    documentId: subjectDocId,
                  },
                  publishedAt: {
                    $ne: null,
                  },
                },
              });

              // Count quizzes for this subject
              const qCount = await strapi.db.query("api::quiz.quiz").count({
                where: {
                  subjects: {
                    documentId: subjectDocId,
                  },
                  publishedAt: {
                    $ne: null,
                  },
                },
              });

              breakdown[subjectDocId] = {
                topicCount: tCount,
                quizCount: qCount,
              };

              // Add to totals
              topicCount += tCount;
              quizCount += qCount;
            })
          );

          result[courseId] = {
            subjectCount,
            topicCount,
            quizCount,
            breakdown,
          };
        })
      );

      return result;
    } catch (error) {
      console.error(
        "[getBatchCustomCourseCounts] Error fetching batch counts:",
        error
      );
      return {};
    }
  },
});
