import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Add token to headers
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// ===== Auth APIs =====
export const loginApi = async ({ email, password, role }) => {
  try {
    const { data } = await API.post("/auth/login", { email, password, role });
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error" };
  }
};

// ===== User APIs =====
export const createUserApi = async ({ name, email, password }) => {
  try {
    const { data } = await API.post("/users/create", { name, email, password });
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error" };
  }
};

export const getUsersApi = async () => {
  try {
    const { data } = await API.get("/users");
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error" };
  }
};

export const getUserByIdApi = async (id) => {
  try {
    const { data } = await API.get(`/users/${id}`);
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error" };
  }
};

export const deleteUserApi = async (id) => {
  try {
    const { data } = await API.delete(`/users/${id}`);
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error" };
  }
};

// ===== Stock APIs =====
export const addStockApi = async (data) => {
  try {
    const res = await API.post("/stock/add", data);
    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error adding stock",
    };
  }
};

export const getStockApi = async () => {
  try {
    const res = await API.get("/stock");
    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error fetching stock",
    };
  }
};

export const updateStockApi = async (id, updatedData) => {
  try {
    const { data } = await API.put(`/stock/${id}`, updatedData);
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error" };
  }
};

// ===== Item Visibility APIs =====
export const getVisibilityMatrixApi = async () => {
  try {
    const { data } = await API.get("/visibility");
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error fetching visibility data",
    };
  }
};

export const toggleVisibilityApi = async (stockId, distributorId) => {
  try {
    const { data } = await API.put("/visibility/toggle", {
      stockId,
      distributorId,
    });
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error toggling visibility",
    };
  }
};

// ===== Distributor APIs =====
export const submitDistributorApplicationApi = async ({ name, email, contact, address, city, investment, message }) => {
  try {
    const res = await API.post("/auth/distributor-application", {
      name,
      email,
      contact,
      address,
      city,
      investment,
      message,
    });
    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error submitting distributor application",
    };
  }
};

export const getDistributorRequestsApi = async () => {
  try {
    const { data } = await API.get("/users/distributor-requests");
    return { success: true, data: data.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error fetching distributor requests",
    };
  }
};

export const deleteDistributorRequestApi = async (id) => {
  try {
    const { data } = await API.delete(`/users/distributor-requests/${id}`);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error deleting distributor request",
    };
  }
};

export const approveDistributorRequestApi = async (id) => {
  try {
    const { data } = await API.put(`/users/distributor-requests/${id}/approve`);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error approving distributor request",
    };
  }
};

// Get visible stocks for placing orders
export const getVisibleStockApi = async () => {
  try {
    const { data } = await API.get("/orders/items");
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error" };
  }
};

// Create order (single item)
export const createOrderApi = async ({ itemId, quantity, paymentMethod }) => {
  try {
    const { data } = await API.post("/orders/create", {
      itemId,
      quantity,
      paymentMethod,
    });
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error creating order",
    };
  }
};

// Submit payment for stockApproved order
export const submitPaymentApi = async (
  orderId,
  { invoiceNumber, amount, method, proof }
) => {
  try {
    const { data } = await API.put("/orders/submit-payment", {
      orderId,
      invoiceNumber,
      amount,
      method,
      proof,
    });
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error submitting payment",
    };
  }
};
// Sole APIs
// =======================

// Get all pending orders (pending or stockApproved)
export const getPendingOrdersApi = async () => {
  try {
    const { data } = await API.get("/orders/pending");
    return { success: true, orders: data.orders };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error fetching pending orders",
    };
  }
};

// Approve stock + set selling price / discount / deliveryCharges
export const approveStockApi = async (
  orderId,
  { sellingPrice, discount = 0, deliveryCharges = 0, quantity }
) => {
  try {
    const { data } = await API.put("/orders/approve-stock", {
      orderId,
      sellingPrice,
      discount,
      deliveryCharges,
      quantity,
    });
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error approving stock",
    };
  }
};

