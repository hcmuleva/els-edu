module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/users/update-doc/:documentId',
      handler: 'user-update.updateByDocumentId',
      config: {
        auth: {},       // required in Strapi v5 (not `true`)
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/admin-reset-password',
      handler: 'user-update.adminResetPassword',
      config: {
        auth: {}, // Strapi v5 requires this
        policies: [], // optional custom role check
      },
    },
    {
      method: 'POST',
      path: '/migrations/set-default-student-roles',
      handler: 'user-update.runSetDefaultStudentRoles',
      config: {
        auth: {}, // Require authentication
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/users/create-with-org',
      handler: 'user-update.createUserWithOrg',
      config: {
        auth: {}, // Require authentication (empty object means auth required in Strapi v5)
        policies: [],
      },
    }
  ],
};
