import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Wrench, Clock, CheckCircle, ArrowLeft, User, Calendar, ShieldCheck, AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "../components/Button";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { apiClient } from "../api/client";

interface ServiceRequest {
    id: number;
    customer_name: string;
    contact_number: string;
    vehicle_details: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    service_charge: number;
    issue?: string;
    battery_brand?: string;
    battery_model?: string;
    assigned_staff?: string;
    created_at: string;
}

const mockStaff = ["Suresh Raina", "Hardik Pandya", "Jasprit Bumrah", "Virat Kohli"];

export function ServiceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const isAdmin = user?.role === "admin";

    const [service, setService] = useState<ServiceRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchService();
    }, [id]);

    const fetchService = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get<ServiceRequest>(`/services/${id}`);
            setService(data);
        } catch (err: any) {
            setError(err.message || "Failed to load service details");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: ServiceRequest["status"]) => {
        if (!service) return;
        setUpdating(true);
        try {
            const updated = await apiClient.put<ServiceRequest>(`/services/${id}`, { status: newStatus });
            setService(updated);

            if (newStatus === "Completed") {
                addNotification({
                    type: "SERVICE",
                    title: "Service Completed",
                    message: `Service #${service.id} (${service.customer_name}) marked as completed.`,
                    role: "admin"
                });
            }
        } catch (err: any) {
            alert(err.message || "Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const handleAssignStaff = async (staffName: string) => {
        if (!service) return;
        setUpdating(true);
        try {
            const updated = await apiClient.put<ServiceRequest>(`/services/${id}`, { assigned_staff: staffName });
            setService(updated);

            addNotification({
                type: "SERVICE",
                title: "New Service Assigned",
                message: `You have been assigned to service #${service.id} (${service.customer_name}).`,
                role: "staff"
            });
        } catch (err: any) {
            alert(err.message || "Failed to assign staff");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-bold animate-pulse">Loading Details...</p>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center max-w-2xl mx-auto">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-900 mb-2">Sync Error</h3>
                <p className="text-red-600/80 font-medium mb-6">{error || "Service not found"}</p>
                <Button onClick={() => navigate('/service')} variant="outline">Back to Services</Button>
            </div>
        );
    }

    const statusConfig = {
        Pending: { color: "bg-yellow-100 text-yellow-700 font-bold", icon: Clock },
        "In Progress": { color: "bg-blue-100 text-blue-700 font-bold", icon: Wrench },
        Completed: { color: "bg-green-100 text-green-700 font-bold", icon: CheckCircle },
    };

    const currentStatus = statusConfig[service.status];
    const StatusIcon = currentStatus.icon;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {updating && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            )}

            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate("/service")}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
                >
                    <div className="p-2 bg-white rounded-lg border border-gray-200 group-hover:border-blue-200 shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">Back to Services</span>
                </button>
                <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${currentStatus.color} flex items-center gap-2 border border-current/10`}>
                    <StatusIcon className="w-4 h-4" />
                    {service.status}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                    <Wrench className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Service Case #{service.id}</h2>
                                    <p className="text-sm text-gray-500">Registered on {new Date(service.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Customer Info</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <User className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{service.customer_name}</p>
                                                <p className="text-xs text-gray-500">{service.contact_number}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Battery Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <ShieldCheck className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{service.battery_brand || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">{service.battery_model || ''}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <section className="bg-orange-50/50 rounded-xl p-4 border border-orange-100">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-bold text-orange-900 mb-1">Issue Reported</h3>
                                        <p className="text-sm text-orange-800 leading-relaxed">{service.issue || 'No specific issue described.'}</p>
                                    </div>
                                </div>
                            </section>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-500">Service Charge:</span>
                                        <span className="text-sm font-bold text-gray-900">₹{Number(service.service_charge).toLocaleString()}</span>
                                    </div>
                                    {service.assigned_staff && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                                            <User className="w-3 h-3" />
                                            Assigned to: {service.assigned_staff}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {isAdmin && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-600" />
                                Assign Staff
                            </h3>
                            <div className="space-y-2">
                                {mockStaff.map(staff => (
                                    <button
                                        key={staff}
                                        onClick={() => handleAssignStaff(staff)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between group ${service.assigned_staff === staff
                                            ? "border-blue-600 bg-blue-50 text-blue-800"
                                            : "border-gray-100 hover:border-gray-200 text-gray-700"
                                            }`}
                                    >
                                        <span className="font-medium">{staff}</span>
                                        {service.assigned_staff === staff && <CheckCircle className="w-4 h-4 text-blue-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isAdmin && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-green-600" />
                                Update Status
                            </h3>
                            <div className="space-y-3">
                                {(["Pending", "In Progress", "Completed"] as const).map((status) => {
                                    const config = statusConfig[status];
                                    const Icon = config.icon;
                                    const isActive = service.status === status;

                                    return (
                                        <button
                                            key={status}
                                            onClick={() => handleUpdateStatus(status)}
                                            className={`w-full p-4 rounded-xl border-2 transition-all group flex items-center gap-3 ${isActive
                                                ? "border-blue-600 bg-blue-50 text-blue-800"
                                                : "border-gray-100 hover:border-gray-200 text-gray-600"
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 transition-colors"}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold">{status}</span>
                                            {isActive && <CheckCircle className="ml-auto w-5 h-5 text-blue-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                        <h3 className="font-bold mb-2">Service Policy</h3>
                        <p className="text-xs text-blue-50 leading-relaxed mb-4">
                            All services should be updated within 24 hours of registration. Please ensure charging levels are checked before completion.
                        </p>
                        <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                            View Guidelines
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
