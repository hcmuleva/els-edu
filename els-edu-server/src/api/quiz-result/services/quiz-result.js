'use strict';

/**
 * Enhanced quiz-result service with analytics capabilities
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::quiz-result.quiz-result', ({ strapi }) => ({

    /**
     * Calculate comprehensive quiz statistics for administrators
     */
    async getQuizStatistics(quizId, filters = {}) {
        try {
            const baseFilters = { quiz: { documentId: quizId }, ...filters };

            const results = await strapi.documents('api::quiz-result.quiz-result').findMany({
                filters: baseFilters,
                populate: {
                    user: {
                        fields: ['username', 'first_name', 'last_name']
                    },
                    quiz: {
                        populate: ['questions', 'subject', 'topic']
                    }
                }
            });

            if (results.length === 0) {
                return {
                    totalAttempts: 0,
                    uniqueUsers: 0,
                    averageScore: 0,
                    passRate: 0,
                    completionRate: 0
                };
            }

            // Basic statistics
            const totalAttempts = results.length;
            const uniqueUsers = new Set(results.map(r => r.user.documentId)).size;
            const averageScore = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalAttempts;
            const passRate = (results.filter(r => r.isPassed).length / totalAttempts) * 100;

            // Question analysis
            const questionStats = this.analyzeQuestionPerformance(results);

            // Time analysis
            const timeStats = this.analyzeTimeStatistics(results);

            // Performance distribution
            const performanceDistribution = this.calculatePerformanceDistribution(results);

            // Difficulty analysis
            const difficultyAnalysis = this.analyzeDifficultyPerformance(results);

            return {
                overview: {
                    totalAttempts,
                    uniqueUsers,
                    averageScore: Math.round(averageScore),
                    passRate: Math.round(passRate),
                    averageTime: Math.round(timeStats.averageTime),
                    retakeRate: this.calculateRetakeRate(results)
                },
                questionPerformance: questionStats,
                timeAnalysis: timeStats,
                performanceDistribution,
                difficultyAnalysis,
                trends: this.calculateQuizTrends(results),
                recommendations: this.generateQuizRecommendations(results, questionStats)
            };

        } catch (error) {
            console.error('Error calculating quiz statistics:', error);
            throw error;
        }
    },

    /**
     * Analyze performance of individual questions
     */
    analyzeQuestionPerformance(results) {
        const questionStats = new Map();

        results.forEach(result => {
            if (result.questionAnalysis && Array.isArray(result.questionAnalysis)) {
                result.questionAnalysis.forEach(qa => {
                    if (!questionStats.has(qa.questionId)) {
                        questionStats.set(qa.questionId, {
                            questionId: qa.questionId,
                            totalAttempts: 0,
                            correctAttempts: 0,
                            averageTime: 0,
                            totalTime: 0,
                            difficulty: qa.difficulty || 'beginner'
                        });
                    }

                    const stats = questionStats.get(qa.questionId);
                    stats.totalAttempts++;
                    stats.totalTime += qa.timeSpent || 0;

                    if (qa.isCorrect) {
                        stats.correctAttempts++;
                    }
                });
            }
        });

        // Calculate averages and sort by performance
        return Array.from(questionStats.values())
            .map(stats => ({
                ...stats,
                successRate: Math.round((stats.correctAttempts / stats.totalAttempts) * 100),
                averageTime: Math.round(stats.totalTime / stats.totalAttempts),
                difficulty: stats.difficulty
            }))
            .sort((a, b) => a.successRate - b.successRate); // Worst performing first
    },

    /**
     * Analyze time-related statistics
     */
    analyzeTimeStatistics(results) {
        const times = results.map(r => r.timeTaken || 0).filter(t => t > 0);

        if (times.length === 0) {
            return {
                averageTime: 0,
                medianTime: 0,
                fastestTime: 0,
                slowestTime: 0,
                timeDistribution: []
            };
        }

        times.sort((a, b) => a - b);

        return {
            averageTime: times.reduce((sum, t) => sum + t, 0) / times.length,
            medianTime: times[Math.floor(times.length / 2)],
            fastestTime: times[0],
            slowestTime: times[times.length - 1],
            timeDistribution: this.createTimeDistribution(times)
        };
    },

    /**
     * Calculate performance distribution (score ranges)
     */
    calculatePerformanceDistribution(results) {
        const ranges = {
            '0-20': 0,
            '21-40': 0,
            '41-60': 0,
            '61-80': 0,
            '81-100': 0
        };

        results.forEach(result => {
            const percentage = result.percentage || 0;
            if (percentage <= 20) ranges['0-20']++;
            else if (percentage <= 40) ranges['21-40']++;
            else if (percentage <= 60) ranges['41-60']++;
            else if (percentage <= 80) ranges['61-80']++;
            else ranges['81-100']++;
        });

        return Object.entries(ranges).map(([range, count]) => ({
            range,
            count,
            percentage: Math.round((count / results.length) * 100)
        }));
    },

    /**
     * Analyze performance by difficulty level
     */
    analyzeDifficultyPerformance(results) {
        const difficultyStats = {
            beginner: { correct: 0, total: 0 },
            intermediate: { correct: 0, total: 0 },
            advanced: { correct: 0, total: 0 }
        };

        results.forEach(result => {
            if (result.questionAnalysis) {
                result.questionAnalysis.forEach(qa => {
                    const difficulty = qa.difficulty || 'beginner';
                    if (difficultyStats[difficulty]) {
                        difficultyStats[difficulty].total++;
                        if (qa.isCorrect) {
                            difficultyStats[difficulty].correct++;
                        }
                    }
                });
            }
        });

        return Object.entries(difficultyStats).map(([difficulty, stats]) => ({
            difficulty,
            accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
            totalQuestions: stats.total,
            correctAnswers: stats.correct
        }));
    },

    /**
     * Calculate retake rate
     */
    calculateRetakeRate(results) {
        const userAttempts = new Map();

        results.forEach(result => {
            const userId = result.user.documentId;
            userAttempts.set(userId, (userAttempts.get(userId) || 0) + 1);
        });

        const usersWithMultipleAttempts = Array.from(userAttempts.values())
            .filter(attempts => attempts > 1).length;

        const totalUsers = userAttempts.size;

        return totalUsers > 0 ? Math.round((usersWithMultipleAttempts / totalUsers) * 100) : 0;
    },

    /**
     * Calculate quiz trends over time
     */
    calculateQuizTrends(results) {
        // Sort by date
        const sortedResults = results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Group by week
        const weeklyData = {};

        sortedResults.forEach(result => {
            const date = new Date(result.createdAt);
            const weekKey = this.getWeekKey(date);

            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = {
                    attempts: 0,
                    totalScore: 0,
                    passed: 0
                };
            }

            weeklyData[weekKey].attempts++;
            weeklyData[weekKey].totalScore += result.percentage || 0;
            if (result.isPassed) weeklyData[weekKey].passed++;
        });

        return Object.entries(weeklyData).map(([week, data]) => ({
            week,
            attempts: data.attempts,
            averageScore: Math.round(data.totalScore / data.attempts),
            passRate: Math.round((data.passed / data.attempts) * 100)
        })).sort((a, b) => a.week.localeCompare(b.week));
    },

    /**
     * Generate recommendations for quiz improvement
     */
    generateQuizRecommendations(results, questionStats) {
        const recommendations = [];

        // Identify difficult questions (success rate < 50%)
        const difficultQuestions = questionStats.filter(q => q.successRate < 50);
        if (difficultQuestions.length > 0) {
            recommendations.push({
                type: 'question_difficulty',
                priority: 'high',
                message: `${difficultQuestions.length} questions have success rates below 50%`,
                action: 'review_questions',
                data: { questionIds: difficultQuestions.map(q => q.questionId) }
            });
        }

        // Check average completion time
        const avgTime = results.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / results.length;
        if (avgTime > 1800) { // 30 minutes
            recommendations.push({
                type: 'time_limit',
                priority: 'medium',
                message: 'Average completion time is quite high, consider reviewing time limits',
                action: 'adjust_time_limit'
            });
        }

        // Check pass rate
        const passRate = (results.filter(r => r.isPassed).length / results.length) * 100;
        if (passRate < 60) {
            recommendations.push({
                type: 'pass_rate',
                priority: 'high',
                message: `Pass rate is ${Math.round(passRate)}%, consider reviewing difficulty`,
                action: 'review_difficulty'
            });
        } else if (passRate > 90) {
            recommendations.push({
                type: 'pass_rate',
                priority: 'low',
                message: `Pass rate is ${Math.round(passRate)}%, quiz might be too easy`,
                action: 'increase_difficulty'
            });
        }

        return recommendations;
    },

    /**
     * Create time distribution buckets
     */
    createTimeDistribution(times) {
        const maxTime = Math.max(...times);
        const bucketSize = Math.ceil(maxTime / 10);
        const buckets = Array.from({ length: 10 }, (_, i) => ({
            range: `${i * bucketSize}-${(i + 1) * bucketSize}`,
            count: 0
        }));

        times.forEach(time => {
            const bucketIndex = Math.min(Math.floor(time / bucketSize), 9);
            buckets[bucketIndex].count++;
        });

        return buckets;
    },

    /**
     * Get user performance summary
     */
    async getUserPerformanceSummary(userId, filters = {}) {
        try {
            const results = await strapi.documents('api::quiz-result.quiz-result').findMany({
                filters: {
                    user: { documentId: userId },
                    ...filters
                },
                populate: {
                    quiz: {
                        populate: ['subject', 'topic']
                    },
                    subject: true,
                    topic: true
                },
                sort: { createdAt: 'desc' }
            });

            if (results.length === 0) {
                return {
                    totalAttempts: 0,
                    averageScore: 0,
                    passRate: 0,
                    recentTrend: 'stable'
                };
            }

            const totalAttempts = results.length;
            const averageScore = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalAttempts;
            const passRate = (results.filter(r => r.isPassed).length / totalAttempts) * 100;

            // Calculate recent trend (last 5 vs previous 5)
            const recentTrend = this.calculateRecentTrend(results);

            // Identify strengths and weaknesses
            const strengths = this.identifyUserStrengths(results);
            const weaknesses = this.identifyUserWeaknesses(results);

            // Calculate improvement areas
            const improvementAreas = this.calculateImprovementAreas(results);

            return {
                overview: {
                    totalAttempts,
                    averageScore: Math.round(averageScore),
                    passRate: Math.round(passRate),
                    recentTrend,
                    bestScore: Math.max(...results.map(r => r.percentage || 0)),
                    worstScore: Math.min(...results.map(r => r.percentage || 0))
                },
                strengths,
                weaknesses,
                improvementAreas,
                recentPerformance: results.slice(0, 10).map(r => ({
                    quizTitle: r.quiz?.title || 'Unknown Quiz',
                    percentage: r.percentage,
                    passed: r.isPassed,
                    date: r.createdAt,
                    subject: r.subject?.name || r.quiz?.subject?.name
                }))
            };

        } catch (error) {
            console.error('Error getting user performance summary:', error);
            throw error;
        }
    },

    /**
     * Calculate recent performance trend
     */
    calculateRecentTrend(results) {
        if (results.length < 6) return 'insufficient_data';

        const recent = results.slice(0, 5);
        const previous = results.slice(5, 10);

        const recentAvg = recent.reduce((sum, r) => sum + (r.percentage || 0), 0) / recent.length;
        const previousAvg = previous.reduce((sum, r) => sum + (r.percentage || 0), 0) / previous.length;

        const difference = recentAvg - previousAvg;

        if (difference > 5) return 'improving';
        if (difference < -5) return 'declining';
        return 'stable';
    },

    /**
     * Identify user strengths based on performance patterns
     */
    identifyUserStrengths(results) {
        const subjectPerformance = {};
        const topicPerformance = {};

        results.forEach(result => {
            const subject = result.subject?.name || result.quiz?.subject?.name;
            const topic = result.topic?.name || result.quiz?.topic?.name;

            if (subject) {
                if (!subjectPerformance[subject]) subjectPerformance[subject] = [];
                subjectPerformance[subject].push(result.percentage || 0);
            }

            if (topic) {
                if (!topicPerformance[topic]) topicPerformance[topic] = [];
                topicPerformance[topic].push(result.percentage || 0);
            }
        });

        const strengths = [];

        // Find subjects with consistently high performance
        Object.entries(subjectPerformance).forEach(([subject, scores]) => {
            const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            if (avgScore >= 80 && scores.length >= 3) {
                strengths.push({
                    type: 'subject',
                    name: subject,
                    averageScore: Math.round(avgScore),
                    attempts: scores.length
                });
            }
        });

        return strengths.sort((a, b) => b.averageScore - a.averageScore);
    },

    /**
     * Identify user weaknesses that need improvement
     */
    identifyUserWeaknesses(results) {
        const subjectPerformance = {};

        results.forEach(result => {
            const subject = result.subject?.name || result.quiz?.subject?.name;

            if (subject) {
                if (!subjectPerformance[subject]) subjectPerformance[subject] = [];
                subjectPerformance[subject].push(result.percentage || 0);
            }
        });

        const weaknesses = [];

        // Find subjects with consistently low performance
        Object.entries(subjectPerformance).forEach(([subject, scores]) => {
            const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            if (avgScore < 70 && scores.length >= 2) {
                weaknesses.push({
                    type: 'subject',
                    name: subject,
                    averageScore: Math.round(avgScore),
                    attempts: scores.length,
                    improvementNeeded: 70 - avgScore
                });
            }
        });

        return weaknesses.sort((a, b) => a.averageScore - b.averageScore);
    },

    /**
     * Calculate specific improvement areas
     */
    calculateImprovementAreas(results) {
        const areas = [];

        // Analyze question types that user struggles with
        const questionTypePerformance = {};

        results.forEach(result => {
            if (result.questionAnalysis) {
                result.questionAnalysis.forEach(qa => {
                    const questionType = qa.questionType || 'unknown';
                    if (!questionTypePerformance[questionType]) {
                        questionTypePerformance[questionType] = { correct: 0, total: 0 };
                    }

                    questionTypePerformance[questionType].total++;
                    if (qa.isCorrect) {
                        questionTypePerformance[questionType].correct++;
                    }
                });
            }
        });

        Object.entries(questionTypePerformance).forEach(([type, perf]) => {
            const accuracy = (perf.correct / perf.total) * 100;
            if (accuracy < 60 && perf.total >= 5) {
                areas.push({
                    area: `${type} questions`,
                    currentAccuracy: Math.round(accuracy),
                    attempts: perf.total,
                    recommendation: `Practice more ${type} type questions`
                });
            }
        });

        return areas;
    },

    /**
     * Helper method to get week key
     */
    getWeekKey(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - startOfYear) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    }
}));
