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
import {
  sanitizeDecimal,
  sanitizeNumberOnly,
  sanitizeTextOnly,
} from "../../utils/inputValidation";

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
  const [showCustomizeUnits, setShowCustomizeUnits] = useState(false);
  const [customUnitValues, setCustomUnitValues] = useState("8,10,12,14");

  useEffect(() => {
    const savedUnitValues = localStorage.getItem("add_stock_custom_unit_values");
    if (savedUnitValues && savedUnitValues.trim()) {
      setCustomUnitValues(savedUnitValues);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("add_stock_custom_unit_values", customUnitValues);
  }, [customUnitValues]);

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
      let nextValue = value;
      if (name === "itemName") nextValue = sanitizeTextOnly(value);
      if (name === "quantity") nextValue = sanitizeNumberOnly(value);
      if (name === "purchasePrice") nextValue = sanitizeDecimal(value);
      if (name === "unitsPerPack") nextValue = sanitizeNumberOnly(value);
      setForm({ ...form, [name]: nextValue });
    }
  };

  const unitsOptions = customUnitValues
    .split(",")
    .map((val) => sanitizeNumberOnly(val.trim()))
    .filter((val) => val !== "" && Number(val) > 0);

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
                pattern="[A-Za-z ]+"
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
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="flex items-center gap-2">
                  <FaSortNumericDown className="text-[#7f2c2c]" />
                  {form.stockType
                    ? `Quantity Per ${form.stockType}`
                    : "Quantity Per Pack"}
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomizeUnits(true)}
                  className="text-xs text-[#7f2c2c] underline hover:text-[#5f1e1e]"
                >
                  Customize
                </button>
              </div>
              <select
                name="unitsPerPack"
                value={form.unitsPerPack}
                onChange={handleChange}
                className="p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
                required
              >
                <option value="">Select Units</option>
                {unitsOptions.map((value) => (
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
                inputMode="numeric"
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
                inputMode="decimal"
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

      {showCustomizeUnits && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[#E8F0F8] w-full max-w-md p-4 border-[3px] border-[#7f2c2c]">
            <h4 className="text-lg font-bold text-[#4b2e2e] mb-2">
              Customize Unit Dropdown
            </h4>
            <p className="text-xs text-[#4b2e2e] mb-2">
              Enter comma-separated values, e.g. `8,10,12,14`
            </p>
            <input
              type="text"
              value={customUnitValues}
              onChange={(e) => setCustomUnitValues(e.target.value)}
              className="w-full p-3 border-[3px] border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none text-sm"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setShowCustomizeUnits(false)}
                className="px-4 py-2 bg-white border-[2px] border-[#7f2c2c] text-[#7f2c2c] font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddStockForm;

