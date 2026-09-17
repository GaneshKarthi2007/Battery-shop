import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Wrench, Clock, CheckCircle, AlertTriangle, Plus, Trash2, ChevronDown, ChevronUp, ExternalLink, Car, BatteryCharging } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "../api/client";
import { Button } from "../components/Button";
import { ContactActions } from "../components/ui/ContactActions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { CircleLoader } from "../components/ui/CircleLoader";

interface ServiceRequest {
  id: number;
  customer_name: string;
  contact_number: string;
  vehicle_details: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  service_charge: number;
  battery_brand?: string;
  battery_model?: string;
  payment_status?: string;
  sub_status?: string;
  created_at: string;
}

export function ServiceManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<ServiceRequest[]>('/services');
      setServices(data);
    } catch (err: any) {
      setError(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setServiceToDelete(id);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      await apiClient.delete(`/services/${serviceToDelete}`);
      setServices(services.filter(s => s.id !== serviceToDelete));
      setServiceToDelete(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete service");
    }
  };

  const toggleExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setExpandedId(prev => (prev === id ? null : id));
  };

  const filteredServices = services.filter(
    (service) =>
      service.payment_status !== "verified" &&
      (filterStatus === "All" || service.status === filterStatus)
  );

  const statusConfig = {
    Pending: { color: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800", icon: Clock },
    "In Progress": { color: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: Wrench },
    Completed: { color: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: CheckCircle },
  };

  const activeServices = services.filter(s => s.payment_status !== "verified");

  const statusCounts = {
    All: activeServices.length,
    Pending: activeServices.filter((s) => s.status === "Pending").length,
    "In Progress": activeServices.filter((s) => s.status === "In Progress").length,
    Completed: activeServices.filter((s) => s.status === "Completed").length,
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center"
      >
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-black text-gray-900 mb-2">Sync Error</h3>
        <p className="text-red-600/80 font-medium mb-6">{error}</p>
        <Button onClick={fetchServices} variant="primary">Try Again</Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Header Row */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Service Management</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Track and manage battery service requests</p>
        </div>
        <div>
          {user?.role === "admin" && (
            <button
              onClick={() => navigate('/services/new')}
              aria-label="New Service Request"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Request</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Filter Pills */}
      <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-[#1B263B] rounded-2xl w-full overflow-x-auto snap-x scrollbar-hide">
        {(["All", "Pending", "In Progress", "Completed"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2 whitespace-nowrap shrink-0 snap-center z-0 ${filterStatus === status ? "text-blue-700 dark:text-blue-300" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
          >
            {filterStatus === status && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 bg-white dark:bg-[#0D1B2A] rounded-xl -z-10 border border-gray-200 dark:border-[#2E3B55] shadow-xs"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {status}
            <span className={`px-2 py-0.5 rounded-full text-[10px] transition-colors ${filterStatus === status ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" : "bg-gray-200 dark:bg-[#25334D] text-gray-500 dark:text-gray-400"
              }`}>
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Minimal Records List */}
      <motion.div layout className="flex flex-col gap-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[200px]"
            >
              <CircleLoader size="lg" />
            </motion.div>
          ) : filteredServices.length === 0 ? (
            <motion.div
              layout
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1B263B] rounded-2xl p-10 text-center border border-dashed border-gray-200 dark:border-[#2E3B55]"
            >
              <div className="w-10 h-10 bg-gray-50 dark:bg-[#0D1B2A] rounded-xl flex items-center justify-center mx-auto mb-2">
                <Wrench className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No service records found</p>
            </motion.div>
          ) : (
            filteredServices.map((service, index) => {
              const normalizedStatus = (service.status.charAt(0).toUpperCase() + service.status.slice(1).toLowerCase()) as keyof typeof statusConfig;
              const config = statusConfig[normalizedStatus] || {
                color: "bg-gray-100 text-gray-700 border-gray-200",
                icon: AlertTriangle
              };

              const isExpanded = expandedId === service.id;

              return (
                <motion.div
                  layout
                  key={service.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: index * 0.02 }}
                  className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-100 dark:border-[#2E3B55] hover:border-blue-300 dark:hover:border-blue-600/50 transition-all shadow-xs hover:shadow-sm overflow-hidden"
                >
                  {/* Minimal Header Card (Center click opens record detail) */}
                  <div
                    onClick={() => navigate(`/service/${service.id}`)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer group hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-colors"
                  >
                    {/* Left Details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${config.color}`}>
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase text-sm truncate">
                            {service.customer_name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${config.color} whitespace-nowrap`}>
                            {service.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                          <span>{service.contact_number}</span>
                          {service.battery_brand && (
                            <>
                              <span>·</span>
                              <span className="truncate">{service.battery_brand} {service.battery_model}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Details & Dropdown Toggle */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-black text-blue-600 dark:text-blue-400">
                          ₹{Number(service.service_charge).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">
                          {new Date(service.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>

                      {/* Dropdown Icon at Right End */}
                      <button
                        onClick={(e) => toggleExpand(e, service.id)}
                        aria-label={`Toggle details for ${service.customer_name}`}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isExpanded 
                            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700" 
                            : "bg-gray-50 dark:bg-[#0D1B2A] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-gray-200 dark:border-[#2E3B55]"
                        }`}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-gray-100 dark:border-[#2E3B55] bg-gray-50/70 dark:bg-[#0D1B2A]/60"
                      >
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-start gap-2 bg-white dark:bg-[#1B263B] p-2.5 rounded-xl border border-gray-100 dark:border-[#2E3B55]">
                              <Car className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 block">Vehicle</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">{service.vehicle_details || 'N/A'}</span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 bg-white dark:bg-[#1B263B] p-2.5 rounded-xl border border-gray-100 dark:border-[#2E3B55]">
                              <BatteryCharging className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 block">Battery Spec</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">{service.battery_brand ? `${service.battery_brand} ${service.battery_model || ''}` : 'Not Specified'}</span>
                              </div>
                            </div>
                          </div>

                          {service.sub_status && (
                            <div className="text-xs bg-white dark:bg-[#1B263B] p-2.5 rounded-xl border border-gray-100 dark:border-[#2E3B55] flex justify-between items-center">
                              <span className="text-[10px] uppercase font-bold text-gray-400">Current Phase</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">{service.sub_status}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <ContactActions phoneNumber={service.contact_number} />

                            <div className="flex items-center gap-2">
                              {user?.role === "admin" && (
                                <button
                                  onClick={(e) => handleDelete(e, service.id)}
                                  className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/40 px-2.5 py-1.5 rounded-xl border border-red-100 dark:border-red-900 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              )}
                              <button
                                onClick={() => navigate(`/service/${service.id}`)}
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900 transition-colors"
                              >
                                <span>Open Details</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={serviceToDelete !== null} onOpenChange={(open) => {
        if (!open) setServiceToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service record for this customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
