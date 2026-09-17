import { useEffect, useState } from "react";
import { ShieldCheck, Search, Plus, X } from "lucide-react";
import { apiClient } from "../api/client";
import { CircleLoader } from "../components/ui/CircleLoader";

interface WarrantyClaim {
  id: number;
  claim_number: string;
  serial_number: string;
  customer_name: string;
  customer_phone: string;
  vehicle_number?: string;
  issue_description: string;
  inspection_notes?: string;
  claim_type: "replacement" | "repair" | "prorata_refund";
  status: "pending_inspection" | "sent_to_manufacturer" | "approved" | "replaced" | "rejected";
  replacement_serial_number?: string;
  created_at: string;
  product?: {
    brand: string;
    model: string;
    ah: string;
  };
}

export function WarrantyManagement() {
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Warranty Status Lookup tool
  const [checkSerial, setCheckSerial] = useState("");
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  // New Claim Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    serial_number: "",
    customer_name: "",
    customer_phone: "",
    vehicle_number: "",
    issue_description: "",
    claim_type: "replacement",
    inspection_notes: "",
  });

  const fetchClaims = async () => {
    setLoading(true);
    try {
      let url = "/warranty-claims?";
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;
      const res = await apiClient.get<any>(url);
      setClaims(res.data || res);
    } catch (err) {
      console.error("Failed to fetch claims:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [search, statusFilter]);

  const handleWarrantyLookup = async () => {
    if (!checkSerial.trim()) return;
    setChecking(true);
    setLookupResult(null);
    try {
      const res = await apiClient.get<any>(`/warranty-claims/check/status?serial_number=${encodeURIComponent(checkSerial)}`);
      setLookupResult(res);
      if (res.exists && res.battery_serial) {
        setFormData(prev => ({
          ...prev,
          serial_number: checkSerial,
          customer_name: res.battery_serial.customer_name || prev.customer_name,
          customer_phone: res.battery_serial.customer_phone || prev.customer_phone,
          vehicle_number: res.battery_serial.vehicle_number || prev.vehicle_number,
        }));
      }
    } catch (err) {
      setLookupResult({ exists: false, message: "Error checking serial number" });
    } finally {
      setChecking(false);
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/warranty-claims", formData);
      setShowModal(false);
      setFormData({
        serial_number: "",
        customer_name: "",
        customer_phone: "",
        vehicle_number: "",
        issue_description: "",
        claim_type: "replacement",
        inspection_notes: "",
      });
      fetchClaims();
    } catch (err: any) {
      alert(err.message || "Failed to submit warranty claim");
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await apiClient.put(`/warranty-claims/${id}`, { status: newStatus });
      fetchClaims();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#15161E] p-6 rounded-2xl border border-gray-100 dark:border-[#2E3B55] shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" /> Warranty Management & Claims
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Track battery serial warranties, process customer claims & replacement logs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Warranty Claim
        </button>
      </div>

      {/* Serial Lookup Section */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-6 rounded-2xl text-white shadow-md">
        <h2 className="text-sm font-black uppercase tracking-wider text-blue-300 mb-2">Instant Serial Number Warranty Checker</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter Battery Serial Number (e.g. EX-987654321)..."
            value={checkSerial}
            onChange={(e) => setCheckSerial(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm placeholder:text-white/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
          />
          <button
            onClick={handleWarrantyLookup}
            disabled={checking}
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
          >
            {checking ? <CircleLoader size="sm" /> : <Search className="w-4 h-4" />} Check Warranty Status
          </button>
        </div>

        {lookupResult && (
          <div className="mt-4 p-4 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold">
            {lookupResult.exists ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-emerald-400 font-black text-sm block">✓ Valid Registered Serial Number</span>
                  <span>Customer: {lookupResult.battery_serial.customer_name} ({lookupResult.battery_serial.customer_phone})</span>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${lookupResult.is_expired ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {lookupResult.is_expired ? 'Warranty Expired' : 'Warranty Active'}
                  </span>
                  {lookupResult.warranty_expiry_date && (
                    <span className="block text-[10px] text-white/70 mt-1">Expires: {lookupResult.warranty_expiry_date}</span>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-red-300 font-bold">⚠️ {lookupResult.message || "Serial number not found"}</span>
            )}
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#15161E] p-4 rounded-2xl border border-gray-100 dark:border-[#2E3B55]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search claims by Serial #, Claim #, Customer Name, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="pending_inspection">Pending Inspection</option>
          <option value="sent_to_manufacturer">Sent to Manufacturer</option>
          <option value="approved">Approved</option>
          <option value="replaced">Replaced</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Claims Table */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55]">
          <CircleLoader size="lg" />
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#1E293B] text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3">Claim #</th>
                  <th className="px-5 py-3">Serial Number</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Issue</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {claims.length > 0 ? (
                  claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-4 font-black text-blue-600">{claim.claim_number}</td>
                      <td className="px-5 py-4 font-mono font-bold">{claim.serial_number}</td>
                      <td className="px-5 py-4">
                        <span className="font-bold block text-gray-900 dark:text-gray-100">{claim.customer_name}</span>
                        <span className="text-gray-400 text-[11px]">{claim.customer_phone}</span>
                      </td>
                      <td className="px-5 py-4 max-w-xs truncate text-gray-600 dark:text-gray-300">{claim.issue_description}</td>
                      <td className="px-5 py-4 uppercase font-bold text-[10px] text-gray-500">{claim.claim_type}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          claim.status === 'approved' || claim.status === 'replaced' ? 'bg-emerald-100 text-emerald-700' :
                          claim.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {claim.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <select
                          value={claim.status}
                          onChange={(e) => handleUpdateStatus(claim.id, e.target.value)}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[11px] font-bold border-none"
                        >
                          <option value="pending_inspection">Pending</option>
                          <option value="sent_to_manufacturer">Sent to Mfg</option>
                          <option value="approved">Approve</option>
                          <option value="replaced">Replaced</option>
                          <option value="rejected">Reject</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-gray-400 font-bold">
                      No warranty claims found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15161E] rounded-2xl max-w-lg w-full p-6 border border-gray-100 dark:border-[#2E3B55] shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-black uppercase text-gray-900 dark:text-gray-100">Register Warranty Claim</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateClaim} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Battery Serial Number *</label>
                <input
                  type="text"
                  required
                  placeholder="EX-987654321"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Issue / Defect Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.issue_description}
                  onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                  placeholder="Describe battery failure symptoms, voltage reading, test results..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
                ></textarea>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Claim Resolution Preference</label>
                <select
                  value={formData.claim_type}
                  onChange={(e) => setFormData({ ...formData, claim_type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                >
                  <option value="replacement">Free Replacement</option>
                  <option value="repair">Recharge / Repair</option>
                  <option value="prorata_refund">Pro-Rata Discount</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700">Submit Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
