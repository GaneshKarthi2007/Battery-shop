import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Download, Calendar } from "lucide-react";
import { apiClient, BASE_URL } from "../../api/client";
import { ReportTable, SearchPanelField } from "./ReportTable";
import type { InvoiceRecord } from "../Reports";

interface DailySummaryRow {
  date: string;
  salesCount: number;
  salesTotal: number;
  exchangeCount: number;
  exchangeTotal: number;
  serviceCount: number;
  serviceTotal: number;
  quotationCount: number;
  quotationTotal: number;
  dayTotal: number;
  gstTotal: number;
  totalTransactions: number;
}

export function DailyReportPage() {
  const navigate = useNavigate();
  const [raw, setRaw] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: "All" });
      const res = await apiClient.get<{ invoices: InvoiceRecord[] }>(`/reports?${params}`);
      setRaw(res.invoices || []);
    } catch (err) {
      console.error("Failed to fetch daily report data", err);
      setRaw([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group raw invoices by date
  const rows = useMemo((): DailySummaryRow[] => {
    const map = new Map<string, DailySummaryRow>();
    for (const inv of raw) {
      const dateKey = new Date(inv.date).toLocaleDateString("en-IN");
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          date: dateKey,
          salesCount: 0,
          salesTotal: 0,
          exchangeCount: 0,
          exchangeTotal: 0,
          serviceCount: 0,
          serviceTotal: 0,
          quotationCount: 0,
          quotationTotal: 0,
          dayTotal: 0,
          gstTotal: 0,
          totalTransactions: 0,
        });
      }
      const row = map.get(dateKey)!;
      const total = Number(inv.total || 0);
      const gst = Number(inv.gst || 0);
      row.dayTotal += total;
      row.gstTotal += gst;
      row.totalTransactions += 1;

      if (inv.type === "Sale") {
        row.salesCount++;
        row.salesTotal += total;
      } else if (inv.type === "Exchange") {
        row.exchangeCount++;
        row.exchangeTotal += total;
      } else if (inv.type === "Service") {
        row.serviceCount++;
        row.serviceTotal += total;
      } else if (inv.type === "Quotation") {
        row.quotationCount++;
        row.quotationTotal += total;
      }
    }

    return [...map.values()].sort((a, b) => {
      const da = new Date(a.date.split("/").reverse().join("-"));
      const db = new Date(b.date.split("/").reverse().join("-"));
      return db.getTime() - da.getTime();
    });
  }, [raw]);

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
      a.download = `Daily_Report_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export daily report CSV");
    }
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Typed Search Panel fields matching Reference Image 2 (media_1793533739175_71f21b54.png)
  const searchPanelFields: SearchPanelField<DailySummaryRow>[] = [
    { key: "date", label: "Entry Date / Date", type: "text" },
    { key: "dayTotal", label: "Min Day Total (₹)", type: "number" },
    { key: "salesCount", label: "Min Bills Count", type: "number" },
    { key: "serviceCount", label: "Min Services Count", type: "number" },
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
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                  Daily Summary Report
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400">
                  Aggregated
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                Day-by-day revenue breakdown across sales, exchanges, service orders, and GST
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table with Search Panel */}
      <ReportTable
        loading={loading}
        data={rows}
        searchPlaceholder="Search by date (e.g. 15/03/2026)..."
        searchFields={["date"]}
        searchPanelFields={searchPanelFields}
        emptyMessage="No daily transactions found."
        rowKey={(r) => r.date}
        columns={[
          {
            key: "date",
            header: "Date",
            sortable: true,
            render: (r) => (
              <span className="font-bold text-gray-900 dark:text-gray-100">{r.date}</span>
            ),
          },
          {
            key: "salesCount",
            header: "Bills",
            sortable: true,
            className: "text-center",
            render: (r) => (
              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold">
                {r.salesCount}
              </span>
            ),
          },
          {
            key: "salesTotal",
            header: "Bills Amt (₹)",
            sortable: true,
            className: "text-right",
            render: (r) => (
              <span className="tabular-nums font-medium text-gray-700 dark:text-gray-300">
                {fmt(r.salesTotal)}
              </span>
            ),
          },
          {
            key: "exchangeCount",
            header: "Exchanges",
            sortable: true,
            className: "text-center",
            render: (r) => (
              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold">
                {r.exchangeCount}
              </span>
            ),
          },
          {
            key: "exchangeTotal",
            header: "Exchange Amt (₹)",
            sortable: true,
            className: "text-right",
            render: (r) => (
              <span className="tabular-nums font-medium text-gray-700 dark:text-gray-300">
                {fmt(r.exchangeTotal)}
              </span>
            ),
          },
          {
            key: "serviceCount",
            header: "Services",
            sortable: true,
            className: "text-center",
            render: (r) => (
              <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 font-bold">
                {r.serviceCount}
              </span>
            ),
          },
          {
            key: "serviceTotal",
            header: "Service Amt (₹)",
            sortable: true,
            className: "text-right",
            render: (r) => (
              <span className="tabular-nums font-medium text-gray-700 dark:text-gray-300">
                {fmt(r.serviceTotal)}
              </span>
            ),
          },
          {
            key: "gstTotal",
            header: "GST (₹)",
            sortable: true,
            className: "text-right",
            render: (r) => (
              <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                {fmt(r.gstTotal)}
              </span>
            ),
          },
          {
            key: "dayTotal",
            header: "Day Total (₹)",
            sortable: true,
            className: "text-right",
            render: (r) => (
              <span className="tabular-nums font-black text-gray-900 dark:text-white">
                {fmt(r.dayTotal)}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
