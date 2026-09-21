import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  Wrench,
  IndianRupee,
  AlertTriangle,
  Calendar,
  Filter
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
  const [timeframe, setTimeframe] = useState<string>(() => {
    return localStorage.getItem("sales_analytics_timeframe") || "7days";
  });

  const handleTimeframeChange = (newTf: string) => {
    setTimeframe(newTf);
    localStorage.setItem("sales_analytics_timeframe", newTf);
  };

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
      {/* Header & Greetings with Compact Timeframe Filter */}
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
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
            <select
              value={timeframe}
              onChange={(e) => handleTimeframeChange(e.target.value)}
              className="bg-transparent text-xs font-black text-gray-900 dark:text-gray-100 focus:outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="7days">7 Days</option>
              <option value="month">This Month</option>
              <option value="all_time">All Time</option>
            </select>
          </div>
          <div className="text-xs text-gray-500 font-bold bg-gray-100 dark:bg-[#1E293B] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
            {shopConfig.name}
          </div>
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
          {/* Executive Overview Cards */}
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

            {/* Card 3: Service Orders (Replaced Pending Payments) */}
            <div
              onClick={() => navigate('/service')}
              className="bg-white dark:bg-[#15161E] rounded-2xl p-5 border border-gray-100 dark:border-[#2E3B55] shadow-sm cursor-pointer hover:border-blue-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Service Orders</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
                {data?.todayServicesCount || 0}
              </p>
              <span className="text-[11px] font-bold text-blue-600 mt-2 block">Orders today</span>
            </div>

            {/* Card 4: Low Stock Alerts (Replaced Battery Exchanges) */}
            <div
              onClick={() => navigate('/inventory')}
              className="bg-white dark:bg-[#15161E] rounded-2xl p-5 border border-gray-100 dark:border-[#2E3B55] shadow-sm cursor-pointer hover:border-red-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Low Stock Alerts</span>
                <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-red-600">
                {data?.lowStockCount || 0} <span className="text-xs font-bold text-red-500">items</span>
              </p>
              <span className="text-[11px] font-bold text-red-500 mt-2 block">Requires restock</span>
            </div>
          </div>

          {/* Sales & Profit Analytics Graph */}
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

          {/* Top Selling Batteries Widget (Full-Width) */}
          <div className="bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] p-6 shadow-sm">
            <h2 className="text-base font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" /> Top-Selling Batteries
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <p className="text-xs text-gray-400 text-center py-6 font-bold md:col-span-2">No product sales yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

