// components/StockHistoryList.jsx
import { useEffect, useState } from "react";
import { fetchHistory } from "../api/api";
import { motion } from "framer-motion";

const StockHistoryList = () => {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetchHistory();
      if (res.success) setHistories(res.data);
      else setHistories([]);
    } catch (err) {
      console.error(err);
      setHistories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (loading)
    return (
      <p className="text-[#4b2e2e] font-medium text-center py-10">
        Loading stock history...
      </p>
    );

  if (histories.length === 0)
    return (
      <p className="text-[#4b2e2e] font-medium text-center py-10">
        No history found
      </p>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-x-auto p-6 bg-[#E8F0F8] rounded-md"
    >
      <h3 className="text-xl font-semibold mb-4 text-[#4b2e2e]">
        Stock History
      </h3>
      <table className="w-full text-sm border border-[#7f2c2c] text-[#4b2e2e]">
        <thead className="bg-[#7f2c2c]/20">
          <tr>
            {[
              "Item Name",
              "Type",
              "Quantity",
              "Original Stock Added",
              "Price",
              "Total Value",
              "Supplier",
              "Date",
              "Invoice",
            ].map((h) => (
              <th
                key={h}
                className="p-2 border border-[#7f2c2c] text-left font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {histories.map((h) => (
            <tr
              key={h._id}
              className="border-t border-[#7f2c2c] hover:bg-[#7f2c2c]/10 transition-all"
            >
              <td className="p-2">{h.itemName}</td>
              <td className="p-2">{h.stockType || "-"}</td>
              <td className="p-2">{h.quantity}</td>
              <td className="p-2">{h.originalStockAdded || 0}</td>
              <td className="p-2">{h.purchasePrice || 0}</td>
              <td className="p-2">{h.totalValue || 0}</td>
              <td className="p-2">{h.supplierName || "-"}</td>
              <td className="p-2">
                {h.date ? new Date(h.date).toLocaleDateString() : "-"}
              </td>
              <td className="p-2">{h.invoiceNumber || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

export default StockHistoryList;
