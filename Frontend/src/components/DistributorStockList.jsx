import { useEffect, useState, useMemo } from "react";
import { getStockApi } from "../api/api";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  FaBoxOpen,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaBoxes,
  FaMoneyBillWave,
  FaCalendarAlt,
} from "react-icons/fa";

const DistributorStockList = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("latest"); // "latest" | "oldest"

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const res = await getStockApi();
      const stockArray = res?.data?.data ?? [];

      if (Array.isArray(stockArray)) {
        const distributorStocks = stockArray.filter(
          (stock) =>
            stock.ownerType === "distributor" &&
            stock.createdBy !== null &&
            stock.invoiceNumber &&
            stock.stockTransferred !== true &&
            (stock.availableUnits || 0) > 0
        );
        setStocks(distributorStocks);
      } else {
        setStocks([]);
        toast.error("Invalid stock format from server");
      }
    } catch (err) {
      toast.error("Failed to fetch stocks");
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const filteredStocks = useMemo(() => {
    let data = [...stocks];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (s) =>
          s.itemName?.toLowerCase().includes(term) ||
          s.stockType?.toLowerCase().includes(term) ||
          s.supplierName?.toLowerCase().includes(term) ||
          s.invoiceNumber?.toLowerCase().includes(term)
      );
    }

    // Sort by date
    data.sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return sortOrder === "latest" ? db - da : da - db;
    });

    return data;
  }, [stocks, searchTerm, sortOrder]);

  const totalValue = filteredStocks.reduce(
    (sum, s) => sum + Number(s.totalValue || 0),
    0
  );
  const totalQuantity = filteredStocks.reduce(
    (sum, s) => sum + Number(s.quantity || 0),
    0
  );

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-4 border-[#7f2c2c] border-t-transparent rounded-full" />
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-[#E8F0F8] min-h-screen"
    >


      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-3 shadow-md border border-[#7f2c2c]/10"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-[#7f2c2c]/10 p-1.5 rounded-lg">
              <FaBoxes className="text-[#7f2c2c] text-sm" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Total Items
            </span>
          </div>
          <p className="text-lg font-bold text-[#7f2c2c]">
            {filteredStocks.length}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-3 shadow-md border border-[#f5c16c]/20"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-[#f5c16c]/20 p-1.5 rounded-lg">
              <FaBoxOpen className="text-[#c98c3a] text-sm" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Total Quantity
            </span>
          </div>
          <p className="text-lg font-bold text-[#c98c3a]">{totalQuantity}</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-3 shadow-md border border-green-100"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-green-100 p-1.5 rounded-lg">
              <FaMoneyBillWave className="text-green-700 text-sm" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Total Value
            </span>
          </div>
          <p className="text-lg font-bold text-green-700">
            Rs. {totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </motion.div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-md border border-[#7f2c2c]/10 mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by item, type, supplier, invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[#7f2c2c]/20 bg-transparent text-[#4b2e2e] outline-none focus:border-[#7f2c2c] transition-all"
          />
        </div>
        <div className="flex gap-2">
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
          <span className="font-semibold">Stock Inventory</span>
          <span className="text-sm opacity-90">
            {filteredStocks.length} {filteredStocks.length === 1 ? "item" : "items"} found
          </span>
        </div>

        {filteredStocks.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCalendarAlt className="text-3xl text-gray-400" />
            </div>
            <p className="text-[#4b2e2e] text-lg font-medium">
              {stocks.length === 0 ? "No stock available" : "No matching records"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
            <table className="w-full text-sm text-[#4b2e2e] min-w-max">
              <thead>
                <tr className="bg-[#f8f4f0] text-left">
                  {[
                    "#",
                    "Item Name",
                    "Type",
                    "Pack Qty",
                    "Units/Pack",
                    "Available",
                    "Price/Pack",
                    "Total Value",
                    "Supplier",
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
                {filteredStocks.map((stock, i) => (
                  <motion.tr
                    key={stock._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                    className="border-b border-gray-100 hover:bg-[#faf5f2] transition-colors"
                  >
                    <td className="p-3 text-gray-400">{i + 1}</td>
                    <td className="p-3 font-medium">{stock.itemName || "-"}</td>
                    <td className="p-3">
                      <span className="bg-[#7f2c2c]/10 text-[#7f2c2c] px-2 py-1 rounded text-xs font-medium">
                        {stock.stockType || "-"}
                      </span>
                    </td>
                    <td className="p-3">{stock.quantity || 0}</td>
                    <td className="p-3">{stock.unitsPerPack || 1}</td>
                    <td className="p-3">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                        {stock.availableUnits || 0} units
                      </span>
                    </td>
                    <td className="p-3">{stock.purchasePrice || 0}</td>
                    <td className="p-3 font-bold text-[#7f2c2c]">
                      {stock.totalValue || 0}
                    </td>
                    <td className="p-3">{stock.supplierName || "-"}</td>
                    <td className="p-3">
                      <span className="text-xs bg-gray-100 rounded px-2 py-1 font-mono">
                        {stock.invoiceNumber || "-"}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-500 text-xs">
                      <FaCalendarAlt className="inline mr-1 text-gray-400" />
                      {stock.date
                        ? new Date(stock.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
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

export default DistributorStockList;

