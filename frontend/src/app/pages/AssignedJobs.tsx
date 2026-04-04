import { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { ServiceList, ServiceRecord } from "../components/service/ServiceList";
import { Wrench } from "lucide-react";
import { motion } from "framer-motion";

export function AssignedJobs() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignedJobs = async () => {
    try {
      setLoading(true);
      // Backend DashboardController already returns assignedJobs in the /dashboard endpoint, 
      // but we might want a dedicated endpoint or filter the /services results.
      // For now, we'll fetch all services and filter by status and assigned_to on the frontend 
      // (assuming the /services endpoint returns the necessary data for staff).
      const data = await apiClient.get<ServiceRecord[]>('/services');
      // The backend /services endpoint currently returns all services.
      // If we want to be more secure/efficient, we should add a specific endpoint.
      // But for this restructure, we'll filter here.
      setServices(data.filter(s => s.status === 'In Progress'));
    } catch (err: any) {
      console.error(err.message || "Failed to load available jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedJobs();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
          <Wrench className="w-8 h-8 text-blue-600" />
          My Active Jobs
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest text-[10px] font-bold">
          Jobs currently in progress and assigned to you
        </p>
      </motion.div>

      <ServiceList 
        services={services} 
        loading={loading} 
        emptyMessage="No active jobs assigned to you"
        onRefresh={fetchAssignedJobs}
      />
    </div>
  );
}
