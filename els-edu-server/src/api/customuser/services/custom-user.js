'use strict';

/**
 * customuser service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::customuser.custom-user');
