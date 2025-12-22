#!/usr/bin/env node
/**
 * cleanup-test-subscriptions.js
 *
 * Cleans up test data via API calls (no direct Strapi access needed).
 *
 * Usage:
 *   node scripts/cleanup-test-subscriptions.js [--dry-run]
 *
 * Options:
 *   --dry-run: Only show what would be deleted, don't actually delete
 *
 * NOTE: Server must be running with WEBHOOK_TESTING_ENABLED=true
 */

const axios = require("axios");

const BASE_URL = process.env.API_URL || "http://localhost:1337/api";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

async function cleanup() {
  console.log("\n=================================================");
  console.log("  CLEANUP TEST SUBSCRIPTIONS");
  console.log("=================================================\n");

  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No data will be deleted\n");
  }

  try {
    // Step 1: Get all subscriptions
    console.log("[1/3] Fetching subscriptions...");

    const subsResponse = await axios.get(
      `${BASE_URL}/usersubscriptions?pagination[limit]=1000`
    );
    const allSubscriptions = subsResponse.data?.data || [];

    // Filter for test subscriptions (those with REPLAY, TEST, or MOCK in order ID)
    const testSubscriptions = allSubscriptions.filter((sub) => {
      const orderId = sub.cashfree_order_id || "";
      return (
        orderId.includes("REPLAY") ||
        orderId.includes("TEST") ||
        orderId.includes("MOCK")
      );
    });

    console.log(`   Found ${allSubscriptions.length} total subscriptions`);
    console.log(
      `   Found ${testSubscriptions.length} test subscriptions to cleanup`
    );

    if (testSubscriptions.length > 0) {
      console.log("\n   Test subscription order IDs:");
      testSubscriptions.slice(0, 10).forEach((sub) => {
        console.log(`     - ${sub.cashfree_order_id} (${sub.documentId})`);
      });
      if (testSubscriptions.length > 10) {
        console.log(`     ... and ${testSubscriptions.length - 10} more`);
      }
    }

    // Step 2: Delete test subscriptions
    if (!dryRun && testSubscriptions.length > 0) {
      console.log("\n[2/3] Deleting test subscriptions...");
      for (const sub of testSubscriptions) {
        try {
          await axios.delete(`${BASE_URL}/usersubscriptions/${sub.documentId}`);
          console.log(`   Deleted: ${sub.documentId}`);
        } catch (err) {
          console.log(
            `   Failed to delete ${sub.documentId}: ${err.response?.status || err.message}`
          );
        }
      }
      console.log(
        `   ✓ Attempted to delete ${testSubscriptions.length} test subscriptions`
      );
    } else if (dryRun) {
      console.log("\n[2/3] Would delete test subscriptions (dry run)");
    } else {
      console.log("\n[2/3] No test subscriptions to delete");
    }

    // Step 3: Get webhook events count
    console.log("\n[3/3] Checking webhook events...");
    try {
      const eventsResponse = await axios.get(
        `${BASE_URL}/webhook-events?pagination[limit]=1`
      );
      const total = eventsResponse.data?.meta?.pagination?.total || 0;
      console.log(`   Found ${total} webhook events`);
      console.log(
        "   To delete webhook events, use Strapi Admin > Content Manager > Webhook Events"
      );
    } catch (e) {
      console.log(
        "   Could not fetch webhook events (may need authentication)"
      );
    }

    console.log("\n=================================================");
    if (dryRun) {
      console.log("  DRY RUN COMPLETE - No changes made");
    } else {
      console.log("  CLEANUP COMPLETE");
    }
    console.log("=================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERROR:", error.response?.data || error.message);
    process.exit(1);
  }
}

cleanup();
