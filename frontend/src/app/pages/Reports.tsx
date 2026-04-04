import { useState, useEffect } from "react";
import { FileText, Download, DollarSign, TrendingUp, Filter, Search, ChevronDown, Calendar, X } from "lucide-react";
import { Button } from "../components/Button";
import { apiClient, BASE_URL } from "../api/client";
import { CircleLoader } from "../components/ui/CircleLoader";

interface Invoice {
  id: string;
  invoice_number: string;
  date: string;
  customer_name: string;
  type: "Sale" | "Exchange" | "Service";
  items_summary: string;
  amount: number;
  gst: number;
  total: number;
}

interface ReportSummary {
  totalSales: number;
  totalGST: number;
  totalProfit: number;
  invoiceCount: number;
  salesByType: {
    Sale: number;
    Exchange: number;
    Service: number;
  };
}

export function Reports() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [dateRange, setDateRange] = useState({
    from: "",
    to: new Date().toISOString().split('T')[0]
  });
  const [filterType, setFilterType] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
        type: filterType,
        search: searchTerm
      });
      const data = await apiClient.get<{ invoices: Invoice[], summary: ReportSummary }>(`/reports?${params.toString()}`);
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

  const handleDownloadInvoice = (invoiceId: string) => {
    window.open(`${BASE_URL}/invoices/${invoiceId}/download`, '_blank');
  };

  const handleDownloadReport = async () => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
        type: filterType
      });

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BASE_URL}/reports/download?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
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
        type: filterType
      });

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BASE_URL}/reports/download/pdf?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error(err.message || "Failed to download PDF report");
      alert("Failed to download PDF report. Please try again.");
    }
  };

  const typeConfig = {
    Sale: { color: "bg-blue-100 text-blue-700", label: "Sale" },
    Exchange: { color: "bg-green-100 text-green-700", label: "Exchange" },
    Service: { color: "bg-purple-100 text-purple-700", label: "Service" },
  };


  return (
    <div className="space-y-6 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-50 flex items-center justify-center min-h-[400px]">
          <CircleLoader size="lg" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Billing</h1>
          <p className="text-gray-600 mt-1">View sales reports and download records</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleDownloadReport}
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            CSV Report
          </Button>
          <Button
            onClick={handleDownloadPdf}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            PDF Report
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#1B263B] rounded-xl p-6 border border-gray-200 dark:border-[#2E3B55]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Sales</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{summary.totalSales.toLocaleString()}</h3>
          </div>

          <div className="bg-white dark:bg-[#1B263B] rounded-xl p-6 border border-gray-200 dark:border-[#2E3B55]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Est. Profit</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{summary.totalProfit.toLocaleString()}</h3>
          </div>

          <div className="bg-white dark:bg-[#1B263B] rounded-xl p-6 border border-gray-200 dark:border-[#2E3B55]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total GST</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{summary.totalGST.toLocaleString()}</h3>
          </div>

          <div className="bg-white dark:bg-[#1B263B] rounded-xl p-6 border border-gray-200 dark:border-[#2E3B55]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Invoices</p>
            <h3 className="text-2xl font-bold text-gray-900">{summary.invoiceCount}</h3>
          </div>
        </div>
      )}

      {summary && (
        <div className="bg-white dark:bg-[#1B263B] rounded-xl p-6 border border-gray-200 dark:border-[#2E3B55]">
          <h2 className="font-bold text-gray-900 mb-4">Sales Breakdown by Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Battery Sales</p>
              <p className="text-xl font-bold text-blue-700">₹{summary.salesByType.Sale.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600 mb-1">Exchange Sales</p>
              <p className="text-xl font-bold text-green-700">₹{summary.salesByType.Exchange.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Service Revenue</p>
              <p className="text-xl font-bold text-purple-700">₹{summary.salesByType.Service.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-[#1B263B] p-4 rounded-2xl border border-gray-200 dark:border-[#2E3B55]">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
        </div>

        <div className="relative w-full md:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full md:w-auto flex items-center justify-between gap-3 px-6 py-3 rounded-xl border-2 transition-all font-bold text-sm ${
              showFilters 
                ? "border-blue-600 bg-blue-50 text-blue-700" 
                : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {(filterType !== 'All' || searchTerm) && (
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowFilters(false)}
              ></div>
              <div className="absolute right-0 top-full mt-3 w-full md:w-[480px] bg-white dark:bg-[#0D1B2A] rounded-2xl border border-gray-100 dark:border-[#2E3B55] p-6 z-20 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-blue-600" />
                    Refine Results
                  </h3>
                  <button onClick={() => setShowFilters(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                      <Calendar className="w-3 h-3" />
                      From Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                      <Calendar className="w-3 h-3" />
                      To Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Invoice Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["All", "Sale", "Exchange", "Service"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                            filterType === type 
                              ? "bg-blue-600 border-blue-600 text-white" 
                              : "bg-gray-50 border-gray-50 text-gray-500 hover:border-gray-200"
                          }`}
                        >
                          {type === 'All' ? 'All Types' : type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 flex gap-3">
                  <Button
                    onClick={() => {
                      setFilterType("All");
                      setDateRange({
                        from: "",
                        to: new Date().toISOString().split('T')[0]
                      });
                    }}
                    variant="outline"
                    className="flex-1 py-3 rounded-xl font-bold text-gray-500"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() => {
                      fetchReports();
                      setShowFilters(false);
                    }}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1B263B] rounded-xl border border-gray-200 dark:border-[#2E3B55] overflow-hidden min-h-[400px] relative">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="font-bold text-gray-900">Invoice History</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {invoices.length} invoices
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => {
                const config = typeConfig[invoice.type as keyof typeof typeConfig] || typeConfig.Sale;
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{invoice.customer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{invoice.items_summary}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">₹{invoice.total.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-gray-500 font-medium italic">
                    No invoices found for the selected criteria.
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
