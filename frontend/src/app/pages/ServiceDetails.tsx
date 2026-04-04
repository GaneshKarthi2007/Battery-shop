import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Wrench, Clock, CheckCircle, ArrowLeft, User, Calendar, AlertTriangle, Zap, MapPin, Mic, CreditCard, ShoppingCart, ShoppingBag, RefreshCw, Activity, Trash2, CheckCheck, FileText, Download, Receipt, Phone, Car, BatteryFull, TrendingUp } from "lucide-react";
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
import { CircleLoader } from "../components/ui/CircleLoader";

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
    sales?: Array<{
        id: number;
        type: 'Sale' | 'Quotation' | 'Exchange';
        customer_name: string;
        total_amount: string;
        payment_method: string;
        created_at: string;
        items: Array<{
            id: number;
            product_id: number | null;
            quantity: number;
            price: string;
            product?: { brand: string; model: string; ah: string; price: number; warranty?: string; };
        }>;
    }>;
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


const SUB_STATUS_OPTIONS = [
    "Task Picked Up / Commenced",
    "Battery Testing",
    "Charging In Progress",
    "Acid/Water Refilling",
    "Plate Inspection",
    "Load Testing",
    "Finished - Waiting for Disposal"
];

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

    const [showChargeInput, setShowChargeInput] = useState(false);
    const [tempCharge, setTempCharge] = useState("");
    const [paymentType, setPaymentType] = useState("Cash");
    const [showRevisitForm, setShowRevisitForm] = useState(false);
    const [revisitData, setRevisitData] = useState({ complaint_type: "", complaint_details: "", issue: "" });
    const [staffNote, setStaffNote] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        fetchService();
        if (isAdmin) fetchStaff();
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
            if (specificCharge !== undefined) payload.service_charge = specificCharge;
            const updated = await apiClient.put<ServiceRequest>(`/services/${id}`, payload);
            setService(updated);
            if (newStatus === "Completed") {
                addNotification({ type: "SERVICE", title: "Service Completed", message: `Service #${service.id} (${service.customer_name}) marked as completed by staff.`, role: "admin" });
            }
        } catch (err: any) {
            alert(err.message || "Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateSubStatus = async (subStatus: string) => {
        if (!id) return;
        setUpdating(true);
        try {
            const updated = await apiClient.put<ServiceRequest>(`/services/${id}`, { 
                sub_status: subStatus,
                notes: staffNote 
            });
            setService(updated);
            setStaffNote("");
            addNotification({ type: "SERVICE", title: "Progress Updated", message: `Status updated to: ${subStatus}`, role: "staff" });
        } catch (err: any) {
            alert(err.message || "Failed to update sub-status");
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
            addNotification({ type: "SERVICE", title: "New Job Assigned", message: `You have been assigned to service #${service.id} (${service.customer_name}).`, role: "staff" });
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
            addNotification({ type: "SERVICE", title: "Task Picked Up", message: `You have successfully picked up service #${id}.`, role: "staff" });
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
        if (staffNote) formData.append('notes', staffNote);
        try {
            const updated = await apiClient.post<ServiceRequest>(`/services/${id}/voice-note`, formData);
            setService(updated);
            setStaffNote("");
            addNotification({ type: "SERVICE", title: "Update Logged", message: "Your note and voice recording have been attached successfully.", role: "staff" });
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

    const handleConvertToOrder = async () => {
        if (!service) return;

        setUpdating(true);
        try {
            const updated = await apiClient.post<ServiceRequest>(`/services/${id}/mark-converted`);
            setService(updated);
            addNotification({ type: "SERVICE", title: "Conversion Requested", message: isAdmin ? `Service #${id} converted! Navigating to billing...` : `Service #${id} conversion request sent to Admin.`, role: isAdmin ? "admin" : "staff" });
            if (isAdmin) {
                navigate("/sales", { state: { fromService: true, serviceId: updated.id, customerInfo: { name: updated.customer_name, phone: updated.contact_number, address: updated.address } } });
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
            addNotification({ type: "SERVICE", title: "Revisit Created", message: `Revisit ticket #${newService.id} created from service #${id}.`, role: "admin" });
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

    const handleDeleteService = () => setShowDeleteDialog(true);

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
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <CircleLoader size="lg" />
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
        Pending: { color: "bg-yellow-100 text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-400", gradient: "from-yellow-50", icon: Clock },
        "In Progress": { color: "bg-blue-100 text-blue-700", border: "border-blue-200", dot: "bg-blue-500", gradient: "from-blue-50", icon: Wrench },
        Completed: { color: "bg-green-100 text-green-700", border: "border-green-200", dot: "bg-green-500", gradient: "from-green-50", icon: CheckCircle },
        "Converted to Order": { color: "bg-indigo-100 text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500", gradient: "from-indigo-50", icon: ShoppingCart },
    };

    const currentStatus = statusConfig[service.status as keyof typeof statusConfig] || statusConfig.Pending;

    const infoCard = (icon: React.ReactNode, label: string, value: string) => (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#0D1B2A] rounded-xl border border-gray-100 dark:border-[#2E3B55] hover:border-gray-200 dark:hover:border-blue-500/20 transition-colors dark:hover:shadow-[0_0_15px_rgba(59,130,246,0.05)]">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#15161E] border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {updating && (
                <div className="fixed inset-0 bg-white/40 backdrop-blur-[1px] z-50 flex items-center justify-center">
                    <CircleLoader size="md" />
                </div>
            )}

            {/* ── Top Nav Bar ── */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate("/service")}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
                >
                    <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm group-hover:border-blue-200 group-hover:shadow-md transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold">Back to Services</span>
                </button>

                <div className="flex items-center gap-3">
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${currentStatus.color} border ${currentStatus.border} flex items-center gap-2`}>
                        <span className={`w-2 h-2 rounded-full ${currentStatus.dot} ${service.status === 'In Progress' || service.status === 'Converted to Order' ? 'animate-pulse' : ''}`} />
                        {service.status}
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleDeleteService}
                            className="p-2 bg-white text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-200 border border-gray-200 shadow-sm"
                            title="Delete Service"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Hero Header Card ── */}
            <div className={`bg-gradient-to-r ${currentStatus.gradient} to-white rounded-2xl border ${currentStatus.border} overflow-hidden shadow-sm`}>
                <div className="p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        {/* Icon + Title */}
                        <div className="flex items-center gap-5 flex-1 min-w-0">
                            <div className="w-16 h-16 bg-white rounded-2xl border border-gray-200 shadow-md flex items-center justify-center flex-shrink-0">
                                <Wrench className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Service #{service.id}</h1>
                                    {service.parent_id && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                            <RefreshCw className="w-3 h-3" />
                                            Revisit of #{service.parent_id}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Registered on <span className="font-semibold">{new Date(service.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                            <div className="text-center px-4 py-3 bg-white/70 backdrop-blur rounded-xl border border-gray-200">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service Charge</p>
                                <p className="text-xl font-black text-gray-900 mt-0.5">₹{Number(service.service_charge).toLocaleString('en-IN')}</p>
                            </div>
                            {service.assigned_staff && (
                                <div className="text-center px-4 py-3 bg-white/70 backdrop-blur rounded-xl border border-gray-200">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned To</p>
                                    <p className="text-sm font-bold text-blue-700 mt-0.5 flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" />
                                        {service.assigned_staff.name}
                                    </p>
                                </div>
                            )}
                            <div className="text-center px-4 py-3 bg-white/70 backdrop-blur rounded-xl border border-gray-200">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment</p>
                                <p className={`text-sm font-bold mt-0.5 ${service.payment_status === 'verified' ? 'text-green-600' : 'text-amber-600'}`}>
                                    {service.payment_status === 'verified' ? '✓ Verified' : '⏳ Pending'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* ── Left Column (2/3 width) ── */}
                <div className="xl:col-span-2 space-y-6">

                    {/* Customer & Vehicle Info */}
                    <div className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <h2 className="text-sm font-bold text-gray-900">Customer & Vehicle Information</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {infoCard(<User className="w-4 h-4 text-blue-500" />, "Customer Name", service.customer_name)}
                                {infoCard(<Phone className="w-4 h-4 text-green-500" />, "Contact Number", service.contact_number)}
                                {service.vehicle_details && infoCard(<Car className="w-4 h-4 text-purple-500" />, "Vehicle", service.vehicle_details)}
                                {service.address && infoCard(<MapPin className="w-4 h-4 text-red-500" />, "Address", service.address)}
                                {service.battery_brand && infoCard(<BatteryFull className="w-4 h-4 text-amber-500" />, "Battery Brand", service.battery_brand)}
                                {service.battery_model && infoCard(<Wrench className="w-4 h-4 text-indigo-500" />, "Battery Model", service.battery_model)}
                                {service.battery_capacity && infoCard(<Zap className="w-4 h-4 text-yellow-500" />, "Capacity", service.battery_capacity)}
                            </div>

                            {/* Contact Quick Actions */}
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Contact</span>
                                <ContactActions phoneNumber={service.contact_number} iconSize={15} />
                            </div>
                        </div>
                    </div>

                    {/* Issue Details */}
                    <div className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <h2 className="text-sm font-bold text-gray-900">Issue Report</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2 px-1">Problem Category</label>
                                    <div className="p-4 bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl flex items-center gap-3 shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-500/30 dark:hover:shadow-[0_0_15px_rgba(59,130,246,0.05)]">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{service.complaint_type || "General Issue"}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2 px-1">Specific Complaint / Details</label>
                                    <div className="p-4 bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-2xl min-h-[100px] shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-500/30 dark:hover:shadow-[0_0_15px_rgba(59,130,246,0.05)]">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                            {service.complaint_details || "No specific details provided for this service request."}
                                        </p>
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
                    </div>

                    {/* Service Timeline */}
                    <div className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <h2 className="text-sm font-bold text-gray-900">Service Timeline</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-0">

                                {/* Registered */}
                                <div className="flex gap-4 relative">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center z-10">
                                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                                        </div>
                                        {(service.assigned_at || service.status_updated_at || service.resolved_at || service.billed_at) && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                                    </div>
                                    <div className="pb-5 flex-1">
                                        <p className="text-sm font-bold text-gray-900">Service Registered</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{new Date(service.created_at).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Assigned */}
                                {service.assigned_at && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center z-10">
                                                <User className="w-3.5 h-3.5 text-indigo-600" />
                                            </div>
                                            {(service.status_updated_at || service.resolved_at || service.billed_at) && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                                        </div>
                                        <div className="pb-5 flex-1">
                                            <p className="text-sm font-bold text-gray-900">Service Taken</p>
                                            {service.assigned_staff && <p className="text-xs font-semibold text-indigo-600">by {service.assigned_staff.name}</p>}
                                            <p className="text-xs text-gray-500 mt-0.5">{new Date(service.assigned_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}

                                {/* In Progress */}
                                {((service.status === 'In Progress' || service.status === 'Converted to Order' || service.status === 'Completed') && service.status_updated_at) && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center z-10">
                                                <Activity className="w-3.5 h-3.5 text-amber-600" />
                                            </div>
                                            {(service.resolved_at || service.billed_at) && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                                        </div>
                                        <div className="pb-5 flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">In Progress</p>
                                                    {service.sub_status && <p className="text-xs font-semibold text-amber-600">Sub-Status: {service.sub_status}</p>}
                                                    <p className="text-xs text-gray-500 mt-0.5">{new Date(service.status_updated_at).toLocaleString()}</p>
                                                </div>
                                                {service.assigned_to === user?.id && !isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAudioRecorder(true)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                                                    >
                                                        <Mic className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-bold uppercase">Record Update</span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Process Flows */}
                                            {service.process_flows && service.process_flows.length > 0 && (
                                                <div className="mt-3 space-y-2 ml-2 border-l-2 border-amber-200 pl-4">
                                                    {service.process_flows.slice().reverse().map((flow, fIdx) => (
                                                        <div key={flow.id} className="relative">
                                                            <div className="absolute -left-[1.375rem] top-2 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white" />
                                                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 hover:border-amber-200 transition-all">
                                                                <div className="flex justify-between items-start">
                                                                    <p className="text-xs font-bold text-gray-800">{flow.sub_status}</p>
                                                                    <span className="text-[9px] font-bold text-amber-500 uppercase">{fIdx === 0 ? "Latest" : `#${service.process_flows!.length - fIdx}`}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <p className="text-[9px] text-gray-400">{new Date(flow.created_at).toLocaleString()}</p>
                                                                    {flow.staff && <p className="text-[9px] font-bold text-gray-400 uppercase">— {flow.staff.name}</p>}
                                                                </div>
                                                                {flow.notes && (
                                                                    <p className="mt-2 text-xs text-gray-600 italic leading-relaxed bg-white/70 p-2 rounded-lg border border-amber-100/50">"{flow.notes}"</p>
                                                                )}
                                                                {flow.voice_note && (
                                                                    <div className="mt-2">
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

                                {/* Completed */}
                                {service.resolved_at && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-200 flex items-center justify-center z-10">
                                                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                            </div>
                                            {service.billed_at && isAdmin && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                                        </div>
                                        <div className="pb-5 flex-1">
                                            <p className="text-sm font-bold text-gray-900">Service Completed</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{new Date(service.resolved_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Billed */}
                                {service.billed_at && isAdmin && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center z-10">
                                                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                            </div>
                                        </div>
                                        <div className="pb-1 flex-1">
                                            <p className="text-sm font-bold text-gray-900">Payment Received <span className="text-[10px] font-semibold text-emerald-600 ml-1">(Admin View)</span></p>
                                            <p className="text-xs text-gray-500 mt-0.5">{new Date(service.billed_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Linked Documents */}
                    {service.sales && service.sales.length > 0 && (
                        <div className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-bold text-gray-900">Linked Documents</h2>
                                <span className="ml-auto text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                                    {service.sales.length} doc{service.sales.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {service.sales.map((doc) => {
                                    const isQuotation = doc.type === 'Quotation';
                                    const docItems = doc.items.map(item => ({
                                        id: item.product_id ?? `svc-${doc.id}`,
                                        name: item.product?.brand ?? service.customer_name,
                                        model: item.product?.model ?? 'Service',
                                        price: Number(item.price),
                                        quantity: item.quantity,
                                        warranty: item.product?.warranty ?? 'N/A',
                                        type: (item.product_id ? 'Product' : 'Service') as 'Product' | 'Service',
                                    }));
                                    const docState = {
                                        items: docItems,
                                        customerInfo: { name: service.customer_name, phone: service.contact_number, billingAddress: service.address || '' },
                                        vehicleNumber: service.vehicle_details || 'N/A',
                                        paymentMethod: doc.payment_method,
                                        productSubtotal: docItems.filter(i => i.type === 'Product').reduce((s, i) => s + i.price * i.quantity, 0),
                                        serviceSubtotal: docItems.filter(i => i.type === 'Service').reduce((s, i) => s + i.price * i.quantity, 0),
                                        productGst: 0, exchangeDiscount: 0,
                                        finalTotal: Number(doc.total_amount),
                                        isQuotation,
                                        warrantyDetails: { totalWarranty: 'N/A', totalWarrantyExpiry: 'N/A' },
                                    };
                                    return (
                                        <div key={doc.id} className={`flex items-center justify-between gap-3 p-4 rounded-xl border-2 ${isQuotation ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'} transition-all hover:shadow-sm`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isQuotation ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                                                    {isQuotation ? <FileText className="w-5 h-5 text-amber-600" /> : <Receipt className="w-5 h-5 text-emerald-600" />}
                                                </div>
                                                <div>
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${isQuotation ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {isQuotation ? 'Quotation' : 'Bill / Receipt'}
                                                    </span>
                                                    <p className="text-sm font-bold text-gray-900 mt-1">₹{Number(doc.total_amount).toLocaleString('en-IN')}</p>
                                                    <p className="text-[10px] text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate('/invoice', { state: docState })}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border flex-shrink-0 ${isQuotation ? 'bg-white text-amber-700 hover:bg-amber-100 border-amber-200' : 'bg-white text-emerald-700 hover:bg-emerald-100 border-emerald-200'}`}
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                {isQuotation ? 'View' : 'View'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Admin Payment Verification */}
                    {isAdmin && service.status === "Completed" && service.payment_status === "pending" && (
                        <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-emerald-600" />
                                <h2 className="text-sm font-bold text-emerald-900">Payment Verification Required</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100">
                                    <div className="flex justify-between items-center px-4 py-3 text-sm">
                                        <span className="text-gray-600">Service Charge</span>
                                        <span className="font-bold text-gray-900">₹{Number(service.service_charge).toLocaleString('en-IN')}</span>
                                    </div>
                                    {service.receipt && (
                                        <div className="flex justify-between items-center px-4 py-3 text-sm">
                                            <span className="text-gray-600">Product: {service.receipt.product?.brand || 'Battery'} (Qty: {service.receipt.quantity})</span>
                                            <span className="font-bold text-gray-900">₹{Number(service.receipt.total).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center px-4 py-3 bg-emerald-50">
                                        <span className="font-bold text-gray-900">Total Due</span>
                                        <span className="font-black text-emerald-700 text-xl">₹{(Number(service.service_charge) + (service.receipt ? Number(service.receipt.total) : 0)).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setPaymentType('Cash')} className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${paymentType === 'Cash' ? 'border-emerald-600 bg-emerald-100 text-emerald-800' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}>
                                        💵 Cash
                                    </button>
                                    <button onClick={() => setPaymentType('UPI')} className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${paymentType === 'UPI' ? 'border-emerald-600 bg-emerald-100 text-emerald-800' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}>
                                        📲 UPI
                                    </button>
                                </div>

                                <Button
                                    onClick={async () => {
                                        const success = await handleVerifyPayment();
                                        if (success) {
                                            const invoiceItems: any[] = [];
                                            if (Number(service.service_charge) > 0 || !service.receipt) {
                                                invoiceItems.push({ id: service.id, name: service.battery_brand || "Service", model: service.battery_model || "Maintenance", price: Number(service.service_charge), quantity: 1, warranty: "N/A", type: "Service" });
                                            }
                                            if (service.receipt?.product) {
                                                invoiceItems.push({ id: service.receipt.product_id, name: service.receipt.product.brand + " (From Receipt)", model: service.receipt.product.model, price: Number(service.receipt.price), quantity: service.receipt.quantity, warranty: "N/A", type: "Battery" });
                                            }
                                            navigate("/invoice", {
                                                state: {
                                                    items: invoiceItems,
                                                    customerInfo: { name: service.customer_name, phone: service.contact_number, billingAddress: service.address || "N/A" },
                                                    vehicleNumber: service.vehicle_details || "N/A",
                                                    paymentMethod: paymentType,
                                                    productSubtotal: service.receipt ? Number(service.receipt.total) : 0,
                                                    serviceSubtotal: Number(service.service_charge),
                                                    productGst: 0,
                                                    exchangeDiscount: 0,
                                                    finalTotal: Number(service.service_charge) + (service.receipt ? Number(service.receipt.total) : 0),
                                                    warrantyDetails: { totalWarranty: "N/A", totalWarrantyExpiry: "N/A" }
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
                        </div>
                    )}
                </div>

                {/* ── Right Sidebar (1/3 width) ── */}
                <div className="space-y-5 xl:sticky xl:top-4 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto xl:pr-1">

                    {/* Service Actions */}
                    <div className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-600" />
                            <h2 className="text-sm font-bold text-gray-900">Service Actions</h2>
                        </div>
                        <div className="p-5 space-y-3">

                            {/* Staff: Pick up */}
                            {!service.assigned_to && !isAdmin && (
                                <Button
                                    onClick={handlePickUp}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl flex items-center justify-center gap-2.5 font-bold text-sm shadow-md shadow-blue-100 transition-all hover:shadow-lg hover:shadow-blue-200"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    Pick Up This Task
                                </Button>
                            )}

                            {/* Staff Toolbox */}
                            {service.assigned_to === user?.id && !isAdmin && (
                                <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 border-dashed rounded-xl">
                                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                                        <Wrench className="w-3 h-3" /> Staff Toolbox
                                    </h4>
                                    
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Update Sub-Status</label>
                                        <select
                                            className="w-full px-3 py-2 rounded-xl border border-blue-100 bg-white text-sm focus:ring-2 focus:ring-blue-500 font-medium"
                                            onChange={(e) => {
                                                if (e.target.value) handleUpdateSubStatus(e.target.value);
                                            }}
                                            value={service.sub_status || ""}
                                        >
                                            <option value="" disabled>Select progress stage...</option>
                                            {SUB_STATUS_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Progress Notes</label>
                                        <textarea
                                            className="w-full px-3 py-2 rounded-xl border border-blue-100 bg-white text-sm focus:ring-2 focus:ring-blue-500 min-h-[70px] resize-none"
                                            placeholder="Add status notes... (e.g. Battery is charging well)"
                                            value={staffNote}
                                            onChange={(e) => setStaffNote(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <ServiceGpsCamera serviceId={service.id} />
                                        <Button
                                            onClick={() => setShowAudioRecorder(true)}
                                            variant="primary"
                                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold py-2.5 text-sm"
                                        >
                                            <Mic className="w-3.5 h-3.5" />
                                            Record
                                        </Button>
                                    </div>
                                    
                                    {staffNote && (
                                        <Button
                                            onClick={() => handleUpdateSubStatus(service.sub_status || "Progress Update")}
                                            className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 py-2 rounded-xl font-bold text-xs"
                                        >
                                            Save Note Only
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Convert to Order */}
                            { (service.status === "Pending" || service.status === "In Progress") && (
                                <div className="space-y-2">
                                    <Button
                                        onClick={handleConvertToOrder}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-md shadow-indigo-100 transition-all hover:shadow-lg"
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        {isAdmin ? "Convert & Bill" : "Request New Battery"}
                                    </Button>
                                </div>
                            )}

                            {/* Converted to Order Status */}
                            {service.status === "Converted to Order" && (
                                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3 text-center">
                                    <ShoppingCart className="w-6 h-6 text-indigo-500 mx-auto" />
                                    <div>
                                        <p className="font-bold text-indigo-900 text-sm">Converted to Order</p>
                                        <p className="text-xs text-indigo-600 mt-0.5">{isAdmin ? "Staff has requested a new order conversion." : "Waiting for Admin to process..."}</p>
                                    </div>
                                    {isAdmin && (
                                        <Button
                                            onClick={() => navigate("/sales", { state: { fromService: true, serviceId: service.id, customerInfo: { name: service.customer_name, phone: service.contact_number, address: service.address } } })}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                            Accept & Process
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Revisit */}
                            {service.status === "Completed" && (
                                <div className="space-y-2 pt-1 border-t border-gray-100">
                                    <Button
                                        onClick={() => setShowRevisitForm(!showRevisitForm)}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Create Revisit
                                    </Button>
                                    {showRevisitForm && (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                                            <label className="text-xs font-bold text-amber-700 uppercase">Issue Summary</label>
                                            <input
                                                className="w-full px-3 py-2 rounded-xl border border-amber-300 text-sm focus:ring-2 focus:ring-amber-500"
                                                value={revisitData.issue}
                                                onChange={(e) => setRevisitData({ ...revisitData, issue: e.target.value })}
                                                placeholder="Required..."
                                            />
                                            <div className="flex gap-2 pt-1">
                                                <Button variant="outline" className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => setShowRevisitForm(false)}>Cancel</Button>
                                                <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCreateRevisit}>Confirm</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Assign Staff (Admin) */}
                    {isAdmin && (
                        <div className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-600" />
                                <h2 className="text-sm font-bold text-gray-900">Assign Staff</h2>
                            </div>
                            <div className="p-4 space-y-2">
                                {staffList.map(staff => (
                                    <button
                                        key={staff.id}
                                        onClick={() => handleAssignStaff(staff.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between ${service.assigned_to === staff.id
                                            ? "border-blue-600 bg-blue-50 text-blue-800 shadow-sm"
                                            : "border-gray-100 hover:border-blue-200 text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${service.assigned_to === staff.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                {staff.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-semibold text-sm">{staff.name}</span>
                                        </div>
                                        {service.assigned_to === staff.id && <CheckCircle className="w-4 h-4 text-blue-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Update Status (Staff) */}
                    {!isAdmin && service.assigned_to === user?.id && (
                        <div className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-green-600" />
                                <h2 className="text-sm font-bold text-gray-900">Update Status</h2>
                            </div>
                            <div className="p-4 space-y-2">
                                {(["Pending", "In Progress", "Completed"] as const).map((status) => {
                                    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
                                    const Icon = config.icon;
                                    const isActive = service.status === status || (status === 'In Progress' && service.status === 'Converted to Order');

                                    return (
                                        <div key={status} className="space-y-2">
                                            {status === "Completed" && service.status === "Converted to Order" && (!service.sales || service.sales.length === 0) ? (
                                                <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                                        <p className="text-xs font-bold text-amber-800">Waiting for Bill / Quotation</p>
                                                    </div>
                                                    <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">Admin must process billing or quotation first.</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            if (status === "Completed" && service.status !== "Completed") {
                                                                setShowChargeInput(true);
                                                            } else {
                                                                handleUpdateStatus(status);
                                                                setShowChargeInput(false);
                                                            }
                                                        }}
                                                        className={`w-full p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${isActive ? "border-blue-600 bg-blue-50 text-blue-800 shadow-sm" : "border-gray-100 hover:border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                                                    >
                                                        <div className={`p-1.5 rounded-lg ${isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-bold text-sm">{status}</span>
                                                        {isActive && <CheckCircle className="ml-auto w-4 h-4 text-blue-600" />}
                                                    </button>

                                                    {status === "Completed" && showChargeInput && !isActive && (
                                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Final Service Charge (₹)</label>
                                                            <input
                                                                type="number"
                                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900"
                                                                value={tempCharge}
                                                                onChange={(e) => setTempCharge(e.target.value)}
                                                                placeholder="e.g. 500"
                                                            />
                                                            <div className="flex gap-2">
                                                                <Button variant="outline" className="flex-1 text-sm" onClick={() => { setShowChargeInput(false); setTempCharge(""); }}>Cancel</Button>
                                                                <Button
                                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                                                                    onClick={() => {
                                                                        if (!tempCharge || isNaN(Number(tempCharge))) { alert("Please enter a valid service charge."); return; }
                                                                        handleUpdateStatus(status, Number(tempCharge));
                                                                        setShowChargeInput(false);
                                                                    }}
                                                                >
                                                                    Confirm
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Last Updated */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Registered: <span className="font-semibold text-gray-700">{new Date(service.created_at).toLocaleDateString('en-IN')}</span></span>
                    </div>
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
