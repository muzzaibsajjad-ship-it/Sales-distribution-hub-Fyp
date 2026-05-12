import { useEffect, useState } from "react";
import {
  getFOBookerOrdersApi,
  getFOCombinedOrdersApi,
  combineBookerOrdersApi,
  transferStockToFOApi,
  distributeToBookerApi,
} from "../api/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "../utils/pricing";
import {
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaBoxOpen,
  FaSpinner,
  FaStore,
  FaMapMarkerAlt,
  FaRoute,
  FaUser,
  FaPlus,
  FaArrowRight,
  FaTruck,
} from "react-icons/fa";

const FOOrderManagement = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [combinedOrders, setCombinedOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [processingId, setProcessingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    const pendingRes = await getFOBookerOrdersApi();
    if (pendingRes.success) {
      setPendingOrders(pendingRes.data);
    }

    const combinedRes = await getFOCombinedOrdersApi();
    if (combinedRes.success) {
      const allCombined = combinedRes.data || [];
      const activeStatuses = ["distributor_approved", "stock_transferred", "payment_submitted_to_distributor"];
      const completedStatuses = ["payment_received", "completed"];
      setCombinedOrders(allCombined.filter((o) => activeStatuses.includes(o.status)));
      setCompletedOrders(allCombined.filter((o) => completedStatuses.includes(o.status)));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const selectAll = () => {
    if (selectedOrders.length === pendingOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(pendingOrders.map((o) => o._id));
    }
  };

  const handleCombine = async () => {
    if (selectedOrders.length < 2) {
      toast.error("Select at least 2 orders to combine");
      return;
    }
    setProcessingId("combine");
    const res = await combineBookerOrdersApi(selectedOrders);
    if (res.success) {
      toast.success("Orders combined successfully!", { autoClose: 1500 });
      setSelectedOrders([]);
      await fetchOrders();
      setActiveTab("combined");
    } else {
      toast.error(res.message || "Failed to combine orders");
    }
    setProcessingId(null);
  };

  const handleTransferStock = async (orderId) => {
    setProcessingId(orderId);
    const res = await transferStockToFOApi(orderId);
    if (res.success) {
      toast.success("Stock transferred to you!", { autoClose: 1500 });
      await fetchOrders();
    } else {
      toast.error(res.message || "Failed to transfer stock");
    }
    setProcessingId(null);
  };

  const handleDistributeToBooker = async (orderId, bookerOrderId) => {
    setProcessingId(`${orderId}-${bookerOrderId}`);
    const res = await distributeToBookerApi(orderId, bookerOrderId);
    if (res.success) {
      toast.success("Stock distributed to booker!", { autoClose: 1500 });
      await fetchOrders();
    } else {
      toast.error(res.message || "Failed to distribute stock");
    }
    setProcessingId(null);
  };

  const statusColors = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Pending" },
    fo_combined: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Combined" },
    distributor_approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Approved" },
    stock_transferred: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Stock Received" },
    distributed: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: "Distributed" },
    payment_submitted: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", label: "Payment Submitted" },
    payment_confirmed: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", label: "Payment Confirmed" },
    payment_submitted_to_distributor: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "Sent to Distributor" },
    payment_received: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Payment Received" },
    completed: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Completed" },
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#4b2e2e]">
        <FaSpinner className="animate-spin text-3xl mb-2 text-[#7f2c2c]" />
        <p className="font-medium">Loading orders...</p>
      </div>
    );
  }

  const tabs = [
    { key: "pending", label: "Pending", count: pendingOrders.length },
    { key: "combined", label: "Combined", count: combinedOrders.length },
    { key: "completed", label: "Completed", count: completedOrders.length },
  ];

  return (
    <div className="bg-[#E8F0F8] min-h-screen text-[#4b2e2e] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white shadow">
            <FaClipboardList className="text-sm" />
          </div>
          <h2 className="text-xl font-bold">FO Order Management</h2>
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

      <AnimatePresence mode="wait">
        {/* PENDING TAB */}
        {activeTab === "pending" && (
          <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {pendingOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaClipboardList className="text-3xl mx-auto mb-2 text-[#7f2c2c]/30" />
                <p>No pending booker orders</p>
              </div>
            ) : (
              <>
                {/* Select & Combine Bar */}
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                  <button
                    onClick={selectAll}
                    className="text-xs font-semibold text-[#7f2c2c] hover:underline flex items-center gap-1"
                  >
                    <FaCheckCircle className="text-[10px]" />
                    {selectedOrders.length === pendingOrders.length ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    onClick={handleCombine}
                    disabled={selectedOrders.length < 2 || processingId === "combine"}
                    className="inline-flex items-center gap-1 bg-[#7f2c2c] hover:bg-[#6d2525] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    {processingId === "combine" ? (
                      <FaSpinner className="animate-spin text-[10px]" />
                    ) : (
                      <FaPlus className="text-[10px]" />
                    )}
                    Combine Selected ({selectedOrders.length})
                  </button>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full border border-[#7f2c2c]/15 rounded-xl overflow-hidden">
                    <thead className="bg-[#7f2c2c] text-white">
                      <tr>
                        {["Select", "Booker", "Shop", "Items", "Area / Route", "Status"].map((h) => (
                          <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOrders.map((order) => {
                        const statusConfig = statusColors[order.status] || statusColors.pending;
                        return (
                          <motion.tr
                            key={order._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`border-b border-[#7f2c2c]/10 hover:bg-[#7f2c2c]/5 transition-all bg-white ${
                              selectedOrders.includes(order._id) ? "bg-[#7f2c2c]/5" : ""
                            }`}
                          >
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={selectedOrders.includes(order._id)}
                                onChange={() => toggleSelectOrder(order._id)}
                                className="w-4 h-4 accent-[#7f2c2c] cursor-pointer"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                                  <FaUser className="text-[10px]" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{order.bookerId?.name || "Unknown"}</p>
                                  <p className="text-[10px] text-gray-400">{order.bookerId?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5 text-sm">
                                <FaStore className="text-gray-400 text-[10px]" />
                                <span className="font-medium">{order.shopName || "-"}</span>
                              </div>
                              {order.shopAddress && (
                                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                  <FaMapMarkerAlt className="text-[8px]" />
                                  {order.shopAddress}
                                </p>
                              )}
                            </td>
                            <td className="p-3">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-medium">{item.productName}</span>
                                  <span className="text-gray-400 ml-1">{formatOrderedQty(item)}</span>
                                </div>
                              ))}
                            </td>
                            <td className="p-3 text-xs">
                              {order.areaId?.name && (
                                <p className="flex items-center gap-1 text-gray-500">
                                  <FaMapMarkerAlt className="text-[8px]" />
                                  {order.areaId.name}
                                </p>
                              )}
                              {order.routeId && (
                                <p className="flex items-center gap-1 text-gray-500 mt-0.5">
                                  <FaRoute className="text-[8px]" />
                                  {order.routeId}
                                </p>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
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
                  {pendingOrders.map((order) => {
                    const statusConfig = statusColors[order.status] || statusColors.pending;
                    return (
                      <motion.div
                        key={order._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white rounded-xl shadow-sm border p-4 ${
                          selectedOrders.includes(order._id) ? "border-[#7f2c2c]" : "border-[#7f2c2c]/10"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order._id)}
                              onChange={() => toggleSelectOrder(order._id)}
                              className="w-4 h-4 accent-[#7f2c2c]"
                            />
                            <div>
                              <p className="text-sm font-bold">{order.bookerId?.name || "Unknown"}</p>
                              <p className="text-[10px] text-gray-400">{order.bookerId?.email}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        {order.shopName && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                            <FaStore className="text-[10px] text-gray-400" />
                            <span className="font-medium">{order.shopName}</span>
                          </div>
                        )}

                        <div className="space-y-1 mb-3">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs bg-[#faf8f5] rounded-lg p-2">
                              <span className="font-medium">{item.productName}</span>
                              <span className="text-gray-500">{formatOrderedQty(item)}</span>
                            </div>
                          ))}
                        </div>

                        {(order.areaId?.name || order.routeId) && (
                          <div className="flex gap-3 text-[10px] text-gray-400 mb-1">
                            {order.areaId?.name && (
                              <span className="flex items-center gap-1">
                                <FaMapMarkerAlt /> {order.areaId.name}
                              </span>
                            )}
                            {order.routeId && (
                              <span className="flex items-center gap-1">
                                <FaRoute /> {order.routeId}
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* COMBINED TAB */}
        {activeTab === "combined" && (
          <motion.div key="combined" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {combinedOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaBoxOpen className="text-3xl mx-auto mb-2 text-[#7f2c2c]/30" />
                <p>No combined orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {combinedOrders.map((order) => {
                  const statusConfig = statusColors[order.status] || statusColors.pending;
                  return (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-sm border border-[#7f2c2c]/10 p-4 md:p-5"
                    >
                      {/* Header */}
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                              <FaClipboardList className="text-xs" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">Combined Order #{order._id.slice(-8).toUpperCase()}</p>
                              <p className="text-[10px] text-gray-400">
                                Distributor: {order.distributorId?.name || "Unknown"} · {order.linkedBookerOrders?.length || 0} booker orders
                              </p>
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="bg-[#faf8f5] rounded-xl p-3 mb-4">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
                        <div className="space-y-1.5">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="font-medium text-[#4b2e2e]">{item.productName}</span>
                              <span className="text-gray-500 text-xs">{formatOrderedQty(item)} @ Rs. {formatPrice(item.sellingPrice)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex justify-between items-center mb-4 p-3 bg-gradient-to-r from-[#7f2c2c]/10 to-[#7f2c2c]/5 rounded-xl border border-[#7f2c2c]/10">
                        <span className="text-sm font-semibold text-[#4b2e2e]">Total Amount</span>
                        <span className="text-base font-bold text-[#7f2c2c]">Rs. {formatPrice(order.totalAmount)}</span>
                      </div>

                      {/* Actions */}
                      {order.status === "distributor_approved" && (
                        <button
                          onClick={() => handleTransferStock(order._id)}
                          disabled={processingId === order._id}
                          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          {processingId === order._id ? (
                            <FaSpinner className="animate-spin text-[10px]" />
                          ) : (
                            <FaTruck className="text-[10px]" />
                          )}
                          {processingId === order._id ? "Transferring..." : "Transfer Stock to Me"}
                        </button>
                      )}

                      {order.status === "stock_transferred" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-600 text-xs font-bold mb-2">
                            <FaCheckCircle className="text-sm" />
                            Stock received! Now distribute to bookers.
                          </div>
                          {order.linkedBookerOrders?.map((bookerOrder) => (
                            <div
                              key={bookerOrder._id}
                              className="flex flex-wrap justify-between items-center p-3 bg-[#faf8f5] rounded-xl border border-[#7f2c2c]/10"
                            >
                              <div>
                                <p className="text-sm font-medium text-[#4b2e2e]">{bookerOrder.shopName || "Booker Order"}</p>
                                <p className="text-[10px] text-gray-400">
                                  {bookerOrder.status === "completed"
                                    ? "Payment Sent to Distributor"
                                    : statusColors[bookerOrder.status]?.label || bookerOrder.status}
                                </p>
                              </div>
                              {bookerOrder.status === "stock_transferred" && (
                                <button
                                  onClick={() => handleDistributeToBooker(order._id, bookerOrder._id)}
                                  disabled={processingId === `${order._id}-${bookerOrder._id}`}
                                  className="inline-flex items-center gap-1 bg-[#7f2c2c] hover:bg-[#6d2525] disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                >
                                  {processingId === `${order._id}-${bookerOrder._id}` ? (
                                    <FaSpinner className="animate-spin text-[10px]" />
                                  ) : (
                                    <FaArrowRight className="text-[10px]" />
                                  )}
                                  Distribute
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {order.status === "payment_submitted_to_distributor" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-orange-600 text-xs font-bold mb-2">
                            <FaCheckCircle className="text-sm" />
                            Payment sent to distributor! Waiting for confirmation.
                          </div>
                          {order.linkedBookerOrders?.map((bookerOrder) => (
                            <div
                              key={bookerOrder._id}
                              className="flex justify-between items-center p-3 bg-[#faf8f5] rounded-xl border border-[#7f2c2c]/10"
                            >
                              <div>
                                <p className="text-sm font-medium text-[#4b2e2e]">{bookerOrder.shopName || "Booker Order"}</p>
                                <p className="text-[10px] text-gray-400">Status: Payment Sent to Distributor</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* COMPLETED TAB */}
        {activeTab === "completed" && (
          <motion.div key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {completedOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaCheckCircle className="text-3xl mx-auto mb-2 text-[#7f2c2c]/30" />
                <p>No completed orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedOrders.map((order) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-green-200/60 p-4 md:p-5"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                          <FaCheckCircle className="text-xs" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Combined Order #{order._id.slice(-8).toUpperCase()}</p>
                          <p className="text-[10px] text-gray-400">
                            {order.distributorId?.name || "Unknown"} · {new Date(order.createdAt).toLocaleDateString("en-PK")}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-200">
                        Completed
                      </span>
                    </div>

                    <div className="bg-[#faf8f5] rounded-xl p-3 mb-3">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="font-medium text-[#4b2e2e]">{item.productName}</span>
                          <span className="text-gray-500 text-xs">{formatOrderedQty(item)} @ Rs. {formatPrice(item.sellingPrice)}</span>
                        </div>
                      ))}
                    </div>

                    {order.totalAmount > 0 && (
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-200/60">
                        <span className="text-sm font-semibold text-green-800">Total Amount</span>
                        <span className="text-base font-bold text-green-700">Rs. {formatPrice(order.totalAmount)}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FOOrderManagement;

