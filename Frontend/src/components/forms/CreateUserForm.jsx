import { useState } from "react";
import { createUserApi } from "../../api/api";
import { toast } from "react-toastify";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { sanitizeTextOnly } from "../../utils/inputValidation";

const CreateUserForm = ({ currentRole }) => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "name" ? sanitizeTextOnly(value) : value;
    setForm({ ...form, [name]: nextValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await createUserApi(form);
    if (res.success) {
      toast.success(`🎉 Created ${res.data.role}: ${res.data.name}`);
      setForm({ name: "", email: "", password: "" });
    } else {
      toast.error(`❌ ${res.message}`);
    }
    setLoading(false);
  };

  const roleMap = {
    sole: "Distributer",
    distributer: "FO",
    FO: "Booker",
    booker: null,
  };
  const canCreate = roleMap[currentRole];
  if (!canCreate)
    return (
      <p className="text-red-500 text-lg font-semibold">
        You cannot create users
      </p>
    );

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-[#E8F0F8] text-[#4b2e2e] shadow-lg rounded-none">
      <h3 className="text-2xl font-bold mb-6 uppercase tracking-wide">
        Create {canCreate}
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
            pattern="[A-Za-z ]+"
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
            <FaLock className="text-[#7f2c2c]" /> Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              pattern="(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}"
              title="Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character."
              className="w-full p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none pr-10"
              required
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
          {loading ? `Creating ${canCreate}...` : `Create ${canCreate}`}
        </button>
      </form>
    </div>
  );
};

export default CreateUserForm;