// Confirm payment → complete order
export const confirmPaymentApi = async (orderId) => {
  try {
    const { data } = await API.put("/orders/confirm-payment", { orderId });
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error confirming payment",
    };
  }
};
// Cancel Order API call
export const cancelOrderApi = async (orderId) => {
  try {
    const { data } = await API.put("/orders/cancel-order", { orderId });
    return { success: true, data };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: err.response?.data?.message || "Failed to cancel order",
    };
  }
};

// =======================
// Optional: Get all orders (role-based) with optional status filter
// =======================
export const getOrdersApi = async (status = "all") => {
  try {
    const { data } = await API.get(`/orders?status=${status}`);
    return { success: true, orders: data.orders };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Error fetching orders",
    };
  }
};
export const fetchHistory = async () => {
  try {
    const res = await API.get("/stock/history/me"); // backend endpoint
    return res.data; // { success: true, data: [...] }
  } catch (err) {
    console.error("Fetch history failed:", err);
    return { success: false, data: [] };
  }
};
// Fetch payments by type
// Fetch payments by type (purchase or sale)
export const fetchPayments = async (type) => {
  try {
    const { data } = await API.get(`/payments?type=${type}`);
    return data; // already in { success, data } format from backend
  } catch (err) {
    console.error("Fetch payments failed:", err);
    return { success: false, data: [] };
  }
};
export const fetchReports = async () => {
  try {
    const { data } = await API.get("/reports"); // use axios, token included
    return data; // { success: true, data: {...} } from backend
  } catch (err) {
    console.error("Fetch reports failed:", err);
    return { success: false, data: null };
  }
};

// ===== Area APIs =====
export const createAreaApi = async (name) => {
  try {
    const { data } = await API.post("/areas/create", { name });
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error creating area" };
  }
};

export const getAreasApi = async () => {
  try {
    const { data } = await API.get("/areas");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching areas" };
  }
};

export const updateAreaApi = async (id, name) => {
  try {
    const { data } = await API.put(`/areas/${id}`, { name });
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error updating area" };
  }
};

export const toggleAreaStatusApi = async (id) => {
  try {
    const { data } = await API.put(`/areas/${id}/toggle-status`);
    return { success: true, data, message: data.message };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error toggling area status" };
  }
};

export const getFOListApi = async () => {
  try {
    const { data } = await API.get("/areas/fos");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching FO list" };
  }
};

export const assignAreasToFOApi = async (foId, areaIds) => {
  try {
    const { data } = await API.post("/areas/assign", { foId, areaIds });
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error assigning areas" };
  }
};

export const getFOWithAreasApi = async () => {
  try {
    const { data } = await API.get("/areas/fos/with-areas");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching FO areas" };
  }
};

export const deleteAreaApi = async (id) => {
  try {
    const { data } = await API.delete(`/areas/${id}`);
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error deleting area" };
  }
};

export const setMonthlyTargetApi = async (foId, target, month) => {
  try {
    const { data } = await API.put(`/areas/fo/${foId}/target`, { target, month });
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error setting target" };
  }
};

export const toggleFOStatusApi = async (foId) => {
  try {
    const { data } = await API.put(`/users/${foId}/toggle-status`);
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error toggling FO status" };
  }
};

// Generic toggle user status (for distributors, FO, bookers)
export const toggleUserStatusApi = async (userId) => {
  try {
    const { data } = await API.put(`/users/${userId}/toggle-status`);
    return { success: true, message: data.message, isActive: data.isActive };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error toggling user status" };
  }
};

export const getFOTargetApi = async () => {
  try {
    const { data } = await API.get("/areas/fo/my-target");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching FO target" };
  }
};

// ===== Booker Management APIs =====
export const getBookersApi = async () => {
  try {
    const { data } = await API.get("/users/bookers");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching bookers" };
  }
};

