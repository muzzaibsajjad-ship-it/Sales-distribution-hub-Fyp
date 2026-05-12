import { useState, useEffect } from "react";
import {
  getSuppliersApi,
  createSupplierApi,
  updateSupplierApi,
  toggleSupplierStatusApi,
} from "../api/api";
import { toast } from "react-toastify";
import {
  FaUserPlus,
  FaSave,
FaEdit,
  FaToggleOn,
  FaToggleOff,
  FaBuilding,
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaUser,
} from "react-icons/fa";

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    companyName: "",
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    const res = await getSuppliersApi();
    if (res.success) {
      setSuppliers(res.data || []);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm({ name: "", phone: "", address: "", email: "", companyName: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    setLoading(true);
    let res;
    if (editingId) {
      res = await updateSupplierApi(editingId, form);
    } else {
      res = await createSupplierApi(form);
    }

    if (res.success) {
      toast.success(editingId ? "Supplier updated!" : "Supplier added!");
      resetForm();
      fetchSuppliers();
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  const handleEdit = (supplier) => {
    setForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      email: supplier.email || "",
      companyName: supplier.companyName || "",
    });
    setEditingId(supplier._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggle = async (id) => {
    const res = await toggleSupplierStatusApi(id);
    if (res.success) {
      toast.success(res.message);
      fetchSuppliers();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="text-[#4b2e2e] min-h-screen bg-[#E8F0F8] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wide">
          Suppliers
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-[#7f2c2c] text-[#fff1d0] px-4 py-2 font-semibold hover:bg-[#6a241f] transition-all"
        >
          <FaUserPlus />
          {showForm ? "Close Form" : "Add Supplier"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 border-2 border-[#7f2c2c] mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="flex flex-col">
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <FaUser className="text-[#7f2c2c]" /> Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="p-3 border-[3px] border-[#7f2c2c] bg-transparent outline-none"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <FaBuilding className="text-[#7f2c2c]" /> Company Name
            </label>
            <input
              type="text"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              className="p-3 border-[3px] border-[#7f2c2c] bg-transparent outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <FaPhone className="text-[#7f2c2c]" /> Phone
            </label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="p-3 border-[3px] border-[#7f2c2c] bg-transparent outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <FaEnvelope className="text-[#7f2c2c]" /> Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="p-3 border-[3px] border-[#7f2c2c] bg-transparent outline-none"
            />
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <FaMapMarkerAlt className="text-[#7f2c2c]" /> Address
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="p-3 border-[3px] border-[#7f2c2c] bg-transparent outline-none"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#7f2c2c] text-[#fff1d0] px-6 py-2 font-semibold hover:bg-[#6a241f] transition-all"
            >
              <FaSave />
              {loading
                ? "Saving..."
                : editingId
                ? "Update Supplier"
                : "Save Supplier"}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading && suppliers.length === 0 ? (
        <p className="text-center py-10">Loading suppliers...</p>
      ) : suppliers.length === 0 ? (
        <p className="text-center py-10 text-gray-500">
          No suppliers found. Add your first supplier above.
        </p>
      ) : (
        <div className="overflow-x-auto border-2 border-[#7f2c2c] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#7f2c2c] text-[#fff1d0]">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Address</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr
                  key={s._id}
                  className={`border-t border-[#7f2c2c] ${
                    !s.isActive ? "bg-gray-100 text-gray-500" : ""
                  }`}
                >
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3">{s.companyName || "-"}</td>
                  <td className="p-3">{s.phone || "-"}</td>
                  <td className="p-3">{s.email || "-"}</td>
                  <td className="p-3">{s.address || "-"}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-bold ${
                        s.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleEdit(s)}
                        className="text-[#2a72aa] hover:text-[#1f4f7a] transition"
                        title="Edit"
                      >
<FaEdit className="text-[#7f2c2c]" />
                      </button>
                      <button
                        onClick={() => handleToggle(s._id)}
                        className={`transition ${
                          s.isActive
                            ? "text-green-600 hover:text-green-800"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                        title={s.isActive ? "Deactivate" : "Activate"}
                      >
                        {s.isActive ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SupplierList;

