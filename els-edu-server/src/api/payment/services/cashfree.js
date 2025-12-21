"use strict";

const axios = require("axios");
const crypto = require("crypto");

module.exports = ({ strapi }) => {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const env = process.env.CASHFREE_ENVIRONMENT || "sandbox";

  const apiBase =
    env === "production"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

  const apiVersion = "2025-01-01"; // Latest version

  // Log initialization
  if (!appId || !secretKey) {
    strapi.log.warn(
      "⚠️ Cashfree credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env"
    );
  }

  const getHeaders = () => {
    return {
      "x-api-version": apiVersion,
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "Content-Type": "application/json",
    };
  };

  return {
    /**
     * Create a payment order
     */
    async createOrder({
      amount,
      currency = "INR",
      customerId,
      customerDetails,
      orderId,
      orderMeta,
    }) {
      try {
        // Use provided orderId or generate one
        const finalOrderId =
          orderId ||
          `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const request = {
          order_id: finalOrderId,
          order_amount: parseFloat(amount),
          order_currency: currency,
          customer_details: {
            customer_id: customerId.toString(),
            customer_name:
              customerDetails.name || customerDetails.username || "Customer",
            customer_email: customerDetails.email,
            customer_phone: customerDetails.phone || "9999999999",
          },
          order_meta: {
            return_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/#/payment/status?order_id=${finalOrderId}`,
            notify_url: `${process.env.BACKEND_URL || "http://localhost:1337"}/api/payment/webhook`,
            // Restrict payment methods to only: UPI, Card, Netbanking
            payment_methods: "upi,cc,dc,nb",
            ...orderMeta,
          },
        };

        strapi.log.info(
          `Creating Cashfree order: ${finalOrderId} for amount: ${amount}`
        );

        const response = await axios.post(`${apiBase}/orders`, request, {
          headers: getHeaders(),
        });

        return {
          order_id: response.data.order_id,
          payment_session_id: response.data.payment_session_id,
          cf_order_id: response.data.cf_order_id,
          order_token: response.data.order_token, // Legacy but sometimes useful
        };
      } catch (error) {
        strapi.log.error(
          "Error creating Cashfree order:",
          error.response?.data || error.message
        );
        throw new Error(
          `Failed to create payment order: ${JSON.stringify(error.response?.data || error.message)}`
        );
      }
    },

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(signature, timestamp, rawBody) {
      try {
        if (!signature || !timestamp || !rawBody) {
          strapi.log.error(
            "Missing signature, timestamp, or rawBody for verification"
          );
          return false;
        }

        // Cashfree signature logic: timestamp + rawBody
        const signedPayload = `${timestamp}${rawBody}`;

        const expectedSignature = crypto
          .createHmac("sha256", secretKey)
          .update(signedPayload)
          .digest("base64");

        return signature === expectedSignature;
      } catch (error) {
        strapi.log.error("Error verifying webhook signature:", error.message);
        return false;
      }
    },

    /**
     * Get order status from Cashfree
     */
    async getOrderStatus(orderId) {
      try {
        const orderResp = await axios.get(
          `${apiBase}/orders/${encodeURIComponent(orderId)}`,
          { headers: getHeaders() }
        );

        const paymentsResp = await axios.get(
          `${apiBase}/orders/${encodeURIComponent(orderId)}/payments`,
          { headers: getHeaders() }
        );

        return {
          order: orderResp.data,
          payments: paymentsResp.data,
        };
      } catch (error) {
        strapi.log.error(
          "Error fetching order status:",
          error.response?.data || error.message
        );
        throw error;
      }
    },
  };
};
