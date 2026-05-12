// helpers/moveToHistory.js
import StockHistory from "../models/StockHistory.js";


export const moveToHistory = async (stockDoc, options = {}) => {
  const {
    movedByUserId = stockDoc.createdBy,
    type = "previousStock",
    note,
  } = options;

  const historyPayload = {
    itemName: stockDoc.itemName,
    stockType: stockDoc.stockType,
    quantity: stockDoc.quantity ?? 0,
    originalStockAdded: stockDoc.originalStockAdded ?? stockDoc.quantity ?? 0,
    purchasePrice: stockDoc.purchasePrice ?? 0,
    sellingPrice: stockDoc.sellingPrice ?? 0,
    totalValue:
      stockDoc.totalValue ??
      (stockDoc.quantity || 0) * (stockDoc.purchasePrice || 0),
    supplierName: stockDoc.supplierName || null,
    invoiceNumber: stockDoc.invoiceNumber || null,
    type,
    distributorId: stockDoc.distributorId || null,
    orderId: stockDoc.orderId || null,
    role: stockDoc.distributorId ? "distributer" : "sole",
    ownerId: movedByUserId,
    notes: note || stockDoc.notes || `Moved from Stock (${stockDoc._id})`,
    date: new Date(),
  };

  const created = await StockHistory.create(historyPayload);

  // remove original stock doc
  await stockDoc.deleteOne();

  return created;
};
