import { useEffect, useState } from "react";
import { getDistributorCombinedPaymentsApi, completeOrderFromFOApi, getProofUrl } from "../api/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import PageLoader from "./common/PageLoader";
import {
  FaClipboardList,
  FaCheckCircle,
  FaSpinner,
  FaUser,
  FaFileInvoice,
  FaDollarSign,
  FaEye,
  FaTimesCircle,
  FaBoxOpen,
} from "react-icons/fa";

const DistributorCombinedPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    const res = await getDistributorCombinedPaymentsApi();
    if (res.success) {
      setPayments(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleComplete = async (orderId) => {
    setProcessingId(orderId);
    const res = await completeOrderFromFOApi(orderId);
    if (res.success) {
      toast.success("Order completed! Payments added to sale payments.");
      await fetchPayments();
    } else {
      toast.error(res.message || "Error completing order");
    }
    setProcessingId(null);
  };

  const statusColors = {
    payment_submitted_to_distributor: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "Pending" },
    payment_sent_to_distributor: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Sent" },
    payment_received: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Received" },
    completed: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Completed" },
  };

  if (loading) {
    return <PageLoader message="Loading payments..." />;
  }

  return (
    <div className="bg-[#E8F0F8] min-h-screen text-[#4b2e2e] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white shadow">
            <FaDollarSign className="text-sm" />
          </div>
          <div>
            <h2 className="text-xl font-bold">FO Combined Payments</h2>
            <p className="text-xs text-gray-500">Review and complete orders after receiving payments from FO.</p>
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FaBoxOpen className="text-3xl mx-auto mb-2 text-[#7f2c2c]/30" />
          <p>No pending payments from FO</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border border-[#7f2c2c]/15 rounded-xl overflow-hidden">
              <thead className="bg-[#7f2c2c] text-white">
                <tr>
                  {["FO Name", "Invoice #", "Amount", "Method", "Booker Orders", "Proof", "Action"].map((h) => (
                    <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, i) => {
                  const statusConfig = statusColors[payment.status] || statusColors.payment_submitted_to_distributor;
                  return (
                    <motion.tr
                      key={payment._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[#7f2c2c]/10 hover:bg-[#7f2c2c]/5 transition-all bg-white"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                            <FaUser className="text-[10px]" />
                          </div>
                          <span className="text-sm font-medium">{payment.foId?.name || "N/A"}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <FaFileInvoice className="text-[10px] text-gray-400" />
                          {payment.payment?.invoiceNumber || "N/A"}
                        </div>
                      </td>
                      <td className="p-3 text-sm font-bold text-[#7f2c2c]">
                        Rs. {payment.payment?.amount || payment.totalAmount || 0}
                      </td>
                      <td className="p-3 text-xs text-gray-600 capitalize">
                        {payment.payment?.method || "N/A"}
                      </td>
                      <td className="p-3 text-xs">
                        <span className="inline-flex items-center gap-1 bg-[#faf8f5] px-2 py-1 rounded-md">
                          <FaClipboardList className="text-[10px] text-gray-400" />
                          {payment.linkedBookerOrders?.length || 0} orders
                        </span>
                      </td>
                      <td className="p-3">
                        {payment.payment?.proof ? (
                          <button
                            onClick={() => setPreviewImage(getProofUrl(payment.payment.proof))}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold transition-all"
                          >
                            <FaEye className="text-[10px]" /> View Proof
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">No Proof</span>
                        )}
                      </td>
                      <td className="p-3">
                        {payment.status === "payment_submitted_to_distributor" ? (
                          <button
                            onClick={() => handleComplete(payment._id)}
                            disabled={processingId === payment._id}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            {processingId === payment._id ? (
                              <FaSpinner className="animate-spin text-[10px]" />
                            ) : (
                              <FaCheckCircle className="text-[10px]" />
                            )}
                            {processingId === payment._id ? "Processing..." : "Complete"}
                          </button>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                            {statusConfig.label}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {payments.map((payment, i) => {
              const statusConfig = statusColors[payment.status] || statusColors.payment_submitted_to_distributor;
              return (
                <motion.div
                  key={payment._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-[#7f2c2c]/10 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                        <FaUser className="text-[10px]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{payment.foId?.name || "N/A"}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <FaFileInvoice className="text-[8px]" />
                          {payment.payment?.invoiceNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-[#faf8f5] rounded-lg p-2">
                      <p className="text-gray-500 text-[10px]">Amount</p>
                      <p className="font-bold text-[#7f2c2c]">Rs. {payment.payment?.amount || payment.totalAmount || 0}</p>
                    </div>
                    <div className="bg-[#faf8f5] rounded-lg p-2">
                      <p className="text-gray-500 text-[10px]">Method</p>
                      <p className="font-medium text-gray-600 capitalize">{payment.payment?.method || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 bg-[#faf8f5] px-2 py-1 rounded-md text-xs text-gray-600">
                      <FaClipboardList className="text-[10px]" />
                      {payment.linkedBookerOrders?.length || 0} booker orders
                    </span>
                    {payment.payment?.proof ? (
                      <button
                        onClick={() => setPreviewImage(getProofUrl(payment.payment.proof))}
                        className="inline-flex items-center gap-1 text-blue-600 text-xs font-semibold"
                      >
                        <FaEye className="text-[10px]" /> View Proof
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">No Proof</span>
                    )}
                  </div>

                  {payment.status === "payment_submitted_to_distributor" && (
                    <button
                      onClick={() => handleComplete(payment._id)}
                      disabled={processingId === payment._id}
                      className="w-full inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                      {processingId === payment._id ? (
                        <FaSpinner className="animate-spin text-[10px]" />
                      ) : (
                        <FaCheckCircle className="text-[10px]" />
                      )}
                      {processingId === payment._id ? "Processing..." : "Complete Order"}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-[60] p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage}
                alt="Payment Proof"
                className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain"
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="mt-3 inline-flex items-center gap-1 bg-white/90 hover:bg-white text-[#7f2c2c] px-4 py-2 rounded-lg text-xs font-bold transition-all"
              >
                <FaTimesCircle /> Close Preview
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DistributorCombinedPayments;

