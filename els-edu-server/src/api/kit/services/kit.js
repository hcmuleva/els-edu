'use strict';

/**
 * kit service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::kit.kit');
