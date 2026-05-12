import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  // Order type: 'booker' (individual booker order) or 'combined' (FO combined order)
  orderType: {
    type: String,
    enum: ["booker", "combined"],
    default: "booker",
  },
  // For booker orders: reference to original booker order
  bookerOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  // Links to related booker orders (for combined orders)
  linkedBookerOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  }],
  // User references
  distributorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  foId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  bookerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // Area and route references
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Area",
  },
  routeId: {
    type: String,
  },
  // Shop details (for booker shop orders)
  shopName: {
    type: String,
  },
  shopAddress: {
    type: String,
  },
  // Who created the order
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Items array for order
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      required: true,
    },
    productName: String,
    stockType: String,
    unitsPerPack: {
      type: Number,
      default: 1,
    },
    // How user placed order: unit or pack type (carton/packet/box)
    orderUnit: {
      type: String,
      default: "unit",
    },
    // Quantity entered by user in selected orderUnit
    orderQuantity: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
    },
    // Selling price - LOCKED once distributor approves
    sellingPrice: {
      type: Number,
      default: 0,
    },
    // Original/estimated price from distributor
    estimatedPrice: {
      type: Number,
      default: 0,
    },
  }],
  // Legacy single item support (for backward compatibility)
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stock",
  },
  quantity: { type: Number },
  // Payment method
  paymentMethod: {
    type: String,
    enum: ["cash", "check", "bank transfer"],
  },
  // Order status - expanded workflow
  status: {
    type: String,
    enum: [
      "pending",           // Booker created order, waiting for FO
      "fo_combined",      // FO combined orders, waiting for distributor
      "distributor_approved",  // Distributor approved, waiting for stock transfer
      "stock_transferred", // Stock transferred to FO
      "distributed",      // FO distributed to bookers - stock received by booker
      "delivered",        // Booker confirmed delivery to customer - stock deducted
      "payment_pending",   // Payment pending
      "payment_submitted", // Payment submitted by booker
      "payment_confirmed", // FO confirmed booker's payment
      "payment_sent_to_distributor", // FO sent combined payment to distributor
      "payment_submitted_to_distributor", // Distributor received combined payment
      "payment_received",  // Payment received by distributor
      "stockApproved",    // Legacy - for single item orders
      "completed",        // Fully completed
      "canceled",         // Order canceled
      "rejected",         // Rejected by distributor
    ],
    default: "pending",
  },
  // Pricing (set by distributor)
  sellingPrice: { type: Number }, // Legacy field
  discount: { type: Number, default: 0 },
  deliveryCharges: { type: Number, default: 0 },
  // Total amounts
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  // Payment info
  payment: {
    invoiceNumber: String,
    amount: Number,
    method: String,
    proof: String,
  },
  // Notes
  notes: { type: String },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  distributorApprovedAt: { type: Date },
  stockTransferredAt: { type: Date },
  completedAt: { type: Date },
});

export default mongoose.model("Order", orderSchema);
