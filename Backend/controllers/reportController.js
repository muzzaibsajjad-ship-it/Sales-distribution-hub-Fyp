import Stock from "../models/Stock.js";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import { getDefaultUnitsPerPack, roundToTwo } from "../helpers/stockUnitConversion.js";

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
      };
      existing.quantity += qty;
      existing.totalAmount += itemRevenue;
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
    breakdown.push({
      itemName: entry.itemName,
      quantity: qty,
      totalAmount: entry.totalAmount,
      profit: entry.totalAmount - costAmount,
    });
  }

  return breakdown;
};

export const getReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    // ========== SOLE REPORT (pack-based, no unit conversion) ==========
    if (role === "sole") {
      // FO's stock - includes both:
      // 1. Stock added directly from supplier (createdBy: FO)
      // 2. Stock transferred from distributor (ownerId: FO, ownerType: "fo")
      const stockFilter = {
        $or: [
          { createdBy: userId },
          { ownerId: userId, ownerType: "fo" }
        ]
      };

      const stocks = await Stock.find(stockFilter);

      // FO: Sales are payments received from Bookers
      const salePaymentFilter = { soldBy: userId, type: "sale" };
      // FO: Purchases are stock added from supplier
      const purchasePaymentFilter = { purchasedBy: userId, soldBy: null, type: "purchase" };

      const salePayments = await Payment.find(salePaymentFilter);
      const purchasePayments = await Payment.find(purchasePaymentFilter);

      // Group report by item
      const items = stocks.map((stock) => {
        // Purchase payments for this item (stock added by distributor from Sole)
        const stockPurchases = purchasePayments.filter(
          (p) => p.itemName === stock.itemName
        );
        const totalPurchasedQty = stockPurchases.reduce(
          (a, p) => a + p.quantity,
          0
        );
        const totalPurchaseAmount = stockPurchases.reduce(
          (a, p) => a + p.totalAmount,
          0
        );

        // Sale payments for this item (sold to FO/Booker)
        const stockSales = salePayments.filter(
          (p) => p.itemName === stock.itemName
        );
        const totalSoldQty = stockSales.reduce((a, p) => a + p.quantity, 0);
        const totalSalesAmount = stockSales.reduce((a, p) => a + p.totalAmount, 0);

        // Get profit from sale payments (already calculated when payment was created)
        const totalProfitFromPayments = stockSales.reduce((a, p) => a + (p.profit || 0), 0);
        const totalProfit = totalProfitFromPayments;

        return {
          itemId: stock._id,
          itemName: stock.itemName,
          purchasedQty: totalPurchasedQty || stock.originalStockAdded,
          purchaseAmount:
            totalPurchaseAmount || stock.purchasePrice * stock.originalStockAdded,
          soldQty: totalSoldQty,
          salesAmount: totalSalesAmount,
          remainingQty: stock.quantity,
          profit: totalProfit,
        };
      });

      const totalPurchase = items.reduce((a, i) => a + i.purchaseAmount, 0);
      const totalSales = items.reduce((a, i) => a + i.salesAmount, 0);
      const totalProfit = items.reduce((a, i) => a + i.profit, 0);
      const totalStock = items.reduce((a, i) => a + i.purchasedQty, 0);
      const totalSoldQty = items.reduce((a, i) => a + i.soldQty, 0);
      const remainingStock = items.reduce((a, i) => a + i.remainingQty, 0);

      return res.json({
        success: true,
        data: {
          totalStock,
          remainingStock,
          totalSoldQty,
          totalPurchase,
          totalSales,
          totalProfit,
          items,
        },
      });
    }

    let stockFilter = {};
    if (role === "distributer") {
      stockFilter = {
        $or: [
          { distributorId: userId, stockType: { $ne: "booker_stock" } },
          { createdBy: userId, stockType: { $ne: "booker_stock" } },
        ],
      };
    }

    const stocks = await Stock.find(stockFilter);

    let salePaymentFilter = {};
    let purchasePaymentFilter = {};

    if (role === "distributer") {
      purchasePaymentFilter = {
        type: "purchase",
        purchasedBy: userId,
        stockType: { $ne: "booker_stock" },
      };
      salePaymentFilter = {
        type: "sale",
        purchasedBy: userId,
        stockType: "booker_stock",
      };
    }

    const [salePayments, purchasePayments] = await Promise.all([
      Payment.find(salePaymentFilter),
      Payment.find(purchasePaymentFilter),
    ]);

    const normalizedSalePaymentsNested = await Promise.all(
      salePayments.map(async (payment) => {
        const plain = payment.toObject();

        if (role !== "distributer") return [plain];

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

        const breakdown = await getCombinedOrderItemBreakdown(plain, userId);
        if (!breakdown.length) return [plain];

        return breakdown.map((entry, idx) => ({
          ...plain,
          _id: `${plain._id}-${idx + 1}`,
          itemName: entry.itemName,
          quantity: entry.quantity,
          purchasePrice: entry.quantity > 0 ? (entry.totalAmount - entry.profit) / entry.quantity : 0,
          sellingPrice: entry.quantity > 0 ? entry.totalAmount / entry.quantity : 0,
          totalAmount: entry.totalAmount,
          profit: entry.profit,
        }));
      })
    );

    const normalizedSalePayments = normalizedSalePaymentsNested.flat();

    const stockByItem = {};
    for (const stock of stocks) {
      const key = stock.itemName;
      if (!stockByItem[key]) {
        stockByItem[key] = {
          remainingQty: 0,
          fallbackPurchasedQty: 0,
          fallbackPurchaseAmount: 0,
          unitsPerPack: 1,
        };
      }

      const unitsPerPack = Number(stock.unitsPerPack) || 1;
      const availableUnits = Number(stock.availableUnits) || 0;
      const remainingPacks = unitsPerPack > 0 ? availableUnits / unitsPerPack : 0;

      // Convert remaining units back to pack quantity for distributor report
      stockByItem[key].remainingQty += remainingPacks;
      // fallback uses original pack quantity for purchase reference
      stockByItem[key].fallbackPurchasedQty +=
        Number(stock.originalStockAdded) || Number(stock.quantity) || 0;
      stockByItem[key].fallbackPurchaseAmount +=
        (Number(stock.purchasePrice) || 0) *
        (Number(stock.originalStockAdded) || Number(stock.quantity) || 0);
      stockByItem[key].unitsPerPack =
        unitsPerPack || stockByItem[key].unitsPerPack || 1;
    }

    const purchaseByItem = {};
    for (const payment of purchasePayments) {
      const key = payment.itemName;
      if (!purchaseByItem[key]) {
        purchaseByItem[key] = { qty: 0, amount: 0 };
      }
      purchaseByItem[key].qty += Number(payment.quantity) || 0;
      purchaseByItem[key].amount += Number(payment.totalAmount) || 0;
    }

    const saleByItem = {};
    for (const payment of normalizedSalePayments) {
      const key = payment.itemName;
      const paymentQty = Number(payment.quantity) || 0;
      const unitsPerPack = Number(stockByItem[key]?.unitsPerPack) || 1;
      const qtyInPacks = role === "distributer" && unitsPerPack > 0
        ? paymentQty / unitsPerPack
        : paymentQty;

      if (!saleByItem[key]) {
        saleByItem[key] = { qty: 0, amount: 0, profit: 0 };
      }
      saleByItem[key].qty += qtyInPacks;
      saleByItem[key].amount += Number(payment.totalAmount) || 0;
      saleByItem[key].profit += Number(payment.profit) || 0;
    }

    const itemNames = new Set([
      ...Object.keys(stockByItem),
      ...Object.keys(purchaseByItem),
      ...Object.keys(saleByItem),
    ]);

    const items = Array.from(itemNames).map((itemName) => {
      const stockMeta = stockByItem[itemName] || {
        remainingQty: 0,
        fallbackPurchasedQty: 0,
        fallbackPurchaseAmount: 0,
        unitsPerPack: 1,
      };
      const purchaseMeta = purchaseByItem[itemName] || { qty: 0, amount: 0 };
      const saleMeta = saleByItem[itemName] || { qty: 0, amount: 0, profit: 0 };

      const purchasedQty =
        purchaseMeta.qty > 0 ? purchaseMeta.qty : stockMeta.fallbackPurchasedQty;
      const purchaseAmount =
        purchaseMeta.amount > 0
          ? purchaseMeta.amount
          : stockMeta.fallbackPurchaseAmount;
      const computedRemaining = roundToTwo(Math.max(0, purchasedQty - saleMeta.qty));
      const remainingQty = stockMeta.remainingQty > 0
        ? roundToTwo(Math.min(stockMeta.remainingQty, computedRemaining))
        : computedRemaining;

      return {
        itemId: itemName,
        itemName,
        purchasedQty: roundToTwo(purchasedQty),
        purchaseAmount,
        soldQty: roundToTwo(saleMeta.qty),
        salesAmount: saleMeta.amount,
        remainingQty,
        profit: saleMeta.profit,
        unitsPerPack: stockMeta.unitsPerPack || 1,
      };
    });

    const totalPurchase = purchasePayments.reduce(
      (sum, payment) => sum + (Number(payment.totalAmount) || 0),
      0
    );
    const totalSales = normalizedSalePayments.reduce(
      (sum, payment) => sum + (Number(payment.totalAmount) || 0),
      0
    );
    const totalProfit = normalizedSalePayments.reduce(
      (sum, payment) => sum + (Number(payment.profit) || 0),
      0
    );

    const totalStock = roundToTwo(
      items.reduce((sum, item) => sum + (Number(item.purchasedQty) || 0), 0)
    );
    const totalSoldQty = roundToTwo(
      items.reduce((sum, item) => sum + (Number(item.soldQty) || 0), 0)
    );
    const remainingStock = roundToTwo(
      items.reduce((sum, item) => sum + (Number(item.remainingQty) || 0), 0)
    );

    res.json({
      success: true,
      data: {
        totalStock,
        remainingStock,
        totalSoldQty,
        totalPurchase,
        totalSales,
        totalProfit,
        items,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
