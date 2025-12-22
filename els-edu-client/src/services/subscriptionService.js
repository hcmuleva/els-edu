import api from "./api";

/**
 * Subscription Service - Reusable service for managing user subscriptions
 *
 * This service handles all subscription-related operations using react-admin patterns.
 * Can be extended for payment integration in the future.
 *
 * Usage:
 *   import { subscriptionService } from '../services/subscriptionService';
 *
 *   // Create a subscription
 *   await subscriptionService.createSubscription(dataProvider, {
 *     userDocumentId: 'xxx',
 *     courseDocumentId: 'yyy',
 *     orgDocumentId: 'zzz',
 *     subscriptionType: 'FREE', // FREE | FREEMIUM | PAID | TRIAL
 *   });
 */

/**
 * Creates a new user subscription with course and its subjects
 *
 * @param {Object} dataProvider - React Admin dataProvider
 * @param {Object} options - Subscription options
 * @param {string} options.userDocumentId - User document ID
 * @param {string} options.courseDocumentId - Course document ID
 * @param {string} options.orgDocumentId - Organization document ID
 * @param {string} options.subscriptionType - FREE | FREEMIUM | PAID | TRIAL
 * @param {string} options.paymentStatus - ACTIVE | PENDING | EXPIRED | CANCELLED | FAILED
 * @returns {Promise<Object>} Created subscription
 */
export const createSubscription = async (
  dataProvider,
  {
    userDocumentId,
    courseDocumentId,
    orgDocumentId,
    subscriptionType = "FREE",
    paymentStatus = "ACTIVE",
    subjectDocumentIds = null, // Optional: pass specific subjects (single subject purchase)
  }
) => {
  let subjectDocIds = subjectDocumentIds;

  // If no specific subjects provided, fetch all subjects from the course
  if (!subjectDocIds) {
    const { data: course } = await dataProvider.getOne("courses", {
      id: courseDocumentId,
      meta: {
        populate: {
          subjects: {
            fields: ["documentId", "id", "name"],
          },
        },
      },
    });
    subjectDocIds = (course.subjects || []).map((s) => s.documentId);
  }

  // Create the subscription
  const { data: subscription } = await dataProvider.create(
    "usersubscriptions",
    {
      data: {
        user: userDocumentId,
        course: courseDocumentId,
        org: orgDocumentId,
        subscription_type: subscriptionType,
        paymentstatus: paymentStatus,
        startdate: new Date().toISOString().split("T")[0],
        auto_renew: false,
        subjects: subjectDocIds,
      },
    }
  );

  return subscription;
};

/**
 * Deletes a user subscription
 *
 * @param {Object} dataProvider - React Admin dataProvider
 * @param {string} subscriptionDocumentId - Subscription document ID
 * @returns {Promise<void>}
 */
export const deleteSubscription = async (
  dataProvider,
  subscriptionDocumentId
) => {
  await dataProvider.delete("usersubscriptions", {
    id: subscriptionDocumentId,
  });
};

/**
 * Update subscription subjects (for adding/merging subjects)
 *
 * @param {Object} dataProvider - React Admin dataProvider
 * @param {string} subscriptionDocumentId - Subscription document ID
 * @param {Array<string>} subjectDocumentIds - Array of subject document IDs to set
 * @returns {Promise<Object>} Updated subscription
 */
export const updateSubscriptionSubjects = async (
  dataProvider,
  subscriptionDocumentId,
  subjectDocumentIds
) => {
  const { data: updated } = await dataProvider.update("usersubscriptions", {
    id: subscriptionDocumentId,
    data: {
      subjects: subjectDocumentIds,
    },
  });
  return updated;
};

/**
 * Get all subscriptions for a user
 *
 * @param {Object} dataProvider - React Admin dataProvider
 * @param {string} userDocumentId - User document ID
 * @returns {Promise<Array>} Array of subscriptions with course data
 */
export const getUserSubscriptions = async (dataProvider, userDocumentId) => {
  const { data } = await dataProvider.getList("usersubscriptions", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "createdAt", order: "DESC" },
    filter: {
      "user[documentId]": userDocumentId,
    },
    meta: {
      populate: {
        course: {
          populate: ["cover", "subjects"],
        },
        subjects: {
          fields: ["documentId", "id", "name", "grade", "level"],
          populate: ["coverpage"],
        },
        org: {
          fields: ["documentId", "org_name"],
        },
      },
    },
  });

  return data || [];
};

