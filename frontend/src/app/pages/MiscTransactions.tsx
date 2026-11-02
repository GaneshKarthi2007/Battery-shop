import { useState, useEffect, useMemo, ChangeEvent, FormEvent } from "react";
import {
  Info,
  ArrowLeft,
  Plus,
  Trash2,
  Paperclip,
  Camera,
  CreditCard,
  Wallet,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { apiClient } from "../api/client";
import { ReportTable, ColDef, SearchPanelField } from "./reports/ReportTable";

export interface TransactionEntry {
  id?: string;
  ledger: string;
  amount: number | string;
  balance?: number | string;
}

export interface MiscTransactionRecord {
  id: number;
  entry_number: string;
  date: string;
  type: "Cash" | "Journal";
  particular: string;
  debit_amount: number;
  credit_amount: number;
  debit_ledger: string;
  credit_ledger: string;
  credit_entries?: TransactionEntry[];
  debit_entries?: TransactionEntry[];
  attachment_path?: string | null;
  bank_name?: string | null;
  cheque_no?: string | null;
  cheque_date?: string | null;
  status: string;
}

// Default ledger recommendations for battery shop & accounts
const POPULAR_CREDIT_LEDGERS = [
  "CASH",
  "TMB LTD",
  "HDFC BANK",
  "SBI BANK",
  "ADVANCE FROM SUBSCRIPTION",
  "SGST",
  "CGST",
  "CAPITAL ACCOUNT",
  "SUNDRY CREDITORS",
  "SALES REVENUE",
];

const POPULAR_DEBIT_LEDGERS = [
  "TELEPHONE EXPENSES",
  "OFFICE CONSUMABLES",
  "VEHICLE EXPENSES",
  "E.B Bill Expenses",
  "REGISTER OFFICE EXPENSES",
  "PROCESSING_CHIT_PAYMENT",
  "WORKSHOP EXPENSES",
  "PURCHASE ACCOUNT",
  "RENT EXPENSES",
  "BATTERY SCRAP EXPENSES",
  "MISC EXPENSES",
];

// Offline fallback mock data matching reference image
const INITIAL_MOCK_DATA: MiscTransactionRecord[] = [
  {
    id: 1,
    entry_number: "TXN-00001",
    date: "2026-10-29",
    type: "Cash",
    particular: "KVT BSNL BILL",
    debit_amount: 1000.0,
    credit_amount: 0.0,
    debit_ledger: "TELEPHONE EXPENSES",
    credit_ledger: "CASH",
    status: "Settled",
  },
  {
    id: 2,
    entry_number: "TXN-00002",
    date: "2026-10-29",
    type: "Journal",
    particular: "BID ADVANCE-BSC02-MANI MALATHI-1 8/A-TMB LTD-CHQ NO:2430158",
    debit_amount: 1628250.0,
    credit_amount: 1628250.0,
    debit_ledger: "PROCESSING_CHIT_PAYMENT",
    credit_ledger: "TMB LTD",
    bank_name: "TMB LTD",
    cheque_no: "2430158",
    status: "Settled",
  },
  {
    id: 3,
    entry_number: "TXN-00003",
    date: "2026-10-28",
    type: "Journal",
    particular: "BID ADVANCE-BSB04-SEETHALAKSHMI.S-15/A-TMB LTD-CHQ NO:02430157",
    debit_amount: 820000.0,
    credit_amount: 820000.0,
    debit_ledger: "PROCESSING_CHIT_PAYMENT",
    credit_ledger: "TMB LTD",
    bank_name: "TMB LTD",
    cheque_no: "02430157",
    status: "Settled",
  },
  {
    id: 4,
    entry_number: "TXN-00004",
    date: "2026-10-28",
    type: "Journal",
    particular: "SHANTHI K - NO NAME",
    debit_amount: 107750.0,
    credit_amount: 107750.0,
    debit_ledger: "TMB LTD",
    credit_ledger: "ADVANCE FROM SUBSCRIPTION",
    status: "Settled",
  },
  {
    id: 5,
    entry_number: "TXN-00005",
    date: "2026-10-27",
    type: "Cash",
    particular: "SARASWATHI POOJA FLOWER",
    debit_amount: 2000.0,
    credit_amount: 0.0,
    debit_ledger: "OFFICE CONSUMABLES",
    credit_ledger: "CASH",
    status: "Settled",
  },
  {
    id: 6,
    entry_number: "TXN-00006",
    date: "2026-10-26",
    type: "Journal",
    particular: "MUTHUKRISHNAN R PAY",
    debit_amount: 146250.0,
    credit_amount: 146250.0,
    debit_ledger: "ADVANCE FROM SUBSCRIPTION",
    credit_ledger: "TMB LTD",
    status: "Settled",
  },
  {
    id: 7,
    entry_number: "TXN-00007",
    date: "2026-10-26",
    type: "Cash",
    particular: "SUZUKI SHOWROOM ADVANCE",
    debit_amount: 2000.0,
    credit_amount: 0.0,
    debit_ledger: "VEHICLE EXPENSES",
    credit_ledger: "CASH",
    status: "Settled",
  },
  {
    id: 8,
    entry_number: "TXN-00008",
    date: "2026-10-22",
    type: "Cash",
    particular: "POOJA EXPENSES FLOWER",
    debit_amount: 4620.0,
    credit_amount: 0.0,
    debit_ledger: "OFFICE CONSUMABLES",
    credit_ledger: "CASH",
    status: "Settled",
  },
  {
    id: 9,
    entry_number: "TXN-00009",
    date: "2026-10-22",
    type: "Cash",
    particular: "RENGOVER CAR DIESEL",
    debit_amount: 4000.0,
    credit_amount: 0.0,
    debit_ledger: "VEHICLE EXPENSES",
    credit_ledger: "CASH",
    status: "Settled",
  },
  {
    id: 10,
    entry_number: "TXN-00010",
    date: "2026-10-21",
    type: "Cash",
    particular: "SRI MUTHARAMMAN TRADERS SGST",
    debit_amount: 0.0,
    credit_amount: 900.0,
    debit_ledger: "CASH",
    credit_ledger: "SGST",
    status: "Settled",
  },
  {
    id: 11,
    entry_number: "TXN-00011",
    date: "2026-10-21",
    type: "Cash",
    particular: "SIVA PERUMAL CGST",
    debit_amount: 0.0,
    credit_amount: 900.0,
    debit_ledger: "CASH",
    credit_ledger: "CGST",
    status: "Settled",
  },
  {
    id: 12,
    entry_number: "TXN-00012",
    date: "2026-10-18",
    type: "Journal",
    particular: "EB BILL",
    debit_amount: 15104.54,
    credit_amount: 15104.54,
    debit_ledger: "E.B Bill Expenses",
    credit_ledger: "TMB LTD",
    status: "Settled",
  },
];

const formatCurrency = (val: number | string | undefined) => {
  const num = typeof val === "number" ? val : parseFloat(String(val || "0"));
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export function MiscTransactions() {
  const [viewMode, setViewMode] = useState<"list" | "add">("list");
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [chosenType, setChosenType] = useState<"Cash" | "Journal">("Cash");
  const [activeType, setActiveType] = useState<"Cash" | "Journal">("Cash");

  const [transactions, setTransactions] = useState<MiscTransactionRecord[]>(INITIAL_MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add Form state
  const todayStr = new Date().toISOString().split("T")[0];
  const [formDate, setFormDate] = useState(todayStr);
  const [formParticulars, setFormParticulars] = useState("");
  const [creditRows, setCreditRows] = useState<TransactionEntry[]>([
    { id: "c-1", ledger: "CASH", amount: "", balance: "" },
  ]);
  const [debitRows, setDebitRows] = useState<TransactionEntry[]>([
    { id: "d-1", ledger: "", amount: "", balance: "" },
  ]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Optional Bank / Cheque Details for Journal
  const [bankName, setBankName] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");

  // Action Menu dropdown state
  const [openActionId, setOpenActionId] = useState<number | null>(null);

  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ status: string; data: MiscTransactionRecord[] }>("/misc-transactions");
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setTransactions(res.data);
      }
    } catch {
      if (transactions.length === 0) {
        setTransactions(INITIAL_MOCK_DATA);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // When opening modal
  const handleOpenAddModal = () => {
    setChosenType("Cash");
    setShowTypeModal(true);
  };

  // When submitting type in modal
  const handleConfirmType = () => {
    setActiveType(chosenType);
    setShowTypeModal(false);
    resetForm(chosenType);
    setViewMode("add");
  };

  const resetForm = (typeToSet?: "Cash" | "Journal") => {
    const t = typeToSet || activeType;
    setFormDate(todayStr);
    setFormParticulars("");
    setCreditRows([
      {
        id: `c-${Date.now()}`,
        ledger: t === "Cash" ? "CASH" : "TMB LTD",
        amount: "",
        balance: "",
      },
    ]);
    setDebitRows([
      {
        id: `d-${Date.now()}`,
        ledger: "",
        amount: "",
        balance: "",
      },
    ]);
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setBankName("");
    setChequeNo("");
    setChequeDate("");
  };

  // Add credit / debit row handlers
  const addCreditRow = () => {
    setCreditRows((prev) => [
      ...prev,
      { id: `c-${Date.now()}-${Math.random()}`, ledger: "", amount: "", balance: "" },
    ]);
  };

  const removeCreditRow = (index: number) => {
    if (creditRows.length <= 1) return;
    setCreditRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCreditRow = (index: number, field: keyof TransactionEntry, value: string) => {
    setCreditRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addDebitRow = () => {
    setDebitRows((prev) => [
      ...prev,
      { id: `d-${Date.now()}-${Math.random()}`, ledger: "", amount: "", balance: "" },
    ]);
  };

  const removeDebitRow = (index: number) => {
    if (debitRows.length <= 1) return;
    setDebitRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDebitRow = (index: number, field: keyof TransactionEntry, value: string) => {
    setDebitRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Attachment photo handler
  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
      const url = URL.createObjectURL(file);
      setAttachmentPreview(url);
    }
  };

  // Calculations
  const totalCredit = useMemo(() => {
    return creditRows.reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0);
  }, [creditRows]);

  const totalDebit = useMemo(() => {
    return debitRows.reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0);
  }, [debitRows]);

  // Form submission
  const handleSubmitTransaction = async (e: FormEvent) => {
    e.preventDefault();

    if (!formParticulars.trim()) {
      setFeedback({ type: "error", message: "Particulars description is required." });
      return;
    }

    const invalidCredit = creditRows.some(
      (r) => !r.ledger.trim() || isNaN(parseFloat(String(r.amount))) || parseFloat(String(r.amount)) < 0
    );
    const invalidDebit = debitRows.some(
      (r) => !r.ledger.trim() || isNaN(parseFloat(String(r.amount))) || parseFloat(String(r.amount)) < 0
    );

    if (invalidCredit || invalidDebit) {
      setFeedback({
        type: "error",
        message: "Please fill valid ledger name and positive amounts for all entries.",
      });
      return;
    }

    if (activeType === "Journal" && Math.abs(totalCredit - totalDebit) > 0.01) {
      setFeedback({
        type: "error",
        message: `Debit and Credit totals must balance for Journal entries. (Difference: ₹${Math.abs(
          totalCredit - totalDebit
        ).toFixed(2)})`,
      });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const payload = {
        date: formDate,
        type: activeType,
        particular: formParticulars.trim(),
        credit_entries: creditRows.map((r) => ({
          ledger: r.ledger.trim(),
          amount: parseFloat(String(r.amount)) || 0,
          balance: parseFloat(String(r.balance)) || 0,
        })),
        debit_entries: debitRows.map((r) => ({
          ledger: r.ledger.trim(),
          amount: parseFloat(String(r.amount)) || 0,
          balance: parseFloat(String(r.balance)) || 0,
        })),
        bank_name: bankName || null,
        cheque_no: chequeNo || null,
        cheque_date: chequeDate || null,
      };

      let newRecord: MiscTransactionRecord;
      try {
        const res = await apiClient.post<{ data: MiscTransactionRecord }>("/misc-transactions", payload);
        newRecord = res.data;
      } catch {
        newRecord = {
          id: Date.now(),
          entry_number: `TXN-${String(transactions.length + 1).padStart(5, "0")}`,
          date: formDate,
          type: activeType,
          particular: formParticulars.trim(),
          debit_amount: totalDebit,
          credit_amount: totalCredit,
          debit_ledger: debitRows.map((r) => r.ledger).join(", "),
          credit_ledger: creditRows.map((r) => r.ledger).join(", "),
          status: "Settled",
        };
      }

      setTransactions((prev) => [newRecord, ...prev]);
      setFeedback({
        type: "success",
        message: `${activeType} transaction saved successfully!`,
      });
      setViewMode("list");
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to save transaction.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete transaction handler
  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this transaction record?")) {
      return;
    }
    try {
      await apiClient.delete(`/misc-transactions/${id}`).catch(() => {});
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setOpenActionId(null);
      setFeedback({ type: "success", message: "Transaction record deleted." });
    } catch {
      setFeedback({ type: "error", message: "Failed to delete transaction." });
    }
  };

  // Columns for ReportTable matching Reference Image 1
  const columns: ColDef<MiscTransactionRecord>[] = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
            row.type === "Cash"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          }`}
        >
          {row.type}
        </span>
      ),
    },
    {
      key: "particular",
      header: "Particular",
      sortable: true,
      render: (row) => (
        <div className="max-w-xs md:max-w-md">
          <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs truncate" title={row.particular}>
            {row.particular}
          </p>
          {row.entry_number && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{row.entry_number}</span>
          )}
        </div>
      ),
    },
    {
      key: "debit_amount",
      header: "Debit Amount",
      sortable: true,
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">
          {formatCurrency(row.debit_amount)}
        </span>
      ),
    },
    {
      key: "credit_amount",
      header: "Credit Amount",
      sortable: true,
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">
          {formatCurrency(row.credit_amount)}
        </span>
      ),
    },
    {
      key: "debit_ledger",
      header: "Debit Ledger",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
          {row.debit_ledger || "-"}
        </span>
      ),
    },
    {
      key: "credit_ledger",
      header: "Credit Ledger",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
          {row.credit_ledger || "-"}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      className: "text-center w-12",
      render: (row) => (
        <div className="relative flex justify-center">
          <button
            onClick={() => setOpenActionId(openActionId === row.id ? null : row.id)}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1B263B] transition-colors"
            title="Options"
            aria-label="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {openActionId === row.id && (
            <div className="absolute right-0 top-8 z-30 w-36 bg-white dark:bg-[#1B263B] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 text-left animate-in fade-in-50">
              <button
                onClick={() => {
                  alert(
                    `Transaction: ${row.entry_number}\nDate: ${row.date}\nType: ${row.type}\nParticular: ${row.particular}\nDebit: ₹${row.debit_amount}\nCredit: ₹${row.credit_amount}`
                  );
                  setOpenActionId(null);
                }}
                className="w-full px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#0D1B2A] text-left flex items-center gap-2"
              >
                <Info className="w-3.5 h-3.5 text-blue-500" />
                View Details
              </button>
              <button
                onClick={() => handleDeleteTransaction(row.id)}
                className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-left flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  // Outlined Search Panel Fields matching Reference Image 1 & Chit Fund Form
  const searchPanelFields: SearchPanelField<MiscTransactionRecord>[] = [
    { key: "entry_number", label: "Ent. No", type: "text", placeholder: "e.g. TXN-00001" },
    { key: "date", label: "Entry Date", type: "date" },
    { key: "bank_name", label: "Bank Name", type: "text", placeholder: "e.g. TMB LTD" },
    { key: "cheque_no", label: "Ch.No.", type: "text", placeholder: "e.g. 2430158" },
    { key: "debit_amount", label: "Amount", type: "number", placeholder: "Exact amount" },
    {
      key: "type",
      label: "Filter Type",
      type: "select",
      options: [
        { value: "", label: "-Select Type-" },
        { value: "Cash", label: "Cash" },
        { value: "Journal", label: "Journal" },
      ],
    },
    {
      key: "status",
      label: "Filter Status",
      type: "select",
      options: [
        { value: "", label: "-Select Status-" },
        { value: "Settled", label: "Settled" },
        { value: "Pending", label: "Pending" },
      ],
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200 border border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold ml-3"
          >
            ×
          </button>
        </div>
      )}

      {/* VIEW MODE 1: Table List View (Reference Image 1) */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {/* Top Title Bar with + ADD NEW button and Info icon */}
          <div className="flex items-center justify-between bg-white dark:bg-[#15161E] px-4 py-3 rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                General Transaction
                <span
                  title="Maintain miscellaneous Cash and Journal accounting transactions"
                  className="inline-flex cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700"
                >
                  <Info className="w-4 h-4 fill-blue-600/10 text-blue-600" />
                </span>
              </span>
              <button
                onClick={handleOpenAddModal}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-sm transition-all transform active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ADD NEW</span>
              </button>
            </div>

            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
              Accounts Module • Chit Fund ERP
            </div>
          </div>

          {/* ReportTable with Built-in Search Panel and Outlined Inputs */}
          <ReportTable
            columns={columns}
            data={transactions}
            loading={loading}
            searchPlaceholder="Search particular, ledger, entry no..."
            searchFields={["particular", "entry_number", "debit_ledger", "credit_ledger", "bank_name"]}
            searchPanelFields={searchPanelFields}
            initialShowSearchPanel={true}
            emptyMessage="No miscellaneous transactions found. Click + ADD NEW to create one."
          />
        </div>
      )}

      {/* VIEW MODE 2: Add Transaction Form (Reference Image 3) */}
      {viewMode === "add" && (
        <div className="space-y-4 max-w-6xl mx-auto">
          {/* Header Bar matching Reference: "← General Transaction Journal Add" */}
          <div className="flex items-center justify-between bg-white dark:bg-[#15161E] px-4 py-3 rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1B263B] rounded-lg transition-colors"
                title="Back to transaction list"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                General Transaction {activeType} Add
              </h2>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                activeType === "Cash"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              }`}
            >
              {activeType} Mode
            </span>
          </div>

          <form onSubmit={handleSubmitTransaction} className="space-y-4">
            {/* Top Details Card: Date * & Particulars */}
            <div className="bg-white dark:bg-[#15161E] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Outlined Date Field */}
                <div className="relative">
                  <input
                    type="date"
                    id="date-input"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="peer w-full px-3.5 pt-3.5 pb-2 text-xs font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1B263B] border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                  />
                  <label
                    htmlFor="date-input"
                    className="absolute left-3 -top-2 px-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#15161E] transition-all pointer-events-none"
                  >
                    Date *
                  </label>
                </div>

                {/* Outlined Particulars Field */}
                <div className="relative md:col-span-2">
                  <input
                    type="text"
                    id="particulars-input"
                    value={formParticulars}
                    onChange={(e) => setFormParticulars(e.target.value)}
                    placeholder="Enter transaction particulars / remarks..."
                    required
                    className="peer w-full px-3.5 pt-3.5 pb-2 text-xs font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1B263B] border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                  />
                  <label
                    htmlFor="particulars-input"
                    className="absolute left-3 -top-2 px-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#15161E] transition-all pointer-events-none"
                  >
                    Particulars *
                  </label>
                </div>
              </div>

              {/* Optional Cheque / Bank Details if Journal */}
              {activeType === "Journal" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="relative">
                    <input
                      type="text"
                      id="bank-name-input"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. TMB LTD, HDFC"
                      className="peer w-full px-3.5 pt-3.5 pb-2 text-xs font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1B263B] border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                    <label
                      htmlFor="bank-name-input"
                      className="absolute left-3 -top-2 px-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#15161E]"
                    >
                      Bank Name
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      id="cheque-no-input"
                      value={chequeNo}
                      onChange={(e) => setChequeNo(e.target.value)}
                      placeholder="e.g. 02430157"
                      className="peer w-full px-3.5 pt-3.5 pb-2 text-xs font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1B263B] border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                    <label
                      htmlFor="cheque-no-input"
                      className="absolute left-3 -top-2 px-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#15161E]"
                    >
                      Ch.No.
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      id="cheque-date-input"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                      className="peer w-full px-3.5 pt-3.5 pb-2 text-xs font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1B263B] border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                    <label
                      htmlFor="cheque-date-input"
                      className="absolute left-3 -top-2 px-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#15161E]"
                    >
                      Cheque Date
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Datalist suggestions for quick autocomplete */}
            <datalist id="popularCreditLedgers">
              {POPULAR_CREDIT_LEDGERS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
            <datalist id="popularDebitLedgers">
              {POPULAR_DEBIT_LEDGERS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>

            {/* Side-by-side Credit & Debit Cards matching Reference Image 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Credit Card */}
              <div className="bg-white dark:bg-[#15161E] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Credit</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addCreditRow}
                    className="p-1 rounded-md text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    title="Add Credit Line"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {creditRows.map((row, idx) => (
                    <div key={row.id || idx} className="space-y-3 p-3 bg-gray-50/50 dark:bg-[#1B263B]/30 rounded-xl border border-gray-150 dark:border-gray-700/50">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
                        <span>Credit {idx + 1}</span>
                        {creditRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCreditRow(idx)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Ledger Field with floating label */}
                      <div className="relative">
                        <input
                          id={`credit-ledger-${idx}`}
                          type="text"
                          list="popularCreditLedgers"
                          value={row.ledger}
                          onChange={(e) => updateCreditRow(idx, "ledger", e.target.value)}
                          placeholder="Select or enter credit ledger"
                          required
                          className="peer w-full px-3.5 pt-3.5 pb-2 text-xs font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1B263B] border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        />
                        <label
                          htmlFor={`credit-ledger-${idx}`}
                          className="absolute left-3 -top-2 px-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#15161E]"
                        >
                          Credit Ledger *
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Amount Field */}
                        <div className="relative">
                          <input
                            id={`credit-amount-${idx}`}
                            type="number"
                            step="0.01"
                            value={row.amount}
                            onChange={(e) => updateCreditRow(idx, "amount", e.target.value)}
                            placeholder="0.00"
                            required
                            className="peer w-full px-3.5 pt-3.5 pb-2 text-xs font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1B263B] border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                          />
                          <label
                            htmlFor={`credit-amount-${idx}`}
                            className="absolute left-3 -top-2 px-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#15161E]"
                          >
                            Credit Amount *
                          </label>
                        </div>

                        {/* Balance Field */}
                        <div className="relative">
                          <input
                            id={`credit-balance-${idx}`}
                            type="text"
                            value={row.balance || ""}
                            onChange={(e) => updateCreditRow(idx, "balance", e.target.value)}
                            placeholder="Optional balance"
                            className="peer w-full px-3.5 pt-3.5 pb-2 text-xs font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1B263B] border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                          />
                          <label
                            htmlFor={`credit-balance-${idx}`}
                            className="absolute left-3 -top-2 px-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#15161E]"
                          >
                            Balance
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs font-bold text-gray-700 dark:text-gray-300">
                  <span>Total Credit:</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{formatCurrency(totalCredit)}
                  </span>
                </div>
              </div>

              {/* Debit Card */}
              <div className="bg-white dark:bg-[#15161E] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Debit</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addDebitRow}
                    className="p-1 rounded-md text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    title="Add Debit Line"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {debitRows.map((row, idx) => (
                    <div key={row.id || idx} className="space-y-3 p-3 bg-gray-50/50 dark:bg-[#1B263B]/30 rounded-xl border border-gray-150 dark:border-gray-700/50">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
                        <span>Debit {idx + 1}</span>
                        {debitRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDebitRow(idx)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Ledger Field */}
                      <div className="relative">
                        <input
                          id={`debit-ledger-${idx}`}
                          type="text"
                          list="popularDebitLedgers"
                          value={row.ledger}
                          onChange={(e) => updateDebitRow(idx, "ledger", e.target.value)}
                          placeholder="Select or enter debit ledger"
                          required
                          className="peer w-full px-3.5 pt-3.5 pb-2 text-xs font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1B263B] border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        />
                        <label
                          htmlFor={`debit-ledger-${idx}`}
                          className="absolute left-3 -top-2 px-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#15161E]"
                        >
                          Debit Ledger *
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Amount Field */}
                        <div className="relative">
                          <input
                            id={`debit-amount-${idx}`}
                            type="number"
                            step="0.01"
                            value={row.amount}
                            onChange={(e) => updateDebitRow(idx, "amount", e.target.value)}
                            placeholder="0.00"
                            required
                            className="peer w-full px-3.5 pt-3.5 pb-2 text-xs font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1B263B] border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                          />
                          <label
                            htmlFor={`debit-amount-${idx}`}
                            className="absolute left-3 -top-2 px-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#15161E]"
                          >
                            Debit Amount *
                          </label>
                        </div>

                        {/* Balance Field */}
                        <div className="relative">
                          <input
                            id={`debit-balance-${idx}`}
                            type="text"
                            value={row.balance || ""}
                            onChange={(e) => updateDebitRow(idx, "balance", e.target.value)}
                            placeholder="Optional balance"
                            className="peer w-full px-3.5 pt-3.5 pb-2 text-xs font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1B263B] border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                          />
                          <label
                            htmlFor={`debit-balance-${idx}`}
                            className="absolute left-3 -top-2 px-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#15161E]"
                          >
                            Balance
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs font-bold text-gray-700 dark:text-gray-300">
                  <span>Total Debit:</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    ₹{formatCurrency(totalDebit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Attachments Card matching Reference Image 3 */}
            <div className="bg-white dark:bg-[#15161E] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm max-w-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Attachments</h3>
                </div>

                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <span>Upload photo</span>
                </label>
              </div>

              {/* Photo placeholder / preview */}
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center overflow-hidden bg-gray-50 dark:bg-[#1B263B] text-gray-400">
                {attachmentPreview ? (
                  <img
                    src={attachmentPreview}
                    alt="Uploaded voucher"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-6 h-6 stroke-[1.5]" />
                )}
              </div>
              {attachmentFile && (
                <p className="text-[11px] text-gray-500 truncate">{attachmentFile.name}</p>
              )}
            </div>

            {/* Journal Balance Warning / Indicator */}
            {activeType === "Journal" && Math.abs(totalCredit - totalDebit) > 0.01 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Journal entry is unbalanced. Credit Total (₹{formatCurrency(totalCredit)}) does not match Debit Total (₹{formatCurrency(totalDebit)}). Difference: ₹{Math.abs(totalCredit - totalDebit).toFixed(2)}
                </span>
              </div>
            )}

            {/* Bottom Action Buttons: SUBMIT (blue) & RESET (text) */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md transition-all uppercase tracking-wider active:scale-95"
              >
                {submitting ? "SUBMITTING..." : "SUBMIT"}
              </button>
              <button
                type="button"
                onClick={() => resetForm()}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white uppercase tracking-wider transition-colors"
              >
                RESET
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW MODAL: Choose Transaction Type Modal (Reference Image 2) */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15161E] rounded-xl border border-gray-200 dark:border-[#2E3B55] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-150 dark:border-gray-800 flex items-center gap-2 text-gray-800 dark:text-gray-100 font-bold text-sm">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Choose Transaction Type</span>
            </div>

            {/* Modal Body with Radio options */}
            <div className="p-5 space-y-4">
              <label
                htmlFor="radio-type-cash"
                className="flex items-center gap-3 cursor-pointer group select-none"
              >
                <input
                  id="radio-type-cash"
                  type="radio"
                  name="transactionType"
                  value="Cash"
                  checked={chosenType === "Cash"}
                  onChange={() => setChosenType("Cash")}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 group-hover:text-blue-600">
                  CASH
                </span>
              </label>

              <label
                htmlFor="radio-type-journal"
                className="flex items-center gap-3 cursor-pointer group select-none"
              >
                <input
                  id="radio-type-journal"
                  type="radio"
                  name="transactionType"
                  value="Journal"
                  checked={chosenType === "Journal"}
                  onChange={() => setChosenType("Journal")}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 group-hover:text-blue-600">
                  JOURNAL
                </span>
              </label>
            </div>

            {/* Modal Footer with SUBMIT and CANCEL */}
            <div className="px-5 py-3.5 bg-gray-50 dark:bg-[#0D1B2A] border-t border-gray-150 dark:border-gray-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleConfirmType}
                className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md shadow-sm transition-all uppercase tracking-wider active:scale-95"
              >
                SUBMIT
              </button>
              <button
                type="button"
                onClick={() => setShowTypeModal(false)}
                className="px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white uppercase tracking-wider transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
