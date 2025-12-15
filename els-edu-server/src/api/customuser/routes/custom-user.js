'use strict';

/**
 * customuser router
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/create-with-org',
      handler: 'custom-user.createUserWithOrg',
      config: {
        auth: {}, // Require authentication
        policies: [],
      },
    },
  ],
};
