/**
 * Ably Realtime (WebSocket) Configuration for Backend
 *
 * This is an ALTERNATIVE to ably.js (REST/HTTP approach)
 *
 * Use this file when:
 * - You have unrestricted WebSocket access
 * - You need bidirectional real-time communication
 * - You want lower latency than HTTP polling
 *
 * To switch from REST to Realtime:
 * 1. Copy this file content to config/ably.js
 * 2. Restart Strapi server
 * 3. No frontend changes needed - client already uses Realtime
 */

const Ably = require("ably");

let realtimeClient = null;

/**
 * Initialize Ably Realtime client (persistent WebSocket connection)
 * This maintains a persistent connection to Ably's servers
 */
const getAblyRealtimeClient = () => {
  if (!realtimeClient) {
    const apiKey = process.env.ABLY_API_KEY;

    if (!apiKey) {
      throw new Error("ABLY_API_KEY environment variable is not set");
    }

    console.log("🔵 [ABLY-REALTIME] Initializing Ably Realtime client...");

    // Create Realtime client with WebSocket support
    realtimeClient = new Ably.Realtime({
      key: apiKey,
      // Auto-reconnect on connection loss
      autoConnect: true,
      // Disconnect after 30 seconds of inactivity
      disconnectedRetryTimeout: 15000,
      // Suspend after 2 minutes of disconnection
      suspendedRetryTimeout: 30000,
      // Enable connection state recovery
      recover: true,
      // Log connection state changes
      logLevel: strapi.config.environment === "development" ? 2 : 0, // 2 = info, 0 = error only
    });

    // Monitor connection state
    realtimeClient.connection.on("connected", () => {
      console.log("✅ [ABLY-REALTIME] Connected to Ably via WebSocket");
    });

    realtimeClient.connection.on("disconnected", () => {
      console.warn("⚠️ [ABLY-REALTIME] Disconnected from Ably");
    });

    realtimeClient.connection.on("suspended", () => {
      console.error("❌ [ABLY-REALTIME] Connection suspended");
    });

    realtimeClient.connection.on("failed", (error) => {
      console.error("❌ [ABLY-REALTIME] Connection failed:", error);
    });

    console.log("✅ [ABLY-REALTIME] Realtime client initialized successfully");
  }

  return realtimeClient;
};

/**
 * Publish message to Ably channel using Realtime (WebSocket)
 *
 * @param {string} channelName - Channel name (e.g., "user:123:progress")
 * @param {string} eventName - Event name (e.g., "lesson-completed")
 * @param {object} data - Event data
 */
const publishToAbly = async (channelName, eventName, data) => {
  try {
    console.log("🔵 [ABLY-REALTIME] ======== PUBLISH START ========");
    console.log("🔵 [ABLY-REALTIME] Channel:", channelName);
    console.log("🔵 [ABLY-REALTIME] Event:", eventName);
    console.log("🔵 [ABLY-REALTIME] Data:", JSON.stringify(data, null, 2));

    const client = getAblyRealtimeClient();
    const channel = client.channels.get(channelName);

    // Wait for connection if not connected
    if (client.connection.state !== "connected") {
      console.log(
        "🔵 [ABLY-REALTIME] Waiting for connection... Current state:",
        client.connection.state
      );
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 5000);

        client.connection.once("connected", () => {
          clearTimeout(timeout);
          resolve();
        });

        client.connection.once("failed", (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    }

    // Publish message via WebSocket
    await channel.publish(eventName, data);

    console.log(
      `✅ [ABLY-REALTIME] Successfully published to: ${channelName}/${eventName}`
    );
    console.log("✅ [ABLY-REALTIME] Published data summary:", {
      userId: data.userId,
      type: data.type,
      timestamp: data.timestamp,
    });
    console.log("✅ [ABLY-REALTIME] ======== PUBLISH END ========");
  } catch (error) {
    console.error("❌ [ABLY-REALTIME] Publish error:", error);
    throw error;
  }
};

/**
 * Close Ably Realtime connection
 * Call this during server shutdown
 */
const closeAblyConnection = async () => {
  if (realtimeClient) {
    console.log("🔵 [ABLY-REALTIME] Closing Ably connection...");
    await realtimeClient.close();
    realtimeClient = null;
    console.log("✅ [ABLY-REALTIME] Connection closed");
  }
};

module.exports = {
  getAblyRealtimeClient,
  publishToAbly,
  closeAblyConnection,
};
