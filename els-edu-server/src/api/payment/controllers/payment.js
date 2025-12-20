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
        if (paymentRecord.invoice) {
          strapi.log.info(`[${debugId}] Marking Invoice PAID...`);

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

          strapi.log.info(`[${debugId}] Creating User Subscription...`);
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

          strapi.log.info(`[${debugId}] Purchase Type: ${purchaseType}`);
          strapi.log.info(
            `[${debugId}] Main Item: ${JSON.stringify({
              type: mainItem?.item_type,
              subject: mainItem?.subject?.documentId,
              course: mainItem?.course?.documentId,
            })}`
          );

          // Fetch the actual pricing information
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

          // Build pricing object for subscription
          const pricingData = {
            documentId: pricingInfo?.documentId || null,
            course: invoiceFull.course || mainItem?.course,
            subject: mainItem?.subject,
            amount: invoiceFull.total_amount,
          };

          strapi.log.info(
            `[${debugId}] Pricing Info: ${JSON.stringify({
              documentId: pricingData.documentId,
              type: purchaseType,
            })}`
          );

          await subscriptionService.createSubscription({
            user: invoiceFull.customer,
            pricing: pricingData,
            invoice: invoiceFull,
            type: purchaseType,
            cashfreeOrderId: data.order?.order_id,
            transactionId: data.payment?.cf_payment_id,
            paymentMethod: paymentMethodEnum,
            org: invoiceFull.org || invoiceFull.customer?.org,
          });
          strapi.log.info(`[${debugId}] Subscription Created.`);
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
   */
  async finalizeSubscription(ctx) {
    const debugId = `FINALIZE-${Date.now()}`;
    try {
      const { orderId } = ctx.request.body;
      const user = ctx.state.user;

      if (!user) return ctx.unauthorized();
      if (!orderId) return ctx.badRequest("Order ID required");

      strapi.log.info(
        `[${debugId}] Finalizing subscription for order: ${orderId}`
      );

      // 1. Find the payment/invoice
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

      if (!payment) return ctx.notFound("Payment not found");
      const invoice = payment.invoice;

      // Verify ownership
      const invoiceCustomerId =
        invoice.customer?.documentId ||
        invoice.customer?.id ||
        invoice.customer;
      if (invoiceCustomerId !== user.documentId) {
        return ctx.forbidden("Not authorized");
      }

      // 2. Check status (Remote or Local)
      // If it's already marked SUCCESS locally, we are good.
      // If not, maybe webhook failed? Re-verify with Cashfree.
      if (payment.payment_status !== "SUCCESS") {
        const cashfreeService = strapi.service("api::payment.cashfree");
        try {
          const status = await cashfreeService.getOrderStatus(orderId);
          if (status.order.payment_status === "PAID") {
            // Update local status if needed (reuse invoice service logic ideally,
            // but here we just need to ensure subscription creation proceeds)
            strapi.log.info(
              `[${debugId}] Cashfree says PAID, but local was ${payment.payment_status}. Proceeding...`
            );
          } else {
            return ctx.badRequest("Payment is not PAID");
          }
        } catch (e) {
          strapi.log.error(
            `[${debugId}] Failed to verify status: ${e.message}`
          );
          return ctx.badRequest("Could not verify payment status");
        }
      }

      // 3. Trigger Subscription Creation (Idempotent)
      // We essentially reuse the logic from webhook.
      // Extract needed data similarly.

      // Find main item
      if (invoice.invoice_items?.length > 0) {
        const mainItem = invoice.invoice_items[0]; // simplistic assumption
        const purchaseType = mainItem.item_type || "COURSE";

        let pricingInfo = null;
        // ... fetch pricing doc similar to webhook ...
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

        const subscriptionService = strapi.service("api::payment.subscription");

        const sub = await subscriptionService.createSubscription({
          user: invoice.customer,
          pricing: pricingData,
          invoice: invoice,
          type: purchaseType,
          cashfreeOrderId: orderId,
          transactionId: payment.gateway_transaction_id,
          paymentMethod: payment.payment_gateway,
          org: invoice.org,
        });

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
};
