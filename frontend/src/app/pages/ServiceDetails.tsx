import { useState, useEffect } from "react";
import { useServiceLogIdPrefix, formatServiceLogId } from "../contexts/DeveloperContext";
import { useParams, useNavigate } from "react-router";
import { Wrench, Clock, CheckCircle, ArrowLeft, User, AlertTriangle, Zap, Mic, CreditCard, ShoppingCart, ShoppingBag, RefreshCw, Activity, Trash2, CheckCheck, Download, Receipt, Phone, TrendingUp, Check, Images, History, X, MessageCircle } from "lucide-react";
import { Button } from "../components/Button";
import { ContactActions, formatDialPhone } from "../components/ui/ContactActions";
import { MinimalConfirmDialog } from "../components/ui/MinimalConfirmDialog";
import { capitalizeFirstLetter } from "../utils/inputFormatters";
import { AudioRecorder } from "../components/AudioRecorder/AudioRecorder";
import { AudioPlayer } from "../components/ui/AudioPlayer";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { apiClient } from "../api/client";
import { ServiceGpsCamera } from "../components/ServiceGpsCamera";
import { getMediaUrl } from "../utils/media";
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
    service_code?: string;
    log_id?: string;
    customer_code?: string;
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
    voice_note_url?: string | null;
    payment_status?: 'pending' | 'verified';
    payment_method?: 'Cash' | 'UPI' | string;
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
        gst_enabled?: boolean | number;
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
    voice_note_url?: string | null;
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
  const logIdPrefix = useServiceLogIdPrefix();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const isAdmin = user?.role === "admin";
    const isStaff = user?.role === "staff";

    const [service, setService] = useState<ServiceRequest | null>(null);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updating, setUpdating] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);

    const [tempCharge, setTempCharge] = useState("");
    const [paymentType, setPaymentType] = useState<"Cash" | "UPI">("Cash");
    const [showRevisitForm, setShowRevisitForm] = useState(false);
    const [revisitData, setRevisitData] = useState({ complaint_type: "", complaint_details: "", issue: "" });
    const [staffNote, setStaffNote] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [subStatusList, setSubStatusList] = useState<string[]>(SUB_STATUS_OPTIONS);
    const [selectedSubStatus, setSelectedSubStatus] = useState<string>("");
    const [customSubStatus, setCustomSubStatus] = useState<string>("");
    const [isEditingPayment, setIsEditingPayment] = useState<boolean>(false);
    const [showGalleryModal, setShowGalleryModal] = useState<boolean>(false);
    const [showTimelineModal, setShowTimelineModal] = useState<boolean>(false);
    const [showQuickContact, setShowQuickContact] = useState<boolean>(false);
    const [showUnsavedConfirm, setShowUnsavedConfirm] = useState<boolean>(false);

    useEffect(() => {
        fetchService();
        if (isAdmin) fetchStaff();
    }, [id, isAdmin]);

    const fetchStaff = async () => {
        try {
            const data = await apiClient.get<Staff[]>('/staff');
            setStaffList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load staff list", err);
        }
    };

    const fetchService = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get<ServiceRequest>(`/services/${id}`);
            setService(data);
            setSelectedSubStatus(data.sub_status || "");
            if (data.sub_status && !SUB_STATUS_OPTIONS.includes(data.sub_status)) {
                setSubStatusList(prev => prev.includes(data.sub_status!) ? prev : [...prev, data.sub_status!]);
            }
            setTempCharge(data.service_charge ? data.service_charge.toString() : "0");
            if (data.payment_method === "UPI" || data.payment_method === "Cash") {
                setPaymentType(data.payment_method);
            }
            if (data.status === "Completed" && (!data.payment_method || data.payment_status !== "verified")) {
                setIsEditingPayment(true);
            } else {
                setIsEditingPayment(false);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load service details");
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteTask = async () => {
        if (!service) return;
        setUpdating(true);
        try {
            const updated = await apiClient.put<ServiceRequest>(`/services/${id}`, {
                status: "Completed"
            });
            setService(updated);
            setIsEditingPayment(true);
            addNotification({
                type: "SERVICE",
                title: "Task Completed",
                message: `Service #${service.id} marked as completed. Please record payment.`,
                role: "staff"
            });
        } catch (err: any) {
            alert(err.message || "Failed to complete task");
        } finally {
            setUpdating(false);
        }
    };

    const handleSavePayment = async () => {
        if (!service) return;
        const charge = tempCharge !== "" ? Number(tempCharge) : 0;
        if (isNaN(charge) || charge < 0) {
            alert("Please enter a valid service charge amount (0 or more).");
            return;
        }
        setUpdating(true);
        try {
            const payload: any = {
                service_charge: charge,
                payment_method: paymentType,
                payment_status: "verified"
            };
            const updated = await apiClient.put<ServiceRequest>(`/services/${id}`, payload);
            setService(updated);
            setTempCharge(updated.service_charge ? updated.service_charge.toString() : "0");
            setIsEditingPayment(false);
            addNotification({
                type: "SERVICE",
                title: "Payment Recorded",
                message: `Payment of ₹${charge} recorded via ${paymentType} for Service #${service.id}.`,
                role: "staff"
            });
        } catch (err: any) {
            alert(err.message || "Failed to record payment");
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
            setSelectedSubStatus(updated.sub_status || "");
            if (updated.sub_status && !SUB_STATUS_OPTIONS.includes(updated.sub_status)) {
                setSubStatusList(prev => prev.includes(updated.sub_status!) ? prev : [...prev, updated.sub_status!]);
            }
            setTempCharge(updated.service_charge ? updated.service_charge.toString() : "0");
            setStaffNote("");
            addNotification({ type: "SERVICE", title: "Progress Updated", message: `Status updated to: ${subStatus}`, role: "staff" });
        } catch (err: any) {
            alert(err.message || "Failed to update sub-status");
        } finally {
            setUpdating(false);
        }
    };

    const effectiveSubStatus = selectedSubStatus === "Others" ? customSubStatus.trim() : selectedSubStatus;
    const currentSavedSubStatus = service?.sub_status || "";
    const isSameSubStatus = effectiveSubStatus === currentSavedSubStatus;
    const isTickDisabled = updating || !effectiveSubStatus || isSameSubStatus;

    const handleConfirmSubStatus = async () => {
        if (isTickDisabled) return;
        const statusToApply = effectiveSubStatus;
        if (selectedSubStatus === "Others" && statusToApply) {
            if (!subStatusList.includes(statusToApply)) {
                setSubStatusList(prev => [...prev, statusToApply]);
            }
            setSelectedSubStatus(statusToApply);
            setCustomSubStatus("");
        }
        await handleUpdateSubStatus(statusToApply);
    };

    const handleAssignStaff = async (staffId: number) => {
        if (!service) return;
        setUpdating(true);
        try {
            const updated = await apiClient.put<ServiceRequest>(`/services/${id}`, { assigned_to: staffId });
            setService(updated);
            setTempCharge(updated.service_charge ? updated.service_charge.toString() : "0");
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
            setTempCharge(updated.service_charge ? updated.service_charge.toString() : "0");
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
            setTempCharge(updated.service_charge ? updated.service_charge.toString() : "0");
            setStaffNote("");
            addNotification({ type: "SERVICE", title: "Update Logged", message: "Your note and voice recording have been attached successfully.", role: "staff" });
        } catch (err: any) {
            alert(err.message || "Failed to upload voice note");
        } finally {
            setUpdating(false);
        }
    };

    const handleVerifyPayment = async (serviceCharge?: number) => {
        if (!id) return;
        setUpdating(true);
        try {
            const updated = await apiClient.post<ServiceRequest>(`/services/${id}/verify-payment`, {
                service_charge: serviceCharge
            });
            setService(updated);
            setTempCharge(updated.service_charge ? updated.service_charge.toString() : "0");
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
    const isNewConnection = Boolean(service.complaint_type?.trim().toLowerCase().includes("new connection"));
    const hasBilledProduct = Boolean((service.sales && service.sales.length > 0) || service.receipt);
    const dialPhone = formatDialPhone(service.contact_number);
    const hasUnsavedStaffChanges = Boolean(
        isStaff && (
            staffNote.trim().length > 0 ||
            (selectedSubStatus !== "" && selectedSubStatus !== (service.sub_status || "")) ||
            (isEditingPayment && (
                tempCharge !== (service.service_charge ? service.service_charge.toString() : "0") ||
                paymentType !== (service.payment_method === "UPI" ? "UPI" : "Cash")
            ))
        )
    );

    const navigateBackFromDetails = () => {
        if (isAdmin) {
            navigate("/service");
        } else if (service?.status === 'Completed' || service?.status === 'Converted to Order') {
            navigate("/completed-jobs");
        } else {
            navigate("/assigned-jobs");
        }
    };

    const handleBackClick = () => {
        if (hasUnsavedStaffChanges) {
            setShowUnsavedConfirm(true);
            return;
        }
        navigateBackFromDetails();
    };

    const openNewConnectionBilling = () => {
        navigate("/sales", {
            state: {
                fromService: true,
                isNewConnection: true,
                serviceId: service.id,
                customerInfo: {
                    name: service.customer_name,
                    phone: service.contact_number,
                    address: service.address || ""
                },
                serviceSpecs: {
                    complaint_type: service.complaint_type,
                    complaint_details: service.complaint_details,
                    vehicle_details: service.vehicle_details,
                    battery_brand: service.battery_brand,
                    battery_model: service.battery_model,
                    battery_capacity: service.battery_capacity,
                }
            }
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {updating && (
                <div className="fixed inset-0 bg-white/40 backdrop-blur-[1px] z-50 flex items-center justify-center">
                    <CircleLoader size="md" />
                </div>
            )}

            {/* ── Top Nav Bar ── */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handleBackClick}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
                >
                    <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm group-hover:border-blue-200 group-hover:shadow-md transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold">{isStaff ? "Back to Tasks" : "Back to Services"}</span>
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
            <div className={`bg-gradient-to-r ${currentStatus.gradient} to-white dark:to-[#0D121F] rounded-2xl border ${currentStatus.border} dark:border-[#25314D] overflow-hidden shadow-sm`}>
                <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Icon + Title */}
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-[#161D30] rounded-2xl border border-gray-200 dark:border-[#25314D] shadow-sm flex items-center justify-center flex-shrink-0">
                                <Wrench className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Service #{formatServiceLogId(logIdPrefix, service.log_id || service.service_code || service.id)}</h1>
                                    {service.parent_id && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                                            <RefreshCw className="w-3 h-3" />
                                            Revisit of #{service.parent_id}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Registered on <span className="font-semibold">{new Date(service.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </p>
                            </div>
                        </div>

                        {/* Right Area of Header: Staff Customer Details vs Admin Assigned Staff + Gallery/Timeline Icons */}
                        {isStaff ? (
                            <div className="flex items-center gap-3 p-3 bg-white/95 dark:bg-[#161D30]/95 backdrop-blur rounded-xl border border-gray-200 dark:border-[#25314D] shadow-xs flex-shrink-0">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate">{service.customer_name}</span>
                                        {service.customer_code && (
                                            <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/50">
                                                {service.customer_code}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 font-mono">{service.contact_number}</span>
                                        <ContactActions phoneNumber={service.contact_number} iconSize={13} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 flex-wrap sm:justify-end flex-shrink-0">
                                <div className="px-3 py-1.5 bg-white/90 dark:bg-[#161D30]/90 backdrop-blur rounded-xl border border-gray-200 dark:border-[#25314D] flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider leading-none">Assigned Staff</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 leading-none">
                                            {service.assigned_staff?.name || "Unassigned"}
                                        </p>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setShowGalleryModal(true)}
                                            aria-label="Job Site Photos"
                                            title="Job Site Photos"
                                            className="p-2.5 bg-white hover:bg-blue-50 text-blue-600 rounded-xl border border-gray-200 shadow-xs transition-colors"
                                        >
                                            <Images className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowTimelineModal(true)}
                                            aria-label="Service Timeline"
                                            title="Service Timeline"
                                            className="p-2.5 bg-white hover:bg-indigo-50 text-indigo-600 rounded-xl border border-gray-200 shadow-xs transition-colors"
                                        >
                                            <History className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isStaff ? (
                /* ── Staff Single-Page Layout (No-Scroll View) ── */
                <div className="space-y-3.5">
                    {/* Small Issue Report Summary */}
                    <div className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                {service.complaint_type || "General Issue"}
                            </span>
                            {(service.battery_brand || service.battery_model) && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                                    {[service.battery_brand, service.battery_model, service.battery_capacity].filter(Boolean).join(" ")}
                                </span>
                            )}
                            {service.complaint_details && (
                                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                    <span className="font-bold text-gray-800 dark:text-gray-200">Note:</span> {service.complaint_details}
                                </span>
                            )}
                        </div>
                        {service.voice_note && (
                            <div className="flex-shrink-0">
                                <AudioPlayer
                                    src={getMediaUrl(service.voice_note_url ?? service.voice_note)}
                                    label="Initial Voice Note"
                                    className="!p-1.5 !text-xs"
                                />
                            </div>
                        )}
                    </div>

                    {/* Staff 2-Column Responsive Workspace */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Staff Toolbox */}
                        <div className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] p-4 sm:p-5 shadow-xs space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                                <Wrench className="w-4 h-4 text-blue-600" />
                                <h2 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">Staff Toolbox</h2>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                    Update Sub-Status
                                </label>
                                <div className="flex items-center gap-2">
                                    <select
                                        aria-label="Update Sub-Status"
                                        className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        value={selectedSubStatus}
                                        onChange={(e) => {
                                            setSelectedSubStatus(e.target.value);
                                            if (e.target.value !== "Others") {
                                                setCustomSubStatus("");
                                            }
                                        }}
                                    >
                                        <option value="">Select progress stage...</option>
                                        {subStatusList.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        <option value="Others">Others</option>
                                    </select>
                                    <button
                                        type="button"
                                        aria-label="Confirm Sub-Status"
                                        title={isTickDisabled ? "No changes to save" : "Confirm Sub-Status"}
                                        disabled={isTickDisabled}
                                        onClick={handleConfirmSubStatus}
                                        className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
                                    >
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                    </button>
                                </div>
                                {selectedSubStatus === "Others" && (
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            aria-label="Custom Sub-Status"
                                            placeholder="Type custom sub-status..."
                                            value={customSubStatus}
                                            onChange={(e) => setCustomSubStatus(capitalizeFirstLetter(e.target.value))}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0D1B2A] border border-blue-300 dark:border-blue-600 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                    Progress Notes
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="Add status notes... (e.g. Battery is charging well)"
                                    value={staffNote}
                                    onChange={(e) => setStaffNote(capitalizeFirstLetter(e.target.value))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <ServiceGpsCamera serviceId={service.id} />
                                <Button
                                    onClick={() => setShowAudioRecorder(true)}
                                    variant="primary"
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold py-2 text-xs"
                                >
                                    <Mic className="w-3.5 h-3.5" />
                                    Record Audio
                                </Button>
                            </div>

                            {staffNote && (
                                <Button
                                    onClick={() => handleUpdateSubStatus(service.sub_status || "Progress Update")}
                                    className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 py-2 rounded-xl font-bold text-xs"
                                >
                                    Save Note Only
                                </Button>
                            )}
                        </div>

                        {/* Status & Payment Completion */}
                        <div className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] p-4 sm:p-5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-600" />
                                    <h2 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">Update Status & Payment</h2>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${currentStatus.color}`}>
                                    {service.status}
                                </span>
                            </div>

                            {service.status === "Pending" && (
                                <div className="space-y-3 py-4 text-center">
                                    <p className="text-xs text-gray-500">This task has not been commenced yet.</p>
                                    <Button
                                        onClick={handlePickUp}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
                                    >
                                        <Wrench className="w-3.5 h-3.5" />
                                        Pick Up & Start Task
                                    </Button>
                                </div>
                            )}

                            {service.status === "In Progress" && (
                                <div className="space-y-3">
                                    {isNewConnection && !hasBilledProduct ? (
                                        <>
                                            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-xl text-center">
                                                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                                                    New Connection — Product Billing Required
                                                </p>
                                                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                                                    Bill a product for this new connection first, then proceed with standard service completion.
                                                </p>
                                            </div>

                                            <Button
                                                onClick={openNewConnectionBilling}
                                                disabled={updating}
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs"
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                Bill Product
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl text-center">
                                                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                                                    Task In Progress
                                                </p>
                                                <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                                                    {isNewConnection
                                                        ? "Product billed. Follow the standard service steps and complete task when installation is done."
                                                        : "Complete task when servicing is done, or request new battery replacement."}
                                                </p>
                                            </div>

                                            {isNewConnection && service.sales && service.sales.length > 0 && (
                                                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Receipt className="w-3.5 h-3.5" />
                                                            Billed Product ({service.sales.length})
                                                        </span>
                                                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                                                            ₹{Number(service.sales[0].total_amount).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                    {service.sales[0].items?.map((item) => (
                                                        <p key={item.id} className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                                            {item.product ? `${item.product.brand} ${item.product.model}` : "Product"} × {item.quantity}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}

                                            <Button
                                                onClick={handleCompleteTask}
                                                disabled={updating}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Complete Task
                                            </Button>

                                            {isNewConnection ? (
                                                <Button
                                                    onClick={openNewConnectionBilling}
                                                    disabled={updating}
                                                    variant="outline"
                                                    className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                                                >
                                                    <ShoppingCart className="w-3.5 h-3.5" />
                                                    Bill Another Product
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={handleConvertToOrder}
                                                    disabled={updating}
                                                    variant="outline"
                                                    className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                                                >
                                                    <ShoppingCart className="w-3.5 h-3.5" />
                                                    Request New Battery
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {service.status === "Completed" && (
                                <div className="space-y-3">
                                    {(!isEditingPayment && service.payment_status === "verified" && service.payment_method) ? (
                                        <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                    <span className="font-bold text-xs uppercase tracking-wide">Task Completed Successfully</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditingPayment(true)}
                                                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="p-2.5 bg-white dark:bg-[#0D1B2A] rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Service Charge</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">₹{Number(service.service_charge).toLocaleString('en-IN')}</p>
                                                </div>
                                                <div className="p-2.5 bg-white dark:bg-[#0D1B2A] rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Payment Method</p>
                                                    <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{service.payment_method || paymentType || "Cash"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                                                <CheckCheck className="w-3.5 h-3.5" />
                                                Payment status: Verified
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="bg-gray-50 dark:bg-[#0D1B2A] p-3 rounded-xl border border-gray-200 dark:border-[#2E3B55] space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <label htmlFor="service-charge-input" className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                                        Service Charge Amount (₹)
                                                    </label>
                                                    <span className="text-[10px] text-gray-400">Enter final charge</span>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-400 text-sm">₹</span>
                                                    <input
                                                        id="service-charge-input"
                                                        aria-label="Service Charge Amount"
                                                        type="number"
                                                        inputMode="numeric"
                                                        value={tempCharge}
                                                        onChange={(e) => setTempCharge(e.target.value)}
                                                        placeholder="0"
                                                        className="w-full pl-7 pr-3 py-2 bg-white dark:bg-[#15161E] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                                                        Payment Method
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPaymentType("Cash")}
                                                            className={`py-2 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                                                                paymentType === "Cash"
                                                                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-transparent"
                                                            }`}
                                                        >
                                                            💵 Cash
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPaymentType("UPI")}
                                                            className={`py-2 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                                                                paymentType === "UPI"
                                                                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-transparent"
                                                            }`}
                                                        >
                                                            📱 UPI
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={handleSavePayment}
                                                disabled={updating}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Confirm & Save Payment
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {service.status === "Converted to Order" && (
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-xl text-center space-y-1">
                                    <ShoppingCart className="w-6 h-6 text-indigo-500 mx-auto" />
                                    <p className="font-bold text-xs text-indigo-900 dark:text-indigo-200">Converted to Order</p>
                                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400">Waiting for admin billing and dispatch.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* ── Admin / Manager Compact Workspace ── */
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* ── Left Column (2/3 width) ── */}
                <div className="xl:col-span-2 space-y-4">

                    {/* Single Compact Service Summary Card */}
                    <div
                        data-testid="admin-compact-info"
                        className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-xs p-4 space-y-3"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="p-2.5 bg-gray-50 dark:bg-[#0D1B2A] rounded-xl border border-gray-100 dark:border-[#2E3B55] min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer Name</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate mt-0.5">{service.customer_name}</p>
                            </div>

                            <div className="p-2.5 bg-gray-50 dark:bg-[#0D1B2A] rounded-xl border border-gray-100 dark:border-[#2E3B55] min-w-0 relative">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</p>
                                <button
                                    type="button"
                                    onClick={() => setShowQuickContact((prev) => !prev)}
                                    className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline font-mono mt-0.5 flex items-center gap-1.5"
                                    title="Tap for quick contact options"
                                >
                                    <Phone className="w-3.5 h-3.5 shrink-0" />
                                    <span>{service.contact_number}</span>
                                </button>

                                {showQuickContact && dialPhone && (
                                    <div
                                        data-testid="mobile-quick-contact-menu"
                                        className="mt-2 flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-[#2E3B55]"
                                    >
                                        <a
                                            href={`tel:+${dialPhone}`}
                                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <Phone className="w-3.5 h-3.5" />
                                            Call
                                        </a>
                                        <a
                                            href={`https://wa.me/${dialPhone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            WhatsApp
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="p-2.5 bg-gray-50 dark:bg-[#0D1B2A] rounded-xl border border-gray-100 dark:border-[#2E3B55] min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service Category</p>
                                <p className={`text-sm font-bold truncate mt-0.5 ${isNewConnection ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                                    {service.complaint_type || "General Issue"}
                                </p>
                            </div>
                        </div>

                        {service.complaint_details && service.complaint_details.trim() !== "" && (
                            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/70 dark:border-amber-900/30 rounded-xl">
                                <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">
                                    Specific Complaint Details
                                </p>
                                <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-medium">
                                    {service.complaint_details}
                                </p>
                            </div>
                        )}

                        {service.voice_note && (
                            <AudioPlayer
                                src={getMediaUrl(service.voice_note_url ?? service.voice_note)}
                                label="Initial Complaint Voice Note"
                            />
                        )}
                    </div>

                    {/* Linked Products */}
                    {((service.sales && service.sales.length > 0) || service.receipt) && (
                        <div
                            data-testid="linked-products-card"
                            className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-xs overflow-hidden"
                        >
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2E3B55] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-indigo-600" />
                                    <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Linked Products</h2>
                                </div>
                                {service.sales && service.sales.length > 0 && (
                                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        {service.sales.length} bill{service.sales.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <div className="p-3.5 space-y-2.5">
                                {service.sales?.map((doc) => {
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
                                        gst_enabled: doc.gst_enabled,
                                    };
                                    return (
                                        <div key={doc.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${isQuotation ? 'bg-amber-50/70 border-amber-200' : 'bg-emerald-50/70 border-emerald-200'}`}>
                                            <div className="min-w-0 space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${isQuotation ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {isQuotation ? 'Quotation' : 'Bill'}
                                                    </span>
                                                    <span className="text-xs font-black text-gray-900">₹{Number(doc.total_amount).toLocaleString('en-IN')}</span>
                                                    <span className="text-[10px] text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="text-xs font-semibold text-gray-700 truncate">
                                                    {doc.items
                                                        .filter(i => i.product)
                                                        .map(i => `${i.product!.brand} ${i.product!.model} × ${i.quantity}`)
                                                        .join(", ") || "Service Charge"}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate('/invoice', { state: docState })}
                                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border shrink-0 bg-white ${isQuotation ? 'text-amber-700 border-amber-200 hover:bg-amber-100' : 'text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                View
                                            </button>
                                        </div>
                                    );
                                })}

                                {service.receipt && (!service.sales || service.sales.length === 0) && (
                                    <div className="flex items-center justify-between p-3 rounded-xl border border-indigo-200 bg-indigo-50/60">
                                        <span className="text-xs font-bold text-gray-900">
                                            {service.receipt.product ? `${service.receipt.product.brand} ${service.receipt.product.model}` : 'Product'} × {service.receipt.quantity}
                                        </span>
                                        <span className="text-xs font-black text-indigo-700">₹{Number(service.receipt.total).toLocaleString('en-IN')}</span>
                                    </div>
                                )}
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
                                        <span className="text-gray-600 font-bold">Service Charge (Optional)</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-500 font-bold">₹</span>
                                            <input
                                                type="number"
                                                className="w-20 px-2 py-1 text-right font-black text-gray-900 border border-gray-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={tempCharge}
                                                onChange={(e) => setTempCharge(e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    {service.receipt && (
                                        <div className="flex justify-between items-center px-4 py-3 text-sm">
                                            <span className="text-gray-600">Product: {service.receipt.product?.brand || 'Battery'} (Qty: {service.receipt.quantity})</span>
                                            <span className="font-bold text-gray-900">₹{Number(service.receipt.total).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center px-4 py-3 bg-emerald-50">
                                        <span className="font-bold text-gray-900">Total Due</span>
                                        <span className="font-black text-emerald-700 text-xl">₹{(Number(tempCharge || 0) + (service.receipt ? Number(service.receipt.total) : 0)).toLocaleString('en-IN')}</span>
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
                                        const chargeVal = tempCharge ? Number(tempCharge) : 0;
                                        const success = await handleVerifyPayment(chargeVal);
                                        if (success) {
                                            const invoiceItems: any[] = [];
                                            if (chargeVal > 0 || !service.receipt) {
                                                invoiceItems.push({ id: service.id, name: service.battery_brand || "Service Charge", model: service.battery_model || "Maintenance", price: chargeVal, quantity: 1, warranty: "N/A", type: "Service" });
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
                                                    serviceSubtotal: chargeVal,
                                                    productGst: 0,
                                                    exchangeDiscount: 0,
                                                    finalTotal: chargeVal + (service.receipt ? Number(service.receipt.total) : 0),
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
                <div className="space-y-4">

                    {/* Service Actions (hidden when New Connection and already assigned/no revisit needed) */}
                    {((!service.assigned_to && !isAdmin) ||
                      (!isNewConnection && (service.status === "Pending" || service.status === "In Progress" || service.status === "Converted to Order")) ||
                      service.status === "Completed") && (
                        <div className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-xs overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2E3B55] flex items-center gap-2">
                                <Zap className="w-4 h-4 text-blue-600" />
                                <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Service Actions</h2>
                            </div>
                            <div className="p-4 space-y-3">

                                {/* Staff: Pick up */}
                                {!service.assigned_to && !isAdmin && (
                                    <Button
                                        onClick={handlePickUp}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm"
                                    >
                                        <ShoppingBag className="w-4 h-4" />
                                        Pick Up This Task
                                    </Button>
                                )}

                                {/* Convert to Order (only for regular service jobs, never for New Connection) */}
                                {!isNewConnection && (service.status === "Pending" || service.status === "In Progress") && (
                                    <Button
                                        onClick={handleConvertToOrder}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm"
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        {isAdmin ? "Convert & Bill" : "Request New Battery"}
                                    </Button>
                                )}

                                {/* Converted to Order Status (regular service only) */}
                                {!isNewConnection && service.status === "Converted to Order" && (
                                    <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2.5 text-center">
                                        <ShoppingCart className="w-5 h-5 text-indigo-500 mx-auto" />
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
                                    <div className="space-y-2">
                                        <Button
                                            onClick={() => setShowRevisitForm(!showRevisitForm)}
                                            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Create Revisit
                                        </Button>
                                        {showRevisitForm && (
                                            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5 animate-in slide-in-from-top-2">
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
                    )}

                    {/* Assign Staff (Admin) — hidden once a staff member is assigned */}
                    {isAdmin && !service.assigned_to && (
                        <div
                            data-testid="assign-staff-module"
                            className="bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-xs overflow-hidden"
                        >
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2E3B55] flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-600" />
                                <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Assign Staff</h2>
                            </div>
                            <div className="p-3.5 space-y-2">
                                {staffList.map(staff => (
                                    <button
                                        key={staff.id}
                                        onClick={() => handleAssignStaff(staff.id)}
                                        className="w-full text-left px-3.5 py-2.5 rounded-xl border border-gray-200 hover:border-blue-300 text-gray-700 hover:bg-blue-50/40 transition-all flex items-center gap-2.5"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-black">
                                            {staff.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-semibold text-sm">{staff.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            )}

            {/* Job Site Photos Gallery Modal (Admin) */}
            {showGalleryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowGalleryModal(false)} />
                    <div
                        data-testid="gallery-modal"
                        className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-2xl overflow-hidden"
                    >
                        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-[#2E3B55] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Images className="w-4 h-4 text-blue-600" />
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Job Site Photos</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowGalleryModal(false)}
                                aria-label="Close Job Site Photos"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 max-h-[75vh] overflow-y-auto">
                            <ServiceGpsCamera serviceId={service.id} readOnly={true} />
                        </div>
                    </div>
                </div>
            )}

            {/* Service Timeline Modal (Admin) */}
            {showTimelineModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowTimelineModal(false)} />
                    <div
                        data-testid="timeline-modal"
                        className="relative z-10 w-full max-w-lg bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-2xl overflow-hidden"
                    >
                        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-[#2E3B55] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Service Timeline</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTimelineModal(false)}
                                aria-label="Close Service Timeline"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-0">
                            <div className="flex gap-4 relative">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center z-10">
                                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    {(service.assigned_at || service.status_updated_at || service.resolved_at || service.billed_at) && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                                </div>
                                <div className="pb-5 flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Service Registered</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{new Date(service.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            {service.assigned_at && (
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center z-10">
                                            <User className="w-3.5 h-3.5 text-indigo-600" />
                                        </div>
                                        {(service.status_updated_at || service.resolved_at || service.billed_at) && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                                    </div>
                                    <div className="pb-5 flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Service Taken</p>
                                        {service.assigned_staff && <p className="text-xs font-semibold text-indigo-600">by {service.assigned_staff.name}</p>}
                                        <p className="text-xs text-gray-500 mt-0.5">{new Date(service.assigned_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}

                            {((service.status === 'In Progress' || service.status === 'Converted to Order' || service.status === 'Completed') && service.status_updated_at) && (
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center z-10">
                                            <Activity className="w-3.5 h-3.5 text-amber-600" />
                                        </div>
                                        {(service.resolved_at || service.billed_at) && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                                    </div>
                                    <div className="pb-5 flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">In Progress</p>
                                        {service.sub_status && <p className="text-xs font-semibold text-amber-600">Sub-Status: {service.sub_status}</p>}
                                        <p className="text-xs text-gray-500 mt-0.5">{new Date(service.status_updated_at).toLocaleString()}</p>

                                        {service.process_flows && service.process_flows.length > 0 && (
                                            <div className="mt-3 space-y-2 ml-2 border-l-2 border-amber-200 pl-4">
                                                {service.process_flows.slice().reverse().map((flow, fIdx) => (
                                                    <div key={flow.id} className="relative">
                                                        <div className="absolute -left-[1.375rem] top-2 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white" />
                                                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
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
                                                                        src={getMediaUrl(flow.voice_note_url ?? flow.voice_note)}
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

                            {service.resolved_at && (
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-200 flex items-center justify-center z-10">
                                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                        </div>
                                        {service.billed_at && isAdmin && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                                    </div>
                                    <div className="pb-5 flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Service Completed</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{new Date(service.resolved_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}

                            {service.billed_at && isAdmin && (
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center z-10">
                                            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                        </div>
                                    </div>
                                    <div className="pb-1 flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Payment Received <span className="text-[10px] font-semibold text-emerald-600 ml-1">(Admin View)</span></p>
                                        <p className="text-xs text-gray-500 mt-0.5">{new Date(service.billed_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

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

            <MinimalConfirmDialog
                isOpen={showUnsavedConfirm}
                title="Unsaved Changes"
                message="You have unsaved updates. Discard and go back?"
                confirmLabel="Discard"
                cancelLabel="Stay"
                onConfirm={() => {
                    setShowUnsavedConfirm(false);
                    navigateBackFromDetails();
                }}
                onCancel={() => setShowUnsavedConfirm(false)}
            />
        </div>
    );
}