/**
 * Get subscription by course for a user
 *
 * @param {Object} dataProvider - React Admin dataProvider
 * @param {string} userDocumentId - User document ID
 * @param {string} courseDocumentId - Course document ID
 * @returns {Promise<Object|null>} Subscription or null
 */
export const getSubscriptionByCourse = async (
  dataProvider,
  userDocumentId,
  courseDocumentId
) => {
  const { data } = await dataProvider.getList("usersubscriptions", {
    pagination: { page: 1, perPage: 1 },
    filter: {
      "user[documentId]": userDocumentId,
      "course[documentId]": courseDocumentId,
    },
    meta: {
      populate: {
        course: {
          populate: ["cover", "subjects"],
        },
        subjects: {
          fields: ["documentId", "id", "name", "grade", "level"],
          populate: ["coverpage", "topics", "quizzes"],
        },
      },
    },
  });

  return data?.[0] || null;
};

/**
 * Check if user has subscription to a course
 *
 * @param {Object} dataProvider - React Admin dataProvider
 * @param {string} userDocumentId - User document ID
 * @param {string} courseDocumentId - Course document ID
 * @returns {Promise<boolean>}
 */
export const hasSubscription = async (
  dataProvider,
  userDocumentId,
  courseDocumentId
) => {
  const subscription = await getSubscriptionByCourse(
    dataProvider,
    userDocumentId,
    courseDocumentId
  );
  return !!subscription && subscription.paymentstatus === "ACTIVE";
};

/**
 * Update subscription (for future payment/status updates)
 *
 * @param {Object} dataProvider - React Admin dataProvider
 * @param {string} subscriptionDocumentId - Subscription document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated subscription
 */
export const updateSubscription = async (
  dataProvider,
  subscriptionDocumentId,
  updates
) => {
  const { data } = await dataProvider.update("usersubscriptions", {
    id: subscriptionDocumentId,
    data: updates,
  });
  return data;
};

/**
 * Sync subscriptions for a user - updates assigned courses
 * Creates new subscriptions for new courses, deletes removed ones
 *
 * @param {Object} dataProvider - React Admin dataProvider
 * @param {string} userDocumentId - User document ID
 * @param {string} orgDocumentId - Organization document ID
 * @param {Array} assignedCourses - Array of course objects with documentId
 * @returns {Promise<{created: number, deleted: number}>}
 */
export const syncUserSubscriptions = async (
  dataProvider,
  userDocumentId,
  orgDocumentId,
  assignedCourses
) => {
  // Get current subscriptions
  const currentSubs = await getUserSubscriptions(dataProvider, userDocumentId);
  const currentCourseIds = new Set(
    currentSubs.map((s) => s.course?.documentId).filter(Boolean)
  );
  const newCourseIds = new Set(assignedCourses.map((c) => c.documentId));

  let created = 0;
  let deleted = 0;

  // Delete removed subscriptions
  for (const sub of currentSubs) {
    if (sub.course?.documentId && !newCourseIds.has(sub.course.documentId)) {
      await deleteSubscription(dataProvider, sub.documentId);
      deleted++;
    }
  }

  // Create new subscriptions
  for (const course of assignedCourses) {
    if (!currentCourseIds.has(course.documentId)) {
      await createSubscription(dataProvider, {
        userDocumentId,
        courseDocumentId: course.documentId,
        orgDocumentId,
        subscriptionType: "FREE",
        paymentStatus: "ACTIVE",
      });
      created++;
    }
  }

  return { created, deleted };
};

/**
 * Initiate payment and handle Cashfree checkout
 *
 * @param {string} _authToken - Deprecated, handled by api.js
 * @param {Object} paymentData - { coursePricingId, subjectPricingId, type }
 * @returns {Promise<void>}
 */
