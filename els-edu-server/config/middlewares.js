module.exports = [
  "strapi::logger",
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": [
            "'self'",
            "https:",
            "https://sandbox.cashfree.com",
            "https://api.cashfree.com",
          ],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "market-assets.strapi.io",
            "emeelanels.s3.us-east-1.amazonaws.com",
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            "market-assets.strapi.io",
            "emeelanels.s3.us-east-1.amazonaws.com",
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: "strapi::cors",
    config: {
      enabled: true,
      origin: "*", // Allow all origins
      headers: ["*"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    },
  },
  "strapi::poweredBy",
  "strapi::query",
  {
    name: "strapi::body",
    config: {
      includeUnparsed: true, // KEY: Preserves raw body for webhooks
      jsonLimit: "10mb", // JSON size limit
      formLimit: "56kb", // Form limit
      textLimit: "56kb", // Text limit
      multipart: true, // For file uploads (if needed)
      encoding: "utf-8",
    },
  },
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
