import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Download,
  BookOpen,
  Filter,
  Search,
  RotateCcw,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Receipt,
  FileSpreadsheet,
  Wallet,
} from "lucide-react";
import { apiClient, BASE_URL } from "../../api/client";

export interface GeneralLedgerEntry {
  id: number;
  entry_number: string;
  date: string;
  type: "Cash" | "Journal";
  particular: string;
  debit_ledger: string;
  credit_ledger: string;
  contra_ledger: string;
  debit: number;
  credit: number;
  running_balance: number;
  balance_type: "Dr" | "Cr";
  bank_name?: string | null;
  cheque_no?: string | null;
  status: string;
  attachment_url?: string | null;
}

export interface GeneralLedgerResponse {
  ledger: string;
  date_from: string | null;
  date_to: string | null;
  opening_balance: number;
  opening_balance_type: "Dr" | "Cr";
  total_debit: number;
  total_credit: number;
  closing_balance: number;
  closing_balance_type: "Dr" | "Cr";
  count: number;
  available_ledgers: string[];
  entries: GeneralLedgerEntry[];
}

export function GeneralLedgerPage() {
  const navigate = useNavigate();

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedLedger, setSelectedLedger] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Data
  const [data, setData] = useState<GeneralLedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedLedger) params.set("ledger", selectedLedger);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (selectedType && selectedType !== "All") params.set("type", selectedType);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await apiClient.get<GeneralLedgerResponse>(
        `/reports/general-ledger?${params.toString()}`
      );
      setData(res);
    } catch (err: unknown) {
      console.error("Failed to load general ledger", err);
      setError("Failed to load ledger records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedLedger, dateFrom, dateTo, selectedType, searchTerm]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

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
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await window.fetch(
        `${BASE_URL}/reports/general-ledger/download?${params.toString()}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeLedger = selectedLedger.replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `General_Ledger_${safeLedger}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export General Ledger CSV.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Quick Period Presets
  const applyPreset = (preset: "today" | "this_month" | "last_30" | "all") => {
    const today = new Date();
    const fmtDate = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "all") {
      setDateFrom("");
      setDateTo("");
    } else if (preset === "today") {
      const t = fmtDate(today);
      setDateFrom(t);
      setDateTo(t);
    } else if (preset === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateFrom(fmtDate(firstDay));
      setDateTo(fmtDate(today));
    } else if (preset === "last_30") {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setDateFrom(fmtDate(past));
      setDateTo(fmtDate(today));
    }
  };

  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedLedger("All");
    setSelectedType("All");
    setSearchTerm("");
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
                  Debit / Credit Ledger
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                Detailed account statement, running balance and voucher entries selectable by date and ledger account
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-[#1B263B] dark:hover:bg-[#2E3B55] text-gray-700 dark:text-gray-200 rounded-xl transition-all border border-gray-200 dark:border-[#2E3B55]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Control Section */}
      <div className="bg-white dark:bg-[#15161E] p-5 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2E3B55] pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
              Filter General Ledger
            </h2>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Ledger Selector */}
          <div>
            <label
              htmlFor="ledger-select"
              className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              Account / Ledger
            </label>
            <select
              id="ledger-select"
              value={selectedLedger}
              onChange={(e) => setSelectedLedger(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40 text-gray-900 dark:text-white transition-all"
            >
              <option value="All">All Ledgers (Consolidated)</option>
              {data?.available_ledgers?.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label
              htmlFor="date-from"
              className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              From Date
            </label>
            <div className="relative">
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40 text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label
              htmlFor="date-to"
              className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              To Date
            </label>
            <div className="relative">
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40 text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>

          {/* Type / Search */}
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

        {/* Quick Date Chips & Search input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1">
              Presets:
            </span>
            <button
              onClick={() => applyPreset("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                !dateFrom && !dateTo
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-[#1B263B] text-gray-600 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => applyPreset("today")}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 dark:bg-[#1B263B] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2E3B55] transition-all"
            >
              Today
            </button>
            <button
              onClick={() => applyPreset("this_month")}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 dark:bg-[#1B263B] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2E3B55] transition-all"
            >
              This Month
            </button>
            <button
              onClick={() => applyPreset("last_30")}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 dark:bg-[#1B263B] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2E3B55] transition-all"
            >
              Last 30 Days
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search particulars, entry #..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Opening Balance */}
        <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Opening Balance
            </span>
            <Scale className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="text-base sm:text-lg font-black text-gray-800 dark:text-gray-100">
            ₹ {fmt(data?.opening_balance)}
            <span className="text-[10px] ml-1 font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {data?.opening_balance_type || "Dr"}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 truncate">Prior to selected period</p>
        </div>

        {/* Total Debit */}
        <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">
              Total Debit (Dr)
            </span>
            <div className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
            ₹ {fmt(data?.total_debit)}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Receipts & incoming debits</p>
        </div>

        {/* Total Credit */}
        <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
              Total Credit (Cr)
            </span>
            <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
            ₹ {fmt(data?.total_credit)}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Payments & outgoing credits</p>
        </div>

        {/* Closing Balance */}
        <div className="bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
              Closing Balance
            </span>
            <div className="w-5 h-5 rounded-md bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
            ₹ {fmt(data?.closing_balance)}
            <span className="text-[10px] ml-1 font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
              {data?.closing_balance_type || "Dr"}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 truncate">Net closing balance</p>
        </div>

        {/* Total Entries */}
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Vouchers Count
            </span>
            <Receipt className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="text-base sm:text-lg font-black text-gray-800 dark:text-gray-100">
            {data?.count || 0}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Transactions in view</p>
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="bg-white dark:bg-[#15161E] rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm overflow-hidden">
        {/* Table Header / Subtitle */}
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
            {data?.entries?.length || 0} Records
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Loading General Ledger records...
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-500 text-xs font-bold">{error}</div>
        ) : data?.entries?.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs font-semibold">
            <p>No transactions found for the selected ledger or date range.</p>
            <button
              onClick={handleResetFilters}
              className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
            >
              Reset filters to view all entries
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-[#2E3B55] bg-gray-50/80 dark:bg-[#1B263B]/50 text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Entry / Voucher #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Particulars</th>
                    <th className="py-3 px-4">Contra / Account</th>
                    <th className="py-3 px-4 text-right">Debit (₹)</th>
                    <th className="py-3 px-4 text-right">Credit (₹)</th>
                    <th className="py-3 px-4 text-right">Running Balance (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#1B263B] text-gray-700 dark:text-gray-200 font-medium">
                  {/* Opening Balance Row if date filter is active */}
                  {data?.date_from && (
                    <tr className="bg-amber-50/40 dark:bg-amber-950/20 italic font-semibold text-gray-600 dark:text-gray-300">
                      <td className="py-2.5 px-4">{data.date_from}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-gray-400">---</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-bold uppercase">
                          B/F
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-gray-800 dark:text-gray-100">
                        Opening Balance Brought Forward
                      </td>
                      <td className="py-2.5 px-4 text-gray-400">N/A</td>
                      <td className="py-2.5 px-4 text-right text-gray-400">-</td>
                      <td className="py-2.5 px-4 text-right text-gray-400">-</td>
                      <td className="py-2.5 px-4 text-right font-bold text-gray-900 dark:text-white">
                        ₹ {fmt(data.opening_balance)}{" "}
                        <span className="text-[10px] ml-0.5">{data.opening_balance_type}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center text-gray-400">-</td>
                    </tr>
                  )}

                  {data?.entries?.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400 text-[11px]">
                        {row.date}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-amber-600 dark:text-amber-400">
                        {row.entry_number}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            row.type === "Cash"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50"
                              : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/50"
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900 dark:text-gray-100 max-w-xs truncate">
                          {row.particular}
                        </p>
                        {row.cheque_no && (
                          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                            {row.bank_name ? `${row.bank_name} ` : ""}Chq: {row.cheque_no}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-[11px] max-w-xs truncate">
                        {row.contra_ledger}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {row.debit > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400">
                            ₹ {fmt(row.debit)}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {row.credit > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ₹ {fmt(row.credit)}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black whitespace-nowrap">
                        <span>₹ {fmt(row.running_balance)}</span>{" "}
                        <span
                          className={`text-[10px] font-bold px-1 py-0.2 rounded ${
                            row.balance_type === "Dr"
                              ? "text-blue-600 bg-blue-50 dark:bg-blue-950/50"
                              : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
                          }`}
                        >
                          {row.balance_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Table Footer Totals */}
                <tfoot>
                  <tr className="border-t-2 border-gray-200 dark:border-[#2E3B55] bg-gray-50/90 dark:bg-[#0D1B2A]/90 font-black text-xs text-gray-900 dark:text-white">
                    <td colSpan={5} className="py-3.5 px-4 uppercase tracking-wider text-right">
                      Total Transactions Summary
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-blue-600 dark:text-blue-400 font-black">
                      ₹ {fmt(data?.total_debit)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black">
                      ₹ {fmt(data?.total_credit)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-600 dark:text-amber-400 font-black">
                      ₹ {fmt(data?.closing_balance)}{" "}
                      <span className="text-[10px]">{data?.closing_balance_type}</span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-[#1B263B]">
              {data?.entries?.map((row) => (
                <div key={row.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                        {row.entry_number}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                          row.type === "Cash"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {row.type}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-semibold">{row.date}</span>
                  </div>

                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {row.particular}
                  </p>

                  <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
                    <span>Account: {row.contra_ledger}</span>
                    <span className="font-semibold text-gray-400">{row.status}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100 dark:border-[#2E3B55] text-center font-mono">
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-1.5 rounded-lg">
                      <span className="block text-[9px] text-gray-400 uppercase">Debit</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {row.debit > 0 ? `₹${fmt(row.debit)}` : "-"}
                      </span>
                    </div>
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-1.5 rounded-lg">
                      <span className="block text-[9px] text-gray-400 uppercase">Credit</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {row.credit > 0 ? `₹${fmt(row.credit)}` : "-"}
                      </span>
                    </div>
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 p-1.5 rounded-lg">
                      <span className="block text-[9px] text-gray-400 uppercase">Balance</span>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                        ₹{fmt(row.running_balance)}{" "}
                        <span className="text-[9px]">{row.balance_type}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer Audit Info */}
      <div className="text-center text-xs text-gray-400 font-medium pt-2 print:hidden">
        SMR Battery Shop Management System · General Ledger Financial Statement
      </div>
    </div>
  );
}
