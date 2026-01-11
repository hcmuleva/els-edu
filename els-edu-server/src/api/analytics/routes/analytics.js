"use strict";

/**
 * Analytics Routes
 * Custom API for analytics survey and skill recommendations
 */

module.exports = {
  routes: [
    // Get all companies (public - for survey flow)
    {
      method: "GET",
      path: "/analytics/companies",
      handler: "analytics.getCompanies",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Get all domains (public - for survey flow)
    {
      method: "GET",
      path: "/analytics/domains",
      handler: "analytics.getDomains",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Get roles (public - for survey flow)
    {
      method: "GET",
      path: "/analytics/roles",
      handler: "analytics.getRoles",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Get skills for a role (public - for survey flow)
    {
      method: "GET",
      path: "/analytics/skills",
      handler: "analytics.getSkills",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Submit survey (requires auth)
    {
      method: "POST",
      path: "/analytics/survey",
      handler: "analytics.submitSurvey",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Get user survey results (requires auth)
    {
      method: "GET",
      path: "/analytics/survey-results",
      handler: "analytics.getSurveyResults",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Seed data (public for development, should be protected in production)
    {
      method: "POST",
      path: "/analytics/seed",
      handler: "analytics.seedData",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Quiz - Get topics for skills (public)
    {
      method: "GET",
      path: "/analytics/quiz/topics",
      handler: "analytics.getQuizTopics",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Quiz - Get random questions (public)
    {
      method: "GET",
      path: "/analytics/quiz/questions",
      handler: "analytics.getQuizQuestions",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Quiz - Submit quiz (requires auth)
    {
      method: "POST",
      path: "/analytics/quiz/submit",
      handler: "analytics.submitQuiz",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Quiz - Get quiz results (requires auth)
    {
      method: "GET",
      path: "/analytics/quiz/results",
      handler: "analytics.getQuizResults",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Get Strapi topics for linking (public)
    {
      method: "GET",
      path: "/analytics/strapi-topics",
      handler: "analytics.getStrapiTopics",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Link topics to skill (public for dev)
    {
      method: "POST",
      path: "/analytics/skills/link-topics",
      handler: "analytics.linkTopicsToSkill",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
