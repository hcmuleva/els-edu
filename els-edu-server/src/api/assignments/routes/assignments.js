'use strict';

/**
 * assignments router
 */

// Custom routes for assignments
module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/assignments/assign-courses-to-org',
      handler: 'assignments.assignCoursesToOrg',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/assignments/assign-courses-to-user',
      handler: 'assignments.assignCoursesToUser',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/assignments/assign-subjects-to-user',
      handler: 'assignments.assignSubjectsToUser',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/assignments/user/:userId/courses',
      handler: 'assignments.getUserCourses',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/assignments/user/:userId/subjects',
      handler: 'assignments.getUserSubjects',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

