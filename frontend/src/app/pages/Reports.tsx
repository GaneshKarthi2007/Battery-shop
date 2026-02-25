import { useState, useEffect } from "react";
import { FileText, Download, DollarSign, TrendingUp, Filter, Search } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { apiClient, BASE_URL } from "../api/client";
import { BatteryLoader } from "../components/ui/BatteryLoader";

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

  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
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
    <div className="space-y-6">
      {loading && <BatteryLoader />}
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
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Sales</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{summary.totalSales.toLocaleString()}</h3>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Est. Profit</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{summary.totalProfit.toLocaleString()}</h3>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total GST</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{summary.totalGST.toLocaleString()}</h3>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
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
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
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

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="font-bold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Types</option>
              <option value="Sale">Sale</option>
              <option value="Exchange">Exchange</option>
              <option value="Service">Service</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <form onSubmit={(e) => { e.preventDefault(); fetchReports(); }} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Customer or Invoice #"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11"
              />
            </form>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] relative">
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
