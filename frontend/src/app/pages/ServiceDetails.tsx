import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Wrench, Clock, CheckCircle, ArrowLeft, User, Calendar, AlertTriangle, Zap, MapPin, Mic, Play, CreditCard, ShoppingCart, ShoppingBag, RefreshCw, Activity } from "lucide-react";
import { Button } from "../components/Button";
import { ContactActions } from "../components/ui/ContactActions";
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
    created_at: string;
}

interface Staff {
    id: number;
    name: string;
}

interface Product {
    id: number;
    brand: string;
    model: string;
    ah: string;
    type: string;
    price: number;
    stock: number;
}

interface Receipt {
    id: number;
    receipt_number: string;
    quantity: number;
    price: string;
    total: string;
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

    // Receipt flow states
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<number | "">("");
    const [receiptQuantity, setReceiptQuantity] = useState(1);
    const [generatedReceipt, setGeneratedReceipt] = useState<Receipt | null>(null);

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

    const handleConvertToOrder = async () => {
        if (!service) return;
        setUpdating(true);
        try {
            const updated = await apiClient.post<ServiceRequest>(`/services/${id}/mark-converted`);
            setService(updated);
            addNotification({
                type: "SERVICE",
                title: "Converted to Order",
                message: `Service #${id} marked as Converted to Order. Awaiting Admin to process replacement.`,
                role: "staff"
            });
        } catch (err: any) {
            alert(err.message || "Failed to convert to order");
        } finally {
            setUpdating(false);
        }
    };

    const handleProcessConvertedOrder = async () => {
        if (!id || !selectedProductId) return;
        setUpdating(true);
        try {
            const payload = {
                product_id: selectedProductId,
                quantity: receiptQuantity
            };
            const updatedService = await apiClient.post<ServiceRequest>(`/services/${id}/process-converted-order`, payload);

            addNotification({
                type: "SALES",
                title: "Order Processed",
                message: `Converted Order ${id} processed successfully.`,
                role: "admin"
            });

            // Redirect Admin straight to Invoice
            const invoiceItems = [];

            // 1. Add Service Charge
            if (Number(updatedService.service_charge) > 0 || !updatedService.receipt) {
                invoiceItems.push({
                    id: updatedService.id,
                    name: updatedService.battery_brand || "Service",
                    model: updatedService.battery_model || "Maintenance",
                    price: Number(updatedService.service_charge),
                    quantity: 1,
                    warranty: "N/A",
                    type: "Service"
                });
            }

            // 2. Add Receipt Cost
            if (updatedService.receipt && updatedService.receipt.product) {
                invoiceItems.push({
                    id: updatedService.receipt.product_id,
                    name: updatedService.receipt.product.brand + " (Replacement)",
                    model: updatedService.receipt.product.model,
                    price: Number(updatedService.receipt.price),
                    quantity: updatedService.receipt.quantity,
                    warranty: "N/A",
                    type: "Battery"
                });
            }

            const finalTotalVal = Number(updatedService.service_charge) + (updatedService.receipt ? Number(updatedService.receipt.total) : 0);

            navigate("/invoice", {
                state: {
                    items: invoiceItems,
                    customerInfo: {
                        name: updatedService.customer_name,
                        phone: updatedService.contact_number,
                        billingAddress: updatedService.address || "N/A"
                    },
                    vehicleNumber: updatedService.vehicle_details || "N/A",
                    paymentMethod: "Cash",
                    productSubtotal: updatedService.receipt ? Number(updatedService.receipt.total) : 0,
                    serviceSubtotal: Number(updatedService.service_charge),
                    productGst: 0,
                    exchangeDiscount: 0,
                    finalTotal: finalTotalVal,
                    warrantyDetails: {
                        totalWarranty: "N/A",
                        totalWarrantyExpiry: "N/A"
                    }
                }
            });

            setShowReceiptModal(false);
        } catch (err: any) {
            alert(err.message || "Failed to process order. Ensure sufficient stock.");
        } finally {
            setUpdating(false);
        }
    };

