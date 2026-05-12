import Stock from "../models/Stock.js";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const upsertMergedStock = async ({ matchFilter, stockData }) => {
  const incomingQuantity = toNumber(stockData.quantity);
  const incomingUnitsPerPack = toNumber(stockData.unitsPerPack, 1);
  const incomingAvailableUnits =
    stockData.availableUnits !== undefined
      ? toNumber(stockData.availableUnits)
      : incomingQuantity * incomingUnitsPerPack;
  const incomingPurchasePrice = toNumber(stockData.purchasePrice);
  const incomingTotalValue =
    stockData.totalValue !== undefined
      ? toNumber(stockData.totalValue)
      : incomingQuantity * incomingPurchasePrice;

  const existingStock = await Stock.findOne(matchFilter);

  if (!existingStock) {
    const createdStock = await Stock.create({
      ...stockData,
      quantity: incomingQuantity,
      originalStockAdded: toNumber(stockData.originalStockAdded, incomingQuantity),
      unitsPerPack: incomingUnitsPerPack,
      availableUnits: incomingAvailableUnits,
      purchasePrice: incomingPurchasePrice,
      totalValue: incomingTotalValue,
    });

    return { stock: createdStock, merged: false };
  }

  const currentQuantity = toNumber(existingStock.quantity);
  const mergedQuantity = currentQuantity + incomingQuantity;

  existingStock.quantity = mergedQuantity;
  existingStock.originalStockAdded =
    toNumber(existingStock.originalStockAdded, currentQuantity) + incomingQuantity;
  existingStock.unitsPerPack = incomingUnitsPerPack;
  existingStock.availableUnits =
    toNumber(existingStock.availableUnits, currentQuantity * incomingUnitsPerPack) +
    incomingAvailableUnits;
  existingStock.purchasePrice = incomingPurchasePrice;
  existingStock.totalValue = mergedQuantity * incomingPurchasePrice;
  existingStock.supplierName =
    stockData.supplierName ?? existingStock.supplierName;
  existingStock.invoiceNumber =
    stockData.invoiceNumber ?? existingStock.invoiceNumber;
  existingStock.notes = stockData.notes ?? existingStock.notes;
  existingStock.date = stockData.date ?? new Date();

  if (stockData.orderId) {
    existingStock.orderId = stockData.orderId;
  }

  if (stockData.sellingPrice !== undefined && toNumber(existingStock.sellingPrice) === 0) {
    existingStock.sellingPrice = toNumber(stockData.sellingPrice);
  }

  await existingStock.save();
  return { stock: existingStock, merged: true };
};
