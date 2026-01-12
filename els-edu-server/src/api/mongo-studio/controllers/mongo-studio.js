"use strict";

/**
 * MongoDB Studio Controller
 * Provides CRUD operations for MongoDB collections
 */

const mongoService = require("../../../services/mongoService");
const { publishToAbly } = require("../../../../config/ably");

module.exports = {
  /**
   * Get all items from a collection
   * GET /api/mongo-studio/:collection
   */
  async getCollection(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      // Check permission (only ADMIN and SUPERADMIN)
      const userRole = user.user_role || "STUDENT";
      const hasPermission = ["ADMIN", "SUPERADMIN"].includes(userRole);
      
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

      const { collection } = ctx.params;
      const { page = 1, perPage = 20, search = "", sortField = "createdAt", sortOrder = "DESC" } = ctx.query;

      await mongoService.connect();
      const mongoose = require("mongoose");

      let Model;
      let query = {};

      // Map collection names to models
      switch (collection) {
        case "skills":
          Model = mongoService.models.Skill;
          if (search) {
            query = {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
              ],
            };
          }
          break;
        case "companies":
          Model = mongoService.models.Company;
          if (search) {
            query = {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { domain: { $regex: search, $options: "i" } },
              ],
            };
          }
          break;
        case "domains":
          Model = mongoService.models.Domain;
          if (search) {
            query = {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
              ],
            };
          }
          break;
        case "roles":
          Model = mongoService.models.Role;
          if (search) {
            query = {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { company: { $regex: search, $options: "i" } },
                { domain: { $regex: search, $options: "i" } },
              ],
            };
          }
          break;
        case "userCustomCourses":
          Model = mongoService.models.UserCourse;
          if (search) {
            query = {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
              ],
            };
          }
          break;
        case "userquizzes":
          Model = mongoService.models.UserQuiz;
          if (search) {
            query = {
              $or: [
                { company: { $regex: search, $options: "i" } },
                { role: { $regex: search, $options: "i" } },
                { domain: { $regex: search, $options: "i" } },
              ],
            };
          }
          break;
        case "usersurveys":
          Model = mongoService.models.UserSurvey;
          if (search) {
            query = {
              $or: [
                { company: { $regex: search, $options: "i" } },
                { role: { $regex: search, $options: "i" } },
                { domain: { $regex: search, $options: "i" } },
              ],
            };
          }
          break;
        default:
          ctx.status = 400;
          ctx.body = { error: "Invalid collection name" };
          return;
      }

      if (!Model) {
        ctx.status = 400;
        ctx.body = { error: "Collection not found" };
        return;
      }

      const skip = (parseInt(page) - 1) * parseInt(perPage);
      const limit = parseInt(perPage);

      // Build sort object
      const sortObj = {};
      const sortFieldName = sortField === "_id" ? "_id" : sortField || "createdAt";
      sortObj[sortFieldName] = sortOrder === "ASC" ? 1 : -1;

      const [data, total] = await Promise.all([
        Model.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
        Model.countDocuments(query),
      ]);

      // Convert ObjectIds to names for relations (for backward compatibility)
      const processedData = await Promise.all(
        data.map(async (item) => {
          const processed = { ...item };
          if (collection === "companies" && item.domain) {
            const mongoose = require("mongoose");
            if (mongoose.Types.ObjectId.isValid(item.domain)) {
              const domainDoc = await mongoService.models.Domain.findById(item.domain).lean();
              if (domainDoc) {
                processed.domain = domainDoc.name;
              }
            }
          } else if (collection === "roles") {
            const mongoose = require("mongoose");
            if (item.company && mongoose.Types.ObjectId.isValid(item.company)) {
              const companyDoc = await mongoService.models.Company.findById(item.company).lean();
              if (companyDoc) {
                processed.company = companyDoc.name;
              }
            }
            if (item.domain && mongoose.Types.ObjectId.isValid(item.domain)) {
              const domainDoc = await mongoService.models.Domain.findById(item.domain).lean();
              if (domainDoc) {
                processed.domain = domainDoc.name;
              }
            }
          } else if (collection === "skills" && item.category) {
            const mongoose = require("mongoose");
            if (mongoose.Types.ObjectId.isValid(item.category)) {
              const domainDoc = await mongoService.models.Domain.findById(item.category).lean();
              if (domainDoc) {
                processed.category = domainDoc.name;
              }
            }
          }
          return processed;
        })
      );

      ctx.body = {
        data: processedData,
        meta: {
          total,
          page: parseInt(page),
          perPage: parseInt(perPage),
          totalPages: Math.ceil(total / parseInt(perPage)),
        },
      };
    } catch (error) {
      console.error(`[MONGO-STUDIO] Error fetching ${ctx.params.collection}:`, error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Get a single item by ID
   * GET /api/mongo-studio/:collection/:id
   */
  async getItem(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      const userRole = user.user_role || "STUDENT";
      const hasPermission = ["ADMIN", "SUPERADMIN"].includes(userRole);
      
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

      const { collection, id } = ctx.params;
      await mongoService.connect();

      let Model;
      switch (collection) {
        case "skills":
          Model = mongoService.models.Skill;
          break;
        case "companies":
          Model = mongoService.models.Company;
          break;
        case "domains":
          Model = mongoService.models.Domain;
          break;
        case "roles":
          Model = mongoService.models.Role;
          break;
        case "userCustomCourses":
          Model = mongoService.models.UserCourse;
          break;
        case "userquizzes":
          Model = mongoService.models.UserQuiz;
          break;
        case "usersurveys":
          Model = mongoService.models.UserSurvey;
          break;
        default:
          ctx.status = 400;
          ctx.body = { error: "Invalid collection name" };
          return;
      }

      if (!Model) {
        ctx.status = 400;
        ctx.body = { error: "Collection not found" };
        return;
      }

      const mongoose = require("mongoose");
      const item = await Model.findById(id).lean();

      if (!item) {
        ctx.status = 404;
        ctx.body = { error: "Item not found" };
        return;
      }

      // Convert ObjectIds to names for relations (for backward compatibility)
      const processed = { ...item };
      if (collection === "companies" && item.domain) {
        if (mongoose.Types.ObjectId.isValid(item.domain)) {
          const domainDoc = await mongoService.models.Domain.findById(item.domain).lean();
          if (domainDoc) {
            processed.domain = domainDoc.name;
          }
        }
      } else if (collection === "roles") {
        if (item.company && mongoose.Types.ObjectId.isValid(item.company)) {
          const companyDoc = await mongoService.models.Company.findById(item.company).lean();
          if (companyDoc) {
            processed.company = companyDoc.name;
          }
        }
        if (item.domain && mongoose.Types.ObjectId.isValid(item.domain)) {
          const domainDoc = await mongoService.models.Domain.findById(item.domain).lean();
          if (domainDoc) {
            processed.domain = domainDoc.name;
          }
        }
      } else if (collection === "skills" && item.category) {
        if (mongoose.Types.ObjectId.isValid(item.category)) {
          const domainDoc = await mongoService.models.Domain.findById(item.category).lean();
          if (domainDoc) {
            processed.category = domainDoc.name;
          }
        }
      }

      ctx.body = { data: processed };
    } catch (error) {
      console.error(`[MONGO-STUDIO] Error fetching item:`, error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Create a new item
   * POST /api/mongo-studio/:collection
   */
  async createItem(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      const userRole = user.user_role || "STUDENT";
      const hasPermission = ["ADMIN", "SUPERADMIN"].includes(userRole);
      
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

      const { collection } = ctx.params;
      const itemData = ctx.request.body;
      await mongoService.connect();

      let Model;
      switch (collection) {
        case "skills":
          Model = mongoService.models.Skill;
          break;
        case "companies":
          Model = mongoService.models.Company;
          break;
        case "domains":
          Model = mongoService.models.Domain;
          break;
        case "roles":
          Model = mongoService.models.Role;
          break;
        case "userCustomCourses":
          Model = mongoService.models.UserCourse;
          break;
        case "userquizzes":
          Model = mongoService.models.UserQuiz;
          break;
        case "usersurveys":
          Model = mongoService.models.UserSurvey;
          break;
        default:
          ctx.status = 400;
          ctx.body = { error: "Invalid collection name" };
          return;
      }

      if (!Model) {
        ctx.status = 400;
        ctx.body = { error: "Collection not found" };
        return;
      }

      // Remove _id if present (let MongoDB generate it)
      delete itemData._id;

      // Convert ObjectIds to names for relations (backward compatibility + proper mapping)
      if (collection === "companies" && itemData.domain) {
        // If domain is an ObjectId, convert it to domain name
        const mongoose = require("mongoose");
        if (mongoose.Types.ObjectId.isValid(itemData.domain)) {
          const domainDoc = await mongoService.models.Domain.findById(itemData.domain).lean();
          if (domainDoc) {
            itemData.domain = domainDoc.name;
          }
        }
      } else if (collection === "roles") {
        // Convert company and domain ObjectIds to names
        const mongoose = require("mongoose");
        if (itemData.company && mongoose.Types.ObjectId.isValid(itemData.company)) {
          const companyDoc = await mongoService.models.Company.findById(itemData.company).lean();
          if (companyDoc) {
            itemData.company = companyDoc.name;
          }
        }
        if (itemData.domain && mongoose.Types.ObjectId.isValid(itemData.domain)) {
          const domainDoc = await mongoService.models.Domain.findById(itemData.domain).lean();
          if (domainDoc) {
            itemData.domain = domainDoc.name;
          }
        }
      } else if (collection === "skills" && itemData.category) {
        // Convert category ObjectId to domain name
        const mongoose = require("mongoose");
        if (mongoose.Types.ObjectId.isValid(itemData.category)) {
          const domainDoc = await mongoService.models.Domain.findById(itemData.category).lean();
          if (domainDoc) {
            itemData.category = domainDoc.name;
          }
        }
      }

      const item = new Model(itemData);
      const saved = await item.save();
      const savedObj = saved.toObject();

      // Publish Ably notification for custom courses
      if (collection === "userCustomCourses") {
        try {
          const courseId = savedObj._id?.toString() || savedObj.id?.toString();
          await publishToAbly(
            "global:custom-courses",
            "custom-course:created",
            {
              course: {
                id: courseId,
                documentId: courseId,
                ...savedObj,
              },
              createdBy: user.documentId,
              userRole: user.user_role || "STUDENT",
              timestamp: new Date().toISOString(),
            }
          );
        } catch (ablyError) {
          console.error("[MONGO-STUDIO] Ably publish error (non-blocking):", ablyError);
        }
      }

      ctx.body = { data: savedObj };
    } catch (error) {
      console.error(`[MONGO-STUDIO] Error creating item:`, error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Update an item
   * PUT /api/mongo-studio/:collection/:id
   */
  async updateItem(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      const userRole = user.user_role || "STUDENT";
      const hasPermission = ["ADMIN", "SUPERADMIN"].includes(userRole);
      
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

      const { collection, id } = ctx.params;
      const updateData = ctx.request.body;
      await mongoService.connect();

      let Model;
      switch (collection) {
        case "skills":
          Model = mongoService.models.Skill;
          break;
        case "companies":
          Model = mongoService.models.Company;
          break;
        case "domains":
          Model = mongoService.models.Domain;
          break;
        case "roles":
          Model = mongoService.models.Role;
          break;
        case "userCustomCourses":
          Model = mongoService.models.UserCourse;
          break;
        case "userquizzes":
          Model = mongoService.models.UserQuiz;
          break;
        case "usersurveys":
          Model = mongoService.models.UserSurvey;
          break;
        default:
          ctx.status = 400;
          ctx.body = { error: "Invalid collection name" };
          return;
      }

      if (!Model) {
        ctx.status = 400;
        ctx.body = { error: "Collection not found" };
        return;
      }

      // Remove _id and timestamps from update data
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      // Convert ObjectIds to names for relations (backward compatibility + proper mapping)
      if (collection === "companies" && updateData.domain) {
        // If domain is an ObjectId, convert it to domain name
        const mongoose = require("mongoose");
        if (mongoose.Types.ObjectId.isValid(updateData.domain)) {
          const domainDoc = await mongoService.models.Domain.findById(updateData.domain).lean();
          if (domainDoc) {
            updateData.domain = domainDoc.name;
          }
        }
      } else if (collection === "roles") {
        // Convert company and domain ObjectIds to names
        const mongoose = require("mongoose");
        if (updateData.company && mongoose.Types.ObjectId.isValid(updateData.company)) {
          const companyDoc = await mongoService.models.Company.findById(updateData.company).lean();
          if (companyDoc) {
            updateData.company = companyDoc.name;
          }
        }
        if (updateData.domain && mongoose.Types.ObjectId.isValid(updateData.domain)) {
          const domainDoc = await mongoService.models.Domain.findById(updateData.domain).lean();
          if (domainDoc) {
            updateData.domain = domainDoc.name;
          }
        }
      } else if (collection === "skills" && updateData.category) {
        // Convert category ObjectId to domain name
        const mongoose = require("mongoose");
        if (mongoose.Types.ObjectId.isValid(updateData.category)) {
          const domainDoc = await mongoService.models.Domain.findById(updateData.category).lean();
          if (domainDoc) {
            updateData.category = domainDoc.name;
          }
        }
      }

      const updated = await Model.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      if (!updated) {
        ctx.status = 404;
        ctx.body = { error: "Item not found" };
        return;
      }

      // Publish Ably notification for custom courses
      if (collection === "userCustomCourses") {
        try {
          const courseId = updated._id?.toString() || updated.id?.toString();
          await publishToAbly(
            "global:custom-courses",
            "custom-course:updated",
            {
              course: {
                id: courseId,
                documentId: courseId,
                ...updated,
              },
              updatedBy: user.documentId,
              userRole: user.user_role || "STUDENT",
              timestamp: new Date().toISOString(),
            }
          );
        } catch (ablyError) {
          console.error("[MONGO-STUDIO] Ably publish error (non-blocking):", ablyError);
        }
      }

      ctx.body = { data: updated };
    } catch (error) {
      console.error(`[MONGO-STUDIO] Error updating item:`, error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  /**
   * Delete an item
   * DELETE /api/mongo-studio/:collection/:id
   */
  async deleteItem(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      const userRole = user.user_role || "STUDENT";
      const hasPermission = ["ADMIN", "SUPERADMIN"].includes(userRole);
      
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

      const { collection, id } = ctx.params;
      await mongoService.connect();

      let Model;
      switch (collection) {
        case "skills":
          Model = mongoService.models.Skill;
          break;
        case "companies":
          Model = mongoService.models.Company;
          break;
        case "domains":
          Model = mongoService.models.Domain;
          break;
        case "roles":
          Model = mongoService.models.Role;
          break;
        case "userCustomCourses":
          Model = mongoService.models.UserCourse;
          break;
        case "userquizzes":
          Model = mongoService.models.UserQuiz;
          break;
        case "usersurveys":
          Model = mongoService.models.UserSurvey;
          break;
        default:
          ctx.status = 400;
          ctx.body = { error: "Invalid collection name" };
          return;
      }

      if (!Model) {
        ctx.status = 400;
        ctx.body = { error: "Collection not found" };
        return;
      }

      const deleted = await Model.findByIdAndDelete(id);

      if (!deleted) {
        ctx.status = 404;
        ctx.body = { error: "Item not found" };
        return;
      }

      // Publish Ably notification for custom courses
      if (collection === "userCustomCourses") {
        try {
          await publishToAbly(
            "global:custom-courses",
            "custom-course:deleted",
            {
              courseId: id,
              deletedBy: user.documentId,
              userRole: user.user_role || "STUDENT",
              timestamp: new Date().toISOString(),
            }
          );
        } catch (ablyError) {
          console.error("[MONGO-STUDIO] Ably publish error (non-blocking):", ablyError);
        }
      }

      ctx.body = { data: { message: "Item deleted successfully", id } };
    } catch (error) {
      console.error(`[MONGO-STUDIO] Error deleting item:`, error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },
};

