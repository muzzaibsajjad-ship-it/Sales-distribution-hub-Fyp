import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    stockType: { type: String, required: true }, // unit/carton/etc
    quantity: { type: Number, required: true }, // pack quantity for sole/distributor, unit quantity for FO/booker
    originalStockAdded: { type: Number, required: true },
    unitsPerPack: { type: Number, default: 1 },
    availableUnits: { type: Number, default: 0 },
    transferredQuantity: { type: Number, default: 0 }, // quantity already transferred
    purchasePrice: { type: Number, required: true },
    totalValue: { type: Number, required: true },
    supplierName: { type: String }, // always string
    invoiceNumber: { type: String }, // invoice for distributor
    // Stock owner: 'distributor', 'fo', or 'booker'
    ownerType: {
      type: String,
      enum: ["distributor", "fo", "booker"],
      default: "distributor",
    },
    // Original distributor (source of stock)
    originalDistributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Current owner (distributor or FO)
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Selling price - set by distributor when transferring to FO
    sellingPrice: {
      type: Number,
      default: 0,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    notes: { type: String },
    date: { type: Date, default: Date.now },
    stockTransferred: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

stockSchema.pre("save", function (next) {
  if (!this.totalValue) this.totalValue = this.quantity * this.purchasePrice;
  if (!this.originalStockAdded) this.originalStockAdded = this.quantity;
  if (!this.unitsPerPack) this.unitsPerPack = 1;
  if (this.availableUnits === null || this.availableUnits === undefined) {
    this.availableUnits = this.quantity * this.unitsPerPack;
  }
  if (!this.date) this.date = new Date();
  next();
});

export default mongoose.models.Stock || mongoose.model("Stock", stockSchema);
