import React, { useEffect, useState } from "react";
import { Title } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Clock,
  Settings,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { subscriptionService } from "../../services/subscriptionService";
import { generateInvoicePDF } from "../../utils/invoiceGenerator";

const PurchaseHistoryPage = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await subscriptionService.getPurchaseHistory(token);
        // Response format: { data: [...] } from Strapi
        setPurchases(response.data || []);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("Failed to load purchase history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-orange-100 text-orange-700";
      case "FAILED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleDownloadInvoice = (invoice) => {
    // Use the PDF generator
    generateInvoicePDF(invoice);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Title title="Purchase History" />

      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <h1 className="text-2xl font-black text-gray-800">Purchase History</h1>
        <p className="text-gray-500">
          View all your past transactions and invoices
        </p>
      </div>

      {purchases.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-600">
            No purchases found
          </h3>
          <p className="text-gray-400">You haven't made any purchases yet.</p>
          <button
            onClick={() => navigate("/browse-courses")}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-400 font-bold tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.map((invoice) => {
                  // Determine main item name
                  const mainItem = invoice.invoice_items?.[0];
                  const itemName = mainItem?.description || "Subscription";
                  const payment = invoice.payments?.[0]; // Assuming one payment per invoice usually
                  const orderId =
                    payment?.payment_reference || invoice.invoice_number;

                  return (
                    <tr
                      key={invoice.documentId}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(
                            invoice.invoice_status
                          )}`}
                        >
                          {invoice.invoice_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {itemName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        ₹{invoice.total_amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {invoice.invoice_status === "PAID" && (
                          <button
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="text-primary hover:text-primary/80 font-medium text-sm flex items-center justify-end gap-1 ml-auto"
                          >
                            <Download className="w-4 h-4" /> Invoice
                          </button>
                        )}
                        {invoice.invoice_status === "PENDING" && (
                          <div className="flex flex-col gap-1 items-end">
                            <button
                              onClick={() =>
                                window.location.href = `/#/payment/status?order_id=${orderId}`
                              }
                              className="text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-colors flex items-center gap-1"
                            >
                              Continue Payment
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm("Are you sure you want to cancel this payment?")) {
                                  try {
                                    const token = localStorage.getItem("token");
                                    await subscriptionService.cancelPayment(token, orderId);
                                    // Refresh list
                                    const response = await subscriptionService.getPurchaseHistory(token);
                                    setPurchases(response.data || []);
                                  } catch (err) {
                                    console.error("Cancel failed", err);
                                    alert("Failed to cancel payment");
                                  }
                                }
                              }}
                              className="text-red-500 hover:text-red-600 font-bold text-xs px-2 py-1"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistoryPage;
