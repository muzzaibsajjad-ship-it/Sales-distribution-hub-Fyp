import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getStockHistoryApi } from "../api/api";
import { motion } from "framer-motion";

const DistributorStockHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await getStockHistoryApi();
      if (res.data.success) setHistory(res.data.history);
      else setHistory([]);
    } catch (err) {
      toast.error("Failed to fetch purchase history");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading)
    return (
      <p className="text-[#4b2e2e] font-medium text-center py-10">
        Loading stock history...
      </p>
    );

  if (history.length === 0)
    return (
      <p className="text-[#4b2e2e] font-medium text-center py-10">
        No purchase history found
      </p>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-x-auto p-6 bg-[#E8F0F8] rounded-md"
    >
      <h3 className="text-xl font-semibold mb-4 text-[#4b2e2e]">
        Purchases from Sole
      </h3>
      <table className="w-full text-sm border border-[#7f2c2c] text-[#4b2e2e]">
        <thead className="bg-[#7f2c2c]/20">
          <tr>
            {[
              "Item Name",
              "Stock Type",
              "Purchase Price",
              "Quantity Purchased",
              "Total Value",
              "Purchase From",
              "Invoice",
              "Payment Proof",
              "Date",
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
          {history.map((h, idx) => (
            <tr
              key={idx}
              className="border-t border-[#7f2c2c] hover:bg-[#7f2c2c]/10 transition-all"
            >
              <td className="p-2">{h.itemName}</td>
              <td className="p-2">{h.stockType || "-"}</td>
              <td className="p-2">{h.sellingPrice || h.purchasePrice || 0}</td>
              <td className="p-2">{h.quantity || 0}</td>
              <td className="p-2">
                {(h.quantity || 0) * (h.sellingPrice || h.purchasePrice || 0)}
              </td>
              <td className="p-2">{h.soleName || "-"}</td>
              <td className="p-2">{h.invoiceNumber || "-"}</td>
              <td className="p-2">{h.paymentProof || "-"}</td>
              <td className="p-2">
                {h.date ? new Date(h.date).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

export default DistributorStockHistory;
