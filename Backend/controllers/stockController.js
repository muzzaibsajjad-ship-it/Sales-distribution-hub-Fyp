import asyncHandler from "express-async-handler";
import Stock from "../models/Stock.js";
import StockHistory from "../models/StockHistory.js";
import Payment from "../models/Payment.js";
import { moveToHistory } from "../helpers/moveToHistory.js";
import { upsertMergedStock } from "../helpers/upsertMergedStock.js";
import {
  calculateAvailableUnits,
  getDefaultUnitsPerPack,
} from "../helpers/stockUnitConversion.js";

// Generate invoice number SOL-XXXXXX
const generateInvoiceNumber = async () => {
  const lastStock = await Stock.findOne({ invoiceNumber: { $regex: /^SOL-/ } })
    .sort({ createdAt: -1 })
    .lean();
  const lastHistory = await StockHistory.findOne({
    invoiceNumber: { $regex: /^SOL-/ },
  })
    .sort({ createdAt: -1 })
    .lean();

  const lastNumberStock = lastStock?.invoiceNumber
    ? parseInt(lastStock.invoiceNumber.slice(4))
    : 0;
  const lastNumberHistory = lastHistory?.invoiceNumber
    ? parseInt(lastHistory.invoiceNumber.slice(4))
    : 0;

  const lastNumber = Math.max(lastNumberStock, lastNumberHistory);
  return `SOL-${String(lastNumber + 1).padStart(6, "0")}`;
};

// Add stock
export const addStock = asyncHandler(async (req, res) => {
  const {
    itemName,
    stockType,
    quantity,
    unitsPerPack,
    purchasePrice,
    supplierName,
    invoiceNumber,
    notes,
    date,
  } = req.body;

  if (!itemName || !stockType || !quantity || !purchasePrice || !supplierName) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  const finalUnitsPerPack =
    Number(unitsPerPack) || getDefaultUnitsPerPack(stockType);
  const normalizedQuantity = Number(quantity);
  const normalizedPurchasePrice = Number(purchasePrice);
  const availableUnits = calculateAvailableUnits(
    normalizedQuantity,
    finalUnitsPerPack
  );

  const finalInvoiceNumber = invoiceNumber || (await generateInvoiceNumber());

  const { stock: newStock } = await upsertMergedStock({
    matchFilter: {
      createdBy: req.user._id,
      itemName,
      stockType,
      unitsPerPack: finalUnitsPerPack,
      distributorId: { $exists: false },
    },
    stockData: {
      itemName,
      stockType,
      quantity: normalizedQuantity,
      originalStockAdded: normalizedQuantity,
      unitsPerPack: finalUnitsPerPack,
      availableUnits,
      purchasePrice: normalizedPurchasePrice,
      totalValue: normalizedQuantity * normalizedPurchasePrice,
      supplierName,
      invoiceNumber: finalInvoiceNumber,
      notes,
      date: date || new Date(),
      createdBy: req.user._id, // Sole ID
    },
  });

  // Purchase Payment for Sole
  await Payment.create({
    type: "purchase",
    relatedStock: newStock._id,
    itemName,
    stockType,
    quantity,
    unitsPerPack,
    purchasePrice,
    totalAmount: quantity * purchasePrice,
    purchasedBy: req.user._id, // Sole
    soldBy: null,
    supplierName: supplierName,
    invoiceNumber: finalInvoiceNumber,
    date: date || new Date(),
  });

  res.status(201).json({ success: true, data: newStock });
});

// Get stocks for user
export const getStock = asyncHandler(async (req, res) => {
  const role = req.user.role;
  let filter = { createdBy: req.user._id };
  
  // For distributor, also exclude booker_stock type (stock received from FO)
  if (role === "distributer") {
    filter.stockType = { $ne: "booker_stock" };
  }
  
  const stocks = await Stock.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: stocks });
});

// Update stock
export const updateStock = asyncHandler(async (req, res) => {
  const stockId = req.params.id;
  const {
    itemName,
    stockType,
    quantity,
    purchasePrice,
    supplierName,
    invoiceNumber,
    notes,
    date,
  } = req.body;

  const stock = await Stock.findById(stockId);
  if (!stock) {
    res.status(404);
    throw new Error("Stock not found");
  }

  stock.itemName = itemName ?? stock.itemName;
  stock.stockType = stockType ?? stock.stockType;
  stock.quantity =
    quantity === "" || quantity === undefined
      ? stock.quantity
      : Number(quantity);
  stock.unitsPerPack =
    unitsPerPack === "" || unitsPerPack === undefined
      ? stock.unitsPerPack
      : Number(unitsPerPack);
  stock.availableUnits = calculateAvailableUnits(stock.quantity, stock.unitsPerPack);
  stock.purchasePrice = purchasePrice ?? stock.purchasePrice;
  stock.totalValue =
    (parseFloat(stock.quantity) || 0) * (parseFloat(stock.purchasePrice) || 0);
  stock.supplierName = supplierName ?? stock.supplierName;
  stock.invoiceNumber = invoiceNumber ?? stock.invoiceNumber;
  stock.notes = notes ?? stock.notes;
  stock.date = date ? new Date(date) : stock.date;

  if (stock.quantity === 0 || stock.stockTransferred === true) {
    await moveToHistory(stock, {
      movedByUserId: req.user._id,
      type: stock.stockTransferred ? "transferred" : "previousStock",
    });
    return res.json({ success: true, message: "Stock moved to history." });
  }

  const updatedStock = await stock.save();
  res.json({ success: true, data: updatedStock });
});

// History
export const getHistoryForUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;
  const roleName =
    role && role.toLowerCase().startsWith("distrib") ? "distributer" : "sole";
  const histories = await StockHistory.find({
    role: roleName,
    ownerId: userId,
  }).sort({ createdAt: -1 });
  res.json({ success: true, data: histories });
});
