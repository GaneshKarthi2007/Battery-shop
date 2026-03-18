import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Wrench, Clock, CheckCircle, ArrowLeft, User, Calendar, AlertTriangle, Zap, MapPin, Mic, CreditCard, ShoppingCart, ShoppingBag, RefreshCw, Activity, Trash2, CheckCheck } from "lucide-react";
import { Button } from "../components/Button";
import { ContactActions } from "../components/ui/ContactActions";
import { AudioRecorder } from "../components/AudioRecorder/AudioRecorder";
import { AudioPlayer } from "../components/ui/AudioPlayer";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { apiClient } from "../api/client";
import { ServiceGpsCamera } from "../components/ServiceGpsCamera";
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

interface ServiceRequest {
    id: number;
    customer_name: string;
    contact_number: string;
    vehicle_details: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Converted to Order';
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
    sub_status?: string;
    status_updated_at?: string;
    billed_at?: string;
    parent_id?: number;
    assigned_staff?: {
        id: number;
        name: string;
    };
    sale?: any;
    receipt?: {
        id: number;
        receipt_number: string;
        product_id: number;
        quantity: number;
        price: string;
        total: string;
        product?: {
            brand: string;
            model: string;
            ah: string;
            price: number;
        }
    };
    process_flows?: ServiceProcessFlowRecord[];
    created_at: string;
}

interface ServiceProcessFlowRecord {
    id: number;
    sub_status: string;
    notes?: string;
    voice_note?: string;
    created_at: string;
    staff?: {
        id: number;
        name: string;
    };
}

interface Staff {
    id: number;
    name: string;
}


