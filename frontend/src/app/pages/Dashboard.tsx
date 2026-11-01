import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  Wrench,
  IndianRupee,
  AlertTriangle,
  Calendar,
  Filter,
  Users,
  ChevronRight,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../api/client";
import { CircleLoader } from "../components/ui/CircleLoader";

export interface RecentActivityItem {
  id: number;
  type: "Sale" | "Service" | "Exchange" | string;
  customer_name: string;
  amount: number;
  status: string;
  date: string;
  created_at: string;
}

export interface TrendDataItem {
  date: string;
  day?: number;
  sales: number;
  services?: number;
  services_count?: number;
  profit: number;
  count: number;
}

export interface DashboardData {
  todaySales: number;
  todayProfit: number;
  pendingPayments: number;
  todayExchangesCount: number;
  todayExchangesValue: number;
  todayServicesCount: number;
  lowStockCount: number;
  outstandingCustomerBalance: number;
  totalCustomers?: number;
  filterSales?: number;
  recentActivity?: RecentActivityItem[];
  activeUsersCount?: number;
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
  trendData: TrendDataItem[];
  totalStock: number;
  pendingServices: number;
  myActiveJobs: number;
  completedToday: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user?.name || "User";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeframe, setTimeframe] = useState<string>(() => {
    return localStorage.getItem("sales_analytics_timeframe") || "today";
  });
  const [hoveredDay, setHoveredDay] = useState<{ day: number; amount: number } | null>(null);

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

  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString("en-US", { month: "long" });

  // Current formatted Date and Day: e.g. "01 Nov 2026, Sunday"
  const formattedDateAndDay = currentDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "long",
  });

  // Sales value depending on selected filter
  const salesValue = timeframe === "today" 
    ? (data?.todaySales ?? 0)
    : (data?.filterSales ?? data?.timeframeSales ?? data?.todaySales ?? 0);

  // Monthwise Chart Data normalized across 30 days
  const rawChartData = data?.trendData || [];
  const maxRecorded = Math.max(...rawChartData.map((d) => d.sales || 0), 0);
  const isZeroData = maxRecorded === 0;

  // Build 30 points (days 1 to 30) for the line chart
  const daysInGraph = 30;
  const dailyValues: number[] = Array.from({ length: daysInGraph }, (_, i) => {
    const dayNum = i + 1;
    const match = rawChartData.find((d) => d.day === dayNum);
    return match ? match.sales : 0;
  });

  // Calculate SVG line coordinates
  const svgWidth = 600;
  const svgHeight = 160;
  const midY = 80; // 0.0 baseline

  const points = dailyValues.map((val, idx) => {
    const x = (idx / (daysInGraph - 1)) * svgWidth;
    let y = midY;
    if (!isZeroData && maxRecorded > 0) {
      y = midY - (val / maxRecorded) * 65;
    }
    return { x, y, day: idx + 1, amount: val };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  // Fallback Recent Activities if empty
  const activities: RecentActivityItem[] = (data?.recentActivity && data.recentActivity.length > 0)
    ? data.recentActivity.slice(0, 5)
    : [
        {
          id: 1,
          type: "Sale",
          customer_name: "Walk-in Customer",
          amount: data?.todaySales || 0,
          status: "Completed",
          date: "Today, 10:30 AM",
          created_at: new Date().toISOString(),
        },
      ];

  return (
    <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-300">
      {/* 1. Compact Welcome Bar with User Name, Date, and Filter */}
      <div className="bg-white dark:bg-[#15161E] rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 border border-gray-200/80 dark:border-[#2E3B55] shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight truncate">
            Welcome Back, <span className="text-blue-600 dark:text-blue-400">{userName}</span>
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium pl-3 border-l border-gray-200 dark:border-gray-700 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>({formattedDateAndDay})</span>
          </span>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-lg transition-all hover:border-blue-400">
            <Filter className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
            <select
              value={timeframe}
              onChange={(e) => handleTimeframeChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-none cursor-pointer pr-1"
              aria-label="Filter timeframe"
            >
              <option value="today">Today</option>
              <option value="7days">7 Days</option>
              <option value="month">Month</option>
              <option value="all_time">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white dark:bg-[#15161E] rounded-xl border border-gray-200/80 dark:border-[#2E3B55] shadow-2xs">
          <CircleLoader size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-4 text-center">
          <AlertTriangle className="w-7 h-7 text-red-500 mx-auto mb-1" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">Failed to Load Dashboard</h3>
          <p className="text-red-500 text-xs mb-2 font-medium">{error}</p>
          <button
            onClick={() => fetchDashboardData(timeframe)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <>
          {/* 2. Side-by-Side 3 Metric Cards in SAME LINE (Reduced compact size) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {/* Card 1: Today sales (depend on filter) */}
            <div
              onClick={() => navigate("/sales")}
              className="bg-white dark:bg-[#15161E] rounded-xl p-3 sm:p-3.5 border border-gray-200/80 dark:border-[#2E3B55] shadow-2xs hover:shadow-xs hover:border-blue-400 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block truncate">
                    Today sales
                  </span>
                  <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 truncate block">
                    (depend on filter)
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center ring-1 ring-blue-100 dark:ring-blue-800 shrink-0">
                  <IndianRupee className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight truncate">
                  ₹{salesValue.toLocaleString("en-IN")}
                </p>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-600 transition-colors shrink-0" />
              </div>
              <span className="text-[9px] font-medium text-emerald-600 truncate block mt-0.5">
                {timeframe === "today" ? "Sales today" : `Period: ${timeframe}`}
              </span>
            </div>

            {/* Card 2: Pending Services */}
            <div
              onClick={() => navigate("/service")}
              className="bg-white dark:bg-[#15161E] rounded-xl p-3 sm:p-3.5 border border-gray-200/80 dark:border-[#2E3B55] shadow-2xs hover:shadow-xs hover:border-amber-400 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block truncate">
                    Pending Services
                  </span>
                  <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 truncate block">
                    Active Queue
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center ring-1 ring-amber-100 dark:ring-amber-800 shrink-0">
                  <Wrench className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight truncate">
                  {(data?.pendingServices ?? 0).toLocaleString()}
                </p>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-amber-600 transition-colors shrink-0" />
              </div>
              <span className="text-[9px] font-medium text-amber-600 truncate block mt-0.5">
                Awaiting resolution
              </span>
            </div>

            {/* Card 3: Total Customers (depend on filter) */}
            <div
              onClick={() => navigate("/customers")}
              className="bg-white dark:bg-[#15161E] rounded-xl p-3 sm:p-3.5 border border-gray-200/80 dark:border-[#2E3B55] shadow-2xs hover:shadow-xs hover:border-purple-400 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block truncate">
                    Total Customers
                  </span>
                  <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-400 truncate block">
                    (depend on filter)
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center ring-1 ring-purple-100 dark:ring-purple-800 shrink-0">
                  <Users className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight truncate">
                  {(data?.totalCustomers ?? 0).toLocaleString()}
                </p>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-purple-600 transition-colors shrink-0" />
              </div>
              <span className="text-[9px] font-medium text-purple-600 truncate block mt-0.5">
                Served in timeframe
              </span>
            </div>
          </div>

          {/* 3. Graph and Recent Activity SIDE BY SIDE (Single viewport height, no scroll) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
            {/* Left: Collection Graph */}
            <div className="lg:col-span-7 bg-white dark:bg-[#15161E] rounded-xl p-3.5 sm:p-4 border border-gray-100 dark:border-[#2E3B55] shadow-2xs flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    Collection - {currentMonthName}
                  </h2>
                  <p className="text-[11px] text-gray-400 font-normal">
                    Settled collections only
                  </p>
                </div>
                {/* Hollow cyan status indicator */}
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 border-[#29B6F6] shrink-0 mt-0.5"
                  title="Settled collections live sync"
                />
              </div>

              {/* Chart Visual with Y-axis (1.0, 0.5, 0.0, -0.5, -1.0) and X-axis (5, 10, 15, 20, 25, 30) */}
              <div className="relative pt-1 pb-1">
                <div className="flex h-36 sm:h-44 w-full">
                  {/* Left Y-Axis Labels */}
                  <div className="flex flex-col justify-between items-end pr-2 pb-5 text-[11px] text-gray-400 font-normal select-none shrink-0 w-7">
                    <span>1.0</span>
                    <span>0.5</span>
                    <span>0.0</span>
                    <span>-0.5</span>
                    <span>-1.0</span>
                  </div>

                  {/* SVG Canvas Area */}
                  <div className="flex-1 flex flex-col justify-between relative pb-5 pl-1">
                    {/* Horizontal Background Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-5">
                      <div className="border-b border-gray-100/90 dark:border-gray-800/80 w-full" />
                      <div className="border-b border-gray-100/90 dark:border-gray-800/80 w-full" />
                      <div className="border-b border-gray-100/90 dark:border-gray-800/80 w-full" />
                      <div className="border-b border-gray-100/90 dark:border-gray-800/80 w-full" />
                      <div className="border-b border-gray-100/90 dark:border-gray-800/80 w-full" />
                    </div>

                    {/* SVG Line */}
                    <div className="w-full h-full relative z-10">
                      <svg
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        preserveAspectRatio="none"
                        className="w-full h-full overflow-visible"
                      >
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#5DADE2"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Interactive hover points */}
                        {points.map((pt) => (
                          <circle
                            key={pt.day}
                            cx={pt.x}
                            cy={pt.y}
                            r={hoveredDay?.day === pt.day ? 4 : 2}
                            fill="#5DADE2"
                            className="cursor-pointer transition-all hover:scale-125"
                            onMouseEnter={() => setHoveredDay({ day: pt.day, amount: pt.amount })}
                            onMouseLeave={() => setHoveredDay(null)}
                          />
                        ))}
                      </svg>

                      {/* Tooltip on hover */}
                      {hoveredDay && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-0.5 rounded shadow z-20 pointer-events-none whitespace-nowrap">
                          Day {hoveredDay.day}: ₹{hoveredDay.amount.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* X-Axis Numbers (5, 10, 15, 20, 25, 30) */}
                    <div className="absolute -bottom-0.5 inset-x-0 flex justify-between text-[11px] text-gray-500 dark:text-gray-400 font-normal select-none px-3 sm:px-5">
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                      <span>25</span>
                      <span>30</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Recent Activity (For recent 5) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#15161E] rounded-xl p-3.5 sm:p-4 border border-gray-100 dark:border-[#2E3B55] shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                      Recent Activity
                    </h2>
                    <p className="text-[11px] text-gray-400 font-normal">
                      (For recent 5)
                    </p>
                  </div>
                  <span className="p-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400">
                    <Layers className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Vertical Timeline with Connected Nodes */}
                <div className="relative pl-4 py-1 space-y-2">
                  {/* Continuous Vertical Connecting Line */}
                  <div className="absolute left-[5px] top-2.5 bottom-2.5 w-0.5 bg-gray-200 dark:bg-gray-700" />

                  {activities.map((act, index) => {
                    const isSale = act.type === "Sale";
                    const isService = act.type === "Service";

                    const dotColor = isSale
                      ? "bg-blue-600 ring-blue-100 dark:ring-blue-900/40"
                      : isService
                      ? "bg-amber-500 ring-amber-100 dark:ring-amber-900/40"
                      : "bg-emerald-500 ring-emerald-100 dark:ring-emerald-900/40";

                    const badgeColor = isSale
                      ? "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400"
                      : isService
                      ? "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400"
                      : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400";

                    const targetRoute = isSale ? "/sales" : isService ? "/service" : "/exchange";

                    return (
                      <div
                        key={act.id ? `${act.type}-${act.id}` : index}
                        onClick={() => navigate(targetRoute)}
                        className="relative group cursor-pointer"
                      >
                        {/* Circular Node / Dot */}
                        <div
                          className={`absolute -left-[15px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 transition-transform group-hover:scale-125 ${dotColor}`}
                        />

                        {/* Node Content */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-medium text-gray-400 block truncate leading-none mb-0.5">
                              {act.date}
                            </span>
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {act.type}{" "}
                              <span className="text-gray-500 dark:text-gray-400 font-normal">
                                ({act.customer_name})
                              </span>
                            </p>
                          </div>

                          {/* Amount pill */}
                          {act.amount > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${badgeColor}`}>
                              ₹{act.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Quick Hub Links */}
              <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] font-bold">
                <button
                  onClick={() => navigate("/reports")}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  Activity Ledger <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => navigate("/service")}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  Service Jobs
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
