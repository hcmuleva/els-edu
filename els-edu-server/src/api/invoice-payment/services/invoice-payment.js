'use strict';

/**
 * invoice-payment service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::invoice-payment.invoice-payment');