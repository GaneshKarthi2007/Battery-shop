import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Download,
  BookOpen,
  Filter,
  RotateCcw,
  FileSpreadsheet,
} from "lucide-react";
import { apiClient, BASE_URL } from "../../api/client";

export interface GeneralLedgerEntry {
  id: number;
  s_no?: number;
  entry_number: string;
  date: string;
  type: "Cash" | "Journal" | string;
  particular: string;
  debit_ledger?: string;
  credit_ledger?: string;
  contra_ledger: string;
  debit: number;
  credit: number;
  running_balance: number;
  balance_type: "Dr" | "Cr";
  balance_formatted?: string;
  bank_name?: string | null;
  cheque_no?: string | null;
  comments?: string;
  status: string;
  attachment_url?: string | null;
}

export interface GeneralLedgerResponse {
  ledger: string;
  type?: string;
  date_from: string | null;
  date_to: string | null;
  opening_balance: number;
  opening_balance_type: "Dr" | "Cr";
  total_outgoing?: number;
  total_income?: number;
  total_debit: number;
  total_credit: number;
  closing_balance: number;
  closing_balance_type: "Dr" | "Cr";
  count: number;
  available_ledgers: string[];
  entries: GeneralLedgerEntry[];
}

export function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export function GeneralLedgerPage() {
  const navigate = useNavigate();

  // Filters state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedLedger, setSelectedLedger] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

  // Filter application state - no transactions listed until filters are applied
  const [hasFiltered, setHasFiltered] = useState(false);
  const [availableLedgers, setAvailableLedgers] = useState<string[]>([]);

  // Data & loading state
  const [data, setData] = useState<GeneralLedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available ledgers on initial mount
  useEffect(() => {
    let isMounted = true;
    apiClient
      .get<GeneralLedgerResponse>("/reports/general-ledger?ledger=All")
      .then((res) => {
        if (isMounted && res?.available_ledgers) {
          setAvailableLedgers(res.available_ledgers);
        }
      })
      .catch((err) => {
        console.error("Failed to prefetch available ledgers", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFilterSubmit = async () => {
    setLoading(true);
    setError(null);
    setHasFiltered(true);
    try {
      const params = new URLSearchParams();
      if (selectedLedger) params.set("ledger", selectedLedger);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (selectedType && selectedType !== "All") params.set("type", selectedType);

      const res = await apiClient.get<GeneralLedgerResponse>(
        `/reports/general-ledger?${params.toString()}`
      );
      setData(res);
      if (res?.available_ledgers && res.available_ledgers.length > 0) {
        setAvailableLedgers(res.available_ledgers);
      }
    } catch (err: unknown) {
      console.error("Failed to load general ledger", err);
      setError("Failed to load ledger records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedLedger("All");
    setSelectedType("All");
    setHasFiltered(false);
    setData(null);
    setError(null);
  };

  const handleDownloadCsv = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
          : null;
      const params = new URLSearchParams();
      if (selectedLedger) params.set("ledger", selectedLedger);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (selectedType && selectedType !== "All") params.set("type", selectedType);

      const res = await window.fetch(
        `${BASE_URL}/reports/general-ledger/download?${params.toString()}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!res.ok) throw new Error("CSV export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeLedger = (selectedLedger || "All").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `General_Ledger_${safeLedger}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export General Ledger CSV.");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
          : null;
      const params = new URLSearchParams();
      if (selectedLedger) params.set("ledger", selectedLedger);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (selectedType && selectedType !== "All") params.set("type", selectedType);

      const res = await window.fetch(
        `${BASE_URL}/reports/general-ledger/pdf?${params.toString()}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!res.ok) throw new Error("PDF export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeLedger = (selectedLedger || "All").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `General_Ledger_${safeLedger}_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export General Ledger PDF.");
    }
  };

  const fmt = (num: number = 0) =>
    num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-14 print:p-0 print:space-y-3">
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
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                  General Ledger Report
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50">
                  Credit / Debit Statement
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                Select date range, ledger, and voucher type to generate financial statement
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

      {/* Filter Control Section: Start Date, End Date, Ledger, Voucher Type */}
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
              Filter General Ledger
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

        {/* 4 Required Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Start Date */}
          <div>
            <label
              htmlFor="date-from"
              className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              Start Date
            </label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40 text-gray-900 dark:text-white transition-all"
            />
          </div>

          {/* End Date */}
          <div>
            <label
              htmlFor="date-to"
              className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              End Date
            </label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40 text-gray-900 dark:text-white transition-all"
            />
          </div>

          {/* Ledger Account */}
          <div>
            <label
              htmlFor="ledger-select"
              className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              Ledger
            </label>
            <select
              id="ledger-select"
              value={selectedLedger}
              onChange={(e) => setSelectedLedger(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40 text-gray-900 dark:text-white transition-all"
            >
              <option value="All">All Ledgers</option>
              {availableLedgers.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Voucher Type */}
          <div>
            <label
              htmlFor="voucher-type"
              className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              Voucher Type
            </label>
            <select
              id="voucher-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40 text-gray-900 dark:text-white transition-all"
            >
              <option value="All">All Vouchers</option>
              <option value="Cash">Cash Vouchers</option>
              <option value="Journal">Journal Vouchers</option>
            </select>
          </div>
        </div>

        {/* Filter Action Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md shadow-amber-600/20 active:scale-95 transition-all"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Data</span>
          </button>
        </div>
      </form>

      {/* Content Area */}
      {!hasFiltered ? (
        /* Prompt State before filter is submitted */
        <div className="bg-white dark:bg-[#15161E] p-10 sm:p-14 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
            Select Filters to View General Ledger
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1.5 font-medium leading-relaxed">
            Please choose the Start Date, End Date, Ledger Account, and Voucher Type above, then click <strong>Filter Data</strong> to generate the general ledger report.
          </p>
        </div>
      ) : loading ? (
        /* Loading Spinner */
        <div className="py-20 text-center bg-white dark:bg-[#15161E] rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Loading General Ledger records...
          </p>
        </div>
      ) : error ? (
        /* Error Alert */
        <div className="p-8 text-center bg-white dark:bg-[#15161E] rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm text-red-500 text-xs font-bold">
          {error}
        </div>
      ) : data ? (
        <>
          {/* MOBILE RESPONSIVE: Only 4 summary cards & download buttons underneath */}
          <div className="md:hidden space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Opening Balance */}
              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
                  Opening Balance
                </span>
                <div className="text-base font-black text-gray-800 dark:text-gray-100">
                  ₹ {fmt(data.opening_balance)}
                  <span className="text-[9px] ml-1 font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {data.opening_balance_type || "Dr"}
                  </span>
                </div>
              </div>

              {/* Total Income */}
              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-500 mb-1">
                  Total Income
                </span>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  ₹ {fmt(data.total_income ?? data.total_credit)}
                </div>
              </div>

              {/* Total Outgoing */}
              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-blue-500 mb-1">
                  Total Outgoing
                </span>
                <div className="text-base font-black text-blue-600 dark:text-blue-400">
                  ₹ {fmt(data.total_outgoing ?? data.total_debit)}
                </div>
              </div>

              {/* Closing Balance */}
              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-amber-500 mb-1">
                  Closing Balance
                </span>
                <div className="text-base font-black text-amber-600 dark:text-amber-400">
                  ₹ {fmt(data.closing_balance)}
                  <span className="text-[9px] ml-1 font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                    {data.closing_balance_type || "Dr"}
                  </span>
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
              {/* Opening Balance */}
              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
                  Opening Balance
                </span>
                <div className="text-lg font-black text-gray-800 dark:text-gray-100">
                  ₹ {fmt(data.opening_balance)}
                  <span className="text-[10px] ml-1 font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {data.opening_balance_type || "Dr"}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">Prior to selected period</p>
              </div>

              {/* Total Income */}
              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-500 mb-1">
                  Total Income
                </span>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ₹ {fmt(data.total_income ?? data.total_credit)}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">Total credit receipts</p>
              </div>

              {/* Total Outgoing */}
              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-blue-500 mb-1">
                  Total Outgoing
                </span>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                  ₹ {fmt(data.total_outgoing ?? data.total_debit)}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">Total debit expenses</p>
              </div>

              {/* Closing Balance */}
              <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
                <span className="block text-[10px] font-black uppercase tracking-wider text-amber-500 mb-1">
                  Closing Balance
                </span>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                  ₹ {fmt(data.closing_balance)}
                  <span className="text-[10px] ml-1 font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                    {data.closing_balance_type || "Dr"}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">Period closing balance</p>
              </div>
            </div>

            {/* Desktop Transactions Table Matching Reference Image */}
            <div className="bg-white dark:bg-[#15161E] rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-[#2E3B55] bg-gray-50/60 dark:bg-[#0D1B2A]/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                    Ledger Account:{" "}
                    <span className="text-amber-600 dark:text-amber-400">
                      {selectedLedger === "All" ? "All Accounts (Consolidated)" : selectedLedger}
                    </span>
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-semibold">
                  {data.entries?.length || 0} Transactions
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-150 dark:border-[#2E3B55] bg-gray-50/80 dark:bg-[#1B263B]/50 text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3 text-center w-12">S.No.</th>
                      <th className="py-3 px-3 w-28">Date</th>
                      <th className="py-3 px-3 w-28">A/c.No.</th>
                      <th className="py-3 px-4">Member Name / Customer</th>
                      <th className="py-3 px-4">Particulars</th>
                      <th className="py-3 px-3 text-right">Debit (Outgoing)</th>
                      <th className="py-3 px-3 text-right">Credit (Income)</th>
                      <th className="py-3 px-3 text-right">Balance</th>
                      <th className="py-3 px-4">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#1B263B] text-gray-700 dark:text-gray-200 font-medium">
                    {/* Top Row: Opening Balance (Green styled matching reference image) */}
                    <tr className="bg-emerald-50/40 dark:bg-emerald-950/20 font-bold text-emerald-800 dark:text-emerald-300">
                      <td className="py-2.5 px-3 text-center text-emerald-700">-</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-700">
                        {formatDisplayDate(data.date_from)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-400">-</td>
                      <td className="py-2.5 px-4 text-gray-400">-</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700 dark:text-emerald-400">
                        Opening Balance
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-400">
                        {data.opening_balance_type === "Dr" && data.opening_balance > 0
                          ? `₹${fmt(data.opening_balance)}`
                          : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                        {data.opening_balance_type === "Cr" && data.opening_balance > 0
                          ? `₹${fmt(data.opening_balance)}`
                          : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400">
                        ₹{fmt(data.opening_balance)}
                        {data.opening_balance_type || "Dr"}
                      </td>
                      <td className="py-2.5 px-4 text-gray-400">-</td>
                    </tr>

                    {/* Data Rows */}
                    {data.entries?.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-gray-400 text-xs">
                          No transaction records found for the specified period.
                        </td>
                      </tr>
                    ) : (
                      data.entries.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors"
                        >
                          <td className="py-3 px-3 text-center text-gray-400 font-mono text-[11px]">
                            {row.s_no ?? idx + 1}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-gray-600 dark:text-gray-300 font-mono text-[11px]">
                            {formatDisplayDate(row.date)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                            {row.entry_number}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-medium">
                            {row.contra_ledger}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">
                            {row.particular}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                            {row.debit > 0 ? `₹${fmt(row.debit)}` : "-"}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {row.credit > 0 ? `₹${fmt(row.credit)}` : "-"}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-gray-900 dark:text-white whitespace-nowrap">
                            ₹{fmt(row.running_balance)}
                            <span className="text-[10px] ml-0.5 font-bold text-gray-500">
                              {row.balance_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-[11px]">
                            {row.comments || row.status || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {/* Table Footer Totals */}
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-[#2E3B55] bg-gray-50/90 dark:bg-[#0D1B2A]/90 font-black text-xs text-gray-900 dark:text-white">
                      <td colSpan={5} className="py-3.5 px-4 uppercase tracking-wider text-right">
                        Total
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-blue-600 dark:text-blue-400 font-black">
                        ₹{fmt(data.total_outgoing ?? data.total_debit)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black">
                        ₹{fmt(data.total_income ?? data.total_credit)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-black">
                        ₹{fmt(data.closing_balance)}
                        {data.closing_balance_type || "Dr"}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Footer Info */}
      <div className="text-center text-xs text-gray-400 font-medium pt-2 print:hidden">
        SMR Battery Shop Management System · General Ledger Financial Statement
      </div>
    </div>
  );
}
