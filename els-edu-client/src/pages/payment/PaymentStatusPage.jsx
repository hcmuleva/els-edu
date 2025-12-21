import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Home,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";
import { subscriptionService } from "../../services/subscriptionService";

const PaymentStatusPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("order_id");

  // Ref to track if finalize was already called for this orderId
  const finalizeCalled = useRef(false);

  const [status, setStatus] = useState({
    loading: true,
    payment_status: "PENDING", // PENDING, SUCCESS, FAILED
    amount: 0,
    item_name: "",
    error: null,
  });
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 10; // 10 retries = 50 seconds

  const checkStatus = async () => {
    try {
      if (!orderId) {
        setStatus((prev) => ({
          ...prev,
          loading: false,
          payment_status: "FAILED",
          error: "No Order ID provided",
        }));
        return;
      }

      const token = localStorage.getItem("token");
      const data = await subscriptionService.getOrderStatus(token, orderId);

      setStatus({
        loading: false,
        payment_status: data.payment_status,
        amount: data.amount,
        item_name: data.item_name || "Enrolled Course",
        error: null,
      });

      // If success, try to finalize subscription (ensure it's created)
      // Only call once per orderId to avoid duplicate calls
      if (data.payment_status === "SUCCESS" && !finalizeCalled.current) {
        finalizeCalled.current = true; // Mark as called immediately
        try {
          console.log("Payment SUCCESS, finalizing subscription...");
          await subscriptionService.finalizeSubscription(token, orderId);
          console.log("Subscription finalization call complete.");
        } catch (finalErr) {
          console.error("Finalization warning:", finalErr);
          // We don't block the UI here because usually the webhook handles it.
          // This is just a backup.
        }
      }
    } catch (err) {
      console.error(err);
      setStatus((prev) => ({
        ...prev,
        loading: false,
        // If network error, maybe keep pending? For now fail.
        payment_status: "FAILED",
        error: "Failed to fetch status. Please check Purchase History.",
      }));
    }
  };

  useEffect(() => {
    checkStatus();
    // Poll every 5 seconds if pending
    const interval = setInterval(() => {
      if (status.payment_status === "PENDING" && retryCount < MAX_RETRIES) {
        checkStatus();
        setRetryCount((prev) => prev + 1);
      } else if (
        retryCount >= MAX_RETRIES &&
        status.payment_status === "PENDING"
      ) {
        // Timeout: Treat as FAILED since payment was likely abandoned
        setStatus((prev) => ({
          ...prev,
          payment_status: "FAILED",
          error:
            "Payment was not completed. If money was deducted, it will be refunded automatically within 5-7 business days.",
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId, status.payment_status, retryCount]); // Re-run if status changes (to stop if success/failed) or orderId changes

  // Use replace to prevent back button from going to Cashfree page
  const handleGoHome = () => navigate("/browse-courses", { replace: true });
  const handleHistory = () => navigate("/purchase-history", { replace: true });
  const handleSubscriptions = () =>
    navigate("/my-subscriptions", { replace: true });

  if (status.loading && status.payment_status === "PENDING") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            <Clock className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Verifying Payment...
          </h2>
          <p className="text-gray-500">
            Please wait while we confirm your order.
          </p>
          <p className="text-xs text-gray-300 mt-4">Order ID: {orderId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
        {/* PENDING */}
        {status.payment_status === "PENDING" && (
          <div className="text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">
              Payment Processing
            </h2>
            <p className="text-gray-500 mb-6">
              Your payment is being processed by the bank. This usually takes a
              few minutes.
            </p>

            {status.error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800">{status.error}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono font-medium text-gray-700">
                  {orderId}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-gray-900">
                  ₹{status.amount}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={checkStatus}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Refresh Status
              </button>
              <button
                onClick={handleHistory}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Check Purchase History
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {status.payment_status === "SUCCESS" && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-500 mb-6">
              Your subscription to <strong>{status.item_name}</strong> is now
              active.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono font-medium text-gray-700">
                  {orderId}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-bold text-green-600">
                  ₹{status.amount}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubscriptions}
              className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <ShoppingBag className="w-4 h-4" /> Go to My Subscriptions
            </button>
            <button
              onClick={handleHistory}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors mb-3"
            >
              View Purchase History
            </button>
            <button
              onClick={handleGoHome}
              className="w-full py-3 bg-white border-2 border-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Browse Courses
            </button>
          </div>
        )}

        {/* FAILED */}
        {status.payment_status === "FAILED" && (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full mx-auto mb-6 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-500 mb-6">
              {status.error ||
                "Your payment could not be processed. If money was deducted, it will be refunded automatically."}
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono font-medium text-gray-700">
                  {orderId}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-bold text-red-500">Failed</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoHome}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button
                // Mock contact support interaction
                onClick={() => alert("Please contact support@example.com")}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> Contact Support
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusPage;
