import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Wrench, Clock, CheckCircle, AlertTriangle, Plus, Trash2, CheckSquare, Square, LayoutGrid, List } from "lucide-react";
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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'minimal'>('grid');

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
    if (!serviceToDelete && selectedIds.length === 0) return;

    try {
      if (serviceToDelete) {
        await apiClient.delete(`/services/${serviceToDelete}`);
        setServices(services.filter(s => s.id !== serviceToDelete));
        setServiceToDelete(null);
      } else {
        setIsBulkDeleting(true);
        // Delete all selected sequential or concurrently. Concurrently is faster.
        await Promise.all(selectedIds.map(id => apiClient.delete(`/services/${id}`)));
        setServices(services.filter(s => !selectedIds.includes(s.id)));
        setSelectedIds([]);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete service(s)");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredServices.map(s => s.id);
    if (selectedIds.length === visibleIds.length && visibleIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleIds);
    }
  };

  const filteredServices = services.filter(
    (service) =>
      service.payment_status !== "verified" &&
      (filterStatus === "All" || service.status === filterStatus)
  );

  const statusConfig = {
    Pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
    "In Progress": { color: "bg-blue-100 text-blue-700", icon: Wrench },
    Completed: { color: "bg-green-100 text-green-700", icon: CheckCircle },
  };

  const activeServices = services.filter(s => s.payment_status !== "verified");

  const statusCounts = {
    All: activeServices.length,
    Pending: activeServices.filter((s) => s.status === "Pending").length,
    "In Progress": activeServices.filter((s) => s.status === "In Progress").length,
    Completed: activeServices.filter((s) => s.status === "Completed").length,
  };

  if (loading) {
    // Page loader removed for smoother page transitions
  }

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
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
          <p className="text-gray-600 mt-1">Track and manage battery service requests</p>
        </div>
        {user?.role === "admin" && (
          <div className="flex items-center gap-3">
            {filteredServices.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className={`flex items-center gap-2 border-dashed ${selectedIds.length > 0 ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}`}
              >
                {selectedIds.length === filteredServices.length && filteredServices.length > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selectedIds.length === filteredServices.length && filteredServices.length > 0 ? "Deselect All" : "Select All"}
              </Button>
            )}
            
            <div className="flex items-center bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('minimal')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'minimal' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                title="Minimal View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Button
              onClick={() => navigate('/services/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Service Request
            </Button>
          </div>
        )}
      </motion.div>

      <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl w-full overflow-x-auto snap-x scrollbar-hide">
        {(["All", "Pending", "In Progress", "Completed"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 whitespace-nowrap shrink-0 snap-center z-0 ${filterStatus === status ? "text-blue-700" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {filterStatus === status && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 bg-white rounded-xl -z-10 border border-gray-100"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {status}
            <span className={`px-2 py-0.5 rounded-full text-[10px] transition-colors ${filterStatus === status ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
              }`}>
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      <motion.div
        layout
        className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]"
          : "grid grid-cols-1 gap-3 min-h-[400px]"
        }
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full flex flex-col items-center justify-center min-h-[400px]"
            >
              <CircleLoader size="lg" />
            </motion.div>
          ) : filteredServices.length === 0 ? (
            <motion.div
              layout
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="col-span-full bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No entries found</p>
            </motion.div>
          ) : (
            filteredServices.map((service, index) => {
              const normalizedStatus = (service.status.charAt(0).toUpperCase() + service.status.slice(1).toLowerCase()) as keyof typeof statusConfig;
              const config = statusConfig[normalizedStatus] || {
                color: "bg-gray-100 text-gray-700",
                icon: AlertTriangle
              };

              if (viewMode === 'minimal') {
                return (
                  <motion.div
                    layout
                    key={service.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => navigate(`/service/${service.id}`)}
                    className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-blue-200 transition-all cursor-pointer group flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color.split(' ')[0]}`}>
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase text-sm truncate">
                            {service.customer_name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${config.color} border border-white/20 whitespace-nowrap`}>
                            {service.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          <span>{service.contact_number}</span>
                          <span>·</span>
                          <span>{service.battery_brand || 'No Battery'}</span>
                          <span>·</span>
                          <span className="text-blue-600">₹{Number(service.service_charge).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold">
                        <Clock className="w-3 h-3" />
                        {new Date(service.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      {user?.role === "admin" && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => toggleSelect(e, service.id)}
                            className={`p-1.5 rounded-lg transition-all ${selectedIds.includes(service.id) ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-gray-400'}`}
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  layout
                  key={service.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    layout: { type: "spring", bounce: 0.2, duration: 0.6 }
                  }}
                  onClick={() => navigate(`/service/${service.id}`)}
                  className="bg-white rounded-3xl p-6 border border-gray-100 transition-shadow cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      {user?.role === "admin" && (
                        <button
                          onClick={(e) => toggleSelect(e, service.id)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                            selectedIds.includes(service.id) 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          <Wrench className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] ${config.color} border border-white/20 flex items-center gap-2`}>
                        {service.status}
                        {service.sub_status && (
                          <>
                            <span className="w-1 h-1 bg-current opacity-30 rounded-full"></span>
                            <span className="opacity-80">{service.sub_status}</span>
                          </>
                        )}
                      </span>
                      {user?.role === "admin" && (
                        <button
                          onClick={(e) => handleDelete(e, service.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300 border border-red-100"
                          title="Delete Service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">
                        {service.customer_name}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-400 font-medium flex items-center gap-2">
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          {service.contact_number}
                        </p>
                        <ContactActions phoneNumber={service.contact_number} />
                      </div>
                    </div>

                    <div className="py-4 px-5 bg-gray-50/50 group-hover:bg-blue-50/30 rounded-2xl space-y-3 transition-colors duration-500">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 uppercase font-black tracking-widest text-[10px]">Battery</span>
                        <span className="text-gray-900 font-bold">{service.battery_brand || 'N/A'} {service.battery_model || ''}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 uppercase font-black tracking-widest text-[10px]">Service Charge</span>
                        <span className="text-blue-600 font-black text-sm">₹{Number(service.service_charge).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{new Date(service.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-4 rounded-3xl flex items-center gap-8 border border-white/10 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white">
                {selectedIds.length}
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Selected</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
            >
              Clear
            </button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setServiceToDelete(null)} // Trigger dialog by opening without specific ID
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 border-none"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={serviceToDelete !== null || selectedIds.length > 0 && serviceToDelete === null} onOpenChange={(open) => {
        if (!open) {
          setServiceToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {serviceToDelete 
                ? "This action cannot be undone. This will permanently delete the service record for this customer."
                : `This action cannot be undone. This will permanently delete ${selectedIds.length} selected service records.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }} 
              disabled={isBulkDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBulkDeleting ? "Deleting..." : "Delete Record(s)"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

