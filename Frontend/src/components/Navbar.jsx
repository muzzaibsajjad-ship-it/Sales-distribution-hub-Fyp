import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaCog, FaSignOutAlt } from "react-icons/fa";

const Navbar = () => {
  const { logout, user } = useAuth();

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 p-4 flex justify-end items-center border-b-2 border-[#7f2c2c] bg-transparent"
    >
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-[#4b2e2e]">
          {user?.name} ({user?.role})
        </span>
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
