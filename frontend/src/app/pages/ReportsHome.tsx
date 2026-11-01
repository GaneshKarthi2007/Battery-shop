import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ShoppingCart,
  RefreshCcw,
  Wrench,
  FileText,
  Receipt,
  BarChart3,
  Calendar,
  TrendingUp,
  Search,
  ChevronRight,
  IndianRupee,
  ShieldCheck,
  Package,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface ReportLink {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconBg: string;
  tag?: string;
}

interface ReportCategory {
  number: number;
  title: string;
  subtitle: string;
  reports: ReportLink[];
}

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    number: 1,
    title: "Sales & Invoicing",
    subtitle: "Complete invoices, counter sales & customer quotations",
    reports: [
      {
        id: "all-transactions",
        label: "All Transactions Master",
        description: "Combined consolidated view of bills, exchanges, services & quotations",
        path: "/reports/all",
        icon: BarChart3,
        color: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-50 dark:bg-blue-950/40",
        tag: "All-in-One",
      },
      {
        id: "bills-report",
        label: "Battery Sales & Bills",
        description: "Official sales tax invoices with itemized battery details & GST breakdown",
        path: "/reports/sales",
        icon: ShoppingCart,
        color: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-50 dark:bg-blue-950/40",
        tag: "Invoiced",
      },
      {
        id: "quotations-report",
        label: "Estimates & Quotations",
        description: "Pending, active, and converted customer price quotations",
        path: "/reports/quotations",
        icon: FileText,
        color: "text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-50 dark:bg-amber-950/40",
        tag: "Quotes",
      },
    ],
  },
  {
    number: 2,
    title: "Battery Exchange & Stock",
    subtitle: "Scrap battery trade-ins and inventory turnover",
    reports: [
      {
        id: "exchange-report",
        label: "Battery Exchange Report",
        description: "Old battery scrap exchange records, allowance discounts & scrap values",
        path: "/reports/exchanges",
        icon: RefreshCcw,
        color: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
        tag: "Scrap & Trade",
      },
      {
        id: "inventory-report",
        label: "Stock & Inventory Registry",
        description: "Real-time battery models, current stock levels, serials and pricing",
        path: "/inventory",
        icon: Package,
        color: "text-teal-600 dark:text-teal-400",
        iconBg: "bg-teal-50 dark:bg-teal-950/40",
        tag: "Warehouse",
      },
    ],
  },
  {
    number: 3,
    title: "Services & Warranty",
    subtitle: "Field jobs, battery charging, jump starts & warranty claims",
    reports: [
      {
        id: "service-report",
        label: "Service & Job Orders",
        description: "All customer complaints, technician assignments, charges & resolutions",
        path: "/reports/services",
        icon: Wrench,
        color: "text-purple-600 dark:text-purple-400",
        iconBg: "bg-purple-50 dark:bg-purple-950/40",
        tag: "Workforce",
      },
      {
        id: "warranty-report",
        label: "Warranty Claims & History",
        description: "Battery serial number claims, manufacturer warranty validation & status",
        path: "/warranty",
        icon: ShieldCheck,
        color: "text-indigo-600 dark:text-indigo-400",
        iconBg: "bg-indigo-50 dark:bg-indigo-950/40",
        tag: "Claims",
      },
    ],
  },
  {
    number: 4,
    title: "Financial & Tax Summary",
    subtitle: "18% GST output tax, day-wise revenue and collections",
    reports: [
      {
        id: "gst-report",
        label: "GST Tax Return Report",
        description: "Month-wise 18% GST output breakdown (CGST 9% + SGST 9%) for tax filing",
        path: "/reports/gst",
        icon: IndianRupee,
        color: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
        tag: "18% GST",
      },
      {
        id: "daily-report",
        label: "Daily Collection Summary",
        description: "Day-by-day cash, UPI & transaction volume breakdown across all departments",
        path: "/reports/daily",
        icon: Calendar,
        color: "text-indigo-600 dark:text-indigo-400",
        iconBg: "bg-indigo-50 dark:bg-indigo-950/40",
        tag: "Day-by-Day",
      },
      {
        id: "revenue-report",
        label: "Revenue & Profit Analytics",
        description: "Gross revenue overview, estimated gross profit margins and financial health",
        path: "/reports/all",
        icon: TrendingUp,
        color: "text-rose-600 dark:text-rose-400",
        iconBg: "bg-rose-50 dark:bg-rose-950/40",
        tag: "Analytics",
      },
    ],
  },
];

const ALL_REPORTS = REPORT_CATEGORIES.flatMap((c) =>
  c.reports.map((r) => ({ ...r, category: c.title }))
);

export function ReportsHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = searchTerm.trim()
    ? ALL_REPORTS.filter(
        (r) =>
          r.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
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
                Comprehensive reporting hub for sales, exchanges, service jobs, GST & financial audits
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
              placeholder="Search reports or category..."
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Filtered Search Results */}
      {filtered !== null && (
        <div className="bg-white dark:bg-[#15161E] rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-[#2E3B55] bg-gray-50/60 dark:bg-[#0D1B2A]/60 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {filtered.length} Report{filtered.length !== 1 ? "s" : ""} matching "{searchTerm}"
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Clear Filter
            </button>
          </div>
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              No reports match your search query. Try typing "sales", "gst", or "service".
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#1B263B]">
              {filtered.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => navigate(r.path)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all text-left group"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-gray-200/50 dark:border-gray-700/50 ${r.iconBg}`}
                    >
                      <Icon className={`w-5 h-5 ${r.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {r.label}
                        </p>
                        {r.tag && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {r.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {r.category} · {r.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Balanced 2x2 Category Grid */}
      {filtered === null && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {REPORT_CATEGORIES.map((cat) => (
            <div
              key={cat.number}
              className="bg-white dark:bg-[#15161E] rounded-2xl border border-gray-150 dark:border-[#2E3B55] shadow-sm overflow-hidden flex flex-col hover:border-blue-200 dark:hover:border-blue-900/60 transition-all"
            >
              {/* Category Header */}
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-[#2E3B55] bg-gray-50/60 dark:bg-[#0D1B2A]/60 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">
                      {cat.number}
                    </span>
                    {cat.title}
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {cat.subtitle}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-gray-400 bg-white dark:bg-[#1B263B] px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-[#2E3B55]">
                  {cat.reports.length} Reports
                </span>
              </div>

              {/* Report Items List */}
              <div className="divide-y divide-gray-100 dark:divide-[#1B263B] flex-1">
                {cat.reports.map((report) => {
                  const Icon = report.icon;
                  return (
                    <button
                      key={report.id}
                      id={`report-link-${report.id}`}
                      onClick={() => navigate(report.path)}
                      className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group text-left"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-gray-200/40 dark:border-gray-800 ${report.iconBg}`}
                      >
                        <Icon className={`w-4 h-4 ${report.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {report.label}
                          </p>
                          {report.tag && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              {report.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug line-clamp-1">
                          {report.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-2 text-center text-xs text-gray-400 font-medium">
        Authenticated Session: <span className="font-bold text-gray-600 dark:text-gray-300 capitalize">{user?.role}</span> ({user?.name || "User"}) · SMR Battery Management
      </div>
    </div>
  );
}