export const assignAreaToBookerApi = async (bookerId, areaId, routes) => {
  try {
    const { data } = await API.put("/users/booker/assign", { bookerId, areaId, routes });
    return { success: true, message: data.message, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error assigning area to booker" };
  }
};

export const setBookerTargetApi = async (bookerId, target, month) => {
  try {
    const { data } = await API.put(`/users/booker/${bookerId}/target`, { target, month });
    return { success: true, message: data.message, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error setting booker target" };
  }
};

export const toggleBookerStatusApi = async (bookerId) => {
  try {
    const { data } = await API.put(`/users/booker/${bookerId}/toggle-status`);
    return { success: true, message: data.message, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error toggling booker status" };
  }
};

// ===== Booker Order Workflow APIs =====

// Booker: Get available stock from distributor
export const getBookerStockApi = async () => {
  try {
    const { data } = await API.get("/orders/booker/stock");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching booker stock" };
  }
};

// Booker: Place an order
export const createBookerOrderApi = async (items, areaId, route, shopName, shopAddress) => {
  try {
    const { data } = await API.post("/orders/booker/create", { 
      items, 
      areaId, 
      route,
      shopName,
      shopAddress
    });
    return { success: true, data: data.order };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error creating booker order" };
  }
};

// Booker: Get their own orders with status
export const getBookerOrdersApi = async () => {
  try {
    const { data } = await API.get("/orders/booker/orders");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching orders" };
  }
};

// Booker: Submit payment for their order
export const bookerSubmitPaymentApi = async (orderId, paymentData, proofFile) => {
  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("invoiceNumber", paymentData.invoiceNumber);
  formData.append("amount", paymentData.amount);
  formData.append("method", paymentData.method);
  if (proofFile) {
    formData.append("proof", proofFile);
  }
  try {
    const { data } = await API.put("/orders/booker/submit-payment", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, data: data.order };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error submitting payment" };
  }
};

// Booker: Confirm delivery - deduct stock when delivered to customer
export const bookerConfirmDeliveryApi = async (orderId) => {
  try {
    const { data } = await API.put("/orders/booker/confirm-delivery", { orderId });
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error confirming delivery" };
  }
};

// FO: Distribute stock to booker
export const distributeToBookerApi = async (orderId, bookerOrderId) => {
  try {
    const { data } = await API.put("/orders/fo/distribute-to-booker", { orderId, bookerOrderId });
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error distributing stock" };
  }
};

// FO: Get real-time target achievement
export const getFOTargetAchievementApi = async () => {
  try {
    const { data } = await API.get("/orders/fo/target-achievement");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching target achievement" };
  }
};

export const getFOBookersPerformanceApi = async () => {
  try {
    const { data } = await API.get("/orders/fo/bookers-performance");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching bookers performance" };
  }
};

// FO: Get pending booker orders
export const getFOBookerOrdersApi = async () => {
  try {
    const { data } = await API.get("/orders/fo/booker-orders");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching booker orders" };
  }
};

// FO: Get combined orders for FO (approved orders waiting for stock transfer)
export const getFOCombinedOrdersApi = async () => {
  try {
    const { data } = await API.get("/orders/fo/combined-orders");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching combined orders" };
  }
};

// FO: Combine booker orders
export const combineBookerOrdersApi = async (bookerOrderIds) => {
  try {
    const { data } = await API.post("/orders/fo/combine", { bookerOrderIds });
    return { success: true, data: data.order };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error combining orders" };
  }
};

// Distributor: Get combined orders awaiting approval
export const getDistributorCombinedOrdersApi = async () => {
  try {
    const { data } = await API.get("/orders/distributor/combined");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching combined orders" };
  }
};

// Distributor: Approve combined order with selling prices
export const approveCombinedOrderApi = async (orderId, items, discount, deliveryCharges) => {
  try {
    const { data } = await API.put("/orders/distributor/approve", { 
      orderId, 
      items, 
      discount: discount || 0, 
      deliveryCharges: deliveryCharges || 0 
    });
    return { success: true, data: data.order };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error approving order" };
  }
};

// Distributor: Reject combined order
export const rejectCombinedOrderApi = async (orderId, reason) => {
  try {
    const { data } = await API.put("/orders/distributor/reject", { orderId, reason });
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error rejecting order" };
  }
};

// FO: Transfer stock from distributor to FO
export const transferStockToFOApi = async (orderId) => {
  try {
    const { data } = await API.put("/orders/fo/transfer-stock", { orderId });
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error transferring stock" };
  }
};

// Distributor: Set default selling price for stock
export const setDefaultSellingPriceApi = async (stockId, sellingPrice) => {
  try {
    const { data } = await API.put("/orders/distributor/set-price", { stockId, sellingPrice });
    return { success: true, message: data.message, data: data.stock };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error setting price" };
  }
};

// Distributor: Get stock with selling prices
export const getDistributorStockPricesApi = async () => {
  try {
    const { data } = await API.get("/orders/distributor/stock-prices");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching stock" };
  }
};

// Distributor: Submit payment for combined order
export const submitCombinedPaymentApi = async (orderId, { invoiceNumber, amount, method }, proofFile) => {
  try {
    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("invoiceNumber", invoiceNumber);
    formData.append("amount", amount);
    formData.append("method", method);
    if (proofFile) {
      formData.append("proof", proofFile);
    }

    const { data } = await API.put("/orders/distributor/submit-payment", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, data: data.order };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error submitting payment" };
  }
};

// Sole: Confirm payment for combined order
export const confirmCombinedPaymentApi = async (orderId) => {
  try {
    const { data } = await API.put("/orders/sole/confirm-payment", { orderId });
    return { success: true, message: data.message, data: data.distributorStocks };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error confirming payment" };
  }
};

// FO: Get booker orders with submitted payments (waiting for FO confirmation)
export const getFOPaymentConfirmationsApi = async () => {
  try {
    const { data } = await API.get("/orders/fo/payment-confirmations");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching payment confirmations" };
  }
};

// FO: Get payment pending records for distributed orders - shows pending vs paid status
export const getFOPaymentPendingApi = async () => {
  try {
    const { data } = await API.get("/orders/fo/payment-pending");
    return { success: true, data: data.data, summary: data.summary };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching payment records" };
  }
};

// FO: Confirm booker payment
export const confirmBookerPaymentApi = async (orderId) => {
  try {
    const { data } = await API.put("/orders/fo/confirm-payment", { orderId });
    return { success: true, message: data.message, data: data.order };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error confirming payment" };
  }
};

// FO: Send combined payment to distributor - directly adds to sale payments
export const sendCombinedPaymentToDistributorApi = async (orderIds, paymentData, proofFile) => {
  try {
    const formData = new FormData();
    formData.append("orderIds", JSON.stringify(orderIds));
    formData.append("invoiceNumber", paymentData.invoiceNumber || "");
    formData.append("amount", paymentData.amount);
    formData.append("method", paymentData.method);
    
    if (proofFile) {
      formData.append("proof", proofFile);
    }
    
    const { data } = await API.put("/orders/fo/send-combined-payment", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, message: data.message, data: data.order, invoiceNumber: data.invoiceNumber };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error sending combined payment" };
  }
};

// Distributor: Get combined payments from FO
export const getDistributorCombinedPaymentsApi = async () => {
  try {
    const { data } = await API.get("/orders/distributor/combined-payments");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching combined payments" };
  }
};

// Distributor: Complete order after receiving payment
export const completeOrderFromFOApi = async (orderId) => {
  try {
    const { data } = await API.put("/orders/distributor/complete-order", { orderId });
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error completing order" };
  }
};

// Get next invoice number
export const getNextInvoiceNumberApi = async (type) => {
  try {
    const { data } = await API.get(`/orders/next-invoice?type=${type}`);
    return { success: true, invoiceNumber: data.invoiceNumber };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error getting invoice number" };
  }
};

// ===== Supplier APIs =====
export const getSuppliersApi = async () => {
  try {
    const { data } = await API.get("/suppliers");
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error fetching suppliers" };
  }
};

export const createSupplierApi = async (supplierData) => {
  try {
    const { data } = await API.post("/suppliers", supplierData);
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error creating supplier" };
  }
};

export const updateSupplierApi = async (id, supplierData) => {
  try {
    const { data } = await API.put(`/suppliers/${id}`, supplierData);
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error updating supplier" };
  }
};

export const toggleSupplierStatusApi = async (id) => {
  try {
    const { data } = await API.put(`/suppliers/${id}/toggle-status`);
    return { success: true, message: data.message, data: data.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error toggling supplier status" };
  }
};

export default API;
