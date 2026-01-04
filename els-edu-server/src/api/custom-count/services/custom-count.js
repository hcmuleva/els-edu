"use strict";

/**
 * Custom Counts Service
 *
 * Centralized service for fetching various metrics and counts using efficient database queries.
 */

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
   * @param {string} courseDocumentId
   * @returns {Object} { subjectCount, topicCount, quizCount }
   */
  async getCourseCounts(courseDocumentId) {
    const course = await strapi.documents("api::course.course").findOne({
      documentId: courseDocumentId,
      populate: ["subjects"],
    });

    if (!course)
      return { subjectCount: 0, topicCount: 0, quizCount: 0, breakdown: {} };

    const subjects = course.subjects || [];
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
});
