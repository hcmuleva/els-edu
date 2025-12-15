'use strict';

/**
 * user-metadata service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::user-metadata.user-metadata');
