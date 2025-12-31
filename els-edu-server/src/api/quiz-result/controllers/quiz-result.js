"use strict";

/**
 * Enhanced quiz-result controller with analytics and trends
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::quiz-result.quiz-result",
  ({ strapi }) => ({
    /**
     * Submit quiz result with comprehensive analysis
     */
    async submitResult(ctx) {
      try {
        const { quizId, answers, timeTaken, questionTimings, deviceInfo } =
          ctx.request.body;
        const userId = ctx.state.user.id;

        // Validate required fields
        if (!quizId || !answers || !Array.isArray(answers)) {
          return ctx.badRequest("Missing required fields: quizId, answers");
        }

        // Get quiz with questions
        const quiz = await strapi.documents("api::quiz.quiz").findOne({
          documentId: quizId,
          populate: {
            questions: {
              populate: ["correctAnswer", "options"],
            },
            subject: true,
          },
        });

        if (!quiz) {
          return ctx.notFound("Quiz not found");
        }

        // Check attempt limit
        const existingAttempts = await strapi
          .documents("api::quiz-result.quiz-result")
          .findMany({
            filters: {
              quiz: { documentId: quizId },
              user: { documentId: userId },
            },
          });

        const attemptNumber = existingAttempts.length + 1;
        if (quiz.maxAttempts && attemptNumber > quiz.maxAttempts) {
          return ctx.forbidden("Maximum attempts exceeded");
        }

        // Calculate results
        const analysis = await this.calculateQuizAnalysis(
          quiz,
          answers,
          questionTimings
        );

        // Create quiz result
        const quizResult = await strapi
          .documents("api::quiz-result.quiz-result")
          .create({
            data: {
              quiz: quizId,
              user: userId,
              subject: quiz.subject?.documentId,
              topic: quiz.topic?.documentId,
              score: analysis.score,
              totalQuestions: analysis.totalQuestions,
              correctAnswers: analysis.correctAnswers,
              incorrectAnswers: analysis.incorrectAnswers,
              unansweredQuestions: analysis.unansweredQuestions,
              percentage: analysis.percentage,
              isPassed: analysis.isPassed,
              timeTaken,
              answers,
              questionTimings,
              questionAnalysis: analysis.questionAnalysis,
              weakAreas: analysis.weakAreas,
              strongAreas: analysis.strongAreas,
              recommendedRetake: analysis.recommendedRetake,
              retakeQuestions: analysis.retakeQuestions,
              improvementSuggestions: analysis.improvementSuggestions,
              attemptNumber,
              deviceInfo,
              sessionData: {
                userAgent: ctx.request.headers["user-agent"],
                ip: ctx.request.ip,
                timestamp: new Date().toISOString(),
              },
              startedAt: new Date(Date.now() - timeTaken * 1000),
              completedAt: new Date(),
            },
          });

        return ctx.send({
          success: true,
          result: quizResult,
          analysis,
          canRetake: quiz.maxAttempts ? attemptNumber < quiz.maxAttempts : true,
          nextAttemptNumber: attemptNumber + 1,
        });
      } catch (error) {
        console.error("Error submitting quiz result:", error);
        return ctx.internalServerError("Failed to submit quiz result");
      }
    },

    /**
     * Get user quiz trends and analytics
     */
    async getUserTrends(ctx) {
      try {
        const userId = ctx.state.user.id;
        const {
          period = "30d",
          subject: subjectId,
          topic: topicId,
          startDate,
          endDate,
        } = ctx.query;

        // Build date filter
        const dateFilter = this.buildDateFilter(period, startDate, endDate);

        // Build filters
        const filters = {
          user: { documentId: userId },
          ...dateFilter,
        };

        if (subjectId) filters.subject = { documentId: subjectId };
        if (topicId) filters.topic = { documentId: topicId };

        // Get quiz results
        const results = await strapi
          .documents("api::quiz-result.quiz-result")
          .findMany({
            filters,
            populate: {
              quiz: {
                populate: ["subject", "topics"],
              },
              subject: true,
            },
            sort: { createdAt: "desc" },
          });

        // Calculate trends
        const trends = this.calculateTrends(results);

        return ctx.send({
          success: true,
          trends,
          totalAttempts: results.length,
          period,
          filters: { subjectId, topicId, startDate, endDate },
        });
      } catch (error) {
        console.error("Error getting user trends:", error);
        return ctx.internalServerError("Failed to get user trends");
      }
    },

    /**
     * Get detailed performance analytics
     */
    async getPerformanceAnalytics(ctx) {
      try {
        const userId = ctx.state.user.id;
        const { quizId, subjectId, topicId } = ctx.query;

        const filters = { user: { documentId: userId } };
        if (quizId) filters.quiz = { documentId: quizId };
        if (subjectId) filters.subject = { documentId: subjectId };
        if (topicId) filters.topic = { documentId: topicId };

        const results = await strapi
          .documents("api::quiz-result.quiz-result")
          .findMany({
            filters,
            populate: {
              quiz: {
                populate: ["questions", "subject", "topics"],
              },
            },
            sort: { createdAt: "asc" },
          });

        const analytics = {
          overall: this.calculateOverallPerformance(results),
          bySubject: this.calculatePerformanceBySubject(results),
          byTopic: this.calculatePerformanceByTopic(results),
          byDifficulty: this.calculatePerformanceByDifficulty(results),
          progressTrend: this.calculateProgressTrend(results),
          timeAnalysis: this.calculateTimeAnalysis(results),
          strengths: this.identifyStrengths(results),
          weaknesses: this.identifyWeaknesses(results),
          recommendations: this.generateRecommendations(results),
        };

        return ctx.send({
          success: true,
          analytics,
          totalQuizzesTaken: results.length,
        });
      } catch (error) {
        console.error("Error getting performance analytics:", error);
        return ctx.internalServerError("Failed to get performance analytics");
      }
    },

    /**
     * Get questions for retake based on poor performance
     */
    async getRetakeQuestions(ctx) {
      try {
        const userId = ctx.state.user.id;
        const { quizId, subjectId, topicId, limit = 10 } = ctx.query;

        const filters = {
          user: { documentId: userId },
          recommendedRetake: true,
        };

        if (quizId) filters.quiz = { documentId: quizId };
        if (subjectId) filters.subject = { documentId: subjectId };
        if (topicId) filters.topic = { documentId: topicId };

        const results = await strapi
          .documents("api::quiz-result.quiz-result")
          .findMany({
            filters,
            populate: {
              quiz: {
                populate: ["questions"],
              },
            },
            sort: { createdAt: "desc" },
          });

        // Aggregate questions that need retake
        const retakeQuestions = new Map();

        results.forEach((result) => {
          if (result.retakeQuestions && Array.isArray(result.retakeQuestions)) {
            result.retakeQuestions.forEach((questionId) => {
              if (!retakeQuestions.has(questionId)) {
                retakeQuestions.set(questionId, {
                  questionId,
                  attempts: 0,
                  failures: 0,
                  lastAttempt: result.createdAt,
                  priority: 0,
                });
              }

              const question = retakeQuestions.get(questionId);
              question.attempts++;

              // Check if this question was answered incorrectly
              const questionAnalysis = result.questionAnalysis?.find(
                (q) => q.questionId === questionId
              );
              if (questionAnalysis && !questionAnalysis.isCorrect) {
                question.failures++;
              }

              // Calculate priority based on failure rate and recency
              question.priority =
                (question.failures / question.attempts) *
                (1 /
                  Math.max(
                    1,
                    Math.floor(
                      (Date.now() - new Date(question.lastAttempt)) /
                        (24 * 60 * 60 * 1000)
                    )
                  ));
            });
          }
        });

        // Sort by priority and limit
        const prioritizedQuestions = Array.from(retakeQuestions.values())
          .sort((a, b) => b.priority - a.priority)
          .slice(0, parseInt(limit));

        // Get full question details
        const questionDetails = await Promise.all(
          prioritizedQuestions.map(async (item) => {
            const question = await strapi
              .documents("api::question.question")
              .findOne({
                documentId: item.questionId,
                populate: ["options", "correctAnswer", "media"],
              });
            return {
              ...question,
              retakeInfo: item,
            };
          })
        );

        return ctx.send({
          success: true,
          retakeQuestions: questionDetails.filter((q) => q), // Filter out null results
          totalQuestions: prioritizedQuestions.length,
          limit: parseInt(limit),
        });
      } catch (error) {
        console.error("Error getting retake questions:", error);
        return ctx.internalServerError("Failed to get retake questions");
      }
    },

    /**
     * Get replayable questions from a specific quiz result
     */
    async getReplayableQuestions(ctx) {
      try {
        const { resultId } = ctx.params;
        const userId = ctx.state.user.id;
        const { type = "all" } = ctx.query; // 'wrong', 'unanswered', or 'all'

        // Get the quiz result
        const result = await strapi
          .documents("api::quiz-result.quiz-result")
          .findOne({
            documentId: resultId,
            populate: {
              quiz: {
                populate: ["questions"],
              },
              questionAnalysis: true,
            },
          });

        if (!result) {
          return ctx.notFound("Quiz result not found");
        }

        // Verify ownership
        if (result.user !== userId && result.user?.documentId !== userId) {
          return ctx.forbidden("You can only access your own quiz results");
        }

        if (
          !result.questionAnalysis ||
          !Array.isArray(result.questionAnalysis)
        ) {
          return ctx.badRequest(
            "No question analysis available for this result"
          );
        }

        // Extract questions based on type
        let replayableQuestions = [];

        result.questionAnalysis.forEach((qa) => {
          const shouldInclude =
            (type === "wrong" && qa.isAttempted && !qa.isCorrect) ||
            (type === "unanswered" && !qa.isAttempted) ||
            (type === "all" && (!qa.isAttempted || !qa.isCorrect));

          if (shouldInclude && qa.questionId) {
            replayableQuestions.push(qa.questionId);
          }
        });

        // Remove duplicates
        replayableQuestions = [...new Set(replayableQuestions)];

        return ctx.send({
          success: true,
          quizId: result.quiz?.documentId || result.quiz,
          quizTitle: result.quiz?.title || "Quiz",
          questionIds: replayableQuestions,
          totalQuestions: replayableQuestions.length,
          type,
          originalResult: {
            id: result.documentId,
            percentage: result.percentage,
            incorrectAnswers: result.incorrectAnswers,
            unansweredQuestions: result.unansweredQuestions,
          },
        });
      } catch (error) {
        console.error("Error getting replayable questions:", error);
        return ctx.internalServerError("Failed to get replayable questions");
      }
    },

    /**
     * Get leaderboard for a quiz or subject
     */
    async getLeaderboard(ctx) {
      try {
        const {
          quizId,
          subjectId,
          topicId,
          period = "30d",
          limit = 10,
        } = ctx.query;

        const filters = {};
        if (quizId) filters.quiz = { documentId: quizId };
        if (subjectId) filters.subject = { documentId: subjectId };
        if (topicId) filters.topic = { documentId: topicId };

        // Add date filter
        const dateFilter = this.buildDateFilter(period);
        Object.assign(filters, dateFilter);

        const results = await strapi
          .documents("api::quiz-result.quiz-result")
          .findMany({
            filters,
            populate: {
              user: {
                fields: ["username", "email", "first_name", "last_name"],
              },
              quiz: {
                fields: ["title"],
              },
            },
            sort: { percentage: "desc", timeTaken: "asc" },
            limit: parseInt(limit) * 2, // Get more to handle duplicates
          });

        // Group by user and get best score
        const userBestScores = new Map();

        results.forEach((result) => {
          const userId = result.user.documentId;
          if (
            !userBestScores.has(userId) ||
            result.percentage > userBestScores.get(userId).percentage ||
            (result.percentage === userBestScores.get(userId).percentage &&
              result.timeTaken < userBestScores.get(userId).timeTaken)
          ) {
            userBestScores.set(userId, result);
          }
        });

        const leaderboard = Array.from(userBestScores.values())
          .sort((a, b) => {
            if (b.percentage !== a.percentage)
              return b.percentage - a.percentage;
            return a.timeTaken - b.timeTaken;
          })
          .slice(0, parseInt(limit))
          .map((result, index) => ({
            rank: index + 1,
            user: {
              id: result.user.documentId,
              username: result.user.username,
              name:
                `${result.user.first_name || ""} ${result.user.last_name || ""}`.trim() ||
                result.user.username,
            },
            score: result.score,
            percentage: result.percentage,
            timeTaken: result.timeTaken,
            attemptDate: result.createdAt,
            quiz: result.quiz,
          }));

        return ctx.send({
          success: true,
          leaderboard,
          period,
          filters: { quizId, subjectId, topicId },
        });
      } catch (error) {
        console.error("Error getting leaderboard:", error);
        return ctx.internalServerError("Failed to get leaderboard");
      }
    },

    // Helper methods
    async calculateQuizAnalysis(quiz, answers, questionTimings) {
      const questions = quiz.questions || [];
      const totalQuestions = questions.length;
      let correctAnswers = 0;
      let incorrectAnswers = 0;
      let unansweredQuestions = 0;

      const questionAnalysis = [];
      const topicPerformance = {};
      const difficultyPerformance = {};
      const retakeQuestions = [];

      questions.forEach((question, index) => {
        const userAnswer = answers.find(
          (a) => a.questionId === question.documentId
        );
        const isCorrect =
          userAnswer && this.isAnswerCorrect(question, userAnswer);
        const timeSpent = questionTimings?.[question.documentId] || 0;

        if (!userAnswer) {
          unansweredQuestions++;
        } else if (isCorrect) {
          correctAnswers++;
        } else {
          incorrectAnswers++;
          retakeQuestions.push(question.documentId);
        }

        questionAnalysis.push({
          questionId: question.documentId,
          isCorrect: !!isCorrect,
          timeSpent,
          selectedAnswer: userAnswer?.selectedAnswer,
          correctAnswer: question.correctAnswer,
          difficulty: question.difficulty || "beginner",
          topic: question.topic,
          points: question.points || 1,
        });

        // Track performance by topic and difficulty
        const topic = question.topic || "general";
        const difficulty = question.difficulty || "beginner";

        if (!topicPerformance[topic])
          topicPerformance[topic] = { correct: 0, total: 0 };
        if (!difficultyPerformance[difficulty])
          difficultyPerformance[difficulty] = { correct: 0, total: 0 };

        topicPerformance[topic].total++;
        difficultyPerformance[difficulty].total++;

        if (isCorrect) {
          topicPerformance[topic].correct++;
          difficultyPerformance[difficulty].correct++;
        }
      });

      const score = correctAnswers;
      const percentage =
        totalQuestions > 0
          ? Math.round((correctAnswers / totalQuestions) * 100)
          : 0;
      const isPassed = percentage >= (quiz.passingScore || 70);

      // Identify weak and strong areas
      const weakAreas = Object.entries(topicPerformance)
        .filter(([_, perf]) => perf.correct / perf.total < 0.6)
        .map(([topic, perf]) => ({
          topic,
          percentage: Math.round((perf.correct / perf.total) * 100),
        }));

      const strongAreas = Object.entries(topicPerformance)
        .filter(([_, perf]) => perf.correct / perf.total >= 0.8)
        .map(([topic, perf]) => ({
          topic,
          percentage: Math.round((perf.correct / perf.total) * 100),
        }));

      return {
        score,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        unansweredQuestions,
        percentage,
        isPassed,
        questionAnalysis,
        weakAreas,
        strongAreas,
        recommendedRetake: !isPassed || percentage < 80,
        retakeQuestions,
        improvementSuggestions: this.generateImprovementSuggestions(
          weakAreas,
          difficultyPerformance,
          percentage
        ),
      };
    },

    isAnswerCorrect(question, userAnswer) {
      if (!userAnswer.selectedAnswer) return false;

      switch (question.questionType) {
        case "SC":
        case "TF":
          return userAnswer.selectedAnswer === question.correctAnswer;
        case "MCQ":
          const correctAnswers = Array.isArray(question.correctAnswer)
            ? question.correctAnswer
            : [question.correctAnswer];
          const selectedAnswers = Array.isArray(userAnswer.selectedAnswer)
            ? userAnswer.selectedAnswer
            : [userAnswer.selectedAnswer];
          return (
            correctAnswers.length === selectedAnswers.length &&
            correctAnswers.every((ans) => selectedAnswers.includes(ans))
          );
        default:
          return userAnswer.selectedAnswer === question.correctAnswer;
      }
    },

    generateImprovementSuggestions(
      weakAreas,
      difficultyPerformance,
      percentage
    ) {
      const suggestions = [];

      if (percentage < 50) {
        suggestions.push(
          "Consider reviewing the basic concepts before retaking the quiz"
        );
      } else if (percentage < 70) {
        suggestions.push(
          "You're close to passing! Focus on your weak areas and try again"
        );
      }

      weakAreas.forEach((area) => {
        suggestions.push(
          `Focus more time studying ${area.topic} - you got ${area.percentage}% correct`
        );
      });

      Object.entries(difficultyPerformance).forEach(([difficulty, perf]) => {
        const difficultyPercentage = Math.round(
          (perf.correct / perf.total) * 100
        );
        if (difficultyPercentage < 60) {
          suggestions.push(
            `Practice more ${difficulty} level questions - current performance: ${difficultyPercentage}%`
          );
        }
      });

      return suggestions.slice(0, 5); // Limit to 5 suggestions
    },

    buildDateFilter(period, startDate, endDate) {
      if (startDate && endDate) {
        return {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        };
      }

      const now = new Date();
      const periodMap = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "1y": 365,
      };

      const days = periodMap[period] || 30;
      const startDateCalc = new Date(
        now.getTime() - days * 24 * 60 * 60 * 1000
      );

      return {
        createdAt: {
          $gte: startDateCalc,
        },
      };
    },

    calculateTrends(results) {
      if (results.length === 0) return null;

      const trends = {
        averageScore: 0,
        averagePercentage: 0,
        totalAttempts: results.length,
        passRate: 0,
        averageTimePerQuiz: 0,
        improvementTrend: 0,
        recentPerformance: [],
        subjectBreakdown: {},
        weeklyProgress: {},
      };

      // Calculate averages
      let totalScore = 0;
      let totalPercentage = 0;
      let totalTime = 0;
      let passedAttempts = 0;

      results.forEach((result) => {
        totalScore += result.score || 0;
        totalPercentage += result.percentage || 0;
        totalTime += result.timeTaken || 0;
        if (result.isPassed) passedAttempts++;

        // Subject breakdown
        const subjectName =
          result.subject?.name || result.quiz?.subject?.name || "Unknown";
        if (!trends.subjectBreakdown[subjectName]) {
          trends.subjectBreakdown[subjectName] = {
            attempts: 0,
            totalPercentage: 0,
            passed: 0,
          };
        }
        trends.subjectBreakdown[subjectName].attempts++;
        trends.subjectBreakdown[subjectName].totalPercentage +=
          result.percentage || 0;
        if (result.isPassed) trends.subjectBreakdown[subjectName].passed++;

        // Weekly progress
        const weekKey = this.getWeekKey(new Date(result.createdAt));
        if (!trends.weeklyProgress[weekKey]) {
          trends.weeklyProgress[weekKey] = {
            attempts: 0,
            totalPercentage: 0,
            passed: 0,
          };
        }
        trends.weeklyProgress[weekKey].attempts++;
        trends.weeklyProgress[weekKey].totalPercentage +=
          result.percentage || 0;
        if (result.isPassed) trends.weeklyProgress[weekKey].passed++;
      });

      trends.averageScore = Math.round(totalScore / results.length);
      trends.averagePercentage = Math.round(totalPercentage / results.length);
      trends.passRate = Math.round((passedAttempts / results.length) * 100);
      trends.averageTimePerQuiz = Math.round(totalTime / results.length);

      // Calculate improvement trend (compare first half vs second half)
      const midPoint = Math.floor(results.length / 2);
      if (results.length >= 4) {
        const firstHalf = results.slice(0, midPoint);
        const secondHalf = results.slice(midPoint);

        const firstAvg =
          firstHalf.reduce((sum, r) => sum + (r.percentage || 0), 0) /
          firstHalf.length;
        const secondAvg =
          secondHalf.reduce((sum, r) => sum + (r.percentage || 0), 0) /
          secondHalf.length;

        trends.improvementTrend = Math.round(secondAvg - firstAvg);
      }

      // Recent performance (last 5 attempts)
      trends.recentPerformance = results.slice(-5).map((result) => ({
        date: result.createdAt,
        percentage: result.percentage,
        passed: result.isPassed,
        quiz: result.quiz?.title || "Unknown Quiz",
      }));

      // Process subject breakdown percentages
      Object.keys(trends.subjectBreakdown).forEach((subject) => {
        const subjectData = trends.subjectBreakdown[subject];
        subjectData.averagePercentage = Math.round(
          subjectData.totalPercentage / subjectData.attempts
        );
        subjectData.passRate = Math.round(
          (subjectData.passed / subjectData.attempts) * 100
        );
        delete subjectData.totalPercentage;
      });

      return trends;
    },

    calculateOverallPerformance(results) {
      // Implementation for overall performance calculation
      return {
        totalQuizzes: results.length,
        averageScore:
          results.reduce((sum, r) => sum + (r.percentage || 0), 0) /
            results.length || 0,
        bestScore: Math.max(...results.map((r) => r.percentage || 0)),
        worstScore: Math.min(...results.map((r) => r.percentage || 0)),
        passRate:
          (results.filter((r) => r.isPassed).length / results.length) * 100 ||
          0,
      };
    },

    calculatePerformanceBySubject(results) {
      // Group results by subject and calculate performance metrics
      const subjectPerformance = {};

      results.forEach((result) => {
        const subject = result.subject?.name || "Unknown";
        if (!subjectPerformance[subject]) {
          subjectPerformance[subject] = [];
        }
        subjectPerformance[subject].push(result);
      });

      return Object.entries(subjectPerformance).map(
        ([subject, subjectResults]) => ({
          subject,
          averageScore:
            subjectResults.reduce((sum, r) => sum + (r.percentage || 0), 0) /
            subjectResults.length,
          attempts: subjectResults.length,
          passRate:
            (subjectResults.filter((r) => r.isPassed).length /
              subjectResults.length) *
            100,
        })
      );
    },

    calculatePerformanceByTopic(results) {
      // Similar to subject but for topics
      const topicPerformance = {};

      results.forEach((result) => {
        const topic = result.topic?.name || "Unknown";
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = [];
        }
        topicPerformance[topic].push(result);
      });

      return Object.entries(topicPerformance).map(([topic, topicResults]) => ({
        topic,
        averageScore:
          topicResults.reduce((sum, r) => sum + (r.percentage || 0), 0) /
          topicResults.length,
        attempts: topicResults.length,
        passRate:
          (topicResults.filter((r) => r.isPassed).length /
            topicResults.length) *
          100,
      }));
    },

    calculatePerformanceByDifficulty(results) {
      // Extract difficulty from question analysis
      const difficultyPerformance = {
        beginner: [],
        intermediate: [],
        advanced: [],
      };

      results.forEach((result) => {
        if (result.questionAnalysis) {
          result.questionAnalysis.forEach((qa) => {
            const difficulty = qa.difficulty || "beginner";
            if (!difficultyPerformance[difficulty])
              difficultyPerformance[difficulty] = [];
            difficultyPerformance[difficulty].push(qa);
          });
        }
      });

      return Object.entries(difficultyPerformance).map(
        ([difficulty, questions]) => {
          const correctCount = questions.filter((q) => q.isCorrect).length;
          return {
            difficulty,
            accuracy:
              questions.length > 0
                ? (correctCount / questions.length) * 100
                : 0,
            totalQuestions: questions.length,
            correctAnswers: correctCount,
          };
        }
      );
    },

    calculateProgressTrend(results) {
      // Calculate progress over time
      return results.map((result, index) => ({
        attempt: index + 1,
        date: result.createdAt,
        percentage: result.percentage,
        movingAverage: this.calculateMovingAverage(results.slice(0, index + 1)),
      }));
    },

    calculateTimeAnalysis(results) {
      const times = results.map((r) => r.timeTaken || 0).filter((t) => t > 0);
      return {
        averageTime: times.reduce((sum, t) => sum + t, 0) / times.length || 0,
        fastestTime: Math.min(...times) || 0,
        slowestTime: Math.max(...times) || 0,
        timeImprovement: this.calculateTimeImprovement(results),
      };
    },

    calculateMovingAverage(results, window = 3) {
      const recentResults = results.slice(-window);
      return (
        recentResults.reduce((sum, r) => sum + (r.percentage || 0), 0) /
        recentResults.length
      );
    },

    calculateTimeImprovement(results) {
      if (results.length < 2) return 0;

      const firstHalf = results.slice(0, Math.floor(results.length / 2));
      const secondHalf = results.slice(Math.floor(results.length / 2));

      const firstAvgTime =
        firstHalf.reduce((sum, r) => sum + (r.timeTaken || 0), 0) /
        firstHalf.length;
      const secondAvgTime =
        secondHalf.reduce((sum, r) => sum + (r.timeTaken || 0), 0) /
        secondHalf.length;

      return firstAvgTime - secondAvgTime; // Positive means improvement (less time)
    },

    identifyStrengths(results) {
      // Analyze patterns to identify user strengths
      const topicPerformance = this.calculatePerformanceByTopic(results);
      return topicPerformance
        .filter((tp) => tp.averageScore >= 80 && tp.attempts >= 2)
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 5);
    },

    identifyWeaknesses(results) {
      // Analyze patterns to identify areas for improvement
      const topicPerformance = this.calculatePerformanceByTopic(results);
      return topicPerformance
        .filter((tp) => tp.averageScore < 70 && tp.attempts >= 2)
        .sort((a, b) => a.averageScore - b.averageScore)
        .slice(0, 5);
    },

    generateRecommendations(results) {
      const recommendations = [];
      const strengths = this.identifyStrengths(results);
      const weaknesses = this.identifyWeaknesses(results);
      const timeAnalysis = this.calculateTimeAnalysis(results);

      if (weaknesses.length > 0) {
        recommendations.push({
          type: "improvement",
          priority: "high",
          message: `Focus on improving your performance in ${weaknesses[0].topic}`,
          action: "practice_topic",
          data: { topic: weaknesses[0].topic },
        });
      }

      if (timeAnalysis.averageTime > 300) {
        // 5 minutes
        recommendations.push({
          type: "time_management",
          priority: "medium",
          message: "Try to improve your quiz completion time",
          action: "time_practice",
        });
      }

      if (strengths.length > 0) {
        recommendations.push({
          type: "strength",
          priority: "low",
          message: `Great work on ${strengths[0].topic}! Consider mentoring others`,
          action: "mentor",
        });
      }

      return recommendations;
    },

    getWeekKey(date) {
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - startOfYear) / 86400000;
      const weekNumber = Math.ceil(
        (pastDaysOfYear + startOfYear.getDay() + 1) / 7
      );
      return `${date.getFullYear()}-W${weekNumber}`;
    },
  })
);
