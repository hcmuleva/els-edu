/**
 * Ably Client for Real-time Updates
 *
 * Handles real-time subscriptions to progress and subscription updates
 * via Ably pub/sub channels
 */

import * as Ably from "ably";

let ablyClient = null;

/**
 * Initialize and get Ably client instance
 */
export const getAblyClient = () => {
  if (!ablyClient) {
    const apiKey = import.meta.env.VITE_ABLY_API_KEY;

    if (!apiKey) {
      console.warn(
        "⚠️ [ABLY] VITE_ABLY_API_KEY not found - real-time updates disabled"
      );
      return null;
    }

    // Get clientId from localStorage if user is logged in
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const clientId = user.documentId || `client-${Date.now()}`;

    ablyClient = new Ably.Realtime({
      key: apiKey,
      clientId: clientId,
      echoMessages: false,
      log: { level: 1 }, // Errors only
      autoConnect: true,
    });

    ablyClient.connection.on("connected", () => {
      console.log("✅ [ABLY] Connected:", ablyClient.connection.id);
    });

    ablyClient.connection.on("failed", (error) => {
      console.error("❌ [ABLY] Connection failed:", error);
    });
  }

  return ablyClient;
};

/**
 * Subscribe to user subscription updates (course subjects changes)
 * @param {string} userId - User document ID
 * @param {function} callback - Callback function(eventName, data)
 * @returns {function} Cleanup function to unsubscribe
 */
export const subscribeToSubscriptionUpdates = (userId, callback) => {
  const client = getAblyClient();

  if (!client) {
    console.warn("[ABLY] Client not initialized - using manual refresh only");
    return () => {}; // Return no-op cleanup
  }

  const channelName = `user:${userId}:subscriptions`;
  const channel = client.channels.get(channelName);

  channel.on("attached", () => {
    console.log("✅ [ABLY] Subscribed to subscription updates:", channelName);
  });

  // Subscribe to subscription update events
  channel.subscribe((message) => {
    console.log("📡 [ABLY] Subscription update received:", message.name);
    callback(message.name, message.data);
  });

  // Return cleanup function
  return () => {
    channel.unsubscribe();
    console.log("[ABLY] Unsubscribed from:", channelName);
  };
};

/**
 * Subscribe to user progress updates
 * @param {string} userId - User document ID
 * @param {function} callback - Callback function(eventName, data)
 * @returns {function} Cleanup function to unsubscribe
 */
export const subscribeToProgressUpdates = (userId, callback) => {
  const client = getAblyClient();

  if (!client) {
    return () => {};
  }

  const channelName = `user:${userId}:progress`;
  const channel = client.channels.get(channelName);

  channel.subscribe((message) => {
    callback(message.name, message.data);
  });

  return () => {
    channel.unsubscribe();
  };
};

/**
 * Close Ably connection
 */
export const closeAblyConnection = () => {
  if (ablyClient) {
    ablyClient.close();
    ablyClient = null;
    console.log("[ABLY] Connection closed");
  }
};

export default {
  getAblyClient,
  subscribeToSubscriptionUpdates,
  subscribeToProgressUpdates,
  closeAblyConnection,
};
