"use strict";

const { publishToAbly } = require("../../../../config/ably");

module.exports = ({ strapi }) => ({
  /**
   * Create an invoice for a Course or Subject purchase
   */
  async createInvoice({
    user,
    pricing,
    type,
    paymentMethod = "CASHFREE",
    orgId = null,
  }) {
    try {
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      let items = [];
      let subtotal = 0;
      let totalAmount = 0;
      let courseId = null;
      let subjectId = null;

      // Ensure pricing is loaded
      if (!pricing) throw new Error("Pricing details required");

      // Calculate amounts based on pricing type
      const amount = parseFloat(
        pricing.final_amount || pricing.amount || pricing.base_amount
      );
      subtotal = amount;

      // Calculate Tax (if applicable, currently assuming inclusive or 0 for simplicity, adjust as needed)
      // For now, let's assume specific tax logic happens here or is 0
      const taxAmount = 0;
      const discountAmount = 0; // Applied at pricing level mostly
      totalAmount = subtotal + taxAmount - discountAmount;

      if (type === "COURSE") {
        courseId =
          pricing.course?.documentId || pricing.course?.id || pricing.course;
        items.push({
          item_type: "COURSE",
          item_name: pricing.name || "Course Purchase",
          item_description: `Purchase of course: ${pricing.course?.name || "Course"}`,
          course: courseId,
          quantity: 1,
          unit_price: amount,
          line_total: amount,
          net_amount: amount,
        });
      } else if (type === "SUBJECT") {
        subjectId =
          pricing.subject?.documentId || pricing.subject?.id || pricing.subject;
        items.push({
          item_type: "SUBJECT",
          item_name: pricing.name || "Subject Purchase",
          item_description: `Purchase of subject: ${pricing.subject?.name || "Subject"}`,
          subject: subjectId,
          quantity: 1,
          unit_price: amount,
          line_total: amount,
          net_amount: amount,
        });
      }

      // Create Invoice
      strapi.log.info(`Creating invoice with org:`, {
        orgId,
        hasOrg: !!orgId,
        orgType: typeof orgId,
      });

      const invoice = await strapi.documents("api::invoice.invoice").create({
        data: {
          invoice_number: invoiceNumber,
          invoice_type: "CONSUMER_INVOICE",
          invoice_status: "PENDING",
          customer: user.documentId,
          org: orgId,
          course: courseId, // Optional generic link
          subtotal: subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          currency: pricing.currency || "INR",
          due_date: new Date(),
          billing_address: user.address || {}, // simplistic fallback
        },
        status: "published",
      });

      // Create Invoice Items (Relations must be created separately or linked via ID)
      for (const item of items) {
        await strapi.documents("api::invoice-item.invoice-item").create({
          data: {
            ...item,
            invoice: invoice.documentId,
          },
          status: "published",
        });
      }

      // If inline creation of items didn't work (depending on Strapi version/config),
      // we might need to create them separately. trusting deep creation for now.

      // Create initial Invoice Payment record (Pending)
      const payment = await strapi
        .documents("api::invoice-payment.invoice-payment")
        .create({
          data: {
            invoice: invoice.documentId,
            payment_reference: `REF-${invoiceNumber}`, // Temporary reference
            payment_gateway: paymentMethod,
            amount: totalAmount,
            currency: "INR",
            payment_status: "PENDING",
            payment_date: new Date(),
          },
          // Note: No status needed as draftAndPublish is false
        });

      return {
        ...invoice,
        payments: [payment],
      };
    } catch (error) {
      strapi.log.error("Error creating invoice:", error);
      throw error;
    }
  },

  /**
   * Mark invoice as PAID
   */
  async markInvoicePaid(invoiceId, paymentDetails) {
    try {
      const invoice = await strapi.documents("api::invoice.invoice").findOne({
        documentId: invoiceId,
        populate: ["payments"],
      });

      if (!invoice) throw new Error("Invoice not found");

      // Update Invoice
      await strapi.documents("api::invoice.invoice").update({
        documentId: invoiceId,
        data: {
          invoice_status: "PAID",
          paid_date: new Date(),
        },
      });

      // Update related Payment Record (assuming one main pending payment or create new)
      // If we passed a specific paymentId, use that. Otherwise find the pending one.
      const pendingPayment = invoice.payments?.find(
        (p) => p.payment_status === "PENDING"
      );

      if (pendingPayment) {
        await strapi.documents("api::invoice-payment.invoice-payment").update({
          documentId: pendingPayment.documentId,
          data: {
            payment_status: "SUCCESS",
            // DO NOT overwrite payment_reference - keep the original REF-INV-xxx
            // Store cf_payment_id in gateway_transaction_id instead
            gateway_transaction_id: paymentDetails.referenceId,
            gateway_response: paymentDetails.metadata,
            payment_date: new Date(),
            payment_method_details:
              paymentDetails.metadata?.payment?.payment_method || {},
          },
        });
      } else {
        // Create new success payment if none pending found
        await strapi.documents("api::invoice-payment.invoice-payment").create({
          data: {
            invoice: invoiceId,
            payment_reference: paymentDetails.referenceId,
            gateway_transaction_id: paymentDetails.transactionId,
            amount: invoice.total_amount,
            currency: invoice.currency,
            payment_status: "SUCCESS",
            payment_gateway: "CASHFREE", // or dynamic
            gateway_response: paymentDetails.metadata,
            payment_date: new Date(),
          },
          status: "published",
        });
      }

      // Publish notification
      const userId =
        invoice.customer?.documentId ||
        invoice.customer?.id ||
        invoice.customer;
      if (userId) {
        await publishToAbly(`user:${userId}`, "invoice:paid", {
          invoiceId: invoice.documentId,
          status: "PAID",
          amount: invoice.total_amount,
        });
      }

      return true;
    } catch (error) {
      strapi.log.error("Error marking invoice paid:", error);
      throw error;
    }
  },

  /**
   * Mark invoice as FAILED
   */
  async markInvoiceFailed(invoiceId, reason) {
    try {
      await strapi.documents("api::invoice.invoice").update({
        documentId: invoiceId,
        data: {
          invoice_status: "FAILED",
        },
      });

      // Also fail payments
      const invoice = await strapi.documents("api::invoice.invoice").findOne({
        documentId: invoiceId,
        populate: ["payments"],
      });

      if (invoice && invoice.payments) {
        const pendingPayments = invoice.payments.filter(
          (p) => p.payment_status === "PENDING"
        );
        for (const p of pendingPayments) {
          await strapi
            .documents("api::invoice-payment.invoice-payment")
            .update({
              documentId: p.documentId,
              data: {
                payment_status: "FAILED",
                gateway_response: { error: reason },
              },
            });
        }
      }
    } catch (error) {
      strapi.log.error("Error marking invoice failed:", error);
    }
  },
  /**
   * Mark invoice as CANCELLED
   */
  async markInvoiceCancelled(invoiceId, reason = "User cancelled") {
    try {
      await strapi.documents("api::invoice.invoice").update({
        documentId: invoiceId,
        data: {
          invoice_status: "CANCELLED",
        },
      });

      // Also cancel payments
      const invoice = await strapi.documents("api::invoice.invoice").findOne({
        documentId: invoiceId,
        populate: ["payments"],
      });

      if (invoice && invoice.payments) {
        const pendingPayments = invoice.payments.filter(
          (p) => p.payment_status === "PENDING"
        );
        for (const p of pendingPayments) {
          await strapi
            .documents("api::invoice-payment.invoice-payment")
            .update({
              documentId: p.documentId,
              data: {
                payment_status: "CANCELLED", // Using CANCELLED status for payment too
                gateway_response: { reason },
              },
            });
        }
      }
    } catch (error) {
      strapi.log.error("Error marking invoice cancelled:", error);
    }
  },
});
