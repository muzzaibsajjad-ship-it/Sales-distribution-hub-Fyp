import { useEffect, useState } from "react";
import API, { getNextInvoiceNumberApi } from "../api/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { getProofUrl } from "../api/api";
import PageLoader from "./common/PageLoader";
import {
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaDollarSign,
  FaBoxOpen,
  FaSpinner,
  FaUpload,
  FaFileInvoice,
  FaEye,
  FaImage,
} from "react-icons/fa";

const DistributorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("pending");
  const [paymentData, setPaymentData] = useState({
    invoiceNumber: "",
    amount: "",
    method: "cash",
    proof: null,
  });
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchOrders = async (filter = "pending") => {
    try {
      setLoading(true);
      const res = await API.get(`/orders?status=${filter}`);
      setOrders(res.data.orders || []);
    } catch (err) {
      toast.error("Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeFilter);
  }, []);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    fetchOrders(filter);
  };

  const openPaymentModal = async (order) => {
    setPaymentOrderId(order._id);
    const total =
      (Number(order.sellingPrice) || 0) * (Number(order.quantity) || 0);

    const invoiceRes = await getNextInvoiceNumberApi("distributor");
    const invoiceNum = invoiceRes.success ? invoiceRes.invoiceNumber : "";

    setPaymentData({ ...paymentData, amount: total, invoiceNumber: invoiceNum });
  };

  const handlePaymentSubmit = async () => {
    if (!paymentData.method || !paymentData.proof)
      return toast.error("Payment method and proof required");

    setSubmitting(true);
    const formData = new FormData();
    formData.append("orderId", paymentOrderId);
    formData.append("amount", paymentData.amount);
    formData.append("method", paymentData.method);
    formData.append("proof", paymentData.proof);

    try {
      const res = await API.put("/orders/submit-payment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const invoiceNum = res.data?.order?.payment?.invoiceNumber;
      toast.success(
        invoiceNum ? `Payment submitted! Invoice: ${invoiceNum}` : "Payment submitted!"
      );
      setPaymentOrderId(null);
      setPaymentData({
        invoiceNumber: "",
        amount: "",
        method: "cash",
        proof: null,
      });
      fetchOrders(activeFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Pending" },
    stockApproved: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Stock Approved" },
    distributor_approved: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Stock Approved" },
    paymentSubmitted: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Payment Submitted" },
    payment_submitted: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Payment Submitted" },
    completed: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Completed" },
    canceled: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Canceled" },
  };

  if (loading) return <PageLoader message="Loading orders..." />;

  return (
    <div className="bg-[#E8F0F8] min-h-screen text-[#4b2e2e] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white shadow">
            <FaClipboardList className="text-sm" />
          </div>
          <h2 className="text-xl font-bold">My Orders</h2>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {["pending", "completed", "canceled", "all"].map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                activeFilter === filter
                  ? "bg-[#7f2c2c] text-white shadow"
                  : "bg-white text-[#7f2c2c] border border-[#7f2c2c]/20 hover:bg-[#7f2c2c]/10"
              }`}
            >
              {filter === "all" ? "All Orders" : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border border-[#7f2c2c]/15 rounded-xl overflow-hidden">
          <thead className="bg-[#7f2c2c] text-white">
            <tr>
              {["Item", "Qty", "Price", "Total", "Status", "Action"].map((h) => (
                <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const total =
                (Number(order.sellingPrice) || 0) * (Number(order.quantity) || 0);
              const statusConfig = statusColors[order.status] || statusColors.pending;

              return (
                <motion.tr
                  key={order._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-[#7f2c2c]/10 hover:bg-[#7f2c2c]/5 transition-all bg-white"
                >
                  <td className="p-3 text-sm">
                    <span className="font-medium">{order.itemId?.itemName || "-"}</span>
                    {order.itemId?.stockType && (
                      <span className="text-gray-400 text-xs ml-1">({order.itemId.stockType})</span>
                    )}
                  </td>
                  <td className="p-3 text-sm font-semibold">{order.quantity}</td>
                  <td className="p-3 text-sm">Rs. {order.sellingPrice || 0}</td>
                  <td className="p-3 text-sm font-bold text-[#7f2c2c]">Rs. {total}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1.5">
                      {(order.status === "stockApproved" || order.status === "distributor_approved") && (
                        <button
                          onClick={() => openPaymentModal(order)}
                          className="inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          <FaDollarSign className="text-[10px]" />
                          Submit Payment
                        </button>
                      )}
                      {(order.status === "paymentSubmitted" || order.status === "payment_submitted") && (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-purple-600 text-xs font-medium">
                            <FaSpinner className="animate-spin text-[10px]" /> Processing...
                          </span>
                          {order.payment?.proof && (
                            <button
                              onClick={() => setPreviewImage(getProofUrl(order.payment.proof))}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold transition-all"
                            >
                              <FaEye className="text-[10px]" /> View Proof
                            </button>
                          )}
                        </div>
                      )}
                      {order.status === "completed" && (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold">
                            <FaCheckCircle /> Completed
                          </span>
                          {order.payment?.proof && (
                            <button
                              onClick={() => setPreviewImage(getProofUrl(order.payment.proof))}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold transition-all"
                            >
                              <FaEye className="text-[10px]" /> View Proof
                            </button>
                          )}
                        </div>
                      )}
                      {order.status === "canceled" && (
                        <span className="inline-flex items-center gap-1 text-red-500 text-xs font-bold">
                          <FaTimesCircle /> Canceled
                        </span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => {
          const total =
            (Number(order.sellingPrice) || 0) * (Number(order.quantity) || 0);
          const statusConfig = statusColors[order.status] || statusColors.pending;

          return (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-[#7f2c2c]/10 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">{order.itemId?.itemName || "N/A"}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                  {statusConfig.label}
                </span>
              </div>
              {order.itemId?.stockType && (
                <p className="text-xs text-gray-500 mb-2">{order.itemId.stockType}</p>
              )}

              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div className="bg-[#faf8f5] rounded-lg p-2 text-center">
                  <p className="text-gray-500">Qty</p>
                  <p className="font-semibold">{order.quantity}</p>
                </div>
                <div className="bg-[#faf8f5] rounded-lg p-2 text-center">
                  <p className="text-gray-500">Price</p>
                  <p className="font-semibold">Rs. {order.sellingPrice || 0}</p>
                </div>
                <div className="bg-[#faf8f5] rounded-lg p-2 text-center">
                  <p className="text-gray-500">Total</p>
                  <p className="font-bold text-[#7f2c2c]">Rs. {total}</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {(order.status === "stockApproved" || order.status === "distributor_approved") && (
                  <button
                    onClick={() => openPaymentModal(order)}
                    className="w-full inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    <FaDollarSign className="text-[10px]" />
                    Submit Payment
                  </button>
                )}
                {(order.status === "paymentSubmitted" || order.status === "payment_submitted") && (
                  <div className="w-full flex flex-col gap-1">
                    <span className="w-full text-center text-xs text-purple-600 font-medium py-2">
                      <FaSpinner className="animate-spin inline mr-1" /> Processing...
                    </span>
                    {order.payment?.proof && (
                      <button
                        onClick={() => setPreviewImage(getProofUrl(order.payment.proof))}
                        className="w-full inline-flex items-center justify-center gap-1 text-blue-600 text-xs font-semibold py-1"
                      >
                        <FaEye className="text-[10px]" /> View Proof
                      </button>
                    )}
                  </div>
                )}
                {order.status === "completed" && (
                  <div className="w-full flex flex-col gap-1">
                    <span className="w-full inline-flex items-center justify-center gap-1 text-green-600 text-xs font-bold py-2">
                      <FaCheckCircle /> Completed
                    </span>
                    {order.payment?.proof && (
                      <button
                        onClick={() => setPreviewImage(getProofUrl(order.payment.proof))}
                        className="w-full inline-flex items-center justify-center gap-1 text-blue-600 text-xs font-semibold py-1"
                      >
                        <FaEye className="text-[10px]" /> View Proof
                      </button>
                    )}
                  </div>
                )}
                {order.status === "canceled" && (
                  <span className="w-full inline-flex items-center justify-center gap-1 text-red-500 text-xs font-bold py-2">
                    <FaTimesCircle /> Canceled
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {orders.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <FaBoxOpen className="text-3xl mx-auto mb-2 text-[#7f2c2c]/30" />
          <p>No orders found.</p>
        </div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentOrderId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-[#4b2e2e] p-5 rounded-2xl w-full max-w-sm space-y-4 shadow-xl"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white">
                  <FaDollarSign className="text-sm" />
                </div>
                <h3 className="text-lg font-bold">Submit Payment</h3>
              </div>

              <div className="p-3 bg-[#f5e0c3]/30 border border-[#7f2c2c]/15 rounded-xl flex items-center gap-2">
                <FaFileInvoice className="text-[#7f2c2c]" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Invoice</p>
                  <p className="text-sm font-bold">{paymentData.invoiceNumber || "Generating..."}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Amount</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  readOnly
                  className="w-full p-2.5 border-[3px] border-[#7f2c2c] bg-[#faf8f5] text-[#4b2e2e] outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Method</label>
                <select
                  value={paymentData.method}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, method: e.target.value })
                  }
                  className="w-full p-2.5 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="bank transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Payment Proof</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, proof: e.target.files[0] })
                    }
                    className="w-full p-2 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#7f2c2c] file:text-white file:text-xs file:font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setPaymentOrderId(null)}
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  <FaTimesCircle className="text-[10px]" />
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                >
                  {submitting ? <FaSpinner className="animate-spin text-[10px]" /> : <FaCheckCircle className="text-[10px]" />}
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

export default DistributorOrders;





