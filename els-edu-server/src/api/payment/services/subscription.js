// src/api/subscription/services/subscription.js
// Fixed: use Document Service API (strapi.documents) everywhere — no strapi.db.query()
// Ensures all relations are created/queried with documentId strings (Document API IDs)

class SubscriptionService {
  /**
   * Calculate subscription end date based on pricing.option and optional duration
   */
  calculateEndDate(option, duration = null) {
    const now = new Date();
    const endDate = new Date(now);

    const d = duration ? parseInt(duration, 10) : null;

    switch ((option || '').toUpperCase()) {
      case 'DAILY':
        endDate.setDate(endDate.getDate() + (d || 1));
        break;
      case 'WEEKLY':
        endDate.setDate(endDate.getDate() + (d || 7));
        break;
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + (d || 1));
        break;
      case 'YEARLY':
        endDate.setFullYear(endDate.getFullYear() + (d || 1));
        break;
      case 'ONETIME':
        endDate.setFullYear(endDate.getFullYear() + 100);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }

    return endDate;
  }

  /**
   * Create a new paid subscription (Document API)
   * Accepts documentId strings for userId, kitId, pricingId
   * Handles UPGRADE from FREE/FREEMIUM to PAID by updating existing subscription
   */
  async createSubscription({ userId, kitId, pricingId, paymentId, orgId, cashfreeOrderId, paymentMethod, amountPaid }, debugId = 'MANUAL') {
    strapi.log.info(`[${debugId}] ========== CREATE SUBSCRIPTION START ==========`);
    try {
      strapi.log.info(`[${debugId}] Subscription params:`, { userId, kitId, pricingId, paymentId, orgId });

      // ✅ IDEMPOTENCY CHECK: Check if subscription already exists for this payment
      if (paymentId) {
        strapi.log.info(`[${debugId}] Checking for existing subscription with paymentId: ${paymentId}`);
        const existingSubByPayment = await strapi.documents('api::kitsubscription.kitsubscription').findFirst({
          filters: {
            transactionid: paymentId
          }
        });

        if (existingSubByPayment) {
          strapi.log.warn(`[${debugId}] ⚠️ IDEMPOTENCY: Subscription already exists for payment ${paymentId}. Returning existing subscription.`);
          strapi.log.info(`[${debugId}] ========== CREATE SUBSCRIPTION (DUPLICATE PREVENTED) ==========`);
          return existingSubByPayment;
        }
        
        // Add a small random delay (0-100ms) to reduce race condition window
        // This helps stagger duplicate webhook calls
        const delay = Math.floor(Math.random() * 100);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Check again after delay in case another webhook just created it
        const recheckSub = await strapi.documents('api::kitsubscription.kitsubscription').findFirst({
          filters: {
            transactionid: paymentId
          }
        });
        
        if (recheckSub) {
          strapi.log.warn(`[${debugId}] ⚠️ IDEMPOTENCY: Subscription found on recheck. Returning existing.`);
          strapi.log.info(`[${debugId}] ========== CREATE SUBSCRIPTION (DUPLICATE PREVENTED AFTER DELAY) ==========`);
          return recheckSub;
        }
      }

      // Fetch pricing via Document API
      strapi.log.info(`[${debugId}] Fetching pricing...`);
      const pricing = await strapi.documents('api::pricing.pricing').findFirst({
        filters: { documentId: pricingId },
        populate: ['kit']
      });

      if (!pricing) {
        strapi.log.error(`[${debugId}] Pricing plan not found: ${pricingId}`);
        throw new Error('Pricing plan not found');
      }
      strapi.log.info(`[${debugId}] Pricing found:`, { name: pricing.name, option: pricing.option });

      // Fetch kit with kitlevels -> lessons
      strapi.log.info(`[${debugId}] Fetching kit with levels and lessons...`);
      const kit = await strapi.documents('api::kit.kit').findFirst({
        filters: { documentId: kitId },
        populate: {
          kitlevels: {
            populate: ['lessons']
          }
        }
      });

      if (!kit) {
        throw new Error('Kit not found');
      }

      // Map unlocked levels and lessons to documentId array (Unlock EVERYTHING for PAID)
      const levelIds = Array.isArray(kit.kitlevels) ? kit.kitlevels.map(l => l.documentId) : [];
      const lessonIds = Array.isArray(kit.kitlevels)
        ? kit.kitlevels.flatMap(l => (Array.isArray(l.lessons) ? l.lessons.map(ls => ls.documentId) : []))
        : [];
      
      strapi.log.info(`[${debugId}] Unlocking all content:`, { levelsCount: levelIds.length, lessonsCount: lessonIds.length });

      const endDate = this.calculateEndDate(pricing.option, pricing.duration);
      const nextBillingDate = (pricing.option && pricing.option.toUpperCase() !== 'ONETIME')
        ? this.calculateEndDate(pricing.option, pricing.duration)
        : null;
      
      strapi.log.info(`[${debugId}] Calculated dates:`, { endDate, nextBillingDate });

      // Check for EXISTING subscription (Active or Expired) to UPGRADE
      strapi.log.info(`[${debugId}] Checking for existing subscription by user+kit...`);
      const existingSubscription = await strapi.documents('api::kitsubscription.kitsubscription').findFirst({
        filters: {
          user: { documentId: userId },
          kit: { documentId: kitId }
        }
      });

      let subscription;

      if (existingSubscription) {
        strapi.log.info(`[${debugId}] UPGRADING existing subscription:`, { 
          subscriptionId: existingSubscription.documentId,
          currentType: existingSubscription.subscription_type 
        });
        
        subscription = await strapi.documents('api::kitsubscription.kitsubscription').update({
          documentId: existingSubscription.documentId,
          data: {
            pricing: pricingId,
            subscription_type: 'PAID',
            paymentstatus: 'ACTIVE',
            startdate: new Date(),
            enddate: endDate,
            next_billing_date: nextBillingDate,
            auto_renew: pricing.option ? pricing.option.toUpperCase() !== 'ONETIME' : true,
            cashfree_order_id: cashfreeOrderId || null,
            payment_method: paymentMethod || null,
            amount_paid: amountPaid || null,
            last_payment_at: new Date(),
            unlocked_levels: levelIds,
            unlocked_lessons: lessonIds,
            transactionid: paymentId || null
          }
        });
        strapi.log.info(`[${debugId}] Subscription UPGRADED successfully`);
      } else {
        strapi.log.info(`[${debugId}] Creating NEW PAID subscription`);
        
        try {
          // Create kitsubscription via Document API
          subscription = await strapi.documents('api::kitsubscription.kitsubscription').create({
            data: {
              user: userId,
              kit: kitId,
              pricing: pricingId,
              org: orgId || null,
              subscription_type: 'PAID',
              paymentstatus: 'ACTIVE',
              startdate: new Date(),
              enddate: endDate,
              next_billing_date: nextBillingDate,
              auto_renew: pricing.option ? pricing.option.toUpperCase() !== 'ONETIME' : true,
              cashfree_order_id: cashfreeOrderId || null,
              payment_method: paymentMethod || null,
              amount_paid: amountPaid || null,
              last_payment_at: new Date(),
              unlocked_levels: levelIds,
              unlocked_lessons: lessonIds,
              transactionid: paymentId || null
            },
            status: 'published'
          });
          strapi.log.info(`[${debugId}] NEW subscription created successfully`);
        } catch (createError) {
          // Handle race condition: another webhook might have just created it
          if (createError.message && createError.message.includes('unique')) {
            strapi.log.warn(`[${debugId}] ⚠️ Race condition detected during subscription creation. Fetching existing subscription...`);
            
            // Try to find subscription by transactionid first (most specific)
            subscription = await strapi.documents('api::kitsubscription.kitsubscription').findFirst({
              filters: { transactionid: paymentId }
            });
            
            // If not found by transactionid, try user+kit
            if (!subscription) {
              subscription = await strapi.documents('api::kitsubscription.kitsubscription').findFirst({
                filters: {
                  user: { documentId: userId },
                  kit: { documentId: kitId },
                  paymentstatus: 'ACTIVE'
                }
              });
            }
            
            if (!subscription) {
              strapi.log.error(`[${debugId}] Cannot find subscription after unique constraint error`);
              throw createError;
            }
            
            strapi.log.info(`[${debugId}] Found existing subscription created by concurrent webhook:`, {
              subscriptionId: subscription.documentId
            });
          } else {
            // Re-throw other errors
            throw createError;
          }
        }
      }

      strapi.log.info(`[${debugId}] Subscription documentId: ${subscription.documentId}`);

      // Note: kitprogress is NOT created automatically on subscription
      // It will be created when user actually starts engaging with the kit
      
      strapi.log.info(`[${debugId}] ========== CREATE SUBSCRIPTION SUCCESS ==========`);
      strapi.log.info(`[${debugId}] Final subscription:`, { 
        subscriptionId: subscription.documentId,
        type: subscription.subscription_type,
        status: subscription.paymentstatus
      });

      return subscription;
    } catch (error) {
      strapi.log.error(`[${debugId}] ========== CREATE SUBSCRIPTION ERROR ==========`);
      strapi.log.error(`[${debugId}] Error creating/updating subscription:`, error);
      throw error;
    }
  }

  /**
   * Create free subscription (Document API)
   */
  async createFreeSubscription({ userId, kitId, orgId, isFreemium = false }) {
    try {
      strapi.log.info('Creating free subscription:', { userId, kitId, isFreemium });

      // Check if ANY subscription exists (not just ACTIVE)
      const existing = await strapi.documents('api::kitsubscription.kitsubscription').findFirst({
        filters: {
          user: { documentId: userId },
          kit: { documentId: kitId }
        }
      });

      if (existing && existing.paymentstatus === 'ACTIVE') {
        strapi.log.info('User already has active subscription for this kit (documentId):', existing.documentId);
        return existing;
      }

      // Fetch kit with levels & lessons
      const kit = await strapi.documents('api::kit.kit').findFirst({
        filters: { documentId: kitId },
        populate: {
          kitlevels: {
            populate: ['lessons']
          }
        }
      });

      if (!kit) {
        throw new Error('Kit not found');
      }

      let levelIds = [];
      let lessonIds = [];

      if (Array.isArray(kit.kitlevels)) {
        if (isFreemium) {
          // For FREEMIUM: unlock only free levels
          const freeLevels = kit.kitlevels.filter(l => l.is_free);
          levelIds = freeLevels.map(l => l.documentId);
          
          // Unlock only free lessons across all levels
          lessonIds = kit.kitlevels.flatMap(l => 
            (Array.isArray(l.lessons) ? l.lessons.filter(ls => ls.is_free).map(ls => ls.documentId) : [])
          );
        } else {
          // Unlock everything for purely FREE kits
          levelIds = kit.kitlevels.map(l => l.documentId);
          lessonIds = kit.kitlevels.flatMap(l => (Array.isArray(l.lessons) ? l.lessons.map(ls => ls.documentId) : []));
        }
      }

      let subscription;

      if (existing) {
        // Reactivate/update existing subscription
        strapi.log.info('Reactivating existing subscription (documentId):', existing.documentId);
        subscription = await strapi.documents('api::kitsubscription.kitsubscription').update({
          documentId: existing.documentId,
          data: {
            subscription_type: isFreemium ? 'FREEMIUM' : 'FREE',
            paymentstatus: 'ACTIVE',
            startdate: new Date(),
            enddate: null,
            auto_renew: false,
            unlocked_levels: levelIds,
            unlocked_lessons: lessonIds
          }
        });
      } else {
        // Create new subscription
        subscription = await strapi.documents('api::kitsubscription.kitsubscription').create({
          data: {
            user: userId,
            kit: kitId,
            org: orgId || null,
            subscription_type: isFreemium ? 'FREEMIUM' : 'FREE',
            paymentstatus: 'ACTIVE',
            startdate: new Date(),
            enddate: null,
            auto_renew: false,
            unlocked_levels: levelIds,
            unlocked_lessons: lessonIds
          },
          status: 'published'
        });
      }

      strapi.log.info('Free/Freemium subscription processed successfully (documentId):', subscription.documentId);

      // Note: kitprogress is NOT created automatically on subscription
      // It will be created when user actually starts engaging with the kit

      return subscription;
    } catch (error) {
      strapi.log.error('Error creating free subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription (Document API)
   */
  async cancelSubscription(subscriptionId, reason, userId) {
    try {
      strapi.log.info('Cancelling subscription (documentId):', subscriptionId);

      const subscription = await strapi.documents('api::kitsubscription.kitsubscription').findFirst({
        filters: { documentId: subscriptionId },
        populate: ['user', 'kit']
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const ownerId = subscription.user?.documentId || subscription.user;
      if (ownerId !== userId) {
        throw new Error('Unauthorized');
      }

      const updated = await strapi.documents('api::kitsubscription.kitsubscription').update({
        documentId: subscriptionId,
        data: {
          paymentstatus: 'CANCELLED',
          cancelled_at: new Date(),
          cancellation_reason: reason,
          auto_renew: false
        }
      });

      // Deactivate kit progress for user
      await this.lockKit(userId, subscription.kit?.documentId || subscription.kit);

      return updated;
    } catch (error) {
      strapi.log.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Unlock kit for user (create or reactivate kitprogress) — Document API only
   */
  async unlockKit(userId, kitId, debugId = 'MANUAL') {
    try {
      strapi.log.info(`[${debugId}] Unlocking kit for user:`, { userId, kitId });

      // Ensure user exists (Document API - plugin user)
      const user = await strapi.documents('plugin::users-permissions.user').findFirst({
        filters: { documentId: userId }
      });

      const kit = await strapi.documents('api::kit.kit').findFirst({
        filters: { documentId: kitId }
      });

      if (!user || !kit) {
        strapi.log.warn(`[${debugId}] unlockKit: user or kit not found`, { userFound: !!user, kitFound: !!kit });
        return;
      }

      // Find existing kitprogress using documentIds
      const existing = await strapi.documents('api::kitprogress.kitprogress').findFirst({
        filters: {
          users: { documentId: userId },
          kit: { documentId: kitId }
        }
      });

      if (!existing) {
        strapi.log.info(`[${debugId}] Creating NEW kitprogress for user`);
        await strapi.documents('api::kitprogress.kitprogress').create({
          data: {
            users: userId,
            kit: kitId,
            is_active: true,
            kit_status: 'NOT_STARTED',
            progress: 0
          },
          status: 'published'
        });
        strapi.log.info(`[${debugId}] Kitprogress created successfully`);
      } else if (!existing.is_active) {
        strapi.log.info(`[${debugId}] Reactivating existing kitprogress`);
        await strapi.documents('api::kitprogress.kitprogress').update({
          documentId: existing.documentId,
          data: { is_active: true }
        });
        strapi.log.info(`[${debugId}] Kitprogress reactivated`);
      } else {
        strapi.log.info(`[${debugId}] Kitprogress already active`);
      }
    } catch (error) {
      strapi.log.error('Error unlocking kit:', error);
      throw error;
    }
  }

  /**
   * Lock kit for user (deactivate kitprogress) — Document API only
   */
  async lockKit(userId, kitId) {
    try {
      // Find kitprogress by documentId relations
      const kp = await strapi.documents('api::kitprogress.kitprogress').findFirst({
        filters: {
          users: { documentId: userId },
          kit: { documentId: kitId }
        }
      });

      if (kp) {
        await strapi.documents('api::kitprogress.kitprogress').update({
          documentId: kp.documentId,
          data: { is_active: false }
        });
      }
    } catch (error) {
      strapi.log.error('Error locking kit:', error);
      throw error;
    }
  }

  /**
   * Check if user has active subscription for kit (Document API)
   * Also checks for expiration and updates status if needed
   */
  async hasActiveSubscription(userId, kitId) {
    try {
      const subscription = await strapi.documents('api::kitsubscription.kitsubscription').findFirst({
        filters: {
          user: { documentId: userId },
          kit: { documentId: kitId },
          paymentstatus: 'ACTIVE'
        }
      });

      if (!subscription) return false;

      // Check expiration (only for subscriptions with end dates)
      if (subscription.enddate) {
        const now = new Date();
        const end = new Date(subscription.enddate);
        if (now > end) {
          strapi.log.info('Subscription expired:', subscription.documentId);
          // Mark as expired
          await strapi.documents('api::kitsubscription.kitsubscription').update({
            documentId: subscription.documentId,
            data: { paymentstatus: 'EXPIRED' }
          });
          // Lock kit
          await this.lockKit(userId, kitId);
          return false;
        }
      }

      return true;
    } catch (error) {
      strapi.log.error('Error checking active subscription:', error);
      return false;
    }
  }
}

module.exports = new SubscriptionService();