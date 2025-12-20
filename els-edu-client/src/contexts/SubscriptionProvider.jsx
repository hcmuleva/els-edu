/**
 * SubscriptionProvider - Context for managing user course subscriptions
 *
 * This is a reference provider structure that can be extended for:
 * - Progress tracking
 * - Payment integration
 * - Access control
 *
 * Currently provides basic subscription data access.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useDataProvider, useGetIdentity } from "react-admin";
import { subscriptionService } from "../services/subscriptionService";

const SubscriptionContext = createContext(null);

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
};

export const SubscriptionProvider = ({ children }) => {
  const dataProvider = useDataProvider();
  const { data: identity } = useGetIdentity();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user subscriptions
  const refresh = useCallback(async () => {
    if (!identity?.documentId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await subscriptionService.getUserSubscriptions(
        dataProvider,
        identity.documentId
      );
      setSubscriptions(data);
    } catch (e) {
      console.error("SubscriptionProvider refresh error:", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [dataProvider, identity?.documentId]);

  // Load subscriptions when identity is available
  useEffect(() => {
    if (identity?.documentId) {
      refresh();
    }
  }, [identity?.documentId, refresh]);

  // Check if user has subscription to a course
  const hasSubscription = useCallback(
    (courseDocumentId) => {
      return subscriptions.some(
        (s) =>
          s.course?.documentId === courseDocumentId &&
          s.paymentstatus === "ACTIVE"
      );
    },
    [subscriptions]
  );

  // Get subscription for a specific course
  const getSubscription = useCallback(
    (courseDocumentId) => {
      return subscriptions.find(
        (s) => s.course?.documentId === courseDocumentId
      );
    },
    [subscriptions]
  );

  // Get all active subscriptions
  const getActiveSubscriptions = useCallback(() => {
    return subscriptions.filter((s) => s.paymentstatus === "ACTIVE");
  }, [subscriptions]);

  const value = {
    // State
    subscriptions,
    loading,
    error,

    // Methods
    refresh,
    hasSubscription,
    getSubscription,
    getActiveSubscriptions,

    // Service reference for direct operations
    service: subscriptionService,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionProvider;
