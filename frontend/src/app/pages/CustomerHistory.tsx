import { useEffect, useState } from "react";
import { Users, Search, Phone, Car } from "lucide-react";
import { apiClient } from "../api/client";
import { CircleLoader } from "../components/ui/CircleLoader";

interface CustomerSummary {
  name: string;
  phone: string;
  total_purchases: number;
  total_outstanding: number;
  total_sales_count: number;
  batteries_purchased: number;
  exchanges_count: number;
  services_count: number;
  claims_count: number;
}

interface CustomerDetail {
  profile: {
    name: string;
    phone: string;
    vehicle_number: string;
    total_purchases: number;
    total_outstanding: number;
    batteries_purchased: number;
    exchanges_count: number;
    services_count: number;
    claims_count: number;
  };
  sales: any[];
  services: any[];
  exchanges: any[];
  warranty_claims: any[];
}

export function CustomerHistory() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string>("");
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"sales" | "services" | "exchanges" | "claims">("sales");

  const fetchCustomers = async () => {
    setLoadingList(true);
    try {
      const url = search ? `/customers?search=${encodeURIComponent(search)}` : "/customers";
      const res = await apiClient.get<CustomerSummary[]>(url);
      setCustomers(res);
      if (res.length > 0 && !selectedCustomerPhone) {
        setSelectedCustomerPhone(res[0].phone);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  useEffect(() => {
    if (!selectedCustomerPhone) return;
    const fetchCustomerDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await apiClient.get<CustomerDetail>(`/customers/${encodeURIComponent(selectedCustomerPhone)}`);
        setCustomerDetail(res);
      } catch (err) {
        console.error("Error fetching customer ledger:", err);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchCustomerDetail();
  }, [selectedCustomerPhone]);

  const profile = customerDetail?.profile;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#15161E] p-6 rounded-2xl border border-gray-100 dark:border-[#2E3B55] shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" /> Customer Profiles & History
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Complete lifetime customer transactions, balances, battery sales & service ledger</p>
        </div>
      </div>

      {/* Main Grid: Directory Sidebar & Ledger Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Directory List */}
        <div className="lg:col-span-4 bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] p-4 flex flex-col h-[650px] shadow-sm">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:outline-none"
            />
          </div>

          {loadingList ? (
            <div className="flex-1 flex items-center justify-center">
              <CircleLoader size="md" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {customers.length > 0 ? (
                customers.map((cust) => {
                  const isSelected = selectedCustomerPhone === cust.phone;
                  return (
                    <div
                      key={cust.phone + cust.name}
                      onClick={() => setSelectedCustomerPhone(cust.phone)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-md font-black"
                          : "bg-gray-50/50 dark:bg-[#1E293B]/50 border-gray-100 dark:border-gray-800 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{cust.name}</span>
                        <span className={`text-[10px] font-black ${isSelected ? 'text-white/80' : 'text-emerald-600'}`}>
                          ₹{cust.total_purchases.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] mt-1 opacity-80">
                        <span>{cust.phone}</span>
                        <span>{cust.batteries_purchased} Batteries</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">No customer profiles found</p>
              )}
            </div>
          )}
        </div>

        {/* Selected Customer Detailed Profile & Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {loadingDetail ? (
            <div className="min-h-[400px] flex items-center justify-center bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55]">
              <CircleLoader size="lg" />
            </div>
          ) : profile ? (
            <>
              {/* Profile Card Header */}
              <div className="bg-white dark:bg-[#15161E] rounded-2xl p-6 border border-gray-100 dark:border-[#2E3B55] shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-gray-100 dark:border-gray-800">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 uppercase">{profile.name}</h2>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-blue-500" /> {profile.phone}</span>
                      <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5 text-purple-500" /> {profile.vehicle_number}</span>
                    </div>
                  </div>
                  {profile.total_outstanding > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800">
                      <span className="text-[10px] font-black uppercase text-red-500 block">Outstanding Balance</span>
                      <span className="text-lg font-black text-red-600">₹{profile.total_outstanding.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* 5-Metric Business Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-center">
                  <div className="bg-gray-50 dark:bg-[#1E293B] p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Purchases</span>
                    <span className="text-sm font-black text-gray-900 dark:text-gray-100">₹{profile.total_purchases.toLocaleString()}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#1E293B] p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Outstanding</span>
                    <span className="text-sm font-black text-red-600">₹{profile.total_outstanding.toLocaleString()}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#1E293B] p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Batteries</span>
                    <span className="text-sm font-black text-blue-600">{profile.batteries_purchased} units</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#1E293B] p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Exchanges</span>
                    <span className="text-sm font-black text-purple-600">{profile.exchanges_count}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#1E293B] p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Services</span>
                    <span className="text-sm font-black text-amber-600">{profile.services_count}</span>
                  </div>
                </div>
              </div>

              {/* Transactions Tab Ledger */}
              <div className="bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 overflow-x-auto">
                  {[
                    { id: "sales", label: "Invoices & Sales", count: customerDetail?.sales.length },
                    { id: "services", label: "Services", count: customerDetail?.services.length },
                    { id: "exchanges", label: "Exchanges", count: customerDetail?.exchanges.length },
                    { id: "claims", label: "Warranty Claims", count: customerDetail?.warranty_claims.length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white font-black shadow-sm"
                          : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {tab.label} ({tab.count || 0})
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === "sales" && (
                  <div className="space-y-3">
                    {customerDetail?.sales && customerDetail.sales.length > 0 ? (
                      customerDetail.sales.map((sale) => (
                        <div key={sale.id} className="p-4 bg-gray-50 dark:bg-[#1E293B]/50 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-blue-600 block">INV-{String(sale.id).padStart(5, '0')}</span>
                            <span className="text-[11px] text-gray-400">{new Date(sale.created_at).toLocaleDateString('en-IN')} • {sale.payment_method}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-gray-900 dark:text-gray-100 block">₹{sale.total_amount.toLocaleString()}</span>
                            <span className="text-[10px] font-bold uppercase text-emerald-600">{sale.type || 'Sale'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-6">No sales invoices recorded</p>
                    )}
                  </div>
                )}

                {activeTab === "services" && (
                  <div className="space-y-3">
                    {customerDetail?.services && customerDetail.services.length > 0 ? (
                      customerDetail.services.map((srv) => (
                        <div key={srv.id} className="p-4 bg-gray-50 dark:bg-[#1E293B]/50 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">SRV-{String(srv.id).padStart(5, '0')} — {srv.complaint_type || srv.vehicle_details}</span>
                            <span className="text-[11px] text-gray-400">{new Date(srv.created_at).toLocaleDateString('en-IN')}</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700">{srv.status}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-6">No service history recorded</p>
                    )}
                  </div>
                )}

                {activeTab === "exchanges" && (
                  <div className="space-y-3">
                    {customerDetail?.exchanges && customerDetail.exchanges.length > 0 ? (
                      customerDetail.exchanges.map((exc) => (
                        <div key={exc.id} className="p-4 bg-gray-50 dark:bg-[#1E293B]/50 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">{exc.old_battery_brand} {exc.old_battery_ah}</span>
                            <span className="text-[11px] text-gray-400">Scrap Weight: {exc.scrap_weight || 'N/A'} kg</span>
                          </div>
                          <span className="text-sm font-black text-purple-600">Credit: ₹{exc.valuation_amount || exc.exchange_value || 0}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-6">No battery exchanges recorded</p>
                    )}
                  </div>
                )}

                {activeTab === "claims" && (
                  <div className="space-y-3">
                    {customerDetail?.warranty_claims && customerDetail.warranty_claims.length > 0 ? (
                      customerDetail.warranty_claims.map((claim) => (
                        <div key={claim.id} className="p-4 bg-gray-50 dark:bg-[#1E293B]/50 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-blue-600 block">{claim.claim_number} (S/N: {claim.serial_number})</span>
                            <span className="text-[11px] text-gray-400">{claim.issue_description}</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700">{claim.status}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-6">No warranty claims recorded</p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="min-h-[400px] flex items-center justify-center bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] text-xs text-gray-400 font-bold">
              Select a customer from directory to view history
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
