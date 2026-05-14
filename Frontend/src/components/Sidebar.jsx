import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  FaUserPlus,
  FaUsers,
  FaBoxOpen,
  FaClipboardList,
  FaHistory,
  FaDollarSign,
  FaShoppingCart,
  FaMapMarkerAlt,
  FaTruck,
  FaChartLine,
  FaUser,
  FaTimes,
} from "react-icons/fa";

import {
  getPendingOrdersApi,
  getDistributorCombinedOrdersApi,
  getFOBookerOrdersApi,
  getFOCombinedOrdersApi,
  getBookerOrdersApi,
} from "../api/api";

const Sidebar = ({ onClose }) => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [orderBadges, setOrderBadges] = useState({});

  useEffect(() => {
    if (!user?.role) return;

    let isMounted = true;

    const loadOrderBadges = async () => {
      const nextBadges = {};

      try {
        if (user.role === "sole") {
          const res = await getPendingOrdersApi();
          if (res.success) {
            nextBadges["/dashboard/orders/pending"] =
              res.orders?.filter(
                (o) => !["completed", "canceled", "rejected"].includes(o.status)
              ).length || 0;
          }
        }

        if (user.role === "distributer") {
          const res = await getDistributorCombinedOrdersApi();
          if (res.success) {
            nextBadges["/dashboard/orders/approve"] =
              res.data?.filter((o) => o.status === "fo_combined").length || 0;
          }
        }

        if (user.role === "FO") {
          const [pendingRes] = await Promise.all([
            getFOBookerOrdersApi(),
            getFOCombinedOrdersApi(),
          ]);

          nextBadges["/dashboard/orders/manage"] =
            pendingRes.success ? pendingRes.data?.length || 0 : 0;
        }

        if (user.role === "booker") {
          const res = await getBookerOrdersApi();
          if (res.success) {
            nextBadges["/dashboard/orders/status"] =
              res.data?.filter(
                (o) => !["completed", "rejected", "canceled"].includes(o.status)
              ).length || 0;
          }
        }

        if (isMounted) setOrderBadges(nextBadges);
      } catch (err) {}
    };

    loadOrderBadges();
    const id = setInterval(loadOrderBadges, 30000);

    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [user?.role]);

  const links = [];

  // ===================== ROLES =====================
  if (user?.role === "sole") {
    links.push(
      { name: "Distributor Requests", path: "/dashboard/distributor-requests", icon: <FaClipboardList /> },
      { name: "Create Distributer", path: "/dashboard/create-distributer", icon: <FaUserPlus /> },
      { name: "Add Stock", path: "/dashboard/add-stock", icon: <FaBoxOpen /> },
      { name: "Stock List", path: "/dashboard/stock-list", icon: <FaBoxOpen /> },
      { name: "Stock Visibility", path: "/dashboard/item-visibility", icon: <FaBoxOpen /> },
      { name: "Orders", path: "/dashboard/orders/pending", icon: <FaClipboardList /> },
      { name: "Stock History", path: "/dashboard/stock-history", icon: <FaHistory /> },
      { name: "Purchase Payments", path: "/dashboard/payments/purchase", icon: <FaDollarSign /> },
      { name: "Sale Payments", path: "/dashboard/payments/sale", icon: <FaShoppingCart /> },
      { name: "Reports", path: "/dashboard/reports", icon: <FaClipboardList /> },
      { name: "Suppliers", path: "/dashboard/suppliers", icon: <FaUser /> }
    );
  }

  if (user?.role === "distributer") {
    links.push(
      { name: "Create FO", path: "/dashboard/create-fo", icon: <FaUserPlus /> },
      { name: "Area Management", path: "/dashboard/areas", icon: <FaMapMarkerAlt /> },
      { name: "Place Order", path: "/dashboard/orders/create", icon: <FaBoxOpen /> },
      { name: "Pending Orders", path: "/dashboard/orders/pending", icon: <FaClipboardList /> },
      { name: "Set Default Prices", path: "/dashboard/stock/prices", icon: <FaDollarSign /> },
      { name: "FO Orders", path: "/dashboard/orders/approve", icon: <FaClipboardList /> },
      { name: "Stock List", path: "/dashboard/stock-list", icon: <FaBoxOpen /> },
      { name: "Stock History", path: "/dashboard/stock-history", icon: <FaHistory /> },
      { name: "Purchase Payments", path: "/dashboard/payments/purchase", icon: <FaDollarSign /> },
      { name: "Sale Payments", path: "/dashboard/payments/sale", icon: <FaShoppingCart /> },
      { name: "Reports", path: "/dashboard/reports", icon: <FaClipboardList /> },
      { name: "FO Stock Transfer", path: "/dashboard/fo-stock-report", icon: <FaTruck /> }
    );
  }

  if (user?.role === "FO") {
    links.push(
      { name: "Create Booker", path: "/dashboard/create-booker", icon: <FaUserPlus /> },
      { name: "Booker Management", path: "/dashboard/bookers", icon: <FaUsers /> },
      { name: "Orders", path: "/dashboard/orders/manage", icon: <FaClipboardList /> },
      { name: "Payment Confirmations", path: "/dashboard/payments/confirm", icon: <FaDollarSign /> },
      { name: "Distributed Payments", path: "/dashboard/payments/distributed", icon: <FaDollarSign /> },
      { name: "Performance", path: "/dashboard/bookers/performance", icon: <FaChartLine /> }
    );
  }

  if (user?.role === "booker") {
    links.push(
      { name: "Place Order", path: "/dashboard/orders/create", icon: <FaShoppingCart /> },
      { name: "Order Status", path: "/dashboard/orders/status", icon: <FaClipboardList /> },
      { name: "Order History", path: "/dashboard/orders/history", icon: <FaHistory /> }
    );
  }

  if (["sole", "distributer", "FO"].includes(user?.role)) {
    links.push({ name: "View Users", path: "/dashboard/users", icon: <FaUsers /> });
  }

  return (
    <motion.div
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="
        relative 
        w-56 sm:w-64 md:w-72 
        bg-[#4b2e2e] 
        text-[#f5e0c3] 
        h-screen 
        p-3 sm:p-4 md:p-6 
        border-r border-[#6d3b3b] 
        shadow-lg 
        overflow-y-auto 
        text-xs sm:text-sm md:text-base 
        z-50
      "
    >
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="
            md:hidden 
            absolute top-3 right-3 
            bg-[#7f2c2c] hover:bg-[#5f1f1f] 
            text-white 
            w-8 h-8 
            flex items-center justify-center 
            rounded-full
          "
        >
          <FaTimes />
        </button>
      )}

      {/* Title */}
      <Link
        to="/dashboard"
        className="
          font-bold 
          mb-4 sm:mb-6 
          text-lg sm:text-xl 
          uppercase 
          tracking-wide 
          text-[#f5c16c] 
          block 
          hover:text-[#fff1d0]
        "
      >
        Sales Hub
      </Link>

      {/* Links */}
      <ul className="space-y-1 sm:space-y-2">
        {links.map((link) => {
          const active = pathname === link.path;
          const badgeCount = orderBadges[link.path] || 0;

          return (
            <Link
              key={link.name}
              to={link.path}
              className={`
                flex items-center 
                gap-2 sm:gap-3 
                p-2 sm:p-3 
                rounded-md 
                border 
                transition-all 
                text-xs sm:text-sm 
                font-medium
                ${
                  active
                    ? "bg-[#7f2c2c] text-[#fff1d0] border-none shadow-md"
                    : "hover:bg-[#633030] border-[#6d3b3b]"
                }
              `}
            >
              <span className="text-base sm:text-lg">{link.icon}</span>

              <span className="flex-1 truncate">{link.name}</span>

              {badgeCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] sm:text-[11px] font-bold">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </ul>
    </motion.div>
  );
};

export default Sidebar;