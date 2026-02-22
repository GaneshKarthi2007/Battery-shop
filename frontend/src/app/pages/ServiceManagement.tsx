import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Wrench, Clock, CheckCircle, Loader2, AlertTriangle, Plus } from "lucide-react";
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
    (service) => filterStatus === "All" || service.status === filterStatus
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-sm">Loading Services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-black text-gray-900 mb-2">Sync Error</h3>
        <p className="text-red-600/80 font-medium mb-6">{error}</p>
        <Button onClick={fetchServices} variant="primary">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit overflow-x-auto">
        {(["All", "Pending", "In Progress", "Completed"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${filterStatus === status
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            {status}
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${filterStatus === status ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}>
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-20 text-center border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No service requests found in this category</p>
          </div>
        ) : (
          filteredServices.map((service) => {
            // Case-insensitive status mapping
            const normalizedStatus = (service.status.charAt(0).toUpperCase() + service.status.slice(1).toLowerCase()) as keyof typeof statusConfig;
            const config = statusConfig[normalizedStatus] || {
              color: "bg-gray-100 text-gray-700",
              icon: AlertTriangle
            };

            return (
              <div
                key={service.id}
                onClick={() => navigate(`/service/${service.id}`)}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color} border border-current/10`}>
                    {service.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                      {service.customer_name}
                    </h3>
                    <p className="text-sm text-gray-500">{service.contact_number}</p>
                  </div>

                  <div className="py-3 px-4 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 uppercase font-bold tracking-tighter">Battery</span>
                      <span className="text-gray-900 font-bold">{service.battery_brand || 'N/A'} {service.battery_model || ''}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 uppercase font-bold tracking-tighter">Charge</span>
                      <span className="text-gray-900 font-bold">₹{Number(service.service_charge).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{new Date(service.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-blue-600 font-bold text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Details</span>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
