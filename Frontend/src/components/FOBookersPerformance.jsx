import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaChartLine,
  FaMapMarkerAlt,
  FaRoute,
  FaShoppingCart,
  FaStar,
} from "react-icons/fa";
import { getFOBookersPerformanceApi } from "../api/api";

const formatMonth = (monthStr) => {
  if (!monthStr) return "Current Month";
  const [year, month] = monthStr.split("-");
  const date = new Date(year, Number(month) - 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
};

const FOBookersPerformance = () => {
  const [bookers, setBookers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = async () => {
    const res = await getFOBookersPerformanceApi();
    if (res.success) {
      setBookers(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPerformance();
    const intervalId = window.setInterval(fetchPerformance, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <p className="text-[#4b2e2e] font-medium text-center py-10">
        Loading bookers performance...
      </p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-[#E8F0F8] rounded-md text-[#4b2e2e]"
    >
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#4b2e2e]">
            Bookers Performance
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Live monthly target tracking with individual booker performance cards.
          </p>
        </div>
        <div className="bg-white border border-[#7f2c2c]/15 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
            Live Feed
          </p>
          <p className="text-2xl font-bold text-[#7f2c2c] mt-1">
            Auto refresh every 30 seconds
          </p>
        </div>
      </div>

      {bookers.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-[#7f2c2c]/15 shadow-sm">
          <FaChartLine className="text-5xl mx-auto text-[#7f2c2c]/30 mb-4" />
          <p className="text-lg font-semibold text-[#4b2e2e]">
            No bookers found for performance tracking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {bookers.map((booker, index) => {
            const cappedProgress = Math.min(booker.achievementPercent || 0, 100);
            const overflowWidth =
              (booker.achievementPercent || 0) > 100 && (booker.assignedTarget || 0) > 0
                ? Math.min(
                    (((booker.achievedUnits || 0) - (booker.assignedTarget || 0)) /
                      (booker.assignedTarget || 1)) *
                      100,
                    100
                  )
                : 0;

            return (
              <motion.div
                key={booker._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-3xl overflow-hidden shadow-lg border border-[#7f2c2c]/10"
              >
                <div className="bg-gradient-to-r from-[#7f2c2c] to-[#5f1e1e] px-6 py-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#f5c16c]">
                        Booker Performance
                      </p>
                      <h3 className="text-2xl font-bold mt-1">{booker.name}</h3>
                      <p className="text-sm text-white/80 mt-1">{booker.email}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        booker.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {booker.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="rounded-2xl bg-[#7f2c2c]/5 p-4">
                      <p className="text-xs text-gray-500">Assigned Target</p>
                      <p className="text-2xl font-bold text-[#7f2c2c] mt-1">
                        {booker.assignedTarget || 0}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#2a72aa]/5 p-4">
                      <p className="text-xs text-gray-500">Achieved Units</p>
                      <p className="text-2xl font-bold text-[#2a72aa] mt-1">
                        {booker.achievedUnits || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2 text-sm">
                      <span className="font-medium text-[#4b2e2e]">
                        {formatMonth(booker.targetMonth)}
                      </span>
                      <span className="font-semibold text-[#7f2c2c]">
                        {(booker.achievementPercent || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 bg-[#7f2c2c]/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7f2c2c] to-[#c96b4f] transition-all duration-700"
                        style={{ width: `${cappedProgress}%` }}
                      />
                    </div>
                    {booker.extraUnits > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-2 text-xs text-gray-500">
                          <span>Extra Orders Progress</span>
                          <span>+{booker.extraUnits} units</span>
                        </div>
                        <div className="h-2.5 bg-[#2a72aa]/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#2a72aa] to-[#5ba3db] transition-all duration-700"
                            style={{ width: `${overflowWidth}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <FaShoppingCart />
                        <span>Orders</span>
                      </div>
                      <p className="text-xl font-bold text-[#4b2e2e]">
                        {booker.orderCount || 0}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <FaStar />
                        <span>
                          {booker.extraUnits > 0 ? "Extra Units" : "Remaining"}
                        </span>
                      </div>
                      <p className="text-xl font-bold text-[#4b2e2e]">
                        {booker.extraUnits > 0
                          ? booker.extraUnits
                          : booker.remainingUnits}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {booker.assignedArea && (
                      <span className="inline-flex items-center gap-2 bg-[#7f2c2c]/10 text-[#7f2c2c] px-3 py-1.5 rounded-full text-xs font-medium">
                        <FaMapMarkerAlt />
                        {booker.assignedArea}
                      </span>
                    )}
                    {booker.routes?.slice(0, 3).map((route) => (
                      <span
                        key={`${booker._id}-${route}`}
                        className="inline-flex items-center gap-2 bg-[#2a72aa]/10 text-[#2a72aa] px-3 py-1.5 rounded-full text-xs font-medium"
                      >
                        <FaRoute />
                        {route}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default FOBookersPerformance;
