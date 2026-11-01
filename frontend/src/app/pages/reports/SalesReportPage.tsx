import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Download,
  FileText,
  ShoppingCart,
  RefreshCcw,
  Wrench,
  BarChart3,
} from "lucide-react";
import { apiClient, BASE_URL } from "../../api/client";
import { ReportTable, SearchPanelField } from "./ReportTable";
import type { InvoiceRecord } from "../Reports";

interface SalesReportProps {
  reportType: "Sale" | "Exchange" | "Quotation" | "Service" | "All";
  title: string;
  description: string;
}

export function SalesReportPage({ reportType, title, description }: SalesReportProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: reportType });
      const res = await apiClient.get<{ invoices: InvoiceRecord[] }>(`/reports?${params}`);
      setData(res.invoices || []);
    } catch (err) {
      console.error("Failed to load report data", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleDownloadCsv = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const params = new URLSearchParams({ type: reportType });
      const res = await window.fetch(`${BASE_URL}/reports/download?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("CSV Export Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export report CSV");
    }
  };

  const typeConfig: Record<string, { icon: any; color: string; badge: string }> = {
    Sale: {
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    },
    Exchange: {
      icon: RefreshCcw,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
    Service: {
      icon: Wrench,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900",
      badge: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
    },
    Quotation: {
      icon: FileText,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    },
    All: {
      icon: BarChart3,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900",
      badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
    },
  };

  const currentConfig = typeConfig[reportType] || typeConfig.All;
  const ReportIcon = currentConfig.icon;

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Typed Search Panel fields matching Reference Image 2 (media_1793533739175_71f21b54.png)
  const searchPanelFields: SearchPanelField<InvoiceRecord>[] = [
    { key: "invoice_number", label: "Ent. No / Invoice No", type: "text" },
    { key: "date", label: "Entry Date", type: "date" },
    { key: "customer_name", label: "Customer / Party Name", type: "text" },
    { key: "customer_phone", label: "Phone Number", type: "text" },
    { key: "vehicle_details", label: "Vehicle Number", type: "text" },
    { key: "amount", label: "Amount (₹)", type: "number" },
    {
      key: "payment_method",
      label: "Payment Mode",
      type: "select",
      options: [
        { value: "Cash", label: "Cash" },
        { value: "UPI", label: "UPI" },
        { value: "Card", label: "Card" },
        { value: "Credit", label: "Credit" },
      ],
    },
    ...(reportType === "All"
      ? [
          {
            key: "type",
            label: "Type / Status",
            type: "select" as const,
            options: [
              { value: "Sale", label: "Sale (Bill)" },
              { value: "Exchange", label: "Exchange" },
              { value: "Service", label: "Service" },
              { value: "Quotation", label: "Quotation" },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Top Header Card */}
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
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${currentConfig.color}`}
            >
              <ReportIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                  {title}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {reportType}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card with Search Panel */}
      <ReportTable
        loading={loading}
        data={data}
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
        searchFields={["customer_name", "invoice_number", "customer_phone", "vehicle_details"]}
        searchPanelFields={searchPanelFields}
        emptyMessage={`No ${title.toLowerCase()} found.`}
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
            header: "Customer Name",
            sortable: true,
            render: (r) => (
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {r.customer_name}
              </span>
            ),
          },
          {
            key: "customer_phone",
            header: "Phone",
            render: (r) => r.customer_phone || "—",
          },
          {
            key: "vehicle_details",
            header: "Vehicle Details",
            render: (r) => r.vehicle_details || "—",
          },
          ...(reportType === "All"
            ? [
                {
                  key: "type",
                  header: "Type",
                  sortable: true,
                  render: (r: InvoiceRecord) => {
                    const cfg = typeConfig[r.type] || typeConfig.Sale;
                    return (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${cfg.badge}`}
                      >
                        {r.type}
                      </span>
                    );
                  },
                },
              ]
            : []),
          {
            key: "items_summary",
            header: "Items / Description",
            render: (r) => (
              <span className="max-w-[220px] truncate block text-gray-600 dark:text-gray-300">
                {r.items_summary || "—"}
              </span>
            ),
          },
          {
            key: "payment_method",
            header: "Payment",
            render: (r) => (
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold">
                {r.payment_method || "Cash"}
              </span>
            ),
          },
          {
            key: "amount",
            header: "Base (₹)",
            sortable: true,
            className: "text-right",
            render: (r) => (
              <span className="tabular-nums font-medium text-gray-700 dark:text-gray-300">
                {fmt(Number(r.amount))}
              </span>
            ),
          },
          {
            key: "gst",
            header: "GST (₹)",
            sortable: true,
            className: "text-right",
            render: (r) => (
              <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                {fmt(Number(r.gst))}
              </span>
            ),
          },
          {
            key: "total",
            header: "Total (₹)",
            sortable: true,
            className: "text-right",
            render: (r) => (
              <span className="font-black tabular-nums text-gray-900 dark:text-white">
                {fmt(Number(r.total))}
              </span>
            ),
          },
          {
            key: "action",
            header: "Invoice",
            className: "text-center",
            render: (r) =>
              r.type !== "Service" ? (
                <button
                  onClick={() => window.open(`${BASE_URL}/sales/${r.raw_id}/pdf`, "_blank")}
                  className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                  title="Download Official Invoice PDF"
                >
                  <FileText className="w-4 h-4" />
                </button>
              ) : null,
          },
        ]}
      />
    </div>
  );
}
