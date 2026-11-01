import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Download, IndianRupee } from "lucide-react";
import { apiClient, BASE_URL } from "../../api/client";
import { ReportTable, SearchPanelField } from "./ReportTable";
import type { InvoiceRecord } from "../Reports";

/** GST Report: shows taxable base value, CGST 9%, SGST 9%, and total GST per record */
export function GstReportPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: "All" });
      const res = await apiClient.get<{ invoices: InvoiceRecord[] }>(`/reports?${params}`);
      setData(res.invoices || []);
    } catch (err) {
      console.error("Failed to fetch GST report", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const params = new URLSearchParams({ type: "All" });
      const res = await window.fetch(`${BASE_URL}/reports/download?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("CSV Export Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GST_Report_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export GST report CSV");
    }
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Typed Search Panel fields matching Reference Image 2 (media_1793533739175_71f21b54.png)
  const searchPanelFields: SearchPanelField<InvoiceRecord>[] = [
    { key: "invoice_number", label: "Ent. No / Invoice No", type: "text" },
    { key: "date", label: "Entry Date", type: "date" },
    { key: "customer_name", label: "Party / Customer Name", type: "text" },
    {
      key: "type",
      label: "Category / Type",
      type: "select",
      options: [
        { value: "Sale", label: "Sale (Bill)" },
        { value: "Exchange", label: "Exchange" },
        { value: "Service", label: "Service" },
        { value: "Quotation", label: "Quotation" },
      ],
    },
    { key: "amount", label: "Taxable Base (₹)", type: "number" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Header Card */}
      <div className="bg-white dark:bg-[#15161E] p-5 sm:p-6 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <button
              onClick={() => navigate("/reports")}
              className="p-2 mt-0.5 sm:mt-0 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1B263B] text-gray-500 dark:text-gray-400 transition-colors border border-gray-200 dark:border-[#2E3B55] shrink-0"
              title="Back to Reports Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                  GST Tax Report
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                  18% GST Standard
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                Taxable turnover, CGST, SGST, and total GST collected across all transaction types
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export GST Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main GST Table with Search Panel */}
      <ReportTable
        loading={loading}
        data={data}
        searchPlaceholder="Search customer, invoice no..."
        searchFields={["customer_name", "invoice_number"]}
        searchPanelFields={searchPanelFields}
        emptyMessage="No transactions found."
        rowKey={(r) => r.id}
        columns={[
          {
            key: "invoice_number",
            header: "Invoice No.",
            sortable: true,
            render: (r) => (
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                {r.invoice_number}
              </span>
            ),
          },
          {
            key: "date",
            header: "Date",
            sortable: true,
            render: (r) => (
              <span className="text-gray-600 dark:text-gray-300">
                {new Date(r.date).toLocaleDateString("en-IN")}
              </span>
            ),
          },
          {
            key: "customer_name",
            header: "Party / Customer",
            sortable: true,
            render: (r) => (
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {r.customer_name}
              </span>
            ),
          },
          {
            key: "type",
            header: "Category",
            sortable: true,
            render: (r) => (
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {r.type}
              </span>
            ),
          },
          {
            key: "amount",
            header: "Taxable Base (₹)",
            sortable: true,
            className: "text-right",
            render: (r) => (
              <span className="tabular-nums font-medium text-gray-700 dark:text-gray-300">
                {fmt(Number(r.amount))}
              </span>
            ),
          },
          {
            key: "cgst",
            header: "CGST 9% (₹)",
            className: "text-right",
            render: (r) => (
              <span className="tabular-nums text-gray-600 dark:text-gray-400">
                {fmt(Number(r.gst) / 2)}
              </span>
            ),
          },
          {
            key: "sgst",
            header: "SGST 9% (₹)",
            className: "text-right",
            render: (r) => (
              <span className="tabular-nums text-gray-600 dark:text-gray-400">
                {fmt(Number(r.gst) / 2)}
              </span>
            ),
          },
          {
            key: "gst",
            header: "Total GST (₹)",
            sortable: true,
            className: "text-right",
            render: (r) => (
              <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                {fmt(Number(r.gst))}
              </span>
            ),
          },
          {
            key: "total",
            header: "Gross Total (₹)",
            sortable: true,
            className: "text-right",
            render: (r) => (
              <span className="font-black tabular-nums text-gray-900 dark:text-white">
                {fmt(Number(r.total))}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
