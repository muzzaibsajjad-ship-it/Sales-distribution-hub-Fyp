import { useEffect, useState } from "react";
import { getBookerOrdersApi, bookerSubmitPaymentApi, bookerConfirmDeliveryApi, getNextInvoiceNumberApi } from "../api/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { calculateLineTotal, calculateOrderSubtotal, calculateOrderTotal as calculateRoundedOrderTotal, formatPrice, roundPrice } from "../utils/pricing";
import PageLoader from "./common/PageLoader";

const BookerOrderStatus = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    invoiceNumber: "",
    amount: 0,
    method: "cash",
  });
  const [paymentProof, setPaymentProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const location = useLocation();
  const isHistory = location.pathname.includes("history");

  const fetchOrders = async () => {
    const res = await getBookerOrdersApi();
    if (res.success) {
      setOrders(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders based on page type and status filter
  // Active orders = orders that need action (payment pending, delivery confirmation, etc.)
  // Payment pending statuses: delivered, stock_transferred, distributed
  // Completed orders = truly finished orders (completed, rejected, canceled)
  const paymentPendingStatuses = ["delivered", "stock_transferred", "distributed"];
  const activeOrders = orders.filter(o => !["completed", "rejected", "canceled"].includes(o.status));
  const completedOrders = orders.filter(o => ["completed", "rejected", "canceled"].includes(o.status));
  
  // Apply status filter
  const filterByStatus = (orderList) => {
    return orderList;
  };
  
  const displayOrders = isHistory ? filterByStatus(completedOrders) : filterByStatus(activeOrders);

  const calculateOrderTotal = (order) => {
    return calculateRoundedOrderTotal({
      items: order.items,
      discount: order.discount,
      deliveryCharges: order.deliveryCharges,
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

  const handlePaymentSubmit = async () => {
    if (!selectedOrder) return;
    if (!paymentProof) {
      toast.error("Please upload payment proof image");
      return;
    }

    setSubmitting(true);
    const res = await bookerSubmitPaymentApi(
      selectedOrder._id,
      paymentData,
      paymentProof
    );

    if (res.success) {
      toast.success("Payment submitted successfully! 🎉", { autoClose: 1500 });
      setShowPaymentForm(false);
      setSelectedOrder(null);
      fetchOrders();
    } else {
      toast.error(res.message || "Failed to submit payment ❌");
    }
    setSubmitting(false);
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrder) return;
    
    if (!window.confirm("Are you sure you want to confirm delivery? This will deduct stock from your inventory.")) {
      return;
    }
    
    setSubmitting(true);
    const res = await bookerConfirmDeliveryApi(selectedOrder._id);
    
    if (res.success) {
      toast.success("Delivery confirmed! Stock has been deducted from your inventory. 🎉", { autoClose: 1500 });
      fetchOrders();
    } else {
      toast.error(res.message || "Failed to confirm delivery ❌");
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending - Waiting for FO" },
      fo_combined: { bg: "bg-blue-100", text: "text-blue-800", label: "Combined - Waiting for Distributor" },
      distributor_approved: { bg: "bg-green-100", text: "text-green-800", label: "Approved - Awaiting Stock Transfer" },
      stock_transferred: { bg: "bg-purple-100", text: "text-purple-800", label: "Stock Received - Payment Pending" },
      distributed: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Stock Received - Confirm Delivery" },
      delivered: { bg: "bg-green-100", text: "text-green-800", label: "Delivered - Payment Pending" },
      payment_submitted: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Payment Submitted - Awaiting Confirmation" },
      payment_confirmed: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Payment Confirmed - Ready to Send" },
      payment_received: { bg: "bg-green-100", text: "text-green-800", label: "Payment Confirmed" },
      completed: { bg: "bg-green-100", text: "text-green-800", label: "Completed - In Stock History" },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
      canceled: { bg: "bg-gray-100", text: "text-gray-800", label: "Canceled" },
    };
    const s = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
    return (
      <span className={`px-2 py-1 rounded text-xs ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  if (loading) return <PageLoader message="Loading your orders..." />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-[#E8F0F8] rounded-md"
    >
      <h2 className="text-2xl font-semibold mb-4 text-[#4b2e2e]">
        {isHistory ? "📋 Order History" : "📋 My Order Status"}
      </h2>

      {orders.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">You haven't placed any orders yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Place an order from the "New Shop Order" section.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order List */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-[#4b2e2e]">
              {isHistory ? "Completed Orders" : "My Orders"} ({displayOrders.length})
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {displayOrders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 bg-white rounded border-2 cursor-pointer transition-all ${
                    selectedOrder?._id === order._id
                      ? "border-[#7f2c2c]"
                      : "border-transparent hover:border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-[#4b2e2e]">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("en-PK")}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Items: {order.items?.length || 0}</p>
                    <p>
                      Total: Rs. {formatPrice(calculateOrderTotal(order))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Details */}
          <div>
            <AnimatePresence mode="wait">
              {selectedOrder ? (
                <motion.div
                  key={selectedOrder._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded border border-[#7f2c2c]/20 p-4"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-[#4b2e2e]">
                      Order Details
                    </h3>
                    {getStatusBadge(selectedOrder.status)}
                  </div>

                  {/* Shop Info */}
                  {(selectedOrder.shopName || selectedOrder.shopAddress) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                      <p className="text-sm font-medium text-[#4b2e2e] mb-2">
                        🏪 Shop Information
                      </p>
                      {selectedOrder.shopName && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Name:</span> {selectedOrder.shopName}
                        </p>
                      )}
                      {selectedOrder.shopAddress && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Address:</span> {selectedOrder.shopAddress}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-[#4b2e2e] mb-2">
                      Items Ordered:
                    </p>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm border-b border-gray-100 pb-2"
                        >
                          <span className="text-gray-700">{item.productName}</span>
                          <div className="text-right">
                            <span className="text-gray-600">
                              {formatOrderedQty(item)}
                            </span>
                            <span className="ml-2 text-gray-600">
                              @ Rs. {formatPrice(item.sellingPrice)}
                            </span>
                            <span className="ml-2 font-medium text-[#7f2c2c]">
                              = Rs. {formatPrice(calculateLineTotal(item.sellingPrice, item.quantity))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-700">
                        Rs. {formatPrice(calculateOrderSubtotal(selectedOrder.items, (item) => item?.sellingPrice || 0))}
                      </span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Discount:</span>
                        <span className="text-green-600">- Rs. {formatPrice(selectedOrder.discount)}</span>
                      </div>
                    )}
                    {selectedOrder.deliveryCharges > 0 && (
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Delivery:</span>
                        <span className="text-gray-700">+ Rs. {formatPrice(selectedOrder.deliveryCharges)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-[#7f2c2c] pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span>Rs. {formatPrice(calculateOrderTotal(selectedOrder))}</span>
                    </div>
                  </div>

                  {/* Delivery Button - Show when stock is distributed to booker */}
                  {selectedOrder.status === "distributed" && (
                    <button
                      onClick={handleConfirmDelivery}
                      disabled={submitting}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-medium disabled:opacity-50 mb-3"
                    >
                      ✅ Confirm Delivery (Deduct Stock)
                    </button>
                  )}

                  {/* Delivery Status */}
                  {selectedOrder.status === "delivered" && (
                    <div className="w-full bg-green-100 text-green-800 py-3 rounded font-medium text-center mb-3">
                      ✅ Delivery Confirmed - Stock Deducted
                    </div>
                  )}

                  {/* Payment Button - Show when stock is delivered, distributed or stock_transferred */}
                  {(selectedOrder.status === "delivered" || selectedOrder.status === "distributed" || selectedOrder.status === "stock_transferred") && (
                    <button
                      onClick={async () => {
                        // Get next invoice number
                        const invoiceRes = await getNextInvoiceNumberApi('booker');
                        const invoiceNum = invoiceRes.success ? invoiceRes.invoiceNumber : '';
                        
                        setPaymentData({
                          ...paymentData,
                          amount: calculateOrderTotal(selectedOrder),
                          invoiceNumber: invoiceNum,
                        });
                        setShowPaymentForm(true);
                      }}
                      className="w-full bg-[#7f2c2c] hover:bg-[#6d2525] text-white py-3 rounded font-medium"
                    >
                      💳 Make Payment
                    </button>
                  )}

                  {/* Payment Status */}
                  {selectedOrder.status === "payment_submitted" && (
                    <div className="w-full bg-yellow-100 text-yellow-800 py-3 rounded font-medium text-center">
                      ⏳ Payment Submitted - Awaiting Confirmation
                    </div>
                  )}

                  {selectedOrder.status === "payment_received" && (
                    <div className="w-full bg-green-100 text-green-800 py-3 rounded font-medium text-center">
                      ✅ Payment Confirmed - Order Complete
                    </div>
                  )}

                  {selectedOrder.status === "completed" && (
                    <div className="w-full bg-green-100 text-green-800 py-3 rounded font-medium text-center">
                      ✅ Order Completed
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="bg-white rounded border border-[#7f2c2c]/20 p-8 text-center">
                  <p className="text-gray-500">
                    Select an order to view details
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Payment Form Modal */}
          {showPaymentForm && selectedOrder && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-semibold mb-4 text-[#4b2e2e]">
                  Submit Payment
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Order Total:{" "}
                  <span className="font-bold text-[#7f2c2c]">
                    Rs. {formatPrice(calculateOrderTotal(selectedOrder))}
                  </span>
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Number
                    </label>
                    <div className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-gray-600 font-semibold">
                      {paymentData.invoiceNumber || 'Generating...'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (Rs.) *
                    </label>
                    <input
                      type="number"
                      value={paymentData.amount || calculateOrderTotal(selectedOrder)}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          amount: roundPrice(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={paymentData.method}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, method: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="bank transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Proof Image *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPaymentProof(e.target.files[0])}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload screenshot or image of payment proof
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePaymentSubmit}
                    disabled={submitting}
                    className="flex-1 bg-[#7f2c2c] hover:bg-[#6d2525] text-white py-2 rounded font-medium disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Payment"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default BookerOrderStatus;
