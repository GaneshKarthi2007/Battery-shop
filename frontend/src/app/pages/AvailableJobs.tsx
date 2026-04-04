import { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { ServiceList, ServiceRecord } from "../components/service/ServiceList";
import { ClipboardList, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../components/Button";

export function AvailableJobs() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingId, setTakingId] = useState<number | null>(null);

  const fetchAvailableJobs = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<ServiceRecord[]>('/services');
      // Available jobs are those that are 'Pending' (untaken)
      setServices(data.filter(s => s.status === 'Pending'));
    } catch (err: any) {
      console.error(err.message || "Failed to load available jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleTakeJob = async (id: number) => {
    try {
      setTakingId(id);
      await apiClient.post(`/services/${id}/pickup`);
      setServices(services.filter(s => s.id !== id));
      alert("Job successfully accepted!");
    } catch (err: any) {
      alert(err.message || "Failed to accept job");
    } finally {
      setTakingId(null);
    }
  };

  useEffect(() => {
    fetchAvailableJobs();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-orange-500" />
          Available Tasks
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest text-[10px] font-bold">
          Untaken jobs posted by admin that are ready to be picked up
        </p>
      </motion.div>

      <ServiceList 
        services={services} 
        loading={loading} 
        emptyMessage="No untaken jobs available currently"
        onRefresh={fetchAvailableJobs}
        renderAction={(service) => (
          <Button
            size="sm"
            onClick={() => handleTakeJob(service.id)}
            disabled={takingId === service.id}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 border-none"
          >
            <CheckCircle2 className="w-4 h-4" />
            {takingId === service.id ? 'Taking...' : 'Accept Job'}
          </Button>
        )}
      />
    </div>
  );
}
