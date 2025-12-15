// src/api/payment/controllers/payment.js
// Fixed: use Document Service API exclusively (strapi.documents) so relations use documentId correctly.
'use strict';

const crypto = require('crypto');
const subscriptionService = require('../services/subscription');
const Cashfree = require('cashfree-pg').Cashfree;

/**
 * Map Cashfree payment_group to our payment_method enum
 */
function mapPaymentMethod(cashfreePaymentGroup) {
  if (!cashfreePaymentGroup) return 'OTHER';
  
  const mapping = {
    'upi': 'UPI',
    'credit card': 'CARD',
    'debit card': 'CARD',
    'card': 'CARD',
    'net banking': 'NETBANKING',
    'netbanking': 'NETBANKING',
    'wallet': 'WALLET',
    'emi': 'CARD',
    'cardless emi': 'OTHER',
    'paylater': 'OTHER'
  };
  
  const normalized = String(cashfreePaymentGroup).toLowerCase().trim();
  return mapping[normalized] || 'OTHER';
}


module.exports = {
  /**
   * POST /api/payment/create-order
   */
  async createOrder(ctx) {
    const debugId = `ORDER-${Date.now()}`;
    strapi.log.info(`[${debugId}] ========== CREATE ORDER START ==========`);
    
    try {
      const { kitId, pricingId } = ctx.request.body;
      const user = ctx.state.user;
      const cashfreeService = strapi.service('api::payment.cashfree');

      strapi.log.info(`[${debugId}] Request params:`, { kitId, pricingId, userId: user?.documentId });

      if (!user) {
        strapi.log.warn(`[${debugId}] User not authenticated`);
        return ctx.unauthorized('User not authenticated');
      }
      if (!kitId || !pricingId) {
        strapi.log.warn(`[${debugId}] Missing kitId or pricingId`);
        return ctx.badRequest('Kit ID and Pricing ID are required');
      }

      // Fetch kit details (Document API)
      strapi.log.info(`[${debugId}] Fetching kit details...`);
      const kit = await strapi.documents('api::kit.kit').findFirst({
        filters: { documentId: kitId },
        populate: {
          orgs: true,
          offers: {
            populate: ['pricings']
          }
        }
      });

      if (!kit) {
        strapi.log.error(`[${debugId}] Kit not found: ${kitId}`);
        return ctx.notFound('Kit not found');
      }
      strapi.log.info(`[${debugId}] Kit found:`, { name: kit.name, type: kit.kit_type });
      if (kit.kit_type === 'FREE') {
        strapi.log.warn(`[${debugId}] Attempted to create order for FREE kit`);
        return ctx.badRequest('This kit is free and does not require payment');
      }

      // Fetch pricing details (Document API)
      strapi.log.info(`[${debugId}] Fetching pricing details...`);
      const pricing = await strapi.documents('api::pricing.pricing').findFirst({
        filters: { documentId: pricingId }
      });

      if (!pricing || !pricing.is_active) {
        strapi.log.error(`[${debugId}] Pricing not found or inactive: ${pricingId}`);
        return ctx.notFound('Pricing plan not found or inactive');
      }
      strapi.log.info(`[${debugId}] Pricing found:`, { name: pricing.name, amount: pricing.amount });

      // Calculate final amount with discount
      const finalAmount = cashfreeService.calculateFinalPrice(pricing, kit);
      strapi.log.info(`[${debugId}] Final amount calculated:`, { original: pricing.amount, final: finalAmount });

      // Fetch user with org populated to ensure we link subscription to the correct org
      strapi.log.info(`[${debugId}] Fetching user org...`);
      const userWithOrg = await strapi.documents('plugin::users-permissions.user').findFirst({
        filters: { documentId: user.documentId },
        populate: ['org']
      });

      const userOrgId = userWithOrg?.org?.documentId || null;
      strapi.log.info(`[${debugId}] User org:`, { orgId: userOrgId });

      // Check for existing pending payment (Document API)
      strapi.log.info(`[${debugId}] Checking for existing pending payment...`);
      // Use nested filtering for relations: { relationName: { documentId: '...' } }
      const existingPayment = await strapi.documents('api::user-payment.user-payment').findFirst({
        filters: {
          user: { documentId: user.documentId },
          kit: { documentId: kitId },
          pricing: { documentId: pricingId },
          payment_status: 'PENDING'
        },
        sort: 'createdAt:desc'
      });
      
      if (existingPayment) {
        strapi.log.info(`[${debugId}] Found existing payment:`, { 
          orderId: existingPayment.cashfree_order_id,
          status: existingPayment.payment_status 
        });
      } else {
        strapi.log.info(`[${debugId}] No existing pending payment found`);
      }

      if (existingPayment && existingPayment.cashfree_order_id) {
        try {
          strapi.log.info(`[${debugId}] Checking Cashfree status for existing order...`);
          const orderStatus = await cashfreeService.getOrder(existingPayment.cashfree_order_id);
          strapi.log.info(`[${debugId}] Cashfree order status:`, { status: orderStatus.order_status });

          if (orderStatus.order_status === 'PAID') {
            strapi.log.warn(`[${debugId}] Order already PAID, updating local record`);
            // Update local record just in case
            await strapi.documents('api::user-payment.user-payment').update({
              documentId: existingPayment.documentId,
              data: { payment_status: 'SUCCESS' }
            });
            return ctx.send({
              success: false,
              alreadyPaid: true,
              message: 'This kit has already been purchased. Please check "My Kits" to access it.',
              orderId: existingPayment.cashfree_order_id,
              paymentDocumentId: existingPayment.documentId
            });
          } 
          else if (orderStatus.order_status === 'PENDING') {
            // CRITICAL: Money is being processed by bank
            // User has already paid, bank is processing (2-3 days)
            // DO NOT allow retry - could lead to double charge
            strapi.log.warn(`[${debugId}] Payment is PENDING with bank - money being processed`);
            return ctx.send({
              success: false,
              processing: true,
              message: 'Your payment is being processed by the bank. This may take 2-3 working days.',
              orderId: existingPayment.cashfree_order_id,
              amount: existingPayment.amount,
              currency: existingPayment.currency,
              paymentDocumentId: existingPayment.documentId,
              // Redirect to status page where user can refresh and check
              checkStatusUrl: `/payment-status/${existingPayment.cashfree_order_id}`,
              supportMessage: 'If payment is not credited within 3 days, please contact admin support with your Order ID.',
              statusCheckEnabled: true,
              kitName: kit?.name || 'Kit',
              pricingName: pricing?.name || 'Subscription'
            });
          }
          else if (orderStatus.order_status === 'ACTIVE') {
            // Payment NOT started or incomplete - safe to resume
            strapi.log.info(`[${debugId}] Resuming existing ACTIVE order (payment not completed yet)`);
            return ctx.send({
              success: true,
              existingPayment: true,
              message: 'You have an incomplete payment for this kit. Click below to continue payment.',
              orderId: existingPayment.cashfree_order_id,
              paymentSessionId: orderStatus.payment_session_id,
              amount: existingPayment.amount,
              currency: existingPayment.currency,
              paymentDocumentId: existingPayment.documentId,
              supportMessage: 'If you face any issues, please contact admin support.'
            });
          } 
          else if (orderStatus.order_status === 'EXPIRED') {
            strapi.log.info(`[${debugId}] Previous order expired, will create new one`);
            await strapi.documents('api::user-payment.user-payment').update({
              documentId: existingPayment.documentId,
              data: { payment_status: 'EXPIRED' }
            });
            // Allow creating a new order since this one expired
          }
          else if (orderStatus.order_status === 'USER_DROPPED') {
            strapi.log.info(`[${debugId}] User abandoned previous payment, will create new one`);
            await strapi.documents('api::user-payment.user-payment').update({
              documentId: existingPayment.documentId,
              data: { payment_status: 'CANCELLED' }
            });
            // Allow creating a new order
          }
        } catch (err) {
          strapi.log.warn(`[${debugId}] Error checking existing order status:`, err.message);
          // If we can't verify status, assume it might be pending - be safe
          strapi.log.info(`[${debugId}] Cannot verify payment status - blocking duplicate attempt`);
          return ctx.send({
            success: false,
            processing: true,
            message: 'You have an existing payment that we cannot verify. Please wait or contact admin.',
            orderId: existingPayment.cashfree_order_id,
            amount: existingPayment.amount,
            currency: existingPayment.currency,
            paymentDocumentId: existingPayment.documentId,
            supportMessage: 'Unable to verify payment status. Please contact admin support with your Order ID for assistance.'
          });
        }
      }

      // Create Cashfree order
      strapi.log.info(`[${debugId}] Creating new Cashfree order...`);
      let orderData;
      try {
        orderData = await cashfreeService.createOrder({
          amount: finalAmount,
          currency: pricing.currency || 'INR',
          customerId: user.documentId,
          customerDetails: {
            name: user.username,
            email: user.email,
            phone: user.mobile_number ? String(user.mobile_number) : '9999999999'
          },
          orderMeta: {
            kitId: kit.documentId,
            pricingId: pricing.documentId,
            userId: user.documentId,
            orgId: userOrgId,
            kitName: kit.name,
            pricingName: pricing.name
          }
        });
        strapi.log.info(`[${debugId}] Cashfree order created:`, { orderId: orderData.orderId });
      } catch (err) {
        strapi.log.error(`[${debugId}] Cashfree createOrder failed:`, err);
        return ctx.internalServerError('Failed to initiate payment with gateway: ' + err.message);
      }

      // Create user-payment record (Document API)
      strapi.log.info(`[${debugId}] Creating user-payment record...`);
      try {
        await strapi.documents('api::user-payment.user-payment').create({
          data: {
            cashfree_order_id: orderData.orderId,
            amount: finalAmount,
            currency: pricing.currency || 'INR',
            payment_status: 'PENDING',
            user: user.documentId,
            kit: kitId,
            pricing: pricingId,
            org: userOrgId,
            customer_name: user.username,
            customer_email: user.email,
            customer_phone: user.mobile_number ? String(user.mobile_number) : '',
            kit_name: kit.name,
            pricing_name: pricing.name,
            transaction_date: new Date()
          }
        });
        strapi.log.info(`[${debugId}] User-payment record created successfully`);
      } catch (err) {
        strapi.log.error(`[${debugId}] Database user-payment creation failed:`, err);
        return ctx.internalServerError('Failed to save payment record: ' + err.message);
      }

      strapi.log.info(`[${debugId}] ========== CREATE ORDER SUCCESS ==========`);
      strapi.log.info(`[${debugId}] Final response:`, {
        orderId: orderData.orderId,
        userId: user.documentId,
        kitId,
        pricingId,
        amount: finalAmount
      });

      return ctx.send({
        success: true,
        orderId: orderData.orderId,
        paymentSessionId: orderData.paymentSessionId,
        amount: finalAmount,
        currency: pricing.currency || 'INR'
      });
    } catch (error) {
      strapi.log.error(`[${debugId}] ========== CREATE ORDER ERROR ==========`);
      strapi.log.error(`[${debugId}] Error in createOrder:`, error);
      return ctx.internalServerError('Failed to create payment order: ' + error.message);
    }
  },

  /**
   * POST /api/payment/webhook
   */
  async webhook(ctx) {
    const debugId = `WEBHOOK-${Date.now()}`;
    strapi.log.info(`[${debugId}] ========== WEBHOOK RECEIVED ==========`);
    const cashfreeService = strapi.service('api::payment.cashfree');
    
    try {
      const signature = ctx.request.headers['x-webhook-signature'];
      const timestamp = ctx.request.headers['x-webhook-timestamp'];

      strapi.log.info(`[${debugId}] Headers:`, { 
        hasSignature: !!signature, 
        timestamp,
        contentType: ctx.request.headers['content-type']
      });

      // -------------------------------------------------
      // Get raw body from Strapi's body parser
      // -------------------------------------------------
      // Strapi's body parser with includeUnparsed: true stores raw body
      const rawBuffer = ctx.request.body[Symbol.for('unparsedBody')];
      const rawBody = rawBuffer ? rawBuffer.toString('utf8') : JSON.stringify(ctx.request.body);
      
      if (!rawBody || rawBody.trim() === '') {
        strapi.log.error(`[${debugId}] No raw body available for signature verification`);
        return ctx.badRequest('Invalid request body');
      }

      strapi.log.info(`[${debugId}] Webhook raw body length: ${rawBody.length}`);
      strapi.log.info(`[${debugId}] Webhook version: ${ctx.request.headers['x-webhook-version']}`);
      strapi.log.info(`[${debugId}] Timestamp: '${timestamp}'`);
      strapi.log.info(`[${debugId}] Environment: ${process.env.CASHFREE_ENVIRONMENT || 'sandbox'}`);

      // STRICT signature verification for security
      const isProduction = process.env.CASHFREE_ENVIRONMENT === 'production';
      
      try {
        // -------------------------------------------------
        // Compute HMAC signature using Cashfree secret
        // -------------------------------------------------
        const signatureBody = timestamp + rawBody;
        const expectedSignature = crypto
          .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
          .update(signatureBody)
          .digest('base64');
        
        strapi.log.info(`[${debugId}] Signature verification:`, {
          received: signature,
          expected: expectedSignature,
          match: signature === expectedSignature
        });

        if (signature !== expectedSignature) {
          strapi.log.error(`[${debugId}] ❌ SECURITY: Invalid webhook signature detected`);
          strapi.log.error(`[${debugId}] This could be:`);
          strapi.log.error(`[${debugId}]   1. An unauthorized/fake webhook attempt`);
          strapi.log.error(`[${debugId}]   2. Cashfree test/sandbox webhook (known issue)`);
          strapi.log.error(`[${debugId}]   3. Wrong secret key in environment`);
          
          // Extract order ID from body for logging
          const webhookData = ctx.request.body;
          const orderId = webhookData?.data?.order?.order_id;
          
          if (orderId) {
            strapi.log.error(`[${debugId}] ⚠️  Order ${orderId} - Payment received but signature invalid`);
          }
          
          // PRODUCTION: Strict enforcement - reject webhook
          if (isProduction) {
            strapi.log.error(`[${debugId}] 🔒 PRODUCTION MODE: Rejecting webhook due to invalid signature`);
            strapi.log.error(`[${debugId}] ACTION REQUIRED: Check Cashfree dashboard and manually process refund if needed`);
            
            // Mark payment as FAILED due to security issue
            if (orderId) {
              try {
                const payment = await strapi.documents('api::user-payment.user-payment').findFirst({
                  filters: { cashfree_order_id: orderId }
                });
                
                if (payment && payment.payment_status === 'PENDING') {
                  await strapi.documents('api::user-payment.user-payment').update({
                    documentId: payment.documentId,
                    data: {
                      payment_status: 'FAILED',
                      payment_gateway_response: { 
                        error: 'Invalid webhook signature', 
                        webhook_data: webhookData,
                        timestamp: new Date().toISOString()
                      }
                    }
                  });
                  strapi.log.warn(`[${debugId}] Payment ${orderId} marked as FAILED due to signature mismatch`);
                }
              } catch (err) {
                strapi.log.error(`[${debugId}] Error updating payment status:`, err.message);
              }
            }
            
            return ctx.unauthorized('Invalid webhook signature');
          } 
          // SANDBOX: Allow for testing but log warning
          else {
            strapi.log.warn(`[${debugId}] 🧪 SANDBOX MODE: Allowing webhook despite signature mismatch`);
            strapi.log.warn(`[${debugId}] This is normal in Cashfree sandbox/test environment`);
            strapi.log.warn(`[${debugId}] In production, this webhook would be REJECTED`);
          }
        } else {
          strapi.log.info(`[${debugId}] ✅ Webhook signature verified successfully`);
        }
      } catch (error) {
        strapi.log.error(`[${debugId}] Error during signature verification:`, error.message);
        
        // In production, fail closed (reject on error)
        if (isProduction) {
          strapi.log.error(`[${debugId}] 🔒 PRODUCTION MODE: Rejecting webhook due to verification error`);
          return ctx.unauthorized('Signature verification failed');
        } else {
          strapi.log.warn(`[${debugId}] 🧪 SANDBOX MODE: Continuing despite verification error`);
        }
      }
      
      // Parse webhook data
      const webhookData = ctx.request.body;
      const { type, data } = webhookData;
      
      strapi.log.info(`[${debugId}] Webhook type: ${type}, orderId: ${data?.order?.order_id}`);

      if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
        strapi.log.info(`[${debugId}] Calling handlePaymentSuccess...`);
        await this.handlePaymentSuccess(data, debugId);
      } else if (type === 'PAYMENT_FAILED_WEBHOOK') {
        strapi.log.info(`[${debugId}] Calling handlePaymentFailed...`);
        await this.handlePaymentFailed(data, debugId);
      } else {
        strapi.log.warn(`[${debugId}] Unknown webhook type: ${type}`);
      }

      strapi.log.info(`[${debugId}] ========== WEBHOOK SUCCESS ==========`);
      return ctx.send({ success: true });
    } catch (error) {
      strapi.log.error(`[${debugId}] ========== WEBHOOK ERROR ==========`);
      strapi.log.error(`[${debugId}] Error in webhook:`, error);
      return ctx.internalServerError('Webhook processing failed');
    }
  },

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(data, debugId = 'MANUAL') {
    strapi.log.info(`[${debugId}] ========== HANDLE PAYMENT SUCCESS START ==========`);
    try {
      const orderId = data.order.order_id;
      const paymentId = data.payment?.cf_payment_id || null;
      const paymentMethod = data.payment?.payment_group || null;

      strapi.log.info(`[${debugId}] Processing payment:`, { orderId, paymentId, paymentMethod });

      // Find payment record
      strapi.log.info(`[${debugId}] Finding payment record...`);
      const payment = await strapi.documents('api::user-payment.user-payment').findFirst({
        filters: {
          cashfree_order_id: orderId
        }
      });

      if (!payment) {
        strapi.log.error(`[${debugId}] Payment record not found for order: ${orderId}`);
        return;
      }

      strapi.log.info(`[${debugId}] Payment record found:`, { 
        paymentId: payment.documentId,
        currentStatus: payment.payment_status
      });

      // ✅ IDEMPOTENCY CHECK: If payment is already SUCCESS, skip
      if (payment.payment_status === 'SUCCESS') {
        strapi.log.warn(`[${debugId}] Payment already marked SUCCESS. Skipping duplicate webhook.`);
        strapi.log.info(`[${debugId}] ========== PAYMENT SUCCESS (DUPLICATE IGNORED) ==========`);
        return;
      }

      // ✅ ONLY UPDATE PAYMENT STATUS - NO SUBSCRIPTION CREATION
      // Subscription creation is now handled by the frontend via /finalize-subscription endpoint
      const mappedPaymentMethod = mapPaymentMethod(paymentMethod);
      strapi.log.info(`[${debugId}] Updating payment record to SUCCESS...`, {
        originalMethod: paymentMethod,
        mappedMethod: mappedPaymentMethod
      });
      
      await strapi.documents('api::user-payment.user-payment').update({
        documentId: payment.documentId,
        data: {
          cashfree_payment_id: paymentId ? String(paymentId) : null,
          payment_status: 'SUCCESS',
          payment_method: mappedPaymentMethod,
          payment_gateway_response: data.payment,
          webhook_data: data
        }
      });
      
      strapi.log.info(`[${debugId}] Payment record updated successfully`);
      strapi.log.info(`[${debugId}] Subscription creation deferred to frontend /finalize-subscription call`);
      strapi.log.info(`[${debugId}] ========== PAYMENT SUCCESS COMPLETE ==========`);
      
    } catch (error) {
      strapi.log.error(`[${debugId}] ========== PAYMENT SUCCESS ERROR ==========`);
      strapi.log.error(`[${debugId}] Error handling payment success:`, error);
      throw error;
    }
  },

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(data, debugId = 'MANUAL') {
    strapi.log.info(`[${debugId}] ========== HANDLE PAYMENT FAILED START ==========`);
    try {
      const orderId = data.order.order_id;
      strapi.log.info(`[${debugId}] Processing failed payment for order: ${orderId}`);

      const payment = await strapi.documents('api::user-payment.user-payment').findFirst({
        filters: { cashfree_order_id: orderId }
      });

      if (payment) {
        strapi.log.info(`[${debugId}] Updating payment to FAILED status...`);
        await strapi.documents('api::user-payment.user-payment').update({
          documentId: payment.documentId,
          data: {
            payment_status: 'FAILED',
            payment_gateway_response: data.payment,
            webhook_data: data
          }
        });
        strapi.log.info(`[${debugId}] Payment marked as FAILED`);
      } else {
        strapi.log.warn(`[${debugId}] Payment record not found for failed order: ${orderId}`);
      }
      
      strapi.log.info(`[${debugId}] ========== PAYMENT FAILED COMPLETE ==========`);
    } catch (error) {
      strapi.log.error(`[${debugId}] ========== PAYMENT FAILED ERROR ==========`);
      strapi.log.error(`[${debugId}] Error handling payment failure:`, error);
      throw error;
    }
  },

  /**
   * POST /api/payment/finalize-subscription
   * Creates subscription for a successful payment
   * Called by frontend after payment succeeds
   */
  async finalizeSubscription(ctx) {
    const debugId = `FINALIZE-${Date.now()}`;
    strapi.log.info(`[${debugId}] ========== FINALIZE SUBSCRIPTION START ==========`);
    
    try {
      const { orderId } = ctx.request.body;
      const userId = ctx.state.user?.documentId;

      // ✅ ERROR HANDLING #1: Authentication
      if (!userId) {
        strapi.log.warn(`[${debugId}] Unauthorized access attempt`);
        return ctx.unauthorized({ error: 'User not authenticated' });
      }

      if (!orderId) {
        strapi.log.warn(`[${debugId}] Missing orderId in request`);
        return ctx.badRequest({ error: 'orderId is required' });
      }

      strapi.log.info(`[${debugId}] Request:`, { orderId, userId });

      // Fetch payment with all required relations
      // FIX: Don't filter by user in the DB query to avoid "invalid input syntax for type integer"
      // We will verify ownership manually after fetching
      const payment = await strapi.documents('api::user-payment.user-payment').findFirst({
        filters: {
          cashfree_order_id: orderId
        },
        populate: ['user', 'kit', 'pricing', 'org', 'kitsubscription']
      });

      // ✅ ERROR HANDLING #2: Payment not found
      if (!payment) {
        strapi.log.error(`[${debugId}] Payment not found`);
        return ctx.notFound({ error: 'Payment not found' });
      }

      // ✅ SECURITY: Verify ownership manually
      // Handle both populated object (documentId) and ID string cases
      const paymentUserDocId = payment.user?.documentId || payment.user;
      
      if (paymentUserDocId !== userId) {
        strapi.log.warn(`[${debugId}] Security Alert: User ${userId} tried to finalize payment belonging to ${paymentUserDocId}`);
        return ctx.unauthorized({ error: 'Unauthorized: Payment does not belong to you' });
      }

      strapi.log.info(`[${debugId}] Payment found:`, {
        paymentId: payment.documentId,
        status: payment.payment_status,
        hasSubscription: !!payment.kitsubscription
      });

      // ✅ ERROR HANDLING #3: Payment not successful
      if (payment.payment_status !== 'SUCCESS') {
        strapi.log.warn(`[${debugId}] Payment not successful:`, payment.payment_status);
        return ctx.badRequest({
          error: 'Payment not successful',
          status: payment.payment_status
        });
      }

      // ✅ ERROR HANDLING #4: Idempotency - Subscription already exists
      if (payment.kitsubscription) {
        strapi.log.info(`[${debugId}] Subscription already exists (idempotency)`);
        return ctx.send({
          success: true,
          subscription: payment.kitsubscription,
          message: 'Subscription already exists'
        });
      }

      // Create subscription
      strapi.log.info(`[${debugId}] Creating subscription...`);
      const subscription = await subscriptionService.createSubscription({
        userId: payment.user?.documentId || payment.user,
        kitId: payment.kit?.documentId || payment.kit,
        pricingId: payment.pricing?.documentId || payment.pricing,
        paymentId: payment.documentId,
        orgId: payment.org?.documentId || payment.org,
        cashfreeOrderId: orderId,
        paymentMethod: payment.payment_method,
        amountPaid: payment.amount
      }, debugId);

      if (!subscription) {
        strapi.log.error(`[${debugId}] Subscription creation returned null/undefined`);
        return ctx.internalServerError({ error: 'Failed to create subscription' });
      }

      strapi.log.info(`[${debugId}] Subscription created:`, {
        subscriptionId: subscription.documentId
      });

      // Link subscription to payment
      await strapi.documents('api::user-payment.user-payment').update({
        documentId: payment.documentId,
        data: { kitsubscription: subscription.documentId }
      });

      strapi.log.info(`[${debugId}] Payment linked to subscription`);

      // Also link payment to subscription (bidirectional)
      await strapi.documents('api::kitsubscription.kitsubscription').update({
        documentId: subscription.documentId,
        data: {
          payments: {
            connect: [payment.documentId]
          }
        },
        status: 'published'
      });

      strapi.log.info(`[${debugId}] Bidirectional link complete`);
      strapi.log.info(`[${debugId}] ========== FINALIZE SUBSCRIPTION SUCCESS ==========`);

      return ctx.send({
        success: true,
        subscription,
        message: 'Subscription created successfully'
      });

    } catch (error) {
      strapi.log.error(`[${debugId}] ========== FINALIZE SUBSCRIPTION ERROR ==========`);
      strapi.log.error(`[${debugId}] Error:`, error);
      
      // ✅ ERROR HANDLING #5: Database/Service errors
      return ctx.internalServerError({
        error: 'Failed to create subscription',
        message: error.message || 'Internal server error'
      });
    }
  },

  /**
   * GET /api/payment/order/:orderId
   */
  async getOrder(ctx) {
    try {
      const { orderId } = ctx.params;
      const user = ctx.state.user;

      if (!user) return ctx.unauthorized('User not authenticated');

      // Use Document API to fetch payment
      let payment = await strapi.documents('api::user-payment.user-payment').findFirst({
        filters: { cashfree_order_id: orderId },
        populate: ['user', 'kit', 'pricing', 'kitsubscription']
      });

      if (!payment) return ctx.notFound('Order not found');

      // Verify ownership - payment.user may be populated object or a documentId
      const paymentUserId = payment.user?.documentId || payment.user;
      if (paymentUserId !== user.documentId) return ctx.unauthorized('Unauthorized');

      // Check Cashfree status if PENDING
      if (payment.payment_status === 'PENDING') {
        try {
          const cashfreeService = strapi.service('api::payment.cashfree');
          // Use getOrderStatus to get both order and payment details
          const statusData = await cashfreeService.getOrderStatus(orderId);
          
          if (statusData && statusData.order) {
            let finalStatus = statusData.order.order_status;

            // CRITICAL: Distinguish between "User Dropped" (ACTIVE) and "Bank Processing" (ACTIVE + Pending Payment)
            if (finalStatus === 'ACTIVE') {
              const payments = statusData.payments || [];
              const hasPendingPayment = payments.some(p => 
                p.payment_status === 'PENDING' || 
                p.payment_status === 'FLAGGED' ||
                p.payment_status === 'PROCESSING'
              );

              if (hasPendingPayment) {
                finalStatus = 'PENDING'; // Override to PENDING for frontend
              }
            }

            // Add cashfree status to response
            payment = { ...payment, cashfree_status: finalStatus };
          }
        } catch (err) {
          strapi.log.error('Error fetching Cashfree order status:', err);
        }
      }

      return ctx.send({ success: true, order: payment });
    } catch (error) {
      strapi.log.error('Error fetching order:', error);
      return ctx.internalServerError('Failed to fetch order');
    }
  },

  /**
   * POST /api/payment/subscribe-free
   */
  async subscribeFree(ctx) {
    try {
      const { kitId } = ctx.request.body;
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('User not authenticated');

      const kit = await strapi.documents('api::kit.kit').findFirst({
        filters: { documentId: kitId },
        populate: ['orgs']
      });

      if (!kit) return ctx.notFound('Kit not found');
      
      // Allow FREE and FREEMIUM kits
      if (kit.kit_type !== 'FREE' && kit.kit_type !== 'FREEMIUM') {
        return ctx.badRequest('This kit requires payment');
      }

      const hasSubscription = await subscriptionService.hasActiveSubscription(user.documentId, kitId);
      if (hasSubscription) return ctx.badRequest('Already subscribed to this kit');

      // Fetch user with org populated to ensure we link subscription to the correct org
      const userWithOrg = await strapi.documents('plugin::users-permissions.user').findFirst({
        filters: { documentId: user.documentId },
        populate: ['org']
      });

      const userOrgId = userWithOrg?.org?.documentId || null;

      const subscription = await subscriptionService.createFreeSubscription({
        userId: user.documentId,
        kitId: kit.documentId,
        orgId: userOrgId,
        isFreemium: kit.kit_type === 'FREEMIUM'
      });

      return ctx.send({ success: true, subscription });
    } catch (error) {
      strapi.log.error('Error creating free subscription:', error);
      return ctx.internalServerError('Failed to create subscription');
    }
  },

  /**
   * POST /api/payment/cancel-subscription
   */
  async cancelSubscription(ctx) {
    try {
      const { subscriptionId, reason } = ctx.request.body;
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('User not authenticated');

      const subscription = await subscriptionService.cancelSubscription(
        subscriptionId,
        reason || 'User requested cancellation',
        user.documentId
      );

      return ctx.send({ success: true, subscription });
    } catch (error) {
      strapi.log.error('Error cancelling subscription:', error);
      if (error.message === 'Unauthorized') return ctx.unauthorized('You do not have permission to cancel this subscription');
      return ctx.internalServerError('Failed to cancel subscription');
    }
  },

  /**
   * GET /api/payment/my-subscriptions
   */
  async mySubscriptions(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('User not authenticated');

      const subscriptions = await strapi.documents('api::kitsubscription.kitsubscription').findMany({
        filters: { user: { documentId: user.documentId } },
        populate: ['kit', 'pricing', 'payments'],
        sort: 'createdAt:desc'
      });

      return ctx.send({ success: true, subscriptions });
    } catch (error) {
      strapi.log.error('Error fetching subscriptions:', error);
      return ctx.internalServerError('Failed to fetch subscriptions');
    }
  },

  /**
   * GET /api/payment/purchase-history
   * Pagination using Document Service API
   */
  async getPurchaseHistory(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('User not authenticated');

      const page = parseInt(ctx.query.page || '1', 10);
      const pageSize = parseInt(ctx.query.limit || ctx.query.pageSize || '10', 10);

      // Fetch results and total count using Document API
      const payments = await strapi.documents('api::user-payment.user-payment').findMany({
        filters: { user: { documentId: user.documentId } },
        populate: ['kit', 'pricing', 'kitsubscription'],
        sort: 'createdAt:desc',
        page,
        pageSize
      });

      const total = await strapi.documents('api::user-payment.user-payment').count({
        filters: { user: { documentId: user.documentId } }
      });

      return ctx.send({
        data: payments,
        meta: {
          pagination: {
            page,
            pageSize,
            total,
            pageCount: Math.ceil(total / pageSize)
          }
        }
      });
    } catch (error) {
      strapi.log.error('Error fetching purchase history:', error);
      return ctx.internalServerError('Failed to fetch purchase history');
    }
  },

  async cancelPayment(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('User not authenticated');

      const { paymentId } = ctx.request.body;
      if (!paymentId) return ctx.badRequest('Payment ID is required');

      // Use Document API findOne by documentId and populate user
      const payment = await strapi.documents('api::user-payment.user-payment').findOne({
        documentId: paymentId,
        populate: ['user']
      });

      if (!payment) return ctx.notFound('Payment record not found');

      const paymentUserId = payment.user?.documentId || payment.user;
      if (paymentUserId !== user.documentId) return ctx.forbidden('You are not authorized to cancel this payment');

      if (payment.payment_status !== 'PENDING') return ctx.badRequest('Only pending payments can be cancelled');

      const updatedPayment = await strapi.documents('api::user-payment.user-payment').update({
        documentId: paymentId,
        data: { payment_status: 'CANCELLED' }
      });

      return ctx.send({ success: true, message: 'Payment cancelled successfully', data: updatedPayment });
    } catch (error) {
      strapi.log.error('Error cancelling payment:', error);
      return ctx.internalServerError('Failed to cancel payment');
    }
  },

  /**
   * POST /api/payment/test-payment-success (TEST ONLY)
   */
  async testPaymentSuccess(ctx) {
    try {
      const { orderId } = ctx.request.body;
      if (!orderId) return ctx.badRequest('Order ID is required');

      // Use Document API to find payment
      const payment = await strapi.documents('api::user-payment.user-payment').findFirst({
        filters: { cashfree_order_id: orderId },
        populate: ['user', 'kit', 'pricing', 'org']
      });

      if (!payment) return ctx.notFound('Payment record not found');

      // Update payment to SUCCESS
      await strapi.documents('api::user-payment.user-payment').update({
        documentId: payment.documentId,
        data: {
          cashfree_payment_id: `test_payment_${Date.now()}`,
          payment_status: 'SUCCESS',
          payment_method: 'OTHER',
          payment_gateway_response: { test: true, completedAt: new Date() }
        }
      });

      // Fetch user with org populated to ensure we link subscription to the correct org
      const userWithOrg = await strapi.documents('plugin::users-permissions.user').findFirst({
        filters: { documentId: payment.user?.documentId || payment.user },
        populate: ['org']
      });

      const userOrgId = userWithOrg?.org?.documentId || null;

      // Create subscription
      const subscription = await subscriptionService.createSubscription({
        userId: payment.user?.documentId || payment.user,
        kitId: payment.kit?.documentId || payment.kit,
        pricingId: payment.pricing?.documentId || payment.pricing,
        paymentId: payment.documentId,
        orgId: userOrgId, // Use fetched user org, not payment org (which might be wrong)
        cashfreeOrderId: orderId,
        paymentMethod: 'OTHER',
        amountPaid: payment.amount
      });

      // Link payment to subscription
      if (subscription && subscription.documentId) {
        await strapi.documents('api::user-payment.user-payment').update({
          documentId: payment.documentId,
          data: { kitsubscription: subscription.documentId }
        });
      } else if (subscription && subscription.id) {
        await strapi.documents('api::user-payment.user-payment').update({
          documentId: payment.documentId,
          data: { kitsubscription: subscription.id }
        });
      }

      strapi.log.info('Test payment marked as successful:', {
        orderId,
        subscriptionId: subscription?.documentId || subscription?.id || null
      });

      return ctx.send({ success: true, message: 'Payment marked as successful and subscription created', subscription });
    } catch (error) {
      strapi.log.error('Error in testPaymentSuccess:', error);
      return ctx.internalServerError('Failed to process test payment: ' + error.message);
    }
  }
};
