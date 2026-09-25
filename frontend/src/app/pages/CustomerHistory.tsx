import { useEffect, useState } from "react";
import { Users, Search, Phone, Car, ChevronRight, ArrowLeft, ShieldCheck, Code, UserCheck, Plus, Trash2, Loader2, MessageSquare } from "lucide-react";
import { apiClient } from "../api/client";
import { CircleLoader } from "../components/ui/CircleLoader";
import { useAuth } from "../contexts/AuthContext";

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

export const cleanPhoneNumber = (phone: string = ""): string => {
  if (!phone) return "";
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.substring(2);
  }
  return digits || phone;
};

export const getCustomerDisplayName = (name?: string): string => {
  if (name && name.trim()) {
    const trimmed = name.trim();
    const digitsOnly = trimmed.replace(/[^0-9]/g, "");
    if (digitsOnly.length < 7) {
      return trimmed;
    }
  }
  return "Customer";
};

export const getCustomerInitial = (name?: string): string => {
  const dispName = getCustomerDisplayName(name);
  if (dispName && dispName !== "Customer") {
    return dispName.charAt(0).toUpperCase();
  }
  return "C";
};

export function CustomerHistory() {
  let currentUser: any = null;
  try {
    const auth = useAuth();
    currentUser = auth?.user;
  } catch {
    currentUser = { role: 'admin' };
  }
  const [activeModule, setActiveModule] = useState<"customers" | "users">("customers");

  // --- Customer State ---
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string>("");
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"sales" | "services" | "exchanges" | "claims">("sales");
  const [showDetailView, setShowDetailView] = useState(false);

  // --- System Users State ---
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "staff" });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await apiClient.get<any[]>('/users');
      setUsers(data);
    } catch (e: any) {
      console.error("Failed to load users", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  useEffect(() => {
    if (activeModule === "users") {
      fetchUsers();
    }
  }, [activeModule]);

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

  const handleSelectCustomer = (phone: string) => {
    setSelectedCustomerPhone(phone);
    setShowDetailView(true);
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setCreateError("All fields are required.");
      return;
    }
    setIsCreating(true);
    setCreateError("");
    setCreateSuccess(false);

    try {
      await apiClient.post('/users', newUser);
      setCreateSuccess(true);
      setNewUser({ name: "", email: "", password: "", role: "staff" });
      setShowAddUserForm(false);
      fetchUsers();
    } catch (e: any) {
      setCreateError(e.message || "Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete user ${name}?`)) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/users/${id}`);
      fetchUsers();
    } catch (e: any) {
      alert(e.message || "Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'developer':
        return <Code className="w-4 h-4 text-purple-600" />;
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      default:
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
    }
  };

  // Filter out developer users if logged-in user is admin
  const visibleUsers = currentUser?.role === 'admin'
    ? users.filter(u => u.role !== 'developer')
    : users;

  const profile = customerDetail?.profile;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#15161E] p-6 rounded-2xl border border-gray-100 dark:border-[#2E3B55] shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" /> User & Customer Profiles & History
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Complete WhatsApp-style profile directory, ledgers & system user access</p>
        </div>

        {/* Module Switcher Tabs (Customers vs System Users) */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#1E293B] p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveModule("customers");
              setShowDetailView(false);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
              activeModule === "customers"
                ? "bg-white dark:bg-[#0D1B2A] text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveModule("users")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
              activeModule === "users"
                ? "bg-white dark:bg-[#0D1B2A] text-purple-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>System Users ({visibleUsers.length})</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODULE 1: CUSTOMER PROFILES (WhatsApp Style - Clean Layout)    */}
      {/* ============================================================== */}
      {activeModule === "customers" && (
        <div className="space-y-4">
          {!showDetailView ? (
            /* WhatsApp Contact Directory View */
            <div className="bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] p-5 shadow-sm space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by customer name or phone number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Customer WhatsApp Contact Cards List */}
              {loadingList ? (
                <div className="py-12 flex justify-center">
                  <CircleLoader size="md" />
                </div>
              ) : customers.length > 0 ? (
                <div className="space-y-2">
                  {customers.map((cust) => {
                    const isSelected = selectedCustomerPhone === cust.phone;
                    const displayName = getCustomerDisplayName(cust.name);
                    const initial = getCustomerInitial(cust.name);
                    const formattedPhone = cleanPhoneNumber(cust.phone);

                    return (
                      <div
                        key={cust.phone + cust.name}
                        onClick={() => handleSelectCustomer(cust.phone)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? "bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40"
                            : "bg-gray-50/60 dark:bg-[#1E293B]/40 border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-[#1E293B] hover:shadow-md"
                        }`}
                      >
                        {/* Avatar & Contact Details */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm border-2 border-white dark:border-gray-800">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 transition-colors">
                              {displayName}
                            </h3>
                            <div className="flex items-center gap-3 text-xs font-medium text-gray-500 mt-0.5">
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-blue-500" /> {formattedPhone}</span>
                              <span className="hidden sm:inline">• {cust.batteries_purchased} Batteries</span>
                            </div>
                          </div>
                        </div>

                        {/* Financial Stats & Arrow */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-600 block">
                              ₹{cust.total_purchases.toLocaleString()}
                            </span>
                            {cust.total_outstanding > 0 && (
                              <span className="text-[10px] font-bold text-red-500 block">
                                Due: ₹{cust.total_outstanding.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-gray-400 font-bold">
                  No customer profiles found matching search criteria.
                </div>
              )}
            </div>
          ) : (
            /* WhatsApp Detailed Customer Profile Card & History */
            <div className="space-y-4">
              {/* Back to List Navigation */}
              <button
                onClick={() => setShowDetailView(false)}
                className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 bg-white dark:bg-[#15161E] px-4 py-2.5 rounded-xl border border-gray-100 dark:border-[#2E3B55] shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Customer List
              </button>

              {loadingDetail ? (
                <div className="py-20 bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] flex justify-center">
                  <CircleLoader size="lg" />
                </div>
              ) : profile ? (
                <>
                  {/* WhatsApp Profile Banner Card */}
                  <div className="bg-white dark:bg-[#15161E] rounded-2xl p-6 border border-gray-100 dark:border-[#2E3B55] shadow-sm">
                    <div className="flex flex-col items-center text-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                      {/* Avatar Circle with Centered Initial */}
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shrink-0 shadow-md border-4 border-white dark:border-gray-800">
                        {getCustomerInitial(profile.name)}
                      </div>

                      <div className="min-w-0">
                        {/* Customer Name as Main Heading */}
                        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                          {getCustomerDisplayName(profile.name)}
                        </h2>

                        {/* Clean Phone Number without 91 prefix */}
                        <p className="text-sm font-bold text-gray-500 mt-1">
                          {cleanPhoneNumber(profile.phone)}
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-gray-500 mt-3">
                          <a href={`tel:${cleanPhoneNumber(profile.phone)}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg hover:bg-blue-100">
                            <Phone className="w-3.5 h-3.5" /> {cleanPhoneNumber(profile.phone)}
                          </a>
                          <a
                            href={`https://api.whatsapp.com/send?phone=91${cleanPhoneNumber(profile.phone)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg hover:bg-emerald-100"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                          {profile.vehicle_number && profile.vehicle_number !== "N/A" && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 rounded-lg">
                              <Car className="w-3.5 h-3.5 text-purple-500" /> {profile.vehicle_number}
                            </span>
                          )}
                        </div>
                      </div>

                      {profile.total_outstanding > 0 && (
                        <div className="bg-red-50 dark:bg-red-950/30 px-5 py-3 rounded-2xl border border-red-200 dark:border-red-900/40 text-center mt-2">
                          <span className="text-[10px] font-black uppercase text-red-500 block">Outstanding Balance</span>
                          <span className="text-xl font-black text-red-600">₹{profile.total_outstanding.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* 5-Metric Business Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 text-center">
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

                  {/* Transactions Ledger Tabs */}
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

                    {/* Sales Tab */}
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

                    {/* Services Tab */}
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

                    {/* Exchanges Tab */}
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

                    {/* Claims Tab */}
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
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODULE 2: SYSTEM USERS MODULE (Accessed by Admin)             */}
      {/* ============================================================== */}
      {activeModule === "users" && (
        <div className="bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 uppercase">System Staff & User Access</h2>
              <p className="text-xs text-gray-500 font-medium">Manage user credentials, roles, and administrative access permissions</p>
            </div>
            <button
              onClick={() => setShowAddUserForm(!showAddUserForm)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddUserForm ? "Cancel" : "Add New User"}</span>
            </button>
          </div>

          {/* Create User Form Section */}
          {showAddUserForm && (
            <div className="p-5 bg-gray-50 dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">Create User Account</h3>

              {createError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200">
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-200">
                  User account created successfully!
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0D1B2A] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:outline-none"
                    placeholder="E.g., John Staff"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0D1B2A] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0D1B2A] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">System Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0D1B2A] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="staff">Staff Member</option>
                    <option value="admin">Administrator</option>
                    {currentUser?.role === 'developer' && (
                      <option value="developer">Developer</option>
                    )}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreateUser}
                disabled={isCreating}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Save New User Account</span>
              </button>
            </div>
          )}

          {/* WhatsApp-Style System Users List (Hides Developer Users from Admin) */}
          {loadingUsers ? (
            <div className="py-12 flex justify-center">
              <CircleLoader size="md" />
            </div>
          ) : visibleUsers.length > 0 ? (
            <div className="space-y-3">
              {visibleUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 bg-gray-50/60 dark:bg-[#1E293B]/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-sm">
                      {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">{u.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                          u.role === 'developer'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {getRoleIcon(u.role)}
                          {u.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    disabled={deletingId === u.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                    title="Delete User"
                  >
                    {deletingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-8 font-bold">No system users configured.</p>
          )}
        </div>
      )}
    </div>
  );
}
