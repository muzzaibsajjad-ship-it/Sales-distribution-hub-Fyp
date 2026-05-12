import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CreateUserForm from "../components/forms/CreateUserForm";
import UsersList from "../components/UsersList";
import ProfileForm from "../components/forms/ProfileForm";
import AddStockForm from "../components/forms/AddStockForm";
import StockList from "../components/StockList";
import DistributorStockList from "../components/DistributorStockList";
import StockHistoryList from "../components/StockHistoryList"; // UPDATED
import ItemVisibility from "../components/ItemVisibility";
import CreateOrderForm from "../components/forms/CreateOrderForm";
import DistributorOrders from "../components/DistributorOrders";
import SoleOrders from "../components/SoleOrders";
import DashboardHome from "../components/DashboardHome";

import SalePayments from "../components/SalePayments";
import PurchasePayments from "../components/PurchasePayments";
import ReportPage from "../components/ReportPage";
import AreaManagement from "../components/AreaManagement";
import BookerManagement from "../components/BookerManagement";
import BookerOrderForm from "../components/BookerOrderForm";
import FOOrderManagement from "../components/FOOrderManagement";
import DistributorOrderApproval from "../components/DistributorOrderApproval";
import DistributorStockPrices from "../components/DistributorStockPrices";
import SolePaymentConfirmation from "../components/SolePaymentConfirmation";
import BookerOrderStatus from "../components/BookerOrderStatus";
import FOPaymentConfirmations from "../components/FOPaymentConfirmations";
import FOStockTransferReport from "../components/FOStockTransferReport";
import DistributorCombinedPayments from "../components/DistributorCombinedPayments";
import FOBookersPerformance from "../components/FOBookersPerformance";
import FODistributedPayments from "../components/FODistributedPayments";
import SupplierList from "../components/SupplierList";
import DistributorRequests from "../components/DistributorRequests";

const DashboardRoutes = () => {
  const { user } = useAuth();

  const role = user?.role?.toLowerCase() || "";

  return (
    <Routes>
      {/* Dashboard Home */}
      <Route index element={<DashboardHome />} />

      {/* Sole Routes */}
      {role === "sole" && (
        <>
          <Route path="add-stock" element={<AddStockForm />} />
          <Route path="stock-list" element={<StockList />} />
          <Route path="item-visibility" element={<ItemVisibility />} />
          <Route path="stock-history" element={<StockHistoryList />} />
          <Route path="distributor-requests" element={<DistributorRequests />} />
          <Route
            path="create-distributer"
            element={<CreateUserForm currentRole="sole" />}
          />
          <Route path="orders/pending" element={<SoleOrders />} />

          {/* NEW Purchase & Sale Payments */}
          <Route path="payments/purchase" element={<PurchasePayments />} />
          <Route path="payments/sale" element={<SalePayments />} />
          <Route path="reports" element={<ReportPage />} />
          {/* NEW Sole Payment Confirmation */}
          <Route path="payments/confirm" element={<SolePaymentConfirmation />} />
          <Route path="suppliers" element={<SupplierList />} />
        </>
      )}

      {/* Distributor Routes */}
      {role === "distributer" && (
        <>
          <Route
            path="create-fo"
            element={<CreateUserForm currentRole="distributer" />}
          />
          <Route path="orders/create" element={<CreateOrderForm />} />
          <Route path="orders/pending" element={<DistributorOrders />} />
          <Route path="stock-list" element={<DistributorStockList />} />
          <Route path="stock-history" element={<StockHistoryList />} />

          {/* NEW Sale Payments for Distributor */}
          <Route path="payments/sale" element={<SalePayments />} />
          <Route path="payments/purchase" element={<PurchasePayments />} />
          <Route path="reports" element={<ReportPage />} />
          {/* Area Management */}
          <Route path="areas" element={<AreaManagement />} />
          {/* NEW Distributor Order Approval - includes FO Payments now */}
          <Route path="orders/approve" element={<DistributorOrderApproval />} />
          {/* NEW Set Default Selling Prices */}
          <Route path="stock/prices" element={<DistributorStockPrices />} />
          {/* FO Stock Transfer Report */}
          <Route path="fo-stock-report" element={<FOStockTransferReport />} />
        </>
      )}

      {/* Field Officer Routes */}
      {role === "fo" && (
        <>
          <Route
            path="create-booker"
            element={<CreateUserForm currentRole="FO" />}
          />
          {/* Area Management - FO can view assigned areas */}
          <Route path="areas" element={<AreaManagement />} />
          {/* Booker Management - FO can manage bookers */}
          <Route path="bookers" element={<BookerManagement />} />
          {/* NEW FO Order Management */}
          <Route path="orders/manage" element={<FOOrderManagement />} />
{/* NEW FO Payment Confirmations */}
          <Route path="payments/confirm" element={<FOPaymentConfirmations />} />
          {/* NEW FO Distributed Payments - View payment records for distributed orders */}
          <Route path="payments/distributed" element={<FODistributedPayments />} />
          <Route path="bookers/performance" element={<FOBookersPerformance />} />
        </>
      )}

      {/* Booker Routes */}
      {role === "booker" && (
        <>
          {/* NEW Booker Order Form */}
          <Route path="orders/create" element={<BookerOrderForm />} />
          {/* NEW Booker Order Status - View order status and make payment */}
          <Route path="orders/status" element={<BookerOrderStatus />} />
          {/* NEW Booker Order History - View completed orders */}
          <Route path="orders/history" element={<BookerOrderStatus />} />
        </>
      )}

      {/* Common Routes for sole, distributer, FO */}
      {["sole", "distributer", "fo"].includes(role) && (
        <Route path="users" element={<UsersList />} />
      )}

      {/* Profile */}
      <Route path="profile" element={<ProfileForm />} />

      {/* Fallback */}
      <Route path="*" element={<h1 className="text-white">404 Not Found</h1>} />

      {/* Redirect if role is undefined */}
      {!role && <Route path="*" element={<Navigate to="/" replace />} />}
    </Routes>
  );
};

export default DashboardRoutes;
