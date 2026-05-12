import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FaBoxOpen,
  FaUsers,
  FaShoppingCart,
  FaClipboardList,
  FaChartLine,
  FaDollarSign,
  FaBullseye,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaCalendarAlt,
  FaTruck,
  FaStar,
} from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { getFOTargetApi, getFOTargetAchievementApi } from "../api/api";

const DashboardHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem("user")).token;
      
      // If FO, get their target achievement data (real-time from stock distributed)
      if (user.role === "FO") {
        const foData = await getFOTargetAchievementApi();
        const foTarget = await getFOTargetApi();
        if (foData.success) {
          setStats({
            stockTarget: foData.data.monthlyTarget || 0,
            totalDistributed: foData.data.totalDistributed || 0,
            totalItems: foData.data.totalItems || 0,
            achievementPercent: foData.data.achievementPercent || 0,
            itemBreakdown: foData.data.itemBreakdown || {},
            bookersServed: foData.data.bookersServed || 0,
            totalOrders: foData.data.totalOrders || 0,
            targetMonth: foData.data.targetMonth,
            assignedAreas: foTarget.success && foTarget.data.assignedAreas ? foTarget.data.assignedAreas : (user.assignedArea ? [user.assignedArea] : []),
            isActive: foTarget.success ? foTarget.data.isActive : true,
          });
        }
        setLoading(false);
        return;
      }

      // If Booker, get their target achievement data (real-time from orders)
      if (user.role === "booker") {
        const bookerData = await getFOTargetAchievementApi();
        if (bookerData.success) {
          setStats({
            bookerTarget: bookerData.data.monthlyTarget || 0,
            totalItems: bookerData.data.totalItems || 0,
            totalOrders: bookerData.data.totalOrders || 0,
            achievementPercent: bookerData.data.achievementPercent || 0,
            targetMonth: bookerData.data.targetMonth,
            isActive: true,
          });
        }
        setLoading(false);
        return;
      }
      
      const res = await fetch(
        `http://localhost:5000/api/dashboard/${user.role}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setStats(data.data || {});
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
    // Real-time update every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user.role]);

  if (loading)
    return <p className="text-[#4b2e2e] text-lg">Loading dashboard...</p>;

  // ----------------- FO Dashboard -----------------
  if (user.role === "FO") {
    const target = stats.stockTarget || 0;
    const achieved = stats.totalItems || 0;
    const totalOrders = stats.totalOrders || 0;
    const achievementPercent = stats.achievementPercent || 0;
    const isTargetAchieved = achievementPercent >= 100;
    const extraSales = isTargetAchieved ? Math.max(0, achieved - target) : 0;

    // Format month name
    const formatMonth = (monthStr) => {
      if (!monthStr) return "Current Month";
      const [year, month] = monthStr.split("-");
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleString("default", { month: "long", year: "numeric" });
    };

    return (
      <motion.div
        className="text-[#4b2e2e]"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-extrabold mb-2 tracking-wide">
          Welcome,{" "}
          <span className="text-[#7f2c2c]">{user.name}</span>
        </h2>
        
        {/* Assigned Area Display */}
        {stats.assignedAreas && stats.assignedAreas.length > 0 && (
          <div className="flex items-center gap-2 mb-6 text-[#2a72aa]">
            <FaMapMarkerAlt />
            <span className="font-medium">
              Assigned Area{stats.assignedAreas.length > 1 ? "s" : ""}: {stats.assignedAreas.join(", ")}
            </span>
          </div>
        )}

        {/* Target Achieved Banner */}
        {isTargetAchieved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-[#2a72aa] to-[#1f4f7a] text-white p-4 rounded-xl mb-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-3xl" />
                <div>
                  <p className="font-bold text-lg">Target Achieved!</p>
                  <p className="text-sm opacity-90">Congratulations! You have reached your monthly target.</p>
                </div>
              </div>
              {extraSales > 0 && (
                <div className="text-right">
                  <p className="text-2xl font-bold">+{extraSales} units</p>
                  <p className="text-sm opacity-90">Extra Sales</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Target Card - Main Focus */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-8 mb-8 shadow-xl bg-gradient-to-br from-[#7f2c2c] to-[#5a1f1f] text-white"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Target Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FaBullseye className="text-3xl text-[#f5c16c]" />
                <h3 className="text-2xl font-bold">Monthly Stock Target</h3>
              </div>
              <p className="text-[#f5c16c] text-lg mb-4">
                Target for {formatMonth(stats.targetMonth)}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{target}</span>
                <span className="text-xl opacity-80">units</span>
              </div>
            </div>

            {/* Progress Circle */}
            <div className="w-48 h-48">
              <CircularProgressbar
                value={stats.achievementPercent || 0}
                text={`${Math.round(stats.achievementPercent || 0)}%`}
                styles={buildStyles({
                  textColor: "#fff",
                  pathColor: "#f5c16c",
                  trailColor: "rgba(255,255,255,0.2)",
                  textSize: "20px",
                })}
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{achieved} / {target} units</span>
            </div>
            <div className="h-4 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-[#f5c16c]"
                style={{ width: `${Math.min(achievementPercent, 100)}%` }}
              />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats.assignedAreas && stats.assignedAreas.length > 0 ? (
            stats.assignedAreas.map((area, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-4 rounded-xl border-2 border-[#7f2c2c]/20 shadow-md flex items-center gap-3"
              >
                <FaMapMarkerAlt className="text-[#7f2c2c] text-xl" />
                <span className="font-semibold text-lg">{area}</span>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-500">No areas assigned yet.</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#7f2c2c]/20 shadow-sm text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <FaCalendarAlt className="text-[#7f2c2c] text-2xl mx-auto mb-2" />
            <p className="text-sm text-gray-500">Target Month</p>
            <p className="font-bold">{formatMonth(stats.targetMonth)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#7f2c2c]/20 shadow-sm text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <FaMapMarkerAlt className="text-[#7f2c2c] text-2xl mx-auto mb-2" />
            <p className="text-sm text-gray-500">Bookers Served</p>
            <p className="font-bold">{stats.bookersServed || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#7f2c2c]/20 shadow-sm text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <FaClipboardList className="text-[#7f2c2c] text-2xl mx-auto mb-2" />
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="font-bold">{totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#7f2c2c]/20 shadow-sm text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <FaBullseye className="text-[#f5c16c] text-2xl mx-auto mb-2" />
            <p className="text-sm text-gray-500">{isTargetAchieved ? 'Extra Sales' : 'Remaining'}</p>
            <p className="font-bold">{isTargetAchieved ? extraSales : Math.max(0, target - achieved)}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // ----------------- Booker Dashboard -----------------
  if (user.role === "booker") {
    const target = stats.bookerTarget || 0;
    const achieved = stats.totalItems || 0;
    const totalOrders = stats.totalOrders || 0;
    const achievementPercent = stats.achievementPercent || 0;
    const isTargetAchieved = achievementPercent >= 100;
    const extraSales = isTargetAchieved ? Math.max(0, achieved - target) : 0;

    // Format month name
    const formatMonth = (monthStr) => {
      if (!monthStr) return "Current Month";
      const [year, month] = monthStr.split("-");
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleString("default", { month: "long", year: "numeric" });
    };

    return (
      <motion.div
        className="text-[#4b2e2e]"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-extrabold mb-2 tracking-wide">
          Welcome, <span className="text-[#7f2c2c]">{user.name}</span>
        </h2>
        <p className="text-gray-600 mb-2">Booker Dashboard</p>

        {/* Assigned Routes Display */}
        {user.routes && user.routes.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-[#7f2c2c] mb-2">
              <FaMapMarkerAlt />
              <span className="font-medium">Assigned Routes:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.routes.map((route, index) => (
                <span key={index} className="bg-[#7f2c2c] text-white px-3 py-1 rounded-full text-sm">
                  {route}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Target Achieved Banner */}
        {isTargetAchieved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-[#2a72aa] to-[#1f4f7a] text-white p-4 rounded-xl mb-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-3xl" />
                <div>
                  <p className="font-bold text-lg">Target Achieved!</p>
                  <p className="text-sm opacity-90">Congratulations! You have reached your monthly target.</p>
                </div>
              </div>
              {extraSales > 0 && (
                <div className="text-right">
                  <p className="text-2xl font-bold">+{extraSales} units</p>
                  <p className="text-sm opacity-90">Extra Sales</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Target Card - Main Focus */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-8 mb-8 shadow-xl bg-gradient-to-br from-[#7f2c2c] to-[#5a1f1f] text-white"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Target Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FaBullseye className="text-3xl text-[#f5c16c]" />
                <h3 className="text-2xl font-bold">Monthly Order Target</h3>
              </div>
              <p className="text-[#f5c16c] text-lg mb-4">
                Target for {formatMonth(stats.targetMonth)}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{target}</span>
                <span className="text-xl opacity-80">units</span>
              </div>
            </div>

            {/* Progress Circle */}
            <div className="w-48 h-48">
              <CircularProgressbar
                value={achievementPercent}
                text={`${Math.round(achievementPercent)}%`}
                styles={buildStyles({
                  textColor: "#fff",
                  pathColor: "#f5c16c",
                  trailColor: "rgba(255,255,255,0.2)",
                  textSize: "20px",
                })}
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{achieved} / {target} units</span>
            </div>
            <div className="h-4 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f5c16c] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(achievementPercent, 100)}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#7f2c2c]/20 shadow-sm text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <FaCalendarAlt className="text-[#7f2c2c] text-2xl mx-auto mb-2" />
            <p className="text-sm text-gray-500">Target Month</p>
            <p className="font-bold">{formatMonth(stats.targetMonth)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#7f2c2c]/20 shadow-sm text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <FaShoppingCart className="text-[#7f2c2c] text-2xl mx-auto mb-2" />
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="font-bold">{totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#7f2c2c]/20 shadow-sm text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <FaCheckCircle className="text-[#7f2c2c] text-2xl mx-auto mb-2" />
            <p className="text-sm text-gray-500">Completed</p>
            <p className="font-bold">{achieved}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#7f2c2c]/20 shadow-sm text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            {isTargetAchieved ? (
              <>
                <FaStar className="text-[#f5c16c] text-2xl mx-auto mb-2" />
                <p className="text-sm text-gray-500">Extra Sales</p>
                <p className="font-bold">{extraSales}</p>
              </>
            ) : (
              <>
                <FaBullseye className="text-[#f5c16c] text-2xl mx-auto mb-2" />
                <p className="text-sm text-gray-500">Remaining</p>
                <p className="font-bold">{Math.max(0, target - achieved)}</p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ----------------- Original Dashboard for Sole & Distributor -----------------
  const widgetsConfig = {
    sole: [
      {
        title: "Stock Items",
        value: stats.totalStock ?? 0,
        icon: <FaBoxOpen className="text-[#7f2c2c]" />,
      },
      {
        title: "Remaining Stock",
        value: stats.remainingStock ?? 0,
        icon: <FaBoxOpen className="text-[#f9a88e]" />,
      },
      {
        title: "Total Distributors",
        value: stats.distributors ?? 0,
        icon: <FaUsers className="text-[#7f2c2c]" />,
      },
      {
        title: "Pending Orders",
        value: stats.pendingOrders ?? 0,
        icon: <FaClipboardList className="text-[#7f2c2c]" />,
      },
    ],
    distributer: [
      {
        title: "Pending Orders",
        value: stats.myPendingOrders ?? 0,
        icon: <FaClipboardList className="text-amber-600" />,
        bg: "bg-amber-50",
        border: "border-amber-200"
      },
      {
        title: "Completed Orders",
        value: stats.myCompletedOrders ?? 0,
        icon: <FaCheckCircle className="text-green-600" />,
        bg: "bg-green-50",
        border: "border-green-200"
      },
      {
        title: "Available Stock Items",
        value: stats.visibleStock?.length ?? 0,
        icon: <FaBoxOpen className="text-blue-600" />,
        bg: "bg-blue-50",
        border: "border-blue-200"
      },
      {
        title: "Total Sales",
        value: `Rs. ${(stats.salesTotal || 0).toLocaleString()}`,
        icon: <FaDollarSign className="text-purple-600" />,
        bg: "bg-purple-50",
        border: "border-purple-200"
      },
    ],
  };
  const cards = widgetsConfig[user.role] || [];

  const COLORS = ["#7f2c2c", "#f5c16c", "#633030", "#c96b4f", "#f9a88e"];
  const stockChartData =
    stats.stockDetails?.map((s) => ({
      name: s.itemName,
      qty: s.availableQty,
    })) || [];

  const totalSales = stats.salesTotal || 0;
  const totalProfit = stats.totalProfit || 0;

  // For sole - use enhanced dashboard
  if (user.role === "sole") {
    const totalSales = stats.salesTotal || 0;
    const totalProfit = stats.totalProfit || 0;
    const completedOrders = stats.completedOrders ?? 0;
    const pendingOrders = stats.pendingOrders ?? 0;
    const totalStockItems = stats.totalStock ?? 0;
    const remainingStock = stats.remainingStock ?? 0;
    const distributorsCount = stats.distributors ?? 0;
    const salesProfitData = [
      { metric: "Sales", value: totalSales },
      { metric: "Profit", value: totalProfit },
    ];
    const stockPieData = (stats.stockDetails || []).slice(0, 5).map((stock) => ({
      name: stock.itemName,
      value: Number(stock.availableQty) || 0,
    }));

    return (
      <motion.div
        className="text-[#4b2e2e]"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h2 className="text-4xl font-extrabold tracking-wide text-[#4b2e2e]">
              Welcome back, <span className="text-[#7f2c2c]">{user.name}</span>
            </h2>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-3">
            <p className="text-sm text-gray-500">
              {lastUpdated ? `Updated at ${lastUpdated.toLocaleTimeString()}` : "Loading latest numbers..."}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-md border border-[#d4a017]/20"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-[0.15em]">Total Sales</p>
                <p className="text-xl font-bold text-[#d4a017] mt-2">Rs. {totalSales > 0 ? (totalSales / 100000).toFixed(1) + "L" : "0"}</p>
              </div>
              <div className="bg-[#d4a017]/10 rounded-xl p-2">
                <FaDollarSign className="text-xl text-[#d4a017]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 shadow-md border border-green-100"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-[0.15em]">Total Profit</p>
                <p className="text-xl font-bold text-green-600 mt-2">Rs. {totalProfit > 0 ? (totalProfit / 100000).toFixed(1) + "L" : "0"}</p>
              </div>
              <div className="bg-green-100 rounded-xl p-2">
                <FaChartLine className="text-xl text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-5 shadow-md border border-blue-100"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-[0.15em]">Distributors</p>
                <p className="text-xl font-bold text-[#7f2c2c] mt-2">{distributorsCount}</p>
              </div>
              <div className="bg-blue-100 rounded-xl p-2">
                <FaUsers className="text-xl text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-5 shadow-md border border-purple-100"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-[0.15em]">Stock Items</p>
                <p className="text-xl font-bold text-[#7f2c2c] mt-2">{totalStockItems}</p>
              </div>
              <div className="bg-purple-100 rounded-xl p-2">
                <FaBoxOpen className="text-xl text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales vs Profit Bar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-[#4b2e2e]">Sales vs Profit</h3>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesProfitData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="metric" stroke="#7f2c2c" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis tickFormatter={(value) => `Rs.${(value / 1000).toFixed(0)}K`} stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, "Amount"]}
                    contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={55}>
                    <Cell fill="#d4a017" />
                    <Cell fill="#16a34a" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#d4a017]" />
                <span className="text-sm text-gray-600 font-medium">Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#16a34a]" />
                <span className="text-sm text-gray-600 font-medium">Profit</span>
              </div>
            </div>
          </motion.div>

          {/* Stock Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-3xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-[#4b2e2e]">Stock Distribution</h3>
            </div>
            {stockPieData.length > 0 ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockPieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={70}
                      innerRadius={35}
                      paddingAngle={3}
                      label
                    >
                      {stockPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} packs`, "Qty"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No stock breakdown available.</p>
            )}
          </motion.div>
        </div>

        {/* Recent Sales Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-3xl p-6 shadow-lg mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#4b2e2e]">Recent Sales</h3>
              <p className="text-sm text-gray-500">Latest sales and profit details.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#7f2c2c]/10 text-[#4b2e2e]">
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold text-right">Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {(stats.paymentDetails || []).slice(0, 6).map((payment, index) => (
                  <tr key={index} className="border-b border-[#f3eded] hover:bg-[#faf5f4]">
                    <td className="px-4 py-4 font-medium text-[#4b2e2e]">{payment.itemName}</td>
                    <td className="px-4 py-4 text-right">{payment.quantity}</td>
                    <td className="px-4 py-4 text-right">Rs. {Number(payment.totalAmount || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-right text-green-600 font-semibold">Rs. {Number(payment.profit || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(stats.paymentDetails || []).length === 0 && (
              <p className="text-center text-gray-400 py-8">No recent sales data available.</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // For distributor - use enhanced dashboard
  if (user.role === "distributer") {
    const pendingOrders = stats.myPendingOrders ?? 0;
    const completedOrders = stats.myCompletedOrders ?? 0;
    const totalOrders = pendingOrders + completedOrders;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
    const totalStockPacks = Math.round((stats.remainingStock ?? stats.totalStock ?? (stats.stockDetails?.reduce((sum, item) => sum + (Number(item.availableQty) || 0), 0) || 0)) * 10) / 10;
    const totalStockItems = stats.stockDetails?.length ?? 0;
    const foCount = stats.bookers ?? stats.distributors ?? stats.bookersServed ?? 0;
    const salesProfitData = [
      { metric: "Sales", value: totalSales },
      { metric: "Profit", value: totalProfit },
    ];
    const stockPieData = (stats.stockDetails || []).slice(0, 5).map((stock) => ({
      name: stock.itemName,
      value: Number(stock.availableQty) || 0,
    }));

    return (
      <motion.div
        className="text-[#4b2e2e]"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h2 className="text-4xl font-extrabold tracking-wide text-[#4b2e2e]">
              Welcome back, <span className="text-[#7f2c2c]">{user.name}</span>
            </h2>
           
          </div>

          <div className="flex flex-col items-start sm:items-end gap-3">
            <p className="text-sm text-gray-500">
              {lastUpdated ? `Updated at ${lastUpdated.toLocaleTimeString()}` : "Loading latest numbers..."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 shadow-lg border border-[#7f2c2c]/10"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-[0.18em]">Sales</p>
                <p className="text-2xl font-bold text-[#7f2c2c] mt-3">Rs. {totalSales > 0 ? (totalSales / 100000).toFixed(1) + "L" : "0"}</p>
              </div>
              <div className="bg-[#7f2c2c]/10 rounded-2xl p-3">
                <FaDollarSign className="text-2xl text-[#7f2c2c]" />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">Total sales from orders</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-lg border border-[#f5c16c]/20"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-[0.18em]">Profit</p>
                <p className="text-2xl font-bold text-[#7f2c2c] mt-3">Rs. {totalProfit > 0 ? (totalProfit / 100000).toFixed(1) + "L" : "0"}</p>
              </div>
              <div className="bg-[#f5c16c]/20 rounded-2xl p-3">
                <FaChartLine className="text-2xl text-[#c98c3a]" />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">Profit earned from sales</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6 shadow-lg border border-green-100"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-[0.18em]">Active FOs</p>
                <p className="text-2xl font-bold text-[#7f2c2c] mt-3">{foCount}</p>
              </div>
              <div className="bg-green-100 rounded-2xl p-3">
                <FaUsers className="text-2xl text-green-700" />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">Field officers in your network</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl p-6 shadow-lg border border-blue-100"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-[0.18em]">Stock Packs</p>
                <p className="text-2xl font-bold text-[#7f2c2c] mt-3">{totalStockPacks.toLocaleString('en-US', { maximumFractionDigits: 1 })}</p>
              </div>
              <div className="bg-blue-100 rounded-2xl p-3">
                <FaBoxOpen className="text-2xl text-blue-600" />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">Total available pack inventory</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-[#4b2e2e]">Sales vs Profit</h3>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesProfitData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="metric" stroke="#7f2c2c" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis tickFormatter={(value) => `Rs.${(value / 1000).toFixed(0)}K`} stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, "Amount"]}
                    contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={55}>
                    <Cell fill="#d4a017" />
                    <Cell fill="#16a34a" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#d4a017]" />
                <span className="text-sm text-gray-600 font-medium">Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#16a34a]" />
                <span className="text-sm text-gray-600 font-medium">Profit</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-3xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-[#4b2e2e]">Stock Distribution</h3>
            </div>
            {stockPieData.length > 0 ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockPieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={70}
                      innerRadius={35}
                      paddingAngle={3}
                      label
                    >
                      {stockPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} packs`, "Qty"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No stock breakdown available.</p>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-3xl p-6 shadow-lg mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#4b2e2e]">Recent Sales</h3>
              <p className="text-sm text-gray-500">Latest distributor payments and profit details.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#7f2c2c]/10 text-[#4b2e2e]">
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold text-right">Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {(stats.paymentDetails || []).slice(0, 6).map((payment, index) => (
                  <tr key={index} className="border-b border-[#f3eded] hover:bg-[#faf5f4]">
                    <td className="px-4 py-4 font-medium text-[#4b2e2e]">{payment.itemName}</td>
                    <td className="px-4 py-4 text-right">{payment.quantity}</td>
                    <td className="px-4 py-4 text-right">Rs. {Number(payment.totalAmount || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-right text-[#2a7a2e]">Rs. {Number(payment.profit || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="text-[#4b2e2e]"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-4xl font-extrabold mb-6 tracking-wide">
        Welcome back,{" "}
        <span className="text-[#7f2c2c] drop-shadow-lg">{user.name}</span>
      </h2>

      {/* Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 bg-white rounded-2xl border border-[#f5c16c] shadow-md hover:shadow-lg transition-all flex items-center gap-4"
          >
            <div className="text-4xl">{card.icon}</div>
            <div>
              <h2 className="text-lg font-medium opacity-90">{card.title}</h2>
              <p className="text-2xl font-bold text-[#7f2c2c]">
                {card.value ?? 0}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 bg-white rounded-2xl border border-[#f5c16c] shadow-md flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-6 tracking-wide">
            Sales vs Profit
          </h2>
          <div className="flex gap-10 items-center">
            <div className="w-40 h-40">
              <CircularProgressbar
                value={totalSales ? 100 : 0}
                text={`Sales\n${totalSales.toLocaleString()}`}
                styles={buildStyles({
                  textColor: "#7f2c2c",
                  pathColor: "#7f2c2c",
                  trailColor: "#f0f0f0",
                  textSize: "12px",
                })}
              />
            </div>
            <div className="w-40 h-40">
              <CircularProgressbar
                value={totalProfit && totalSales ? Math.round((totalProfit / totalSales) * 100) : 0}
                text={`Profit\n${totalProfit.toLocaleString()}`}
                styles={buildStyles({
                  textColor: "#f5c16c",
                  pathColor: "#f5c16c",
                  trailColor: "#f0f0f0",
                  textSize: "12px",
                })}
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-[#f5c16c] shadow-md">
          <h2 className="text-xl font-semibold mb-4 tracking-wide">
           Available Stock
          </h2>
          {stockChartData.length ? (
            <PieChart width={300} height={300}>
              <Pie
                data={stockChartData}
                dataKey="qty"
                nameKey="name"
                outerRadius={80}
                innerRadius={30}
                paddingAngle={5}
                label
              >
                {stockChartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : (
            <p>No stock data available</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardHome;


