import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import DashboardRoutes from "./DashboardRoutes";
import { useState } from "react";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#E8F0F8] text-sm md:text-base lg:text-lg">

      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[9999] flex">

          {/* ONLY visual overlay (NO click close) */}
          <div className="absolute inset-0 bg-black/40 z-10" />

          {/* Sidebar (ensure it's above the overlay and navbar) */}
          <div className="relative z-20 h-full w-64 sm:w-72 pointer-events-auto">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">

        <Navbar
          onToggleSidebar={() => setSidebarOpen(true)}
          sidebarOpen={sidebarOpen}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 overflow-auto p-4 md:p-8"
        >
          <DashboardRoutes />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;