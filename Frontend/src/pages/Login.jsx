import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { loginApi } from "../api/api";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
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

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left Side - Login Form (Full Height like CreateUserForm) */}
      <div className="w-1/3 flex justify-center items-center p-6 bg-[#E8F0F8]">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full h-full p-6 bg-[#E8F0F8] text-[#4b2e2e] shadow-lg rounded-none flex flex-col justify-center gap-4"
        >
          <h2 className="text-3xl font-bold text-center text-[#4b2e2e] mb-6 tracking-wide uppercase">
            Login
          </h2>

          {/* Email */}
          <div className="flex flex-col">
            <label className="mb-1 flex items-center gap-2 text-[#4b2e2e]">
              <FaEnvelope /> Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none focus:ring-2 focus:ring-[#8b1c1c] transition"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label className="mb-1 flex items-center gap-2 text-[#4b2e2e]">
              <FaLock /> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none focus:ring-1 focus:ring-[#8b1c1c] transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f2c2c] hover:text-[#5f1e1e] transition"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`p-3 font-semibold text-[#fff1d0] bg-[#7f2c2c] hover:bg-[#5f1e1e] transition-all w-full rounded-none ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Authenticating..." : "Login"}
          </button>

          {/* Back to Home Page */}
          <div className="text-center mt-2">
            <Link to="/" className="text-[#7f2c2c] hover:text-[#5f1e1e] flex items-center justify-center gap-2 transition font-medium text-sm">
              <FaArrowLeft /> Back to Home Page
            </Link>
          </div>
        </motion.form>
      </div>

      {/* Right Side - Gradient Welcome */}
      <div className="w-2/3 flex items-center justify-center overflow-auto bg-gradient-to-br from-[#7f2c2c] via-[#4b2e2e] to-[#5f1e1e]">
        <h1 className="text-5xl font-bold text-white text-center">
          Welcome to Sales Hub
        </h1>
      </div>
    </div>
  );
};

export default Login;
