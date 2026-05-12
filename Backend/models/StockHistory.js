// models/StockHistory.js
import mongoose from "mongoose";

const stockHistorySchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    stockType: { type: String },
    quantity: { type: Number, required: true }, // at time of moving (usually 0)
    originalStockAdded: { type: Number },
    purchasePrice: { type: Number },
    sellingPrice: { type: Number, default: 0 },
    totalValue: { type: Number },
    supplierName: { type: String },
    invoiceNumber: { type: String, default: null },
    paymentProof: { type: String, default: null },
    type: {
      type: String,
      enum: ["previousStock", "transferred", "manual", "delivered"],
      default: "previousStock",
    },
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    // role & owner to distinguish sole vs distributor
    role: { type: String, enum: ["sole", "distributer"], required: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.StockHistory ||
  mongoose.model("StockHistory", stockHistorySchema);
