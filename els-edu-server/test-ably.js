/**
 * Test Ably Connection
 * Run this to verify Ably Realtime connection works
 */

const Ably = require("ably");
require("dotenv").config();

async function testAblyConnection() {
  console.log("🧪 Testing Ably Realtime connection...\n");

  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey) {
    console.error("❌ ABLY_API_KEY not found in .env file");
    process.exit(1);
  }

  console.log("✅ API Key found:", apiKey.substring(0, 20) + "...");

  const client = new Ably.Realtime({
    key: apiKey,
    clientId: "test-client",
    // Use TLS with standard port
    tls: true,
    // Don't specify environment - let Ably auto-detect from key
  });

  return new Promise((resolve, reject) => {
    // Set timeout
    const timeout = setTimeout(() => {
      console.error("\n❌ Connection timeout after 10 seconds");
      console.log("\nPossible issues:");
      console.log("- Firewall blocking WebSocket connections");
      console.log("- Internet connection issues");
      console.log("- Invalid API key");
      client.close();
      process.exit(1);
    }, 10000);

    client.connection.on("connecting", () => {
      console.log("🔄 Connecting to Ably...");
    });

    client.connection.on("connected", async () => {
      clearTimeout(timeout);
      console.log("\n✅ Successfully connected to Ably!");
      console.log("   Connection ID:", client.connection.id);
      console.log("   State:", client.connection.state);

      // Test publishing
      console.log("\n🧪 Testing channel publish...");
      const channel = client.channels.get("test-channel");

      await channel.publish("test-event", {
        message: "Hello from test script!",
      });
      console.log("✅ Message published successfully");

      console.log("\n✅ All tests passed! Ably Realtime is working correctly.");
      console.log("\nYou can now use Ably in your application.");

      client.close();
      process.exit(0);
    });

    client.connection.on("disconnected", () => {
      console.log("⚠️ Disconnected from Ably");
    });

    client.connection.on("suspended", () => {
      console.log("⚠️ Connection suspended");
    });

    client.connection.on("failed", (stateChange) => {
      clearTimeout(timeout);
      console.error("\n❌ Connection failed:", stateChange.reason);
      console.log("\nPossible issues:");
      console.log("- Invalid API key");
      console.log("- API key lacks required capabilities (publish, subscribe)");
      console.log("- Network/firewall issues");
      client.close();
      process.exit(1);
    });

    client.connection.on("closed", () => {
      console.log("ℹ️ Connection closed");
    });
  });
}

testAblyConnection().catch((error) => {
  console.error("\n❌ Test failed:", error);
  process.exit(1);
});
