#!/usr/bin/env node
/**
 * create-mock-webhook.js
 *
 * Creates a mock webhook event for testing when you don't want to make a real purchase.
 * This stores a fake webhook payload that you can then replay.
 *
 * Usage:
 *   node scripts/create-mock-webhook.js
 *
 * After running this, you can run the idempotency test:
 *   node scripts/test-webhook-idempotency.js MOCK-ORDER-<timestamp>
 */

const axios = require("axios");

const BASE_URL = process.env.API_URL || "http://localhost:1337/api";

async function createMockWebhook() {
  console.log("\n=================================================");
  console.log("  CREATE MOCK WEBHOOK EVENT");
  console.log("=================================================\n");

  const mockOrderId = `MOCK-ORDER-${Date.now()}`;
  const mockTransactionId = `MOCK-TXN-${Date.now()}`;

  // Create a mock webhook payload (similar to Cashfree's format)
  const mockPayload = {
    type: "PAYMENT_SUCCESS_WEBHOOK",
    data: {
      order: {
        order_id: mockOrderId,
        order_amount: 100,
        order_currency: "INR",
        order_status: "PAID",
      },
      payment: {
        cf_payment_id: mockTransactionId,
        payment_status: "SUCCESS",
        payment_amount: 100,
        payment_currency: "INR",
        payment_method: { upi: {} },
        payment_group: "upi",
        payment_time: new Date().toISOString(),
      },
    },
  };

  console.log(`Creating mock webhook with Order ID: ${mockOrderId}`);
  console.log("");

  try {
    // First, we need a payment record for the mock order to work
    // In a real scenario, the order would exist in the DB
    // For now, let's just store the webhook event directly

    const response = await axios.post(`${BASE_URL}/webhook-events`, {
      data: {
        event_id: `${mockOrderId}-PAYMENT_SUCCESS_WEBHOOK-${Date.now()}`,
        order_id: mockOrderId,
        event_type: "PAYMENT_SUCCESS_WEBHOOK",
        raw_payload: mockPayload,
        raw_headers: {
          signature: "mock-signature",
          timestamp: Date.now().toString(),
        },
        processing_status: "STORED",
        replay_count: 0,
      },
    });

    console.log("✅ Mock webhook event created!");
    console.log("");
    console.log("Event Details:");
    console.log(`  Event ID: ${response.data?.data?.event_id || "N/A"}`);
    console.log(`  Order ID: ${mockOrderId}`);
    console.log(`  Document ID: ${response.data?.data?.documentId || "N/A"}`);
    console.log("");
    console.log(
      "⚠️  NOTE: This is a mock event. Replay will fail because there's"
    );
    console.log("    no matching payment record in the database.");
    console.log("");
    console.log("To test with real data:");
    console.log("  1. Make a test purchase through your app");
    console.log("  2. The webhook endpoint will automatically store the event");
    console.log("  3. Run: node scripts/test-webhook-idempotency.js");
    console.log("");
  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.error("❌ Authentication required to create webhook events");
      console.error(
        "   You may need to configure public access for webhook-events"
      );
      console.error("   or use the Strapi Admin Panel to create mock events.");
    } else {
      console.error("❌ ERROR:", error.response?.data || error.message);
    }
    process.exit(1);
  }
}

createMockWebhook();
