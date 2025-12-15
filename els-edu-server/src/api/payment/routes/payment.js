module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/payment/create-order',
      handler: 'payment.createOrder',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/payment/webhook',
      handler: 'payment.webhook',
      config: {
        auth: false, // Webhook doesn't require authentication
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/payment/order/:orderId',
      handler: 'payment.getOrder',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/payment/order/:orderId',
      handler: 'payment.getOrder',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/payment/finalize-subscription',
      handler: 'payment.finalizeSubscription',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/payment/subscribe-free',
      handler: 'payment.subscribeFree',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/payment/cancel-subscription',
      handler: 'payment.cancelSubscription',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/payment/my-subscriptions',
      handler: 'payment.mySubscriptions',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/payment/cancel',
      handler: 'payment.cancelPayment',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/payment/purchase-history',
      handler: 'payment.getPurchaseHistory',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/payment/test-payment-success',
      handler: 'payment.testPaymentSuccess',
      config: {
        auth: false, // Disable auth for testing
        policies: [],
        middlewares: [],
      },
    },
  ],
};
