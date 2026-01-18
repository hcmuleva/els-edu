"use strict";

/**
 * MongoDB Studio routes
 */

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/mongo-studio/:collection",
      handler: "mongo-studio.getCollection",
      config: {
        auth: {},
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/mongo-studio/:collection/:id",
      handler: "mongo-studio.getItem",
      config: {
        auth: {},
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/mongo-studio/:collection",
      handler: "mongo-studio.createItem",
      config: {
        auth: {},
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "PUT",
      path: "/mongo-studio/:collection/:id",
      handler: "mongo-studio.updateItem",
      config: {
        auth: {},
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "DELETE",
      path: "/mongo-studio/:collection/:id",
      handler: "mongo-studio.deleteItem",
      config: {
        auth: {},
        policies: [],
        middlewares: [],
      },
    },
  ],
};



