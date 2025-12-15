const axios = require('axios');
const crypto = require('crypto');

/**
 * Cashfree Payment Gateway Service
 * Handles order creation, webhook verification, and payment status checks
 */
module.exports = ({ strapi }) => {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const env = process.env.CASHFREE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
  
  const apiBase = env === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
    
  const apiVersion = '2025-01-01';

  // Validate credentials
  if (!appId || !secretKey) {
    strapi.log.error('❌ Cashfree credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env');
  }

  // Production environment validation
  if (env === 'production') {
    const frontendUrl = process.env.FRONTEND_URL;
    const backendUrl = process.env.BACKEND_URL;
    
    if (!frontendUrl || frontendUrl.includes('localhost')) {
      strapi.log.error('❌ PRODUCTION MODE: FRONTEND_URL must be set to a production URL (not localhost)');
      // throw new Error('Invalid FRONTEND_URL for production environment'); // Don't throw here to avoid crashing server boot
    }
    
    if (!backendUrl || backendUrl.includes('localhost')) {
      strapi.log.error('❌ PRODUCTION MODE: BACKEND_URL must be set to a production URL (not localhost)');
      // throw new Error('Invalid BACKEND_URL for production environment');
    }
    
    strapi.log.info('✅ Cashfree initialized in PRODUCTION mode');
    strapi.log.info(`   API Base: ${apiBase}`);
    strapi.log.info(`   Frontend URL: ${frontendUrl}`);
    strapi.log.info(`   Backend URL: ${backendUrl}`);
  } else {
    strapi.log.info('ℹ️  Cashfree initialized in SANDBOX mode');
    strapi.log.info(`   API Base: ${apiBase}`);
  }

  const getHeaders = () => {
    return {
      'x-api-version': apiVersion,
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'Content-Type': 'application/json'
    };
  };

  return {
    /**
     * Create a payment order
     */
    async createOrder({ amount, currency = 'INR', customerId, customerDetails, orderMeta }) {
      try {
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        const request = {
          order_id: orderId,
          order_amount: parseFloat(amount),
          order_currency: currency,
          customer_details: {
            customer_id: customerId.toString(),
            customer_name: customerDetails.name || customerDetails.username,
            customer_email: customerDetails.email,
            customer_phone: customerDetails.phone || '9999999999',
          },
          order_meta: {
            return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/els/payment-success?order_id=${orderId}`,
            notify_url: `${process.env.BACKEND_URL || 'http://localhost:1337'}/api/payment/webhook`,
            ...orderMeta
          }
        };

        strapi.log.info('Creating Cashfree order:', { orderId, amount, customerId });
        
        const response = await axios.post(
          `${apiBase}/orders`, 
          request, 
          { headers: getHeaders() }
        );
        
        strapi.log.info('Cashfree order created successfully:', response.data);
        
        return {
          orderId: response.data.order_id,
          paymentSessionId: response.data.payment_session_id,
          orderToken: response.data.order_token,
          cf_order_id: response.data.cf_order_id
        };
      } catch (error) {
        strapi.log.error('Error creating Cashfree order:', error.response?.data || error.message);
        throw new Error(`Failed to create payment order: ${JSON.stringify(error.response?.data || error.message)}`);
      }
    },

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(signature, timestamp, rawBody) {
      try {
        if (!signature || !timestamp || !rawBody) {
          strapi.log.error('Missing signature, timestamp, or rawBody for verification');
          return false;
        }

        // NO DOT: Matches manual code sample and test tool behavior
        const signedPayload = `${timestamp}${rawBody}`;
        
        const expectedSignature = crypto
          .createHmac('sha256', secretKey)
          .update(signedPayload)
          .digest('base64');
        
        const isValid = signature === expectedSignature;
        if (!isValid) {
          strapi.log.error('Webhook signature mismatch');
        }
        return isValid;
      } catch (error) {
        strapi.log.error('Error verifying webhook signature:', error.message);
        return false;
      }
    },

    /**
     * Get order details
     */
    async getOrder(orderId) {
      try {
        const response = await axios.get(
          `${apiBase}/orders/${orderId}`,
          { headers: getHeaders() }
        );
        return response.data;
      } catch (error) {
        strapi.log.error('Cashfree getOrder error:', error.response?.data || error.message);
        throw error;
      }
    },

    /**
     * Get order status from Cashfree
     */
    async getOrderStatus(orderId) {
      try {
        strapi.log.info('Fetching order status from Cashfree:', orderId);
        
        // Fetch order details
        const orderResp = await axios.get(
          `${apiBase}/orders/${encodeURIComponent(orderId)}`, 
          { headers: getHeaders() }
        );
        
        // Fetch payments for the order
        const paymentsResp = await axios.get(
          `${apiBase}/orders/${encodeURIComponent(orderId)}/payments`, 
          { headers: getHeaders() }
        );
        
        return {
          order: orderResp.data,
          payments: paymentsResp.data
        };
      } catch (error) {
        strapi.log.error('Error fetching order status:', error.response?.data || error.message);
        throw new Error(`Failed to fetch order status: ${JSON.stringify(error.response?.data || error.message)}`);
      }
    },

    /**
     * Calculate final price with discount
     */
    calculateFinalPrice(pricing, kit = null) {
      const now = new Date();
      let finalAmount = parseFloat(pricing.amount);
      let appliedOffer = null;

      // 1. Check for Kit Offers (Priority)
      if (kit && kit.offers && Array.isArray(kit.offers)) {
        const activeOffers = kit.offers.filter(offer => {
        if (!offer.is_active) return false;
        const start = new Date(offer.start_date);
        const end = new Date(offer.end_date);
        
        // Date check
        if (now < start || now > end) return false;

        // Pricing check: If offer is restricted to specific pricings, check if current pricing is included
        if (offer.pricings && offer.pricings.length > 0) {
          const isApplicable = offer.pricings.some(p => p.documentId === pricing.documentId);
          if (!isApplicable) return false;
        }

        return true;
      });

        if (activeOffers.length > 0) {
          // Find the best offer (lowest price)
          let bestPrice = finalAmount;

          activeOffers.forEach(offer => {
            let currentOfferPrice = finalAmount;
            if (offer.discount_type === 'PERCENTAGE') {
              const discountAmount = finalAmount * (parseFloat(offer.discount_value) / 100);
              currentOfferPrice = finalAmount - discountAmount;
            } else if (offer.discount_type === 'FIXED') {
              currentOfferPrice = finalAmount - parseFloat(offer.discount_value);
            }

            // Ensure price doesn't go below 0
            if (currentOfferPrice < 0) currentOfferPrice = 0;

            if (currentOfferPrice < bestPrice) {
              bestPrice = currentOfferPrice;
              appliedOffer = offer;
            }
          });

          if (appliedOffer) {
            strapi.log.info(`Applying Kit Offer: ${appliedOffer.name} (Type: ${appliedOffer.discount_type}, Value: ${appliedOffer.discount_value})`);
            return bestPrice;
          }
        }
      }

      // 2. Fallback to Pricing Plan Discount
      const hasActivePricingDiscount = 
        pricing.discount_percent > 0 && 
        pricing.discount_valid_until &&
        new Date(pricing.discount_valid_until) > now;
      
      if (hasActivePricingDiscount) {
        const discountAmount = parseFloat(pricing.amount) * (parseFloat(pricing.discount_percent) / 100);
        strapi.log.info(`Applying Pricing Discount: ${pricing.discount_percent}%`);
        return parseFloat(pricing.amount) - discountAmount;
      }
      
      return finalAmount;
    }
  };
};
