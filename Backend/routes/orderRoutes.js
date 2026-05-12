
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getVisibleStocksForDistributor,
  createOrder,
  approveOrderStock,
  submitPayment,
  confirmPayment,
  completeOrder,
  getOrders,
  getPendingOrders,
  cancelOrder,
  // New booker workflow functions
  getBookerStock,
  createBookerOrder,
  getFOBookerOrders,
  getFOCombinedOrders,
  combineBookerOrders,
  getDistributorCombinedOrders,
  approveCombinedOrder,
  rejectCombinedOrder,
  transferStockToFO,
  setDefaultSellingPrice,
  getDistributorStockWithPrices,
  // New payment functions for combined orders
  submitCombinedOrderPayment,
  confirmCombinedOrderPayment,
  // Booker functions
  getBookerOrders,
  bookerSubmitPayment,
  distributeToBooker,
  confirmBookerDelivery,
  getFOTargetAchievement,
  getFOBookersPerformance,
// New payment confirmation functions
  confirmBookerPayment,
  getFOPaymentConfirmations,
  getFOPaymentPending,
  sendCombinedPaymentToDistributor,
  getDistributorCombinedPayments,
  completeOrderFromFO,
  // FO Stock Transfer Report
  getFOStockTransferReport,
  // Invoice number generation
  getNextInvoiceNumber,
} from "../controllers/orderController.js";

const router = express.Router();

// Distributor → visible stocks
router.get("/items", protect, getVisibleStocksForDistributor);

// Distributor → create order
router.post("/create", protect, createOrder);

// Sole → approve stock & set price
router.put("/approve-stock", protect, approveOrderStock);

// Distributor → submit payment
router.put("/submit-payment", protect, upload.single("proof"), submitPayment);

// Sole → confirm payment
router.put("/confirm-payment", protect, confirmPayment);

// Sole → manually complete order after payment is received
router.put("/complete", protect, completeOrder);

// Get next invoice number
router.get("/next-invoice", protect, getNextInvoiceNumber);

// Get all orders (role-based)
router.get("/", protect, getOrders);

// Get pending orders
router.get("/pending", protect, getPendingOrders);

router.put("/cancel-order", protect, cancelOrder);

// ===== BOOKER ORDER WORKFLOW ROUTES =====

// Booker: Get available stock from distributor
router.get("/booker/stock", protect, getBookerStock);

// Booker: Place an order
router.post("/booker/create", protect, createBookerOrder);

// FO: Get pending booker orders
router.get("/fo/booker-orders", protect, getFOBookerOrders);

// FO: Get combined orders (approved, waiting for stock transfer)
router.get("/fo/combined-orders", protect, getFOCombinedOrders);

// FO: Combine booker orders
router.post("/fo/combine", protect, combineBookerOrders);

// Distributor: Get combined orders awaiting approval
router.get("/distributor/combined", protect, getDistributorCombinedOrders);

// Distributor: Approve combined order with selling prices
router.put("/distributor/approve", protect, approveCombinedOrder);

// Distributor: Reject combined order
router.put("/distributor/reject", protect, rejectCombinedOrder);

// FO: Transfer stock from distributor to FO
router.put("/fo/transfer-stock", protect, transferStockToFO);

// Distributor: Set default selling price for stock
router.put("/distributor/set-price", protect, setDefaultSellingPrice);

// Distributor: Get their stock with selling prices
router.get("/distributor/stock-prices", protect, getDistributorStockWithPrices);

// Distributor: Submit payment for combined order
router.put("/distributor/submit-payment", protect, upload.single("proof"), submitCombinedOrderPayment);

// Sole: Confirm payment for combined order
router.put("/sole/confirm-payment", protect, confirmCombinedOrderPayment);

// Booker: Get their own orders with status
router.get("/booker/orders", protect, getBookerOrders);

// Booker: Submit payment for their order
router.put("/booker/submit-payment", protect, upload.single("proof"), bookerSubmitPayment);

// Booker: Confirm delivery - deduct stock when delivered to customer
router.put("/booker/confirm-delivery", protect, confirmBookerDelivery);

// FO: Distribute stock to booker
router.put("/fo/distribute-to-booker", protect, distributeToBooker);

// FO: Get real-time target achievement
router.get("/fo/target-achievement", protect, getFOTargetAchievement);

// FO: Get live performance of all assigned bookers
router.get("/fo/bookers-performance", protect, getFOBookersPerformance);

// FO: Get booker orders with submitted payments (waiting for FO confirmation)
router.get("/fo/payment-confirmations", protect, getFOPaymentConfirmations);

// FO: Get payment pending records for distributed orders
router.get("/fo/payment-pending", protect, getFOPaymentPending);

// FO: Confirm booker payment
router.put("/fo/confirm-payment", protect, confirmBookerPayment);

// FO: Send combined payment to distributor
router.put("/fo/send-combined-payment", protect, upload.single("proof"), sendCombinedPaymentToDistributor);

// Distributor: Get combined payments from FO
router.get("/distributor/combined-payments", protect, getDistributorCombinedPayments);

// Distributor: Complete order after receiving payment
router.put("/distributor/complete-order", protect, completeOrderFromFO);

// Distributor: Get FO stock transfer report
router.get("/distributor/fo-stock-report", protect, getFOStockTransferReport);

export default router;
