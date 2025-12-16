'use strict';

/**
 * Enhanced quiz-result router with analytics endpoints
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Create custom routes configuration
module.exports = {
    routes: [
        // Submit quiz result with analysis
        {
            method: 'POST',
            path: '/quiz-results/submit',
            handler: 'quiz-result.submitResult',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        // Get user trends and analytics
        {
            method: 'GET',
            path: '/quiz-results/trends',
            handler: 'quiz-result.getUserTrends',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        // Get detailed performance analytics
        {
            method: 'GET',
            path: '/quiz-results/analytics',
            handler: 'quiz-result.getPerformanceAnalytics',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        // Get questions for retake
        {
            method: 'GET',
            path: '/quiz-results/retake-questions',
            handler: 'quiz-result.getRetakeQuestions',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        // Get leaderboard
        {
            method: 'GET',
            path: '/quiz-results/leaderboard',
            handler: 'quiz-result.getLeaderboard',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
