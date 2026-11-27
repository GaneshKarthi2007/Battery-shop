import { useState, useEffect, useRef } from "react";
import { useServiceLogIdPrefix, formatServiceLogId } from "../contexts/DeveloperContext";
import { apiClient } from "../api/client";
import { AudioPlayer } from "../components/ui/AudioPlayer";
import { useAuth } from "../contexts/AuthContext";
import { getMediaUrl } from "../utils/media";
import { useNavigate } from "react-router";
import {
  ClipboardList, Search, Clock,
  Inbox, Loader2, ArrowLeft, Wrench, CheckCircle2,
  Eye, X, Phone, ShoppingCart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/Button";
import { ContactActions, formatDialPhone } from "../components/ui/ContactActions";

export interface ServiceRecord {
  id: number;
  service_code?: string;
  log_id?: string;
  customer_code?: string;
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
  voice_note_url?: string | null;
  pickup_date?: string;
  assigned_to?: number;
  assigned_at?: string;
  resolved_at?: string;
  created_at: string;
  assigned_staff?: {
    id: number;
    name: string;
  };
  sales?: Array<{ id: number }>;
  receipt?: { id: number } | null;
}

const isNewConnectionJob = (job: Pick<ServiceRecord, "complaint_type">): boolean =>
  Boolean(job.complaint_type?.trim().toLowerCase().includes("new connection"));

const getComplaintCategoryLabel = (job: Pick<ServiceRecord, "complaint_type">): string => {
  if (isNewConnectionJob(job)) return "New Connection";
  const type = job.complaint_type?.trim();
  return type && type.toLowerCase() !== "service" ? `Service · ${type}` : "Service";
};

interface TasksWorkspaceProps {
  defaultTab?: "available" | "assigned" | "history";
}

export function TasksWorkspace({ defaultTab = "available" }: TasksWorkspaceProps) {
  const logIdPrefix = useServiceLogIdPrefix();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ServiceRecord | null>(null);
  const [takingId, setTakingId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
      setServices(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Unable to load tasks.");
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
        return Number(s.assigned_to) === Number(user?.id) && s.status === 'In Progress';
      }
      if (activeTab === "history") {
        // Display all previous entries without any filter
        return s.status === 'Completed' || s.status === 'Converted to Order';
      }
      return false;
    });
  };

  const tabJobs = getTabJobs();

  // Search Filter within active tab
  const filteredJobs = tabJobs.filter((job) => {
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const srvCode = (job.service_code || job.log_id || `srv-${job.id}`).toLowerCase();
      const custCode = (job.customer_code || "").toLowerCase();
      const logStr = `log-${job.id}`;
      const idStr = String(job.id);
      const phoneStr = job.contact_number || "";
      const nameStr = job.customer_name?.toLowerCase() || "";
      
      const matchesSearch = 
        srvCode.includes(query) ||
        custCode.includes(query) ||
        logStr.includes(query) || 
        idStr.includes(query) || 
        phoneStr.includes(query) ||
        nameStr.includes(query);
        
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Sort jobs (newest first)
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });

  // Tab Syncing Router
  const handleTabChange = (tab: "available" | "assigned" | "history") => {
    setActiveTab(tab);
    setSearchQuery("");
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
  const activeCount = services.filter(s => Number(s.assigned_to) === Number(user?.id) && s.status === 'In Progress').length;
  const completedCount = services.filter(s => s.status === 'Completed' || s.status === 'Converted to Order').length;

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 text-gray-900 dark:text-white">
      {!(isMobileView && selectedJob) && (
        <>
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
          <div
            data-testid="tasks-tab-bar"
            className="flex bg-gray-100 dark:bg-[#161D30] p-1.5 rounded-2xl border border-gray-250 dark:border-[#25314D] w-full max-w-2xl"
          >
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
        </>
      )}

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Master Panel — WhatsApp-style continuous list */}
          <div className={`space-y-3.5 lg:col-span-5 ${isMobileView && selectedJob ? "hidden" : "block"}`}>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, name, mobile..."
                aria-label="Search complaints"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-white dark:bg-[#0D121F] border border-gray-250 dark:border-[#25314D] rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white font-bold"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Continuous WhatsApp-style Chats List */}
            {loading ? (
              <div className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-[#25314D] rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-[#1E293B]">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="animate-pulse px-4 py-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#161D30] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 dark:bg-[#161D30] rounded w-2/3" />
                      <div className="h-2.5 bg-gray-100 dark:bg-[#161D30] rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedJobs.length === 0 ? (
              <p className="text-center text-gray-550 dark:text-gray-400 py-8 font-bold uppercase tracking-widest text-[11px]">
                No jobs match your search parameters.
              </p>
            ) : (
              <div
                data-testid="services-list"
                className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-[#25314D] rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-[#1E293B] max-h-[600px] overflow-y-auto custom-scrollbar"
              >
                {sortedJobs.map((job) => {
                  const isActive = selectedJob?.id === job.id;
                  const isNewConnection = isNewConnectionJob(job);
                  const dialPhone = job.contact_number ? formatDialPhone(job.contact_number) : null;
                  const displayLogId = `#${formatServiceLogId(logIdPrefix, job.log_id || job.service_code || job.id)}`;
                  const initial = (job.customer_name?.trim().charAt(0) || "?").toUpperCase();

                  return (
                    <div
                      key={job.id}
                      onClick={() => handleSelectJob(job)}
                      className={`relative px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 ${
                        isActive
                          ? "bg-blue-50/80 dark:bg-blue-500/10"
                          : "hover:bg-gray-50 dark:hover:bg-[#141B2D]"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                      )}

                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                          isNewConnection
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                        }`}
                      >
                        {initial}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight truncate">
                            {job.customer_name}
                          </p>
                          <span className="text-[11px] font-black font-mono text-gray-500 dark:text-gray-400 shrink-0">
                            {displayLogId}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider truncate ${
                              isNewConnection
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60"
                                : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60"
                            }`}
                          >
                            {getComplaintCategoryLabel(job)}
                          </span>

                          {dialPhone && (
                            <a
                              href={`tel:+${dialPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 flex items-center justify-center transition-colors shrink-0 ring-1 ring-blue-500/15"
                              title="Call Customer"
                              aria-label={`Call ${job.customer_name}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
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
            className={`lg:col-span-7 space-y-4 ${isMobileView && !selectedJob ? "hidden" : "block"}`}
          >
            {selectedJob ? (
              <div
                data-testid="complaint-details-card"
                className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-[#25314D] rounded-2xl p-4 sm:p-5 space-y-3.5 relative overflow-hidden shadow-sm"
              >
                {/* Mobile Back button */}
                {isMobileView && (
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white uppercase tracking-wider"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to list
                  </button>
                )}

                <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-[#25314D] pb-3">
                  <div>
                    <h2 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.18em]">
                      Complaint Details
                    </h2>
                    <h3 className="text-lg font-black font-mono text-gray-900 dark:text-white tracking-tight">
                      #{formatServiceLogId(logIdPrefix, selectedJob.log_id || selectedJob.service_code || selectedJob.id)}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedJob.contact_number && (
                      <ContactActions phoneNumber={selectedJob.contact_number} iconSize={14} />
                    )}
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                      selectedJob.status === 'Completed'
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    }`}>
                      {selectedJob.status}
                    </span>
                  </div>
                </div>

                {/* Minimalistic Complaint Details */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                    <DetailRow
                      label="Complaint ID"
                      value={`#${formatServiceLogId(logIdPrefix, selectedJob.log_id || selectedJob.service_code || selectedJob.id)}`}
                    />

                    <DetailRow
                      label="Complaint Type"
                      value={getComplaintCategoryLabel(selectedJob)}
                    />

                    <DetailRow
                      label="Customer Name"
                      value={selectedJob.customer_name}
                    />

                    {(selectedJob.assigned_at || selectedJob.assigned_to || selectedJob.status !== 'Pending') && (
                      <DetailRow
                        label="Staff"
                        value={
                          selectedJob.assigned_staff?.name ||
                          (Number(selectedJob.assigned_to) === Number(user?.id) ? user?.name : "") ||
                          "Assigned Staff"
                        }
                      />
                    )}

                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[10px] text-gray-400 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                        Mobile Number
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white font-mono">
                          {selectedJob.contact_number}
                        </span>
                        <ContactActions phoneNumber={selectedJob.contact_number} iconSize={12} />
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <DetailRow
                        label="Address"
                        value={selectedJob.address || "N/A"}
                      />
                    </div>
                  </div>

                  {/* Much Smaller Timestamps Row */}
                  <div className="grid grid-cols-2 gap-x-3 pt-2 border-t border-gray-100 dark:border-[#25314D]">
                    <DetailRow
                      label="Created At"
                      value={`${formatDateTime(selectedJob.created_at).date} · ${formatDateTime(selectedJob.created_at).time}`}
                      small
                    />

                    {(selectedJob.assigned_at || selectedJob.assigned_to || selectedJob.status !== 'Pending') && (
                      <DetailRow
                        label="Assigned At"
                        value={
                          selectedJob.assigned_at
                            ? `${formatDateTime(selectedJob.assigned_at).date} · ${formatDateTime(selectedJob.assigned_at).time}`
                            : "Recently Assigned"
                        }
                        small
                      />
                    )}
                  </div>

                  {/* Optional: Voice note if provided by admin */}
                  {selectedJob.voice_note && (
                    <div className="pt-1">
                      <p className="text-[9px] text-gray-400 dark:text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                        Admin Voice Attachment
                      </p>
                      <AudioPlayer
                        src={getMediaUrl(selectedJob.voice_note_url ?? selectedJob.voice_note)}
                        label="Voice Instruction"
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons based on context */}
                <div className="pt-3 border-t border-gray-100 dark:border-[#25314D]">
                  {activeTab === "available" ? (
                    <Button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={takingId === selectedJob.id}
                      className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-200 disabled:opacity-75"
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
                    <div className="space-y-2">
                      {isNewConnectionJob(selectedJob) &&
                        !(selectedJob.sales && selectedJob.sales.length > 0) &&
                        !selectedJob.receipt && (
                          <button
                            onClick={() =>
                              navigate("/sales", {
                                state: {
                                  fromService: true,
                                  isNewConnection: true,
                                  serviceId: selectedJob.id,
                                  customerInfo: {
                                    name: selectedJob.customer_name,
                                    phone: selectedJob.contact_number,
                                    address: selectedJob.address || "",
                                  },
                                  serviceSpecs: {
                                    complaint_type: selectedJob.complaint_type,
                                    complaint_details: selectedJob.complaint_details,
                                    vehicle_details: selectedJob.vehicle_details,
                                    battery_brand: selectedJob.battery_brand,
                                    battery_model: selectedJob.battery_model,
                                    battery_capacity: selectedJob.battery_capacity,
                                  },
                                },
                              })
                            }
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
                          >
                            <ShoppingCart className="w-4 h-4" /> Bill Product for New Connection
                          </button>
                        )}
                      <button
                        onClick={() => navigate(`/service/${selectedJob.id}`)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
                      >
                        <Eye className="w-4 h-4" /> Manage Active Job
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate(`/service/${selectedJob.id}`)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
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

function DetailRow({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <p
        className={
          small
            ? "text-[9px] text-gray-400 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5"
            : "text-[10px] text-gray-400 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5"
        }
      >
        {label}
      </p>
      <p
        className={
          small
            ? "text-[10px] font-semibold text-gray-500 dark:text-gray-400 leading-tight"
            : "text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-snug"
        }
      >
        {value}
      </p>
    </div>
  );
}


