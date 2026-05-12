import { useEffect, useState } from "react";
import { getFOPaymentPendingApi } from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaDollarSign,
  FaSpinner,
  FaStore,
  FaUser,
  FaFileInvoice,
  FaClock,
  FaExclamationCircle,
  FaFilter,
} from "react-icons/fa";
import { formatPrice, calculateOrderTotal, roundPrice } from "../utils/pricing";

const FODistributedPayments = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0,
  });
  const [activeTab, setActiveTab] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    const res = await getFOPaymentPendingApi();
    if (res.success) {
      setOrders(res.data || []);
      setSummary(res.summary || {
        totalOrders: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        paidCount: 0,
        pendingCount: 0,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusColors = {
    distributed: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: "Distributed" },
    delivered: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Delivered" },
    payment_submitted: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "Payment Submitted" },
    payment_confirmed: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", label: "Confirmed" },
    payment_sent_to_distributor: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Sent to Dist." },
    payment_received: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Received" },
    completed: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Completed" },
  };

  const paymentStatusColors = {
    paid: { bg: "bg-green-50", text: "text-green-700", label: "Paid" },
    pending: { bg: "bg-red-50", text: "text-red-700", label: "Pending" },
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "paid") return order.paymentStatus === "paid";
    if (activeTab === "pending") return order.paymentStatus === "pending";
    return true;
  });

  const getTabCount = (tab) => {
    if (tab === "all") return orders.length;
    if (tab === "paid") return orders.filter((o) => o.paymentStatus === "paid").length;
    if (tab === "pending") return orders.filter((o) => o.paymentStatus === "pending").length;
    return 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#4b2e2e]">
        <FaSpinner className="animate-spin text-3xl mb-2 text-[#7f2c2c]" />
        <p className="font-medium">Loading payment records...</p>
      </div>
    );
  }

  const tabs = [
    { key: "all", label: "All Orders", count: getTabCount("all") },
    { key: "paid", label: "Paid", count: getTabCount("paid") },
    { key: "pending", label: "Pending", count: getTabCount("pending") },
  ];

  return (
    <div className="bg-[#E8F0F8] min-h-screen text-[#4b2e2e] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white shadow">
            <FaClipboardList className="text-sm" />
          </div>
          <h2 className="text-xl font-bold">Distributed Payments</h2>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#7f2c2c]/10">
          <div className="flex items-center gap-2 mb-1">
            <FaClipboardList className="text-[#7f2c2c] text-sm" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Orders</span>
          </div>
          <p className="text-xl font-bold text-[#7f2c2c]">{summary.totalOrders}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#7f2c2c]/10">
          <div className="flex items-center gap-2 mb-1">
            <FaDollarSign className="text-[#7f2c2c] text-sm" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Amount</span>
          </div>
          <p className="text-xl font-bold text-[#7f2c2c]">Rs. {formatPrice(summary.totalAmount)}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <FaCheckCircle className="text-green-600 text-sm" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Paid</span>
          </div>
          <p className="text-xl font-bold text-green-600">Rs. {formatPrice(summary.paidAmount)}</p>
          <p className="text-xs text-green-600">{summary.paidCount} orders</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <FaExclamationCircle className="text-red-600 text-sm" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Pending</span>
          </div>
          <p className="text-xl font-bold text-red-600">Rs. {formatPrice(summary.pendingAmount)}</p>
          <p className="text-xs text-red-600">{summary.pendingCount} orders</p>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FaClipboardList className="text-3xl mx-auto mb-2 text-[#7f2c2c]/30" />
          <p>
            {activeTab === "all"
              ? "No distributed orders yet"
              : activeTab === "paid"
              ? "No paid orders"
              : "No pending payments"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border border-[#7f2c2c]/15 rounded-xl overflow-hidden">
              <thead className="bg-[#7f2c2c] text-white">
                <tr>
                  {["Booker", "Shop", "Items", "Total", "Payment Status", "Order Status"].map((h) => (
                    <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, i) => {
                  const total = calculateOrderTotal({
                    items: order.items,
                    discount: order.discount,
                    deliveryCharges: order.deliveryCharges,
                  });
                  const statusConfig = statusColors[order.status] || statusColors.distributed;
                  const paymentConfig = paymentStatusColors[order.paymentStatus] || paymentStatusColors.pending;

                  return (
                    <motion.tr
                      key={order._id}
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
                          <span className="text-sm font-medium">{order.bookerName || "N/A"}</span>
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
                      <td className="p-3 text-sm font-bold text-[#7f2c2c]">
                        Rs. {formatPrice(order.totalAmount)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${paymentConfig.bg} ${paymentConfig.text} border ${paymentConfig.bg.replace("50", "200")}`}
                        >
                          {order.paymentStatus === "paid" ? (
                            <FaCheckCircle className="text-[10px]" />
                          ) : (
                            <FaClock className="text-[10px]" />
                          )}
                          {paymentConfig.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
                        >
                          {statusConfig.label}
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
            {filteredOrders.map((order, i) => {
              const total = calculateOrderTotal({
                items: order.items,
                discount: order.discount,
                deliveryCharges: order.deliveryCharges,
              });
              const statusConfig = statusColors[order.status] || statusColors.distributed;
              const paymentConfig = paymentStatusColors[order.paymentStatus] || paymentStatusColors.pending;

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
                      <div className="w-7 h-7 rounded-full bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                        <FaUser className="text-[10px]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{order.bookerName || "N/A"}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <FaStore /> {order.shopName || "-"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${paymentConfig.bg} ${paymentConfig.text} border ${paymentConfig.bg.replace("50", "200")}`}
                    >
                      {paymentConfig.label}
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
                      <p className="font-bold text-[#7f2c2c]">Rs. {formatPrice(order.totalAmount)}</p>
                    </div>
                    <div className="bg-[#faf8f5] rounded-lg p-2">
                      <p className="text-gray-500 text-[10px]">Status</p>
                      <p className="font-medium text-gray-600">{statusConfig.label}</p>
                    </div>
                  </div>

                  {order.payment && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-[#faf8f5] rounded-lg p-2">
                      <FaFileInvoice className="text-[10px]" />
                      <span>{order.payment.invoiceNumber || "No invoice"}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default FODistributedPayments;
