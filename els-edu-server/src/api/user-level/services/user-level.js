'use strict';

/**
 * user-level service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::user-level.user-level');
