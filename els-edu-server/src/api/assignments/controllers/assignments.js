'use strict';

/**
 * assignments controller
 */

module.exports = {
  /**
   * Super Admin: Assign courses to org
   * POST /api/assignments/assign-courses-to-org
   * Body: { orgId: number, courseIds: number[] }
   */
  async assignCoursesToOrg(ctx) {
    try {
      const { orgId, courseIds } = ctx.request.body;

      if (!orgId || !Array.isArray(courseIds) || courseIds.length === 0) {
        return ctx.badRequest('orgId and courseIds array are required');
      }

      // Verify org exists (try both numeric id and documentId)
      let org = null;
      
      // Try numeric id first (if it's a number or numeric string)
      const numericOrgId = typeof orgId === 'string' && !isNaN(orgId) ? Number(orgId) : orgId;
      if (typeof numericOrgId === 'number') {
        try {
          org = await strapi.entityService.findOne('api::org.org', numericOrgId);
        } catch (e) {
          // Ignore and try documentId
        }
      }
      
      // Try by documentId if not found
      if (!org) {
        const orgs = await strapi.entityService.findMany('api::org.org', {
          filters: { documentId: String(orgId) },
        });
        if (orgs.length > 0) {
          org = orgs[0];
        }
      }
      
      if (!org) {
        return ctx.notFound(`Organization not found with ID: ${orgId}`);
      }

      // Verify all courses exist - try both numeric id and documentId
      const foundCourses = [];
      const notFoundIds = [];

      for (const courseId of courseIds) {
        let course = null;
        
        // Try numeric id first
        if (typeof courseId === 'number') {
          try {
            course = await strapi.entityService.findOne('api::course.course', courseId);
          } catch (e) {
            // Ignore and try documentId
          }
        }
        
        // Try documentId if not found
        if (!course) {
          const courses = await strapi.entityService.findMany('api::course.course', {
            filters: { documentId: courseId },
          });
          if (courses.length > 0) {
            course = courses[0];
          }
        }

        if (course) {
          foundCourses.push(course);
        } else {
          notFoundIds.push(courseId);
        }
      }

      if (notFoundIds.length > 0) {
        return ctx.badRequest(`Courses not found: ${notFoundIds.join(', ')}`);
      }

      // Update each course to assign to org (manyToMany - add org to organizations array)
      const updatedCourses = [];
      for (const course of foundCourses) {
        // Get current organizations for this course
        const currentCourse = await strapi.entityService.findOne('api::course.course', course.id, {
          populate: ['organizations'],
        });
        
        // Get existing org IDs (avoid duplicates)
        const existingOrgIds = (currentCourse?.organizations || []).map(o => o.id);
        
        // Add the new org if not already present
        if (!existingOrgIds.includes(org.id)) {
          // For manyToMany, set the full array of org IDs
          const allOrgIds = [...existingOrgIds, org.id];
          
          const updated = await strapi.entityService.update('api::course.course', course.id, {
            data: { 
              organizations: allOrgIds
            },
          });
          updatedCourses.push(updated);
          
          strapi.log.info(`✓ Successfully assigned course ${course.id} (${course.documentId}) to org ${org.id} (${org.documentId})`);
        } else {
          // Course already assigned to this org
          strapi.log.info(`Course ${course.id} already assigned to org ${org.id}, skipping`);
          updatedCourses.push(currentCourse);
        }
        
        // Verify the assignment
        const verifyCourse = await strapi.entityService.findOne('api::course.course', course.id, {
          populate: ['organizations'],
        });
        
        const assignedOrgIds = (verifyCourse?.organizations || []).map(o => o.id);
        if (!assignedOrgIds.includes(org.id)) {
          strapi.log.warn(`Warning: Course ${course.id} organization assignment verification failed. Org ${org.id} not found in assigned orgs: ${assignedOrgIds.join(', ')}`);
        } else {
          strapi.log.info(`✓ Verified: Course ${course.id} is assigned to ${assignedOrgIds.length} org(s)`);
        }
      }
      
      // Verify by fetching org with courses populated (using both entityService and documentService)
      const verifyOrg = await strapi.entityService.findOne('api::org.org', org.id, {
        populate: ['courses'],
      });
      
      strapi.log.info(`✓ Verification: Org ${org.id} (${org.documentId}) now has ${verifyOrg?.courses?.length || 0} courses assigned`);
      
      // Also verify via documentService to ensure API endpoint will see it
      try {
        const verifyOrgByDoc = await strapi.documents('api::org.org').findOne({
          documentId: org.documentId,
          populate: ['courses'],
        });
        strapi.log.info(`✓ DocumentService verification: Org ${org.documentId} has ${verifyOrgByDoc?.courses?.length || 0} courses (via documentId)`);
      } catch (docError) {
        strapi.log.warn(`DocumentService verification failed: ${docError.message}`);
      }

      ctx.body = {
        data: {
          org: org,
          assignedCourses: updatedCourses,
          count: updatedCourses.length,
        },
      };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Admin: Assign courses to user
   * POST /api/assignments/assign-courses-to-user
   * Body: { userId: number, courseIds: number[] }
   */
  async assignCoursesToUser(ctx) {
    try {
      const { userId, courseIds } = ctx.request.body;

      if (!userId || !Array.isArray(courseIds) || courseIds.length === 0) {
        return ctx.badRequest('userId and courseIds array are required');
      }

      // Verify user exists
      const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId);
      if (!user) {
        return ctx.notFound('User not found');
      }

      // Verify all courses exist - try both numeric id and documentId
      const foundCourses = [];
      const notFoundIds = [];

      for (const courseId of courseIds) {
        let course = null;
        
        // Try numeric id first
        if (typeof courseId === 'number') {
          try {
            course = await strapi.entityService.findOne('api::course.course', courseId);
          } catch (e) {
            // Ignore and try documentId
          }
        }
        
        // Try documentId if not found
        if (!course) {
          const courses = await strapi.entityService.findMany('api::course.course', {
            filters: { documentId: courseId },
          });
          if (courses.length > 0) {
            course = courses[0];
          }
        }

        if (course) {
          foundCourses.push(course);
        } else {
          notFoundIds.push(courseId);
        }
      }

      if (notFoundIds.length > 0) {
        return ctx.badRequest(`Courses not found: ${notFoundIds.join(', ')}`);
      }

      // Create usersubscription for each course (use numeric id from found course)
      const subscriptions = [];
      for (const course of foundCourses) {
        // Check if subscription already exists
        const existing = await strapi.entityService.findMany('api::usersubscription.usersubscription', {
          filters: {
            users_permissions_user: userId,
            course: course.id,
          },
        });

        if (existing.length === 0) {
          const subscription = await strapi.entityService.create('api::usersubscription.usersubscription', {
            data: {
              users_permissions_user: userId,
              course: course.id,
              subscription_type: 'FREE',
              paymentstatus: 'ACTIVE',
              startdate: new Date(),
            },
          });
          subscriptions.push(subscription);
        } else {
          subscriptions.push(existing[0]);
        }
      }

      ctx.body = {
        data: {
          user: user,
          assignedCourses: subscriptions,
          count: subscriptions.length,
        },
      };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Admin: Assign subjects to user
   * POST /api/assignments/assign-subjects-to-user
   * Body: { userId: number, subjectIds: number[] }
   */
  async assignSubjectsToUser(ctx) {
    try {
      const { userId, subjectIds } = ctx.request.body;

      if (!userId || !Array.isArray(subjectIds) || subjectIds.length === 0) {
        return ctx.badRequest('userId and subjectIds array are required');
      }

      // Verify user exists
      const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId);
      if (!user) {
        return ctx.notFound('User not found');
      }

      // Verify all subjects exist - try both numeric id and documentId
      const foundSubjects = [];
      const notFoundIds = [];

      for (const subjectId of subjectIds) {
        let subject = null;
        
        // Try numeric id first
        if (typeof subjectId === 'number') {
          try {
            subject = await strapi.entityService.findOne('api::subject.subject', subjectId);
          } catch (e) {
            // Ignore and try documentId
          }
        }
        
        // Try documentId if not found
        if (!subject) {
          const subjects = await strapi.entityService.findMany('api::subject.subject', {
            filters: { documentId: subjectId },
          });
          if (subjects.length > 0) {
            subject = subjects[0];
          }
        }

        if (subject) {
          foundSubjects.push(subject);
        } else {
          notFoundIds.push(subjectId);
        }
      }

      if (notFoundIds.length > 0) {
        return ctx.badRequest(`Subjects not found: ${notFoundIds.join(', ')}`);
      }

      // Create or update usersubscription for subjects
      // Find or create a subscription for this user
      const existingSubscriptions = await strapi.entityService.findMany('api::usersubscription.usersubscription', {
        filters: {
          users_permissions_user: userId,
        },
        populate: ['subjects'],
      });

      let subscription;
      if (existingSubscriptions.length > 0) {
        // Use first existing subscription
        subscription = existingSubscriptions[0];
      } else {
        // Create new subscription for this user
        subscription = await strapi.entityService.create('api::usersubscription.usersubscription', {
          data: {
            users_permissions_user: userId,
            subscription_type: 'FREE',
            paymentstatus: 'ACTIVE',
            startdate: new Date(),
          },
        });
      }

      // Get current subject IDs
      const currentSubjectIds = (subscription.subjects || []).map((s) => s.id);
      const allSubjectIds = [...new Set([...currentSubjectIds, ...foundSubjects.map((s) => s.id)])];

      // Update each subject to link to this subscription (use numeric id from found subject)
      const updatedSubjects = [];
      for (const subject of foundSubjects) {
        await strapi.entityService.update('api::subject.subject', subject.id, {
          data: {
            usersubscription: subscription.id,
          },
        });
        updatedSubjects.push(subject.id);
      }

      // Refresh subscription with updated subjects
      const updated = await strapi.entityService.findOne('api::usersubscription.usersubscription', subscription.id, {
        populate: ['subjects'],
      });

      ctx.body = {
        data: {
          user: user,
          assignedSubjects: updated.subjects || [],
          count: updatedSubjects.length,
        },
      };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Get assigned courses for a user
   * GET /api/assignments/user/:userId/courses
   */
  async getUserCourses(ctx) {
    try {
      const { userId } = ctx.params;

      const subscriptions = await strapi.entityService.findMany('api::usersubscription.usersubscription', {
        filters: {
          users_permissions_user: userId,
        },
        populate: ['course'],
      });

      const courses = subscriptions
        .map((sub) => sub.course)
        .filter((course) => course !== null);

      ctx.body = {
        data: courses,
      };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Get assigned subjects for a user
   * GET /api/assignments/user/:userId/subjects
   */
  async getUserSubjects(ctx) {
    try {
      const { userId } = ctx.params;

      const subscriptions = await strapi.entityService.findMany('api::usersubscription.usersubscription', {
        filters: {
          users_permissions_user: userId,
        },
        populate: ['subjects'],
      });

      const subjects = subscriptions
        .flatMap((sub) => sub.subjects || [])
        .filter((subject) => subject !== null);

      ctx.body = {
        data: subjects,
      };
    } catch (error) {
      ctx.throw(500, error);
    }
  },
};

