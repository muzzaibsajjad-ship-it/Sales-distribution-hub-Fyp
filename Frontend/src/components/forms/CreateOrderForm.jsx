import { useEffect, useState } from "react";
import API from "../../api/api";
import { toast } from "react-toastify";
import {
  FaBoxOpen,
  FaSortNumericDown,
  FaDollarSign,
  FaMoneyBillWave,
} from "react-icons/fa";

const CreateOrderForm = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await API.get("/orders/items");
        setItems(res.data.visibleStocks || []);
      } catch (err) {
        toast.error("Failed to fetch items");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const selectedStock = items.find((item) => item._id === selectedItem);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return toast.error("Please select an item");

    try {
      await API.post("/orders/create", {
        itemId: selectedItem,
        quantity: parseInt(quantity),
        paymentMethod,
      });
      toast.success("Order placed successfully!");
      setSelectedItem("");
      setQuantity(1);
      setPaymentMethod("cash");
    } catch (err) {
      toast.error("Failed to place order");
    }
  };

  if (loading)
    return (
      <p className="text-[#4b2e2e] text-center py-10 font-medium">
        Loading available items...
      </p>
    );

  if (items.length === 0)
    return (
      <p className="text-[#4b2e2e] text-center py-10 font-medium">
        No items available for order
      </p>
    );

  return (
    <div className="max-h-screen bg-[#E8F0F8] flex justify-center items-start">
      <div className="w-full max-w-3xl p-3 text-[#4b2e2e]">
        <h3 className="text-2xl font-bold mb-3 uppercase tracking-wide">
          Place Order
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Row 1: Item Selection */}
          <div className="flex flex-col">
            <label className="mb-1 flex items-center gap-2">
              <FaBoxOpen className="text-[#7f2c2c]" /> Item
            </label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="p-3 border-2 border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
              required
            >
              <option value="">Select Item</option>
              {items.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.itemName} ({item.stockType || "No Type"} - {item.unitsPerPack || 1} units)
                </option>
              ))}
            </select>
            {selectedStock && (
              <p className="mt-2 text-sm text-[#7f2c2c] font-medium">
                Stock Type: {selectedStock.stockType || "No Type"} | {selectedStock.unitsPerPack || 1} units per {String(selectedStock.stockType || "pack").toLowerCase()}
              </p>
            )}
          </div>

          {/* Row 2: Quantity + Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 flex items-center gap-2">
                <FaSortNumericDown className="text-[#7f2c2c]" /> Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="p-3 border-2 border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 flex items-center gap-2">
                <FaMoneyBillWave className="text-[#7f2c2c]" /> Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="p-3 border-2 border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bank transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#7f2c2c] text-[#fff1d0] px-4 py-2 font-semibold hover:bg-[#6a241f] transition-all"
          >
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderForm;
