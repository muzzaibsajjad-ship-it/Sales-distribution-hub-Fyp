import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["purchase", "sale"],
      required: true,
    },
    relatedStock: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    itemName: { type: String, required: true },
    stockType: { type: String },
    quantity: { type: Number, required: true },
    purchasePrice: { type: Number },
    sellingPrice: { type: Number, default: 0 }, // only for sale
    discount: { type: Number, default: 0 },
    deliveryCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    profit: { type: Number, default: 0 }, // only for sale
    purchasedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Sole
    supplierName: { type: String }, // string for supplier
    distributorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // for sale
    invoiceNumber: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);
