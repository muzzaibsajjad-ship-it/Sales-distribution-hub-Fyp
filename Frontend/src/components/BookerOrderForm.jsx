import { useEffect, useState } from "react";
import { getBookerStockApi, createBookerOrderApi } from "../api/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { calculateLineTotal, formatPrice, roundPrice } from "../utils/pricing";
import { useAuth } from "../context/AuthContext";
import PageLoader from "./common/PageLoader";
import {
  FaStore,
  FaRoad,
  FaRoute,
  FaPlus,
  FaTrashAlt,
  FaBoxOpen,
  FaShoppingCart,
  FaPaperPlane,
  FaSpinner,
  FaInfoCircle,
  FaTag,
  FaCoins,
  FaWarehouse,
  FaListOl,
  FaRupeeSign,
} from "react-icons/fa";

const BookerOrderForm = () => {
  const { user } = useAuth();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookerInfo, setBookerInfo] = useState(null);

  const [shopName, setShopName] = useState("");
  const [streetNo, setStreetNo] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [orderItems, setOrderItems] = useState([]);

  const getStockById = (stockId) => stock.find((item) => item._id === stockId);

  const getUnitsPerPack = (stockId) => {
    const selectedStock = getStockById(stockId);
    return Number(selectedStock?.unitsPerPack) || 1;
  };

  const getStockTypeLabel = (stockId) => {
    const selectedStock = getStockById(stockId);
    return String(selectedStock?.stockType || "pack").toLowerCase();
  };

  const getStockPrice = (stockId) => {
    const selectedStock = getStockById(stockId);
    return roundPrice(selectedStock?.unitSellingPrice);
  };

  const toUnits = (stockId, orderUnit, orderQuantity) => {
    const qty = Number(orderQuantity) || 0;
    if (orderUnit === "unit") return qty;
    const unitsPerPack = getUnitsPerPack(stockId);
    return qty * unitsPerPack;
  };

  const getItemTotal = (item) =>
    calculateLineTotal(getStockPrice(item.itemId), item.quantity || 0);

  const totalAmount = roundPrice(
    orderItems.reduce((sum, item) => sum + getItemTotal(item), 0)
  );

  const fetchStock = async () => {
    const res = await getBookerStockApi();
    if (res.success) {
      setStock(res.data || []);
      // Use API routes first, fallback to user.routes from auth context
      const routes = res.routes?.length > 0 ? res.routes : (user?.routes || []);
      setBookerInfo({
        distributor: res.data?.[0]?.distributorId?.name || "",
        area: res.bookerArea,
        routes: routes,
      });
      if (routes.length === 1) {
        setSelectedRoute(routes[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const addItem = () => {
    if (stock.length === 0) return;

    const firstStock = stock[0];
    const defaultOrderUnit = "unit";
    const defaultOrderQuantity = 1;

    setOrderItems([
      ...orderItems,
      {
        itemId: firstStock._id,
        productName: firstStock.itemName,
        stockAvailable: firstStock.stockAvailable || firstStock.availableUnits || 0,
        orderUnit: defaultOrderUnit,
        orderQuantity: defaultOrderQuantity,
        quantity: toUnits(firstStock._id, defaultOrderUnit, defaultOrderQuantity),
      },
    ]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...orderItems];
    const current = updated[index];

    if (field === "itemId") {
      const selectedStock = getStockById(value);
      const nextOrderUnit = current.orderUnit || "unit";
      const nextOrderQuantity = current.orderQuantity || 1;

      updated[index] = {
        ...current,
        itemId: value,
        productName: selectedStock?.itemName || "",
        stockAvailable: selectedStock?.stockAvailable || selectedStock?.availableUnits || 0,
        quantity: toUnits(value, nextOrderUnit, nextOrderQuantity),
      };
    } else if (field === "orderUnit") {
      const nextOrderUnit = value;
      const nextOrderQuantity = current.orderQuantity || 0;
      updated[index] = {
        ...current,
        orderUnit: nextOrderUnit,
        quantity: toUnits(current.itemId, nextOrderUnit, nextOrderQuantity),
      };
    } else if (field === "orderQuantity") {
      const nextOrderQuantity = Number(value) || 0;
      updated[index] = {
        ...current,
        orderQuantity: nextOrderQuantity,
        quantity: toUnits(current.itemId, current.orderUnit, nextOrderQuantity),
      };
    }

    setOrderItems(updated);
  };

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!shopName.trim()) {
      toast.error("Please enter shop name");
      return;
    }
    if (!streetNo.trim()) {
      toast.error("Please enter street number");
      return;
    }
    if (!selectedRoute) {
      toast.error("Please select a route");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    for (const item of orderItems) {
      if (!item.itemId || !item.quantity || item.quantity <= 0) {
        toast.error("Please fill all items with valid quantity");
        return;
      }
      if (item.quantity > (Number(item.stockAvailable) || 0)) {
        toast.error(`${item.productName}: required quantity exceeds available stock`);
        return;
      }
    }

    setSubmitting(true);
    const payloadItems = orderItems.map((item) => ({
      itemId: item.itemId,
      quantity: Number(item.quantity) || 0,
      orderUnit: item.orderUnit,
      orderQuantity: Number(item.orderQuantity) || 0,
    }));

    const res = await createBookerOrderApi(
      payloadItems,
      bookerInfo?.area?._id,
      selectedRoute,
      shopName,
      streetNo
    );

    if (res.success) {
      toast.success("Order placed successfully!", { autoClose: 1500 });
      setShopName("");
      setStreetNo("");
      setSelectedRoute(bookerInfo?.routes?.length === 1 ? bookerInfo.routes[0] : "");
      setOrderItems([]);
    } else {
      toast.error(res.message || "Failed to place order");
    }
    setSubmitting(false);
  };

  if (loading) return <PageLoader message="Loading stock..." />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-3 md:p-4 max-w-5xl mx-auto"
    >
      {/* Compact Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white shadow">
          <FaShoppingCart className="text-sm" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#4b2e2e]">New Shop Order</h2>
          <p className="text-xs text-[#4b2e2e]/60">
            {bookerInfo?.area?.name && `Area: ${bookerInfo.area.name}`}
          </p>
        </div>
      </div>

      {/* Shop Information - Compact 3 columns with matching input style */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-sm border border-[#7f2c2c]/10 p-3 mb-3 overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#7f2c2c] to-[#4b2e2e]" />
        <div className="flex items-center gap-1.5 mb-2">
          <FaStore className="text-[#7f2c2c] text-xs" />
          <h3 className="text-sm font-bold text-[#4b2e2e]">Shop Info</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col">
            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-[#4b2e2e]">
              <FaStore className="text-[#7f2c2c]" /> Shop Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Shop name"
              className="p-2.5 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none text-xs"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-[#4b2e2e]">
              <FaRoad className="text-[#7f2c2c]" /> Street No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={streetNo}
              onChange={(e) => setStreetNo(e.target.value)}
              placeholder="Street no"
              className="p-2.5 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none text-xs"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-[#4b2e2e]">
              <FaRoute className="text-[#7f2c2c]" /> Route <span className="text-red-500">*</span>
            </label>
            {bookerInfo?.routes?.length === 1 ? (
              <input
                type="text"
                value={bookerInfo.routes[0]}
                readOnly
                className="p-2.5 border-[3px] border-[#7f2c2c] bg-gray-100 text-[#4b2e2e] outline-none text-xs cursor-not-allowed"
              />
            ) : (
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="p-2.5 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none text-xs"
              >
                <option value="">Select Route</option>
                {(bookerInfo?.routes || []).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </motion.div>

      {/* Order Items - Compact */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-sm border border-[#7f2c2c]/10 p-3 mb-3"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <FaBoxOpen className="text-[#7f2c2c] text-xs" />
            <h3 className="text-sm font-bold text-[#4b2e2e]">Items</h3>
            {orderItems.length > 0 && (
              <span className="bg-[#7f2c2c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {orderItems.length}
              </span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={addItem}
            className="inline-flex items-center gap-1 bg-gradient-to-r from-[#7f2c2c] to-[#6d2525] text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-sm"
          >
            <FaPlus className="text-[10px]" />
            Add
          </motion.button>
        </div>

        {orderItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center bg-[#faf8f5] rounded-lg border border-dashed border-[#7f2c2c]/15">
            <FaBoxOpen className="text-lg text-[#7f2c2c]/40 mb-1" />
            <p className="text-xs text-gray-500">No items. Click Add to start.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {orderItems.map((item, index) => {
                const unitsPerPack = getUnitsPerPack(item.itemId);
                const stockTypeLabel = getStockTypeLabel(item.itemId);
                const availableUnits = Number(item.stockAvailable) || 0;
                const unitPrice = getStockPrice(item.itemId);
                const packPrice = roundPrice(unitPrice * unitsPerPack);

                return (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="relative rounded-lg border border-[#7f2c2c]/10 bg-[#fffdf9] p-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                      {/* Product */}
                      <div className="flex-1 min-w-[140px]">
                        <label className="mb-1 flex items-center gap-2 text-[10px] font-semibold text-gray-500 uppercase">
                          <FaTag className="text-[#7f2c2c]" /> Product
                        </label>
                        <select
                          value={item.itemId}
                          onChange={(e) => updateItem(index, "itemId", e.target.value)}
                          className="w-full p-2 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none text-xs"
                        >
                          <option value="">Select</option>
                          {stock.map((s) => {
                            const optionUnitsPerPack = Number(s.unitsPerPack) || 1;
                            const optionType = String(s.stockType || "pack").toLowerCase();
                            return (
                              <option key={s._id} value={s._id}>
                                {s.itemName} | {optionType} ({optionUnitsPerPack}u/{optionType})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Unit */}
                      <div className="w-full sm:w-24">
                        <label className="mb-1 flex items-center gap-2 text-[10px] font-semibold text-gray-500 uppercase">
                          <FaWarehouse className="text-[#7f2c2c]" /> Order In
                        </label>
                        <select
                          value={item.orderUnit || "unit"}
                          onChange={(e) => updateItem(index, "orderUnit", e.target.value)}
                          className="w-full p-2 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none text-xs"
                        >
                          <option value="unit">unit</option>
                          <option value={stockTypeLabel}>{stockTypeLabel}</option>
                        </select>
                      </div>

                      {/* Qty */}
                      <div className="w-full sm:w-20">
                        <label className="mb-1 flex items-center gap-2 text-[10px] font-semibold text-gray-500 uppercase">
                          <FaListOl className="text-[#7f2c2c]" /> Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.orderQuantity || 0}
                          onChange={(e) => updateItem(index, "orderQuantity", e.target.value)}
                          className="w-full p-2 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none text-xs"
                        />
                      </div>

                      {/* Remove */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeItem(index)}
                        className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 flex items-center justify-center self-end sm:self-auto"
                      >
                        <FaTrashAlt className="text-xs" />
                      </motion.button>
                    </div>

                    {/* Compact Info Row */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] bg-[#7f2c2c]/8 text-[#4b2e2e] px-1.5 py-0.5 rounded">
                        Stock: {availableUnits}u
                      </span>
                      <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                        Rs.{formatPrice(unitPrice)}/u
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                        Rs.{formatPrice(packPrice)}/{stockTypeLabel}
                      </span>
                      <span className="text-[10px] font-bold text-[#7f2c2c] ml-auto">
                        = Rs.{formatPrice(getItemTotal(item))}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Total & Submit - Inline */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {orderItems.length > 0 && (
          <div className="flex-1 bg-gradient-to-r from-[#7f2c2c] to-[#6d2525] rounded-xl shadow-md px-4 py-2 text-white flex items-center justify-between">
            <span className="text-xs font-medium text-white/80">
              {orderItems.length} item{orderItems.length > 1 ? "s" : ""}
            </span>
            <span className="text-lg font-extrabold">
              Rs. {formatPrice(totalAmount)}
            </span>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-gradient-to-r from-[#4b2e2e] to-[#7f2c2c] hover:from-[#3d2424] hover:to-[#6d2525] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shrink-0"
        >
          {submitting ? (
            <>
              <FaSpinner className="animate-spin text-xs" />
              Placing...
            </>
          ) : (
            <>
              <FaPaperPlane className="text-xs" />
              Submit Order
            </>
          )}
        </motion.button>
      </div>

      {/* Compact Footer */}
      <div className="mt-2 bg-[#f5e0c3]/30 border border-[#7f2c2c]/10 rounded-lg px-3 py-1.5 flex items-start gap-1.5">
        <FaInfoCircle className="text-[#7f2c2c] text-[10px] mt-0.5 shrink-0" />
        <p className="text-[10px] text-[#4b2e2e]/70 leading-tight">
          Order goes to FO for review. Unit / {stock.length > 0 ? String(stock[0].stockType || "pack").toLowerCase() : "pack"} orders auto-convert.
        </p>
      </div>
    </motion.div>
  );
};

export default BookerOrderForm;

