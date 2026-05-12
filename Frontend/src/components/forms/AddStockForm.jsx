import { useState, useEffect } from "react";
import { addStockApi, getSuppliersApi } from "../../api/api";
import { toast } from "react-toastify";
import {
  FaBoxOpen,
  FaLayerGroup,
  FaSortNumericDown,
  FaDollarSign,
  FaUser,
} from "react-icons/fa";

const AddStockForm = () => {
  const [form, setForm] = useState({
    itemName: "",
    stockType: "",
    unitsPerPack: "",
    quantity: "",
    purchasePrice: "",
    supplierName: "",
    originalStockAdded: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [suppliers, setSuppliers] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qty = parseFloat(form.quantity) || 0;
    const price = parseFloat(form.purchasePrice) || 0;
    setTotalValue(qty * price);
  }, [form.quantity, form.purchasePrice]);

  useEffect(() => {
    const loadSuppliers = async () => {
      const res = await getSuppliersApi();
      if (res.success) {
        setSuppliers(res.data?.filter((s) => s.isActive) || []);
      }
    };
    loadSuppliers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "supplierName") {
      const selected = suppliers.find((s) => s.name === value);
      setForm({
        ...form,
        supplierName: selected ? selected.name : value,
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await addStockApi(form);
    if (res.success) {
      toast.success("🎉 Stock added successfully!");
      setForm({
        itemName: "",
        stockType: "",
        unitsPerPack: "",
        quantity: "",
        purchasePrice: "",
        supplierName: "",
        date: new Date().toISOString().split("T")[0],
      });
      setTotalValue(0);
    } else {
      toast.error(`❌ ${res.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-h-screen bg-[#E8F0F8] flex justify-center items-start">
      <div className="w-full max-w-3xl p-3 text-[#4b2e2e]">
        <h3 className="text-2xl font-bold mb-3 uppercase tracking-wide">
          Add New Stock
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Row 1: Item Name + Stock Type + Units Per Pack */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 flex items-center gap-2">
                <FaBoxOpen className="text-[#7f2c2c]" /> Item Name
              </label>
              <input
                type="text"
                name="itemName"
                value={form.itemName}
                onChange={handleChange}
                className="p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 flex items-center gap-2">
                <FaLayerGroup className="text-[#7f2c2c]" /> Stock Type
              </label>
              <select
                name="stockType"
                value={form.stockType}
                onChange={handleChange}
                className="p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
                required
              >
                <option value="">Select Type</option>
                <option value="Carton">Carton</option>
                <option value="Packet">Packet</option>
                <option value="Box">Box</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 flex items-center gap-2">
                <FaSortNumericDown className="text-[#7f2c2c]" />
                {form.stockType
                  ? `Quantity Per ${form.stockType}`
                  : "Quantity Per Pack"}
              </label>
              <select
                name="unitsPerPack"
                value={form.unitsPerPack}
                onChange={handleChange}
                className="p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
                required
              >
                <option value="">Select Units</option>
                {[8, 10, 12, 14].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Quantity + Purchase Price + Total Value */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 flex items-center gap-2">
                <FaSortNumericDown className="text-[#7f2c2c]" /> Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                className="p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 flex items-center gap-2">
                <FaDollarSign className="text-[#7f2c2c]" /> Purchase Price
              </label>
              <input
                type="number"
                name="purchasePrice"
                value={form.purchasePrice}
                onChange={handleChange}
                className="p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 flex items-center gap-2">
                <FaDollarSign className="text-[#7f2c2c]" /> Total Value
              </label>
              <input
                type="number"
                value={totalValue}
                readOnly
                className="p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
              />
            </div>
          </div>

          {/* Row 3: Supplier Name + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 flex items-center gap-2">
                <FaUser className="text-[#7f2c2c]" /> Supplier Name
              </label>
              <select
                name="supplierName"
                value={form.supplierName}
                onChange={handleChange}
                className="p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name} {s.companyName ? `(${s.companyName})` : ""}
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  No active suppliers found. Please add suppliers first.
                </p>
              )}
            </div>

            <div className="flex flex-col">
              <label className="mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`bg-[#7f2c2c] text-[#fff1d0] px-4 py-2 font-semibold hover:bg-[#6a241f] transition-all`}
          >
            {loading ? "Adding Stock..." : "Add Stock"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddStockForm;

