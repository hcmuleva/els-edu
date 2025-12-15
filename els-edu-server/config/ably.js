const Ably = require("ably");

let ablyClient = null;

const getAblyClient = () => {
  if (!ablyClient) {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) {
      console.error(
        "❌ [ABLY] ABLY_API_KEY not found in environment variables"
      );
      return null;
    }

    // Disable SSL verification in development to avoid certificate errors
    if (process.env.NODE_ENV !== "production") {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    // Use REST client for simple HTTP-based pub/sub
    ablyClient = new Ably.Rest({
      key: apiKey,
      logLevel: 1, // Errors only (0=none, 1=errors, 2=warnings, 3=info, 4=verbose)
    });

    console.log("✅ [ABLY] REST client initialized");
  }
  return ablyClient;
};

const publishToAbly = async (channelName, eventName, data) => {
  try {
    const client = getAblyClient();
    if (!client) {
      console.error(
        "❌ [ABLY] Client not initialized, skipping publish (non-blocking)"
      );
      return;
    }

    const channel = client.channels.get(channelName);
    await channel.publish(eventName, data);

    // Only log on success in verbose mode; silent otherwise to reduce noise
    // console.log(`✅ [ABLY] Published: ${channelName}/${eventName}`);
  } catch (error) {
    // Parse Ably ErrorInfo: code, statusCode, href
    const errorCode = error.code || "N/A";
    const statusCode = error.statusCode || error.status || "N/A";
    const errorHref = error.href || "";
    console.error(
      `❌ [ABLY] Publish failed [code:${errorCode} status:${statusCode}]: ${error.message}${errorHref ? " | " + errorHref : ""}`
    );
    // Non-blocking - client will poll/refresh instead
  }
};

module.exports = {
  getAblyClient,
  publishToAbly,
};
