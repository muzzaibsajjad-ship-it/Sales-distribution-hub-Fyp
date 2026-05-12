import express from "express";
import Stock from "../models/Stock.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import ItemVisibility from "../models/ItemVisibility.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:role", protect, async (req, res) => {
  const role = req.params.role;
  const userId = req.user._id;

  try {
    // --------------------- SOLE ---------------------
    if (role === "sole") {
      const stocks = await Stock.find({ createdBy: userId });
      const distributorsCount = await User.countDocuments({
        role: "distributer",
      });

      const allOrders = await Order.find().populate("itemId");
      const pendingOrders = allOrders.filter(
        (o) => o.status === "pending"
      ).length;
      const completedOrders = allOrders.filter(
        (o) => o.status === "completed"
      ).length;

      // Fetch sale payments (same logic as report controller)
      const salePayments = await Payment.find({ soldBy: userId, type: "sale" });

      let salesTotal = 0;
      let totalProfit = 0;
      const paymentDetails = salePayments.map((p) => {
        const total = p.totalAmount || 0;
        const profit = p.profit || 0;

        salesTotal += total;
        totalProfit += profit;

        return {
          itemName: p.itemName,
          quantity: p.quantity,
          totalAmount: total,
          profit,
        };
      });

      const stockDetails = stocks.map((s) => ({
        itemName: s.itemName,
        availableQty: s.quantity,
        purchasePrice: s.purchasePrice,
      }));

      return res.json({
        success: true,
        data: {
          totalStock: stocks.length,
          transferredStock: stocks.reduce(
            (a, b) => a + (b.transferredQuantity || 0),
            0
          ),
          remainingStock: stocks.reduce((a, b) => a + (b.quantity || 0), 0),
          distributors: distributorsCount,
          pendingOrders,
          completedOrders,
          salesTotal,
          totalProfit,
          stockDetails,
          paymentDetails,
        },
      });
    }

    // ----------------- DISTRIBUTER -----------------
    // Distributor stock - exclude booker_stock (stock transferred from FO to booker)
    const distributorStocks = await Stock.find({
      $or: [
        { distributorId: userId, stockType: { $ne: "booker_stock" } },
        { createdBy: userId, stockType: { $ne: "booker_stock" } },
      ],
    });
    const stockDetails = distributorStocks.map((s) => ({
      itemName: s.itemName,
      availableQty: s.availableUnits && s.unitsPerPack ? 
        Math.round((Number(s.availableUnits) / Number(s.unitsPerPack)) * 100) / 100 : 
        Number(s.quantity) || 0,
      purchasePrice: s.purchasePrice,
      unitsPerPack: Number(s.unitsPerPack) || 1,
    }));

    // Count FOs (Field Officers) created by this distributor
    const foCount = await User.countDocuments({
      createdBy: userId,
      role: "FO",
    });

    // Orders
    const myOrders = await Order.find({ distributorId: userId });
    const myPendingOrders = myOrders.filter(
      (o) => o.status === "pending"
    ).length;
    const myCompletedOrders = myOrders.filter(
      (o) => o.status === "completed"
    ).length;

    // Sales & Profit from Payments (only sales to FO/Booker - stockType: booker_stock)
    // This matches the report controller logic for distributor
    const salesPayments = await Payment.find({
      purchasedBy: userId,
      type: "sale",
      stockType: "booker_stock",
    });

    let salesTotal = 0;
    let totalProfit = 0;
    const paymentDetails = salesPayments.map((p) => {
      const total = p.totalAmount || 0;
      const profit = p.profit || 0;

      salesTotal += total;
      totalProfit += profit;

      return {
        itemName: p.itemName,
        quantity: p.quantity,
        totalAmount: total,
        profit,
      };
    });

    const remainingStock = distributorStocks.reduce(
      (sum, s) => {
        const remainingPacks = s.availableUnits && s.unitsPerPack ? 
          Number(s.availableUnits) / Number(s.unitsPerPack) : 
          Number(s.quantity) || 0;
        return sum + remainingPacks;
      },
      0
    );
    const totalStockValue = distributorStocks.reduce(
      (sum, s) => sum + (Number(s.quantity) || 0) * (Number(s.purchasePrice) || 0),
      0
    );

    return res.json({
      success: true,
      data: {
        visibleStock: stockDetails,
        stockDetails,
        myPendingOrders,
        myCompletedOrders,
        salesTotal,
        totalProfit,
        paymentDetails,
        remainingStock,
        totalStockValue,
        bookers: foCount,
      },
    });

    // --------------------- FO ---------------------
    if (role === "FO") {
      const bookers = await User.countDocuments({
        createdBy: userId,
        role: "booker",
      });

      // Optional: FO orders
      const myOrders = await Order.find({}).populate("itemId");
      const pendingOrders = myOrders.filter(
        (o) => o.status === "pending"
      ).length;
      const completedOrders = myOrders.filter(
        (o) => o.status === "completed"
      ).length;

      let salesTotal = 0;
      let totalProfit = 0;
      const paymentDetails = myOrders
        .filter((o) => o.status === "completed")
        .map((o) => {
          const qty = o.quantity || 0;
          const sell = o.sellingPrice || 0;
          const cost = o.itemId?.purchasePrice || 0;
          const discount = o.discount || 0;
          const delivery = o.deliveryCharges || 0;
          const total = qty * sell + delivery - discount;
          const profit = (sell - cost) * qty + delivery - discount;

          salesTotal += total;
          totalProfit += profit;

          return {
            itemName: o.itemId?.itemName,
            quantity: qty,
            totalAmount: total,
            profit,
          };
        });

      return res.json({
        success: true,
        data: {
          bookers,
          pendingOrders,
          completedOrders,
          salesTotal,
          totalProfit,
          paymentDetails,
        },
      });
    }

    // -------------------- BOOKER --------------------
    if (role === "booker") {
      const myOrders = await Order.find({ createdBy: userId }).populate(
        "itemId"
      );
      const pendingOrders = myOrders.filter(
        (o) => o.status === "pending"
      ).length;
      const completedOrders = myOrders.filter(
        (o) => o.status === "completed"
      ).length;

      let salesTotal = 0;
      let totalProfit = 0;
      const paymentDetails = myOrders
        .filter((o) => o.status === "completed")
        .map((o) => {
          const qty = o.quantity || 0;
          const sell = o.sellingPrice || 0;
          const cost = o.itemId?.purchasePrice || 0;
          const discount = o.discount || 0;
          const delivery = o.deliveryCharges || 0;
          const total = qty * sell + delivery - discount;
          const profit = (sell - cost) * qty + delivery - discount;

          salesTotal += total;
          totalProfit += profit;

          return {
            itemName: o.itemId?.itemName,
            quantity: qty,
            totalAmount: total,
            profit,
          };
        });

      return res.json({
        success: true,
        data: {
          pendingOrders,
          completedOrders,
          salesTotal,
          totalProfit,
          paymentDetails,
        },
      });
    }

    res.status(400).json({ success: false, message: "Invalid role!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
