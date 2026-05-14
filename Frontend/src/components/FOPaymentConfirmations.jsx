import { useEffect, useState } from "react";
import {
  getFOPaymentConfirmationsApi,
  confirmBookerPaymentApi,
  sendCombinedPaymentToDistributorApi,
  getNextInvoiceNumberApi,
} from "../api/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { calculateOrderTotal, formatPrice, roundPrice } from "../utils/pricing";
import { getProofUrl } from "../api/api";
import PageLoader from "./common/PageLoader";
import {
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaDollarSign,
  FaSpinner,
  FaStore,
  FaUser,
  FaFileInvoice,
  FaUpload,
  FaEye,
  FaPaperPlane,
  FaBell,
  FaArrowRight,
} from "react-icons/fa";

const FOPaymentConfirmations = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [paymentProof, setPaymentProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [paymentData, setPaymentData] = useState({
    invoiceNumber: "",
    amount: 0,
    method: "cash",
  });

  const fetchOrders = async () => {
    setLoading(true);
    const res = await getFOPaymentConfirmationsApi();
    if (res.success) {
      setOrders(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirm = async (orderId) => {
    setConfirmingId(orderId);
    const res = await confirmBookerPaymentApi(orderId);
    if (res.success) {
      toast.success("Payment confirmed!");
      await fetchOrders();
    } else {
      toast.error(res.message || "Error confirming payment");
    }
    setConfirmingId(null);
  };

  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const handleSelectAll = () => {
    const confirmedOrders = orders
      .filter((o) => o.status === "payment_confirmed")
      .map((o) => o._id);
    if (selectedOrders.length === confirmedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(confirmedOrders);
    }
  };

  const calculateTotal = () => {
    return roundPrice(
      orders
        .filter((order) => selectedOrders.includes(order._id))
        .reduce(
          (sum, order) =>
            sum +
            calculateOrderTotal({
              items: order.items,
              discount: order.discount,
              deliveryCharges: order.deliveryCharges,
            }),
          0
        )
    );
  };

  const handleOpenModal = async () => {
    const confirmedSelected = selectedOrders.filter((id) =>
      orders.find((o) => o._id === id && o.status === "payment_confirmed")
    );

    if (confirmedSelected.length === 0) {
      toast.error("Please confirm payments first, then select confirmed orders to send to distributor");
      return;
    }

    const invoiceRes = await getNextInvoiceNumberApi("fo");
    const invoiceNum = invoiceRes.success ? invoiceRes.invoiceNumber : "";

    setPaymentData({
      ...paymentData,
      amount: calculateTotal(),
      invoiceNumber: invoiceNum,
    });
    setShowModal(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await sendCombinedPaymentToDistributorApi(selectedOrders, paymentData, paymentProof);
    if (res.success) {
      toast.success(`Payments sent! Invoice: ${res.invoiceNumber || "Generated"}`);
      setShowModal(false);
      setSelectedOrders([]);
      setPaymentProof(null);
      await fetchOrders();
    } else {
      toast.error(res.message || "Error sending payment");
    }
    setSubmitting(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setPaymentProof(null);
  };

  const statusColors = {
    payment_submitted: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "Pending Confirm" },
    payment_confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Confirmed" },
    payment_sent_to_distributor: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Sent" },
    payment_received: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Received" },
    completed: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Completed" },
  };

  if (loading) {
    return <PageLoader message="Loading payments..." />;
  }

  const pendingOrders = orders.filter((o) => ["payment_submitted", "payment_confirmed"].includes(o.status));
  const completedOrders = orders.filter((o) => ["payment_received", "completed"].includes(o.status));
  const displayOrders = activeTab === "pending" ? pendingOrders : completedOrders;
  const pendingCount = orders.filter((o) => o.status === "payment_submitted").length;

  return (
    <div className="bg-[#E8F0F8] min-h-screen text-[#4b2e2e] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white shadow">
            <FaDollarSign className="text-sm" />
          </div>
          <h2 className="text-xl font-bold">Booker Payments</h2>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "pending", label: "Pending", count: pendingOrders.length },
            { key: "completed", label: "History", count: completedOrders.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === tab.key
                  ? "bg-[#7f2c2c] text-white shadow"
                  : "bg-white text-[#7f2c2c] border border-[#7f2c2c]/20 hover:bg-[#7f2c2c]/10"
              }`}
            >
              {tab.label} ({tab.count})
              {tab.key === "pending" && tab.count > 0 && activeTab !== "pending" && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Notification */}
      <AnimatePresence>
        {pendingCount > 0 && activeTab === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-xl flex items-center gap-3 shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <FaBell className="text-sm" />
            </div>
            <div>
              <p className="font-semibold text-orange-800 text-sm">
                {pendingCount} Payment{pendingCount > 1 ? "s" : ""} Pending Confirmation
              </p>
              <p className="text-xs text-orange-600">Please review and confirm the submitted booker payments below.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Guide */}
      {activeTab === "pending" && displayOrders.length > 0 && (
        <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-[#7f2c2c]/10 w-fit">
          <span className="font-semibold text-[#7f2c2c]">Step 1:</span> Confirm booker payments
          <FaArrowRight className="text-[10px] text-gray-400" />
          <span className="font-semibold text-[#7f2c2c]">Step 2:</span> Select confirmed & send to distributor
        </div>
      )}

      {displayOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FaClipboardList className="text-3xl mx-auto mb-2 text-[#7f2c2c]/30" />
          <p>{activeTab === "pending" ? "No pending payment confirmations" : "No payment history"}</p>
        </div>
      ) : (
        <>
          {/* Select All Bar */}
          {activeTab === "pending" && (
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <label className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-[#7f2c2c]/10 cursor-pointer hover:bg-[#faf8f5] transition-all">
                <input
                  type="checkbox"
                  checked={
                    selectedOrders.length === orders.filter((o) => o.status === "payment_confirmed").length &&
                    selectedOrders.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 accent-[#7f2c2c] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#4b2e2e]">Select All Confirmed</span>
              </label>
              <span className="text-xs text-gray-500">{selectedOrders.length} selected</span>
              {selectedOrders.length > 0 && (
                <button
                  onClick={handleOpenModal}
                  className="ml-auto inline-flex items-center gap-1.5 bg-[#7f2c2c] hover:bg-[#6d2525] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <FaPaperPlane className="text-[10px]" />
                  Send to Distributor
                </button>
              )}
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border border-[#7f2c2c]/15 rounded-xl overflow-hidden">
              <thead className="bg-[#7f2c2c] text-white">
                <tr>
                  {[
                    ...(activeTab === "pending" ? ["Select"] : []),
                    "Status",
                    "Booker",
                    "Shop",
                    "Items",
                    "Total",
                    "Invoice",
                    "Proof",
                    ...(activeTab === "pending" ? ["Action"] : []),
                  ].map((h) => (
                    <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayOrders.map((order, i) => {
                  const total = calculateOrderTotal({
                    items: order.items,
                    discount: order.discount,
                    deliveryCharges: order.deliveryCharges,
                  });
                  const statusConfig = statusColors[order.status] || statusColors.payment_submitted;

                  return (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[#7f2c2c]/10 hover:bg-[#7f2c2c]/5 transition-all bg-white"
                    >
                      {activeTab === "pending" && (
                        <td className="p-3">
                          {order.status === "payment_confirmed" ? (
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order._id)}
                              onChange={() => handleSelectOrder(order._id)}
                              className="w-4 h-4 accent-[#7f2c2c] cursor-pointer"
                            />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      )}
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                            <FaUser className="text-[10px]" />
                          </div>
                          <span className="text-sm font-medium">{order.bookerId?.name || "N/A"}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <FaStore className="text-gray-400 text-[10px]" />
                          <span className="text-sm">{order.shopName || "-"}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-medium">{item.productName}</span>
                            <span className="text-gray-400 ml-1">x {item.quantity}</span>
                          </div>
                        ))}
                      </td>
                      <td className="p-3 text-sm font-bold text-[#7f2c2c]">Rs. {formatPrice(total)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <FaFileInvoice className="text-[10px]" />
                          {order.payment?.invoiceNumber || "N/A"}
                        </div>
                      </td>
                      <td className="p-3">
                        {order.payment?.proof ? (
                          <button
                            onClick={() => setPreviewImage(getProofUrl(order.payment.proof))}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold transition-all"
                          >
                            <FaEye className="text-[10px]" />
                            View
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">No Proof</span>
                        )}
                      </td>
                      {activeTab === "pending" && (
                        <td className="p-3">
                          {order.status === "payment_submitted" && (
                            <button
                              onClick={() => handleConfirm(order._id)}
                              disabled={confirmingId === order._id}
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              {confirmingId === order._id ? (
                                <FaSpinner className="animate-spin text-[10px]" />
                              ) : (
                                <FaCheckCircle className="text-[10px]" />
                              )}
                              {confirmingId === order._id ? "Confirming..." : "Confirm"}
                            </button>
                          )}
                          {order.status === "payment_confirmed" && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                              <FaCheckCircle className="text-[10px]" /> Ready
                            </span>
                          )}
                        </td>
                      )}
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {displayOrders.map((order, i) => {
              const total = calculateOrderTotal({
                items: order.items,
                discount: order.discount,
                deliveryCharges: order.deliveryCharges,
              });
              const statusConfig = statusColors[order.status] || statusColors.payment_submitted;

              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-[#7f2c2c]/10 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {activeTab === "pending" && order.status === "payment_confirmed" && (
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => handleSelectOrder(order._id)}
                          className="w-4 h-4 accent-[#7f2c2c]"
                        />
                      )}
                      <div className="w-7 h-7 rounded-full bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                        <FaUser className="text-[10px]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{order.bookerId?.name || "N/A"}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <FaStore /> {order.shopName || "-"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs bg-[#faf8f5] rounded-lg p-2">
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-gray-500">x {item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-[#faf8f5] rounded-lg p-2">
                      <p className="text-gray-500 text-[10px]">Total</p>
                      <p className="font-bold text-[#7f2c2c]">Rs. {formatPrice(total)}</p>
                    </div>
                    <div className="bg-[#faf8f5] rounded-lg p-2">
                      <p className="text-gray-500 text-[10px]">Invoice</p>
                      <p className="font-medium text-gray-600">{order.payment?.invoiceNumber || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {order.payment?.proof ? (
                      <button
                        onClick={() => setPreviewImage(getProofUrl(order.payment.proof))}
                        className="inline-flex items-center gap-1 text-blue-600 text-xs font-semibold"
                      >
                        <FaEye className="text-[10px]" /> View Proof
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">No Proof</span>
                    )}

                    {activeTab === "pending" && order.status === "payment_submitted" && (
                      <button
                        onClick={() => handleConfirm(order._id)}
                        disabled={confirmingId === order._id}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        {confirmingId === order._id ? (
                          <FaSpinner className="animate-spin text-[10px]" />
                        ) : (
                          <FaCheckCircle className="text-[10px]" />
                        )}
                        {confirmingId === order._id ? "..." : "Confirm"}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-[#4b2e2e] p-5 rounded-2xl w-full max-w-sm space-y-4 shadow-xl"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white">
                  <FaPaperPlane className="text-sm" />
                </div>
                <h3 className="text-lg font-bold">Send to Distributor</h3>
              </div>

              <p className="text-xs text-gray-500">
                This will add payments directly to distributor's sale payments.
              </p>

              <div className="p-3 bg-[#f5e0c3]/30 border border-[#7f2c2c]/15 rounded-xl flex items-center gap-2">
                <FaFileInvoice className="text-[#7f2c2c]" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Invoice</p>
                  <p className="text-sm font-bold">{paymentData.invoiceNumber || "Generating..."}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Total Amount</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: roundPrice(e.target.value) })}
                  className="w-full p-2.5 border-[3px] border-[#7f2c2c] bg-[#faf8f5] text-[#4b2e2e] outline-none text-sm"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Method</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                  className="w-full p-2.5 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="bank transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Payment Proof (Optional)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setPaymentProof(e.target.files[0] || null)}
                    className="w-full p-2 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#7f2c2c] file:text-white file:text-xs file:font-semibold"
                  />
                </div>
                {paymentProof && <p className="text-xs text-green-600 mt-1">Selected: {paymentProof.name}</p>}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  <FaTimesCircle className="text-[10px]" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPayment}
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-[#7f2c2c] hover:bg-[#6d2525] text-white py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                >
                  {submitting ? <FaSpinner className="animate-spin text-[10px]" /> : <FaPaperPlane className="text-[10px]" />}
                  {submitting ? "Sending..." : "Send"}
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

export default FOPaymentConfirmations;





