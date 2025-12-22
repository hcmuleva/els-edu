#!/usr/bin/env node
/**
 * test-webhook-idempotency.js
 *
 * Tests the webhook idempotency by:
 * 1. Finding a recent webhook event (or creating a mock one)
 * 2. Firing the same webhook 5x concurrently via replay-storm
 * 3. Verifying only 1 subscription was created
 *
 * Usage:
 *   WEBHOOK_TESTING_ENABLED=true npm run dev  # Start server first
 *   node scripts/test-webhook-idempotency.js [orderId]
 *
 * If orderId is not provided, it will use the most recent stored webhook event.
 */

const axios = require("axios");

const BASE_URL = process.env.API_URL || "http://localhost:1337/api";
const REPLAY_COUNT = 5;

async function main() {
  const orderId = process.argv[2];

  console.log("\n=================================================");
  console.log("  WEBHOOK IDEMPOTENCY TEST");
  console.log("=================================================\n");

  if (!orderId) {
    console.log(
      "No order ID provided. Will use most recent stored webhook event."
    );
    console.log(
      "Tip: Pass an order ID as argument: node scripts/test-webhook-idempotency.js <orderId>\n"
    );
  }

  try {
    // Step 1: Trigger replay storm
    console.log(
      `[1/3] Triggering replay storm with ${REPLAY_COUNT} concurrent webhooks...`
    );

    const stormPayload = orderId
      ? { orderId, replayCount: REPLAY_COUNT, concurrent: true }
      : { replayCount: REPLAY_COUNT, concurrent: true };

    // If no orderId, we need to find one first
    if (!orderId) {
      console.log("      Looking for existing webhook events...");
      console.log(
        "      (Make sure you have made at least one test purchase first)\n"
      );
    }

    const stormResponse = await axios.post(
      `${BASE_URL}/payment/replay-storm`,
      stormPayload,
      { headers: { "Content-Type": "application/json" } }
    );

    const result = stormResponse.data;

    // Step 2: Analyze results
    console.log(`[2/3] Replay storm completed in ${result.elapsedMs}ms`);
    console.log(`      Replays executed: ${result.replayCount}`);
    console.log(`      Concurrent: ${result.concurrent}`);
    console.log("");

    // Step 3: Report
    console.log("[3/3] IDEMPOTENCY CHECK RESULT:");
    console.log("      --------------------------");
    console.log(
      `      Order ID: ${result.subscriptionCheck?.orderId || "N/A"}`
    );
    console.log(
      `      Subscriptions created: ${result.subscriptionCheck?.subscriptionCount || 0}`
    );
    console.log("");

    if (result.subscriptionCheck?.passed) {
      console.log("  ✅ PASSED: Exactly 1 subscription was created!");
      console.log("     Your idempotency logic is working correctly.");
    } else {
      console.log(
        `  ❌ FAILED: ${result.subscriptionCheck?.subscriptionCount} subscriptions found!`
      );
      console.log("     Your idempotency logic needs improvement.");
      console.log("");
      console.log("     Possible issues:");
      console.log("     - Race condition in subscription check");
      console.log("     - Missing or incorrect cashfree_order_id check");
      console.log("     - Delay not sufficient to prevent duplicates");
    }

    console.log("\n=================================================");
    console.log("  Detailed Results:");
    console.log("=================================================");
    console.log(JSON.stringify(result.results, null, 2));

    console.log("\n=================================================\n");

    // Exit with appropriate code
    process.exit(result.subscriptionCheck?.passed ? 0 : 1);
  } catch (error) {
    if (error.response?.status === 403) {
      console.error("\n❌ ERROR: Replay endpoints are disabled!");
      console.error(
        "   Make sure to start the server with WEBHOOK_TESTING_ENABLED=true"
      );
      console.error("   Example: WEBHOOK_TESTING_ENABLED=true npm run dev");
    } else if (error.response?.status === 404) {
      console.error("\n❌ ERROR: No webhook events found!");
      console.error(
        "   Please make a test purchase first to generate a webhook event."
      );
      console.error(
        "   Alternatively, specify an order ID: node scripts/test-webhook-idempotency.js <orderId>"
      );
    } else {
      console.error("\n❌ ERROR:", error.response?.data || error.message);
    }
    process.exit(1);
  }
}

main();
