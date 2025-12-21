// src/api/payment/controllers/payment.js
"use strict";

const crypto = require("crypto");
// const subscriptionService = require('../services/subscription'); // Accessed via strapi.service usually

module.exports = {
  /**
   * POST /api/payment/create-order
   * Create an Invoice and initiating Cashfree Order
   */
  async createOrder(ctx) {
    const debugId = `ORDER-${Date.now()}`;
    strapi.log.info(`[${debugId}] ========== CREATE ORDER START ==========`);

    try {
      const { coursePricingId, subjectPricingId, type } = ctx.request.body;
      const user = ctx.state.user;
      const cashfreeService = strapi.service("api::payment.cashfree");
      const invoiceService = strapi.service("api::payment.invoice-service");

      strapi.log.info(`[${debugId}] Request params:`, {
        coursePricingId,
        subjectPricingId,
        type,
        userId: user?.documentId,
      });

      if (!user) {
        strapi.log.warn(`[${debugId}] User not authenticated`);
        return ctx.unauthorized("User not authenticated");
      }

      const pricingDocId = coursePricingId || subjectPricingId;
      const purchaseType = coursePricingId ? "COURSE" : "SUBJECT";

      if (!pricingDocId) {
        strapi.log.warn(`[${debugId}] Missing pricing ID`);
        return ctx.badRequest(
          "coursePricingId or subjectPricingId is required"
        );
      }

      const collection = coursePricingId
        ? "api::course-pricing.course-pricing"
        : "api::subject-pricing.subject-pricing";
      const populate = coursePricingId ? ["course"] : ["subject"];

      strapi.log.info(
        `[${debugId}] Processing ${purchaseType} purchase: ${pricingDocId}`
      );

      const pricing = await strapi.documents(collection).findFirst({
        filters: { documentId: pricingDocId },
        populate,
      });

      if (!pricing) {
        strapi.log.error(`[${debugId}] Pricing not found: ${pricingDocId}`);
        return ctx.notFound("Pricing plan not found");
      }

      // Check active subscription
      const subscriptionService = strapi.service("api::payment.subscription");
      const hasSub = await subscriptionService.hasActiveSubscription(
        user.documentId,
        pricing,
        purchaseType
      );

      if (hasSub) {
        strapi.log.warn(
          `[${debugId}] User already has active subscription for ${purchaseType} ${pricingDocId}`
        );
        return ctx.badRequest(
          `You already have an active subscription for this ${purchaseType.toLowerCase()}`
        );
      }

      // Create Invoice & Invoice Payment (Local DB)
      strapi.log.info(`[${debugId}] Creating Invoice...`);

      const orgId = user.org?.documentId || user.org;
      strapi.log.info(`[${debugId}] Org ID for invoice:`, {
        userOrg: user.org,
        orgId: orgId,
        hasOrg: !!orgId,
      });

      const invoice = await invoiceService.createInvoice({
        user,
        pricing,
        type: purchaseType,
        paymentMethod: "CASHFREE",
        orgId: orgId,
      });

      if (!invoice) throw new Error("Failed to create invoice");

      const paymentRecord = invoice.payments?.[0]; // The PENDING payment created with invoice
      if (!paymentRecord)
        throw new Error("Invoice created without payment record");

      strapi.log.info(
        `[${debugId}] Invoice created: ${invoice.invoice_number}. Initiating Cashfree Order...`
      );

      // Create Cashfree order
      const orderData = await cashfreeService.createOrder({
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        customerId: user.documentId,
        customerDetails: {
          name: user.username,
          email: user.email,
          phone: user.mobile_number ? String(user.mobile_number) : "9999999999",
        },
        orderId: paymentRecord.payment_reference, // Use our payment reference as Order ID
        orderMeta: {
          invoiceId: invoice.documentId,
          paymentId: paymentRecord.documentId,
          userId: user.documentId,
          type: purchaseType,
        },
      });

      // Update Payment with Cashfree Order ID
      await strapi.documents("api::invoice-payment.invoice-payment").update({
        documentId: paymentRecord.documentId,
        data: {
          gateway_transaction_id: orderData.payment_session_id,
        },
      });

      strapi.log.info(
        `[${debugId}] ========== CREATE ORDER SUCCESS ==========`
      );

      return ctx.send({
        success: true,
        orderId: orderData.order_id,
        paymentSessionId: orderData.payment_session_id,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        invoiceId: invoice.documentId,
      });
    } catch (error) {
      strapi.log.error(`[${debugId}] ========== CREATE ORDER ERROR ==========`);
      strapi.log.error(`[${debugId}] Error in createOrder:`, error);
      return ctx.internalServerError(
        "Failed to create payment order: " + error.message
      );
    }
  },

  /**
   * POST /api/payment/webhook
   */
  async webhook(ctx) {
    const debugId = `WEBHOOK-${Date.now()}`;
    strapi.log.info(`[${debugId}] ========== WEBHOOK RECEIVED ==========`);
    const cashfreeService = strapi.service("api::payment.cashfree");

    try {
      const signature = ctx.request.headers["x-webhook-signature"];
      const timestamp = ctx.request.headers["x-webhook-timestamp"];

      // Get raw body
      const rawBuffer = ctx.request.body[Symbol.for("unparsedBody")];
      const rawBody = rawBuffer
        ? rawBuffer.toString("utf8")
        : JSON.stringify(ctx.request.body);

      // Verify Signature
      const isProduction = process.env.CASHFREE_ENVIRONMENT === "production";
      const isValid = cashfreeService.verifyWebhookSignature(
        signature,
        timestamp,
        rawBody
      );

      if (!isValid) {
        strapi.log.error(`[${debugId}] Invalid Signature`);
        if (isProduction) return ctx.unauthorized("Invalid signature");
        strapi.log.warn(`[${debugId}] SANDBOX: Continuing...`);
      }

      strapi.log.info(
        `[${debugId}] Headers:`,
        JSON.stringify(ctx.request.headers)
      );

      let webhookData = ctx.request.body;
      strapi.log.info(`[${debugId}] Body Type: ${typeof webhookData}`);
      strapi.log.info(
        `[${debugId}] Raw Webhook Body (stringified): ${JSON.stringify(webhookData)}`
      );

      if (!webhookData || Object.keys(webhookData).length === 0) {
        strapi.log.warn(
          `[${debugId}] Empty body received. Trying unparsedBody symbol...`
        );
        const unparsed =
          ctx.request.body && ctx.request.body[Symbol.for("unparsedBody")];
        if (unparsed) {
          strapi.log.info(
            `[${debugId}] Unparsed Body found: ${unparsed.toString()}`
          );
          try {
            const parsed = JSON.parse(unparsed.toString());
            webhookData = parsed; // Reassign webhookData
          } catch (e) {
            strapi.log.error(
              `[${debugId}] Failed to parse unparsed body: ${e.message}`
            );
          }
        }
      }

      const { type, data } = webhookData;

      // Handle generic test webhook from Cashfree dashboard
      if (type === "WEBHOOK" && data?.test_object) {
        strapi.log.info(
          `[${debugId}] Received Test Webhook. Returning success.`
        );
        return ctx.send({
          success: true,
          message: "Test webhook received successfully",
        });
      }

      // Handle different payload structures if needed, strictly check data.order.order_id
      const orderId = data?.order?.order_id || data?.payment?.order_id; // Sometimes in payment object?

      if (!orderId) {
        strapi.log.warn(`[${debugId}] Order ID missing in webhook payload`);
        // If it's a known test ping, return success
        if (type === "TEST_WEBHOOK") {
          return ctx.send({ success: true, message: "Ignored test webhook" });
        }
        return ctx.badRequest("Missing order_id in payload");
      }

      strapi.log.info(
        `[${debugId}] Processing Webhook: ${type} for Order: ${orderId}`
      );

      // ========== WEBHOOK EVENT STORAGE (for replay testing) ==========
      // Generate unique event ID based on order + type + timestamp
      const eventId = `${orderId}-${type}-${Date.now()}`;

      // Store the webhook event
      let webhookEvent = null;
      try {
        webhookEvent = await strapi
          .documents("api::webhook-event.webhook-event")
          .create({
            data: {
              event_id: eventId,
              order_id: orderId,
              event_type: type,
              raw_payload: webhookData,
              raw_headers: {
                signature: ctx.request.headers["x-webhook-signature"],
                timestamp: ctx.request.headers["x-webhook-timestamp"],
              },
              processing_status: "STORED",
              replay_count: 0,
            },
          });
        strapi.log.info(`[${debugId}] Stored webhook event: ${eventId}`);
      } catch (storeError) {
        // Don't fail the webhook if storage fails (e.g., duplicate key on rapid retries)
        strapi.log.warn(
          `[${debugId}] Could not store webhook event: ${storeError.message}`
        );
      }

      // Find Payment Record (Invoice Payment)
      const paymentRecord = await strapi
        .documents("api::invoice-payment.invoice-payment")
        .findFirst({
          filters: { payment_reference: orderId },
          populate: ["invoice"],
        });

      if (!paymentRecord) {
        strapi.log.error(
          `[${debugId}] Payment record not found for reference: ${orderId}`
        );
        return ctx.badRequest("Payment record not found");
      }

      const invoiceService = strapi.service("api::payment.invoice-service");
      const subscriptionService = strapi.service("api::payment.subscription");

      if (type === "PAYMENT_SUCCESS_WEBHOOK") {
        strapi.log.info(
          `[DEBUG-WEBHOOK] ========== PAYMENT_SUCCESS_WEBHOOK Processing ==========`
        );
        strapi.log.info(`[DEBUG-WEBHOOK] Order ID: ${orderId}`);
        strapi.log.info(
          `[DEBUG-WEBHOOK] Payment ID: ${data.payment?.cf_payment_id}`
        );
        strapi.log.info(
          `[DEBUG-WEBHOOK] Payment Method: ${JSON.stringify(data.payment?.payment_method)}`
        );

        if (paymentRecord.invoice) {
          strapi.log.info(
            `[DEBUG-WEBHOOK] Invoice found: ${paymentRecord.invoice.documentId}`
          );
          strapi.log.info(`[DEBUG-WEBHOOK] Marking Invoice PAID...`);

          // Extract payment method from webhook
          const paymentMethodData = data.payment?.payment_method || {};
          let paymentMethodEnum = "OTHER";
          if (paymentMethodData.card) paymentMethodEnum = "CARD";
          else if (paymentMethodData.upi) paymentMethodEnum = "UPI";
          else if (paymentMethodData.netbanking)
            paymentMethodEnum = "NETBANKING";

          await invoiceService.markInvoicePaid(
            paymentRecord.invoice.documentId,
            {
              referenceId: data.payment?.cf_payment_id,
              transactionId: data.payment?.payment_group,
              metadata: data,
              paymentMethod: paymentMethodEnum,
            }
          );

          strapi.log.info(
            `[DEBUG-WEBHOOK] Invoice marked as PAID successfully`
          );

          // ✅ CRITICAL: Subscription is NOT created here anymore
          // Subscription creation is handled by /finalize-subscription endpoint (called by frontend)
          // This prevents duplicates when webhooks fire multiple times
          strapi.log.info(
            `[DEBUG-WEBHOOK] ⚠️ Subscription NOT created in webhook (deferred to finalize-subscription endpoint)`
          );
          strapi.log.info(
            `[DEBUG-WEBHOOK] Frontend will call /finalize-subscription after confirming SUCCESS status`
          );
        } else {
          strapi.log.warn(
            `[DEBUG-WEBHOOK] No invoice linked to payment record`
          );
        }
      } else if (type === "PAYMENT_FAILED_WEBHOOK") {
        if (paymentRecord.invoice) {
          strapi.log.info(`[${debugId}] Marking Invoice FAILED...`);
          await invoiceService.markInvoiceFailed(
            paymentRecord.invoice.documentId,
            data.payment?.payment_message || "Payment Failed"
          );
        }
      }

      strapi.log.info(`[${debugId}] ========== WEBHOOK SUCCESS ==========`);
      return ctx.send({ success: true });
    } catch (error) {
      strapi.log.error(`[${debugId}] ========== WEBHOOK ERROR ==========`);
      strapi.log.error(`[${debugId}] Error in webhook:`, error);
      return ctx.internalServerError("Webhook processing failed");
    }
  },

  /**
   * GET /api/payment/order/:orderId
   * Check order status (Cashfree + Local DB)
   */
  async getOrderStatus(ctx) {
    const { orderId } = ctx.params;
    const user = ctx.state.user;

    strapi.log.info(`[ORDER-STATUS] Checking status for orderId: "${orderId}"`);

    if (!user) return ctx.unauthorized();

    try {
      const cashfreeService = strapi.service("api::payment.cashfree");

      // 1. Fetch from Cashfree first for real-time status
      let cfOrder = null;
      try {
        const status = await cashfreeService.getOrderStatus(orderId);
        cfOrder = status.order;
        strapi.log.info(
          `[ORDER-STATUS] Cashfree status: ${cfOrder?.order_status}`
        );
      } catch (err) {
        strapi.log.warn(
          `Could not fetch Cashfree status for ${orderId}: ${err.message}`
        );
        // Continue to check local DB
      }

      // 2. Fetch Local Invoice Payment
      const paymentRecord = await strapi
        .documents("api::invoice-payment.invoice-payment")
        .findFirst({
          filters: { payment_reference: orderId },
          populate: {
            invoice: {
              populate: ["invoice_items"],
            },
          },
        });

      strapi.log.info(
        `[ORDER-STATUS] Local payment record found: ${!!paymentRecord}`
      );

      // Debug: List all recent payments to help troubleshoot
      if (!paymentRecord) {
        const recentPayments = await strapi
          .documents("api::invoice-payment.invoice-payment")
          .findMany({
            limit: 5,
            sort: { createdAt: "desc" },
          });
        strapi.log.info(
          `[ORDER-STATUS] Recent payments: ${JSON.stringify(recentPayments.map((p) => ({ ref: p.payment_reference, status: p.payment_status })))}`
        );
        return ctx.notFound("Order not found");
      }

      // 3. Determine Final Status
      // Priority: Cashfree > Local Payment Status > Local Invoice Status > Default PENDING
      let paymentStatus = "PENDING";

      if (cfOrder?.order_status === "PAID") {
        paymentStatus = "SUCCESS";
      } else if (cfOrder?.order_status === "FAILED") {
        paymentStatus = "FAILED";
      } else if (cfOrder?.order_status === "USER_DROPPED") {
        // User abandoned payment - treat as FAILED so they can retry
        paymentStatus = "FAILED";
      } else if (cfOrder?.order_status === "EXPIRED") {
        // Order expired - treat as FAILED so they can create new order
        paymentStatus = "FAILED";
      } else if (paymentRecord.payment_status === "SUCCESS") {
        paymentStatus = "SUCCESS";
      } else if (paymentRecord.payment_status === "FAILED") {
        paymentStatus = "FAILED";
      } else if (paymentRecord.invoice?.invoice_status === "PAID") {
        paymentStatus = "SUCCESS";
      } else if (
        paymentRecord.invoice?.invoice_status === "CANCELLED" ||
        paymentRecord.invoice?.invoice_status === "FAILED"
      ) {
        paymentStatus = "FAILED";
      }

      strapi.log.info(
        `[ORDER-STATUS] Final status determination: ${JSON.stringify({
          cashfreeStatus: cfOrder?.order_status,
          paymentRecordStatus: paymentRecord.payment_status,
          invoiceStatus: paymentRecord.invoice?.invoice_status,
          finalStatus: paymentStatus,
        })}`
      );

      // Get Pricing/Item Name
      const invoice = paymentRecord.invoice;
      const item = invoice?.invoice_items?.[0];
      const name = item?.item_name || item?.item_description || "Subscription";

      return ctx.send({
        order_id: orderId,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        payment_status: paymentStatus,
        cashfree_status: cfOrder?.order_status || "UNKNOWN",
        item_name: name,
        // pricing: ... populate if needed for resume logic
      });
    } catch (error) {
      return ctx.internalServerError(
        "Failed to check order status: " + error.message
      );
    }
  },

  /**
   * GET /api/payment/history
   */
  async getPurchaseHistory(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();

      const invoices = await strapi.documents("api::invoice.invoice").findMany({
        filters: { customer: { documentId: user.documentId } },
        populate: {
          payments: true,
          course: true,
          invoice_items: {
            populate: {
              course: true,
              subject: {
                populate: ["courses"],
              },
            },
          },
        },
        sort: "createdAt:desc",
      });

      return ctx.send({ data: invoices });
    } catch (error) {
      return ctx.internalServerError(error);
    }
  },

  /**
   * POST /api/payment/finalize-subscription
   * Ensure subscription is created for a successful order (Client backup)
   * ✅ This is the SINGLE source of subscription creation (deferred from webhook)
   */
  async finalizeSubscription(ctx) {
    const debugId = `FINALIZE-${Date.now()}`;
    strapi.log.info(
      `[DEBUG-FINALIZE] ========== FINALIZE SUBSCRIPTION START ==========`
    );

    try {
      const { orderId } = ctx.request.body;
      const user = ctx.state.user;

      strapi.log.info(`[DEBUG-FINALIZE] Order ID: ${orderId}`);
      strapi.log.info(
        `[DEBUG-FINALIZE] User: ${user?.documentId} (${user?.email})`
      );

      if (!user) {
        strapi.log.warn(`[DEBUG-FINALIZE] No user in request - unauthorized`);
        return ctx.unauthorized();
      }
      if (!orderId) {
        strapi.log.warn(`[DEBUG-FINALIZE] No orderId provided`);
        return ctx.badRequest("Order ID required");
      }

      // IDEMPOTENCY CHECK #1: Check if subscription already exists for this order
      strapi.log.info(
        `[DEBUG-FINALIZE] Checking for existing subscription by cashfree_order_id...`
      );
      const existingSub = await strapi
        .documents("api::usersubscription.usersubscription")
        .findFirst({
          filters: { cashfree_order_id: orderId },
          populate: ["course", "subjects"],
        });

      if (existingSub) {
        strapi.log.info(
          `[DEBUG-FINALIZE] ✅ IDEMPOTENCY HIT: Subscription already exists`
        );
        strapi.log.info(
          `[DEBUG-FINALIZE] Existing subscription ID: ${existingSub.documentId}`
        );
        strapi.log.info(
          `[DEBUG-FINALIZE] Returning existing subscription (no duplicate created)`
        );
        return ctx.send({
          success: true,
          message: "Subscription already exists",
          subscriptionId: existingSub.documentId,
          alreadyExisted: true,
        });
      }

      strapi.log.info(
        `[DEBUG-FINALIZE] No existing subscription found. Proceeding with creation...`
      );

      // 1. Find the payment/invoice
      strapi.log.info(
        `[DEBUG-FINALIZE] Looking up payment by payment_reference: ${orderId}`
      );
      const payment = await strapi
        .documents("api::invoice-payment.invoice-payment")
        .findFirst({
          filters: { payment_reference: orderId },
          populate: {
            invoice: {
              populate: ["customer", "invoice_items", "course", "org"],
            },
          },
        });

      if (!payment) {
        strapi.log.error(
          `[DEBUG-FINALIZE] Payment not found for orderId: ${orderId}`
        );
        return ctx.notFound("Payment not found");
      }

      const invoice = payment.invoice;
      strapi.log.info(`[DEBUG-FINALIZE] Payment found: ${payment.documentId}`);
      strapi.log.info(
        `[DEBUG-FINALIZE] Payment status: ${payment.payment_status}`
      );
      strapi.log.info(`[DEBUG-FINALIZE] Invoice ID: ${invoice?.documentId}`);

      // Verify ownership
      const invoiceCustomerId =
        invoice.customer?.documentId ||
        invoice.customer?.id ||
        invoice.customer;

      strapi.log.info(
        `[DEBUG-FINALIZE] Invoice customer: ${invoiceCustomerId}, Request user: ${user.documentId}`
      );

      if (invoiceCustomerId !== user.documentId) {
        strapi.log.warn(
          `[DEBUG-FINALIZE] SECURITY: User ${user.documentId} tried to finalize order belonging to ${invoiceCustomerId}`
        );
        return ctx.forbidden("Not authorized");
      }

      // 2. Check status (Remote or Local)
      if (payment.payment_status !== "SUCCESS") {
        strapi.log.info(
          `[DEBUG-FINALIZE] Local payment status is ${payment.payment_status}, checking Cashfree...`
        );
        const cashfreeService = strapi.service("api::payment.cashfree");
        try {
          const status = await cashfreeService.getOrderStatus(orderId);
          strapi.log.info(
            `[DEBUG-FINALIZE] Cashfree status: ${status.order?.order_status}`
          );

          if (status.order.order_status === "PAID") {
            strapi.log.info(
              `[DEBUG-FINALIZE] Cashfree confirms PAID. Proceeding...`
            );
          } else {
            strapi.log.warn(
              `[DEBUG-FINALIZE] Cashfree status is ${status.order?.order_status}, not PAID`
            );
            return ctx.badRequest("Payment is not PAID");
          }
        } catch (e) {
          strapi.log.error(
            `[DEBUG-FINALIZE] Failed to verify with Cashfree: ${e.message}`
          );
          return ctx.badRequest("Could not verify payment status");
        }
      } else {
        strapi.log.info(
          `[DEBUG-FINALIZE] Payment already marked SUCCESS locally`
        );
      }

      // 3. Trigger Subscription Creation (Idempotent via subscription service)
      if (invoice.invoice_items?.length > 0) {
        const mainItem = invoice.invoice_items[0];
        const purchaseType = mainItem.item_type || "COURSE";

        strapi.log.info(`[DEBUG-FINALIZE] Purchase type: ${purchaseType}`);
        strapi.log.info(
          `[DEBUG-FINALIZE] Main item: ${JSON.stringify({
            type: mainItem.item_type,
            course: mainItem.course?.documentId,
            subject: mainItem.subject?.documentId,
          })}`
        );

        let pricingInfo = null;
        if (purchaseType === "COURSE") {
          const courseId =
            invoice.course?.documentId || mainItem.course?.documentId;
          if (courseId) {
            pricingInfo = await strapi
              .documents("api::course-pricing.course-pricing")
              .findFirst({
                filters: { course: { documentId: courseId } },
                populate: ["course"],
              });
          }
        } else if (purchaseType === "SUBJECT") {
          const subjectId = mainItem.subject?.documentId;
          if (subjectId) {
            pricingInfo = await strapi
              .documents("api::subject-pricing.subject-pricing")
              .findFirst({
                filters: { subject: { documentId: subjectId } },
                populate: ["subject"],
              });
          }
        }

        const pricingData = {
          documentId: pricingInfo?.documentId,
          course: invoice.course || mainItem.course,
          subject: mainItem.subject,
          amount: invoice.total_amount,
        };

        // Extract payment method type from stored payment_method_details field
        // This field is set by markInvoicePaid in invoice-service.js
        // payment.payment_gateway is "CASHFREE" (gateway name), not the method type
        let paymentMethodEnum = "OTHER";
        const methodData =
          payment.payment_method_details ||
          payment.gateway_response?.payment?.payment_method;
        if (methodData) {
          if (methodData.card) paymentMethodEnum = "CARD";
          else if (methodData.upi) paymentMethodEnum = "UPI";
          else if (methodData.netbanking) paymentMethodEnum = "NETBANKING";
        }
        strapi.log.info(
          `[DEBUG-FINALIZE] Payment method: ${paymentMethodEnum}`
        );

        strapi.log.info(
          `[DEBUG-FINALIZE] Calling subscription service createSubscription...`
        );
        const subscriptionService = strapi.service("api::payment.subscription");

        const sub = await subscriptionService.createSubscription({
          user: user,
          pricing: pricingData,
          invoice: invoice,
          type: purchaseType,
          cashfreeOrderId: orderId,
          transactionId: payment.gateway_transaction_id,
          paymentMethod: paymentMethodEnum,
          org: invoice.org,
        });

        strapi.log.info(
          `[DEBUG-FINALIZE] ✅ Subscription created/returned: ${sub.documentId}`
        );
        strapi.log.info(
          `[DEBUG-FINALIZE] ========== FINALIZE SUBSCRIPTION SUCCESS ==========`
        );

        return ctx.send({
          success: true,
          message: "Subscription verified/created",
          subscriptionId: sub.documentId,
        });
      }

      return ctx.badRequest("No invoice items found");
    } catch (err) {
      strapi.log.error(`[${debugId}] Finalize error:`, err);
      return ctx.internalServerError(err);
    }
  },

  /**
   * POST /api/payment/resume
   * Resume/Retry an existing payment
   */
  async resumePayment(ctx) {
    try {
      const { orderId } = ctx.request.body;
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();

      // Find the payment record with invoice customer populated
      const payments = await strapi
        .documents("api::invoice-payment.invoice-payment")
        .findMany({
          filters: { payment_reference: orderId },
          populate: {
            invoice: {
              populate: ["customer"],
            },
          },
        });

      const payment = payments?.[0];
      if (!payment) return ctx.notFound("Payment not found");

      // Verify ownership via invoice customer
      const invoice = payment.invoice;
      // Depending on population, customer might be an object (with documentId) or just an ID if not populated
      const customer = invoice.customer;

      const customerDocId = customer?.documentId;
      const customerId = customer?.id || customer; // fallback if just numeric ID

      // Debugging ownership check
      strapi.log.info(
        `[RESUME-PAYMENT] Ownership Check: User=${user.documentId} (ID=${user.id}), InvoiceCustomer=${customerDocId} (ID=${customerId})`
      );

      // Check against both documentId and numeric ID to be safe
      const isOwner =
        (customerDocId && customerDocId === user.documentId) ||
        (customerId && String(customerId) === String(user.id));

      if (!isOwner) {
        strapi.log.warn(`[RESUME-PAYMENT] Ownership mismatch!`);
        return ctx.forbidden("You do not own this payment");
      }

      if (payment.payment_status === "SUCCESS") {
        return ctx.send({
          success: true,
          status: "ALREADY_PAID",
          message: "Payment already completed",
        });
      }

      const cashfreeService = strapi.service("api::payment.cashfree");

      // Check status with Cashfree
      let orderData;
      try {
        const status = await cashfreeService.getOrderStatus(orderId);
        if (status.order.payment_status === "PAID") {
          // Auto-update local status if it was actually paid
          const invoiceService = strapi.service("api::payment.invoice-service");
          await invoiceService.markInvoicePaid(invoice.documentId, {
            referenceId: status.order.cf_order_id,
            transactionId: status.order.cf_order_id,
            metadata: status.order,
          });
          return ctx.send({
            success: true,
            status: "ALREADY_PAID",
            message: "Payment verified as completed",
          });
        }

        // If pending and has active session, reuse it
        if (
          status.order.payment_status === "ACTIVE" &&
          status.order.payment_session_id
        ) {
          orderData = {
            payment_session_id: status.order.payment_session_id,
            order_id: status.order.order_id,
          };
        }
      } catch (err) {
        strapi.log.warn(
          `Could not fetch status for ${orderId}, might be expired or invalid. Creating new.`
        );
      }

      // If no valid session, create a new one for the SAME invoice but NEW order ID
      if (!orderData) {
        const newOrderId = `RETRY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const newOrder = await cashfreeService.createOrder({
          amount: payment.amount,
          currency: payment.currency,
          customerId: user.documentId,
          customerDetails: {
            name: user.username,
            email: user.email,
            phone: user.mobile_number
              ? String(user.mobile_number)
              : "9999999999",
          },
          orderId: newOrderId,
          orderMeta: {
            invoiceId: invoice.documentId,
            paymentId: payment.documentId,
            userId: user.documentId,
            isRetry: true,
            originalOrderId: orderId,
          },
        });

        // Update the EXISTING payment record with new ref (as requested by user)
        await strapi.documents("api::invoice-payment.invoice-payment").update({
          documentId: payment.documentId,
          data: {
            payment_reference: newOrderId, // Update reference to new order ID
            gateway_transaction_id: newOrder.payment_session_id,
            payment_status: "PENDING", // Ensure it's pending
          },
        });

        orderData = newOrder;
      }

      return ctx.send({
        success: true,
        paymentSessionId: orderData.payment_session_id,
        orderId: orderData.order_id,
        amount: payment.amount,
      });
    } catch (error) {
      strapi.log.error("Resume payment error:", error);
      return ctx.internalServerError(error);
    }
  },

  /**
   * POST /api/payment/cancel
   * Cancel a pending payment
   */
  async cancelPayment(ctx) {
    try {
      const { orderId } = ctx.request.body;
      const user = ctx.state.user;

      if (!user) return ctx.unauthorized();
      if (!orderId) return ctx.badRequest("Order ID is required");

      strapi.log.info(
        `[CANCEL-PAYMENT] Cancelling order: ${orderId} for user: ${user.documentId}`
      );

      // Find the payment
      const payment = await strapi
        .documents("api::invoice-payment.invoice-payment")
        .findFirst({
          filters: { payment_reference: orderId },
          populate: {
            invoice: {
              populate: ["customer"],
            },
          },
        });

      if (!payment) return ctx.notFound("Payment not found");

      // Verify ownership via invoice customer
      const invoice = payment.invoice;
      if (!invoice) return ctx.notFound("Invoice not found for payment");

      // Verify user owns the invoice
      // Customer might be populated or ID
      const customerId =
        invoice.customer?.documentId ||
        invoice.customer?.id ||
        invoice.customer;

      if (customerId !== user.documentId) {
        strapi.log.warn(
          `[CANCEL-PAYMENT] Unauthorized attempt to cancel payment. Owner: ${customerId}, Requestor: ${user.documentId}`
        );
        return ctx.unauthorized(
          "You are not authorized to cancel this payment"
        );
      }

      // Check if cancellable
      if (payment.payment_status === "SUCCESS") {
        return ctx.badRequest("Cannot cancel a successful payment");
      }

      // If already cancelled/failed, just return success to be idempotent or info
      if (
        payment.payment_status === "CANCELLED" ||
        payment.payment_status === "FAILED"
      ) {
        return ctx.send({
          success: true,
          message: "Payment already cancelled/failed",
        });
      }

      const invoiceService = strapi.service("api::payment.invoice-service");
      await invoiceService.markInvoiceCancelled(
        invoice.documentId,
        "User requested cancellation"
      );

      return ctx.send({
        success: true,
        message: "Payment cancelled successfully",
      });
    } catch (error) {
      strapi.log.error("Error cancelling payment:", error);
      return ctx.internalServerError("Failed to cancel payment");
    }
  },

  /**
   * GET /api/payment/my-subscriptions
   */
  async mySubscriptions(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();

      const subscriptions = await strapi
        .documents("api::usersubscription.usersubscription")
        .findMany({
          filters: {
            user: { documentId: user.documentId },
            paymentstatus: "ACTIVE",
          },
          populate: ["course", "subjects", "course_pricing", "subject_pricing"],
          sort: "createdAt:desc",
        });

      return ctx.send({ data: subscriptions });
    } catch (error) {
      return ctx.internalServerError(error);
    }
  },

  /**
   * POST /api/payment/webhook/replay/:eventId
   * Replay a stored webhook event for testing (TESTING ONLY)
   */
  async replayWebhook(ctx) {
    const debugId = `REPLAY-${Date.now()}`;

    // Guard: Only allow in testing mode
    if (process.env.WEBHOOK_TESTING_ENABLED !== "true") {
      strapi.log.warn(
        `[${debugId}] Replay attempt blocked - WEBHOOK_TESTING_ENABLED is not true`
      );
      return ctx.forbidden("Webhook replay is disabled in this environment");
    }

    try {
      const { eventId } = ctx.params;

      if (!eventId) {
        return ctx.badRequest("Event ID is required");
      }

      strapi.log.info(`[${debugId}] Replaying webhook event: ${eventId}`);

      // Find the stored webhook event
      const webhookEvent = await strapi
        .documents("api::webhook-event.webhook-event")
        .findFirst({
          filters: { event_id: eventId },
        });

      if (!webhookEvent) {
        return ctx.notFound(`Webhook event not found: ${eventId}`);
      }

      // Process the webhook using internal logic (simulate a replay)
      const result = await this._processWebhookPayload(
        webhookEvent.raw_payload,
        webhookEvent.raw_headers,
        debugId
      );

      // Update replay count
      await strapi.documents("api::webhook-event.webhook-event").update({
        documentId: webhookEvent.documentId,
        data: {
          replay_count: (webhookEvent.replay_count || 0) + 1,
        },
      });

      return ctx.send({
        success: true,
        message: "Webhook replayed",
        eventId,
        result,
      });
    } catch (error) {
      strapi.log.error(`[${debugId}] Replay error:`, error);
      return ctx.internalServerError("Failed to replay webhook");
    }
  },

  /**
   * POST /api/payment/webhook/replay-storm
   * Replay a webhook multiple times concurrently to test idempotency (TESTING ONLY)
   * Body: { eventId: string, replayCount: number (default 5), concurrent: boolean (default true) }
   */
  async replayStorm(ctx) {
    const debugId = `STORM-${Date.now()}`;

    // Guard: Only allow in testing mode
    if (process.env.WEBHOOK_TESTING_ENABLED !== "true") {
      strapi.log.warn(
        `[${debugId}] Replay storm attempt blocked - WEBHOOK_TESTING_ENABLED is not true`
      );
      return ctx.forbidden("Webhook replay is disabled in this environment");
    }

    try {
      const {
        eventId,
        orderId,
        replayCount = 5,
        concurrent = true,
      } = ctx.request.body;

      // Can use either eventId or find by orderId
      let webhookEvent = null;

      if (eventId) {
        webhookEvent = await strapi
          .documents("api::webhook-event.webhook-event")
          .findFirst({
            filters: { event_id: eventId },
          });
      } else if (orderId) {
        // Find the most recent success webhook for this order
        webhookEvent = await strapi
          .documents("api::webhook-event.webhook-event")
          .findFirst({
            filters: {
              order_id: orderId,
              event_type: "PAYMENT_SUCCESS_WEBHOOK",
            },
            sort: { createdAt: "desc" },
          });
      }

      if (!webhookEvent) {
        return ctx.notFound("Webhook event not found");
      }

      strapi.log.info(
        `[${debugId}] Starting replay storm: ${replayCount}x for event ${webhookEvent.event_id}`
      );

      const results = [];
      const startTime = Date.now();

      // Create replays
      const replayPromises = Array.from(
        { length: replayCount },
        async (_, index) => {
          const replayId = `${debugId}-${index}`;
          try {
            const result = await this._processWebhookPayload(
              webhookEvent.raw_payload,
              webhookEvent.raw_headers,
              replayId
            );
            return { index, success: true, result };
          } catch (error) {
            return { index, success: false, error: error.message };
          }
        }
      );

      if (concurrent) {
        // Fire all at once
        const promiseResults = await Promise.allSettled(replayPromises);
        promiseResults.forEach((pr, idx) => {
          results.push(
            pr.status === "fulfilled"
              ? pr.value
              : { index: idx, success: false, error: pr.reason?.message }
          );
        });
      } else {
        // Sequential execution
        for (const promise of replayPromises) {
          results.push(await promise);
        }
      }

      const elapsed = Date.now() - startTime;

      // Update replay count
      await strapi.documents("api::webhook-event.webhook-event").update({
        documentId: webhookEvent.documentId,
        data: {
          replay_count: (webhookEvent.replay_count || 0) + replayCount,
        },
      });

      // Check how many subscriptions exist for this order
      const subscriptionCount = await strapi
        .documents("api::usersubscription.usersubscription")
        .findMany({
          filters: {
            cashfree_order_id: webhookEvent.raw_payload?.data?.order?.order_id,
          },
        });

      const passed = subscriptionCount.length === 1;

      strapi.log.info(
        `[${debugId}] Storm complete: ${replayCount} replays in ${elapsed}ms. Subscriptions: ${subscriptionCount.length}. PASSED: ${passed}`
      );

      return ctx.send({
        success: true,
        message: `Replay storm complete`,
        replayCount,
        concurrent,
        elapsedMs: elapsed,
        results,
        subscriptionCheck: {
          orderId: webhookEvent.raw_payload?.data?.order?.order_id,
          subscriptionCount: subscriptionCount.length,
          passed,
          message: passed
            ? "✓ Idempotency check PASSED - exactly 1 subscription created"
            : `✗ Idempotency check FAILED - ${subscriptionCount.length} subscriptions found`,
        },
      });
    } catch (error) {
      strapi.log.error(`[${debugId}] Replay storm error:`, error);
      return ctx.internalServerError("Failed to execute replay storm");
    }
  },

  /**
   * Internal helper to process a webhook payload (used for replays)
   */
  async _processWebhookPayload(webhookData, headers, debugId) {
    const invoiceService = strapi.service("api::payment.invoice-service");
    const subscriptionService = strapi.service("api::payment.subscription");

    const { type, data } = webhookData;
    const orderId = data?.order?.order_id || data?.payment?.order_id;

    if (!orderId) {
      throw new Error("Missing order_id in payload");
    }

    // Find Payment Record
    const paymentRecord = await strapi
      .documents("api::invoice-payment.invoice-payment")
      .findFirst({
        filters: { payment_reference: orderId },
        populate: ["invoice"],
      });

    if (!paymentRecord) {
      throw new Error(`Payment record not found for reference: ${orderId}`);
    }

    if (type === "PAYMENT_SUCCESS_WEBHOOK") {
      if (paymentRecord.invoice) {
        strapi.log.info(
          `[${debugId}] Processing PAYMENT_SUCCESS for ${orderId}`
        );

        const paymentMethodData = data.payment?.payment_method || {};
        let paymentMethodEnum = "OTHER";
        if (paymentMethodData.card) paymentMethodEnum = "CARD";
        else if (paymentMethodData.upi) paymentMethodEnum = "UPI";
        else if (paymentMethodData.netbanking) paymentMethodEnum = "NETBANKING";

        // Mark invoice paid (idempotent - should be OK to call multiple times)
        await invoiceService.markInvoicePaid(paymentRecord.invoice.documentId, {
          referenceId: data.payment?.cf_payment_id,
          transactionId: data.payment?.payment_group,
          metadata: data,
          paymentMethod: paymentMethodEnum,
        });

        const invoiceFull = await strapi
          .documents("api::invoice.invoice")
          .findOne({
            documentId: paymentRecord.invoice.documentId,
            populate: {
              customer: { populate: ["org"] },
              course: true,
              org: true,
              invoice_items: {
                populate: ["subject", "course"],
              },
            },
          });

        const mainItem = invoiceFull.invoice_items?.[0];
        const purchaseType = mainItem?.item_type || "COURSE";

        let pricingInfo = null;
        if (purchaseType === "COURSE") {
          const courseId =
            invoiceFull.course?.documentId || mainItem?.course?.documentId;
          if (courseId) {
            pricingInfo = await strapi
              .documents("api::course-pricing.course-pricing")
              .findFirst({
                filters: { course: { documentId: courseId } },
                populate: ["course"],
              });
          }
        } else if (purchaseType === "SUBJECT") {
          const subjectId = mainItem?.subject?.documentId;
          if (subjectId) {
            pricingInfo = await strapi
              .documents("api::subject-pricing.subject-pricing")
              .findFirst({
                filters: { subject: { documentId: subjectId } },
                populate: ["subject"],
              });
          }
        }

        const pricingData = {
          documentId: pricingInfo?.documentId || null,
          course: invoiceFull.course || mainItem?.course,
          subject: mainItem?.subject,
          amount: invoiceFull.total_amount,
        };

        // This is the critical idempotent call
        const subscription = await subscriptionService.createSubscription({
          user: invoiceFull.customer,
          pricing: pricingData,
          invoice: invoiceFull,
          type: purchaseType,
          cashfreeOrderId: data.order?.order_id,
          transactionId: data.payment?.cf_payment_id,
          paymentMethod: paymentMethodEnum,
          org: invoiceFull.org || invoiceFull.customer?.org,
        });

        return {
          processed: true,
          subscriptionId: subscription.documentId,
          isNew: !subscription.wasExisting, // The subscription service should ideally indicate this
        };
      }
    } else if (type === "PAYMENT_FAILED_WEBHOOK") {
      if (paymentRecord.invoice) {
        await invoiceService.markInvoiceFailed(
          paymentRecord.invoice.documentId,
          data.payment?.payment_message || "Payment Failed"
        );
        return { processed: true, status: "failed" };
      }
    }

    return { processed: false, reason: "Unknown webhook type or no invoice" };
  },
};
