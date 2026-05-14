import { useEffect, useState } from "react";
import {
  getDistributorStockPricesApi,
  setDefaultSellingPriceApi,
} from "../api/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import PageLoader from "./common/PageLoader";
import {
  FaTags,
  FaSearch,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaSave,
  FaUndo,
  FaBoxOpen,
  FaCoins,
  FaCalculator,
} from "react-icons/fa";

const DistributorStockPrices = () => {
  const [stock, setStock] = useState([]);
  const [filteredStock, setFilteredStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [savingId, setSavingId] = useState(null);

  const fetchStock = async () => {
    setLoading(true);
    const res = await getDistributorStockPricesApi();
    if (res.success) {
      setStock(res.data);
      setFilteredStock(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      setFilteredStock(
        stock.filter(
          (s) =>
            s.itemName?.toLowerCase().includes(q) ||
            s.stockType?.toLowerCase().includes(q)
        )
      );
    } else {
      setFilteredStock(stock);
    }
  }, [search, stock]);

  const handleSetPrice = async (stockId) => {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setSavingId(stockId);
    const res = await setDefaultSellingPriceApi(stockId, price);
    if (res.success) {
      toast.success("Default selling price updated!", { autoClose: 1500 });
      setEditingId(null);
      setEditPrice("");
      fetchStock();
    } else {
      toast.error(res.message || "Failed to set price");
    }
    setSavingId(null);
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditPrice(item.sellingPrice || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
  };

  const formatPrice = (val) => {
    if (val === undefined || val === null) return "0.00";
    return Number(val).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading) {
    return <PageLoader message="Loading stock prices..." />;
  }

  const setCount = stock.filter((s) => s.sellingPrice).length;
  const notSetCount = stock.length - setCount;

  return (
    <div className="bg-[#E8F0F8] min-h-screen text-[#4b2e2e] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white shadow">
            <FaTags className="text-sm" />
          </div>
          <h2 className="text-xl font-bold">Default Selling Prices</h2>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Set: {setCount}
          </span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            Not Set: {notSetCount}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Search by product name or stock type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#7f2c2c]/15 rounded-xl text-sm text-[#4b2e2e] outline-none focus:border-[#7f2c2c] focus:ring-1 focus:ring-[#7f2c2c] transition-all"
          />
        </div>
      </div>

      {filteredStock.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FaBoxOpen className="text-3xl mx-auto mb-2 text-[#7f2c2c]/30" />
          <p>No stock items found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border border-[#7f2c2c]/15 rounded-xl overflow-hidden">
              <thead className="bg-[#7f2c2c] text-white">
                <tr>
                  {[
                    "Product",
                    "Stock Type",
                    "Available",
                    "Purchase Price",
                    "Selling Price",
                    "Unit Rate",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="p-3 text-left text-xs font-semibold uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item, i) => {
                  const isEditing = editingId === item._id;
                  const isSet = !!item.sellingPrice;
                  const unitRate =
                    item.sellingPrice && item.unitsPerPack
                      ? Number(item.sellingPrice) / Number(item.unitsPerPack)
                      : 0;

                  return (
                    <motion.tr
                      key={item._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[#7f2c2c]/10 hover:bg-[#7f2c2c]/5 transition-all bg-white"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                            <FaBoxOpen className="text-[10px]" />
                          </div>
                          <span className="text-sm font-medium">
                            {item.itemName}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium capitalize">
                          {item.stockType}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {item.unitsPerPack || 1} units per pack
                        </p>
                      </td>
                      <td className="p-3 text-sm font-medium">
                        {item.availableUnits || 0}{" "}
                        <span className="text-gray-400 text-xs">units</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <FaCoins className="text-[10px] text-gray-400" />
                          Rs. {formatPrice(item.purchasePrice)}
                        </div>
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#7f2c2c]">
                              Rs.
                            </span>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="border-[2px] border-[#7f2c2c] rounded-lg px-2 py-1 w-24 text-sm outline-none focus:ring-1 focus:ring-[#7f2c2c]"
                              min="0"
                              step="0.01"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 text-sm font-bold ${
                              isSet ? "text-emerald-600" : "text-gray-400"
                            }`}
                          >
                            {isSet ? (
                              <FaCheckCircle className="text-[10px]" />
                            ) : (
                              <FaTimesCircle className="text-[10px]" />
                            )}
                            {isSet
                              ? `Rs. ${formatPrice(item.sellingPrice)}`
                              : "Not set"}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {isSet && unitRate > 0 ? (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <FaCalculator className="text-[10px]" />
                            Rs. {formatPrice(unitRate)} / unit
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSetPrice(item._id)}
                              disabled={savingId === item._id}
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            >
                              {savingId === item._id ? (
                                <FaSpinner className="animate-spin text-[10px]" />
                              ) : (
                                <FaSave className="text-[10px]" />
                              )}
                              {savingId === item._id ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="inline-flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            >
                              <FaUndo className="text-[10px]" />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            className="inline-flex items-center gap-1 bg-[#7f2c2c] hover:bg-[#6d2525] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            <FaEdit className="text-[10px]" />
                            {isSet ? "Update" : "Set Price"}
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
            {filteredStock.map((item, i) => {
              const isEditing = editingId === item._id;
              const isSet = !!item.sellingPrice;
              const unitRate =
                item.sellingPrice && item.unitsPerPack
                  ? Number(item.sellingPrice) / Number(item.unitsPerPack)
                  : 0;

              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-[#7f2c2c]/10 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                        <FaBoxOpen className="text-xs" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{item.itemName}</p>
                        <p className="text-[10px] text-gray-400 capitalize">
                          {item.stockType} · {item.unitsPerPack || 1} units/pack
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        isSet
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-orange-50 text-orange-700 border border-orange-200"
                      }`}
                    >
                      {isSet ? (
                        <FaCheckCircle className="text-[8px]" />
                      ) : (
                        <FaTimesCircle className="text-[8px]" />
                      )}
                      {isSet ? "Set" : "Not Set"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-[#faf8f5] rounded-lg p-2">
                      <p className="text-gray-500 text-[10px]">Available</p>
                      <p className="font-bold text-[#4b2e2e]">
                        {item.availableUnits || 0} units
                      </p>
                    </div>
                    <div className="bg-[#faf8f5] rounded-lg p-2">
                      <p className="text-gray-500 text-[10px]">Purchase Price</p>
                      <p className="font-medium text-gray-600">
                        Rs. {formatPrice(item.purchasePrice)}
                      </p>
                    </div>
                    <div className="bg-[#faf8f5] rounded-lg p-2">
                      <p className="text-gray-500 text-[10px]">Selling Price</p>
                      <p
                        className={`font-bold ${
                          isSet ? "text-emerald-600" : "text-gray-400"
                        }`}
                      >
                        {isSet
                          ? `Rs. ${formatPrice(item.sellingPrice)}`
                          : "Not set"}
                      </p>
                    </div>
                    <div className="bg-[#faf8f5] rounded-lg p-2">
                      <p className="text-gray-500 text-[10px]">Unit Rate</p>
                      <p className="font-medium text-gray-600">
                        {isSet && unitRate > 0
                          ? `Rs. ${formatPrice(unitRate)}`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#7f2c2c]">
                          Rs.
                        </span>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="flex-1 border-[2px] border-[#7f2c2c] rounded-lg px-3 py-2 text-sm outline-none"
                          min="0"
                          step="0.01"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSetPrice(item._id)}
                          disabled={savingId === item._id}
                          className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-2 rounded-lg text-xs font-bold transition-all"
                        >
                          {savingId === item._id ? (
                            <FaSpinner className="animate-spin text-[10px]" />
                          ) : (
                            <FaSave className="text-[10px]" />
                          )}
                          {savingId === item._id ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 inline-flex items-center justify-center gap-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg text-xs font-bold transition-all"
                        >
                          <FaUndo className="text-[10px]" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(item)}
                      className="w-full inline-flex items-center justify-center gap-1 bg-[#7f2c2c] hover:bg-[#6d2525] text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                      <FaEdit className="text-[10px]" />
                      {isSet ? "Update Price" : "Set Price"}
                    </button>
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

export default DistributorStockPrices;

