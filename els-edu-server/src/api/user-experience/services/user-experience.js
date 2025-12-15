'use strict';

/**
 * user-experience service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::user-experience.user-experience');
