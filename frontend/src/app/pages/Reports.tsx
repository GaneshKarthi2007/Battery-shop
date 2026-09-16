import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
    FileText,
    Download,
    DollarSign,
    TrendingUp,
    Filter,
    Search,
    ArrowUpDown,
    CreditCard,
    Wrench,
    RefreshCw,
    Receipt,
    Eye,
} from "lucide-react";
import { Button } from "../components/Button";
import { apiClient, BASE_URL } from "../api/client";
import { CircleLoader } from "../components/ui/CircleLoader";

export interface InvoiceRecord {
    id: string;
    raw_id?: number | string;
    invoice_number: string;
    date: string;
    customer_name: string;
    customer_phone?: string;
    vehicle_details?: string;
    payment_method?: string;
    type: "Sale" | "Exchange" | "Service" | "Quotation" | string;
    items_summary: string;
    amount: number;
    gst: number;
    total: number;
    items?: any[];
}

export interface ReportSummary {
    totalSales: number;
    totalGST: number;
    totalProfit: number;
    invoiceCount: number;
    salesByType: {
        Sale: number;
        Exchange: number;
        Service: number;
        Quotation?: number;
    };
}

export type SortOption = "date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "name_asc";

export function Reports() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const [dateRange, setDateRange] = useState({
        from: "",
        to: new Date().toISOString().split("T")[0],
    });
    const [filterType, setFilterType] = useState<string>("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("date_desc");

    const fetchReports = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                from: dateRange.from,
                to: dateRange.to,
                type: filterType,
                search: searchTerm,
            });
            const data = await apiClient.get<{ invoices: InvoiceRecord[]; summary: ReportSummary }>(
                `/reports?${params.toString()}`
            );
            setInvoices(data.invoices);
            setSummary(data.summary);
        } catch (err: any) {
            console.error(err.message || "Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [dateRange, filterType]);

    // Client-side sorting and additional live filtering
    const sortedAndFilteredInvoices = useMemo(() => {
        let result = [...invoices];

        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            result = result.filter(
                (inv) =>
                    inv.invoice_number.toLowerCase().includes(query) ||
                    inv.customer_name.toLowerCase().includes(query) ||
                    (inv.customer_phone && inv.customer_phone.toLowerCase().includes(query)) ||
                    (inv.items_summary && inv.items_summary.toLowerCase().includes(query))
            );
        }

        result.sort((a, b) => {
            if (sortBy === "date_desc") {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            if (sortBy === "date_asc") {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            }
            if (sortBy === "amount_desc") {
                return b.total - a.total;
            }
            if (sortBy === "amount_asc") {
                return a.total - b.total;
            }
            if (sortBy === "name_asc") {
                return a.customer_name.localeCompare(b.customer_name);
            }
            return 0;
        });

        return result;
    }, [invoices, searchTerm, sortBy]);

    const handleViewInvoiceDetails = (invoice: InvoiceRecord) => {
        const isQuotation = invoice.type === "Quotation";

        navigate("/invoice", {
            state: {
                id: invoice.raw_id || invoice.id,
                created_at: invoice.date,
                isQuotation,
                fromHistory: true,
                items:
                    invoice.items && invoice.items.length > 0
                        ? invoice.items.map((si: any) => ({
                              type: si.product_id ? "Product" : "Service",
                              id: si.product_id || si.service_id,
                              name: si.product?.brand || (si.service?.complaint_type ? "Service" : "Item"),
                              model: si.product?.model || "",
                              price: Number(si.price),
                              quantity: si.quantity,
                              warranty: si.product?.warranty || "N/A",
                          }))
                        : [
                              {
                                  type: invoice.type === "Service" ? "Service" : "Product",
                                  id: invoice.id,
                                  name: invoice.items_summary || invoice.customer_name,
                                  model: "",
                                  price: invoice.total,
                                  quantity: 1,
                                  warranty: "N/A",
                              },
                          ],
                customerInfo: {
                    name: invoice.customer_name,
                    phone: invoice.customer_phone || "",
                    billingAddress: invoice.vehicle_details || "",
                },
                productSubtotal: invoice.amount,
                productGst: invoice.gst,
                finalTotal: invoice.total,
                paymentMethod: invoice.payment_method || invoice.type,
                vehicleNumber: invoice.vehicle_details || "",
            },
        });
    };

    const handleDownloadInvoice = (invoiceId: string) => {
        window.open(`${BASE_URL}/invoices/${invoiceId}/download`, "_blank");
    };

    const handleDownloadReport = async () => {
        try {
            const params = new URLSearchParams({
                from: dateRange.from,
                to: dateRange.to,
                type: filterType,
            });

            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${BASE_URL}/reports/download?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `report_${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            console.error(err.message || "Failed to download report");
            alert("Failed to download report. Please try again.");
        }
    };

    const handleDownloadPdf = async () => {
        try {
            const params = new URLSearchParams({
                from: dateRange.from,
                to: dateRange.to,
                type: filterType,
            });

            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${BASE_URL}/reports/download/pdf?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `report_${new Date().toISOString().split("T")[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            console.error(err.message || "Failed to download PDF report");
            alert("Failed to download PDF report. Please try again.");
        }
    };

    const typeBadges: Record<string, { color: string; icon: any; label: string }> = {
        Sale: { color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400", icon: CreditCard, label: "Bill" },
        Exchange: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", icon: RefreshCw, label: "Exchange" },
        Service: { color: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400", icon: Wrench, label: "Service" },
        Quotation: { color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", icon: FileText, label: "Quotation" },
    };

    return (
        <div className="space-y-6 relative">
            {loading && (
                <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/40 backdrop-blur-[1px] z-50 flex items-center justify-center min-h-[400px]">
                    <CircleLoader size="lg" text="Fetching Reports..." />
                </div>
            )}

            {/* Top Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & History Central</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        All bills, quotations, services, and exchange records stored in one hub
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                        onClick={handleDownloadReport}
                        variant="outline"
                        className="border-gray-200 dark:border-[#2E3B55] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 text-xs py-2"
                    >
                        <Download className="w-4 h-4 text-blue-600" />
                        CSV
                    </Button>
                    <Button
                        onClick={handleDownloadPdf}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 text-xs py-2 shadow-sm"
                    >
                        <FileText className="w-4 h-4" />
                        PDF Report
                    </Button>
                </div>
            </div>

            {/* Summary Analytics Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#1B263B] rounded-xl p-5 border border-gray-200 dark:border-[#2E3B55] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-9 h-9 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Total Revenue</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            ₹{summary.totalSales.toLocaleString()}
                        </h3>
                    </div>

                    <div className="bg-white dark:bg-[#1B263B] rounded-xl p-5 border border-gray-200 dark:border-[#2E3B55] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-9 h-9 bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Est. Profit Margin</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            ₹{summary.totalProfit.toLocaleString()}
                        </h3>
                    </div>

                    <div className="bg-white dark:bg-[#1B263B] rounded-xl p-5 border border-gray-200 dark:border-[#2E3B55] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-9 h-9 bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
                                <Receipt className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Total GST Collected</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            ₹{summary.totalGST.toLocaleString()}
                        </h3>
                    </div>

                    <div className="bg-white dark:bg-[#1B263B] rounded-xl p-5 border border-gray-200 dark:border-[#2E3B55] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-9 h-9 bg-amber-600/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Total Records</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{summary.invoiceCount}</h3>
                    </div>
                </div>
            )}

            {/* Filter Pills & Sorting Control Bar */}
            <div className="bg-white dark:bg-[#1B263B] p-4 rounded-2xl border border-gray-200 dark:border-[#2E3B55] space-y-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Minimal Type Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                        {[
                            { id: "All", label: "All" },
                            { id: "Sale", label: "Bills" },
                            { id: "Quotation", label: "Quotations" },
                            { id: "Service", label: "Services" },
                            { id: "Exchange", label: "Exchanges" },
                        ].map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setFilterType(type.id)}
                                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap border ${
                                    filterType === type.id
                                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                        : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-[#2E3B55] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                                }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    {/* Controls: Search, Sort Dropdown, Filters Toggle */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        {/* Search Bar */}
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search customer, invoice..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl text-xs focus:ring-2 focus:ring-blue-500 dark:text-white outline-none"
                            />
                        </div>

                        {/* Minimal Sort Dropdown */}
                        <div className="relative">
                            <div className="flex items-center bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl px-2.5 py-1.5 gap-1.5">
                                <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer pr-1"
                                    aria-label="Sort History"
                                >
                                    <option value="date_desc">Newest First</option>
                                    <option value="date_asc">Oldest First</option>
                                    <option value="amount_desc">Highest Amount</option>
                                    <option value="amount_asc">Lowest Amount</option>
                                    <option value="name_asc">Customer Name A-Z</option>
                                </select>
                            </div>
                        </div>

                        {/* Date Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
                                showFilters || dateRange.from
                                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                                    : "border-gray-200 dark:border-[#2E3B55] bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                            }`}
                            title="Date Filters"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Collapsible Date Filter Popup */}
                {showFilters && (
                    <div className="pt-4 border-t border-gray-100 dark:border-[#2E3B55] grid grid-cols-1 sm:grid-cols-3 gap-4 items-end animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl text-xs dark:text-white outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl text-xs dark:text-white outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    setDateRange({ from: "", to: new Date().toISOString().split("T")[0] });
                                    setFilterType("All");
                                    setSearchTerm("");
                                }}
                                variant="outline"
                                className="flex-1 text-xs py-1.5"
                            >
                                Reset
                            </Button>
                            <Button
                                onClick={() => {
                                    fetchReports();
                                    setShowFilters(false);
                                }}
                                className="flex-1 bg-blue-600 text-white text-xs py-1.5"
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Invoices & History Table */}
            <div className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-[#2E3B55] bg-gradient-to-r from-gray-50 to-white dark:from-[#1B263B] dark:to-[#0D1B2A] flex justify-between items-center">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-blue-600" />
                        History Records
                    </h2>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#0D1B2A] px-3 py-1 rounded-full border border-gray-200 dark:border-[#2E3B55]">
                        {sortedAndFilteredInvoices.length} Records Found
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80 dark:bg-[#0D1B2A]/80 border-b border-gray-100 dark:border-[#2E3B55]">
                            <tr>
                                <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Record #
                                </th>
                                <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Items Summary
                                </th>
                                <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Total Amount
                                </th>
                                <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {sortedAndFilteredInvoices.map((invoice) => {
                                const badge = typeBadges[invoice.type] || typeBadges.Sale;
                                const Icon = badge.icon;

                                return (
                                    <tr
                                        key={invoice.id}
                                        onClick={() => handleViewInvoiceDetails(invoice)}
                                        className="hover:bg-blue-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-900/40">
                                                {invoice.invoice_number}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400 font-medium">
                                            {new Date(invoice.date).toLocaleDateString()}{" "}
                                            <span className="text-[10px] opacity-70">
                                                {new Date(invoice.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                {invoice.customer_name}
                                            </p>
                                            {invoice.customer_phone && (
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                                    {invoice.customer_phone}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${badge.color}`}
                                            >
                                                <Icon className="w-3 h-3" />
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                            {invoice.items_summary || "N/A"}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                ₹{invoice.total.toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleViewInvoiceDetails(invoice)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadInvoice(invoice.id)}
                                                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Download Invoice"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {sortedAndFilteredInvoices.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400 font-medium text-xs">
                                        No matching history records found. Try adjusting your search or filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
