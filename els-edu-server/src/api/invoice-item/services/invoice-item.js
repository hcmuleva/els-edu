'use strict';

/**
 * invoice-item service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::invoice-item.invoice-item');