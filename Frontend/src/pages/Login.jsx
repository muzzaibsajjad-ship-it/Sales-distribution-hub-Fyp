import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { loginApi } from "../api/api";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Login = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await loginApi(form);
    setLoading(false);

    if (res.success) {
      toast.success("✨ Login Successful!");
      login(res.data);
    } else {
      toast.error(res.message || "Invalid credentials ❌");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      {/* Top / Right Welcome Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full md:w-2/3 h-48 md:h-full flex items-center justify-center bg-gradient-to-br from-[#7f2c2c] via-[#4b2e2e] to-[#5f1e1e] order-1 md:order-2"
      >
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-5xl font-bold text-white text-center px-4"
        >
          Welcome to Sales Hub
        </motion.h1>
      </motion.div>

      {/* Form Section */}
      <div className="w-full md:w-1/3 flex justify-center items-center p-4 md:p-6 bg-[#E8F0F8] order-2 md:order-1">
        <motion.form
          onSubmit={handleSubmit}
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-md md:h-full p-6 bg-[#E8F0F8] text-[#4b2e2e] shadow-lg flex flex-col justify-center gap-4"
        >
          <motion.h2
            variants={item}
            className="text-2xl md:text-3xl font-bold text-center uppercase mb-4"
          >
            Login
          </motion.h2>

          {/* Email */}
          <motion.div variants={item} className="flex flex-col">
            <label className="mb-1 flex items-center gap-2">
              <FaEnvelope /> Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="p-3 border-[3px] border-[#7f2c2c] bg-transparent outline-none focus:ring-2 focus:ring-[#8b1c1c] transition"
            />
          </motion.div>

          {/* Password */}
          <motion.div variants={item} className="flex flex-col">
            <label className="mb-1 flex items-center gap-2">
              <FaLock /> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full p-3 border-[3px] border-[#7f2c2c] bg-transparent outline-none focus:ring-2 focus:ring-[#8b1c1c] transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f2c2c]"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.button
            variants={item}
            type="submit"
            disabled={loading}
            className={`p-3 font-semibold text-white bg-[#7f2c2c] hover:bg-[#5f1e1e] transition w-full ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Authenticating..." : "Login"}
          </motion.button>

          {/* Back */}
          <motion.div variants={item} className="text-center mt-2">
            <Link
              to="/"
              className="text-[#7f2c2c] hover:text-[#5f1e1e] flex items-center justify-center gap-2 text-sm"
            >
              <FaArrowLeft /> Back to Home Page
            </Link>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
};

export default Login;
