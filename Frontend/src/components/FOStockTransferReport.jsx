import { useEffect, useState } from "react";
import API from "../api/api";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const FOStockTransferReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFO, setSelectedFO] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await API.get("/orders/distributor/fo-stock-report");
      setReportData(res.data.data);
    } catch (err) {
      toast.error("Failed to fetch FO stock report");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "bg-yellow-500",
      stock_transferred: "bg-blue-500",
      distributed: "bg-indigo-500",
      payment_pending: "bg-orange-500",
      payment_submitted: "bg-purple-500",
      payment_confirmed: "bg-teal-500",
      payment_sent_to_distributor: "bg-cyan-500",
      payment_submitted_to_distributor: "bg-pink-500",
      payment_received: "bg-green-500",
      completed: "bg-green-600",
    };
    return statusColors[status] || "bg-gray-500";
  };

  const formatStatus = (status) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <p className="text-[#4b2e2e] font-medium text-center py-10">
        Loading FO Stock Report...
      </p>
    );
  }

  if (!reportData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#E8F0F8] text-[#4b2e2e] p-6 min-h-screen rounded-md"
      >
        <h2 className="text-2xl font-bold mb-6">FO Stock Transfer Report</h2>
        <p>No data available</p>
        <button
          onClick={fetchReport}
          className="mt-4 bg-[#7f2c2c] text-[#fff1d0] px-4 py-2 rounded-md"
        >
          Refresh
        </button>
      </motion.div>
    );
  }

  const { summary, ordersByFO, foStocks } = reportData;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#E8F0F8] text-[#4b2e2e] p-6 min-h-screen rounded-md"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">FO Stock Transfer Report</h2>
        <button
          onClick={fetchReport}
          className="bg-[#7f2c2c] text-[#fff1d0] px-4 py-2 rounded-md font-semibold hover:bg-[#5f1e1e] transition-all"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-[#7f2c2c]">
          <p className="text-sm font-semibold text-gray-600">Total FOs</p>
          <p className="text-2xl font-bold text-[#7f2c2c]">
            {summary?.totalFOs || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm font-semibold text-gray-600">Total Stock Value</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(summary?.totalStockValue)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm font-semibold text-gray-600">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(summary?.totalPaid)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-sm font-semibold text-gray-600">Total Pending</p>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(summary?.totalPending)}
          </p>
        </div>
      </div>

      {/* FO Summary Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <h3 className="text-xl font-bold p-4 bg-[#7f2c2c]/10">
          FO Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#7f2c2c]/20">
              <tr>
                <th className="p-3 text-left font-semibold">FO Name</th>
                <th className="p-3 text-left font-semibold">Total Amount</th>
                <th className="p-3 text-left font-semibold">Paid</th>
                <th className="p-3 text-left font-semibold">Pending</th>
                <th className="p-3 text-left font-semibold">Orders</th>
                <th className="p-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {ordersByFO?.length > 0 ? (
                ordersByFO.map((foData, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="p-3 font-medium">
                      {foData.fo?.name || "Unknown FO"}
                    </td>
                    <td className="p-3">
                      {formatCurrency(foData.totalAmount)}
                    </td>
                    <td className="p-3 text-green-600 font-semibold">
                      {formatCurrency(foData.paidAmount)}
                    </td>
                    <td className="p-3 text-orange-600 font-semibold">
                      {formatCurrency(foData.pendingAmount)}
                    </td>
                    <td className="p-3">{foData.orders?.length || 0}</td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedFO(foData);
                          setShowDetails(true);
                        }}
                        className="bg-[#7f2c2c] text-[#fff1d0] px-3 py-1 rounded text-sm hover:bg-[#5f1e1e]"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No FO data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Details */}
      {foStocks?.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h3 className="text-xl font-bold p-4 bg-[#7f2c2c]/10">
            Stock Transferred to FOs
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#7f2c2c]/20">
                <tr>
                  <th className="p-3 text-left font-semibold">Item</th>
                  <th className="p-3 text-left font-semibold">Type</th>
                  <th className="p-3 text-left font-semibold">Units</th>
                  <th className="p-3 text-left font-semibold">Price</th>
                  <th className="p-3 text-left font-semibold">Total Value</th>
                  <th className="p-3 text-left font-semibold">FO</th>
                  <th className="p-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {foStocks.map((stock, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="p-3">{stock.itemName}</td>
                    <td className="p-3">{stock.stockType}</td>
                    <td className="p-3">{stock.quantity}</td>
                    <td className="p-3">{formatCurrency(stock.sellingPrice)}</td>
                    <td className="p-3">{formatCurrency(stock.totalValue)}</td>
                    <td className="p-3">{stock.ownerId?.name || "Unknown"}</td>
                    <td className="p-3">
                      {new Date(stock.createdAt).toLocaleDateString("en-PK")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedFO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#E8F0F8] text-[#4b2e2e] p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {selectedFO.fo?.name} - Order Details
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-2xl font-bold hover:text-[#7f2c2c]"
              >
                &times;
              </button>
            </div>

            {/* FO Summary */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-3 rounded shadow">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold">
                  {formatCurrency(selectedFO.totalAmount)}
                </p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(selectedFO.paidAmount)}
                </p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(selectedFO.pendingAmount)}
                </p>
              </div>
            </div>

            {/* Orders Table */}
            <h4 className="font-bold mb-2">Orders</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded">
                <thead className="bg-[#7f2c2c]/20">
                  <tr>
                    <th className="p-2 text-left text-sm">Order #</th>
                    <th className="p-2 text-left text-sm">Status</th>
                    <th className="p-2 text-left text-sm">Total</th>
                    <th className="p-2 text-left text-sm">Paid</th>
                    <th className="p-2 text-left text-sm">Pending</th>
                    <th className="p-2 text-left text-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedFO.orders?.map((order, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2 text-sm">{order.orderNumber}</td>
                      <td className="p-2">
                        <span
                          className={`${getStatusColor(
                            order.status
                          )} text-white px-2 py-1 rounded text-xs`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td className="p-2 text-sm">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="p-2 text-sm text-green-600">
                        {formatCurrency(order.paidAmount)}
                      </td>
                      <td className="p-2 text-sm text-orange-600">
                        {formatCurrency(order.pendingAmount)}
                      </td>
                      <td className="p-2 text-sm">
                        {new Date(order.createdAt).toLocaleDateString("en-PK")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Item Summary */}
            {selectedFO.itemSummary && Object.keys(selectedFO.itemSummary).length > 0 && (
              <>
                <h4 className="font-bold mt-4 mb-2">Item Summary</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded">
                    <thead className="bg-[#7f2c2c]/20">
                      <tr>
                        <th className="p-2 text-left text-sm">Item</th>
                        <th className="p-2 text-left text-sm">Quantity</th>
                        <th className="p-2 text-left text-sm">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedFO.itemSummary).map(
                        ([item, data], idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2 text-sm">{item}</td>
                            <td className="p-2 text-sm">{data.quantity}</td>
                            <td className="p-2 text-sm">
                              {formatCurrency(data.amount)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FOStockTransferReport;
