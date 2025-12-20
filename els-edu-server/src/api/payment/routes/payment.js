module.exports = {
  routes: [
    {
      method: "POST",
      path: "/payment/create-order",
      handler: "payment.createOrder",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/payment/webhook",
      handler: "payment.webhook",
      config: {
        auth: false, // Webhook doesn't require authentication
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/payment/order/:orderId",
      handler: "payment.getOrderStatus",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/payment/history",
      handler: "payment.getPurchaseHistory",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/payment/cancel",
      handler: "payment.cancelPayment",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/payment/resume",
      handler: "payment.resumePayment",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/payment/my-subscriptions",
      handler: "payment.mySubscriptions",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/payment/finalize-subscription",
      handler: "payment.finalizeSubscription",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
