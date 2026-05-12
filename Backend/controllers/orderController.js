import Order from "../models/Order.js";
// import User from "../models/User.js";
import Stock from "../models/Stock.js";
import ItemVisibility from "../models/ItemVisibility.js";
import asyncHandler from "express-async-handler";
import { moveToHistory } from "../helpers/moveToHistory.js";
import StockHistory from "../models/StockHistory.js";
import Payment from "../models/Payment.js";
import { upsertMergedStock } from "../helpers/upsertMergedStock.js";
import {
  calculateAvailableUnits,
  calculateInventoryValueFromUnits,
  calculatePerUnitPrice,
  getDefaultUnitsPerPack,
} from "../helpers/stockUnitConversion.js";
// GET visible stocks for distributor
export const getVisibleStocksForDistributor = async (req, res) => {
  try {
    const distributorId = req.user._id;

    // Only get stock from Sole (exclude booker_stock from FO)
    const stocks = await Stock.find({ 
      stockType: { $ne: "booker_stock" }
    });
    const visibility = await ItemVisibility.find({
      distributorId,
      visible: true,
    });

    const visibleStocks = stocks.filter((stock) =>
      visibility.some((v) => v.stockId.toString() === stock._id.toString())
    );

    res.json({ success: true, visibleStocks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Distributor creates order
export const createOrder = async (req, res) => {
  try {
    const { itemId, quantity, paymentMethod } = req.body;

    const order = new Order({
      distributorId: req.user._id, // distributor placing the order
      itemId,
      quantity,
      paymentMethod,
      createdBy: req.user._id, // track who created the order (distributor in this case)
    });

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Sole approves stock & sets price
export const approveOrderStock = async (req, res) => {
  try {
    const {
      orderId,
      sellingPrice,
      discount = 0,
      deliveryCharges = 0,
      quantity,
    } = req.body;
    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    // Update order details
    order.quantity = quantity || order.quantity;
    order.sellingPrice = sellingPrice;
    order.discount = discount;
    order.deliveryCharges = deliveryCharges;
    order.status = "distributor_approved";

    // ✅ DO NOT deduct stock here
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const submitPayment = asyncHandler(async (req, res) => {
  const { orderId, invoiceNumber, amount, method } = req.body;
  const order = await Order.findById(orderId)
    .populate("distributorId");
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (!req.file)
    return res.status(400).json({ message: "Payment proof required" });

  // Generate invoice number for Distributor to Sole payment if not provided
  let finalInvoiceNumber = invoiceNumber;
  if (!finalInvoiceNumber) {
    const distributorUser = await User.findById(order.distributorId._id);
    let invoicePrefix = "DIS";
    if (distributorUser && distributorUser.name) {
      const nameParts = distributorUser.name.split(" ");
      const initials = nameParts.map(n => n[0]).join("").toUpperCase().slice(0, 4);
      invoicePrefix = `DIS-${initials}`;
    } else {
      invoicePrefix = "DIS-0000";
    }
    
    // Find last invoice number for this distributor
    const lastOrder = await Order.findOne({ 
      distributorId: order.distributorId._id,
      "payment.invoiceNumber": { $regex: new RegExp(`^${invoicePrefix}`) }
    })
      .sort({ createdAt: -1 })
      .lean();
    
    let lastNumber = 0;
    if (lastOrder?.payment?.invoiceNumber) {
      const match = lastOrder.payment.invoiceNumber.match(/(\d+)$/);
      if (match) lastNumber = parseInt(match[1]);
    }
    finalInvoiceNumber = `${invoicePrefix}-${String(lastNumber + 1).padStart(5, '0')}`;
  }

order.payment = {
    invoiceNumber: finalInvoiceNumber,
    amount: Number(amount),
    method,
    proof: req.file.filename,
  };

  order.status = "payment_submitted";
  await order.save();
  res.json({ success: true, order });
});

// Generate next invoice number
export const getNextInvoiceNumber = asyncHandler(async (req, res) => {
  const { type } = req.query; // 'distributor', 'booker', 'fo'
  const userId = req.user._id;
  const user = await User.findById(userId);
  
  let invoicePrefix = "INV";
  if (type === 'distributor' || req.user.role === 'distributor') {
    invoicePrefix = "DIS";
    if (user && user.name) {
      const nameParts = user.name.split(" ");
      const initials = nameParts.map(n => n[0]).join("").toUpperCase().slice(0, 4);
      invoicePrefix = `DIS-${initials}`;
    } else {
      invoicePrefix = "DIS-0000";
    }
  } else if (type === 'booker' || req.user.role === 'booker') {
    invoicePrefix = "BO";
    if (user && user.name) {
      const nameParts = user.name.split(" ");
      const initials = nameParts.map(n => n[0]).join("").toUpperCase().slice(0, 4);
      invoicePrefix = `BO-${initials}`;
    } else {
      invoicePrefix = "BO-0000";
    }
  } else if (type === 'fo' || req.user.role === 'fo') {
    invoicePrefix = "FO";
    if (user && user.name) {
      const nameParts = user.name.split(" ");
      const initials = nameParts.map(n => n[0]).join("").toUpperCase().slice(0, 4);
      invoicePrefix = `FO-${initials}`;
    } else {
      invoicePrefix = "FO-0000";
    }
  }
  
  // Find last invoice number for this user type
  let query = {};
  if (type === 'distributor' || req.user.role === 'distributor') {
    query = { distributorId: userId, "payment.invoiceNumber": { $regex: new RegExp(`^${invoicePrefix}`) } };
  } else if (type === 'booker' || req.user.role === 'booker') {
    query = { bookerId: userId, orderType: "booker", "payment.invoiceNumber": { $regex: new RegExp(`^${invoicePrefix}`) } };
  } else if (type === 'fo' || req.user.role === 'fo') {
    query = { foId: userId, orderType: "combined", "payment.invoiceNumber": { $regex: new RegExp(`^${invoicePrefix}`) } };
  }
  
  const lastOrder = await Order.findOne(query)
    .sort({ createdAt: -1 })
    .lean();
  
  let lastNumber = 0;
  if (lastOrder?.payment?.invoiceNumber) {
    const match = lastOrder.payment.invoiceNumber.match(/(\d+)$/);
    if (match) lastNumber = parseInt(match[1]);
  }
  
  const invoiceNumber = `${invoicePrefix}-${String(lastNumber + 1).padStart(5, '0')}`;
  res.json({ success: true, invoiceNumber });
});

// Sole: Manually complete order - does stock transfer and payment recording
export const completeOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId)
    .populate("itemId")
    .populate("distributorId")
    .populate("createdBy");

  if (!order) throw new Error("Order not found");
  
  // Check if payment has been submitted (status pending with payment proof)
  if (!order.payment || !order.payment.proof) {
    throw new Error("No payment submitted for this order");
  }
  if (order.status !== "pending") {
    throw new Error("Can only complete orders with submitted payment");
  }

  // Generate invoice number for Distributor to Sole payment if not exists
  if (!order.payment.invoiceNumber) {
    const distributorUser = await User.findById(order.distributorId._id);
    let invoicePrefix = "DIS";
    if (distributorUser && distributorUser.name) {
      const nameParts = distributorUser.name.split(" ");
      const initials = nameParts.map(n => n[0]).join("").toUpperCase().slice(0, 4);
      invoicePrefix = `DIS-${initials}`;
    } else {
      invoicePrefix = "DIS-0000";
    }
    
    // Find last invoice number for this distributor
    const lastOrder = await Order.findOne({ 
      distributorId: order.distributorId._id,
      "payment.invoiceNumber": { $regex: new RegExp(`^${invoicePrefix}`) }
    })
      .sort({ createdAt: -1 })
      .lean();
    
    let lastNumber = 0;
    if (lastOrder?.payment?.invoiceNumber) {
      const match = lastOrder.payment.invoiceNumber.match(/(\d+)$/);
      if (match) lastNumber = parseInt(match[1]);
    }
    order.payment.invoiceNumber = `${invoicePrefix}-${String(lastNumber + 1).padStart(5, '0')}`;
  }

  const soleStock = await Stock.findById(order.itemId._id);
  if (!soleStock) throw new Error("Sole stock not found");

  if (order.quantity > soleStock.quantity) throw new Error("Not enough stock");

  // Deduct from Sole
  soleStock.quantity -= order.quantity;
  soleStock.availableUnits = calculateAvailableUnits(
    soleStock.quantity,
    soleStock.unitsPerPack || getDefaultUnitsPerPack(soleStock.stockType)
  );
  soleStock.totalValue = soleStock.quantity * soleStock.purchasePrice;
  if (soleStock.quantity === 0)
    await moveToHistory(soleStock, {
      movedByUserId: req.user._id,
      type: "transferred",
    });
  else await soleStock.save();

  const unitsPerPack =
    Number(order.itemId.unitsPerPack) || getDefaultUnitsPerPack(order.itemId.stockType);
  const availableUnits = calculateAvailableUnits(order.quantity, unitsPerPack);

  // Add to Distributor stock while preserving original pack type
  const { stock: distributorStock } = await upsertMergedStock({
    matchFilter: {
      createdBy: order.distributorId._id,
      distributorId: order.distributorId._id,
      itemName: order.itemId.itemName,
      stockType: order.itemId.stockType,
      unitsPerPack,
    },
    stockData: {
      itemName: order.itemId.itemName,
      stockType: order.itemId.stockType,
      quantity: Number(order.quantity),
      originalStockAdded: Number(order.quantity),
      unitsPerPack,
      availableUnits,
      purchasePrice: Number(order.sellingPrice),
      totalValue: Number(order.quantity) * Number(order.sellingPrice),
      supplierName: req.user.name, // SOLE name
      invoiceNumber: order.payment.invoiceNumber,
      notes: `From order ${order._id} (${availableUnits} units available)`,
      date: new Date(),
      createdBy: order.distributorId._id,
      distributorId: order.distributorId._id,
      ownerType: "distributor",
      ownerId: order.distributorId._id,
      orderId: order._id,
    },
  });

  const totalAmount =
    order.quantity * order.sellingPrice -
    order.discount +
    order.deliveryCharges;
  const profit =
    (order.sellingPrice - order.itemId.purchasePrice) * order.quantity -
    order.discount +
    order.deliveryCharges;

  // Create sale payment record
  await Payment.create({
    type: "sale",
    relatedOrder: order._id,
    itemName: order.itemId.itemName,
    stockType: order.itemId.stockType,
    quantity: order.quantity,
    purchasePrice: order.itemId.purchasePrice,
    sellingPrice: order.sellingPrice,
    discount: order.discount,
    deliveryCharges: order.deliveryCharges,
    totalAmount,
    profit,
    soldBy: req.user._id,
    purchasedBy: order.distributorId._id,
    distributorId: order.distributorId._id,
    invoiceNumber: order.payment.invoiceNumber,
    date: new Date(),
  });

  // Create purchase payment for distributor
  await Payment.create({
    type: "purchase",
    relatedOrder: order._id,
    itemName: order.itemId.itemName,
    stockType: order.itemId.stockType,
    quantity: order.quantity,
    purchasePrice: order.sellingPrice,
    sellingPrice: 0,
    totalAmount: totalAmount,
    profit: 0,
    purchasedBy: order.distributorId._id,
    soldBy: req.user._id,
    distributorId: order.distributorId._id,
    invoiceNumber: order.payment.invoiceNumber,
    date: new Date(),
  });

  // Mark as completed
  order.status = "completed";
  order.completedAt = new Date();
  await order.save();

  res.json({ 
    success: true, 
    message: "Order completed, stock transferred to distributor",
    distributorStock 
  });
});

// Legacy: confirmPayment - completes order after payment submitted
export const confirmPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId)
    .populate("itemId")
    .populate("distributorId")
    .populate("createdBy");

  if (!order) throw new Error("Order not found");
  if (order.status !== "payment_submitted")
    throw new Error("Payment not yet submitted");

  // Generate invoice number if not exists
  if (!order.payment.invoiceNumber) {
    const distributorUser = await User.findById(order.distributorId._id);
    let invoicePrefix = "DIS";
    if (distributorUser && distributorUser.name) {
      const nameParts = distributorUser.name.split(" ");
      const initials = nameParts.map(n => n[0]).join("").toUpperCase().slice(0, 4);
      invoicePrefix = `DIS-${initials}`;
    } else {
      invoicePrefix = "DIS-0000";
    }
    
    const lastOrder = await Order.findOne({ 
      distributorId: order.distributorId._id,
      "payment.invoiceNumber": { $regex: new RegExp(`^${invoicePrefix}`) }
    })
      .sort({ createdAt: -1 })
      .lean();
    
    let lastNumber = 0;
    if (lastOrder?.payment?.invoiceNumber) {
      const match = lastOrder.payment.invoiceNumber.match(/(\d+)$/);
      if (match) lastNumber = parseInt(match[1]);
    }
    order.payment.invoiceNumber = `${invoicePrefix}-${String(lastNumber + 1).padStart(5, '0')}`;
  }

  const soleStock = await Stock.findById(order.itemId._id);
  if (!soleStock) throw new Error("Sole stock not found");

  if (order.quantity > soleStock.quantity) throw new Error("Not enough stock");

  // Deduct from Sole
  soleStock.quantity -= order.quantity;
  soleStock.availableUnits = calculateAvailableUnits(
    soleStock.quantity,
    soleStock.unitsPerPack || getDefaultUnitsPerPack(soleStock.stockType)
  );
  soleStock.totalValue = soleStock.quantity * soleStock.purchasePrice;
  if (soleStock.quantity === 0)
    await moveToHistory(soleStock, {
      movedByUserId: req.user._id,
      type: "transferred",
    });
  else await soleStock.save();

  const unitsPerPack =
    Number(order.itemId.unitsPerPack) || getDefaultUnitsPerPack(order.itemId.stockType);
  const availableUnits = calculateAvailableUnits(order.quantity, unitsPerPack);

  // Add to Distributor stock
  const { stock: distributorStock } = await upsertMergedStock({
    matchFilter: {
      createdBy: order.distributorId._id,
      distributorId: order.distributorId._id,
      itemName: order.itemId.itemName,
      stockType: order.itemId.stockType,
      unitsPerPack,
    },
    stockData: {
      itemName: order.itemId.itemName,
      stockType: order.itemId.stockType,
      quantity: Number(order.quantity),
      originalStockAdded: Number(order.quantity),
      unitsPerPack,
      availableUnits,
      purchasePrice: Number(order.sellingPrice),
      totalValue: Number(order.quantity) * Number(order.sellingPrice),
      supplierName: req.user.name,
      invoiceNumber: order.payment.invoiceNumber,
      notes: `From order ${order._id}`,
      date: new Date(),
      createdBy: order.distributorId._id,
      distributorId: order.distributorId._id,
      ownerType: "distributor",
      ownerId: order.distributorId._id,
      orderId: order._id,
    },
  });

  const totalAmount =
    order.quantity * order.sellingPrice - order.discount + order.deliveryCharges;
  const profit =
    (order.sellingPrice - order.itemId.purchasePrice) * order.quantity - order.discount + order.deliveryCharges;

  // Create sale payment record
  await Payment.create({
    type: "sale",
    relatedOrder: order._id,
    itemName: order.itemId.itemName,
    stockType: order.itemId.stockType,
    quantity: order.quantity,
    purchasePrice: order.itemId.purchasePrice,
    sellingPrice: order.sellingPrice,
    discount: order.discount,
    deliveryCharges: order.deliveryCharges,
    totalAmount,
    profit,
    soldBy: req.user._id,
    purchasedBy: order.distributorId._id,
    distributorId: order.distributorId._id,
    invoiceNumber: order.payment.invoiceNumber,
    date: new Date(),
  });

  // Create purchase payment
  await Payment.create({
    type: "purchase",
    relatedOrder: order._id,
    itemName: order.itemId.itemName,
    stockType: order.itemId.stockType,
    quantity: order.quantity,
    purchasePrice: order.sellingPrice,
    sellingPrice: 0,
    totalAmount: totalAmount,
    profit: 0,
    purchasedBy: order.distributorId._id,
    soldBy: req.user._id,
    distributorId: order.distributorId._id,
    invoiceNumber: order.payment.invoiceNumber,
    date: new Date(),
  });

  // Mark as completed
  order.status = "completed";
  order.completedAt = new Date();
  await order.save();

  res.json({ 
    success: true, 
    message: "Payment confirmed, order completed",
    distributorStock 
  });
});

// Submit payment for combined order
export const submitCombinedOrderPayment = async (req, res) => {
  try {
    const { orderId, invoiceNumber, amount, method } = req.body;
    const distributorId = req.user._id;

    const order = await Order.findOne({
      _id: orderId,
      distributorId,
      orderType: "combined",
      status: "distributor_approved",
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Approved order not found" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Payment proof image required" });
    }

    order.payment = {
      invoiceNumber,
      amount: Number(amount),
      method,
      proof: req.file.filename,
    };

    order.status = "payment_submitted";
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Sole: Confirm payment for combined order - transfers stock from sole to distributor
export const confirmCombinedOrderPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId)
      .populate("items.itemId")
      .populate("distributorId")
      .populate("foId");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "payment_submitted") {
      return res.status(400).json({ success: false, message: "Payment not yet submitted" });
    }

    // Process each item - transfer stock from sole to distributor
    const distributorStocks = [];

    for (const orderItem of order.items) {
      const soleStock = orderItem.itemId;

      if (!soleStock) {
        continue;
      }

      if (orderItem.quantity > soleStock.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Not enough stock for ${orderItem.productName}` 
        });
      }

      // Deduct from Sole
      soleStock.quantity -= orderItem.quantity;
      soleStock.availableUnits = calculateAvailableUnits(
        soleStock.quantity,
        soleStock.unitsPerPack || getDefaultUnitsPerPack(soleStock.stockType)
      );
      soleStock.totalValue = soleStock.quantity * soleStock.purchasePrice;
      if (soleStock.quantity === 0) {
        await moveToHistory(soleStock, {
          movedByUserId: req.user._id,
          type: "transferred",
        });
      } else {
        await soleStock.save();
      }

      const unitsPerPack =
        Number(soleStock.unitsPerPack) || getDefaultUnitsPerPack(soleStock.stockType);
      const availableUnits = calculateAvailableUnits(orderItem.quantity, unitsPerPack);

      // Create stock for Distributor with original pack type preserved
      // Do NOT set sellingPrice here - distributor will set it via DistributorStockPrices
      const { stock: distributorStock } = await upsertMergedStock({
        matchFilter: {
          createdBy: order.distributorId._id,
          distributorId: order.distributorId._id,
          itemName: orderItem.productName,
          stockType: soleStock.stockType,
          unitsPerPack,
        },
        stockData: {
          itemName: orderItem.productName,
          stockType: soleStock.stockType,
          quantity: Number(orderItem.quantity),
          originalStockAdded: Number(orderItem.quantity),
          unitsPerPack,
          availableUnits,
          purchasePrice: Number(orderItem.sellingPrice), // What distributor pays per pack
          totalValue: Number(orderItem.quantity) * Number(orderItem.sellingPrice),
          supplierName: req.user.name, // Sole name
          invoiceNumber: order.payment.invoiceNumber,
          notes: `From order ${order._id} (${availableUnits} units available)`,
          date: new Date(),
          createdBy: order.distributorId._id,
          distributorId: order.distributorId._id,
          ownerType: "distributor",
          ownerId: order.distributorId._id,
          orderId: order._id,
        },
      });

      distributorStocks.push(distributorStock);

      // Create payment record
      // For SALE payment: purchasePrice = Sole's cost (what they paid to supplier), sellingPrice = what Distributor paid
      const totalAmount = orderItem.quantity * orderItem.sellingPrice;
      const profit = (orderItem.sellingPrice - soleStock.purchasePrice) * orderItem.quantity;

      await Payment.create({
        type: "sale",
        relatedOrder: order._id,
        itemName: orderItem.productName,
        stockType: soleStock.stockType,
        quantity: orderItem.quantity,
        purchasePrice: soleStock.purchasePrice, // Sole's cost price (what they paid to supplier)
        sellingPrice: orderItem.sellingPrice, // What distributor paid to Sole
        discount: 0,
        deliveryCharges: 0,
        totalAmount,
        profit,
        soldBy: req.user._id, // Sole
        purchasedBy: order.distributorId._id,
        distributorId: order.distributorId._id,
        invoiceNumber: order.payment.invoiceNumber,
        date: new Date(),
      });

      // Create separate purchase payment for distributor (what distributor paid to Sole)
      await Payment.create({
        type: "purchase",
        relatedOrder: order._id,
        itemName: orderItem.productName,
        stockType: soleStock.stockType,
        quantity: orderItem.quantity,
        purchasePrice: orderItem.sellingPrice, // What distributor paid to Sole (this is the purchase price for distributor)
        sellingPrice: 0,
        totalAmount: totalAmount,
        profit: 0,
        purchasedBy: order.distributorId._id, // Distributor
        soldBy: req.user._id, // Sole
        distributorId: order.distributorId._id,
        invoiceNumber: order.payment.invoiceNumber,
        date: new Date(),
      });
    }

    order.status = "payment_received";
    order.paymentReceivedAt = new Date();
    await order.save();

    // Update linked booker orders
    await Order.updateMany(
      { _id: { $in: order.linkedBookerOrders } },
      { status: "payment_received" }
    );

    res.json({ 
      success: true, 
      message: "Payment confirmed, stock transferred to distributor",
      distributorStocks 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get orders (filter by role)
export const getOrders = async (req, res) => {
  try {
    let orders;
    const { status } = req.query;
    
    // Build base filter - always exclude FO and booker orders
    const baseFilter = { foId: { $exists: false } };
    
// Add status filter if provided
    if (status && status !== "all") {
if (status === "pending") {
        // Include all orders that need manual completion:
        // - pending: new orders
        // - stockApproved/distributor_approved: approved but payment not submitted
        // - payment_submitted: payment submitted, awaiting sole completion
        baseFilter.status = { $in: ["pending", "stockApproved", "distributor_approved", "payment_submitted"] };
} else if (status === "completed") {
        baseFilter.status = "completed"; // Only show completed (not payment_received)
      } else if (status === "canceled") {
        baseFilter.status = "canceled";
      } else {
        baseFilter.status = status;
      }
    }
    
    if (req.user.role === "sole") {
      // Sole should only see direct distributor orders (NOT FO combined orders or booker orders)
      orders = await Order.find(baseFilter).populate("itemId").populate("distributorId");
    } else if (req.user.role === "distributer") {
      // Distributor should only see their own direct orders (not FO combined orders or booker orders)
      orders = await Order.find({ 
        ...baseFilter,
        distributorId: req.user._id
      }).populate("itemId");
    }
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get pending orders (pending or stockApproved)
export const getPendingOrders = async (req, res) => {
  try {
    let orders;
    if (req.user.role === "sole") {
      // Sole should only see pending orders from distributors (NOT FO combined orders or booker orders)
      orders = await Order.find({
        status: { $in: ["pending", "stockApproved", "distributor_approved"] },
        foId: { $exists: false }
      })
        .populate("itemId")
        .populate("distributorId");
    } else if (req.user.role === "distributer") {
      // Distributor should only see their own pending orders (not FO/booker orders)
      orders = await Order.find({
        distributorId: req.user._id,
        foId: { $exists: false },
        status: { $in: ["pending", "stockApproved"] },
      }).populate("itemId");
    }
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Restore stock if order was already approved
    if (order.status === "stockApproved") {
      const stock = await Stock.findById(order.itemId);
      if (stock) {
        stock.quantity += order.quantity; // add back to stock
        stock.availableUnits = calculateAvailableUnits(
          stock.quantity,
          stock.unitsPerPack || getDefaultUnitsPerPack(stock.stockType)
        );
        await stock.save();
      }
    }

    order.status = "canceled";
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===== NEW BOOKER ORDER WORKFLOW =====

// Booker: Get available stock from their FO's assigned distributor
export const getBookerStock = async (req, res) => {
  try {
    const bookerId = req.user._id;
    const booker = await User.findById(bookerId).populate("assignedArea");
    
    if (!booker || booker.role !== "booker") {
      return res.status(403).json({ success: false, message: "Booker not found" });
    }
    
    // Get the FO who created this booker
    const foId = booker.createdBy;
    const fo = await User.findById(foId);
    
    if (!fo) {
      return res.status(404).json({ success: false, message: "FO not found" });
    }
    
    // Get areas assigned to FO
    const Area = (await import("../models/Area.js")).default;
    const foAreas = await Area.find({ assignedFOs: foId, isActive: true });
    
    if (foAreas.length === 0) {
      return res.status(400).json({ success: false, message: "No areas assigned to FO. Please contact your FO." });
    }
    
    // Get distributor ID from FO's areas
    const distributorId = foAreas[0].distributorId;
    
    // Get all stock from the distributor (not FO stock)
    // 1. Has quantity > 0
    // 2. Owned by distributor OR no ownerType (backward compatibility)
    // 3. Exclude booker_stock type - only show stock from distributor (purchased from Sole)
    const stocks = await Stock.find({
      $or: [
        { ownerType: "distributor" },
        { ownerType: { $exists: false } },
        { ownerType: { $eq: "" } }
      ],
      // Only get stock from the specific distributor for this FO
      distributorId: distributorId,
      // Exclude booker_stock - this is stock that came from FO, not from distributor's own purchase
      stockType: { $ne: "booker_stock" }
    }).populate("distributorId", "name");

    const visibleStocks = stocks
      .filter((stock) => (Number(stock.availableUnits) || 0) > 0)
      .map((stock) => {
        const unitsPerPack =
          Number(stock.unitsPerPack) || getDefaultUnitsPerPack(stock.stockType);

        return {
          ...stock.toObject(),
          stockAvailable: Number(stock.availableUnits) || 0,
          unitSellingPrice: calculatePerUnitPrice(stock.sellingPrice || 0, unitsPerPack),
        };
      });
    
    res.json({ 
      success: true, 
      data: visibleStocks,
      bookerArea: booker.assignedArea,
      routes: booker.routes,
      foId: foId,
      distributorId: distributorId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Booker: Place an order
export const createBookerOrder = async (req, res) => {
  try {
    const { items, areaId, route, shopName, shopAddress } = req.body;
    const bookerId = req.user._id;
    
    // Validate required fields
    if (!shopName || !shopName.trim()) {
      return res.status(400).json({ success: false, message: "Shop name is required" });
    }
    if (!shopAddress || !shopAddress.trim()) {
      return res.status(400).json({ success: false, message: "Shop address is required" });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "At least one item is required" });
    }
    
    const booker = await User.findById(bookerId);
    if (!booker || booker.role !== "booker") {
      return res.status(403).json({ success: false, message: "Booker not found" });
    }
    
    // Get FO who created this booker
    const foId = booker.createdBy;
    
    // Get distributor - find from FO's areas
    const Area = (await import("../models/Area.js")).default;
    const foAreas = await Area.find({ assignedFOs: foId, isActive: true });
    
    if (foAreas.length === 0) {
      return res.status(400).json({ success: false, message: "No areas assigned to FO" });
    }
    
    // Get the distributor from first area
    const distributorId = foAreas[0].distributorId;
    
    // Validate items and normalize quantity into units
    const orderItems = [];
    
    for (const item of items) {
      const stock = await Stock.findById(item.itemId);
      
      if (!stock) {
        return res.status(404).json({ 
          success: false, 
          message: `Stock not found: ${item.itemId}` 
        });
      }
      
      const unitsPerPack =
        Number(stock.unitsPerPack) || getDefaultUnitsPerPack(stock.stockType);

      // Default order mode remains unit; for carton/packet/box we convert to units.
      const normalizedOrderUnit = String(item.orderUnit || "unit").trim().toLowerCase();
      const parsedOrderQuantity = Number(item.orderQuantity) || 0;
      let normalizedQuantityInUnits = Number(item.quantity) || 0;

      if (normalizedOrderUnit !== "unit") {
        if (parsedOrderQuantity > 0) {
          normalizedQuantityInUnits = parsedOrderQuantity * unitsPerPack;
        } else if (normalizedQuantityInUnits > 0 && unitsPerPack > 0) {
          // Backward compatibility when only quantity (units) is sent.
          normalizedQuantityInUnits = Number(normalizedQuantityInUnits);
        }
      } else if (parsedOrderQuantity > 0) {
        normalizedQuantityInUnits = parsedOrderQuantity;
      }

      if (!normalizedQuantityInUnits || normalizedQuantityInUnits <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Valid quantity is required for ${stock.itemName}` 
        });
      }

      const availableUnits = Number(stock.availableUnits) || 0;
      if (normalizedQuantityInUnits > availableUnits) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableUnits} stock available for ${stock.itemName}`,
        });
      }

      const resolvedOrderQuantity =
        parsedOrderQuantity > 0
          ? parsedOrderQuantity
          : normalizedOrderUnit === "unit"
            ? normalizedQuantityInUnits
            : normalizedQuantityInUnits / unitsPerPack;

      orderItems.push({
        itemId: stock._id,
        productName: stock.itemName,
        stockType: stock.stockType,
        unitsPerPack,
        orderUnit: normalizedOrderUnit,
        orderQuantity: resolvedOrderQuantity,
        quantity: normalizedQuantityInUnits,
        estimatedPrice: calculatePerUnitPrice(stock.sellingPrice || 0, unitsPerPack),
        sellingPrice: 0, // Will be set by distributor per unit
      });
    }
    
    const order = new Order({
      orderType: "booker",
      distributorId,
      foId,
      bookerId,
      areaId: areaId || booker.assignedArea,
      routeId: route || (booker.routes && booker.routes[0]),
      shopName: shopName.trim(),
      shopAddress: shopAddress.trim(),
      createdBy: bookerId,
      items: orderItems,
      status: "pending",
      totalAmount: 0, // Will be calculated after distributor approval
    });
    
    await order.save();
    
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// FO: Get pending booker orders
export const getFOBookerOrders = async (req, res) => {
  try {
    const foId = req.user._id;
    
    const orders = await Order.find({
      foId,
      orderType: "booker",
      status: "pending",
    })
    .populate("bookerId", "name email")
    .populate("areaId", "name")
    .sort({ createdAt: -1 });
    
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// FO: Get combined orders (approved, waiting for stock transfer, or sent to distributor)
export const getFOCombinedOrders = async (req, res) => {
  try {
    const foId = req.user._id;
    
    const orders = await Order.find({
      foId,
      orderType: "combined",
      status: { $in: ["distributor_approved", "stock_transferred", "payment_submitted_to_distributor", "payment_received", "completed"] },
    })
    .populate("distributorId", "name")
    .populate("linkedBookerOrders")
    .sort({ createdAt: -1 });
    
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// FO: Combine booker orders into a single order
export const combineBookerOrders = async (req, res) => {
  try {
    const { bookerOrderIds } = req.body;
    const foId = req.user._id;
    
    // Get all booker orders
    const bookerOrders = await Order.find({
      _id: { $in: bookerOrderIds },
      foId,
      status: "pending",
      orderType: "booker",
    });
    
    if (bookerOrders.length === 0) {
      return res.status(400).json({ success: false, message: "No valid booker orders found" });
    }
    
    // Group by distributor and product
    const combinedItems = {};
    let distributorId = null;
    let areaId = null;
    
    for (const order of bookerOrders) {
      if (!distributorId) distributorId = order.distributorId;
      if (!areaId) areaId = order.areaId;
      
      for (const item of order.items) {
        const key = item.itemId.toString();
        if (combinedItems[key]) {
          combinedItems[key].quantity += item.quantity;
        } else {
          combinedItems[key] = {
            itemId: item.itemId,
            productName: item.productName,
            quantity: item.quantity,
            estimatedPrice: item.estimatedPrice,
            sellingPrice: 0, // Will be set by distributor
          };
        }
      }
    }
    
    // Create combined order
    const combinedOrder = new Order({
      orderType: "combined",
      distributorId,
      foId,
      areaId,
      createdBy: foId,
      linkedBookerOrders: bookerOrderIds,
      items: Object.values(combinedItems),
      status: "fo_combined",
      totalAmount: 0,
    });
    
    await combinedOrder.save();
    
    // Update booker orders status
    await Order.updateMany(
      { _id: { $in: bookerOrderIds } },
      { 
        status: "fo_combined",
        bookerOrderId: combinedOrder._id,
      }
    );
    
    res.json({ success: true, order: combinedOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Distributor: Get combined orders awaiting approval
export const getDistributorCombinedOrders = async (req, res) => {
  try {
    const distributorId = req.user._id;
    
    // Don't populate linkedBookerOrders - distributor should NOT see booker details
    // Just return the count of booker orders for reference
    const orders = await Order.find({
      distributorId,
      orderType: "combined",
      status: "fo_combined",
    })
    .populate("foId", "name")
    .select("-linkedBookerOrders") // Exclude booker order details
    .sort({ createdAt: -1 });
    
    // Get just the count of linked orders for display
    const ordersWithCounts = await Order.find({
      distributorId,
      orderType: "combined",
      status: "fo_combined",
    })
    .select("linkedBookerOrders")
    .lean();
    
    const ordersWithBookerCount = orders.map((order, index) => ({
      ...order.toObject(),
      bookerOrderCount: ordersWithCounts[index]?.linkedBookerOrders?.length || 0
    }));
    
    res.json({ success: true, data: ordersWithBookerCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Distributor: Approve combined order, set selling prices, and auto-transfer stock to FO
export const approveCombinedOrder = async (req, res) => {
  try {
    const { orderId, items, discount = 0, deliveryCharges = 0 } = req.body;
    const distributorId = req.user._id;
    
    const order = await Order.findOne({
      _id: orderId,
      distributorId,
      orderType: "combined",
      status: "fo_combined",
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Combined order not found" });
    }
    
    // Update items with selling prices
    // Use default price from stock if available
    let totalAmount = 0;
    for (const orderItem of order.items) {
      // Get stock to check default price
      let defaultPrice = 0;
      let stock = null;
      try {
        stock = await Stock.findById(orderItem.itemId);
        if (stock) {
          const unitsPerPack =
            Number(stock.unitsPerPack) || getDefaultUnitsPerPack(stock.stockType);
          defaultPrice = calculatePerUnitPrice(stock.sellingPrice || 0, unitsPerPack);
        }
      } catch (e) {
        console.log("Error finding stock:", e);
      }
      
      // Find if user provided a price in the request
      let providedPrice = null;
      if (items && items.length > 0) {
        const providedItem = items.find(i => 
          i.itemId === orderItem.itemId.toString() || 
          i.itemId === orderItem.itemId
        );
        if (providedItem && providedItem.sellingPrice > 0) {
          providedPrice = providedItem.sellingPrice;
        }
      }
      
      // Priority: provided price > default price from stock > estimated price
      const sellingPrice = providedPrice || defaultPrice || orderItem.estimatedPrice || 0;
      
      orderItem.sellingPrice = sellingPrice;
      totalAmount += sellingPrice * orderItem.quantity;
      
      // NOTE: Do NOT save selling price to stock here - this is just for this order
    }
    
    order.totalAmount = totalAmount - discount + deliveryCharges;
    order.discount = discount;
    order.deliveryCharges = deliveryCharges;
    order.status = "distributor_approved";
    order.distributorApprovedAt = new Date();
    
    await order.save();
    
    // Update linked booker orders with selling prices
    for (const bookerOrderId of order.linkedBookerOrders) {
      const bookerOrder = await Order.findById(bookerOrderId);
      if (bookerOrder) {
        for (const bookerItem of bookerOrder.items) {
          // Find matching item in combined order
          const combinedItem = order.items.find(ci => 
            ci.itemId.toString() === bookerItem.itemId.toString()
          );
          if (combinedItem) {
            bookerItem.sellingPrice = combinedItem.sellingPrice;
          }
        }
        bookerOrder.status = "distributor_approved";
        bookerOrder.totalAmount = order.totalAmount;
        await bookerOrder.save();
      }
    }
    
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Distributor: Reject combined order
export const rejectCombinedOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const distributorId = req.user._id;
    
    const order = await Order.findOne({
      _id: orderId,
      distributorId,
      orderType: "combined",
      status: "fo_combined",
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Combined order not found" });
    }
    
    order.status = "rejected";
    order.notes = reason;
    await order.save();
    
    // Update linked booker orders
    await Order.updateMany(
      { _id: { $in: order.linkedBookerOrders } },
      { status: "rejected", notes: reason }
    );
    
    res.json({ success: true, message: "Order rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// FO: Transfer stock from distributor to FO (called automatically after distributor approval)
export const transferStockToFO = async (req, res) => {
  try {
    const { orderId } = req.body;
    const foId = req.user._id;
    
    const order = await Order.findOne({
      _id: orderId,
      foId,
      orderType: "combined",
      status: "distributor_approved",
    }).populate("items.itemId");
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Approved order not found" });
    }
    
    // Deduct from distributor stock units and create FO stock
    for (const item of order.items) {
      const distributorStock = await Stock.findById(item.itemId._id);
      
      if (distributorStock && (Number(distributorStock.availableUnits) || 0) >= item.quantity) {
        // Deduct units from distributor inventory
        distributorStock.availableUnits =
          (Number(distributorStock.availableUnits) || 0) - item.quantity;
        distributorStock.totalValue = calculateInventoryValueFromUnits({
          availableUnits: distributorStock.availableUnits,
          purchasePrice: distributorStock.purchasePrice,
          unitsPerPack: distributorStock.unitsPerPack,
          ownerType: "distributor",
        });
        await distributorStock.save();
        
        // Create FO stock in units for downstream handling
        await upsertMergedStock({
          matchFilter: {
            ownerType: "fo",
            ownerId: foId,
            itemName: item.productName,
            stockType: distributorStock.stockType,
            unitsPerPack: distributorStock.unitsPerPack || 1,
            originalDistributorId: order.distributorId,
          },
          stockData: {
          itemName: item.productName,
          stockType: distributorStock.stockType,
          quantity: item.quantity,
          originalStockAdded: item.quantity,
          unitsPerPack: distributorStock.unitsPerPack || 1,
          availableUnits: item.quantity,
          purchasePrice: item.sellingPrice, // Price FO paid
          totalValue: item.quantity * item.sellingPrice,
          ownerType: "fo",
          ownerId: foId,
          originalDistributorId: order.distributorId,
          distributorId: order.distributorId,
          sellingPrice: item.sellingPrice, // Selling price for bookers (locked from order)
          orderId: order._id,
          createdBy: foId,
          },
        });
      }
    }
    
    order.status = "stock_transferred";
    order.stockTransferredAt = new Date();
    await order.save();
    
    // Update linked booker orders
    await Order.updateMany(
      { _id: { $in: order.linkedBookerOrders } },
      { status: "stock_transferred" }
    );
    
    res.json({ success: true, message: "Stock transferred to FO" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Distributor: Set default selling price for stock
export const setDefaultSellingPrice = async (req, res) => {
  try {
    const { stockId, sellingPrice } = req.body;
    const distributorId = req.user._id;
    
    const stock = await Stock.findOne({
      _id: stockId,
      $or: [
        { distributorId },
        { createdBy: distributorId },
        { ownerId: distributorId }
      ]
    });
    
    if (!stock) {
      return res.status(404).json({ success: false, message: "Stock not found or not authorized" });
    }
    
    stock.sellingPrice = parseFloat(sellingPrice);
    // Also set ownerType and ownerId if not set
    if (!stock.ownerType) {
      stock.ownerType = "distributor";
    }
    if (!stock.ownerId) {
      stock.ownerId = distributorId;
    }
    await stock.save();
    
    res.json({ success: true, message: "Default selling price set", stock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Distributor: Get their stock with selling prices
export const getDistributorStockWithPrices = async (req, res) => {
  try {
    const distributorId = req.user._id;
    
    // Only show stock purchased from Sole (not from FO/booker)
    // Exclude booker_stock type AND fo/booker owner types
    const stocks = await Stock.find({
      $or: [
        { distributorId, ownerType: { $nin: ["fo", "booker"] } },
        { createdBy: distributorId, ownerType: { $nin: ["fo", "booker"] } },
        { ownerId: distributorId, ownerType: "distributor" }
      ],
      stockTransferred: { $ne: true }, // Exclude transferred stock
      stockType: { $ne: "booker_stock" } // Exclude stock received from FO
    }).sort({ createdAt: -1 });

    const visibleStocks = stocks.filter((stock) => {
      const availableUnits =
        stock.availableUnits === null || stock.availableUnits === undefined
          ? stock.quantity
          : stock.availableUnits;
      return Number(availableUnits) > 0;
    });
    
    res.json({ success: true, data: visibleStocks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Import User for booker functions
import User from "../models/User.js";

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

// Booker: Get their own orders with status
export const getBookerOrders = async (req, res) => {
  try {
    const bookerId = req.user._id;
    
    // Get all orders for this booker (both direct and linked through combined orders)
    const orders = await Order.find({
      $or: [
        { bookerId, orderType: "booker" },
        { bookerId, orderType: "combined" }
      ]
    })
    .populate("distributorId", "name")
    .populate("foId", "name")
    .populate("areaId", "name")
    .sort({ createdAt: -1 });
    
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Booker: Submit payment for their order when stock is transferred
export const bookerSubmitPayment = async (req, res) => {
  try {
    const { orderId, amount, method } = req.body;
    const bookerId = req.user._id;
    
    const order = await Order.findOne({
      _id: orderId,
      bookerId,
      orderType: "booker",
      status: { $in: ["stock_transferred", "distributed", "delivered"] },
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or delivery not confirmed" });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Payment proof image required" });
    }
    
    // Get booker name for invoice prefix
    const bookerUser = await User.findById(bookerId);
    let invoicePrefix = "BO";
    if (bookerUser && bookerUser.name) {
      const nameParts = bookerUser.name.split(" ");
      const initials = nameParts.map(n => n[0]).join("").toUpperCase().slice(0, 4);
      invoicePrefix = `BO-${initials}`;
    } else {
      invoicePrefix = "BO-0000";
    }
    
    // Find last invoice number for this booker
    const lastOrder = await Order.findOne({ 
      bookerId,
      orderType: "booker",
      "payment.invoiceNumber": { $regex: new RegExp(`^${invoicePrefix}`) }
    })
      .sort({ createdAt: -1 })
      .lean();
    
    let lastNumber = 0;
    if (lastOrder?.payment?.invoiceNumber) {
      const match = lastOrder.payment.invoiceNumber.match(/(\d+)$/);
      if (match) lastNumber = parseInt(match[1]);
    }
    const invoiceNumber = `${invoicePrefix}-${String(lastNumber + 1).padStart(5, '0')}`;
    
    // Calculate total amount
    let totalAmount = 0;
    for (const item of order.items) {
      totalAmount += (item.sellingPrice || 0) * item.quantity;
    }
    totalAmount = totalAmount - (order.discount || 0) + (order.deliveryCharges || 0);
    
    order.payment = {
      invoiceNumber,
      amount: Number(amount) || totalAmount,
      method,
      proof: req.file.filename,
    };
    
    order.status = "payment_submitted";
    order.paidAmount = Number(amount) || totalAmount;
    await order.save();
    
    res.json({ success: true, order, invoiceNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// FO: Transfer stock from FO to booker (distribute to booker)
export const distributeToBooker = async (req, res) => {
  try {
    const { orderId, bookerOrderId } = req.body;
    const foId = req.user._id;
    
    // Find the combined order
    const combinedOrder = await Order.findOne({
      _id: orderId,
      foId,
      orderType: "combined",
      status: "stock_transferred",
    });
    
    if (!combinedOrder) {
      return res.status(404).json({ success: false, message: "Combined order with transferred stock not found" });
    }
    
    // Find the specific booker order
    const bookerOrder = await Order.findOne({
      _id: bookerOrderId,
      bookerId: { $exists: true },
      status: "stock_transferred",
    });
    
    if (!bookerOrder) {
      return res.status(404).json({ success: false, message: "Booker order not found or stock not transferred" });
    }
    
    // Deduct from FO stock units and create booker-specific stock records
    for (const bookerItem of bookerOrder.items) {
      // Find FO stock for this item
      const foStock = await Stock.findOne({
        ownerType: "fo",
        ownerId: foId,
        itemName: bookerItem.productName,
      });
      
      if (foStock && (Number(foStock.availableUnits) || 0) >= bookerItem.quantity) {
        // Deduct units from FO stock
        foStock.availableUnits =
          (Number(foStock.availableUnits) || 0) - bookerItem.quantity;
        foStock.quantity = foStock.availableUnits;
        foStock.totalValue = calculateInventoryValueFromUnits({
          availableUnits: foStock.availableUnits,
          purchasePrice: foStock.purchasePrice,
          unitsPerPack: foStock.unitsPerPack,
          ownerType: "fo",
        });
        await foStock.save();
        
        // Create stock for the booker with payment pending status
        await upsertMergedStock({
          matchFilter: {
            ownerType: "booker",
            ownerId: bookerOrder.bookerId,
            itemName: bookerItem.productName,
            stockType: foStock.stockType,
            unitsPerPack: foStock.unitsPerPack || 1,
          },
          stockData: {
          itemName: bookerItem.productName,
          stockType: foStock.stockType,
          quantity: bookerItem.quantity,
          originalStockAdded: bookerItem.quantity,
          unitsPerPack: foStock.unitsPerPack || 1,
          availableUnits: bookerItem.quantity,
          purchasePrice: bookerItem.sellingPrice,
          totalValue: bookerItem.quantity * bookerItem.sellingPrice,
          ownerType: "booker",
          ownerId: bookerOrder.bookerId,
          foId: foId,
          originalDistributorId: combinedOrder.distributorId,
          distributorId: combinedOrder.distributorId,
          sellingPrice: bookerItem.sellingPrice,
          orderId: bookerOrder._id,
          createdBy: bookerOrder.bookerId,
          notes: "Payment pending from booker",
          },
        });
      }
    }
    
    // Update booker order status to indicate stock received, payment pending
    bookerOrder.status = "distributed";
    await bookerOrder.save();
    
    res.json({ success: true, message: "Stock distributed to booker, payment pending" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Booker: Confirm delivery - deduct stock when booker delivers to customer
export const confirmBookerDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;
    const bookerId = req.user._id;
    
    // Find the booker order
    const order = await Order.findOne({
      _id: orderId,
      bookerId,
      status: "distributed", // Only allow delivery confirmation when stock is received
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or stock not yet distributed" });
    }
    
    // Deduct stock from booker's inventory
    for (const item of order.items) {
      // Find booker's stock for this item
      const bookerStock = await Stock.findOne({
        ownerType: "booker",
        ownerId: bookerId,
        itemName: item.productName,
        orderId: order._id,
      });
      
      if (bookerStock) {
        if ((Number(bookerStock.availableUnits) || 0) >= item.quantity) {
          // Deduct delivered units from booker's stock
          bookerStock.availableUnits =
            (Number(bookerStock.availableUnits) || 0) - item.quantity;
          bookerStock.quantity = bookerStock.availableUnits;
          bookerStock.totalValue = calculateInventoryValueFromUnits({
            availableUnits: bookerStock.availableUnits,
            purchasePrice: bookerStock.purchasePrice,
            unitsPerPack: bookerStock.unitsPerPack,
            ownerType: "booker",
          });
          
          // Don't move to history yet - only deduct stock, wait for payment to complete
          await bookerStock.save();
        } else {
          return res.status(400).json({ 
            success: false, 
            message: `Not enough stock for ${item.productName}. Available: ${bookerStock.availableUnits || 0}, Required: ${item.quantity}` 
          });
        }
      }
    }
    
    // Update order status to delivered
    order.status = "delivered";
    await order.save();
    
    res.json({ success: true, message: "Delivery confirmed, stock deducted from your inventory" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// FO: Confirm booker payment - called when FO verifies booker's payment
export const confirmBookerPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const foId = req.user._id;
    
    // Find the booker order with submitted payment
    const order = await Order.findOne({
      _id: orderId,
      foId,
      orderType: "booker",
      status: "payment_submitted",
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Booker order with submitted payment not found" });
    }
    
    // Verify payment exists
    if (!order.payment || !order.payment.proof) {
      return res.status(400).json({ success: false, message: "No payment proof found" });
    }
    
    // Update order status to payment_confirmed
    order.status = "payment_confirmed";
    order.paymentConfirmedAt = new Date();
    await order.save();
    
    // Update the stock records for this booker to mark payment as confirmed
    await Stock.updateMany(
      { orderId: order._id, ownerType: "booker" },
      { paymentStatus: "confirmed" }
    );
    
    res.json({ success: true, message: "Booker payment confirmed", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// FO: Get booker orders with submitted payments (waiting for FO confirmation or ready to send)
export const getFOPaymentConfirmations = async (req, res) => {
  try {
    const foId = req.user._id;
    const { status } = req.query;
    
    // Build query - include all payment statuses for history
    const query = {
      foId,
      orderType: "booker",
      status: { $in: ["payment_submitted", "payment_confirmed", "payment_sent_to_distributor", "payment_received", "completed"] }
    };
    
    // If specific status is requested, override the default
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
    .populate("bookerId", "name email")
    .populate("areaId", "name")
    .sort({ createdAt: -1 });
    
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// FO: Get payment pending records for distributed orders - shows pending vs paid status
export const getFOPaymentPending = async (req, res) => {
  try {
    const foId = req.user._id;
    
    // Get all booker orders where FO has distributed stock (status: distributed, delivered, payment_submitted, payment_confirmed)
    // These are orders where FO distributed stock to booker and is tracking payments
    const query = {
      foId,
      orderType: "booker",
      status: { $in: ["distributed", "delivered", "payment_submitted", "payment_confirmed", "payment_sent_to_distributor", "payment_received", "completed"] }
    };
    
    const orders = await Order.find(query)
      .populate("bookerId", "name email")
      .populate("areaId", "name")
      .sort({ createdAt: -1 });
    
    // Calculate totals
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    
    const paymentRecords = orders.map(order => {
      // Calculate order total
      let orderTotal = 0;
      for (const item of order.items || []) {
        orderTotal += (item.sellingPrice || 0) * item.quantity;
      }
      orderTotal = orderTotal - (order.discount || 0) + (order.deliveryCharges || 0);
      
      // Determine payment status
      let paymentStatus = "pending";
      let amountPaid = 0;
      
      if (["payment_submitted", "payment_confirmed", "payment_sent_to_distributor", "payment_received", "completed"].includes(order.status)) {
        paymentStatus = "paid";
        amountPaid = orderTotal;
      }
      
      totalAmount += orderTotal;
      paidAmount += amountPaid;
      pendingAmount += (orderTotal - amountPaid);
      
      return {
        _id: order._id,
        bookerId: order.bookerId,
        bookerName: order.bookerId?.name || "Unknown",
        bookerEmail: order.bookerId?.email,
        shopName: order.shopName,
        shopAddress: order.shopAddress,
        areaId: order.areaId,
        items: order.items,
        totalAmount: orderTotal,
        amountPaid: amountPaid,
        pendingAmount: orderTotal - amountPaid,
        paymentStatus,
        status: order.status,
        createdAt: order.createdAt,
        payment: order.payment
      };
    });
    
    res.json({ 
      success: true, 
      data: paymentRecords,
      summary: {
        totalOrders: paymentRecords.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        paidCount: paymentRecords.filter(r => r.paymentStatus === "paid").length,
        pendingCount: paymentRecords.filter(r => r.paymentStatus === "pending").length
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// FO: Send combined payment to distributor - creates order for distributor to confirm
export const sendCombinedPaymentToDistributor = async (req, res) => {
  try {
    let { orderIds, invoiceNumber, amount, method } = req.body;
    const foId = req.user._id;
    
    // Parse orderIds if it's a string
    if (typeof orderIds === 'string') {
      orderIds = JSON.parse(orderIds);
    }
    
    if (!orderIds || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: "No orders selected" });
    }
    
    // Generate invoice number based on FO name initials
    if (!invoiceNumber) {
      // Get FO name for prefix
      const foUser = await User.findById(foId);
      let invoicePrefix = "FO";
      if (foUser && foUser.name) {
        const nameParts = foUser.name.split(" ");
        const initials = nameParts.map(n => n[0]).join("").toUpperCase().slice(0, 4);
        invoicePrefix = `FO-${initials}`;
      } else {
        invoicePrefix = "FO-0000";
      }
      
      // Find last invoice number for this FO
      const lastOrder = await Order.findOne({ 
        foId,
        orderType: "combined",
        "payment.invoiceNumber": { $regex: new RegExp(`^${invoicePrefix}`) }
      })
        .sort({ createdAt: -1 })
        .lean();
      
      let lastNumber = 0;
      if (lastOrder?.payment?.invoiceNumber) {
        const match = lastOrder.payment.invoiceNumber.match(/(\d+)$/);
        if (match) lastNumber = parseInt(match[1]);
      }
      invoiceNumber = `${invoicePrefix}-${String(lastNumber + 1).padStart(5, '0')}`;
    }
    
    // Verify all orders belong to this FO and have confirmed payments
    const orders = await Order.find({
      _id: { $in: orderIds },
      foId,
      orderType: "booker",
      status: "payment_confirmed",
    });
    
    if (orders.length !== orderIds.length) {
      return res.status(400).json({ success: false, message: "Please confirm all payments first before sending to distributor" });
    }
    
    // Get distributor from first order
    const distributorId = orders[0].distributorId;
    
    // Calculate total amount and find purchase prices from distributor's stock
    let totalSaleAmount = 0;
    let totalCostAmount = 0;
    let totalItems = 0;
    const orderItemDetails = [];
    
    for (const bookerOrder of orders) {
      for (const item of bookerOrder.items) {
        const salePrice = (item.sellingPrice || 0) * item.quantity;
        totalSaleAmount += salePrice;
        totalItems += item.quantity;
        orderItemDetails.push({
          itemId: item.itemId || null,
          productName: item.productName,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice
        });
        
        // Calculate cost using averaged per-unit purchase cost from distributor's history
        const unitCost = await getDistributorUnitCostFromPurchases(
          distributorId,
          item.productName
        );
        const costPrice = unitCost * item.quantity;
        totalCostAmount += costPrice;
      }
      
      // Apply discount and delivery charges
      totalSaleAmount = totalSaleAmount - (bookerOrder.discount || 0) + (bookerOrder.deliveryCharges || 0);
      
      // Mark booker order as completed
      bookerOrder.status = "completed";
      bookerOrder.completedAt = new Date();
      await bookerOrder.save();
    }
    
    // Calculate profit: Sale Amount - Cost Amount
    const profit = totalSaleAmount - totalCostAmount;
    
    // Create Order record for distributor to see and confirm (NOT direct payment)
    // Use orderType: "combined" to match FO's combined orders view
    const combinedPaymentOrder = await Order.create({
      orderType: "combined",
      foId,
      distributorId,
      createdBy: foId,
      linkedBookerOrders: orders.map(o => o._id),
      items: orderItemDetails.map(item => ({
        itemId: item.itemId || null,
        productName: item.productName,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice
      })),
      totalAmount: totalSaleAmount,
      status: "payment_submitted_to_distributor",
      payment: {
        invoiceNumber,
        amount: totalSaleAmount,
        method: method || "bank transfer",
        proof: req.file ? req.file.filename : null,
        submittedAt: new Date()
      },
      createdAt: new Date()
    });
    
    res.json({ success: true, message: "Combined payments submitted to distributor for confirmation", invoiceNumber, totalAmount: totalSaleAmount, profit, orderId: combinedPaymentOrder._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Distributor: Get combined payments from FO (waiting for distributor confirmation)
export const getDistributorCombinedPayments = async (req, res) => {
  try {
    const distributorId = req.user._id;
    const { status } = req.query;
    
    // Build query - include all payment statuses for history
    const query = {
      distributorId,
      orderType: "combined",
      status: { $in: ["payment_submitted_to_distributor", "payment_sent_to_distributor", "payment_received", "completed"] }
    };
    
    // If specific status is requested, override the default
    if (status) {
      query.status = status;
    }
    
    const payments = await Order.find(query)
    .populate("foId", "name")
    .populate("linkedBookerOrders")
    .sort({ createdAt: -1 });
    
    res.json({ success: true, data: payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Distributor: Complete order after receiving payment from FO
export const completeOrderFromFO = async (req, res) => {
  try {
    const { orderId } = req.body;
    const distributorId = req.user._id;
    
    // Find the combined payment order
    const combinedPaymentOrder = await Order.findOne({
      _id: orderId,
      distributorId,
      orderType: "combined",
      status: "payment_submitted_to_distributor",
    });
    
    if (!combinedPaymentOrder) {
      return res.status(404).json({ success: false, message: "Combined payment order not found" });
    }
    
    // Get all linked booker orders
    const bookerOrders = await Order.find({
      _id: { $in: combinedPaymentOrder.linkedBookerOrders }
    });
    
    // Create per-item sale payment records for accurate distributor reporting
    const itemSummary = {};
    
    for (const bookerOrder of bookerOrders) {
      for (const item of bookerOrder.items) {
        const itemTotal = (item.sellingPrice || 0) * item.quantity;
        const key = `${item.productName}::${item.stockType || "booker_stock"}`;
        if (!itemSummary[key]) {
          itemSummary[key] = {
            itemName: item.productName,
            stockType: item.stockType || "booker_stock",
            quantity: 0,
            totalAmount: 0,
          };
        }
        itemSummary[key].quantity += item.quantity || 0;
        itemSummary[key].totalAmount += itemTotal;
      }
      
      // Mark booker order as completed
      bookerOrder.status = "completed";
      bookerOrder.completedAt = new Date();
      await bookerOrder.save();
    }

    const paymentRecords = [];
    for (const summary of Object.values(itemSummary)) {
      const unitCost = await getDistributorUnitCostFromPurchases(
        distributorId,
        summary.itemName
      );
      const costAmount = unitCost * summary.quantity;
      const profit = summary.totalAmount - costAmount;

      paymentRecords.push({
        type: "sale",
        relatedOrder: combinedPaymentOrder._id,
        itemName: summary.itemName,
        // Keep marker so distributor sale screens and filters stay isolated from Sole->Distributor sales
        stockType: "booker_stock",
        quantity: summary.quantity,
        purchasePrice: unitCost,
        sellingPrice: summary.quantity > 0 ? summary.totalAmount / summary.quantity : 0,
        discount: 0,
        deliveryCharges: 0,
        totalAmount: summary.totalAmount,
        profit,
        soldBy: combinedPaymentOrder.foId,
        purchasedBy: distributorId,
        distributorId,
        invoiceNumber: combinedPaymentOrder.payment?.invoiceNumber,
        date: new Date(),
      });
    }

    if (paymentRecords.length > 0) {
      await Payment.insertMany(paymentRecords);
    }
    
    // Mark combined payment order as completed
    combinedPaymentOrder.status = "payment_received";
    combinedPaymentOrder.paymentReceivedAt = new Date();
    await combinedPaymentOrder.save();
    
    res.json({ success: true, message: "Order completed, combined payment added to sale payments" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// FO: Get real-time target achievement based on stock distributed to bookers
// Booker: Get real-time target achievement based on orders placed
export const getFOTargetAchievement = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    
    // Get user's target from User model
    const currentUser = await User.findById(userId);
    
    const targetMonth = currentUser?.targetMonth || new Date().toISOString().slice(0, 7);
    const [targetYear, targetMonthIndex] = targetMonth.split("-").map(Number);
    const periodStart = new Date(targetYear, (targetMonthIndex || 1) - 1, 1);
    const periodEnd = new Date(targetYear, targetMonthIndex || 1, 1);

    const isWithinTargetMonth = (dateValue) => {
      if (!dateValue) return false;
      const date = new Date(dateValue);
      return date >= periodStart && date < periodEnd;
    };

    let monthlyTarget = 0;
    let totalDistributed = 0;
    let totalItems = 0;
    let totalOrders = 0;
    let achievementPercent = 0;
    let itemBreakdown = {};
    let bookersServed = 0;
    
    if (role === "FO") {
      // FO: Calculate based on stock received from distributor (stock_transferred status)
      monthlyTarget = currentUser?.stockTarget || 0;
      const foPlacedOrders = await Order.find({
        createdBy: userId,
        foId: userId,
        orderType: "combined",
        status: { $ne: "canceled" },
      }).select("createdAt");

      totalOrders = foPlacedOrders.filter((order) =>
        isWithinTargetMonth(order.createdAt)
      ).length;
      
      // Get orders where stock was transferred to FO (status: stock_transferred)
      const ordersWithStock = await Order.find({
        foId: userId,
        status: { $in: ["stock_transferred", "distributed", "payment_received"] }
      });
      
      // Calculate total value and quantity of stock received from distributor
      for (const order of ordersWithStock) {
        const relevantDate =
          order.stockTransferredAt ||
          order.distributorApprovedAt ||
          order.createdAt;

        if (!isWithinTargetMonth(relevantDate)) continue;

        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            totalItems += item.quantity || 0;
            totalDistributed += (item.quantity || 0) * (item.sellingPrice || 0);
            
            if (itemBreakdown[item.productName]) {
              itemBreakdown[item.productName].quantity += item.quantity || 0;
              itemBreakdown[item.productName].value += (item.quantity || 0) * (item.sellingPrice || 0);
            } else {
              itemBreakdown[item.productName] = {
                quantity: item.quantity || 0,
                value: (item.quantity || 0) * (item.sellingPrice || 0)
              };
            }
          }
        }
      }
      
      // Get unique bookers served (bookers who have received stock from this FO)
      const bookerOrders = await Order.find({
        foId: userId,
        status: { $in: ["distributed", "delivered", "payment_submitted", "payment_received"] }
      });
      bookersServed = [
        ...new Set(
          bookerOrders
            .filter((order) =>
              isWithinTargetMonth(
                order.stockTransferredAt ||
                  order.completedAt ||
                  order.createdAt
              )
            )
            .map((o) => o.bookerId?.toString())
        ),
      ].filter(Boolean).length;
      
    } else if (role === "booker") {
      // Booker: Calculate based on DELIVERED items (status: delivered or completed)
      monthlyTarget = currentUser?.bookerTarget || 0;
      
      // Get all orders for this booker that are delivered or completed
      const orders = await Order.find({ 
        bookerId: userId,
        orderType: "booker",
        status: { $in: ["pending", "fo_combined", "distributor_approved", "stock_transferred", "distributed", "delivered", "payment_submitted", "payment_confirmed", "payment_received", "completed"] }
      });
      
      // Calculate total items delivered
      for (const order of orders) {
        const relevantDate = order.completedAt || order.createdAt;
        if (!isWithinTargetMonth(relevantDate)) continue;

        if (order.items && Array.isArray(order.items)) {
          totalOrders += 1;
          for (const item of order.items) {
            totalItems += item.quantity || 0;
            totalDistributed += (item.quantity || 0) * (item.sellingPrice || 0);
            
            if (itemBreakdown[item.productName]) {
              itemBreakdown[item.productName].quantity += item.quantity || 0;
              itemBreakdown[item.productName].value += (item.quantity || 0) * (item.sellingPrice || 0);
            } else {
              itemBreakdown[item.productName] = {
                quantity: item.quantity || 0,
                value: (item.quantity || 0) * (item.sellingPrice || 0)
              };
            }
          }
        }
      }
    }
    
    // Calculate achievement percentage based on quantity (not value)
    achievementPercent = monthlyTarget > 0 ? (totalItems / monthlyTarget) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        monthlyTarget,
        totalDistributed,
        totalItems,
        totalOrders,
        achievementPercent: Math.round(achievementPercent * 100) / 100,
        itemBreakdown,
        bookersServed,
        targetMonth
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getFOBookersPerformance = async (req, res) => {
  try {
    const foId = req.user._id;
    const targetMonth = new Date().toISOString().slice(0, 7);

    const bookers = await User.find({
      createdBy: foId,
      role: "booker",
    })
      .populate("assignedArea", "name")
      .select("_id name email isActive routes assignedArea bookerTarget targetMonth");

    const orderStatuses = [
      "delivered",
      "payment_submitted",
      "payment_confirmed",
      "payment_received",
      "completed",
    ];

    const performance = await Promise.all(
      bookers.map(async (booker) => {
        const bookerTargetMonth = booker.targetMonth || targetMonth;
        const [bookerYear, bookerMonthNumber] = bookerTargetMonth
          .split("-")
          .map(Number);
        const bookerPeriodStart = new Date(
          bookerYear,
          (bookerMonthNumber || 1) - 1,
          1
        );
        const bookerPeriodEnd = new Date(
          bookerYear,
          bookerMonthNumber || 1,
          1
        );

        const orders = await Order.find({
          foId,
          bookerId: booker._id,
          status: { $in: orderStatuses },
        });

        let achievedUnits = 0;
        let orderCount = 0;
        let salesValue = 0;

        for (const order of orders) {
          const relevantDate = order.completedAt || order.createdAt;
          const isInTargetMonth =
            relevantDate &&
            new Date(relevantDate) >= bookerPeriodStart &&
            new Date(relevantDate) < bookerPeriodEnd;

          if (!isInTargetMonth) continue;

          orderCount += 1;
          for (const item of order.items || []) {
            achievedUnits += item.quantity || 0;
            salesValue += (item.quantity || 0) * (item.sellingPrice || 0);
          }
        }

        const assignedTarget = booker.bookerTarget || 0;
        const achievementPercent =
          assignedTarget > 0 ? (achievedUnits / assignedTarget) * 100 : 0;

        return {
          _id: booker._id,
          name: booker.name,
          email: booker.email,
          isActive: booker.isActive !== false,
          routes: booker.routes || [],
          assignedArea: booker.assignedArea?.name || "",
          targetMonth: bookerTargetMonth,
          assignedTarget,
          achievedUnits,
          extraUnits: Math.max(0, achievedUnits - assignedTarget),
          remainingUnits: Math.max(0, assignedTarget - achievedUnits),
          achievementPercent: Math.round(achievementPercent * 100) / 100,
          orderCount,
          salesValue,
        };
      })
    );

    res.json({
      success: true,
      data: performance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Distributor: Get FO stock transfers and pending payments report
export const getFOStockTransferReport = async (req, res) => {
  try {
    const distributorId = req.user._id;
    const { foId, status } = req.query;
    
    // Build query for orders transferred to FOs
    const orderQuery = {
      distributorId,
      orderType: "combined",
      status: { $in: ["stock_transferred", "distributed", "payment_pending", "payment_submitted", "payment_confirmed", "payment_sent_to_distributor", "payment_submitted_to_distributor", "payment_received", "completed"] }
    };
    
    if (foId) {
      orderQuery.foId = foId;
    }
    
    // Get all transferred orders with linked booker orders populated
    const orders = await Order.find(orderQuery)
      .populate("foId", "name email")
      .populate("linkedBookerOrders")
      .sort({ stockTransferredAt: -1 });
    
    // Get order IDs to filter stocks
    const orderIds = orders.map(order => order._id);
    
    // Get all FO stocks (stock transferred to FOs from this distributor)
    // Only get stocks that are linked to the orders being reported
    let stockQuery = {
      originalDistributorId: distributorId,
      ownerType: "fo"
    };
    
    // Only filter by orderIds if there are orders
    if (orderIds.length > 0) {
      stockQuery.orderId = { $in: orderIds };
    }
    
    if (foId) {
      stockQuery.ownerId = foId;
    }
    
    const foStocks = await Stock.find(stockQuery)
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 });
    
    // Calculate totals
    let totalStockValue = 0;
    let totalPaid = 0;
    let totalPending = 0;
    
    // Group by FO
    const foSummary = {};
    
    for (const order of orders) {
      const foIdStr = order.foId?._id?.toString();
      if (!foIdStr) continue;
      
      if (!foSummary[foIdStr]) {
        foSummary[foIdStr] = {
          fo: order.foId,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          orders: [],
          itemSummary: {}
        };
      }
      
      // Calculate order total
      let orderTotal = 0;
      for (const item of order.items || []) {
        orderTotal += (item.sellingPrice || 0) * item.quantity;
        
        // Track item summary
        const itemKey = item.productName;
        if (!foSummary[foIdStr].itemSummary[itemKey]) {
          foSummary[foIdStr].itemSummary[itemKey] = { quantity: 0, amount: 0 };
        }
        foSummary[foIdStr].itemSummary[itemKey].quantity += item.quantity || 0;
        foSummary[foIdStr].itemSummary[itemKey].amount += (item.sellingPrice || 0) * item.quantity;
      }
      
      // Add discount and delivery charges
      orderTotal = orderTotal - (order.discount || 0) + (order.deliveryCharges || 0);
      
      // Calculate payment based on status
      // Check linked booker orders to determine actual payment status
      let orderPaid = 0;
      
      if (["payment_received", "completed"].includes(order.status)) {
        // If combined order is completed, full payment is done
        orderPaid = orderTotal;
      } else if (order.status === "payment_submitted_to_distributor" || order.status === "payment_sent_to_distributor") {
        // If payment sent to distributor, use the payment amount from combined order
        orderPaid = order.payment?.amount || 0;
      } else if (order.linkedBookerOrders && order.linkedBookerOrders.length > 0) {
        // For other statuses, calculate payment from linked booker orders
        // Only count booker orders that have payment_submitted, payment_confirmed, or completed status
        for (const bookerOrder of order.linkedBookerOrders) {
          if (["payment_submitted", "payment_confirmed", "payment_sent_to_distributor", "payment_received", "completed"].includes(bookerOrder.status)) {
            const bookerOrderTotal = (bookerOrder.items || []).reduce((sum, item) => 
              sum + (item.sellingPrice || 0) * item.quantity, 0) 
              - (bookerOrder.discount || 0) + (bookerOrder.deliveryCharges || 0);
            orderPaid += bookerOrderTotal;
          }
        }
      }
      
      const orderPending = orderTotal - orderPaid;
      
      foSummary[foIdStr].totalAmount += orderTotal;
      foSummary[foIdStr].paidAmount += orderPaid;
      foSummary[foIdStr].pendingAmount += orderPending;
      
      foSummary[foIdStr].orders.push({
        _id: order._id,
        orderNumber: order._id.toString().slice(-8),
        status: order.status,
        totalAmount: orderTotal,
        paidAmount: orderPaid,
        pendingAmount: orderPending,
        items: order.items,
        createdAt: order.createdAt,
        stockTransferredAt: order.stockTransferredAt
      });
    }
    
    // Calculate overall totals
    for (const foIdStr of Object.keys(foSummary)) {
      totalStockValue += foSummary[foIdStr].totalAmount;
      totalPaid += foSummary[foIdStr].paidAmount;
      totalPending += foSummary[foIdStr].pendingAmount;
    }
    
    res.json({
      success: true,
      data: {
        foStocks: foStocks.map(stock => ({
          _id: stock._id,
          itemName: stock.itemName,
          stockType: stock.stockType,
          quantity: stock.originalStockAdded || stock.quantity || 0,
          sellingPrice: stock.sellingPrice || stock.purchasePrice || 0,
          totalValue: (stock.originalStockAdded || stock.quantity || 0) * (stock.sellingPrice || stock.purchasePrice || 0),
          ownerId: stock.ownerId,
          createdAt: stock.createdAt
        })),
        ordersByFO: Object.values(foSummary),
        summary: {
          totalStockValue,
          totalPaid,
          totalPending,
          totalFOs: Object.keys(foSummary).length
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
