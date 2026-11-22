import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ShoppingCart,
  Wrench,
  FileText,
  Receipt,
  Search,
  ChevronRight,
  BookOpen,
} from "lucide-react";

export interface ReportItem {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconBg: string;
  borderColor: string;
  tag: string;
}

export const ACTIVE_REPORTS: ReportItem[] = [
  {
    id: "general-ledger",
    label: "General Ledger",
    description: "Detailed debit and credit ledger statement, running balance and vouchers filtered by date & ledger",
    path: "/reports/general-ledger",
    icon: BookOpen,
    color: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "hover:border-amber-400 dark:hover:border-amber-600",
    tag: "Debit / Credit",
  },
  {
    id: "battery-sales",
    label: "Battery Sales & Bills",
    description: "Official sales tax invoices with itemized battery details, GST breakdown & payment modes",
    path: "/reports/sales",
    icon: ShoppingCart,
    color: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "hover:border-blue-400 dark:hover:border-blue-600",
    tag: "Invoices",
  },
  {
    id: "estimates-quotations",
    label: "Estimates & Quotations",
    description: "Pending, active and converted customer price quotations with estimated totals",
    path: "/reports/quotations",
    icon: FileText,
    color: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-50 dark:bg-indigo-950/40",
    borderColor: "hover:border-indigo-400 dark:hover:border-indigo-600",
    tag: "Quotations",
  },
  {
    id: "services-jobs",
    label: "Services & Job Orders",
    description: "Battery repair, charging, jump start complaints, technician service charges & job orders",
    path: "/reports/services",
    icon: Wrench,
    color: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-50 dark:bg-purple-950/40",
    borderColor: "hover:border-purple-400 dark:hover:border-purple-600",
    tag: "Job Orders",
  },
];

export function ReportsHome() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = searchTerm.trim()
    ? ACTIVE_REPORTS.filter(
        (r) =>
          r.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : ACTIVE_REPORTS;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#15161E] p-5 sm:p-6 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                Report Home
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                Core financial, sales, quotations, and service job reporting statements
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Grid of the 4 active reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              onClick={() => navigate(report.path)}
              className={`bg-white dark:bg-[#15161E] p-6 rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm cursor-pointer transition-all group flex flex-col justify-between ${report.borderColor}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border border-gray-200/50 dark:border-gray-700/50 ${report.iconBg}`}
                  >
                    <Icon className={`w-6 h-6 ${report.color}`} />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {report.tag}
                  </span>
                </div>

                <h2 className="text-base font-black text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                  {report.label}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  {report.description}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-gray-100 dark:border-[#2E3B55] flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <span>View Statement</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white dark:bg-[#15161E] p-12 text-center rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm text-gray-400 text-xs font-medium">
          No reports match "{searchTerm}". Try searching for "ledger", "sales", "quotations", or "services".
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-xs text-gray-400 font-medium pt-4">
        SMR Battery Shop Management System · Reports Directory
      </div>
    </div>
  );
}
