import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  Wrench,
  IndianRupee,
  AlertTriangle,
  Calendar,
  Users,
  FileText,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Briefcase,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDeveloper } from "../contexts/DeveloperContext";
import { apiClient } from "../api/client";
import { CircleLoader } from "../components/ui/CircleLoader";

interface ManagerDashboardData {
  todaySales: number;
  todayProfit: number;
  pendingPayments: number;
  todayExchangesCount: number;
  todayExchangesValue: number;
  todayServicesCount: number;
  lowStockCount: number;
  outstandingCustomerBalance: number;
  timeframeSales: number;
  totalStock: number;
  pendingServices: number;
  serviceStats: {
    unassigned: number;
    pendingPayments: number;
    escalated: number;
  };
  lowStockItems: Array<{
    id: number;
    name: string;
    brand: string;
    model: string;
    stock: number;
    min_stock: number;
  }>;
}

export function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shopConfig } = useDeveloper();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Manager';

  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchManagerData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ManagerDashboardData>('/dashboard?timeframe=today');
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load manager dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header Banner for Manager */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-950 to-[#0D1B2A] p-6 sm:p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Briefcase className="w-3.5 h-3.5" /> Operations Manager Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Manager Control Center
          </h1>
          <p className="text-xs sm:text-sm font-medium text-blue-200 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Welcome, {firstName} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95"
          >
            <Users className="w-4 h-4" /> Customer Management
          </button>
          <div className="text-xs font-black bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-xl text-white">
            {shopConfig.name}
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
      </div>

      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] shadow-sm">
          <CircleLoader size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Sync Error</h3>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchManagerData}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Key Executive Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's Sales */}
            <div
              onClick={() => navigate('/sales')}
              className="bg-white dark:bg-[#15161E] rounded-2xl p-5 border border-gray-100 dark:border-[#2E3B55] shadow-sm cursor-pointer hover:border-blue-400 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Revenue</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
                ₹{data?.todaySales.toLocaleString() || '0'}
              </p>
              <span className="text-[11px] font-bold text-emerald-600 mt-2 block">Sales & Billing today</span>
            </div>

            {/* Active Services */}
            <div
              onClick={() => navigate('/service')}
              className="bg-white dark:bg-[#15161E] rounded-2xl p-5 border border-gray-100 dark:border-[#2E3B55] shadow-sm cursor-pointer hover:border-indigo-400 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Services</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
                {data?.pendingServices || 0}
              </p>
              <span className="text-[11px] font-bold text-indigo-600 mt-2 block">Pending & Work in Progress</span>
            </div>

            {/* Low Stock Alerts */}
            <div
              onClick={() => navigate('/inventory')}
              className="bg-white dark:bg-[#15161E] rounded-2xl p-5 border border-gray-100 dark:border-[#2E3B55] shadow-sm cursor-pointer hover:border-red-400 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Low Stock Alerts</span>
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-red-600">
                {data?.lowStockCount || 0} <span className="text-xs font-bold text-red-500">items</span>
              </p>
              <span className="text-[11px] font-bold text-red-500 mt-2 block">Requires restock order</span>
            </div>

            {/* Outstanding Customer Balances */}
            <div
              onClick={() => navigate('/customers')}
              className="bg-white dark:bg-[#15161E] rounded-2xl p-5 border border-gray-100 dark:border-[#2E3B55] shadow-sm cursor-pointer hover:border-amber-400 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outstanding Balance</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                ₹{data?.outstandingCustomerBalance.toLocaleString() || '0'}
              </p>
              <span className="text-[11px] font-bold text-amber-600 mt-2 block">Pending Customer Credit</span>
            </div>
          </div>

          {/* Manager Module Action Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Services & Technician Management Module */}
            <div className="bg-white dark:bg-[#15161E] rounded-[2rem] border border-gray-100 dark:border-[#2E3B55] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        Services Oversight
                      </h2>
                      <p className="text-xs text-gray-500">Track complaints, technician jobs & service billing</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/services/new')}
                    className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Request
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="bg-gray-50 dark:bg-[#0D1B2A] p-3 rounded-xl text-center border border-gray-100 dark:border-[#2E3B55]">
                    <span className="text-xs font-bold text-gray-400 uppercase block">Unassigned</span>
                    <span className="text-lg font-black text-amber-600">{data?.serviceStats?.unassigned || 0}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0D1B2A] p-3 rounded-xl text-center border border-gray-100 dark:border-[#2E3B55]">
                    <span className="text-xs font-bold text-gray-400 uppercase block">Pending Payment</span>
                    <span className="text-lg font-black text-blue-600">{data?.serviceStats?.pendingPayments || 0}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0D1B2A] p-3 rounded-xl text-center border border-gray-100 dark:border-[#2E3B55]">
                    <span className="text-xs font-bold text-gray-400 uppercase block">Escalated</span>
                    <span className="text-lg font-black text-red-600">{data?.serviceStats?.escalated || 0}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/service')}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-[#1E293B] hover:bg-gray-200 dark:hover:bg-[#25334D] text-gray-900 dark:text-white rounded-xl text-xs font-bold transition-all"
              >
                Open Service Management Console <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Billing, Invoices & Sales Module */}
            <div className="bg-white dark:bg-[#15161E] rounded-[2rem] border border-gray-100 dark:border-[#2E3B55] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        Billing & Invoicing
                      </h2>
                      <p className="text-xs text-gray-500">POS checkout, battery exchanges & sales ledger</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/sales')}
                    className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Sale
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 my-4">
                  <div
                    onClick={() => navigate('/exchange')}
                    className="bg-gray-50 dark:bg-[#0D1B2A] p-3.5 rounded-xl border border-gray-100 dark:border-[#2E3B55] cursor-pointer hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                      <RefreshCcw className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Battery Exchange</span>
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white block">
                      {data?.todayExchangesCount || 0} Exchanges Today
                    </span>
                  </div>

                  <div
                    onClick={() => navigate('/warranty')}
                    className="bg-gray-50 dark:bg-[#0D1B2A] p-3.5 rounded-xl border border-gray-100 dark:border-[#2E3B55] cursor-pointer hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Warranty Claims</span>
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white block">
                      Manage Serial Claims
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/customers')}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-[#1E293B] hover:bg-gray-200 dark:hover:bg-[#25334D] text-gray-900 dark:text-white rounded-xl text-xs font-bold transition-all"
              >
                View Customer Profiles & Ledger <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Restock & Low Inventory Warning Banner */}
          {data?.lowStockItems && data.lowStockItems.length > 0 && (
            <div className="bg-white dark:bg-[#15161E] rounded-2xl border border-red-100 dark:border-red-900/30 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-red-600 uppercase tracking-tight flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Low Stock Inventory Items ({data.lowStockItems.length})
                </h3>
                <button
                  onClick={() => navigate('/inventory')}
                  className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider"
                >
                  Manage Stock
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {data.lowStockItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/20 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{item.brand} {item.model}</p>
                      <span className="text-[10px] text-gray-500">{item.name}</span>
                    </div>
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-xs font-black">
                      {item.stock} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
