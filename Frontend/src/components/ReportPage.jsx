import { useEffect, useState } from "react";
import { fetchReports } from "../api/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ReportPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      const res = await fetchReports();
      if (res.success) setReport(res.data);
      setLoading(false);
    };
    loadReport();
  }, []);

  if (loading)
    return (
      <p className="text-[#4b2e2e] text-center py-10">Loading report...</p>
    );
  if (!report)
    return (
      <p className="text-[#4b2e2e] text-center py-10">
        No report data available
      </p>
    );

  // ================= PDF Export =================
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

    doc.setFontSize(18);
    doc.text("Reports Dashboard", 40, 40);

    let summaryY = 60;
    const summaries = [
      `Total Stock Added: ${report.totalStock}`,
      `Total Sold Qty: ${report.totalSoldQty || 0}`,
      `Remaining Stock: ${report.remainingStock}`,
      `Total Purchase Amount: ${report.totalPurchase}`,
      `Total Sales Amount: ${report.totalSales}`,
      `Generated Profit: ${report.totalProfit}`,
    ];

    summaries.forEach((text) => {
      doc.setFontSize(12);
      doc.text(text, 40, summaryY);
      summaryY += 20;
    });

    const columns = [
      "Item",
      "Purchased Qty",
      "Sold Qty",
      "Remaining Qty",
      "Purchase Value",
      "Sales Value",
      "Generated Profit",
    ];

    const rows = report.items.map((item) => [
      item.itemName,
      item.purchasedQty,
      item.soldQty,
      item.remainingQty,
      item.purchaseAmount,
      item.salesAmount,
      item.profit,
    ]);

    autoTable(doc, {
      startY: summaryY + 10,
      head: [columns],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [127, 44, 44] },
      styles: { fontSize: 10 },
    });

    doc.save("ReportsDashboard.pdf");
  };

  // ================= CSV Export =================
  const exportCSV = () => {
    let csv =
      "Item,Purchased Qty,Sold Qty,Remaining Qty,Purchase Value,Sales Value,Generated Profit\n";
    report.items.forEach((item) => {
      csv += `${item.itemName},${item.purchasedQty},${item.soldQty},${item.remainingQty},${item.purchaseAmount},${item.salesAmount},${item.profit}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ReportsDashboard.csv";
    link.click();
  };

  // ================= Excel Export =================
  const exportExcel = () => {
    const wsData = [
      [
        "Item",
        "Purchased Qty",
        "Sold Qty",
        "Remaining Qty",
        "Purchase Value",
        "Sales Value",
        "Generated Profit",
      ],
      ...report.items.map((item) => [
        item.itemName,
        item.purchasedQty,
        item.soldQty,
        item.remainingQty,
        item.purchaseAmount,
        item.salesAmount,
        item.profit,
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "ReportsDashboard.xlsx");
  };

  return (
    <div className="p-6 text-[#4b2e2e] bg-[#E8F0F8] min-h-screen">
      <h2 className="text-2xl font-bold mb-4 uppercase tracking-wide">
        Reports Dashboard
      </h2>

      {/* Export Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={exportPDF}
          className="bg-[#7f2c2c] text-[#fff1d0] px-4 py-2 border-2 border-[#7f2c2c] font-semibold hover:bg-[#5f1e1e] transition-all"
        >
          Export PDF
        </button>
        <button
          onClick={exportCSV}
          className="bg-[#2a72aa] text-[#fff1d0] px-4 py-2 border-2 border-[#2a72aa] font-semibold hover:bg-[#1f4f7a] transition-all"
        >
          Export CSV
        </button>
        <button
          onClick={exportExcel}
          className="bg-[#a67f2c] text-[#fff1d0] px-4 py-2 border-2 border-[#a67f2c] font-semibold hover:bg-[#7f5f1e] transition-all"
        >
          Export Excel
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border-2 border-[#7f2c2c]">
          <h3 className="font-semibold">Total Stock Added</h3>
          <p className="text-xl">{report.totalStock}</p>
        </div>
        <div className="p-4 border-2 border-[#7f2c2c]">
          <h3 className="font-semibold">Total Sold Qty</h3>
          <p className="text-xl">{report.totalSoldQty || 0}</p>
        </div>
        <div className="p-4 border-2 border-[#7f2c2c]">
          <h3 className="font-semibold">Remaining Stock</h3>
          <p className="text-xl">{report.remainingStock}</p>
        </div>
        <div className="p-4 border-2 border-[#7f2c2c]">
          <h3 className="font-semibold">Total Purchase Amount</h3>
          <p className="text-xl">Rs. {report.totalPurchase?.toLocaleString() || 0}</p>
        </div>
        <div className="p-4 border-2 border-[#7f2c2c]">
          <h3 className="font-semibold">Total Sales Amount</h3>
          <p className="text-xl">Rs. {report.totalSales?.toLocaleString() || 0}</p>
        </div>
        <div className="p-4 border-2 border-[#7f2c2c]">
          <h3 className="font-semibold">Generated Profit</h3>
          <p className="text-xl">Rs. {report.totalProfit?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Per-Item Details */}
      <div className="overflow-x-auto border-2 border-[#7f2c2c]">
        <table className="w-full text-sm text-[#4b2e2e] border-collapse">
          <thead>
            <tr className="bg-white/10">
              {[
                "Item",
                "Purchased Qty",
                "Sold Qty",
                "Remaining Qty",
                "Purchase Value",
                "Sales Value",
                "Generated Profit",
              ].map((header) => (
                <th
                  key={header}
                  className="p-2 border-2 border-[#7f2c2c] text-left font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.items.map((item) => (
              <tr key={item.itemId} className="border-t border-[#7f2c2c]">
                <td className="p-2 border-2 border-[#7f2c2c]">
                  {item.itemName}
                </td>
                <td className="p-2 border-2 border-[#7f2c2c]">
                  {item.purchasedQty}
                </td>
                <td className="p-2 border-2 border-[#7f2c2c]">
                  {item.soldQty}
                </td>
                <td className="p-2 border-2 border-[#7f2c2c]">
                  {item.remainingQty}
                </td>
                <td className="p-2 border-2 border-[#7f2c2c]">
                  Rs. {item.purchaseAmount?.toLocaleString() || 0}
                </td>
                <td className="p-2 border-2 border-[#7f2c2c]">
                  Rs. {item.salesAmount?.toLocaleString() || 0}
                </td>
                <td className="p-2 border-2 border-[#7f2c2c]">Rs. {item.profit?.toLocaleString() || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportPage;

