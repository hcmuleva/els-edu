"use strict";

/**
 * MongoDB Studio Controller
 * Provides CRUD operations for MongoDB collections
 */

const mongoService = require("../../../services/mongoService");
const { publishToAbly } = require("../../../../config/ably");
const mongoose = require("mongoose");

/**
 * Compute classroom status based on dates (Industry Standard)
 * MongoDB stores raw data, Strapi computes derived status
 * @param {Object} classroom - Classroom document from MongoDB
 * @returns {string} Computed status: draft, scheduled, live, completed, cancelled
 */
const computeClassroomStatus = (classroom) => {
  const now = new Date();
  const startDate = classroom.startDate ? new Date(classroom.startDate) : null;
  const endDate = classroom.endDate ? new Date(classroom.endDate) : null;

  // Respect manual statuses (draft, cancelled)
  if (classroom.status === "draft" || classroom.status === "cancelled") {
    return classroom.status;
  }

  // Auto-compute based on time
  if (endDate && now > endDate) return "completed";
  if (startDate && now >= startDate && endDate && now <= endDate) return "live";
  if (startDate && now < startDate) return "scheduled";

  // Fallback to stored status
  return classroom.status || "draft";
};

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

      // Check permission
      const userRole = user.user_role || "STUDENT";
      const { collection } = ctx.params;

      // Classroom-related collections are accessible to all authenticated users
      const publicCollections = [
        "classrooms",
        "classProgress",
        "userAssignments",
        "notifications",
      ];
      const isPublicCollection = publicCollections.includes(collection);

      // For non-public collections, require ADMIN or SUPERADMIN
      const hasPermission =
        isPublicCollection || ["ADMIN", "SUPERADMIN"].includes(userRole);

      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

      const {
        page = 1,
        perPage = 20,
        search = "",
        sortField = "createdAt",
        sortOrder = "DESC",
      } = ctx.query;

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
        // ============================================
        // CLASSROOM SYSTEM COLLECTIONS
        // ============================================
        case "classrooms":
          Model = mongoService.models.Classroom;
          // Apply org filter for isolation
          if (ctx.query.orgDocumentId) {
            query.orgDocumentId = ctx.query.orgDocumentId;
          }
          // Apply grade filter for non-teacher views
          if (ctx.query.grade) {
            // Convert backend grade format to display format for MongoDB classTypes
            const gradeMap = {
              PLAYSCHOOL: "Playschool",
              LKG: "LKG",
              UKG: "UKG",
              FIRST: "1st",
              SECOND: "2nd",
              THIRD: "3rd",
              FOURTH: "4th",
              FIFTH: "5th",
              SIXTH: "6th",
              SEVENTH: "7th",
              EIGHTH: "8th",
              NINTH: "9th",
              TENTH: "10th",
              ELEVENTH: "11th",
              TWELFTH: "12th",
            };
            const displayGrade = gradeMap[ctx.query.grade] || ctx.query.grade;
            query.classTypes = { $in: [displayGrade] };
          }
          // Apply status filter
          if (ctx.query.status) {
            query.status = ctx.query.status;
          }
          if (search) {
            query.$or = [
              { title: { $regex: search, $options: "i" } },
              { description: { $regex: search, $options: "i" } },
            ];
          }
          break;
        case "classProgress":
          Model = mongoService.models.ClassProgress;
          if (ctx.query.orgDocumentId) {
            query.orgDocumentId = ctx.query.orgDocumentId;
          }
          if (ctx.query.userDocumentId) {
            query.userDocumentId = ctx.query.userDocumentId;
          }
          if (ctx.query.classroomId) {
            query.classroomId = ctx.query.classroomId;
          }
          break;
        case "userAssignments":
          Model = mongoService.models.UserAssignment;
          if (ctx.query.orgDocumentId) {
            query.orgDocumentId = ctx.query.orgDocumentId;
          }
          if (ctx.query.userDocumentId) {
            query.userDocumentId = ctx.query.userDocumentId;
          }
          if (ctx.query.grade) {
            // Convert backend grade format to display format for MongoDB
            const gradeMap = {
              PLAYSCHOOL: "Playschool",
              LKG: "LKG",
              UKG: "UKG",
              FIRST: "1st",
              SECOND: "2nd",
              THIRD: "3rd",
              FOURTH: "4th",
              FIFTH: "5th",
              SIXTH: "6th",
              SEVENTH: "7th",
              EIGHTH: "8th",
              NINTH: "9th",
              TENTH: "10th",
              ELEVENTH: "11th",
              TWELFTH: "12th",
            };
            const displayGrade = gradeMap[ctx.query.grade] || ctx.query.grade;
            query.classStandard = displayGrade;
          }
          if (ctx.query.status) {
            query.status = ctx.query.status;
          }
          if (search) {
            // Need to search by assignment details from Strapi (handled in frontend)
          }
          break;
        case "notifications":
          Model = mongoService.models.Notification;
          if (ctx.query.orgDocumentId) {
            query.orgDocumentId = ctx.query.orgDocumentId;
          }
          if (ctx.query.userDocumentId) {
            query.userDocumentId = ctx.query.userDocumentId;
          }
          if (ctx.query.isRead !== undefined) {
            query.isRead = ctx.query.isRead === "true";
          }
          if (ctx.query.classStandards) {
            query.classStandards = { $in: ctx.query.classStandards.split(",") };
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
      const sortFieldName =
        sortField === "_id" ? "_id" : sortField || "createdAt";
      sortObj[sortFieldName] = sortOrder === "ASC" ? 1 : -1;

      const [data, total] = await Promise.all([
        Model.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
        Model.countDocuments(query),
      ]);

      // Process documents for readability (role ObjectId → name, domain ObjectId → name, etc)
      const processedData = await Promise.all(
        data.map(async (doc) => {
          const processed = doc.toObject ? doc.toObject() : { ...doc };

          // INDUSTRY STANDARD: Compute classroom status (Strapi derives truth)
          if (collection === "classrooms") {
            const computedStatus = computeClassroomStatus(processed);
            processed.status = computedStatus;
            processed._storedStatus = doc.status; // Keep original for debugging
          }

          if (collection === "companies" && processed.domain) {
            const mongoose = require("mongoose");
            if (mongoose.Types.ObjectId.isValid(processed.domain)) {
              const domainDoc = await mongoService.models.Domain.findById(
                processed.domain
              ).lean();
              if (domainDoc) {
                processed.domain = domainDoc.name;
              }
            }
          } else if (collection === "roles") {
            const mongoose = require("mongoose");
            if (
              processed.company &&
              mongoose.Types.ObjectId.isValid(processed.company)
            ) {
              const companyDoc = await mongoService.models.Company.findById(
                processed.company
              ).lean();
              if (companyDoc) {
                processed.company = companyDoc.name;
              }
            }
            if (
              processed.domain &&
              mongoose.Types.ObjectId.isValid(processed.domain)
            ) {
              const domainDoc = await mongoService.models.Domain.findById(
                processed.domain
              ).lean();
              if (domainDoc) {
                processed.domain = domainDoc.name;
              }
            }
          } else if (collection === "skills" && processed.category) {
            const mongoose = require("mongoose");
            if (mongoose.Types.ObjectId.isValid(processed.category)) {
              const domainDoc = await mongoService.models.Domain.findById(
                processed.category
              ).lean();
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
      console.error(
        `[MONGO-STUDIO] Error fetching ${ctx.params.collection}:`,
        error
      );
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
      const { collection, id } = ctx.params;

      // Classroom-related collections are accessible to all authenticated users
      const publicCollections = [
        "classrooms",
        "classProgress",
        "userAssignments",
        "notifications",
      ];
      const isPublicCollection = publicCollections.includes(collection);
      const hasPermission =
        isPublicCollection ||
        ["ADMIN", "SUPERADMIN", "TEACHER"].includes(userRole);

      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

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
        // Classroom System Collections
        case "classrooms":
          Model = mongoService.models.Classroom;
          break;
        case "classProgress":
          Model = mongoService.models.ClassProgress;
          break;
        case "userAssignments":
          Model = mongoService.models.UserAssignment;
          break;
        case "notifications":
          Model = mongoService.models.Notification;
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
          const domainDoc = await mongoService.models.Domain.findById(
            item.domain
          ).lean();
          if (domainDoc) {
            processed.domain = domainDoc.name;
          }
        }
      } else if (collection === "roles") {
        if (item.company && mongoose.Types.ObjectId.isValid(item.company)) {
          const companyDoc = await mongoService.models.Company.findById(
            item.company
          ).lean();
          if (companyDoc) {
            processed.company = companyDoc.name;
          }
        }
        if (item.domain && mongoose.Types.ObjectId.isValid(item.domain)) {
          const domainDoc = await mongoService.models.Domain.findById(
            item.domain
          ).lean();
          if (domainDoc) {
            processed.domain = domainDoc.name;
          }
        }
      } else if (collection === "skills" && item.category) {
        if (mongoose.Types.ObjectId.isValid(item.category)) {
          const domainDoc = await mongoService.models.Domain.findById(
            item.category
          ).lean();
          if (domainDoc) {
            processed.category = domainDoc.name;
          }
        }
      }

      // INDUSTRY STANDARD: Compute classroom status (Strapi derives truth)
      if (collection === "classrooms") {
        const computedStatus = computeClassroomStatus(processed);
        processed.status = computedStatus;
        processed._storedStatus = item.status; // Keep original for debugging
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
      const { collection } = ctx.params;

      // Classroom-related collections are accessible to all authenticated users for create
      const publicCollections = [
        "classrooms",
        "classProgress",
        "userAssignments",
        "notifications",
      ];
      const isPublicCollection = publicCollections.includes(collection);
      const hasPermission =
        isPublicCollection ||
        ["ADMIN", "SUPERADMIN", "TEACHER"].includes(userRole);

      console.log("[MONGO-STUDIO] createItem Permission Check:", {
        user: user.username,
        role: userRole,
        collection,
        isPublic: isPublicCollection,
        hasPermission,
      });

      if (!hasPermission) {
        console.error("[MONGO-STUDIO] createItem Permission Denied:", {
          user: user.username,
          role: userRole,
          collection,
          isPublic: isPublicCollection,
          hasPermission,
        });
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

      const itemData = ctx.request.body;
      console.log(
        "[MONGO-STUDIO] createItem request body:",
        JSON.stringify(itemData, null, 2)
      );

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
        // Classroom System Collections
        case "classrooms":
          Model = mongoService.models.Classroom;
          // Auto-fill creator if not provided
          if (!itemData.creatorDocumentId) {
            itemData.creatorDocumentId = user.documentId;
          }
          // Auto-fill org if not SuperAdmin and no org provided
          if (!itemData.orgDocumentId && user.org?.documentId) {
            itemData.orgDocumentId = user.org.documentId;
          }
          break;
        case "classProgress":
          Model = mongoService.models.ClassProgress;
          // Auto-fill org
          if (!itemData.orgDocumentId && user.org?.documentId) {
            itemData.orgDocumentId = user.org.documentId;
          }
          // Convert classroomId string to ObjectId if needed
          if (
            itemData.classroomId &&
            typeof itemData.classroomId === "string"
          ) {
            const mongoose = require("mongoose");
            itemData.classroomId = new mongoose.Types.ObjectId(
              itemData.classroomId
            );
          }
          break;
        case "userAssignments":
          Model = mongoService.models.UserAssignment;
          // Auto-fill org
          if (!itemData.orgDocumentId && user.org?.documentId) {
            itemData.orgDocumentId = user.org.documentId;
          }
          break;
        case "notifications":
          Model = mongoService.models.Notification;
          // Auto-fill org
          if (!itemData.orgDocumentId && user.org?.documentId) {
            itemData.orgDocumentId = user.org.documentId;
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

      // Remove _id if present (let MongoDB generate it)
      delete itemData._id;

      // Convert ObjectIds to names for relations (backward compatibility + proper mapping)
      if (collection === "companies" && itemData.domain) {
        // If domain is an ObjectId, convert it to domain name
        const mongoose = require("mongoose");
        if (mongoose.Types.ObjectId.isValid(itemData.domain)) {
          const domainDoc = await mongoService.models.Domain.findById(
            itemData.domain
          ).lean();
          if (domainDoc) {
            itemData.domain = domainDoc.name;
          }
        }
      } else if (collection === "roles") {
        // Convert company and domain ObjectIds to names
        const mongoose = require("mongoose");
        if (
          itemData.company &&
          mongoose.Types.ObjectId.isValid(itemData.company)
        ) {
          const companyDoc = await mongoService.models.Company.findById(
            itemData.company
          ).lean();
          if (companyDoc) {
            itemData.company = companyDoc.name;
          }
        }
        if (
          itemData.domain &&
          mongoose.Types.ObjectId.isValid(itemData.domain)
        ) {
          const domainDoc = await mongoService.models.Domain.findById(
            itemData.domain
          ).lean();
          if (domainDoc) {
            itemData.domain = domainDoc.name;
          }
        }
      } else if (collection === "skills" && itemData.category) {
        // Convert category ObjectId to domain name
        const mongoose = require("mongoose");
        if (mongoose.Types.ObjectId.isValid(itemData.category)) {
          const domainDoc = await mongoService.models.Domain.findById(
            itemData.category
          ).lean();
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
          console.error(
            "[MONGO-STUDIO] Ably publish error (non-blocking):",
            ablyError
          );
        }
      }

      // Publish Ably notification for classrooms
      if (collection === "classrooms") {
        try {
          const orgId = savedObj.orgDocumentId;
          if (orgId) {
            await publishToAbly(
              `classroom:${orgId}:updates`,
              "classroom-update",
              {
                type: "create",
                classroom: savedObj,
                timestamp: new Date().toISOString(),
              }
            );
          }
        } catch (err) {
          console.error("[MONGO-STUDIO] Ably publish error:", err);
        }
      }

      // Publish Ably notification for classrooms
      if (collection === "classrooms") {
        try {
          const orgId = savedObj.orgDocumentId;
          if (orgId) {
            await publishToAbly(
              `classroom:${orgId}:updates`,
              "classroom-update",
              {
                type: "update",
                classroom: savedObj,
                timestamp: new Date().toISOString(),
              }
            );
          }
        } catch (err) {
          console.error("[MONGO-STUDIO] Ably publish error:", err);
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
      const { collection, id } = ctx.params;

      // Classroom-related collections are accessible to all authenticated users
      const publicCollections = [
        "classrooms",
        "classProgress",
        "userAssignments",
        "notifications",
      ];
      const isPublicCollection = publicCollections.includes(collection);
      const hasPermission =
        isPublicCollection ||
        ["ADMIN", "SUPERADMIN", "TEACHER"].includes(userRole);

      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

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
        // Classroom System Collections
        case "classrooms":
          Model = mongoService.models.Classroom;
          break;
        case "classProgress":
          Model = mongoService.models.ClassProgress;
          break;
        case "userAssignments":
          Model = mongoService.models.UserAssignment;
          break;
        case "notifications":
          Model = mongoService.models.Notification;
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
          const domainDoc = await mongoService.models.Domain.findById(
            updateData.domain
          ).lean();
          if (domainDoc) {
            updateData.domain = domainDoc.name;
          }
        }
      } else if (collection === "roles") {
        // Convert company and domain ObjectIds to names
        const mongoose = require("mongoose");
        if (
          updateData.company &&
          mongoose.Types.ObjectId.isValid(updateData.company)
        ) {
          const companyDoc = await mongoService.models.Company.findById(
            updateData.company
          ).lean();
          if (companyDoc) {
            updateData.company = companyDoc.name;
          }
        }
        if (
          updateData.domain &&
          mongoose.Types.ObjectId.isValid(updateData.domain)
        ) {
          const domainDoc = await mongoService.models.Domain.findById(
            updateData.domain
          ).lean();
          if (domainDoc) {
            updateData.domain = domainDoc.name;
          }
        }
      } else if (collection === "skills" && updateData.category) {
        // Convert category ObjectId to domain name
        const mongoose = require("mongoose");
        if (mongoose.Types.ObjectId.isValid(updateData.category)) {
          const domainDoc = await mongoService.models.Domain.findById(
            updateData.category
          ).lean();
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
          console.error(
            "[MONGO-STUDIO] Ably publish error (non-blocking):",
            ablyError
          );
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
      const { collection, id } = ctx.params;

      // Classroom-related collections are accessible to all authenticated users
      const publicCollections = [
        "classrooms",
        "classProgress",
        "userAssignments",
        "notifications",
      ];
      const isPublicCollection = publicCollections.includes(collection);
      const hasPermission =
        isPublicCollection ||
        ["ADMIN", "SUPERADMIN", "TEACHER"].includes(userRole);

      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: "Permission denied" };
        return;
      }

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
        // Classroom System Collections
        case "classrooms":
          Model = mongoService.models.Classroom;
          break;
        case "classProgress":
          Model = mongoService.models.ClassProgress;
          break;
        case "userAssignments":
          Model = mongoService.models.UserAssignment;
          break;
        case "notifications":
          Model = mongoService.models.Notification;
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
          console.error(
            "[MONGO-STUDIO] Ably publish error (non-blocking):",
            ablyError
          );
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
