'use strict';

/**
 * org-metadata service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::org-metadata.org-metadata');
