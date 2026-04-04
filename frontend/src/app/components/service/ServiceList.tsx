import { motion, AnimatePresence } from "framer-motion";
import { Wrench, Clock, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router";
import { CircleLoader } from "../ui/CircleLoader";
import { ContactActions } from "../ui/ContactActions";

export interface ServiceRecord {
  id: number;
  customer_name: string;
  contact_number: string;
  vehicle_details: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Converted to Order';
  service_charge: number;
  battery_brand?: string;
  battery_model?: string;
  sub_status?: string;
  created_at: string;
}

interface ServiceListProps {
  services: ServiceRecord[];
  loading: boolean;
  emptyMessage?: string;
  onRefresh?: () => void;
  renderAction?: (service: ServiceRecord) => React.ReactNode;
}

export function ServiceList({ services, loading, emptyMessage = "No services found", onRefresh, renderAction }: ServiceListProps) {
  const navigate = useNavigate();

  const statusConfig = {
    Pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
    "In Progress": { color: "bg-blue-100 text-blue-700", icon: Wrench },
    Completed: { color: "bg-green-100 text-green-700", icon: CheckCircle },
    "Converted to Order": { color: "bg-indigo-100 text-indigo-700", icon: AlertTriangle },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleLoader size="lg" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#1B263B] rounded-3xl p-16 text-center border-2 border-dashed border-gray-100 dark:border-[#2E3B55]"
      >
        <div className="w-16 h-16 bg-gray-50 dark:bg-[#15161E] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-8 h-8 text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs">{emptyMessage}</p>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="mt-4 text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline uppercase tracking-widest"
          >
            Refresh List
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {services.map((service, index) => {
          const normalizedStatus = (service.status.charAt(0).toUpperCase() + service.status.slice(1).toLowerCase()) as keyof typeof statusConfig;
          const config = statusConfig[normalizedStatus] || {
            color: "bg-gray-100 text-gray-700",
            icon: AlertTriangle
          };

          return (
            <motion.div
              layout
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/service/${service.id}`)}
              className="bg-white dark:bg-[#1B263B] rounded-3xl p-6 border border-gray-100 dark:border-[#2E3B55] hover:border-blue-100 dark:hover:border-blue-500/30 transition-all cursor-pointer group relative overflow-hidden shadow-sm dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50 dark:bg-[#15161E] text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/20 transition-colors`}>
                  <Wrench className="w-6 h-6" />
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
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-left">
                  <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                    {service.customer_name}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-400 dark:text-gray-500 font-medium flex items-center gap-2 uppercase tracking-widest text-[10px]">
                      {service.contact_number}
                    </p>
                    <ContactActions phoneNumber={service.contact_number} />
                  </div>
                </div>

                <div className="py-4 px-5 bg-gray-50/50 dark:bg-[#15161E]/80 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-500/[0.08] rounded-2xl space-y-3 transition-colors">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest text-[10px]">Vehicle</span>
                    <span className="text-gray-900 dark:text-gray-100 font-bold uppercase truncate max-w-[120px]">{service.vehicle_details || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest text-[10px]">Battery</span>
                    <span className="text-gray-900 dark:text-gray-100 font-bold uppercase">{service.battery_brand || 'None'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {new Date(service.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {renderAction ? (
                     <div onClick={(e) => e.stopPropagation()}>
                        {renderAction(service)}
                     </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
