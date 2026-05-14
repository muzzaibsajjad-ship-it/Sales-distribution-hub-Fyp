import { useEffect, useState } from "react";
import { getPendingOrdersApi, confirmCombinedPaymentApi } from "../api/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FaEye } from "react-icons/fa";
import { getProofUrl } from "../api/api";
import PageLoader from "./common/PageLoader";

const SolePaymentConfirmation = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const fetchOrders = async () => {
    const res = await getPendingOrdersApi();
    if (res.success) {
      // Filter for payment_submitted orders
      const paymentOrders = res.orders.filter(
        (order) => order.status === "payment_submitted"
      );
      setOrders(paymentOrders);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;

    const confirm = window.confirm(
      "Are you sure you want to confirm this payment? This will transfer stock to the distributor."
    );
    if (!confirm) return;

    setConfirming(true);
    const res = await confirmCombinedPaymentApi(selectedOrder._id);

    if (res.success) {
      toast.success("Payment confirmed! Stock transferred to distributor. 🎉", {
        autoClose: 1500,
      });
      setSelectedOrder(null);
      fetchOrders();
    } else {
      toast.error(res.message || "Failed to confirm payment ❌");
    }
    setConfirming(false);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      payment_submitted: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Payment Submitted",
      },
      payment_received: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Payment Received",
      },
    };
    const s = statusMap[status] || statusMap.payment_submitted;
    return (
      <span className={`px-2 py-1 rounded text-xs ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  if (loading) return <PageLoader message="Loading payments..." />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-[#E8F0F8] rounded-md"
    >
      <h2 className="text-2xl font-semibold mb-4 text-[#4b2e2e]">
        Confirm Distributor Payments
      </h2>

      {orders.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No payments pending confirmation</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order List */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-[#4b2e2e]">
              Pending Payments ({orders.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {orders.map((order) => (
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
                        Distributor: {order.distributorId?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        FO: {order.foId?.name || "Unknown"}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Items: {order.items?.length || 0}</p>
                    <p>
                      Total: Rs.{" "}
                      {order.items?.reduce(
                        (sum, i) => sum + i.sellingPrice * i.quantity,
                        0
                      ) || 0}
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
                  <h3 className="text-lg font-semibold mb-3 text-[#4b2e2e]">
                    Payment Details
                  </h3>

                  {/* Payment Info */}
                  {selectedOrder.payment && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <p className="font-medium text-yellow-800 mb-2">
                        💳 Payment Information
                      </p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Invoice:</span>{" "}
                          {selectedOrder.payment.invoiceNumber}
                        </p>
                        <p>
                          <span className="font-medium">Amount:</span> Rs.{" "}
                          {selectedOrder.payment.amount}
                        </p>
                        <p>
                          <span className="font-medium">Method:</span>{" "}
                          {selectedOrder.payment.method}
                        </p>
                        {selectedOrder.payment.proof && (
                          <p>
                            <span className="font-medium">Proof:</span>{" "}
                            <a
                              href={getProofUrl(selectedOrder.payment.proof)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              <FaEye /> View Proof
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="mb-4">
                    <p className="font-medium text-[#4b2e2e] mb-2">Items:</p>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm border-b border-gray-100 pb-2"
                        >
                          <span className="text-gray-600">
                            {item.productName}
                          </span>
                          <span className="text-gray-600">
                            x{item.quantity} @ Rs. {item.sellingPrice}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 mb-4">
                    <span className="font-semibold text-[#4b2e2e]">
                      Total Amount:
                    </span>
                    <span className="font-bold text-lg text-[#7f2c2c]">
                      Rs.{" "}
                      {selectedOrder.items?.reduce(
                        (sum, i) => sum + i.sellingPrice * i.quantity,
                        0
                      ) || 0}
                    </span>
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={handleConfirmPayment}
                    disabled={confirming}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-medium disabled:opacity-50"
                  >
                    {confirming ? "Confirming..." : "Confirm Payment & Transfer Stock"}
                  </button>

                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Clicking confirm will transfer stock to the distributor
                  </p>
                </motion.div>
              ) : (
                <div className="bg-white rounded border border-[#7f2c2c]/20 p-8 text-center">
                  <p className="text-gray-500">
                    Select an order to view payment details
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SolePaymentConfirmation;




