import { useState, useEffect, useRef } from "react";
import { apiClient } from "../api/client";
import { AudioPlayer } from "../components/ui/AudioPlayer";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router";
import {
  ClipboardList, Search, Clock, Phone,
  Inbox, MessageSquare, Loader2, ArrowLeft, Wrench, CheckCircle2,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/Button";

export interface ServiceRecord {
  id: number;
  customer_name: string;
  contact_number: string;
  address?: string;
  vehicle_details?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Converted to Order';
  sub_status?: string;
  service_charge: number;
  battery_brand?: string;
  battery_model?: string;
  battery_capacity?: string;
  complaint_type?: string;
  complaint_details?: string;
  voice_note?: string;
  pickup_date?: string;
  assigned_to?: number;
  assigned_at?: string;
  resolved_at?: string;
  created_at: string;
}

interface TasksWorkspaceProps {
  defaultTab?: "available" | "assigned" | "history";
}

export function TasksWorkspace({ defaultTab = "available" }: TasksWorkspaceProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ServiceRecord | null>(null);
  const [takingId, setTakingId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Pending" | "Urgent" | "Oldest" | "Newest">("All");
  const [activeTab, setActiveTab] = useState<"available" | "assigned" | "history">(defaultTab);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  const detailRef = useRef<HTMLDivElement>(null);

  // Monitor resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<ServiceRecord[]>('/services');
      setServices(data);
    } catch (err: any) {
      setError("Unable to load tasks.");
      console.error(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter lists based on tab
  const getTabJobs = () => {
    return services.filter((s) => {
      if (activeTab === "available") {
        return s.status === 'Pending' && !s.assigned_to;
      }
      if (activeTab === "assigned") {
        return s.assigned_to === user?.id && (s.status === 'In Progress' || s.status === 'Converted to Order');
      }
      if (activeTab === "history") {
        return s.assigned_to === user?.id && s.status === 'Completed';
      }
      return false;
    });
  };

  const tabJobs = getTabJobs();

  // Search & Filter within active tab
  const filteredJobs = tabJobs.filter((job) => {
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const logStr = `log-${job.id}`;
      const idStr = String(job.id);
      const phoneStr = job.contact_number || "";
      const nameStr = job.customer_name?.toLowerCase() || "";
      
      const matchesSearch = 
        logStr.includes(query) || 
        idStr.includes(query) || 
        phoneStr.includes(query) ||
        nameStr.includes(query);
        
      if (!matchesSearch) return false;
    }
    
    if (filterType === "Urgent") {
      return (
        job.complaint_type?.toLowerCase().includes("dead") || 
        job.complaint_details?.toLowerCase().includes("urgent") ||
        job.complaint_type?.toLowerCase().includes("warranty")
      );
    }
    
    if (filterType === "Pending") {
      return job.status.toLowerCase() === "pending";
    }
    
    return true;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    
    if (filterType === "Oldest") {
      return dateA - dateB;
    }
    // Default to Newest
    return dateB - dateA;
  });

  // Tab Syncing Router
  const handleTabChange = (tab: "available" | "assigned" | "history") => {
    setActiveTab(tab);
    setSearchQuery("");
    setFilterType("All");
    setSelectedJob(null);
    if (tab === "available") navigate("/available-jobs");
    if (tab === "assigned") navigate("/assigned-jobs");
    if (tab === "history") navigate("/completed-jobs");
  };

  // Sync state if navigation changes
  useEffect(() => {
    setActiveTab(defaultTab);
    setSelectedJob(null);
  }, [defaultTab]);

  // Auto-select on desktop
  useEffect(() => {
    if (!loading && sortedJobs.length > 0) {
      if (!isMobileView && (!selectedJob || !sortedJobs.some(j => j.id === selectedJob.id))) {
        setSelectedJob(sortedJobs[0]);
      }
    } else if (sortedJobs.length === 0) {
      setSelectedJob(null);
    }
  }, [loading, sortedJobs.length, isMobileView, activeTab]);

  const handleSelectJob = (job: ServiceRecord) => {
    setSelectedJob(job);
    if (isMobileView) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const handleAcceptJob = async () => {
    if (!selectedJob) return;
    try {
      setTakingId(selectedJob.id);
      setShowConfirmModal(false);
      await apiClient.post(`/services/${selectedJob.id}/pickup`);
      
      alert(`LOG-${selectedJob.id} accepted successfully.`);
      fetchJobs();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to accept job";
      alert(msg);
      if (err.response?.status === 400) {
        fetchJobs();
      }
    } finally {
      setTakingId(null);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
      const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      return {
        date: date.toLocaleDateString('en-IN', dateOptions).toUpperCase(),
        time: date.toLocaleTimeString('en-IN', timeOptions).toUpperCase()
      };
    } catch {
      return { date: "N/A", time: "N/A" };
    }
  };

  // Badge calculations for tabs
  const availableCount = services.filter(s => s.status === 'Pending' && !s.assigned_to).length;
  const activeCount = services.filter(s => s.assigned_to === user?.id && (s.status === 'In Progress' || s.status === 'Converted to Order')).length;
  const completedCount = services.filter(s => s.assigned_to === user?.id && s.status === 'Completed').length;

  return (
    <div className="space-y-6 pb-24 text-gray-900 dark:text-white">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-blue-500" />
          Tasks Workspace
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest text-[10px] font-bold">
          Redesigned Unified Portal
        </p>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex bg-gray-100 dark:bg-[#161D30] p-1.5 rounded-2xl border border-gray-250 dark:border-[#25314D] w-full max-w-2xl">
        <button
          onClick={() => handleTabChange("available")}
          className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === "available"
              ? "bg-white dark:bg-[#0D121F] text-blue-500 shadow-sm"
              : "text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white/80"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Available
          {availableCount > 0 && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20">
              {availableCount}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange("assigned")}
          className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === "assigned"
              ? "bg-white dark:bg-[#0D121F] text-blue-500 shadow-sm"
              : "text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white/80"
          }`}
        >
          <Wrench className="w-4 h-4" />
          Active
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20">
              {activeCount}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange("history")}
          className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === "history"
              ? "bg-white dark:bg-[#0D121F] text-emerald-500 shadow-sm"
              : "text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white/80"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          History
          {completedCount > 0 && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {completedCount}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-3xl p-6 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
          <Button size="sm" onClick={fetchJobs}>Retry</Button>
        </div>
      )}

      {tabJobs.length === 0 && !loading && !error ? (
        <div className="bg-white dark:bg-[#0D121F] rounded-3xl p-16 text-center border border-gray-250 dark:border-[#25314D] shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 bg-gray-50 dark:bg-[#15161E] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-black uppercase text-gray-900 dark:text-white mb-1">
            No Jobs Available
          </h3>
          <p className="text-gray-450 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">
            {activeTab === "available"
              ? "All available service requests have been accepted."
              : activeTab === "assigned"
              ? "You do not have any active tasks currently."
              : "You have not completed any tasks yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Master Panel */}
          <div className={`space-y-4 lg:col-span-5 ${isMobileView && selectedJob ? "hidden" : "block"}`}>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#0D121F] border border-gray-250 dark:border-[#25314D] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white font-bold"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 py-1">
              {(["All", "Pending", "Urgent", "Oldest", "Newest"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                    filterType === type
                      ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                      : "bg-white dark:bg-[#0D121F] text-gray-500 dark:text-white/40 border-gray-200 dark:border-[#25314D] hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="animate-pulse bg-gray-100 dark:bg-[#0D121F] border border-gray-200 dark:border-[#25314D] rounded-2xl h-24" />
                ))}
              </div>
            ) : sortedJobs.length === 0 ? (
              <p className="text-center text-sm text-gray-550 dark:text-gray-400 py-8 font-bold uppercase tracking-widest text-[11px]">
                No jobs match your search parameters.
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {sortedJobs.map((job) => {
                  const isActive = selectedJob?.id === job.id;
                  const isUrgent = 
                    job.complaint_type?.toLowerCase().includes("dead") || 
                    job.complaint_details?.toLowerCase().includes("urgent") ||
                    job.complaint_type?.toLowerCase().includes("warranty");
                  const created = formatDateTime(job.created_at);
                  
                  return (
                    <div
                      key={job.id}
                      onClick={() => handleSelectJob(job)}
                      className={`relative p-5 rounded-[22px] border cursor-pointer transition-all duration-300 ${
                        isActive
                          ? "bg-blue-500/5 border-blue-500 shadow-sm"
                          : "bg-white dark:bg-[#0D121F] border-gray-200 dark:border-[#25314D] hover:border-blue-500/40"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-blue-500 rounded-r-lg" />
                      )}
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-black text-gray-900 dark:text-white">
                          LOG-{job.id}
                        </span>
                        <div className="flex gap-2">
                          {isUrgent && (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-red-500/10 text-red-500 border border-red-500/20">
                              Urgent
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${
                            job.status === 'Completed'
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : job.status === 'Converted to Order'
                              ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[12px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                          {job.customer_name}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black tracking-widest">
                          {job.contact_number}
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-[9px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">
                          <span>{created.date}</span>
                          <span>·</span>
                          <span>{created.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div
            ref={detailRef}
            className={`lg:col-span-7 space-y-6 ${isMobileView && !selectedJob ? "hidden" : "block"}`}
          >
            {selectedJob ? (
              <div className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-[#25314D] rounded-[32px] p-6 sm:p-8 space-y-8 relative overflow-hidden shadow-sm">
                
                {/* Mobile Back button */}
                {isMobileView && (
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/80 uppercase tracking-wider mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to list
                  </button>
                )}

                <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#25314D] pb-5">
                  <div>
                    <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] mb-1">
                      Complaint Details
                    </h2>
                    <h3 className="text-xl font-black text-gray-955 dark:text-white tracking-tighter">
                      LOG-{selectedJob.id}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                    selectedJob.status === 'Completed'
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  }`}>
                    {selectedJob.status}
                  </span>
                </div>

                {/* Complaint Info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.2em] mb-3">
                    A. Complaint Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow label="Complaint ID" value={String(selectedJob.id)} />
                    <DetailRow label="Complaint Type" value={selectedJob.complaint_type || "N/A"} />
                    <DetailRow label="Status" value={selectedJob.status} />
                    <DetailRow label="Created Date" value={formatDateTime(selectedJob.created_at).date} />
                    <DetailRow label="Created Time" value={formatDateTime(selectedJob.created_at).time} />
                    {selectedJob.assigned_at && (
                      <DetailRow label="Assigned At" value={formatDateTime(selectedJob.assigned_at).date + " " + formatDateTime(selectedJob.assigned_at).time} />
                    )}
                    <div className="sm:col-span-2">
                      <p className="text-[10px] text-gray-400 dark:text-white/30 font-black uppercase tracking-widest mb-1">
                        Description / Problem details
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-[#070A13] border border-gray-100 dark:border-[#25314D] p-4 rounded-2xl">
                        {selectedJob.complaint_details || "No description provided."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.2em] mb-3">
                    B. Customer Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow label="Customer Name" value={selectedJob.customer_name} />
                    <DetailRow label="Mobile Number" value={selectedJob.contact_number} />
                    <div className="sm:col-span-2">
                      <DetailRow label="Address" value={selectedJob.address || "N/A"} />
                    </div>
                  </div>
                </div>

                {/* Quick Contact Actions */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.2em] mb-3">
                    C. Quick Contact Actions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={`tel:${selectedJob.contact_number}`}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-sm active:scale-98"
                    >
                      <Phone className="w-4 h-4" /> Call Customer
                    </a>
                    <a
                      href={`https://wa.me/${selectedJob.contact_number.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-sm active:scale-98"
                    >
                      <MessageSquare className="w-4 h-4" /> WhatsApp Customer
                    </a>
                  </div>
                </div>

                {/* Vehicle details */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.2em] mb-3">
                    D. Vehicle Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow label="Vehicle Details" value={selectedJob.vehicle_details || "N/A"} />
                  </div>
                </div>

                {/* Battery Info */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.2em] mb-3">
                    E. Battery Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow label="Battery Brand" value={selectedJob.battery_brand || "N/A"} />
                    <DetailRow label="Battery Model" value={selectedJob.battery_model || "N/A"} />
                    <DetailRow label="Battery Capacity" value={selectedJob.battery_capacity ? `${selectedJob.battery_capacity} Ah` : "N/A"} />
                  </div>
                </div>

                {/* Service Info */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.2em] mb-3">
                    F. Service Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow label="Preferred Date" value={selectedJob.pickup_date ? new Date(selectedJob.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : "N/A"} />
                    <DetailRow label="Service Charge" value={selectedJob.service_charge > 0 ? `₹${selectedJob.service_charge.toLocaleString()}` : "Free Inspection"} />
                  </div>
                  
                  {/* Voice Note Attachment */}
                  {selectedJob.voice_note && (
                    <div className="pt-2">
                      <p className="text-[10px] text-gray-400 dark:text-white/30 font-black uppercase tracking-widest mb-2">
                        Admin Voice Attachment
                      </p>
                      <AudioPlayer
                        src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/storage/${selectedJob.voice_note}`}
                        label="Voice Instruction"
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons based on context */}
                <div className="pt-6 border-t border-gray-100 dark:border-[#25314D]">
                  {activeTab === "available" ? (
                    <Button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={takingId === selectedJob.id}
                      className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all duration-300 disabled:opacity-75"
                    >
                      {takingId === selectedJob.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Accepting Job...
                        </>
                      ) : (
                        "Accept Job"
                      )}
                    </Button>
                  ) : activeTab === "assigned" ? (
                    <button
                      onClick={() => navigate(`/service/${selectedJob.id}`)}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all duration-300"
                    >
                      <Eye className="w-4 h-4" /> Manage Active Job
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/service/${selectedJob.id}`)}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all duration-300"
                    >
                      <Eye className="w-4 h-4" /> View Full Record
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="hidden lg:flex flex-col items-center justify-center bg-white dark:bg-[#0D121F] border border-dashed border-gray-200 dark:border-[#25314D] rounded-[32px] p-16 text-center h-[500px]">
                <Clock className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Select a task
                </h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
                  Select an item from the list to view its complete details.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Accept Confirmation Dialog Overlay */}
      <AnimatePresence>
        {showConfirmModal && selectedJob && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-blue-100 dark:border-blue-900/30">
                <ClipboardList className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">
                Accept LOG-{selectedJob.id}?
              </h3>
              <p className="text-sm text-gray-550 dark:text-gray-400 font-medium mb-8">
                After accepting this complaint, the job will be added to My Jobs.
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 dark:bg-[#161D30] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all text-sm active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptJob}
                  className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all text-sm active:scale-95"
                >
                  Accept Job
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 dark:text-white/30 font-black uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="text-sm font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