export const initiatePayment = async (
  _authToken,
  { coursePricingId, subjectPricingId, type }
) => {
  try {
    const response = await api.post("/payment/create-order", {
      coursePricingId,
      subjectPricingId,
      type,
    });

    const data = response.data;

    // Axios throws on 4xx/5xx, so we don't need !response.ok check here usually,
    // unless the server returns 200 with success: false
    if (!data) {
      throw new Error("Failed to create order");
    }

    if (data.success && data.paymentSessionId) {
      const cashfree = await loadCashfree();
      if (!cashfree) throw new Error("Cashfree SDK failed to load");

      // Get the base URL including any app path (e.g., /els-kids)
      const basePath = window.location.pathname
        .split("#")[0]
        .replace(/\/$/, "");
      const baseUrl = `${window.location.origin}${basePath}`;

      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        returnUrl: `${baseUrl}/#/payment/status?order_id=${data.orderId}`,
        redirectTarget: "_self", // Use _self for full-page redirect to ensure returnUrl works
      });
    } else {
      throw new Error("Invalid payment session received");
    }
  } catch (error) {
    console.error("Payment initiation failed:", error);
    // Extract error message from axios error object
    throw error.response?.data?.message || error.message || error;
  }
};

// Helper to load Cashfree
const loadCashfree = async () => {
  if (window.Cashfree) {
    return new window.Cashfree({
      mode: import.meta.env.VITE_CASHFREE_ENV || "production",
    });
  }
  // Retry or wait logic could be added here if script loads async slow
  return null;
};

/**
 * Get payment order status
 * @param {string} _authToken - Deprecated
 * @param {string} orderId
 * @returns
 */
export const getOrderStatus = async (_authToken, orderId) => {
  const response = await api.get(`/payment/order/${orderId}`);
  return response.data;
};

/**
 * Get purchase history
 * @param {string} _authToken - Deprecated
 * @returns
 */
export const getPurchaseHistory = async (_authToken) => {
  const response = await api.get("/payment/history");
  return response.data;
};

/**
 * Cancel a pending payment
 * @param {string} _authToken - Deprecated
 * @param {string} orderId
 * @returns
 */
export const cancelPayment = async (_authToken, orderId) => {
  const response = await api.post("/payment/cancel", { orderId });
  return response.data;
};

/**
 * Get pending payments (helper)
 * @param {string} authToken
 * @returns {Promise<Array>}
 */
export const getPendingPayments = async (authToken) => {
  const history = await getPurchaseHistory(authToken);
  const data = history.data || [];
  return data.filter(
    (p) =>
      p.payments?.some((pay) => pay.payment_status === "PENDING") ||
      p.invoice_status === "PENDING"
  );
};

/**
 * Resume/Retry a payment
 * @param {string} _authToken - Deprecated
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export const resumePayment = async (_authToken, orderId) => {
  const response = await api.post("/payment/resume", { orderId });
  return response.data;
};

/**
 * Handle Cashfree Checkout directly with session ID
 * @param {string} paymentSessionId
 * @param {string} orderId
 */
export const checkout = async (paymentSessionId, orderId) => {
  const cashfree = await loadCashfree();
  if (!cashfree) throw new Error("Cashfree SDK failed to load");

  // Get the base URL including any app path (e.g., /els-kids)
  const basePath = window.location.pathname.split("#")[0].replace(/\/$/, "");
  const baseUrl = `${window.location.origin}${basePath}`;

  await cashfree.checkout({
    paymentSessionId: paymentSessionId,
    returnUrl: `${baseUrl}/#/payment/status?order_id=${orderId}`,
    redirectTarget: "_self", // Use _self for full-page redirect
  });
};

/**
 * Finalize subscription after successful payment (Client backup)
 * @param {string} _authToken - Deprecated
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export const finalizeSubscription = async (_authToken, orderId) => {
  const response = await api.post("/payment/finalize-subscription", {
    orderId,
  });
  return response.data;
};

// Export as service object for convenience
export const subscriptionService = {
  createSubscription,
  deleteSubscription,
  getUserSubscriptions,
  getSubscriptionByCourse,
  hasSubscription,
  updateSubscription,
  updateSubscriptionSubjects,
  syncUserSubscriptions,
  initiatePayment,
  checkout,
  getOrderStatus,
  getPurchaseHistory,
  cancelPayment,
  getPendingPayments,
  resumePayment,
  finalizeSubscription,
};

export default subscriptionService;
