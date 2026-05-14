import { useEffect, useState } from "react";
import {
  getDistributorCombinedOrdersApi,
  approveCombinedOrderApi,
  rejectCombinedOrderApi,
  submitCombinedPaymentApi,
  getDistributorCombinedPaymentsApi,
  completeOrderFromFOApi,
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
  FaBoxOpen,
  FaSpinner,
  FaFileInvoice,
  FaEye,
  FaUser,
  FaTruck,
  FaStore,
  FaMapMarkerAlt,
  FaPlus,
  FaMinus,
  FaImage,
  FaArrowRight,
  FaExclamationCircle,
} from "react-icons/fa";

const DistributorOrderApproval = () => {
  const [orders, setOrders] = useState([]);
  const [foPayments, setFoPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sellingPrices, setSellingPrices] = useState({});
  const [discount, setDiscount] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [paymentData, setPaymentData] = useState({
    invoiceNumber: "",
    amount: 0,
    method: "cash",
  });
  const [paymentProof, setPaymentProof] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getItemKey = (itemOrId) => {
    if (!itemOrId) return "";
    if (typeof itemOrId === "string") return itemOrId;
    if (typeof itemOrId === "object" && itemOrId._id) return String(itemOrId._id);
    return String(itemOrId);
  };

  const resolveItemUnitPrice = (item) => {
    const savedPrice = roundPrice(sellingPrices[getItemKey(item.itemId)]);
    if (savedPrice > 0) return savedPrice;
    return roundPrice(item.estimatedPrice);
  };

  const fetchOrders = async () => {
    setLoading(true);
    const res = await getDistributorCombinedOrdersApi();
    if (res.success) {
      setOrders(res.data);
      const prices = {};
      for (const order of res.data) {
        for (const item of order.items || []) {
          prices[getItemKey(item.itemId)] = roundPrice(item.estimatedPrice);
        }
      }
      setSellingPrices(prices);
    }
    setLoading(false);
  };

  const fetchFOPayments = async () => {
    const res = await getDistributorCombinedPaymentsApi();
    if (res.success) {
      setFoPayments(res.data || []);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchFOPayments();
  }, []);

  useEffect(() => {
    if (!selectedOrder?.items?.length) return;
    setSellingPrices((prev) => {
      const next = { ...prev };
      selectedOrder.items.forEach((item) => {
        const itemKey = getItemKey(item.itemId);
        if (next[itemKey] === undefined || next[itemKey] === null) {
          next[itemKey] = roundPrice(item.estimatedPrice);
        }
      });
      return next;
    });
  }, [selectedOrder]);

  const updatePrice = (itemId, price) => {
    setSellingPrices({
      ...sellingPrices,
      [getItemKey(itemId)]: roundPrice(price),
    });
  };

  const handleApprove = async () => {
    if (!selectedOrder) return;
    const items = selectedOrder.items.map((item) => ({
      itemId: item.itemId,
      sellingPrice: roundPrice(resolveItemUnitPrice(item)),
    }));
    setSubmitting(true);
    const res = await approveCombinedOrderApi(
      selectedOrder._id,
      items,
      roundPrice(discount),
      roundPrice(deliveryCharges)
    );
    if (res.success) {
      toast.success("Order approved! Prices locked.", { autoClose: 1500 });
      setSelectedOrder(null);
      setShowDetailModal(false);
      await fetchOrders();
    } else {
      toast.error(res.message || "Failed to approve order");
    }
    setSubmitting(false);
  };

  const handleReject = async () => {
    if (!selectedOrder) return;
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    setSubmitting(true);
    const res = await rejectCombinedOrderApi(selectedOrder._id, reason);
    if (res.success) {
      toast.success("Order rejected", { autoClose: 1500 });
      setSelectedOrder(null);
      setShowDetailModal(false);
      await fetchOrders();
    } else {
      toast.error(res.message || "Failed to reject order");
    }
    setSubmitting(false);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedOrder) return;
    if (!paymentProof) {
      toast.error("Please upload payment proof image");
      return;
    }
    setSubmitting(true);
    const res = await submitCombinedPaymentApi(
      selectedOrder._id,
      paymentData,
      paymentProof
    );
    if (res.success) {
      toast.success("Payment submitted successfully!", { autoClose: 1500 });
      setShowPaymentForm(false);
      setSelectedOrder(null);
      setShowDetailModal(false);
      await fetchOrders();
    } else {
      toast.error(res.message || "Failed to submit payment");
    }
    setSubmitting(false);
  };

  const handleConfirmPayment = async (orderId) => {
    if (!window.confirm("Confirm this payment? It will be added to your sales payments.")) {
      return;
    }
    setSubmitting(true);
    const res = await completeOrderFromFOApi(orderId);
    if (res.success) {
      toast.success("Payment confirmed! Added to sales payments.", { autoClose: 1500 });
      await fetchFOPayments();
    } else {
      toast.error(res.message || "Failed to confirm payment");
    }
    setSubmitting(false);
  };

  const calculateTotal = () => {
    if (!selectedOrder) return 0;
    return calculateOrderTotal({
      items: selectedOrder.items,
      getUnitPrice: resolveItemUnitPrice,
      discount,
      deliveryCharges,
    });
  };

  const formatOrderedQty = (item) => {
    const orderUnit = String(item?.orderUnit || "unit").toLowerCase();
    const orderQty = Number(item?.orderQuantity) || 0;
    const unitQty = Number(item?.quantity) || 0;
    if (orderUnit !== "unit" && orderQty > 0) {
      return `${orderQty} ${orderUnit} (${unitQty} units)`;
    }
    return `${unitQty} units`;
  };

  const statusColors = {
    fo_combined: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Awaiting Approval" },
    distributor_approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Approved — Pay Now" },
    payment_submitted: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", label: "Payment Submitted" },
    payment_received: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Payment Received" },
    stock_transferred: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Stock Transferred" },
    completed: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Completed" },
  };

  const pendingOrdersCount = orders.filter((o) => o.status === "fo_combined").length;
  const pendingPaymentsCount = foPayments.filter((o) => !["payment_received", "completed"].includes(o.status)).length;

  const tabs = [
    { key: "orders", label: "FO Orders", count: orders.length },
    { key: "payments", label: "FO Payments", count: foPayments.length },
  ];

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setDiscount(order.discount || 0);
    setDeliveryCharges(order.deliveryCharges || 0);
    setShowDetailModal(true);
  };

  if (loading) {
    return <PageLoader message="Loading orders..." />;
  }

  // ==================== ORDER DETAIL CONTENT (shared between desktop panel & mobile modal) ====================
  const OrderDetailContent = () => {
    if (!selectedOrder) return null;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white shadow">
              <FaFileInvoice className="text-sm" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#4b2e2e]">Order #{selectedOrder._id.slice(-8).toUpperCase()}</h3>
              <p className="text-[10px] text-gray-400">
                FO: {selectedOrder.foId?.name || "Unknown"} · {selectedOrder.linkedBookerOrders?.length || 0} booker orders
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusColors[selectedOrder.status]?.bg} ${statusColors[selectedOrder.status]?.text} border ${statusColors[selectedOrder.status]?.border}`}>
            {statusColors[selectedOrder.status]?.label || selectedOrder.status}
          </span>
        </div>

        {/* Items */}
        <div className="bg-[#faf8f5] rounded-xl p-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Items & Pricing</p>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {selectedOrder.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white rounded-lg p-2.5 border border-[#7f2c2c]/10">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#4b2e2e] truncate">{item.productName}</p>
                  <p className="text-[10px] text-gray-400">{formatOrderedQty(item)}</p>
                </div>
                {selectedOrder.status === "fo_combined" ? (
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-[10px] text-gray-500">Rs./unit</span>
                    <input
                      type="number"
                      value={resolveItemUnitPrice(item)}
                      onChange={(e) => updatePrice(item.itemId, e.target.value)}
                      className="w-20 border-[2px] border-[#7f2c2c] bg-[#faf8f5] text-[#4b2e2e] outline-none text-xs px-2 py-1 rounded text-right"
                      min="0"
                      step="0.01"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-[#7f2c2c]">Rs. {formatPrice(resolveItemUnitPrice(item))}</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Auto-calculated from distributor default pack price</p>
        </div>

        {/* Discount & Delivery */}
        {selectedOrder.status === "fo_combined" && (
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-white rounded-lg p-2.5 border border-[#7f2c2c]/10">
              <label className="text-xs font-medium text-gray-600">Discount (Rs.)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(roundPrice(e.target.value))}
                className="w-24 border-[2px] border-[#7f2c2c] bg-[#faf8f5] text-[#4b2e2e] outline-none text-xs px-2 py-1 rounded text-right"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex justify-between items-center bg-white rounded-lg p-2.5 border border-[#7f2c2c]/10">
              <label className="text-xs font-medium text-gray-600">Delivery Charges (Rs.)</label>
              <input
                type="number"
                value={deliveryCharges}
                onChange={(e) => setDeliveryCharges(roundPrice(e.target.value))}
                className="w-24 border-[2px] border-[#7f2c2c] bg-[#faf8f5] text-[#4b2e2e] outline-none text-xs px-2 py-1 rounded text-right"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#7f2c2c]/10 to-[#7f2c2c]/5 rounded-xl border border-[#7f2c2c]/10">
          <span className="text-sm font-semibold text-[#4b2e2e]">Total Amount</span>
          <span className="text-base font-bold text-[#7f2c2c]">Rs. {formatPrice(calculateTotal())}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {selectedOrder.status === "fo_combined" && (
            <>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                {submitting ? <FaSpinner className="animate-spin text-[10px]" /> : <FaCheckCircle className="text-[10px]" />}
                {submitting ? "Approving..." : "Approve & Lock Prices"}
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <FaTimesCircle className="text-[10px]" />
                Reject
              </button>
            </>
          )}
          {selectedOrder.status === "distributor_approved" && (
            <button
              onClick={async () => {
                const invoiceRes = await getNextInvoiceNumberApi('distributor');
                const invoiceNum = invoiceRes.success ? invoiceRes.invoiceNumber : '';
                setPaymentData({ ...paymentData, amount: calculateTotal(), invoiceNumber: invoiceNum });
                setShowPaymentForm(true);
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-[#7f2c2c] hover:bg-[#6d2525] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <FaDollarSign className="text-[10px]" />
              Pay Now
            </button>
          )}
          {selectedOrder.status === "payment_submitted" && (
            <div className="w-full flex items-center justify-center gap-2 bg-yellow-50 text-yellow-700 py-2.5 rounded-xl text-xs font-bold border border-yellow-200">
              <FaSpinner className="animate-spin text-[10px]" />
              Payment Submitted — Waiting for Confirmation
            </div>
          )}
          {selectedOrder.status === "payment_received" && (
            <div className="w-full flex items-center justify-center gap-2 bg-purple-50 text-purple-700 py-2.5 rounded-xl text-xs font-bold border border-purple-200">
              <FaTruck className="text-[10px]" />
              Payment Received — Stock Will Be Transferred
            </div>
          )}
          {selectedOrder.status === "stock_transferred" && (
            <div className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2.5 rounded-xl text-xs font-bold border border-blue-200">
              <FaCheckCircle className="text-[10px]" />
              Stock Transferred to FO
            </div>
          )}
          {selectedOrder.status === "completed" && (
            <div className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2.5 rounded-xl text-xs font-bold border border-green-200">
              <FaCheckCircle className="text-[10px]" />
              Order Completed
            </div>
          )}
        </div>

        <p className="text-[10px] text-gray-400 text-center">
          Once approved, per-unit prices are locked for FO and booker flow
        </p>
      </div>
    );
  };

  return (
    <div className="bg-[#E8F0F8] min-h-screen text-[#4b2e2e] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white shadow">
            <FaClipboardList className="text-sm" />
          </div>
          <h2 className="text-xl font-bold">FO Orders Management</h2>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedOrder(null); setShowDetailModal(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === tab.key
                  ? "bg-[#7f2c2c] text-white shadow"
                  : "bg-white text-[#7f2c2c] border border-[#7f2c2c]/20 hover:bg-[#7f2c2c]/10"
              }`}
            >
              {tab.label} ({tab.count})
              {tab.key === "orders" && pendingOrdersCount > 0 && activeTab !== "orders" && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
              )}
              {tab.key === "payments" && pendingPaymentsCount > 0 && activeTab !== "payments" && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Notification */}
      <AnimatePresence>
        {activeTab === "orders" && pendingOrdersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex items-center gap-3 shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <FaExclamationCircle className="text-sm" />
            </div>
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                {pendingOrdersCount} Order{pendingOrdersCount > 1 ? "s" : ""} Awaiting Approval
              </p>
              <p className="text-xs text-amber-600">Please review and confirm selling prices for the FO orders below.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ========== ORDERS TAB ========== */}
        {activeTab === "orders" && (
          <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaBoxOpen className="text-3xl mx-auto mb-2 text-[#7f2e2c]/30" />
                <p>No combined orders awaiting approval</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Order List — Desktop Table */}
                <div className="lg:col-span-3">
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full border border-[#7f2c2c]/15 rounded-xl overflow-hidden">
                      <thead className="bg-[#7f2c2c] text-white">
                        <tr>
                          {["FO", "Booker Orders", "Items", "Total Units", "Status", "Action"].map((h) => (
                            <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wide">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order, i) => {
                          const statusConfig = statusColors[order.status] || statusColors.fo_combined;
                          const totalUnits = order.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;
                          return (
                            <motion.tr
                              key={order._id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.03 }}
                              onClick={() => handleSelectOrder(order)}
                              className={`border-b border-[#7f2c2c]/10 hover:bg-[#7f2c2c]/5 transition-all cursor-pointer bg-white ${
                                selectedOrder?._id === order._id ? "bg-[#7f2c2c]/5" : ""
                              }`}
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                                    <FaUser className="text-[10px]" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{order.foId?.name || "Unknown"}</p>
                                    <p className="text-[10px] text-gray-400">{order.foId?.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-sm font-semibold">{order.linkedBookerOrders?.length || 0}</td>
                              <td className="p-3 text-sm">{order.items?.length || 0}</td>
                              <td className="p-3 text-sm font-semibold">{totalUnits}</td>
                              <td className="p-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                                  {statusConfig.label}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="inline-flex items-center gap-1 text-[#7f2c2c] text-xs font-semibold">
                                  <FaEye className="text-[10px]" /> View
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {orders.map((order, i) => {
                      const statusConfig = statusColors[order.status] || statusColors.fo_combined;
                      const totalUnits = order.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;
                      return (
                        <motion.div
                          key={order._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleSelectOrder(order)}
                          className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all ${
                            selectedOrder?._id === order._id ? "border-[#7f2c2c]" : "border-[#7f2c2c]/10"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                                <FaUser className="text-[10px]" />
                              </div>
                              <div>
                                <p className="text-sm font-bold">{order.foId?.name || "Unknown"}</p>
                                <p className="text-[10px] text-gray-400">{order.foId?.email}</p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                              {statusConfig.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                            <div className="bg-[#faf8f5] rounded-lg p-2 text-center">
                              <p className="text-gray-500 text-[10px]">Bookers</p>
                              <p className="font-semibold">{order.linkedBookerOrders?.length || 0}</p>
                            </div>
                            <div className="bg-[#faf8f5] rounded-lg p-2 text-center">
                              <p className="text-gray-500 text-[10px]">Items</p>
                              <p className="font-semibold">{order.items?.length || 0}</p>
                            </div>
                            <div className="bg-[#faf8f5] rounded-lg p-2 text-center">
                              <p className="text-gray-500 text-[10px]">Units</p>
                              <p className="font-semibold">{totalUnits}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400">
                              #{order._id.slice(-8).toUpperCase()}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#7f2c2c] text-xs font-semibold">
                              <FaEye className="text-[10px]" /> Tap to view
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Detail Panel — Desktop only */}
                <div className="hidden lg:block lg:col-span-2">
                  <AnimatePresence mode="wait">
                    {selectedOrder ? (
                      <motion.div
                        key={selectedOrder._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-white rounded-xl shadow-sm border border-[#7f2c2c]/10 p-5 sticky top-4"
                      >
                        <OrderDetailContent />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-xl shadow-sm border border-[#7f2c2c]/10 p-8 text-center"
                      >
                        <FaClipboardList className="text-3xl mx-auto mb-2 text-[#7f2c2c]/20" />
                        <p className="text-gray-500 text-sm">Select an order to view details and set selling prices</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ========== PAYMENTS TAB ========== */}
        {activeTab === "payments" && (
          <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {foPayments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaDollarSign className="text-3xl mx-auto mb-2 text-[#7f2c2c]/30" />
                <p>No pending FO payments</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full border border-[#7f2c2c]/15 rounded-xl overflow-hidden">
                    <thead className="bg-[#7f2c2c] text-white">
                      <tr>
                        {["FO Name", "Invoice #", "Amount", "Method", "Booker Orders", "Proof", "Status", "Action"].map((h) => (
                          <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {foPayments.map((payment, i) => {
                        const isCompleted = ["payment_received", "completed"].includes(payment.status);
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
                            <td className="p-3 text-xs font-medium">{payment.payment?.invoiceNumber || "N/A"}</td>
                            <td className="p-3 text-sm font-bold text-[#7f2c2c]">Rs. {formatPrice(payment.payment?.amount || payment.totalAmount || 0)}</td>
                            <td className="p-3 text-xs capitalize">{payment.payment?.method || "N/A"}</td>
                            <td className="p-3 text-xs">{payment.linkedBookerOrders?.length || 0} orders</td>
                            <td className="p-3">
                              {payment.payment?.proof ? (
                                <button
                                  onClick={() => setPreviewImage(getProofUrl(payment.payment.proof))}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold transition-all"
                                >
                                  <FaEye className="text-[10px]" /> View
                                </button>
                              ) : (
                                <span className="text-gray-300 text-xs">No Proof</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${isCompleted ? "bg-green-50 text-green-700 border border-green-200" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
                                {isCompleted ? <FaCheckCircle className="text-[10px]" /> : <FaSpinner className="animate-spin text-[10px]" />}
                                {isCompleted ? "Confirmed" : "Pending"}
                              </span>
                            </td>
                            <td className="p-3">
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold">
                                  <FaCheckCircle className="text-[10px]" /> Added to Sales
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleConfirmPayment(payment._id)}
                                  disabled={submitting}
                                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                                >
                                  {submitting ? <FaSpinner className="animate-spin text-[10px]" /> : <FaCheckCircle className="text-[10px]" />}
                                  {submitting ? "Processing..." : "Confirm"}
                                </button>
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
                  {foPayments.map((payment, i) => {
                    const isCompleted = ["payment_received", "completed"].includes(payment.status);
                    return (
                      <motion.div
                        key={payment._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-xl shadow-sm border border-[#7f2c2c]/10 p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                              <FaUser className="text-[10px]" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{payment.foId?.name || "N/A"}</p>
                              <p className="text-[10px] text-gray-400">{payment.payment?.invoiceNumber || "N/A"}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${isCompleted ? "bg-green-50 text-green-700 border border-green-200" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
                            {isCompleted ? "Confirmed" : "Pending"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="bg-[#faf8f5] rounded-lg p-2">
                            <p className="text-gray-500 text-[10px]">Amount</p>
                            <p className="font-bold text-[#7f2c2c]">Rs. {formatPrice(payment.payment?.amount || payment.totalAmount || 0)}</p>
                          </div>
                          <div className="bg-[#faf8f5] rounded-lg p-2">
                            <p className="text-gray-500 text-[10px]">Method</p>
                            <p className="font-medium capitalize">{payment.payment?.method || "N/A"}</p>
                          </div>
                          <div className="bg-[#faf8f5] rounded-lg p-2">
                            <p className="text-gray-500 text-[10px]">Booker Orders</p>
                            <p className="font-medium">{payment.linkedBookerOrders?.length || 0}</p>
                          </div>
                          <div className="bg-[#faf8f5] rounded-lg p-2">
                            <p className="text-gray-500 text-[10px]">Proof</p>
                            {payment.payment?.proof ? (
                              <button
                                onClick={() => setPreviewImage(getProofUrl(payment.payment.proof))}
                                className="inline-flex items-center gap-1 text-blue-600 text-xs font-semibold"
                              >
                                <FaEye className="text-[10px]" /> View
                              </button>
                            ) : (
                              <span className="text-gray-300 text-xs">No Proof</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold">
                              <FaCheckCircle className="text-[10px]" /> Added to Sales
                            </span>
                          ) : (
                            <button
                              onClick={() => handleConfirmPayment(payment._id)}
                              disabled={submitting}
                              className="w-full inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              {submitting ? <FaSpinner className="animate-spin text-[10px]" /> : <FaCheckCircle className="text-[10px]" />}
                              {submitting ? "Processing..." : "Confirm & Add to Sales"}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== ORDER DETAIL MODAL (Mobile) ========== */}
      <AnimatePresence>
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 lg:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-[#4b2e2e] p-5 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Order Details</h3>
                <button
                  onClick={() => { setShowDetailModal(false); setSelectedOrder(null); }}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"
                >
                  <FaTimesCircle className="text-sm" />
                </button>
              </div>
              <OrderDetailContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========== PAYMENT MODAL ========== */}
      <AnimatePresence>
        {showPaymentForm && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
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

              <p className="text-sm text-gray-600">
                Order Total: <span className="font-bold text-[#7f2c2c]">Rs. {formatPrice(calculateTotal())}</span>
              </p>

              <div className="p-3 bg-[#f5e0c3]/30 border border-[#7f2c2c]/15 rounded-xl flex items-center gap-2">
                <FaFileInvoice className="text-[#7f2c2c]" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Invoice</p>
                  <p className="text-sm font-bold">{paymentData.invoiceNumber || "Generating..."}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Amount (Rs.)</label>
                <input
                  type="number"
                  value={paymentData.amount || calculateTotal()}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: roundPrice(e.target.value) })}
                  className="w-full p-2.5 border-[3px] border-[#7f2c2c] bg-[#faf8f5] text-[#4b2e2e] outline-none text-sm"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Payment Method</label>
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
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Payment Proof Image *</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPaymentProof(e.target.files[0])}
                    className="w-full p-2 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#7f2c2c] file:text-white file:text-xs file:font-semibold"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Upload screenshot or image of payment proof</p>
                {paymentProof && <p className="text-xs text-green-600 mt-1">Selected: {paymentProof.name}</p>}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  <FaTimesCircle className="text-[10px]" />
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-[#7f2c2c] hover:bg-[#6d2525] text-white py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                >
                  {submitting ? <FaSpinner className="animate-spin text-[10px]" /> : <FaCheckCircle className="text-[10px]" />}
                  {submitting ? "Submitting..." : "Submit Payment"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========== IMAGE PREVIEW MODAL ========== */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-[70] p-4"
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

export default DistributorOrderApproval;





