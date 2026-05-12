import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const ProfileForm = () => {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, password: "" });
  }, [user]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = user.token;
      const { data } = await axios.put(
        "http://localhost:5000/api/users/profile",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("✅ Profile updated successfully!");
      login(data);
      setForm({ ...form, password: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-[#E8F0F8] text-[#4b2e2e] shadow-lg rounded-none">
      <h3 className="text-2xl font-bold mb-6 uppercase tracking-wide">
        Update Profile
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col">
          <label className="mb-1 flex items-center gap-2">
            <FaUser className="text-[#7f2c2c]" /> Full Name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
            required
          />
        </div>

        {/* Email */}
        <div className="flex flex-col">
          <label className="mb-1 flex items-center gap-2">
            <FaEnvelope className="text-[#7f2c2c]" /> Email Address
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
            required
          />
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <label className="mb-1 flex items-center gap-2">
            <FaLock className="text-[#7f2c2c]" /> New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none pr-10"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`p-3 font-semibold text-[#fff1d0] bg-[#7f2c2c] hover:bg-[#5f1e1e] transition-all rounded-none ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Updating Profile..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
