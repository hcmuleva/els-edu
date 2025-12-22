"use strict";

/**
 * webhook-event controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::webhook-event.webhook-event");
