import asyncHandler from "express-async-handler";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import Stock from "../models/Stock.js";
import { getDefaultUnitsPerPack } from "../helpers/stockUnitConversion.js";

const getDistributorUnitCostFromPurchases = async (distributorId, itemName) => {
  const purchases = await Payment.find({
    type: "purchase",
    purchasedBy: distributorId,
    stockType: { $ne: "booker_stock" },
    itemName,
  }).select("quantity totalAmount purchasePrice stockType");

  const stockDocs = await Stock.find({
    distributorId,
    itemName,
    stockType: { $ne: "booker_stock" },
  }).select("stockType unitsPerPack");

  const unitsPerPackMap = new Map();
  for (const stock of stockDocs) {
    const key = String(stock.stockType || "").toLowerCase();
    const unitsPerPack =
      Number(stock.unitsPerPack) || getDefaultUnitsPerPack(stock.stockType);
    if (key && !unitsPerPackMap.has(key)) {
      unitsPerPackMap.set(key, unitsPerPack);
    }
  }

  // Distributor always purchases from Sole in packs (carton/packet/box).
  // Convert every purchase quantity to units for accurate per-unit cost.
  const totalQtyInUnits = purchases.reduce((sum, p) => {
    const qty = Number(p.quantity) || 0;
    if (qty <= 0) return sum;

    const typeKey = String(p.stockType || "").toLowerCase();
    const unitsPerPack =
      unitsPerPackMap.get(typeKey) || getDefaultUnitsPerPack(p.stockType);
    return sum + qty * (Number(unitsPerPack) || 1);
  }, 0);
  const totalAmount = purchases.reduce(
    (sum, p) => sum + (Number(p.totalAmount) || 0),
    0
  );

  if (totalQtyInUnits > 0 && totalAmount > 0) {
    return totalAmount / totalQtyInUnits;
  }

  // Fallback for edge cases where historical purchase payments are missing
  const lastPurchase = purchases[0];
  if (lastPurchase) {
    const qty = Number(lastPurchase.quantity) || 0;
    const typeKey = String(lastPurchase.stockType || "").toLowerCase();
    const unitsPerPack =
      unitsPerPackMap.get(typeKey) || getDefaultUnitsPerPack(lastPurchase.stockType);

    if (qty > 0 && Number(lastPurchase.totalAmount) > 0) {
      return Number(lastPurchase.totalAmount) / (qty * unitsPerPack);
    }
    return (Number(lastPurchase.purchasePrice) || 0) / unitsPerPack;
  }

  return 0;
};

const getCombinedOrderItemBreakdown = async (paymentDoc, distributorId) => {
  if (!paymentDoc?.relatedOrder) return [];

  const combinedOrder = await Order.findById(paymentDoc.relatedOrder).select("linkedBookerOrders");
  if (!combinedOrder?.linkedBookerOrders?.length) {
    return [];
  }

  const linkedOrders = await Order.find({
    _id: { $in: combinedOrder.linkedBookerOrders },
  }).select("items");

  const itemMap = new Map();

  for (const order of linkedOrders) {
    for (const item of order.items || []) {
      const key = String(item.productName || "");
      const qty = Number(item.quantity) || 0;
      const unitSellingPrice = Number(item.sellingPrice) || 0;
      const itemRevenue = unitSellingPrice * qty;

      const existing = itemMap.get(key) || {
        itemName: key,
        quantity: 0,
        totalAmount: 0,
        sellingPrice: unitSellingPrice,
      };
      existing.quantity += qty;
      existing.totalAmount += itemRevenue;
      existing.sellingPrice = unitSellingPrice || existing.sellingPrice;
      itemMap.set(key, existing);
    }
  }

  const breakdown = [];
  for (const entry of itemMap.values()) {
    const qty = Number(entry.quantity) || 0;
    if (qty <= 0) continue;
      const unitCost = await getDistributorUnitCostFromPurchases(
        distributorId,
      entry.itemName
      );

    const costAmount = unitCost * qty;
    const profit = entry.totalAmount - costAmount;

    breakdown.push({
      itemName: entry.itemName,
      stockType: "booker_stock",
      quantity: qty,
      purchasePrice: unitCost,
      sellingPrice: entry.sellingPrice,
      discount: 0,
      deliveryCharges: 0,
      totalAmount: entry.totalAmount,
      profit,
      soldBy: paymentDoc.soldBy,
      purchasedBy: paymentDoc.purchasedBy,
      distributorId: paymentDoc.distributorId,
      invoiceNumber: paymentDoc.invoiceNumber,
      date: paymentDoc.date,
      relatedOrder: paymentDoc.relatedOrder,
      createdAt: paymentDoc.createdAt,
      updatedAt: paymentDoc.updatedAt,
    });
  }

  return breakdown;
};

