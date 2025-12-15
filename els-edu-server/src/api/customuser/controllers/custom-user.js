'use strict';

/**
 * customuser controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::customuser.custom-user', ({ strapi }) => ({
  async createUserWithOrg(ctx) {
    try {
      const authUser = ctx.state.user;
      if (!authUser) return ctx.unauthorized('Authentication required');

      // Check if user is SUPERADMIN
      const roleVal = authUser.user_role || (authUser.role && authUser.role.name) || '';
      console.log('\n\n *********roleVal*****\n\n', roleVal);
      if (roleVal !== 'SUPERADMIN') {
        return ctx.forbidden('Only SUPERADMIN can create users');
      }

      const payload = ctx.request.body?.data || ctx.request.body;
      const { username, email, password, org, ...userData } = payload;

      if (!username || !email || !password) {
        return ctx.badRequest('Missing required fields: username, email, password');
      }

      // Step 1: Register user (creates basic user account)
      const registerService = strapi.plugins['users-permissions'].services.user;
      const registeredUser = await registerService.add({
        username,
        email,
        password,
        confirmed: userData.confirmed !== undefined ? userData.confirmed : true,
        blocked: userData.blocked !== undefined ? userData.blocked : false,
      });

      if (!registeredUser) {
        return ctx.badRequest('Failed to register user');
      }

      // Step 2: If org is provided, convert documentId to numeric id and assign it
      if (org) {
        try {
          // Convert org documentId to numeric id (required for user.org relation)
          let orgNumericId = null;
          if (typeof org === 'string') {
            // Query org by documentId to get numeric id
            const orgRecord = await strapi.db.query('api::org.org').findOne({
              where: { documentId: org },
              select: ['id'],
            });
            if (orgRecord) {
              orgNumericId = orgRecord.id;
              strapi.log.info(`Converted org documentId ${org} to numeric id ${orgNumericId}`);
            } else {
              throw new Error(`Org not found with documentId: ${org}`);
            }
          } else if (typeof org === 'number') {
            orgNumericId = org;
          }

          // Update user with org and other fields
          await strapi.entityService.update('plugin::users-permissions.user', registeredUser.id, {
            data: {
              ...userData,
              org: orgNumericId, // Use numeric id for relation
            },
          });
        } catch (orgError) {
          strapi.log.error('Failed to assign org to user:', orgError);
          // Continue - user is created even if org assignment fails
          // But log the error for debugging
        }
      } else {
        // Update user with other fields if no org
        if (Object.keys(userData).length > 0) {
          await strapi.entityService.update('plugin::users-permissions.user', registeredUser.id, {
            data: userData,
          });
        }
      }

      // Fetch updated user with relations populated
      const updatedUser = await strapi.entityService.findOne('plugin::users-permissions.user', registeredUser.id, {
        populate: ['org'],
      });

      ctx.body = {
        data: {
          id: updatedUser.id,
          documentId: updatedUser.documentId,
          username: updatedUser.username,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          user_role: updatedUser.user_role,
          user_status: updatedUser.user_status,
          org: updatedUser.org,
        },
      };
    } catch (error) {
      strapi.log.error('Create user with org error:', error);
      return ctx.badRequest('Failed to create user', { error: error.message });
    }
  },
}));
