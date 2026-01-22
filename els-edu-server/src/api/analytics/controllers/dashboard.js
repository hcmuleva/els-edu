"use strict";

/**
 * Analytics Dashboard Controller
 * Aggregates data for Student, Teacher, and Parent dashboards
 */

const mongoService = require("../../../services/mongoService");
const { subDays, format, startOfDay, endOfDay } = require("date-fns");

module.exports = {
  /**
   * Get Student Dashboard Data
   * GET /api/analytics/dashboard/student
   */
  /**
   * Get Student Dashboard Data
   * GET /api/analytics/dashboard/student
   */
  async getStudentDashboard(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      // Use helper to calculate student stats (reusable for parent view)
      const stats = await this.calculateStudentStats(user);

      ctx.body = {
        data: stats,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get Teacher Dashboard Data
   * GET /api/analytics/dashboard/teacher
   */
  async getTeacherDashboard(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      // 1. Fetch Classes Created by Teacher
      const classrooms = await mongoService.models.Classroom.find({
        creatorDocumentId: user.documentId,
      }).lean();

      // 2. Fetch Aggregated Student Stats for these classes
      const classIds = classrooms.map((c) => c._id);

      // Get total students across all classes (via ClassProgress)
      const studentProgress = await mongoService.models.ClassProgress.find({
        classroomId: { $in: classIds },
      }).lean();

      const uniqueStudents = new Set(
        studentProgress.map((p) => p.userDocumentId),
      ).size;

      // Calculate Class Performance
      const classesData = await Promise.all(
        classrooms.map(async (cls) => {
          // Get class-specific progress
          const classStudentProgress = studentProgress.filter(
            (p) => p.classroomId.toString() === cls._id.toString(),
          );

          // Get assignments for this class
          const assignments = await mongoService.models.UserAssignment.find({
            classroomId: cls._id,
          }).lean();

          // Get active assignments (not yet graded or submitted)
          const activeAssignments = assignments.filter(
            (a) => a.status === "assigned" || a.status === "submitted",
          ).length;

          // Calculate average grade from completed assignments
          const completedAssignments = assignments.filter(
            (a) => a.status === "completed" && a.grade?.score,
          );
          const avgGrade =
            completedAssignments.length > 0
              ? Math.round(
                  completedAssignments.reduce(
                    (sum, a) => sum + (a.grade?.score || 0),
                    0,
                  ) / completedAssignments.length,
                )
              : 0;

          // Get top performers (top 3 by avgScore)
          const sortedByScore = [...classStudentProgress]
            .filter((p) => p.progress?.avgScore)
            .sort(
              (a, b) =>
                (b.progress?.avgScore || 0) - (a.progress?.avgScore || 0),
            );

          const topPerformers = sortedByScore.slice(0, 3).map((p) => ({
            name: p.studentName || p.userDocumentId,
            score: p.progress?.avgScore || 0,
            trend: "up",
          }));

          // Get students needing attention (low score or low attendance)
          const needsAttention = classStudentProgress
            .filter(
              (p) =>
                (p.progress?.avgScore || 100) < 60 ||
                (p.progress?.attendanceRate || 100) < 70,
            )
            .slice(0, 3)
            .map((p) => ({
              name: p.studentName || p.userDocumentId,
              score: p.progress?.avgScore || 0,
              issue:
                (p.progress?.avgScore || 100) < 60
                  ? "Low scores"
                  : "Low attendance",
            }));

          // Get assignment completion stats
          const assignmentStats = {
            completed: assignments.filter((a) => a.status === "completed")
              .length,
            submitted: assignments.filter((a) => a.status === "submitted")
              .length,
            assigned: assignments.filter((a) => a.status === "assigned").length,
            missed: assignments.filter((a) => a.status === "missed").length,
          };

          return {
            id: cls._id,
            name: cls.title,
            studentCount: classStudentProgress.length,
            avgGrade,
            activeAssignments,
            status: cls.status,
            topPerformers,
            needsAttention,
            assignmentStats,
          };
        }),
      );

      ctx.body = {
        data: {
          stats: {
            totalClasses: classrooms.length,
            totalStudents: uniqueStudents,
            activeAssignments: classesData.reduce(
              (sum, c) => sum + c.activeAssignments,
              0,
            ),
          },
          classes: classesData,
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get Parent Dashboard Data
   * GET /api/analytics/dashboard/parent
   */
  async getParentDashboard(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      // 1. Fetch Children
      // We must use Strapi's Entity Service to get the relation
      const parentUser = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        user.id,
        {
          populate: ["children"],
        },
      );

      if (
        !parentUser ||
        !parentUser.children ||
        parentUser.children.length === 0
      ) {
        return (ctx.body = {
          data: {
            children: [],
            message: "No children linked to this account",
          },
        });
      }

      // 2. Calculate Stats for each Child
      const childrenData = await Promise.all(
        parentUser.children.map(async (child) => {
          const stats = await this.calculateStudentStats(child);
          return {
            id: child.id,
            documentId: child.documentId,
            name: `${child.first_name || ""} ${child.last_name || child.username}`.trim(),
            ...stats,
          };
        }),
      );

      ctx.body = {
        data: {
          children: childrenData,
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Helper: Calculate Student Stats
   */
  async calculateStudentStats(userDoc) {
    const documentId = userDoc.documentId;

    // 1. Fetch Key Metrics
    const quizzes = await mongoService.getUserQuizzes(documentId);
    const courses = await mongoService.getUserCourses(documentId);

    // Calculate average score
    const avgScore =
      quizzes.length > 0
        ? Math.round(
            quizzes.reduce((acc, q) => acc + (q.overallPercentage || 0), 0) /
              quizzes.length,
          )
        : 0;

    // Calculate Consistency (Activity Heatmap Data)
    const activityMap = {};
    quizzes.forEach((q) => {
      const date = format(new Date(q.createdAt), "yyyy-MM-dd");
      activityMap[date] = (activityMap[date] || 0) + 1;
    });

    // 2. Identify Strong & Weak Areas
    const skillPerformance = {};
    quizzes.forEach((q) => {
      if (q.skillResults) {
        q.skillResults.forEach((s) => {
          if (!skillPerformance[s.skillName]) {
            skillPerformance[s.skillName] = {
              total: 0,
              count: 0,
              name: s.skillName,
            };
          }
          skillPerformance[s.skillName].total += s.percentage;
          skillPerformance[s.skillName].count += 1;
        });
      }
    });

    const processedSkills = Object.values(skillPerformance).map((s) => ({
      skill: s.name,
      score: Math.round(s.total / s.count),
      fullMark: 100,
    }));

    const strongAreas = processedSkills
      .filter((s) => s.score >= 75)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const weakAreas = processedSkills
      .filter((s) => s.score < 60)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    // 3. Progress Over Time (Last 30 Days)
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const daysQuizzes = quizzes.filter(
        (q) => format(new Date(q.createdAt), "yyyy-MM-dd") === dateStr,
      );
      const dailyAvg =
        daysQuizzes.length > 0
          ? Math.round(
              daysQuizzes.reduce(
                (sum, q) => sum + (q.overallPercentage || 0),
                0,
              ) / daysQuizzes.length,
            )
          : 0;

      last30Days.push({
        date: format(date, "MMM dd"),
        score: dailyAvg,
        attempts: daysQuizzes.length,
      });
    }

    // 4. Recommendations based on Weak Areas
    const recommendations = weakAreas.map((area) => ({
      title: `Mastering ${area.skill}`,
      type: "Course",
      reason: "Improve your score in this area",
      link: "/browse-courses",
    }));

    // Add survey-based skills if any
    let surveySkills = [];
    try {
      const surveys = await mongoService.getUserSurveys(documentId);
      if (surveys.length > 0) {
        surveySkills = surveys[0].skills || [];
      }
    } catch (e) {
      // limit impact
    }

    return {
      stats: {
        totalQuizzes: quizzes.length,
        averageScore: avgScore,
        activeCourses: courses.filter((c) => c.status === "ACTIVE").length,
        completedCourses: courses.filter((c) => c.status === "COMPLETED")
          .length,
      },
      charts: {
        activityHeatmap: activityMap,
        skillRadar: processedSkills,
        progressHistory: last30Days,
      },
      insights: {
        strongAreas,
        weakAreas,
        recommendations,
        surveySkills,
      },
    };
  },

  /**
   * Link a child to the authenticated parent
   * POST /api/analytics/dashboard/parent/link-child
   */
  async linkChild(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      const { childDocumentId } = ctx.request.body;
      if (!childDocumentId) {
        ctx.status = 400;
        ctx.body = { error: "Child Document ID is required" };
        return;
      }

      // Verify child exists
      const child = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { documentId: childDocumentId },
        });

      if (!child) {
        ctx.status = 404;
        ctx.body = { error: "Child user not found" };
        return;
      }

      // Add to parent's children
      await strapi.entityService.update(
        "plugin::users-permissions.user",
        user.id,
        {
          data: {
            children: {
              connect: [child.id], // Use internal ID for relation connect
            },
          },
        },
      );

      ctx.body = { success: true, message: "Child linked successfully" };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Force link users (Admin/Dev helper)
   * GET /api/analytics/force-link
   */
  async forceLink(ctx) {
    const { parentDocId, childDocId } = ctx.query;

    if (!parentDocId || !childDocId) {
      return ctx.badRequest("Missing parentDocId or childDocId");
    }

    try {
      const parent = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { documentId: parentDocId } });
      const child = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { documentId: childDocId } });

      if (!parent || !child) return ctx.notFound("User not found");

      await strapi.entityService.update(
        "plugin::users-permissions.user",
        parent.id,
        {
          data: {
            children: { connect: [child.id] },
          },
        },
      );

      ctx.body = { message: `Linked ${child.username} to ${parent.username}` };
    } catch (e) {
      ctx.body = { error: e.message };
    }
  },
};
