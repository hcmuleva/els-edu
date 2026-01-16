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
      // Connected
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
    // Subscribed
  });

  // Subscribe to subscription update events
  channel.subscribe((message) => {
    callback(message.name, message.data);
  });

  // Return cleanup function
  return () => {
    channel.unsubscribe();
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
 * Subscribe to global course updates (for Browse Courses page)
 * This channel broadcasts when any course's subjects are modified.
 * @param {function} callback - Callback function(eventName, data)
 * @returns {function} Cleanup function to unsubscribe
 */
export const subscribeToGlobalCourseUpdates = (callback) => {
  const client = getAblyClient();

  if (!client) {
    console.warn("[ABLY] Client not initialized - using manual refresh only");
    return () => {};
  }

  const channelName = "global:courses";
  const channel = client.channels.get(channelName);

  channel.on("attached", () => {
    // Subscribed to global updates
  });

  channel.subscribe((message) => {
    callback(message.name, message.data);
  });

  return () => {
    channel.unsubscribe();
  };
};

/**
 * Subscribe to global custom course updates (for MongoDB Studio)
 * This channel broadcasts when custom courses are created, updated, or deleted.
 * @param {function} callback - Callback function(eventName, data)
 * @returns {function} Cleanup function to unsubscribe
 */
export const subscribeToCustomCourseUpdates = (callback) => {
  const client = getAblyClient();

  if (!client) {
    console.warn("[ABLY] Client not initialized - using manual refresh only");
    return () => {};
  }

  const channelName = "global:custom-courses";
  const channel = client.channels.get(channelName);

  // Create message handler
  const messageHandler = (message) => {
    console.log(
      "[ABLY] Custom course update received:",
      message.name,
      message.data
    );
    callback(message.name, message.data);
  };

  // Subscribe - this automatically attaches the channel if not already attached
  // Don't manually call attach() as it causes race conditions with React StrictMode
  channel.subscribe(messageHandler);

  // Optional: Log attachment (but don't manually attach)
  channel.on("attached", () => {
    console.log(
      "[ABLY] Attached to custom course updates channel:",
      channelName
    );
  });

  // Return cleanup function
  return () => {
    try {
      console.log("[ABLY] Unsubscribing from custom course updates");
      // Unsubscribe the specific handler
      channel.unsubscribe(messageHandler);
      // Don't manually detach - Ably will handle it automatically when no subscribers remain
    } catch (error) {
      // Ignore errors during cleanup (channel might already be detached/unsubscribed)
      // This is safe to ignore as it's just cleanup
    }
  };
};

/**
 * Subscribe to user-specific custom course updates (for org assignment section)
 * @param {string} userId - User document ID
 * @param {function} callback - Callback function(eventName, data)
 * @returns {function} Cleanup function to unsubscribe
 */
export const subscribeToUserCustomCourseUpdates = (userId, callback) => {
  const client = getAblyClient();

  if (!client) {
    console.warn("[ABLY] Client not initialized - using manual refresh only");
    return () => {};
  }

  const channelName = `user:${userId}:custom-courses`;
  const channel = client.channels.get(channelName);

  channel.on("attached", () => {
    // Subscribed to user custom course updates
  });

  channel.subscribe((message) => {
    callback(message.name, message.data);
  });

  return () => {
    channel.unsubscribe();
  };
};

/**
 * Subscribe to classroom updates (assignments, live status, etc.)
 * @param {string} orgId - Organization Document ID
 * @param {function} callback - Callback function(eventName, data)
 * @returns {function} Cleanup function to unsubscribe
 */
export const subscribeToClassroomUpdates = (orgId, callback) => {
  const client = getAblyClient();

  if (!client || !orgId) {
    return () => {};
  }

  // Subscribe to assignment updates for this org
  const assignmentChannelName = `classroom:${orgId}:assignments`;
  const assignmentChannel = client.channels.get(assignmentChannelName);

  // Subscribe to live class updates for this org
  const updatesChannelName = `classroom:${orgId}:updates`;
  const updatesChannel = client.channels.get(updatesChannelName);

  const handler = (message) => {
    callback(message.name, message.data);
  };

  assignmentChannel.subscribe(handler);
  updatesChannel.subscribe(handler);

  return () => {
    assignmentChannel.unsubscribe(handler);
    updatesChannel.unsubscribe(handler);
  };
};

/**
 * Subscribe to user notifications
 * @param {string} orgId - Organization Document ID
 * @param {string} userId - User Document ID
 * @param {function} callback - Callback function(eventName, data)
 * @returns {function} Cleanup function to unsubscribe
 */
export const subscribeToUserNotifications = (orgId, userId, callback) => {
  const client = getAblyClient();

  if (!client || !orgId || !userId) {
    return () => {};
  }

  const channelName = `notification:${orgId}:${userId}`;
  const channel = client.channels.get(channelName);

  const handler = (message) => {
    callback(message.name, message.data);
  };

  channel.subscribe(handler);

  return () => {
    channel.unsubscribe(handler);
  };
};

/**
 * Close Ably connection
 */
export const closeAblyConnection = () => {
  if (ablyClient) {
    ablyClient.close();
    ablyClient = null;
  }
};

export default {
  getAblyClient,
  subscribeToSubscriptionUpdates,
  subscribeToProgressUpdates,
  subscribeToGlobalCourseUpdates,
  subscribeToCustomCourseUpdates,
  subscribeToUserCustomCourseUpdates,
  subscribeToClassroomUpdates,
  subscribeToUserNotifications,
  closeAblyConnection,
};
