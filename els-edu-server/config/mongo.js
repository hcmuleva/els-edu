/**
 * MongoDB Connection Configuration for Analytics
 * Database: els_mongo
 * Container: els_mongo on port 27018
 */

  module.exports = {
    uri:
      process.env.MONGO_URI ||
      "mongodb://admin:password@localhost:27018/els_mongo?authSource=admin",
    options: {},
  };