export const getPayments = asyncHandler(async (req, res) => {
  const { type } = req.query; // "purchase" or "sale"
  const userId = req.user._id;
  const role = req.user.role;

  let filter = {};

  if (role === "sole") {
    if (type === "purchase") {
      // Sole sees only payments where they added stock from supplier
      filter = { type: "purchase", purchasedBy: userId, soldBy: null }; // supplier payments
    } else if (type === "sale") {
      // Sole sees payments they received from distributors
      filter = { type: "sale", soldBy: userId, purchasedBy: { $ne: null } };
    }
  } else if (role === "distributer") {
    if (type === "purchase") {
      // Distributor sees only payments where they purchased from Sole (not from FO/booker)
      // Exclude booker_stock type - only show stock purchased from Sole
      filter = { 
        type: "purchase", 
        purchasedBy: userId,
        stockType: { $ne: "booker_stock" }
      };
    } else if (type === "sale") {
      // Distributor sees ONLY FO/Booker payments (not Sole payments)
      // Filter by purchasedBy AND stockType = booker_stock
      filter = { 
        type: "sale", 
        purchasedBy: userId,
        stockType: "booker_stock" 
      };
    }
  }

  const payments = await Payment.find(filter)
    .populate("soldBy", "name")
    .populate("purchasedBy", "name")
    .populate("distributorId", "name")
    .sort({ createdAt: -1 });

  if (role === "distributer" && type === "sale") {
    const normalizedNested = await Promise.all(
      payments.map(async (payment) => {
        const plain = payment.toObject();
        const isLegacyCombined =
          plain.stockType === "booker_stock" &&
          typeof plain.itemName === "string" &&
          plain.itemName.startsWith("Combined Payment -");

        if (!isLegacyCombined) {
          const qty = Number(plain.quantity) || 0;
          const unitCost = await getDistributorUnitCostFromPurchases(
            userId,
            plain.itemName
          );
          const unitSelling =
            qty > 0
              ? (Number(plain.totalAmount) || 0) / qty
              : Number(plain.sellingPrice) || 0;
          const totalAmount = unitSelling * qty;
          const profit = (unitSelling - unitCost) * qty;

          return [
            {
              ...plain,
              purchasePrice: unitCost,
              sellingPrice: unitSelling,
              totalAmount,
              profit,
            },
          ];
        }

        const breakdown = await getCombinedOrderItemBreakdown(
          plain,
          userId
        );
        if (!breakdown.length) return [plain];

        return breakdown.map((item, idx) => ({
          ...item,
          _id: `${plain._id}-${idx + 1}`,
          totalAmount:
            (Number(item.sellingPrice) || 0) * (Number(item.quantity) || 0),
          profit:
            ((Number(item.sellingPrice) || 0) - (Number(item.purchasePrice) || 0)) *
            (Number(item.quantity) || 0),
        }));
      })
    );

    const normalized = normalizedNested.flat().sort(
      (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
    );

    return res.json({ success: true, data: normalized });
  }

  res.json({ success: true, data: payments });
});
