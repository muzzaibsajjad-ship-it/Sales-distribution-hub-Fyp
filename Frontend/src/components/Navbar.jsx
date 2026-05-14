import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaCog, FaSignOutAlt, FaBars } from "react-icons/fa";

const Navbar = ({ onToggleSidebar, sidebarOpen }) => {
  const { logout, user } = useAuth();

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 p-4 flex justify-between items-center border-b-2 border-[#7f2c2c] bg-transparent"
    >
      <div className="flex items-center gap-4">
        {/* Mobile sidebar toggle - hide when sidebar is open (use overlay close instead) */}
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden inline-flex items-center justify-center text-[#7f2c2c] hover:text-[#4b2e2e] transition-all text-2xl p-1 mr-2"
            aria-label="Toggle sidebar"
          >
            <FaBars />
          </button>
        )}

        <span className="hidden md:inline-block text-sm font-medium text-[#4b2e2e]">
          {user?.name} ({user?.role})
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/dashboard/profile"
          title="Edit Profile"
          aria-label="Edit Profile"
          className="inline-flex items-center justify-center text-[#7f2c2c] hover:text-[#4b2e2e] transition-all text-xl"
        >
          <FaCog />
        </Link>
        <button
          onClick={logout}
          title="Logout"
          aria-label="Logout"
          className="inline-flex items-center justify-center text-[#7f2c2c] hover:text-[#4b2e2e] transition-all text-xl mr-6"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </motion.div>
  );
};

export default Navbar;
