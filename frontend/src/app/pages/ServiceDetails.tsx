import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Wrench, Clock, CheckCircle, ArrowLeft, User, Calendar, ShieldCheck, AlertTriangle, Zap, MapPin, Mic, Play, CreditCard, ShoppingCart, ShoppingBag } from "lucide-react";
import { BatteryLoader } from "../components/ui/BatteryLoader";
import { Button } from "../components/Button";
import { AudioRecorder } from "../components/AudioRecorder/AudioRecorder";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { apiClient } from "../api/client";
import { ServiceGpsCamera } from "../components/ServiceGpsCamera";

interface ServiceRequest {
    id: number;
    customer_name: string;
    contact_number: string;
    vehicle_details: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    service_charge: number;
    issue?: string;
    complaint_type?: string;
    complaint_details?: string;
    battery_brand?: string;
    battery_model?: string;
    battery_capacity?: string;
    address?: string;
    assigned_to?: number;
    assigned_at?: string;
    resolved_at?: string;
    voice_note?: string;
    payment_status?: 'pending' | 'verified';
    assigned_staff?: {
        id: number;
        name: string;
    };
    sale?: any;
    created_at: string;
}

interface Staff {
    id: number;
    name: string;
}

export function ServiceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const isAdmin = user?.role === "admin";

    const [service, setService] = useState<ServiceRequest | null>(null);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updating, setUpdating] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    const [isEditingSpecs, setIsEditingSpecs] = useState(false);
    const [editingSpecs, setEditingSpecs] = useState({
        battery_brand: "",
        battery_model: "",
        battery_capacity: "",
        service_charge: 0
    });

    // New states for completing service as Staff
    const [showChargeInput, setShowChargeInput] = useState(false);
    const [tempCharge, setTempCharge] = useState("");

    // New state for Admin verifying payment
    const [paymentType, setPaymentType] = useState("Cash");

    useEffect(() => {
        fetchService();
        if (isAdmin) {
            fetchStaff();
        }
    }, [id, isAdmin]);

    const fetchStaff = async () => {
        try {
            const data = await apiClient.get<Staff[]>('/staff');
            setStaffList(data);
        } catch (err) {
            console.error("Failed to load staff list", err);
        }
    };

    const fetchService = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get<ServiceRequest>(`/services/${id}`);
            setService(data);
            setEditingSpecs({
                battery_brand: data.battery_brand || "",
                battery_model: data.battery_model || "",
                battery_capacity: data.battery_capacity || "",
                service_charge: data.service_charge || 0
            });
        } catch (err: any) {
            setError(err.message || "Failed to load service details");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: ServiceRequest["status"], specificCharge?: number) => {
        if (!service) return;
        setUpdating(true);
        try {
            const payload: any = { status: newStatus };
            if (specificCharge !== undefined) {
                payload.service_charge = specificCharge;
            }

            const updated = await apiClient.put<ServiceRequest>(`/services/${id}`, payload);
            setService(updated);

            if (newStatus === "Completed") {
                addNotification({
                    type: "SERVICE",
                    title: "Service Completed",
                    message: `Service #${service.id} (${service.customer_name}) marked as completed by staff.`,
                    role: "admin"
                });
            }
        } catch (err: any) {
            alert(err.message || "Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const handleAssignStaff = async (staffId: number) => {
        if (!service) return;
        setUpdating(true);
        try {
            const updated = await apiClient.put<ServiceRequest>(`/services/${id}`, { assigned_to: staffId });
            setService(updated);

            addNotification({
                type: "SERVICE",
                title: "New Job Assigned",
                message: `You have been assigned to service #${service.id} (${service.customer_name}).`,
                role: "staff"
            });
        } catch (err: any) {
            alert(err.message || "Failed to assign staff");
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveSpecs = async () => {
        if (!service) return;
        setUpdating(true);
        try {
            const updated = await apiClient.put<ServiceRequest>(`/services/${id}`, editingSpecs);
            setService(updated);
            setIsEditingSpecs(false);
            addNotification({
                type: "SERVICE",
                title: "Specifications Updated",
                message: `Service details updated for #${service.id}.`,
                role: "admin"
            });
        } catch (err: any) {
            alert(err.message || "Failed to save specifications");
        } finally {
            setUpdating(false);
        }
    };

    const handlePickUp = async () => {
        if (!id) return;
        setUpdating(true);
        try {
            const updated = await apiClient.post<ServiceRequest>(`/services/${id}/pickup`);
            setService(updated);
            addNotification({
                type: "SERVICE",
                title: "Task Picked Up",
                message: `You have successfully picked up service #${id}.`,
                role: "staff"
            });
        } catch (err: any) {
            alert(err.message || "Failed to pick up task");
        } finally {
            setUpdating(false);
        }
    };

    const handleUploadVoiceNote = async (file: File) => {
        if (!id) return;
        setUpdating(true);
        const formData = new FormData();
        formData.append('voice_note', file);
        try {
            const updated = await apiClient.post<ServiceRequest>(`/services/${id}/voice-note`, formData);
            setService(updated);
            alert("Voice note uploaded successfully");
        } catch (err: any) {
            alert(err.message || "Failed to upload voice note");
        } finally {
            setUpdating(false);
        }
    };

    const handleVerifyPayment = async () => {
        if (!id) return;
        setUpdating(true);
        try {
            const updated = await apiClient.post<ServiceRequest>(`/services/${id}/verify-payment`);
            setService(updated);
            alert("Payment verified successfully");
            return true;
        } catch (err: any) {
            alert(err.message || "Failed to verify payment");
            return false;
        } finally {
            setUpdating(false);
        }
    };

    const handleConvertToOrder = () => {
        if (!service) return;
        navigate("/checkout", {
            state: {
                prefill: {
                    customer_name: service.customer_name,
                    contact_number: service.contact_number,
                    address: service.address,
                    service_id: service.id,
                    service_charge: service.service_charge
                }
            }
        });
    };

    if (loading) {
        return <BatteryLoader />;
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

    const currentStatus = statusConfig[service.status as keyof typeof statusConfig] || statusConfig.Pending;
    const StatusIcon = currentStatus.icon;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {updating && (
                <div className="fixed inset-0 bg-white/40 backdrop-blur-[1px] z-50 flex items-center justify-center">
                    <Zap className="w-12 h-12 text-blue-600 animate-pulse fill-current" />
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
                                                {service.address && (
                                                    <p className="text-xs text-gray-400 mt-2 italic">
                                                        <MapPin className="w-3 h-3 inline mr-1" />
                                                        {service.address}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Battery & Financials</h3>
                                        {(service.status === 'In Progress' && (isAdmin || service.assigned_to === user?.id)) && (
                                            <Button
                                                size="sm"
                                                variant={isEditingSpecs ? "primary" : "outline"}
                                                onClick={() => {
                                                    if (isEditingSpecs) {
                                                        handleSaveSpecs();
                                                    } else {
                                                        setIsEditingSpecs(true);
                                                    }
                                                }}
                                            >
                                                {isEditingSpecs ? "Save Specs" : "Edit Specs"}
                                            </Button>
                                        )}
                                    </div>

                                    {isEditingSpecs ? (
                                        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Brand</label>
                                                    <input
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200"
                                                        value={editingSpecs.battery_brand}
                                                        onChange={(e) => setEditingSpecs({ ...editingSpecs, battery_brand: e.target.value })}
                                                        placeholder="e.g. Exide"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Model</label>
                                                    <input
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200"
                                                        value={editingSpecs.battery_model}
                                                        onChange={(e) => setEditingSpecs({ ...editingSpecs, battery_model: e.target.value })}
                                                        placeholder="e.g. Matrix X7"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Capacity</label>
                                                    <input
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200"
                                                        value={editingSpecs.battery_capacity}
                                                        onChange={(e) => setEditingSpecs({ ...editingSpecs, battery_capacity: e.target.value })}
                                                        placeholder="e.g. 50Ah"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <ShieldCheck className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500">Battery Specs</p>
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {service.battery_brand || 'Not Specified'} {service.battery_model || ''}
                                                            {service.battery_capacity && ` (${service.battery_capacity})`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-medium text-gray-500">Final Service Charge</p>
                                                    <p className="text-sm font-black text-blue-600">₹{Number(service.service_charge).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Admin Verification Input */}
                                    {isAdmin && service.status === "Completed" && service.payment_status === "pending" && (
                                        <div className="mt-4 p-4 border-2 border-emerald-100 bg-emerald-50 rounded-xl space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CreditCard className="w-5 h-5 text-emerald-600" />
                                                <h4 className="font-bold text-emerald-900">Payment Verification</h4>
                                            </div>
                                            <p className="text-sm text-emerald-800 font-medium">Verify that the final service charge of <strong>₹{Number(service.service_charge).toLocaleString()}</strong> was received.</p>

                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <button
                                                    onClick={() => setPaymentType('Cash')}
                                                    className={`p-3 rounded-xl border-2 font-bold transition-colors ${paymentType === 'Cash' ? 'border-emerald-600 bg-emerald-100 text-emerald-800' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-100/50 bg-white'}`}
                                                >
                                                    Cash
                                                </button>
                                                <button
                                                    onClick={() => setPaymentType('UPI')}
                                                    className={`p-3 rounded-xl border-2 font-bold transition-colors ${paymentType === 'UPI' ? 'border-emerald-600 bg-emerald-100 text-emerald-800' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-100/50 bg-white'}`}
                                                >
                                                    UPI
                                                </button>
                                            </div>

                                            <Button
                                                onClick={async () => {
                                                    const success = await handleVerifyPayment();
                                                    if (success) {
                                                        navigate("/invoice", {
                                                            state: {
                                                                items: [{
                                                                    id: service.id,
                                                                    name: service.battery_brand || "Service",
                                                                    model: service.battery_model || "Maintenance",
                                                                    price: Number(service.service_charge),
                                                                    quantity: 1,
                                                                    warranty: "N/A",
                                                                    type: "Service"
                                                                }],
                                                                customerInfo: {
                                                                    name: service.customer_name,
                                                                    phone: service.contact_number,
                                                                    billingAddress: "N/A"
                                                                },
                                                                vehicleNumber: service.vehicle_details || "N/A",
                                                                paymentMethod: paymentType,
                                                                productSubtotal: 0,
                                                                serviceSubtotal: Number(service.service_charge),
                                                                productGst: 0,
                                                                exchangeDiscount: 0,
                                                                finalTotal: Number(service.service_charge),
                                                                warrantyDetails: {
                                                                    totalWarranty: "N/A",
                                                                    totalWarrantyExpiry: "N/A"
                                                                }
                                                            }
                                                        });
                                                    }
                                                }}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 font-bold"
                                            >
                                                <Zap className="w-4 h-4" />
                                                Verify Payment & Generate Bill
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-500">Last updated</span>
                                        </div>
                                        {service.assigned_staff && (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                                                <User className="w-3 h-3" />
                                                Assigned to: {service.assigned_staff.name}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-600" />
                            Service Actions
                        </h3>
                        <div className="space-y-4">
                            {!service.assigned_to && !isAdmin && (
                                <Button
                                    onClick={handlePickUp}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs"
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    Pick Up This Task
                                </Button>
                            )}

                            {service.status === "In Progress" && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Daily Status Update (Audio)</label>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setShowAudioRecorder(true)}
                                            variant="outline"
                                            className="flex-1 flex items-center justify-center gap-2 py-4 border-dashed border-2"
                                        >
                                            <Mic className="w-4 h-4 text-blue-600" />
                                            Record Update
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {service.voice_note && (
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Play className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-blue-900">Voice Update</p>
                                            <p className="text-[10px] text-blue-600 font-medium">Click to play recording</p>
                                        </div>
                                    </div>
                                    <audio
                                        controls
                                        className="hidden"
                                        id="voice-player"
                                        src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/storage/${service.voice_note}`}
                                    />
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => (document.getElementById('voice-player') as HTMLAudioElement)?.play()}
                                        className="text-blue-600"
                                    >
                                        <Play className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            {/* GPS Camera – capture service photos */}
                            {service.status === "In Progress" && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Service Photo (GPS Tagged)</label>
                                    <ServiceGpsCamera serviceId={service.id} />
                                </div>
                            )}

                            {service.status !== "Completed" && (
                                <Button
                                    onClick={handleConvertToOrder}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 font-bold"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    Convert to New Order
                                </Button>
                            )}

                            {service.payment_status === "pending" && isAdmin && service.status === "Completed" && (
                                <Button
                                    onClick={handleVerifyPayment}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 font-bold opacity-50 cursor-not-allowed"
                                    disabled
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Verify Payment & Close
                                </Button>
                            )}
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-600" />
                                Assign Staff
                            </h3>
                            <div className="space-y-2">
                                {staffList.map(staff => (
                                    <button
                                        key={staff.id}
                                        onClick={() => handleAssignStaff(staff.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between group ${service.assigned_to === staff.id
                                            ? "border-blue-600 bg-blue-50 text-blue-800"
                                            : "border-gray-100 hover:border-gray-200 text-gray-700"
                                            }`}
                                    >
                                        <span className="font-medium">{staff.name}</span>
                                        {service.assigned_to === staff.id && <CheckCircle className="w-4 h-4 text-blue-600" />}
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
                                    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
                                    const Icon = config.icon;
                                    const isActive = service.status === status;

                                    return (
                                        <div key={status} className="space-y-2">
                                            <button
                                                onClick={() => {
                                                    if (status === "Completed" && service.status !== "Completed") {
                                                        setShowChargeInput(true);
                                                    } else {
                                                        handleUpdateStatus(status);
                                                        setShowChargeInput(false);
                                                    }
                                                }}
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

                                            {/* Show Input Field if they select Completed */}
                                            {status === "Completed" && showChargeInput && !isActive && (
                                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 mt-2 animate-in slide-in-from-top-2">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Enter Final Service Charge (₹)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base font-bold text-gray-900"
                                                        value={tempCharge}
                                                        onChange={(e) => setTempCharge(e.target.value)}
                                                        placeholder="e.g. 500"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowChargeInput(false);
                                                                setTempCharge("");
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!tempCharge || isNaN(Number(tempCharge))) {
                                                                    alert("Please enter a valid service charge.");
                                                                    return;
                                                                }
                                                                handleUpdateStatus("Completed", Number(tempCharge));
                                                                setShowChargeInput(false);
                                                            }}
                                                        >
                                                            Confirm Completion
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                        <h3 className="font-bold mb-2">Service Policy</h3>
                        <p className="text-xs text-blue-50 leading-relaxed mb-4">
                            All services should be updated within 24 hours of registration. Please ensure charging levels are checked before completion.
                        </p>
                        <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                            View Guidelines
                        </Button>
                    </div> */}
                </div>
            </div>

            <AudioRecorder
                isOpen={showAudioRecorder}
                onClose={() => setShowAudioRecorder(false)}
                onCapture={(file) => handleUploadVoiceNote(file)}
            />
        </div>
    );
}
