import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Download,
  FileText,
  ShoppingCart,
  RefreshCcw,
  Wrench,
  BarChart3,
  Filter,
  RotateCcw,
  FileSpreadsheet,
} from "lucide-react";
import { apiClient, BASE_URL } from "../../api/client";
import {
  DateInput,
  parseDateToApi,
  formatDisplayDate,
} from "../../components/DateInput";
import type { InvoiceRecord } from "../Reports";

interface SalesReportProps {
  reportType: "Sale" | "Exchange" | "Quotation" | "Service" | "All";
  title: string;
  description: string;
}

interface ReportSummary {
  invoiceCount: number;
  totalBase: number;
  totalGST: number;
  totalSales: number;
}

export function SalesReportPage({ reportType, title, description }: SalesReportProps) {
  const navigate = useNavigate();

  // Filters state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedMode, setSelectedMode] = useState("All");

  // Filter application state - no transactions listed until filtered
  const [hasFiltered, setHasFiltered] = useState(false);

  // Data & loading state
  const [data, setData] = useState<InvoiceRecord[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({
    invoiceCount: 0,
    totalBase: 0,
    totalGST: 0,
    totalSales: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeConfig: Record<string, { icon: any; color: string; badge: string; cardLabels: { count: string; base: string; gst: string; total: string } }> = {
    Sale: {
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
      cardLabels: {
        count: "Total Invoices",
        base: "Base Sales (₹)",
        gst: "GST Tax 18% (₹)",
        total: "Total Revenue (₹)",
      },
    },
    Exchange: {
      icon: RefreshCcw,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
      cardLabels: {
        count: "Total Exchanges",
        base: "Base Value (₹)",
        gst: "GST (18%) (₹)",
        total: "Net Exchange (₹)",
      },
    },
    Service: {
      icon: Wrench,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900",
      badge: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
      cardLabels: {
        count: "Total Job Orders",
        base: "Service Charges (₹)",
        gst: "GST (18%) (₹)",
        total: "Total Collection (₹)",
      },
    },
    Quotation: {
      icon: FileText,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
      cardLabels: {
        count: "Total Quotations",
        base: "Base Estimate (₹)",
        gst: "Estimated GST (₹)",
        total: "Total Estimated (₹)",
      },
    },
    All: {
      icon: BarChart3,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900",
      badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
      cardLabels: {
        count: "Total Transactions",
        base: "Base Amount (₹)",
        gst: "GST (18%) (₹)",
        total: "Total Volume (₹)",
      },
    },
  };

  const currentConfig = typeConfig[reportType] || typeConfig.All;
  const ReportIcon = currentConfig.icon;
  const labels = currentConfig.cardLabels;

  const handleFilterSubmit = async () => {
    setLoading(true);
    setError(null);
    setHasFiltered(true);
    try {
      const params = new URLSearchParams({ type: reportType });
      if (dateFrom) params.set("from", parseDateToApi(dateFrom));
      if (dateTo) params.set("to", parseDateToApi(dateTo));

      const res = await apiClient.get<{ invoices: InvoiceRecord[] }>(`/reports?${params.toString()}`);
      let invoices = res.invoices || [];

      // Client-side filtering by payment method if specified
      if (selectedMode !== "All") {
        invoices = invoices.filter(
          (inv) => (inv.payment_method || "").toLowerCase() === selectedMode.toLowerCase()
        );
      }

      const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
      const totalGST = invoices.reduce((sum, inv) => sum + Number(inv.gst || 0), 0);
      const totalBase = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

      setData(invoices);
      setSummary({
        invoiceCount: invoices.length,
        totalBase,
        totalGST,
        totalSales,
      });
    } catch (err) {
      console.error("Failed to load report data", err);
      setError("Failed to load report records. Please try again.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedMode("All");
    setHasFiltered(false);
    setData([]);
    setError(null);
  };

  const handleDownloadCsv = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
          : null;
      const params = new URLSearchParams({ type: reportType });
      if (dateFrom) params.set("from", parseDateToApi(dateFrom));
      if (dateTo) params.set("to", parseDateToApi(dateTo));

      const res = await window.fetch(`${BASE_URL}/reports/download?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
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
      alert("Failed to export report CSV.");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
          : null;
      const params = new URLSearchParams({ type: reportType });
      if (dateFrom) params.set("from", parseDateToApi(dateFrom));
      if (dateTo) params.set("to", parseDateToApi(dateTo));

      const res = await window.fetch(`${BASE_URL}/reports/download/pdf?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) throw new Error("PDF Export Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export report PDF.");
    }
  };

  const fmt = (n: number = 0) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12 print:p-0 print:space-y-3">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#15161E] p-5 sm:p-6 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm print:shadow-none print:border-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <button
              onClick={() => navigate("/reports")}
              className="p-2 mt-0.5 sm:mt-0 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1B263B] text-gray-500 dark:text-gray-400 transition-colors border border-gray-200 dark:border-[#2E3B55] shrink-0 print:hidden"
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

          {/* Top Download Icons rendered after selecting filters */}
          {hasFiltered && data && (
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handleDownloadPdf}
                title="Download PDF"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={handleDownloadCsv}
                title="Download CSV"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Form: Start Date, End Date, Mode/Filter */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleFilterSubmit();
        }}
        className="bg-white dark:bg-[#15161E] p-5 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm space-y-4 print:hidden"
      >
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2E3B55] pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
              Filter {title}
            </h2>
          </div>
          {hasFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Start Date */}
          <DateInput
            id="report-date-from"
            label="Start Date"
            value={dateFrom}
            onChange={setDateFrom}
          />

          {/* End Date */}
          <DateInput
            id="report-date-to"
            label="End Date"
            value={dateTo}
            onChange={setDateTo}
          />

          {/* Mode / Type Filter */}
          <div>
            <label
              htmlFor="report-filter-mode"
              className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              Payment Mode / Type
            </label>
            <select
              id="report-filter-mode"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40 text-gray-900 dark:text-white transition-all"
            >
              <option value="All">All Modes / Types</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Credit">Credit</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Data</span>
          </button>
        </div>
      </form>

      {/* Content Area */}
      {!hasFiltered ? (
        /* Prompt State before filtering */
        <div className="bg-white dark:bg-[#15161E] p-10 sm:p-14 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm text-center">
          <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center border ${currentConfig.color}`}>
            <ReportIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
            Select Filters to View {title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1.5 font-medium leading-relaxed">
            Please choose the Start Date, End Date, and Mode above, then click <strong>Filter Data</strong> to generate the {title.toLowerCase()}.
          </p>
        </div>
      ) : loading ? (
        <div className="py-20 text-center bg-white dark:bg-[#15161E] rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Loading {title.toLowerCase()} records...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white dark:bg-[#15161E] rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm text-red-500 text-xs font-bold">
          {error}
        </div>
      ) : (
        <>
          {/* MOBILE RESPONSIVE: Only 4 summary cards & download buttons underneath */}
          <div className="md:hidden space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: Count */}
              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
                  {labels.count}
                </span>
                <div className="text-base font-black text-gray-800 dark:text-gray-100">
                  {summary.invoiceCount}
                </div>
              </div>

              {/* Card 2: Base Amount */}
              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-blue-500 mb-1">
                  {labels.base}
                </span>
                <div className="text-base font-black text-blue-600 dark:text-blue-400">
                  ₹ {fmt(summary.totalBase)}
                </div>
              </div>

              {/* Card 3: GST */}
              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-500 mb-1">
                  {labels.gst}
                </span>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  ₹ {fmt(summary.totalGST)}
                </div>
              </div>

              {/* Card 4: Total */}
              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-amber-500 mb-1">
                  {labels.total}
                </span>
                <div className="text-base font-black text-amber-600 dark:text-amber-400">
                  ₹ {fmt(summary.totalSales)}
                </div>
              </div>
            </div>

            {/* Mobile Download Buttons directly under the 4 modules */}
            <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm flex flex-col gap-2.5">
              <button
                onClick={handleDownloadPdf}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={handleDownloadCsv}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          {/* DESKTOP RESPONSIVE: 4 summary cards & full transactions table */}
          <div className="hidden md:block space-y-5">
            {/* 4 Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
                  {labels.count}
                </span>
                <div className="text-lg font-black text-gray-800 dark:text-gray-100">
                  {summary.invoiceCount}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">Total filtered entries</p>
              </div>

              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-blue-500 mb-1">
                  {labels.base}
                </span>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                  ₹ {fmt(summary.totalBase)}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">Subtotal before taxes</p>
              </div>

              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-500 mb-1">
                  {labels.gst}
                </span>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ₹ {fmt(summary.totalGST)}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">18% GST collected</p>
              </div>

              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-amber-500 mb-1">
                  {labels.total}
                </span>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                  ₹ {fmt(summary.totalSales)}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">Grand total volume</p>
              </div>
            </div>

            {/* Desktop Transactions Table */}
            <div className="bg-white dark:bg-[#15161E] rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-[#2E3B55] bg-gray-50/60 dark:bg-[#0D1B2A]/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                    {title} Statement
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-semibold">
                  {data.length} Transactions
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-150 dark:border-[#2E3B55] bg-gray-50/80 dark:bg-[#1B263B]/50 text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3 text-center w-12">S.No.</th>
                      <th className="py-3 px-3 w-28">Date</th>
                      <th className="py-3 px-3 w-28">Invoice / Entry #</th>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-3">Phone</th>
                      <th className="py-3 px-4">Items / Description</th>
                      <th className="py-3 px-3">Payment</th>
                      <th className="py-3 px-3 text-right">Base (₹)</th>
                      <th className="py-3 px-3 text-right">GST (₹)</th>
                      <th className="py-3 px-3 text-right">Total (₹)</th>
                      <th className="py-3 px-3 text-center">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#1B263B] text-gray-700 dark:text-gray-200 font-medium">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-gray-400 text-xs">
                          No records found for the selected period.
                        </td>
                      </tr>
                    ) : (
                      data.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors"
                        >
                          <td className="py-3 px-3 text-center text-gray-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-gray-600 dark:text-gray-300 font-mono text-[11px]">
                            {formatDisplayDate(row.date)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                            {row.invoice_number}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">
                            {row.customer_name}
                          </td>
                          <td className="py-3 px-3 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                            {row.customer_phone || "—"}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                            {row.items_summary || "—"}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                              {row.payment_method || "Cash"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                            ₹{fmt(Number(row.amount))}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            ₹{fmt(Number(row.gst))}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-gray-900 dark:text-white whitespace-nowrap">
                            ₹{fmt(Number(row.total))}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {row.type !== "Service" ? (
                              <button
                                onClick={() =>
                                  window.open(`${BASE_URL}/sales/${row.raw_id}/pdf`, "_blank")
                                }
                                className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                title="Download Official Invoice PDF"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {/* Totals row at the bottom */}
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-[#2E3B55] bg-gray-50/90 dark:bg-[#0D1B2A]/90 font-black text-xs text-gray-900 dark:text-white">
                      <td colSpan={7} className="py-3.5 px-4 uppercase tracking-wider text-right">
                        Total
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-blue-600 dark:text-blue-400 font-black">
                        ₹{fmt(summary.totalBase)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black">
                        ₹{fmt(summary.totalGST)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-black">
                        ₹{fmt(summary.totalSales)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer Info */}
      <div className="text-center text-xs text-gray-400 font-medium pt-2 print:hidden">
        SMR Battery Shop Management System · {title} Statement
      </div>
    </div>
  );
}