    const handleOpenProcessModal = async () => {
        setUpdating(true);
        try {
            const data = await apiClient.get<Product[]>('/products');
            setProducts(data);
            setShowReceiptModal(true);
        } catch (err: any) {
            alert(err.message || "Failed to load products");
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

    if (loading) {
        // Page loader removed for smoother page transitions
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
                                                <div className="pb-4">
                                                    <p className="text-sm font-bold text-gray-900">In Progress</p>
                                                    {service.sub_status && <p className="text-xs font-semibold text-amber-600">Sub-Status: {service.sub_status}</p>}
                                                    <p className="text-xs text-gray-500">{new Date(service.status_updated_at).toLocaleString()}</p>
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
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Site Photos</h3>
                                    <ServiceGpsCamera serviceId={service.id} />
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
                                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                        <Mic className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-indigo-900">Voice Note</p>
                                                        <p className="text-[10px] text-indigo-600 font-medium uppercase tracking-wider">Recorded Audio</p>
                                                    </div>
                                                </div>
                                                <audio
                                                    controls
                                                    className="hidden"
                                                    id="voice-player-issue"
                                                    src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/storage/${service.voice_note}`}
                                                />
                                                <Button
                                                    size="sm"
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                                                    onClick={() => (document.getElementById('voice-player-issue') as HTMLAudioElement)?.play()}
                                                >
                                                    <Play className="w-4 h-4 mr-2" /> Play
                                                </Button>
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
                    {!isAdmin && (
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

                                {service.assigned_to === user?.id && !isAdmin && (
                                    <>
                                        {/* Sub-status module was moved to the Status Update section */}

                                        {service.status !== "Completed" && service.status !== "Converted to Order" && service.sub_status === "Battery Dead/Needs Replace" && (
                                            <Button
                                                onClick={handleConvertToOrder}
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 font-bold"
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                Convert to New Order
                                            </Button>
                                        )}

                                        {service.status === "Converted to Order" && (
                                            <div className="w-full p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center space-y-2">
                                                <ShoppingCart className="w-6 h-6 text-indigo-400 mx-auto" />
                                                <p className="font-bold text-indigo-900">Converted to Order</p>
                                                <p className="text-xs text-indigo-600">Waiting for Admin to process...</p>
                                            </div>
                                        )}

                                        {service.payment_status === "pending" && isAdmin && service.status === "Completed" && !service.receipt && (
                                            <Button
                                                onClick={handleVerifyPayment}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 font-bold opacity-50 cursor-not-allowed"
                                                disabled
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                Verify Payment & Close
                                            </Button>
                                        )}

                                        {service.status === "Completed" && (
                                            <div className="space-y-3 mt-4">
                                                <Button
                                                    onClick={() => setShowRevisitForm(!showRevisitForm)}
                                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl shadow-lg shadow-amber-100 flex items-center justify-center gap-2 font-bold"
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
                                                                placeholder="e.g. Battery not holding charge"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-bold text-amber-700 uppercase">Complaint Type</label>
                                                            <select
                                                                className="w-full px-3 py-2 rounded-xl border border-amber-300 text-sm focus:ring-2 focus:ring-amber-500"
                                                                value={revisitData.complaint_type}
                                                                onChange={(e) => setRevisitData({ ...revisitData, complaint_type: e.target.value })}
                                                            >
                                                                <option value="">Select Type...</option>
                                                                <option value="Battery Drain">Battery Drain</option>
                                                                <option value="Starting Trouble">Starting Trouble</option>
                                                                <option value="Physical Damage">Physical Damage</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-bold text-amber-700 uppercase">Detailed Description</label>
                                                            <textarea
                                                                className="w-full px-3 py-2 rounded-xl border border-amber-300 text-sm focus:ring-2 focus:ring-amber-500 min-h-[80px]"
                                                                value={revisitData.complaint_details}
                                                                onChange={(e) => setRevisitData({ ...revisitData, complaint_details: e.target.value })}
                                                                placeholder="Provide more context..."
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 pt-2">
                                                            <Button
                                                                variant="outline"
                                                                className="flex-1 bg-white border-amber-300 text-amber-700 hover:bg-amber-50"
                                                                onClick={() => {
                                                                    setShowRevisitForm(false);
                                                                    setRevisitData({ issue: "", complaint_type: "", complaint_details: "" });
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200"
                                                                onClick={handleCreateRevisit}
                                                                disabled={updating || !revisitData.issue}
                                                            >
                                                                Confirm Revisit
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

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

                    {isAdmin && service.status === "Converted to Order" && (
                        <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 p-6">
                            <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                                Process Converted Order
                            </h3>
                            <p className="text-xs text-indigo-600 mb-4">Staff requested a replacement battery for this service.</p>
                            <Button
                                onClick={handleOpenProcessModal}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 font-bold"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                Select Product & Generate Bill
                            </Button>
                        </div>
                    )}

                    {!isAdmin && service.assigned_to === user?.id && (
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

                                            {/* Show Sub-Status and Audio Recorder if In Progress is active */}
                                            {status === "In Progress" && isActive && (
                                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-4 mt-2 animate-in slide-in-from-top-2">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-1">Current Task Sub-Status</label>
                                                        <select
                                                            className="w-full px-4 py-3 border-2 border-white hover:border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold text-gray-700 bg-white"
                                                            value={service.sub_status || ""}
                                                            onChange={(e) => handleUpdateSubStatus(e.target.value)}
                                                        >
                                                            <option value="" disabled>-- Select Sub Status --</option>
                                                            {(SUB_STATUS_OPTIONS[service.complaint_type || "Other"] || SUB_STATUS_OPTIONS["Other"]).map(option => (
                                                                <option key={option} value={option}>{option}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-2 pt-2 border-t border-blue-100">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-1">Daily Status Update (Audio)</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowAudioRecorder(true)}
                                                            className="w-full group relative overflow-hidden rounded-2xl p-[1px] transition-all"
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-40 group-hover:opacity-100 transition-opacity blur-sm"></div>
                                                            <div className="relative w-full py-4 bg-white rounded-2xl flex items-center justify-center gap-3 text-gray-600 group-hover:text-indigo-600 transition-colors shadow-sm">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-100 transition-transform">
                                                                    <Mic className="w-4 h-4 text-indigo-600" />
                                                                </div>
                                                                <span className="font-bold text-sm">Tap to Record Update</span>
                                                            </div>
                                                        </button>
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

            {/* Receipt Modal */}
            {showReceiptModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-indigo-100">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                                Generate Product Receipt
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">Select a battery to link to this service</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {generatedReceipt ? (
                                <div className="text-center py-4 space-y-4">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Receipt Generated!</h3>
                                    <p className="text-sm text-gray-500">
                                        Receipt <strong>{generatedReceipt.receipt_number}</strong> created successfully.
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Admin can now generate the final invoice.
                                    </p>
                                    <Button
                                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                                        onClick={() => {
                                            setShowReceiptModal(false);
                                            setGeneratedReceipt(null);
                                        }}
                                    >
                                        Close
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Select Battery</label>
                                        <select
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                            value={selectedProductId}
                                            onChange={(e) => setSelectedProductId(Number(e.target.value))}
                                        >
                                            <option value="">-- Choose a Product --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id} disabled={p.stock < 1}>
                                                    {p.brand} {p.model} ({p.ah}) - ₹{p.price} {p.stock < 1 && "(Out of Stock)"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedProductId && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-center font-bold"
                                                value={receiptQuantity}
                                                onChange={(e) => setReceiptQuantity(Number(e.target.value))}
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => setShowReceiptModal(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                            disabled={!selectedProductId || updating}
                                            onClick={handleProcessConvertedOrder}
                                        >
                                            {updating ? "Processing..." : "Process Order & Bill"}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
