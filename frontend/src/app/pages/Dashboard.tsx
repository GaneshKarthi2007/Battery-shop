import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  Wrench,
  IndianRupee,
  AlertTriangle,
  RefreshCcw,
  Clock,
  Users,
  PieChart,
  Calendar,
  Layers
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDeveloper } from "../contexts/DeveloperContext";
import { apiClient } from "../api/client";
import { CircleLoader } from "../components/ui/CircleLoader";

interface DashboardData {
  todaySales: number;
  todayProfit: number;
  pendingPayments: number;
  todayExchangesCount: number;
  todayExchangesValue: number;
  todayServicesCount: number;
  lowStockCount: number;
  outstandingCustomerBalance: number;
  timeframe: string;
  timeframeSales: number;
  paymentMethodBreakdown: Record<string, { count: number; total: number }>;
  gstBreakdown: {
    gstSalesCount: number;
    gstTotalAmount: number;
    gstTaxAmount: number;
    nonGstSalesCount: number;
    nonGstTotalAmount: number;
  };
  topSellingBatteries: Array<{
    brand: string;
    model: string;
    ah: string;
    total_qty: number;
    total_revenue: number;
  }>;
  trendData: Array<{
    date: string;
    sales: number;
    profit: number;
    count: number;
  }>;
  totalStock: number;
  pendingServices: number;
  myActiveJobs: number;
  completedToday: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shopConfig } = useDeveloper();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Member';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeframe, setTimeframe] = useState<"today" | "7days" | "month" | "custom">("7days");

  const fetchDashboardData = async (tf: string) => {
    setLoading(true);
    try {
      const dashboardData = await apiClient.get<DashboardData>(`/dashboard?timeframe=${tf}`);
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(timeframe);
  }, [timeframe]);

  const maxTrendSales = data?.trendData ? Math.max(...data.trendData.map(d => d.sales), 1000) : 1000;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* 1. Header & Greetings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#15161E] p-6 rounded-2xl border border-gray-100 dark:border-[#2E3B55] shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-xs font-semibold text-gray-500 mt-1 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customers')}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center gap-2 border border-blue-100 dark:border-blue-800"
          >
            <Users className="w-4 h-4" /> Customer Directory
          </button>
          <div className="text-xs text-gray-500 font-bold bg-gray-100 dark:bg-[#1E293B] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
            {shopConfig.name}
          </div>
        </div>
      </div>

      {/* 2. Timeframe Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-[#0D1B2A] p-2 rounded-2xl border border-gray-200 dark:border-[#2E3B55]">
        <div className="text-xs font-black uppercase tracking-wider text-gray-500 px-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-500" /> Sales Analytics Period:
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {[
            { key: "today", label: "Today" },
            { key: "7days", label: "7 Days" },
            { key: "month", label: "This Month" },
          ].map((tf) => (
            <button
              key={tf.key}
              onClick={() => setTimeframe(tf.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                timeframe === tf.key
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-black"
                  : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-[#15161E]"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] shadow-sm">
          <CircleLoader size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Sync Error</h3>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData(timeframe)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* 3. Executive Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Sales */}
            <div className="bg-white dark:bg-[#15161E] rounded-2xl p-5 border border-gray-100 dark:border-[#2E3B55] shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Sales</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
                ₹{data?.todaySales.toLocaleString() || '0'}
              </p>
              <span className="text-[11px] font-bold text-emerald-600 mt-2 block">Revenue today</span>
            </div>

            {/* Card 2: Today's Profit */}
            <div className="bg-white dark:bg-[#15161E] rounded-2xl p-5 border border-gray-100 dark:border-[#2E3B55] shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Profit</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600">
                ₹{data?.todayProfit.toLocaleString() || '0'}
              </p>
              <span className="text-[11px] font-bold text-gray-400 mt-2 block">Net margin today</span>
            </div>

            {/* Card 3: Pending Payments */}
            <div
              onClick={() => navigate('/reports')}
              className="bg-white dark:bg-[#15161E] rounded-2xl p-5 border border-gray-100 dark:border-[#2E3B55] shadow-sm cursor-pointer hover:border-orange-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Payments</span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-orange-600">
                ₹{data?.pendingPayments.toLocaleString() || '0'}
              </p>
              <span className="text-[11px] font-bold text-orange-500 mt-2 block">Uncollected balance</span>
            </div>

            {/* Card 4: Battery Exchanges */}
            <div
              onClick={() => navigate('/exchange')}
              className="bg-white dark:bg-[#15161E] rounded-2xl p-5 border border-gray-100 dark:border-[#2E3B55] shadow-sm cursor-pointer hover:border-purple-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Battery Exchanges</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
                  <RefreshCcw className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
                {data?.todayExchangesCount || 0} <span className="text-xs text-purple-500 font-bold">(₹{data?.todayExchangesValue.toLocaleString() || '0'})</span>
              </p>
              <span className="text-[11px] font-bold text-purple-600 mt-2 block">Old batteries traded</span>
            </div>
          </div>

          {/* Secondary Overview Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#15161E] rounded-2xl p-4 border border-gray-100 dark:border-[#2E3B55] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Service Orders</span>
                <p className="text-xl font-black text-gray-900 dark:text-gray-100">{data?.todayServicesCount || 0}</p>
              </div>
              <Wrench className="w-6 h-6 text-blue-500" />
            </div>

            <div
              onClick={() => navigate('/inventory')}
              className="bg-white dark:bg-[#15161E] rounded-2xl p-4 border border-gray-100 dark:border-[#2E3B55] flex items-center justify-between cursor-pointer hover:border-red-300"
            >
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Low Stock Alerts</span>
                <p className="text-xl font-black text-red-600">{data?.lowStockCount || 0} items</p>
              </div>
              <Package className="w-6 h-6 text-red-500" />
            </div>

            <div
              onClick={() => navigate('/customers')}
              className="bg-white dark:bg-[#15161E] rounded-2xl p-4 border border-gray-100 dark:border-[#2E3B55] flex items-center justify-between cursor-pointer hover:border-emerald-300"
            >
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Outstanding Balance</span>
                <p className="text-xl font-black text-gray-900 dark:text-gray-100">₹{data?.outstandingCustomerBalance.toLocaleString() || '0'}</p>
              </div>
              <Users className="w-6 h-6 text-emerald-500" />
            </div>
          </div>

          {/* 4. Sales & Profit Analytics Graph */}
          <div className="bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                  Sales & Profit Analytics
                </h2>
                <p className="text-xs text-gray-400 font-medium">Revenue and estimated profit trends over selected timeframe</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600"></span> Sales</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Profit</span>
              </div>
            </div>

            {/* SVG Visual Trend Chart */}
            <div className="h-56 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-gray-100 dark:border-[#2E3B55]">
              {data?.trendData && data.trendData.length > 0 ? (
                data.trendData.map((item, idx) => {
                  const salesHeightPercent = Math.min(100, Math.max(12, (item.sales / maxTrendSales) * 100));
                  const profitHeightPercent = Math.min(100, Math.max(8, (item.profit / maxTrendSales) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1.5 h-full">
                        {/* Sales Bar */}
                        <div
                          style={{ height: `${salesHeightPercent}%` }}
                          className="w-1/2 bg-blue-600 dark:bg-blue-500 rounded-t-lg transition-all group-hover:bg-blue-700 relative"
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10 font-bold">
                            ₹{item.sales.toLocaleString()}
                          </div>
                        </div>
                        {/* Profit Bar */}
                        <div
                          style={{ height: `${profitHeightPercent}%` }}
                          className="w-1/2 bg-emerald-500 rounded-t-lg transition-all group-hover:bg-emerald-600 relative"
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 truncate w-full text-center">{item.date}</span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">
                  No sales recorded in this timeframe
                </div>
              )}
            </div>
          </div>

          {/* 5. Widgets Grid: Top Selling Batteries & Payment Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top-Selling Batteries */}
            <div className="lg:col-span-2 bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] p-6 shadow-sm">
              <h2 className="text-base font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" /> Top-Selling Batteries
              </h2>
              <div className="space-y-3">
                {data?.topSellingBatteries && data.topSellingBatteries.length > 0 ? (
                  data.topSellingBatteries.map((battery, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#1E293B]/50 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {battery.brand} {battery.model}
                          </p>
                          <span className="text-xs text-gray-400 font-medium">{battery.ah} Capacity</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-gray-900 dark:text-gray-100 block">
                          {battery.total_qty} Sold
                        </span>
                        <span className="text-xs text-emerald-600 font-bold">₹{battery.total_revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-6 font-bold">No product sales yet</p>
                )}
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-500" /> Payment Methods
                </h2>
                <div className="space-y-3">
                  {Object.entries(data?.paymentMethodBreakdown || {}).map(([method, info]) => (
                    <div key={method} className="flex items-center justify-between text-xs font-bold">
                      <span className="uppercase text-gray-500">{method}</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {info.count} txns ({'₹' + info.total.toLocaleString()})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* GST vs Non-GST Summary */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#2E3B55]">
                <span className="text-xs font-black uppercase text-gray-400 block mb-2">Tax Structure Distribution</span>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-xl border border-blue-100 dark:border-blue-800">
                    <span className="text-blue-600 dark:text-blue-400 font-black block">GST Invoices</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">₹{data?.gstBreakdown?.gstTotalAmount.toLocaleString() || '0'}</span>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-2.5 rounded-xl">
                    <span className="text-gray-500 font-black block">Non-GST</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">₹{data?.gstBreakdown?.nonGstTotalAmount.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
