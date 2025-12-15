'use strict';

/**
 * user-repo service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::user-repo.user-repo');
