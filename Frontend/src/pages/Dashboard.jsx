import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import DashboardRoutes from "./DashboardRoutes";

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-[#E8F0F8]">
      {/* Sidebar fixed to full height */}
      <div className="h-screen flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky navbar */}
        <Navbar />

        {/* Scrollable content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 overflow-auto p-8"
        >
          <DashboardRoutes />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
