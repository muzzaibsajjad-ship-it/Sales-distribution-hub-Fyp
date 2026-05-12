import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
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
} from "react-icons/fa";
import {
  getPendingOrdersApi,
  getDistributorCombinedOrdersApi,
  getFOBookerOrdersApi,
  getFOCombinedOrdersApi,
  getBookerOrdersApi,
} from "../api/api";

const Sidebar = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [orderBadges, setOrderBadges] = useState({});

  useEffect(() => {
    if (!user?.role) return undefined;

    let isMounted = true;

    const loadOrderBadges = async () => {
      const nextBadges = {};

      if (user.role === "sole") {
        const res = await getPendingOrdersApi();
        if (res.success) {
          nextBadges["/dashboard/orders/pending"] = res.orders?.filter(
            (order) => !["completed", "canceled", "rejected"].includes(order.status)
          ).length || 0;
        }
      }

      if (user.role === "distributer") {
        const res = await getDistributorCombinedOrdersApi();
        if (res.success) {
          nextBadges["/dashboard/orders/approve"] = res.data?.filter(
            (order) => order.status === "fo_combined"
          ).length || 0;
        }
      }

      if (user.role === "FO") {
        const [pendingRes] = await Promise.all([
          getFOBookerOrdersApi(),
          getFOCombinedOrdersApi(),
        ]);

        const pendingCount = pendingRes.success ? pendingRes.data?.length || 0 : 0;

        nextBadges["/dashboard/orders/manage"] = pendingCount;
      }

      if (user.role === "booker") {
        const res = await getBookerOrdersApi();
        if (res.success) {
          nextBadges["/dashboard/orders/status"] = res.data?.filter(
            (order) => !["completed", "rejected", "canceled"].includes(order.status)
          ).length || 0;
        }
      }

      if (isMounted) {
        setOrderBadges(nextBadges);
      }
    };

    loadOrderBadges();
    const intervalId = window.setInterval(loadOrderBadges, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [user?.role]);

  const links = [];

  if (user.role === "sole") {
    links.push(
      {
        name: "Distributor Requests",
        path: "/dashboard/distributor-requests",
        icon: <FaClipboardList />,
      },
      {
        name: "Create Distributer",
        path: "/dashboard/create-distributer",
        icon: <FaUserPlus />,
      },
      { name: "Add Stock", path: "/dashboard/add-stock", icon: <FaBoxOpen /> },
      {
        name: "Stock List",
        path: "/dashboard/stock-list",
        icon: <FaBoxOpen />,
      },
      {
        name: "Stock Visibility",
        path: "/dashboard/item-visibility",
        icon: <FaBoxOpen />,
      },
      {
        name: "Orders",
        path: "/dashboard/orders/pending",
        icon: <FaClipboardList />,
      },
      {
        name: "Stock History",
        path: "/dashboard/stock-history",
        icon: <FaHistory />,
      },
      {
        name: "Purchase Payments",
        path: "/dashboard/payments/purchase",
        icon: <FaDollarSign />,
      },
      {
        name: "Sale Payments",
        path: "/dashboard/payments/sale",
        icon: <FaShoppingCart />,
      },
      { name: "Reports", path: "/dashboard/reports", icon: <FaClipboardList /> },
      { name: "Suppliers", path: "/dashboard/suppliers", icon: <FaUser /> }
    );
  }

  if (user.role === "distributer") {
    links.push(
      { name: "Create FO", path: "/dashboard/create-fo", icon: <FaUserPlus /> },
       {
        name: "Area Management",
        path: "/dashboard/areas",
        icon: <FaMapMarkerAlt />,
      },
      {
        name: "Place Order",
        path: "/dashboard/orders/create",
        icon: <FaBoxOpen />,
      },
      {
        name: "Pending Orders",
        path: "/dashboard/orders/pending",
        icon: <FaClipboardList />,
      },
      {
        name: "Set Default Prices",
        path: "/dashboard/stock/prices",
        icon: <FaDollarSign />,
      },
      {
        name: "FO Orders",
        path: "/dashboard/orders/approve",
        icon: <FaClipboardList />,
      },
      {
        name: "Stock List",
        path: "/dashboard/stock-list",
        icon: <FaBoxOpen />,
      },
      {
        name: "Stock History",
        path: "/dashboard/stock-history",
        icon: <FaHistory />,
      },
      {
        name: "Purchase Payments",
        path: "/dashboard/payments/purchase",
        icon: <FaDollarSign />,
      },
      {
        name: "Sale Payments",
        path: "/dashboard/payments/sale",
        icon: <FaShoppingCart />,
      },
      { name: "Reports", path: "/dashboard/reports", icon: <FaClipboardList /> },
     
      {
        name: "FO Stock Transfer",
        path: "/dashboard/fo-stock-report",
        icon: <FaTruck />,
      }
    );
  }

  if (user.role === "FO") {
    links.push(
      {
        name: "Create Booker",
        path: "/dashboard/create-booker",
        icon: <FaUserPlus />,
      },
      {
        name: "Booker Management",
        path: "/dashboard/bookers",
        icon: <FaUsers />,
      },
      {
        name: "Orders ",
        path: "/dashboard/orders/manage",
        icon: <FaClipboardList />,
      },
{
        name: "Payment Confirmations",
        path: "/dashboard/payments/confirm",
        icon: <FaDollarSign />,
      },
      {
        name: "Distributed Payments",
        path: "/dashboard/payments/distributed",
        icon: <FaDollarSign />,
      },
      {
        name: "Bookers Performance",
        path: "/dashboard/bookers/performance",
        icon: <FaChartLine />,
      }
    );
  }

  // Booker routes
  if (user.role === "booker") {
    links.push(
      {
        name: "Place Order",
        path: "/dashboard/orders/create",
        icon: <FaShoppingCart />,
      },
      {
        name: "My Order Status",
        path: "/dashboard/orders/status",
        icon: <FaClipboardList />,
      },
      {
        name: "Order History",
        path: "/dashboard/orders/history",
        icon: <FaHistory />,
      }
    );
  }

  if (["sole", "distributer", "FO"].includes(user.role)) {
    links.push({
      name: "View Users",
      path: "/dashboard/users",
      icon: <FaUsers />,
    });
  }

  return (
    <motion.div
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-64 bg-[#4b2e2e] text-[#f5e0c3] h-screen p-6 border-r border-[#6d3b3b] shadow-lg overflow-y-auto scrollbar-thin scrollbar-thumb-[#7f2c2c] scrollbar-track-[#4b2e2e]"
    >
      <Link
        to="/dashboard"
        className="font-bold mb-6 text-xl uppercase tracking-wide text-[#f5c16c] block hover:text-[#fff1d0] transition-colors"
      >
        Sales Hub
      </Link>

      <ul className="space-y-2">
        {links.map((link) => {
          const active = pathname === link.path;
          const badgeCount = orderBadges[link.path] || 0;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-all text-sm font-medium rounded-md border ${
                active
                  ? "bg-[#7f2c2c] text-[#fff1d0] border-none shadow-md"
                  : "hover:bg-[#633030] border-[#6d3b3b]"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="flex-1">{link.name}</span>
              {badgeCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold shadow-sm">
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
