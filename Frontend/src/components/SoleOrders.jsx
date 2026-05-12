import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaDollarSign,
  FaBoxOpen,
  FaClipboardList,
  FaFilter,
  FaSpinner,
  FaEye,
} from "react-icons/fa";
import {
  getPendingOrdersApi,
  approveStockApi,
  confirmPaymentApi,
  cancelOrderApi,
  getOrdersApi,
} from "../api/api";

const SoleOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [approvalInputs, setApprovalInputs] = useState({});
  const [activeFilter, setActiveFilter] = useState("pending");
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchOrders = async (filter = "pending") => {
    setLoading(true);
    try {
      let res;
      if (filter === "pending") {
        res = await getOrdersApi("pending");
      } else if (filter === "completed") {
        res = await getOrdersApi("completed");
      } else if (filter === "canceled") {
        res = await getOrdersApi("canceled");
      } else {
        res = await getOrdersApi("all");
      }
      if (res.success) setOrders(res.orders || []);
      else setOrders([]);
    } catch (err) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeFilter);
  }, []);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentOrderId(null);
    fetchOrders(filter);
  };

  const handleInputChange = (orderId, field, value) => {
    setApprovalInputs((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], [field]: value },
    }));
  };

  const handleApproveStock = async (order) => {
    const inputs = approvalInputs[order._id] || {};
    const sellingPrice = Number(inputs.sellingPrice);
    const discount = Number(inputs.discount || 0);
    const deliveryCharges = Number(inputs.deliveryCharges || 0);
    const quantity = Number(inputs.quantity || order.quantity || 0);
    const availableQty = order.itemId?.quantity || 0;

    if (!sellingPrice || sellingPrice <= 0)
      return toast.error("Selling price required");
    if (!quantity || quantity <= 0) return toast.error("Quantity must be > 0");
    if (quantity > availableQty)
      return toast.error(
        `Quantity cannot exceed available stock (${availableQty})`
      );

    setSubmitting(true);
    const res = await approveStockApi(order._id, {
      sellingPrice,
      discount,
      deliveryCharges,
      quantity,
    });
    setSubmitting(false);

    if (res.success) {
      toast.success("Stock approved! ✅");
      setCurrentOrderId(null);
      setApprovalInputs((prev) => ({ ...prev, [order._id]: {} }));
      fetchOrders(activeFilter);
    } else {
      toast.error(res.message);
    }
  };

  const handleConfirmPayment = async (orderId) => {
    if (!window.confirm("Confirm payment and complete this order?")) return;
    setSubmitting(true);
    const res = await confirmPaymentApi(orderId);
    setSubmitting(false);
    if (res.success) {
      toast.success("Payment confirmed, order completed! 🎉");
      fetchOrders(activeFilter);
    } else {
      toast.error(res.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setSubmitting(true);
    const res = await cancelOrderApi(orderId);
    setSubmitting(false);
    if (res.success) {
      toast.success("Order canceled!");
      fetchOrders(activeFilter);
    } else {
      toast.error(res.message);
    }
  };

  const statusColors = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Pending" },
    stockApproved: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Stock Approved" },
    paymentSubmitted: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Payment Submitted" },
    payment_submitted: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Payment Submitted" },
    completed: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Completed" },
    canceled: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Canceled" },
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#4b2e2e]">
        <FaSpinner className="animate-spin text-3xl mb-2 text-[#7f2c2c]" />
        <p className="font-medium">Loading orders...</p>
      </div>
    );

  return (
    <div className="bg-[#E8F0F8] min-h-screen text-[#4b2e2e] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white shadow">
            <FaClipboardList className="text-sm" />
          </div>
          <h2 className="text-xl font-bold">Orders</h2>
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
              {["Distributor", "Item", "Qty", "Purchase", "Selling", "Discount", "Delivery", "Total", "Status", "Action"].map((h) => (
                <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const inputs = approvalInputs[order._id] || {};
              const qty = Number(inputs.quantity || order.quantity || 0);
              const sellingPrice = Number(inputs.sellingPrice || order.sellingPrice || 0);
              const discount = Number(inputs.discount || order.discount || 0);
              const deliveryCharges = Number(inputs.deliveryCharges || order.deliveryCharges || 0);
              const total = sellingPrice * qty - discount + deliveryCharges;
              const availableQty = order.itemId?.quantity || 0;
              const statusConfig = statusColors[order.status] || statusColors.pending;
              const isEditing = currentOrderId === order._id;

              return (
                <motion.tr
                  key={order._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`border-b border-[#7f2c2c]/10 hover:bg-[#7f2c2c]/5 transition-all ${
                    qty > availableQty ? "bg-red-50" : "bg-white"
                  }`}
                >
                  <td className="p-3 text-sm font-medium">{order.distributorId?.name || "N/A"}</td>
                  <td className="p-3 text-sm">{order.itemId?.itemName || "N/A"}</td>
                  <td className="p-3 text-sm">
                    {isEditing && order.status === "pending" ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max={availableQty}
                          value={qty}
                          onChange={(e) => handleInputChange(order._id, "quantity", e.target.value)}
                          className="w-16 p-1.5 border-[3px] border-[#7f2c2c] bg-transparent text-xs outline-none"
                        />
                        <span className="text-[10px] text-gray-500">/ {availableQty}</span>
                      </div>
                    ) : (
                      <span>{qty} <span className="text-gray-400 text-xs">/ {availableQty}</span></span>
                    )}
                  </td>
                  <td className="p-3 text-sm">Rs. {order.itemId?.purchasePrice || 0}</td>
                  <td className="p-3 text-sm">
                    {isEditing && order.status === "pending" ? (
                      <input
                        type="number"
                        placeholder="Price"
                        value={inputs.sellingPrice || ""}
                        onChange={(e) => handleInputChange(order._id, "sellingPrice", e.target.value)}
                        className="w-20 p-1.5 border-[3px] border-[#7f2c2c] bg-transparent text-xs outline-none"
                      />
                    ) : (
                      `Rs. ${sellingPrice}`
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    {isEditing && order.status === "pending" ? (
                      <input
                        type="number"
                        placeholder="0"
                        value={inputs.discount || ""}
                        onChange={(e) => handleInputChange(order._id, "discount", e.target.value)}
                        className="w-16 p-1.5 border-[3px] border-[#7f2c2c] bg-transparent text-xs outline-none"
                      />
                    ) : (
                      `Rs. ${discount}`
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    {isEditing && order.status === "pending" ? (
                      <input
                        type="number"
                        placeholder="0"
                        value={inputs.deliveryCharges || ""}
                        onChange={(e) => handleInputChange(order._id, "deliveryCharges", e.target.value)}
                        className="w-16 p-1.5 border-[3px] border-[#7f2c2c] bg-transparent text-xs outline-none"
                      />
                    ) : (
                      `Rs. ${deliveryCharges}`
                    )}
                  </td>
                  <td className="p-3 text-sm font-bold text-[#7f2c2c]">Rs. {total}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1.5">
                      {order.status === "pending" && (
                        <>
                          {!isEditing ? (
                            <button
                              onClick={() => setCurrentOrderId(order._id)}
                              className="inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              <FaCheckCircle className="text-[10px]" />
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApproveStock(order)}
                              disabled={submitting}
                              className="inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-60"
                            >
                              {submitting ? <FaSpinner className="animate-spin text-[10px]" /> : <FaCheckCircle className="text-[10px]" />}
                              {submitting ? "..." : "Approve"}
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            disabled={submitting}
                            className="inline-flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-60"
                          >
                            <FaTimesCircle className="text-[10px]" />
                            Cancel
                          </button>
                        </>
                      )}
                      {(order.status === "paymentSubmitted" || order.status === "payment_submitted") && (
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => handleConfirmPayment(order._id)}
                            disabled={submitting}
                            className="inline-flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-60"
                          >
                            {submitting ? <FaSpinner className="animate-spin text-[10px]" /> : <FaCheckCircle className="text-[10px]" />}
                            {submitting ? "..." : "Complete"}
                          </button>
                          {order.payment?.proof && (
                            <button
                              onClick={() => setPreviewImage(`http://localhost:5000/uploads/${order.payment.proof}`)}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold transition-all"
                            >
                              <FaEye className="text-[10px]" /> View Proof
                            </button>
                          )}
                        </div>
                      )}
                      {order.status === "stockApproved" && (
                        <span className="text-xs text-blue-600 font-medium">Waiting for Payment</span>
                      )}
                      {order.status === "completed" && (
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold">
                            <FaCheckCircle /> Completed
                          </span>
                          {order.payment?.proof && (
                            <button
                              onClick={() => setPreviewImage(`http://localhost:5000/uploads/${order.payment.proof}`)}
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
          const inputs = approvalInputs[order._id] || {};
          const qty = Number(inputs.quantity || order.quantity || 0);
          const sellingPrice = Number(inputs.sellingPrice || order.sellingPrice || 0);
          const discount = Number(inputs.discount || order.discount || 0);
          const deliveryCharges = Number(inputs.deliveryCharges || order.deliveryCharges || 0);
          const total = sellingPrice * qty - discount + deliveryCharges;
          const availableQty = order.itemId?.quantity || 0;
          const statusConfig = statusColors[order.status] || statusColors.pending;
          const isEditing = currentOrderId === order._id;

          return (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-[#7f2c2c]/10 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">{order.distributorId?.name || "N/A"}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{order.itemId?.itemName || "N/A"}</p>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-[#faf8f5] rounded-lg p-2">
                  <p className="text-gray-500">Qty</p>
                  {isEditing && order.status === "pending" ? (
                    <input
                      type="number"
                      min="1"
                      max={availableQty}
                      value={qty}
                      onChange={(e) => handleInputChange(order._id, "quantity", e.target.value)}
                      className="w-full p-1 border-[3px] border-[#7f2c2c] bg-transparent text-xs outline-none mt-1"
                    />
                  ) : (
                    <p className="font-semibold">{qty} / {availableQty}</p>
                  )}
                </div>
                <div className="bg-[#faf8f5] rounded-lg p-2">
                  <p className="text-gray-500">Purchase</p>
                  <p className="font-semibold">Rs. {order.itemId?.purchasePrice || 0}</p>
                </div>
                <div className="bg-[#faf8f5] rounded-lg p-2">
                  <p className="text-gray-500">Selling</p>
                  {isEditing && order.status === "pending" ? (
                    <input
                      type="number"
                      placeholder="Price"
                      value={inputs.sellingPrice || ""}
                      onChange={(e) => handleInputChange(order._id, "sellingPrice", e.target.value)}
                      className="w-full p-1 border-[3px] border-[#7f2c2c] bg-transparent text-xs outline-none mt-1"
                    />
                  ) : (
                    <p className="font-semibold">Rs. {sellingPrice}</p>
                  )}
                </div>
                <div className="bg-[#faf8f5] rounded-lg p-2">
                  <p className="text-gray-500">Total</p>
                  <p className="font-bold text-[#7f2c2c]">Rs. {total}</p>
                </div>
              </div>

              {isEditing && order.status === "pending" && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#faf8f5] rounded-lg p-2">
                    <p className="text-gray-500 text-xs">Discount</p>
                    <input
                      type="number"
                      placeholder="0"
                      value={inputs.discount || ""}
                      onChange={(e) => handleInputChange(order._id, "discount", e.target.value)}
                      className="w-full p-1 border-[3px] border-[#7f2c2c] bg-transparent text-xs outline-none mt-1"
                    />
                  </div>
                  <div className="bg-[#faf8f5] rounded-lg p-2">
                    <p className="text-gray-500 text-xs">Delivery</p>
                    <input
                      type="number"
                      placeholder="0"
                      value={inputs.deliveryCharges || ""}
                      onChange={(e) => handleInputChange(order._id, "deliveryCharges", e.target.value)}
                      className="w-full p-1 border-[3px] border-[#7f2c2c] bg-transparent text-xs outline-none mt-1"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {order.status === "pending" && (
                  <>
                    {!isEditing ? (
                      <button
                        onClick={() => setCurrentOrderId(order._id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        <FaCheckCircle className="text-[10px]" />
                        Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApproveStock(order)}
                        disabled={submitting}
                        className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-60"
                      >
                        {submitting ? <FaSpinner className="animate-spin text-[10px]" /> : <FaCheckCircle className="text-[10px]" />}
                        {submitting ? "..." : "Approve"}
                      </button>
                    )}
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      disabled={submitting}
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-60"
                    >
                      <FaTimesCircle className="text-[10px]" />
                      Cancel
                    </button>
                  </>
                )}
                {(order.status === "paymentSubmitted" || order.status === "payment_submitted") && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleConfirmPayment(order._id)}
                      disabled={submitting}
                      className="w-full inline-flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-60"
                    >
                      {submitting ? <FaSpinner className="animate-spin text-[10px]" /> : <FaCheckCircle className="text-[10px]" />}
                      {submitting ? "Completing..." : "Complete Order"}
                    </button>
                    {order.payment?.proof && (
                      <button
                        onClick={() => setPreviewImage(`http://localhost:5000/uploads/${order.payment.proof}`)}
                        className="w-full inline-flex items-center justify-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold transition-all py-1"
                      >
                        <FaEye className="text-[10px]" /> View Proof
                      </button>
                    )}
                  </div>
                )}
                {order.status === "stockApproved" && (
                  <span className="w-full text-center text-xs text-blue-600 font-medium py-2">Waiting for Payment</span>
                )}
                {order.status === "completed" && (
                  <div className="flex flex-col gap-2">
                    <span className="w-full inline-flex items-center justify-center gap-1 text-green-600 text-xs font-bold py-2">
                      <FaCheckCircle /> Completed
                    </span>
                    {order.payment?.proof && (
                      <button
                        onClick={() => setPreviewImage(`http://localhost:5000/uploads/${order.payment.proof}`)}
                        className="w-full inline-flex items-center justify-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold transition-all py-1"
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
          <FaClipboardList className="text-3xl mx-auto mb-2 text-[#7f2c2c]/30" />
          <p>No orders found.</p>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#4b2e2e]">Payment Proof</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <img
                src={previewImage}
                alt="Payment Proof"
                className="max-w-full h-auto rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoleOrders;

