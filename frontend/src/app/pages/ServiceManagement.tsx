import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Wrench, Clock, CheckCircle, AlertTriangle, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BatteryLoader } from "../components/ui/BatteryLoader";
import { apiClient } from "../api/client";
import { Button } from "../components/Button";

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
  created_at: string;
}

export function ServiceManagement() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

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

  const statusCounts = {
    All: services.length,
    Pending: services.filter((s) => s.status === "Pending").length,
    "In Progress": services.filter((s) => s.status === "In Progress").length,
    Completed: services.filter((s) => s.status === "Completed").length,
  };

  if (loading) {
    return <BatteryLoader />;
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
        <Button
          onClick={() => navigate('/services/new')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Service Request
        </Button>
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
                className="absolute inset-0 bg-white rounded-xl shadow-md -z-10 border border-gray-100"
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredServices.length === 0 ? (
            <motion.div
              layout
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
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-shadow cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 rotate-0 group-hover:rotate-12">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] shadow-sm ${config.color} border border-white/20`}>
                      {service.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">
                        {service.customer_name}
                      </h3>
                      <p className="text-sm text-gray-400 font-medium flex items-center gap-2 mt-1">
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        {service.contact_number}
                      </p>
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
    </div>
  );
}

