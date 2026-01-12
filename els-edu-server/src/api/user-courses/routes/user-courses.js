"use strict";

/**
 * User Courses Routes
 * Custom API endpoints for fetching user courses from Strapi and MongoDB
 */

module.exports = {
  routes: [
    // Get all courses (Strapi + MongoDB combined)
    {
      method: "GET",
      path: "/user-courses/my-courses",
      handler: "user-courses.getMyCourses",
      config: {
        auth: {}, // Require authentication
        policies: [],
        middlewares: [],
      },
    },
    // Get only Strapi courses (from subscriptions)
    {
      method: "GET",
      path: "/user-courses/strapi-courses",
      handler: "user-courses.getStrapiCourses",
      config: {
        auth: {}, // Require authentication
        policies: [],
        middlewares: [],
      },
    },
    // Get only MongoDB custom courses
    {
      method: "GET",
      path: "/user-courses/custom-courses",
      handler: "user-courses.getCustomCourses",
      config: {
        auth: {}, // Require authentication
        policies: [],
        middlewares: [],
      },
    },
    // Create a new custom course in MongoDB
    {
      method: "POST",
      path: "/user-courses/custom-courses",
      handler: "user-courses.createCustomCourse",
      config: {
        auth: {}, // Require authentication
        policies: [],
        middlewares: [],
      },
    },
    // Get surveys for a user (for admin/teacher)
    {
      method: "GET",
      path: "/user-courses/user/:userDocumentId/surveys",
      handler: "user-courses.getUserSurveys",
      config: {
        auth: {}, // Require authentication
        policies: [],
        middlewares: [],
      },
    },
    // Get subjects from survey skills
    {
      method: "GET",
      path: "/user-courses/survey/:surveyId/subjects",
      handler: "user-courses.getSubjectsFromSurvey",
      config: {
        auth: {}, // Require authentication
        policies: [],
        middlewares: [],
      },
    },
    // Update custom course
    {
      method: "PUT",
      path: "/user-courses/custom-courses/:courseId",
      handler: "user-courses.updateCustomCourse",
      config: {
        auth: {}, // Require authentication
        policies: [],
        middlewares: [],
      },
    },
    // Delete custom course
    {
      method: "DELETE",
      path: "/user-courses/custom-courses/:courseId",
      handler: "user-courses.deleteCustomCourse",
      config: {
        auth: {}, // Require authentication
        policies: [],
        middlewares: [],
      },
    },
    // Get custom courses for a specific user (admin/teacher)
    {
      method: "GET",
      path: "/user-courses/user/:userDocumentId/custom-courses",
      handler: "user-courses.getUserCustomCourses",
      config: {
        auth: {}, // Require authentication
        policies: [],
        middlewares: [],
      },
    },
    // Create custom course for a specific user (admin/teacher)
    {
      method: "POST",
      path: "/user-courses/user/:userDocumentId/custom-courses",
      handler: "user-courses.createUserCustomCourse",
      config: {
        auth: {}, // Require authentication
        policies: [],
        middlewares: [],
      },
    },
  ],
};

