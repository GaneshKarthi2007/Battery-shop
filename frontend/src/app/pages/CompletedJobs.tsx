import { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { ServiceList, ServiceRecord } from "../components/service/ServiceList";
import { CheckCircle2, History } from "lucide-react";
import { motion } from "framer-motion";

export function CompletedJobs() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletedJobs = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<ServiceRecord[]>('/services');
      // Completed jobs for the staff member.
      setServices(data.filter(s => s.status === 'Completed'));
    } catch (err: any) {
      console.error(err.message || "Failed to load job history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedJobs();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-3">
          <History className="w-8 h-8 text-emerald-500" />
          Job History
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest text-[10px] font-bold">
          All service jobs successfully completed by you
        </p>
      </motion.div>

      <ServiceList 
        services={services} 
        loading={loading} 
        emptyMessage="You haven't completed any jobs yet"
        onRefresh={fetchCompletedJobs}
        renderAction={() => (
           <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
             <CheckCircle2 className="w-3.5 h-3.5" />
             <span className="text-[10px] font-black uppercase tracking-widest leading-none">Job Finished</span>
           </div>
        )}
      />
    </div>
  );
}
