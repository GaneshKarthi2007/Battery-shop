import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  Wrench,
  IndianRupee,
  AlertTriangle,
  CheckCircle,
  Zap
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDeveloper } from "../contexts/DeveloperContext";
import { apiClient } from "../api/client";
import { CircleLoader } from "../components/ui/CircleLoader";

interface DashboardData {
  todaySales: number;
  totalStock: number;
  pendingServices: number;
  assignedJobs: Array<{
    id: number;
    customer_name: string;
    vehicle_details: string;
    status: string;
    created_at: string;
  }>;
  monthlyProfit: number;
  myActiveJobs: number;
  completedToday: number;
  weeklySales: Array<{ day: string; sales: number; count: number }>;
  lowStockItems: Array<{
    id: number;
    brand: string;
    model: string;
    type: string;
    stock: number;
    min_stock: number;
    price: number;
  }>;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shopConfig } = useDeveloper();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Member';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const dashboardData = await apiClient.get<DashboardData>('/dashboard');
        setData(dashboardData);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Header & Greetings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Shop: <span className="font-medium text-gray-900">{shopConfig.name}</span>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-100 dark:border-[#2E3B55] shadow-sm">
          <CircleLoader size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Sync Error</h3>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
      {/* 2. Primary KPI Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:gap-6">
        {/* Row 1, Left: Admin (Sales) vs Staff (My Active) */}
        {user?.role === 'admin' ? (
          <div className="bg-white dark:bg-[#1B263B] rounded-xl p-4 md:p-5 border border-gray-200 dark:border-[#2E3B55] shadow-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-500">Today's Sales</h3>
              <IndianRupee className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            </div>
            <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100">₹{data?.todaySales.toLocaleString() || '0'}</p>
          </div>
        ) : (
          <div
            onClick={() => navigate('/service')}
            className="bg-white dark:bg-[#1B263B] rounded-xl p-4 md:p-5 border border-gray-200 dark:border-[#2E3B55] cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/30 transition-all shadow-sm dark:hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-500">My Active Jobs</h3>
              <Wrench className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100">{data?.myActiveJobs || '0'}</p>
          </div>
        )}

        {/* Row 1, Right: Pending Services (Shared) */}
        <div
          onClick={() => navigate('/service')}
          className="bg-white dark:bg-[#1B263B] rounded-xl p-4 md:p-5 border border-gray-200 dark:border-[#2E3B55] cursor-pointer hover:border-gray-300 dark:hover:border-white/10 transition-all shadow-sm dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">{user?.role === 'staff' ? 'Queue' : 'Pending Services'}</h3>
            <Wrench className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100">{data?.pendingServices || '0'}</p>
        </div>

        {/* Row 2, Left: Admin (Inventory) vs Staff (Completed Today) */}
        {user?.role === 'admin' ? (
          <div
            onClick={() => navigate('/inventory')}
            className="bg-white dark:bg-[#1B263B] rounded-xl p-4 md:p-5 border border-gray-200 dark:border-[#2E3B55] cursor-pointer hover:border-gray-300 dark:hover:border-white/10 transition-all shadow-sm dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-500">Inventory</h3>
              <Package className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
            </div>
            <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100">{data?.totalStock || '0'}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1B263B] rounded-xl p-4 md:p-5 border border-gray-200 dark:border-[#2E3B55] shadow-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-500">Completed Today</h3>
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
            </div>
            <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 text-emerald-600">{data?.completedToday || '0'}</p>
          </div>
        )}

        {/* Row 2, Right: Admin (Growth) vs Staff (Efficiency) */}
        {user?.role === 'admin' ? (
          <div className="bg-white dark:bg-[#1B263B] rounded-xl p-4 md:p-5 border border-gray-200 dark:border-[#2E3B55] shadow-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-500">Growth Rate</h3>
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
            </div>
            <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100">24.8%</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1B263B] rounded-xl p-4 md:p-5 border border-gray-200 dark:border-[#2E3B55] shadow-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-500">Efficiency</h3>
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
            </div>
            <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100">92%</p>
          </div>
        )}
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <div className="bg-white dark:bg-[#1B263B] rounded-xl border border-gray-200 dark:border-[#2E3B55] p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">{user?.role === 'staff' ? 'My Recent Tasks' : 'Recent Activity'}</h2>
          <div className="space-y-3">
            {data?.assignedJobs && data.assignedJobs.length > 0 ? (
              data.assignedJobs.slice(0, 4).map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/service/${job.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#242424] cursor-pointer transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/5"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 shrink-0">
                    {job.status === 'Completed' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Wrench className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                      {job.customer_name} • {job.vehicle_details}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 uppercase">
                      {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {job.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No tasks assigned yet</p>
            )}
          </div>
        </div>

        {/* Operational Health */}
        <div className="bg-white dark:bg-[#1B263B] rounded-xl border border-gray-200 dark:border-[#2E3B55] p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Operational Health</h2>
          <div className="space-y-5">
            {[
              { label: 'Service Efficiency', val: '92%', color: 'bg-blue-500' },
              { label: 'Customer Satisfaction', val: '96%', color: 'bg-emerald-500' },
              { label: 'Inventory Turnover', val: '80%', color: 'bg-orange-500' }
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900">{item.val}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: item.val }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
