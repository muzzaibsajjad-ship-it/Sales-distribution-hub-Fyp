import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getVisibilityMatrixApi, toggleVisibilityApi } from "../api/api";

const ItemVisibility = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [visibility, setVisibility] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getVisibilityMatrixApi();
      if (res.success) {
        setStocks(res.data.stocks || []);
        setDistributors(res.data.distributors || []);
        setVisibility(res.data.visibility || []);
      } else {
        setError(res.message);
      }
    } catch (err) {
      console.error("Failed to load visibility data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const checkVisible = (stockId, distributorId) =>
    visibility.some(
      (v) =>
        v.stockId?.toString() === stockId.toString() &&
        v.distributorId?.toString() === distributorId.toString() &&
        v.visible
    );

  const toggle = async (stockId, distributorId) => {
    try {
      setVisibility((prev) => {
        const index = prev.findIndex(
          (v) =>
            v.stockId?.toString() === stockId.toString() &&
            v.distributorId?.toString() === distributorId.toString()
        );

        if (index !== -1) {
          const updated = [...prev];
          updated[index].visible = !updated[index].visible;
          return updated;
        } else {
          return [
            ...prev,
            { stockId, distributorId, visible: true, _id: Date.now() },
          ];
        }
      });

      const res = await toggleVisibilityApi(stockId, distributorId);
      if (!res.success) loadData();
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
      loadData();
    }
  };

  if (loading)
    return <div className="p-6 text-[#4b2e2e] font-medium">Loading...</div>;
  if (error)
    return <div className="p-6 text-red-500 font-semibold">{error}</div>;
  if (!stocks.length || !distributors.length)
    return (
      <div className="p-6 text-[#4b2e2e] font-medium">
        No stocks or distributors available.
      </div>
    );

  return (
    <div className="p-6 bg-[#E8F0F8] text-[#4b2e2e] min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Item Visibility</h1>

      <div className="overflow-x-auto">
        <table className="w-full border border-[#7f2c2c]">
          <thead>
            <tr className="bg-[#7f2c2c]/20 text-[#4b2e2e]">
              <th className="p-3 border border-[#7f2c2c] text-left">Item</th>
              {distributors.map((d) => (
                <th
                  key={d._id}
                  className="p-3 border border-[#7f2c2c] text-center"
                >
                  {d.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr
                key={stock._id}
                className="hover:bg-[#7f2c2c]/10 transition-all"
              >
                <td className="p-3 border border-[#7f2c2c]">
                  {stock.itemName}
                </td>
                {distributors.map((d) => (
                  <td
                    key={d._id}
                    className="p-3 border border-[#7f2c2c] text-center"
                  >
                    <input
                      type="checkbox"
                      checked={checkVisible(stock._id, d._id)}
                      onChange={() => toggle(stock._id, d._id)}
                      className="w-5 h-5 accent-[#7f2c2c]"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemVisibility;
