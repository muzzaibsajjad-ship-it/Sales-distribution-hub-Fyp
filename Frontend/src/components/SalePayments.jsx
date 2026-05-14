import { useEffect, useState, useMemo } from "react";
import { fetchPayments } from "../api/api";
import { motion } from "framer-motion";
import PageLoader from "./common/PageLoader";
import {
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaMoneyBillWave,
  FaBox,
  FaCalendarAlt,
  FaReceipt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

const SalePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("latest"); // "latest" | "oldest"
  const [showAllFields, setShowAllFields] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetchPayments("sale");
      if (res.success) setPayments(res.data);
      setLoading(false);
    };
    load();
  }, []);

  const filteredPayments = useMemo(() => {
    let data = [...payments];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (p) =>
          p.itemName?.toLowerCase().includes(term) ||
          p.soldBy?.name?.toLowerCase().includes(term) ||
          p.purchasedBy?.name?.toLowerCase().includes(term) ||
          p.invoiceNumber?.toLowerCase().includes(term)
      );
    }

    // Sort by date
    data.sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return sortOrder === "latest" ? db - da : da - db;
    });

    return data;
  }, [payments, searchTerm, sortOrder]);

  const totalAmount = filteredPayments.reduce(
    (sum, p) => sum + Number(p.totalAmount || 0),
    0
  );
  const totalProfit = filteredPayments.reduce(
    (sum, p) => sum + Number(p.profit || 0),
    0
  );
  const totalQuantity = filteredPayments.reduce(
    (sum, p) => sum + Number(p.quantity || 0),
    0
  );

  if (loading) return <PageLoader message="Loading sale payments..." />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-[#E8F0F8] min-h-screen"
    >
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-3xl font-extrabold text-[#4b2e2e] tracking-wide">
          Sale Payments
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-3 shadow-md border border-[#7f2c2c]/10"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-[#7f2c2c]/10 p-1.5 rounded-lg">
              <FaMoneyBillWave className="text-[#7f2c2c] text-sm" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Total Amount
            </span>
          </div>
          <p className="text-lg font-bold text-[#7f2c2c]">
            Rs. {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-3 shadow-md border border-[#f5c16c]/20"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-[#f5c16c]/20 p-1.5 rounded-lg">
              <FaReceipt className="text-[#c98c3a] text-sm" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Total Profit
            </span>
          </div>
          <p className="text-lg font-bold text-[#c98c3a]">
            Rs. {totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-3 shadow-md border border-green-100"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-green-100 p-1.5 rounded-lg">
              <FaBox className="text-green-700 text-sm" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Total Qty Sold
            </span>
          </div>
          <p className="text-lg font-bold text-green-700">{totalQuantity}</p>
        </motion.div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-md border border-[#7f2c2c]/10 mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by item, seller, buyer, invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[#7f2c2c]/20 bg-transparent text-[#4b2e2e] outline-none focus:border-[#7f2c2c] transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAllFields(!showAllFields)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              showAllFields
                ? "bg-[#2a72aa] text-white shadow-lg"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {showAllFields ? <FaEyeSlash /> : <FaEye />}
            {showAllFields ? "Hide Extra" : "All Fields"}
          </button>
          <button
            onClick={() => setSortOrder("latest")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              sortOrder === "latest"
                ? "bg-[#7f2c2c] text-white shadow-lg"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <FaSortAmountDown />
            Latest First
          </button>
          <button
            onClick={() => setSortOrder("oldest")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              sortOrder === "oldest"
                ? "bg-[#7f2c2c] text-white shadow-lg"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <FaSortAmountUp />
            Oldest First
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#7f2c2c]/10 overflow-hidden">
        <div className="p-4 bg-[#7f2c2c] text-white flex justify-between items-center">
          <span className="font-semibold">Transactions</span>
          <span className="text-sm opacity-90">
            {filteredPayments.length} {filteredPayments.length === 1 ? "record" : "records"} found
          </span>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCalendarAlt className="text-3xl text-gray-400" />
            </div>
            <p className="text-[#4b2e2e] text-lg font-medium">
              {payments.length === 0 ? "No sale payments found" : "No matching records"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
            <table className="w-full text-sm text-[#4b2e2e] min-w-max">
              <thead>
                <tr className="bg-[#f8f4f0] text-left">
                  {[
                    "#",
                    "Item",
                    "Qty",
                    "Purchase",
                    "Selling",
                    ...(showAllFields ? ["Discount", "Delivery"] : []),
                    "Total",
                    "Profit",
                    "Seller",
                    "Buyer",
                    "Invoice",
                    "Date",
                  ].map((h) => (
                    <th key={h} className="p-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p, i) => (
                  <motion.tr
                    key={p._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                    className="border-b border-gray-100 hover:bg-[#faf5f2] transition-colors"
                  >
                    <td className="p-3 text-gray-400">{i + 1}</td>
                    <td className="p-3 font-medium">{p.itemName}</td>
                    <td className="p-3">{p.quantity}</td>
                    <td className="p-3">{Number(p.purchasePrice || 0).toFixed(2)}</td>
                    <td className="p-3">{Number(p.sellingPrice || 0).toFixed(2)}</td>
                    {showAllFields && (
                      <>
                        <td className="p-3 text-red-500">
                          {Number(p.discount || 0) > 0
                            ? `-${Number(p.discount || 0).toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="p-3">{Number(p.deliveryCharges || 0).toFixed(2)}</td>
                      </>
                    )}
                    <td className="p-3 font-bold text-[#7f2c2c]">
                      {Number(p.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-[#c98c3a] font-semibold">
                      {Number(p.profit || 0).toFixed(2)}
                    </td>
                    <td className="p-3">{p.soldBy?.name || "Sole"}</td>
                    <td className="p-3">{p.purchasedBy?.name || "-"}</td>
                    <td className="p-3">
                      <span className="text-xs bg-gray-100 rounded px-2 py-1 font-mono">
                        {p.invoiceNumber || "-"}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-500 text-xs">
                      <FaCalendarAlt className="inline mr-1 text-gray-400" />
                      {new Date(p.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SalePayments;

