import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  Wrench,
  IndianRupee,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../api/client";

interface DashboardData {
  todaySales: number;
  totalStock: number;
  pendingServices: number;
  monthlyProfit: number;
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

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick?: () => void;
}

function StatCard({ title, value, change, icon: Icon, color, onClick }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:border-blue-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-50' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-black text-gray-900 mb-2">{value}</h3>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <ArrowUp className="w-4 h-4 text-green-600" />
            ) : (
              <ArrowDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-600"
                }`}
            >
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-gray-400 font-medium">vs last week</span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-sm">Loading PowerCell Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-black text-gray-900 mb-2">Sync Error</h3>
        <p className="text-red-600/80 font-medium mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Greetings Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 w-fit rounded-full text-blue-100 text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-white/10">
              <Sparkles className="w-3 h-3" />
              PowerCell Management
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Hello, <span className="text-blue-200">{firstName}!</span>
            </h1>
            <p className="text-blue-100/80 font-medium max-w-md">
              {isAdmin
                ? "Here's the latest performance overview for your shop today."
                : "Welcome back! Check out our current battery catalog and prices."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block border-l border-white/10 pl-4">
              <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Today's Date</p>
              <p className="text-lg font-bold">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Role Based */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin && (
          <StatCard
            title="Today's Sales"
            value={`₹${data?.todaySales.toLocaleString()}`}
            change={0} // Can be calculated if backend provides previous week/day data
            icon={IndianRupee}
            color="bg-gradient-to-br from-blue-500 to-blue-700"
          />
        )}
        <StatCard
          title="Total Stock"
          value={`${data?.totalStock} Units`}
          change={0}
          icon={Package}
          color="bg-gradient-to-br from-emerald-500 to-emerald-700"
          onClick={() => navigate('/inventory')}
        />
        <StatCard
          title="Pending Services"
          value={`${data?.pendingServices}`}
          change={0}
          icon={Wrench}
          color="bg-gradient-to-br from-orange-500 to-orange-700"
          onClick={() => navigate('/service')}
        />
        {isAdmin && (
          <StatCard
            title="Monthly Profit"
            value={`₹${(data?.monthlyProfit || 0) >= 100000 ? ((data?.monthlyProfit || 0) / 100000).toFixed(1) + 'L' : data?.monthlyProfit.toLocaleString()}`}
            change={0}
            icon={TrendingUp}
            color="bg-gradient-to-br from-indigo-500 to-indigo-700"
          />
        )}
      </div>

      {!isAdmin ? (
        /* Staff View: Product List */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Our Products</h2>
              <p className="text-gray-500 font-medium">Quick reference for current inventory & pricing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.lowStockItems.slice(0, 6).map((item) => ( // Showing some items for staff view if needed, or all products
              <div
                key={item.id}
                className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Package className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    {item.type}
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                  <h3 className="font-black text-gray-900 text-lg group-hover:text-blue-600 transition-colors tracking-tight">
                    {item.brand} {item.model}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selling Price</p>
                    <p className="text-xl font-black text-gray-900">₹{item.price.toLocaleString()}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.stock < item.min_stock ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {item.stock} in stock
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Admin View: Charts & Alerts */
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-gray-900 uppercase">Weekly Sales</h2>
                  <p className="text-xs font-bold text-gray-400 tracking-tight">Revenue generated per day</p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data?.weeklySales || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "none",
                      borderRadius: "16px",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#2563eb"
                    strokeWidth={4}
                    dot={{ fill: "#2563eb", strokeWidth: 2, r: 4, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Units Sold Chart */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-gray-900 uppercase">Units Sold</h2>
                  <p className="text-xs font-bold text-gray-400 tracking-tight">Sales volume by quantity</p>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.weeklySales || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                  <Tooltip
                    cursor={{ fill: '#f8fafc', radius: 12 }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "none",
                      borderRadius: "16px",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-orange-50/50 to-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Inventory Alerts</h2>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter italic">Items requiring urgent attention</p>
                </div>
              </div>
              <button onClick={() => navigate('/inventory')} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                Full Stock List <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Product Detail
                    </th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Stock Level
                    </th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.lowStockItems.map((item) => {
                    const percentage = (item.stock / item.min_stock) * 100;
                    const isCritical = percentage < 50;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="font-black text-gray-900 tracking-tight">{item.brand}</div>
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter italic">{item.model}</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`text-sm font-black ${isCritical ? 'text-red-600' : 'text-orange-600'}`}>
                              {item.stock} / {item.min_stock} units
                            </span>
                            <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-orange-500'}`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${isCritical
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-orange-50 text-orange-700 border border-orange-100"
                              }`}
                          >
                            {isCritical ? "Critical" : "Restock Soon"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
