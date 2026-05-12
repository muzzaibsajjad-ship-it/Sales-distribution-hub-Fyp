import { useEffect, useState, useMemo } from "react";
import { getStockApi, updateStockApi } from "../api/api";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  FaBoxOpen,
  FaEdit,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaBoxes,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaSave,
  FaTimes,
} from "react-icons/fa";

const StockList = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("latest"); // "latest" | "oldest"

  const fetchStocks = async () => {
    setLoading(true);
    const res = await getStockApi();
    if (res.success && Array.isArray(res.data)) {
      setStocks(res.data);
    } else if (res.success && Array.isArray(res.data.data)) {
      setStocks(res.data.data);
    } else {
      setStocks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const handleEdit = (stock) => {
    setEditingId(stock._id);
    setEditForm({ ...stock });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...editForm, [name]: value };
    if (name === "quantity" || name === "purchasePrice") {
      const qty = parseFloat(updatedForm.quantity) || 0;
      const price = parseFloat(updatedForm.purchasePrice) || 0;
      updatedForm.totalValue = qty * price;
    }
    setEditForm(updatedForm);
  };

  const handleSave = async () => {
    const res = await updateStockApi(editingId, editForm);
    if (res.success) {
      toast.success("Stock updated successfully!");
      setEditingId(null);
      fetchStocks();
    } else {
      toast.error(res.message || "Failed to update stock ❌");
    }
  };

  const filteredStocks = useMemo(() => {
    let data = stocks.filter((s) => s.quantity > 0);

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
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-[#4b2e2e] tracking-wide">
          Stock List
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
                    "Qty/Pack",
                    "Quantity",
                    "Available",
                    "Original",
                    "Price",
                    "Total Value",
                    "Supplier",
                    "Invoice",
                    "Date",
                    "Action",
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

                    {/* Item Name */}
                    <td className="p-3 font-medium">
                      {editingId === stock._id ? (
                        <input
                          type="text"
                          name="itemName"
                          value={editForm.itemName}
                          onChange={handleChange}
                          className="w-full p-2 rounded-lg border-2 border-[#7f2c2c]/30 bg-transparent text-[#4b2e2e] outline-none focus:border-[#7f2c2c]"
                        />
                      ) : (
                        stock.itemName
                      )}
                    </td>

                    {/* Stock Type */}
                    <td className="p-3">
                      {editingId === stock._id ? (
                        <select
                          name="stockType"
                          value={editForm.stockType}
                          onChange={handleChange}
                          className="w-full p-2 rounded-lg border-2 border-[#7f2c2c]/30 bg-transparent text-[#4b2e2e] outline-none focus:border-[#7f2c2c]"
                        >
                          <option value="Carton">Carton</option>
                          <option value="Packet">Packet</option>
                          <option value="Box">Box</option>
                        </select>
                      ) : (
                        <span className="bg-[#7f2c2c]/10 text-[#7f2c2c] px-2 py-1 rounded text-xs font-medium">
                          {stock.stockType}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {editingId === stock._id ? (
                        <select
                          name="unitsPerPack"
                          value={editForm.unitsPerPack || ""}
                          onChange={handleChange}
                          className="w-full p-2 rounded-lg border-2 border-[#7f2c2c]/30 bg-transparent text-[#4b2e2e] outline-none focus:border-[#7f2c2c]"
                        >
                          {[8, 10, 12, 14].map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      ) : (
                        stock.unitsPerPack || 1
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="p-3">
                      {editingId === stock._id ? (
                        <input
                          type="number"
                          name="quantity"
                          value={editForm.quantity}
                          onChange={handleChange}
                          className="w-full p-2 rounded-lg border-2 border-[#7f2c2c]/30 bg-transparent text-[#4b2e2e] outline-none focus:border-[#7f2c2c]"
                        />
                      ) : (
                        stock.quantity
                      )}
                    </td>

                    <td className="p-3">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                        {stock.availableUnits || 0} units
                      </span>
                    </td>

                    {/* Original Stock Added */}
                    <td className="p-3">
                      {editingId === stock._id ? (
                        <input
                          type="number"
                          name="originalStockAdded"
                          value={editForm.originalStockAdded}
                          onChange={handleChange}
                          className="w-full p-2 rounded-lg border-2 border-[#7f2c2c]/30 bg-transparent text-[#4b2e2e] outline-none focus:border-[#7f2c2c]"
                        />
                      ) : (
                        stock.originalStockAdded
                      )}
                    </td>

                    {/* Purchase Price */}
                    <td className="p-3">
                      {editingId === stock._id ? (
                        <input
                          type="number"
                          name="purchasePrice"
                          value={editForm.purchasePrice}
                          onChange={handleChange}
                          className="w-full p-2 rounded-lg border-2 border-[#7f2c2c]/30 bg-transparent text-[#4b2e2e] outline-none focus:border-[#7f2c2c]"
                        />
                      ) : (
                        stock.purchasePrice
                      )}
                    </td>

                    {/* Total Value */}
                    <td className="p-3 font-bold text-[#7f2c2c]">
                      {stock.totalValue}
                    </td>

                    {/* Supplier */}
                    <td className="p-3">
                      {editingId === stock._id ? (
                        <input
                          type="text"
                          name="supplierName"
                          value={editForm.supplierName || ""}
                          onChange={handleChange}
                          className="w-full p-2 rounded-lg border-2 border-[#7f2c2c]/30 bg-transparent text-[#4b2e2e] outline-none focus:border-[#7f2c2c]"
                        />
                      ) : (
                        stock.supplierName || "-"
                      )}
                    </td>

                    {/* Invoice */}
                    <td className="p-3 text-xs bg-gray-100 rounded px-2 py-1 font-mono inline-block mt-2">
                      {stock.invoiceNumber || "-"}
                    </td>

                    {/* Date */}
                    <td className="p-3 whitespace-nowrap text-gray-500 text-xs">
                      <FaCalendarAlt className="inline mr-1 text-gray-400" />
                      {editingId === stock._id ? (
                        <input
                          type="date"
                          name="date"
                          value={editForm.date.split("T")[0]}
                          onChange={handleChange}
                          className="w-full p-2 rounded-lg border-2 border-[#7f2c2c]/30 bg-transparent text-[#4b2e2e] outline-none focus:border-[#7f2c2c]"
                        />
                      ) : (
                        new Date(stock.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3">
                      {editingId === stock._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                          >
                            <FaSave /> Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                          >
                            <FaTimes /> Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(stock)}
                          className="bg-[#7f2c2c]/10 hover:bg-[#7f2c2c]/20 text-[#7f2c2c] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                        >
                          <FaEdit /> Edit
                        </button>
                      )}
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

export default StockList;