const SUB_STATUS_OPTIONS: Record<string, string[]> = {
    "Charging Issue": ["Battery on charging", "Checking Gravity", "Cell Failed", "Charged Successfully"],
    "Dead Battery": ["Checking Battery", "Battery Dead/Needs Replace", "Battery Revived"],
    "Self Start Issue": ["Checking Wiring", "Relay Issue", "Starter Motor Issue", "Resolved"],
    "Warranty Claim": ["Sent to Company", "Company Rejected", "Company Approved", "Replacement Given"],
    "Periodic Maintenance": ["Cleaning Terminals", "Topping up Water", "Checking Voltage", "Done"],
    "Other": ["Checking", "Waiting for Parts", "Work in Progress"]
};

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


    // New states for completing service as Staff
    const [showChargeInput, setShowChargeInput] = useState(false);
    const [tempCharge, setTempCharge] = useState("");

    // New state for Admin verifying payment
    const [paymentType, setPaymentType] = useState("Cash");

    // New state for Revisit Feature
    const [showRevisitForm, setShowRevisitForm] = useState(false);
    const [revisitData, setRevisitData] = useState({
        complaint_type: "",
        complaint_details: "",
        issue: ""
    });

    const [staffNote, setStaffNote] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

    const handleUpdateSubStatus = async (newSubStatus: string) => {
        if (!service) return;
        setUpdating(true);
        try {
            const updated = await apiClient.put<ServiceRequest>(`/services/${id}`, { sub_status: newSubStatus });
            setService(updated);
            addNotification({
                type: "SERVICE",
                title: "Sub Status Updated",
                message: `Service #${service.id} sub status changed to ${newSubStatus}.`,
                role: "staff"
            });
        } catch (err: any) {
            alert(err.message || "Failed to update sub status");
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
        if (staffNote) {
            formData.append('notes', staffNote);
        }

        try {
            const updated = await apiClient.post<ServiceRequest>(`/services/${id}/voice-note`, formData);
            setService(updated);
            setStaffNote("");
            addNotification({
                type: "SERVICE",
                title: "Update Logged",
                message: "Your note and voice recording have been attached successfully.",
                role: "staff"
            });
        } catch (err: any) {
            alert(err.message || "Failed to upload voice note");
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteProcessFlow = async (flowId: number) => {
        if (!confirm("Are you sure you want to delete this update? This will also delete any associated voice recording.")) return;
        setUpdating(true);
        try {
            await apiClient.delete(`/service-flows/${flowId}`);
            addNotification({
                type: "SERVICE",
                title: "Update Deleted",
                message: "The service update has been removed.",
                role: "staff"
            });
            fetchService(); // Refresh data
        } catch (err: any) {
            alert(err.message || "Failed to delete update");
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

    const handleConvertToOrder = async () => {
        if (!service) return;
        setUpdating(true);
        try {
            const updated = await apiClient.post<ServiceRequest>(`/services/${id}/mark-converted`);
            setService(updated);
            addNotification({
                type: "SERVICE",
                title: "Conversion Requested",
                message: isAdmin 
                    ? `Service #${id} converted! Navigating to billing...`
                    : `Service #${id} conversion request sent to Admin.`,
                role: isAdmin ? "admin" : "staff"
            });

            if (isAdmin) {
                // Navigate immediately to billing page
                navigate("/sales", { 
                    state: { 
                        fromService: true,
                        serviceId: updated.id,
                        customerInfo: {
                            name: updated.customer_name,
                            phone: updated.contact_number,
                            address: updated.address
                        }
                    } 
                });
            }
        } catch (err: any) {
            alert(err.message || "Failed to convert to order");
        } finally {
            setUpdating(false);
        }
    };

    const handleCreateRevisit = async () => {
        if (!id) return;
        setUpdating(true);
        try {
            const newService = await apiClient.post<ServiceRequest>(`/services/${id}/revisit`, revisitData);
            addNotification({
                type: "SERVICE",
                title: "Revisit Created",
                message: `Revisit ticket #${newService.id} created from service #${id}.`,
                role: "admin"
            });
            setShowRevisitForm(false);
            setRevisitData({ issue: "", complaint_type: "", complaint_details: "" });
            navigate(`/service/${newService.id}`);
            window.location.reload();
        } catch (err: any) {
            alert(err.message || "Failed to create revisit. Ensure the service is completed.");
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteService = () => {
        setShowDeleteDialog(true);
    };

    const confirmDeleteService = async () => {
        if (!id) return;
        setUpdating(true);
        try {
            await apiClient.delete(`/services/${id}`);
            alert("Service deleted successfully");
            navigate("/service");
        } catch (err: any) {
            alert(err.message || "Failed to delete service");
        } finally {
            setUpdating(false);
            setShowDeleteDialog(false);
        }
    };

    if (loading) {
        return <div className="min-h-[60vh] flex items-center justify-center">
            <Zap className="w-12 h-12 text-blue-600 animate-pulse fill-current" />
        </div>;
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
                    <div className="p-2 bg-white rounded-lg border border-gray-200 group-hover:border-blue-200">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">Back to Services</span>
                </button>
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-full text-sm font-bold ${currentStatus.color} flex items-center gap-2 border border-current/10`}>
                        <StatusIcon className="w-4 h-4" />
                        {service.status}
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleDeleteService}
                            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300 border border-red-100"
                            title="Delete Service"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                    <Wrench className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                        Service Case #{service.id}
                                        {service.parent_id && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                <RefreshCw className="w-3 h-3" />
                                                Revisit of #{service.parent_id}
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Registered on {new Date(service.created_at).toLocaleDateString()}</p>
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
                                                <div className="flex items-center gap-3">
                                                    <p className="text-xs text-gray-500">{service.contact_number}</p>
                                                    <ContactActions phoneNumber={service.contact_number} iconSize={14} />
                                                </div>
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

                                {/* Timestamps Timeline Section */}
                                <section className="pt-4 border-t border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Service Timeline</h3>
                                    <div className="space-y-4">
                                        {/* Added Service */}
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Clock className="w-3 h-3 text-blue-600" />
                                                </div>
                                                {(service.assigned_at || service.status_updated_at || service.resolved_at || service.billed_at) && <div className="w-px h-full bg-gray-200 mt-1"></div>}
                                            </div>
                                            <div className="pb-4">
                                                <p className="text-sm font-bold text-gray-900">Added Service</p>
                                                <p className="text-xs text-gray-500">{new Date(service.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Service Taken */}
                                        {service.assigned_at && (
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <User className="w-3 h-3 text-indigo-600" />
                                                    </div>
                                                    {((service.status === 'In Progress' || service.status === 'Completed') || service.resolved_at || service.billed_at) && <div className="w-px h-full bg-gray-200 mt-1"></div>}
                                                </div>
                                                <div className="pb-4">
                                                    <p className="text-sm font-bold text-gray-900">Service Taken</p>
                                                    <p className="text-xs text-gray-500">{new Date(service.assigned_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* In Progress */}
                                        {((service.status === 'In Progress' || service.status === 'Completed') && service.status_updated_at) && (
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                                                        <Activity className="w-3 h-3 text-amber-600" />
                                                    </div>
                                                    {(service.resolved_at || (service.billed_at && isAdmin)) && <div className="w-px h-full bg-gray-200 mt-1"></div>}
                                                </div>
                                                <div className="pb-4 flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">In Progress</p>
                                                            {service.sub_status && <p className="text-xs font-semibold text-amber-600">Sub-Status: {service.sub_status}</p>}
                                                            <p className="text-[10px] text-gray-500">{new Date(service.status_updated_at).toLocaleString()}</p>
                                                        </div>

                                                        {/* Integrated Audio Recorder for Staff */}
                                                        {service.assigned_to === user?.id && !isAdmin && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowAudioRecorder(true)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100 animate-in fade-in zoom-in-95"
                                                            >
                                                                <Mic className="w-3.5 h-3.5" />
                                                                <span className="text-[10px] font-bold uppercase">Record Update</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Nested Sub-Process Flow */}
                                                    {service.process_flows && service.process_flows.length > 0 && (
                                                        <div className="mt-4 ml-1 space-y-3 relative before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-amber-100">
                                                            {service.process_flows.slice().reverse().map((flow, fIdx) => (
                                                                <div key={flow.id} className="relative pl-5 group">
                                                                    <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-white bg-amber-400"></div>
                                                                    <div className="bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/50 hover:border-amber-200 transition-all">
                                                                        <div className="flex justify-between items-start">
                                                                            <p className="text-xs font-bold text-gray-800 leading-tight">{flow.sub_status}</p>
                                                                            <span className="text-[8px] font-bold text-amber-600/50 uppercase">
                                                                                {fIdx === 0 ? "Latest" : `#${service.process_flows!.length - fIdx}`}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <p className="text-[9px] text-gray-400 font-medium">
                                                                                {new Date(flow.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(flow.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                                                            </p>
                                                                            {flow.staff && (
                                                                                <p className="text-[9px] font-bold text-gray-400/60 uppercase">— {flow.staff.name}</p>
                                                                            )}
                                                                         </div>

                                                                         {flow.notes && (
                                                                             <p className="mt-2 text-xs text-gray-600 bg-white/50 p-2 rounded-lg border border-amber-100/30 italic leading-relaxed">
                                                                                 "{flow.notes}"
                                                                             </p>
                                                                         )}

                                                                         {flow.voice_note && (
                                                                            <div className="mt-3">
                                                                                <AudioPlayer
                                                                                    src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/storage/${flow.voice_note}`}
                                                                                    label="Status Update Audio"
                                                                                    className="!p-2 border-amber-200/50 bg-white/50"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Completed Service */}
                                        {service.resolved_at && (
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                                    </div>
                                                    {(service.billed_at && isAdmin) && <div className="w-px h-full bg-gray-200 mt-1"></div>}
                                                </div>
                                                <div className={isAdmin && service.billed_at ? "pb-4" : ""}>
                                                    <p className="text-sm font-bold text-gray-900">Completed Service</p>
                                                    <p className="text-xs text-gray-500">{new Date(service.resolved_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Paid */}
                                        {service.billed_at && isAdmin && (
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                                        <CreditCard className="w-3 h-3 text-emerald-600" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">Paid <span className="text-[10px] text-emerald-600 ml-1 uppercase">(Admin View)</span></p>
                                                    <p className="text-xs text-gray-500">{new Date(service.billed_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>



                                <section className="pt-4 border-t border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Issue Details</h3>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-bold text-gray-900">{service.complaint_type || "General Issue"}</h4>
                                                    <p className="text-xs text-gray-600 mt-1">{service.complaint_details || "No details provided."}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {service.voice_note && (
                                            <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                                <AudioPlayer
                                                    src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/storage/${service.voice_note}`}
                                                    label="Initial Complaint Voice Note"
                                                />
                                            </div>
                                        )}
                                    </div>



                                    {/* Admin Verification Input */}
                                    {isAdmin && service.status === "Completed" && service.payment_status === "pending" && (
                                        <div className="mt-4 p-4 border-2 border-emerald-100 bg-emerald-50 rounded-xl space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CreditCard className="w-5 h-5 text-emerald-600" />
                                                <h4 className="font-bold text-emerald-900">Payment Verification</h4>
                                            </div>

                                            <div className="bg-white p-4 rounded-xl border border-emerald-100 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Service Charge</span>
                                                    <span className="font-bold text-gray-900">₹{Number(service.service_charge).toLocaleString()}</span>
                                                </div>
                                                {service.receipt && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Product: {service.receipt.product?.brand || 'Battery'} (Qty: {service.receipt.quantity})</span>
                                                        <span className="font-bold text-gray-900">₹{Number(service.receipt.total).toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="pt-2 border-t border-gray-100 flex justify-between">
                                                    <span className="font-bold text-gray-900">Total Due</span>
                                                    <span className="font-black text-emerald-600 text-lg">
                                                        ₹{(Number(service.service_charge) + (service.receipt ? Number(service.receipt.total) : 0)).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-emerald-800 font-medium text-center">Please verify receipt of the Total Due amount above.</p>

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
                                                        const invoiceItems = [];

                                                        // 1. Add Service Charge
                                                        if (Number(service.service_charge) > 0 || !service.receipt) {
                                                            invoiceItems.push({
                                                                id: service.id,
                                                                name: service.battery_brand || "Service",
                                                                model: service.battery_model || "Maintenance",
                                                                price: Number(service.service_charge),
                                                                quantity: 1,
                                                                warranty: "N/A",
                                                                type: "Service"
                                                            });
                                                        }

                                                        // 2. Add Receipt Cost
                                                        if (service.receipt && service.receipt.product) {
                                                            invoiceItems.push({
                                                                id: service.receipt.product_id,
                                                                name: service.receipt.product.brand + " (From Receipt)",
                                                                model: service.receipt.product.model,
                                                                price: Number(service.receipt.price),
                                                                quantity: service.receipt.quantity,
                                                                warranty: "N/A",
                                                                type: "Battery"
                                                            });
                                                        }

                                                        const finalTotalVal = Number(service.service_charge) + (service.receipt ? Number(service.receipt.total) : 0);

                                                        navigate("/invoice", {
                                                            state: {
                                                                items: invoiceItems,
                                                                customerInfo: {
                                                                    name: service.customer_name,
                                                                    phone: service.contact_number,
                                                                    billingAddress: service.address || "N/A"
                                                                },
                                                                vehicleNumber: service.vehicle_details || "N/A",
                                                                paymentMethod: paymentType,
                                                                productSubtotal: service.receipt ? Number(service.receipt.total) : 0,
                                                                serviceSubtotal: Number(service.service_charge),
                                                                productGst: 0,
                                                                exchangeDiscount: 0,
                                                                finalTotal: finalTotalVal,
                                                                warrantyDetails: {
                                                                    totalWarranty: "N/A",
                                                                    totalWarrantyExpiry: "N/A"
                                                                }
                                                            }
                                                        });
                                                    }
                                                }}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold"
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
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-600" />
                            Service Actions
                        </h3>
                        <div className="space-y-4">
                            {!service.assigned_to && !isAdmin && (
                                <Button
                                    onClick={handlePickUp}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs"
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    Pick Up This Task
                                </Button>
                            )}

                            {service.assigned_to === user?.id && !isAdmin && (
                                <div className="bg-blue-50/50 border-2 border-blue-100 rounded-2xl p-4 space-y-4 mb-4 border-dashed">
                                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                                        <Wrench className="w-3 h-3" />
                                        Staff Toolbox
                                    </h4>

                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1">Update Progress Notes</label>
                                            <textarea
                                                className="w-full px-3 py-2 rounded-xl border border-blue-100 bg-white text-sm focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                                placeholder="Add status notes here... (e.g. Battery is charging well)"
                                                value={staffNote}
                                                onChange={(e) => setStaffNote(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <ServiceGpsCamera serviceId={service.id} />
                                            <Button
                                                onClick={() => setShowAudioRecorder(true)}
                                                variant="primary"
                                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold py-2.5"
                                            >
                                                <Mic className="w-4 h-4" />
                                                Record Update
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Conversion Actions - Visible to both Admin & Staff */}
                            {service.status !== "Converted to Order" && (
                                <Button
                                    onClick={handleConvertToOrder}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold mb-4"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {isAdmin ? "Convert & Bill" : "Request New Battery"}
                                </Button>
                            )}

                            {service.status === "Converted to Order" && (
                                <div className="w-full p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center space-y-4 mb-4">
                                    <div className="space-y-1">
                                        <ShoppingCart className="w-6 h-6 text-indigo-400 mx-auto" />
                                        <p className="font-bold text-indigo-900">Converted to Order</p>
                                        <p className="text-xs text-indigo-600">
                                            {isAdmin ? "Staff has requested a new order conversion." : "Waiting for Admin to process..."}
                                        </p>
                                    </div>
                                    {isAdmin && (
                                        <Button
                                            onClick={() => navigate("/sales", {
                                                state: {
                                                    fromService: true,
                                                    serviceId: service.id,
                                                    customerInfo: {
                                                        name: service.customer_name,
                                                        phone: service.contact_number,
                                                        address: service.address
                                                    }
                                                }
                                            })}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                            Accept & Process
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Admin-only Verification Action */}
                            {service.payment_status === "pending" && isAdmin && service.status === "Completed" && !service.receipt && (
                                <Button
                                    onClick={handleVerifyPayment}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold opacity-50 cursor-not-allowed mb-4"
                                    disabled
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Verify Payment & Close
                                </Button>
                            )}

                            {/* Revisit Case Action */}
                            {service.status === "Completed" && (
                                <div className="space-y-3 mt-4 border-t border-gray-100 pt-4">
                                    <Button
                                        onClick={() => setShowRevisitForm(!showRevisitForm)}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Create Revisit
                                    </Button>

                                    {showRevisitForm && (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-amber-700 uppercase">Issue Summary</label>
                                                <input
                                                    className="w-full px-3 py-2 rounded-xl border border-amber-300 text-sm focus:ring-2 focus:ring-amber-500"
                                                    value={revisitData.issue}
                                                    onChange={(e) => setRevisitData({ ...revisitData, issue: e.target.value })}
                                                    placeholder="Required..."
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <Button variant="outline" className="flex-1 bg-white border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => setShowRevisitForm(false)}>Cancel</Button>
                                                <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCreateRevisit}>Confirm</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
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

                    {!isAdmin && service.assigned_to === user?.id && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
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
                                                                handleUpdateStatus(status, Number(tempCharge));
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
                </div>
            </div>

            <AudioRecorder
                isOpen={showAudioRecorder}
                onClose={() => setShowAudioRecorder(false)}
                onCapture={(file) => handleUploadVoiceNote(file)}
            />

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this service record and all associated logs.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteService} className="bg-red-600 hover:bg-red-700">
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
