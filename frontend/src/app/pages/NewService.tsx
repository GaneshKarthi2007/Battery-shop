import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { User, Phone, ArrowLeft, Hash, Save, AlertTriangle, Zap, MapPin, ChevronDown, Check, Mic, Trash2, Activity } from "lucide-react";
import { apiClient } from "../api/client";
import { Input } from "../components/Input";
import { AudioRecorder } from "../components/AudioRecorder/AudioRecorder";
import { useDeveloper, formatServiceLogId } from "../contexts/DeveloperContext";

export function NewService() {
    const navigate = useNavigate();
    const { features, shopConfig } = useDeveloper();
    const logIdPrefix = shopConfig?.serviceLogIdPrefix ?? "";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [manualServiceId, setManualServiceId] = useState("");
        const [suggestedServiceId, setSuggestedServiceId] = useState<number | null>(null);
        const [formData, setFormData] = useState({
        customer_name: "",
        contact_number: "",
        address: "",
        vehicle_details: "N/A",
        complaint_type: "",
        complaint_details: "",
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    const [voiceNote, setVoiceNote] = useState<File | null>(null);
    const [isCustomMode, setIsCustomMode] = useState(false);

    const complaintTypes = [
        "RO",
        "Battery",
        "Invertor",
        "Shifting",
        "New Connection",
        "Others"
    ];

    const [showSuccess, setShowSuccess] = useState<{ id: number; logId: string; name: string } | null>(null);
    const createdLogIdRef = useRef<string | null>(null);
    const submittingRef = useRef(false);
    const createdServiceIdRef = useRef<number | null>(null);

    useEffect(() => {
        Promise.resolve(apiClient.get<{ next_log_id: number }>('/services/next-log-id'))
            .then(res => { if (res && res.next_log_id) setSuggestedServiceId(res.next_log_id); })
            .catch(() => {});
            }, []);

    useEffect(() => {
        return () => {
            submittingRef.current = false;
            createdServiceIdRef.current = null;
        };
    }, []);

    const handlePhoneChange = async (phone: string) => {
        setFormData(prev => ({ ...prev, contact_number: phone }));
        if (phone.length >= 10) {
            try {
                const services = await apiClient.get<any[]>(`/services?search=${phone}`);
                if (Array.isArray(services) && services.length > 0) {
                    const lastService = services[0];
                    setFormData(prev => ({
                        ...prev,
                        customer_name: prev.customer_name || lastService.customer_name || "",
                    }));
                }
            } catch (err) {
                console.error("Auto-fetch failed", err);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (submittingRef.current) return;
        
        try {
            submittingRef.current = true;
            setLoading(true);
            setError("");

            // Validation: Only Contact Number is mandatory
            if (!formData.contact_number || !formData.contact_number.trim()) {
                throw new Error("Please enter Contact Number");
            }

            // Do not auto generate log id until developer gives permission
            if (!features.autoGenerateServiceLogId && !manualServiceId.trim()) {
                throw new Error("Please enter Service Log ID (Auto-generation permission is not enabled by developer)");
            }

            if (isCustomMode && !formData.complaint_type.trim()) {
                throw new Error("Please specify the custom complaint type");
            }

            let serviceId = createdServiceIdRef.current;
            const customerName = formData.customer_name.trim() || "Customer";

            // Step 1: Create Service
            if (!serviceId) {
                const payload: any = {
                    ...formData,
                    customer_name: customerName,
                    status: "Pending",
                    allow_auto_id: Boolean(features.autoGenerateServiceLogId),
                };
                if (manualServiceId.trim()) {
                    payload.service_code = manualServiceId.trim();
                    payload.log_id = manualServiceId.trim();
                }
                const response = await apiClient.post<any>("/services", payload);
                serviceId = response.id;
                createdServiceIdRef.current = serviceId;
                createdLogIdRef.current = String(response.log_id ?? response.service_code ?? response.id);
            }

            // Step 2: Upload Voice Note (if exists)
            if (voiceNote && serviceId) {
                const fd = new FormData();
                fd.append('voice_note', voiceNote);
                await apiClient.post(`/services/${serviceId}/voice-note`, fd);
            }

            const finalId = serviceId;
            const finalLogId = createdLogIdRef.current ?? String(finalId);
            createdServiceIdRef.current = null;
            createdLogIdRef.current = null;
            setShowSuccess({ id: finalId!, logId: finalLogId, name: customerName });
            
        } catch (err: any) {
            setError(err.message || "Failed to create service request");
        } finally {
            setLoading(false);
            submittingRef.current = false;
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-2 px-1 sm:px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white hover:bg-gray-50 rounded-xl text-gray-500 hover:text-blue-600 transition-all border border-gray-100 shadow-xs active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            New Service
                            <span className="text-gray-400 text-xs font-medium hidden sm:inline">— Register service entry</span>
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-100">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Draft Mode</span>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Single compact card: everything needed to register a service, no scrolling */}
                <div
                    data-testid="new-service-card"
                    className="bg-white rounded-2xl border border-gray-100 shadow-xs p-3 sm:p-4 space-y-2.5 sm:space-y-3"
                >
                    {/* Row 1: Service Log ID | Complaint Type */}
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                        <div>
                            <label htmlFor="service-log-id" className="text-[10px] sm:text-[11px] font-bold text-gray-600 uppercase tracking-wider ml-0.5 block mb-1">
                                Log ID {!features.autoGenerateServiceLogId && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative group flex items-stretch gap-1.5">
                                {logIdPrefix && (
                                    <span
                                        data-testid="service-log-id-prefix"
                                        className="flex items-center px-2 h-9 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-mono font-bold select-none shrink-0"
                                    >
                                        {logIdPrefix}
                                    </span>
                                )}
                                <div className="relative flex-1 min-w-0">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        id="service-log-id"
                                        aria-label="Service Log ID"
                                        type="text"
                                        inputMode="numeric"
                                        value={manualServiceId}
                                        onChange={(e) => {
                                            setManualServiceId(e.target.value.replace(/[^0-9]/g, ''));
                                            if (error) setError("");
                                        }}
                                        placeholder={features.autoGenerateServiceLogId ? (suggestedServiceId ? `Auto: ${formatServiceLogId(logIdPrefix, suggestedServiceId)}` : "Enter Service Log ID (Optional)") : "Enter Service Log ID (e.g. 1)"}
                                        className="h-9 sm:h-10 pl-9 text-xs sm:text-sm bg-gray-50/50 hover:bg-white focus:bg-white border-gray-100 rounded-xl group-focus-within:border-blue-200 group-focus-within:ring-2 group-focus-within:ring-blue-50 font-mono font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-[10px] sm:text-[11px] font-bold text-gray-600 uppercase tracking-wider ml-0.5 block mb-1">Complaint Type</label>
                            <button
                                type="button"
                                aria-label="Complaint Type"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full h-9 sm:h-10 px-3 rounded-xl flex items-center justify-between transition-all border text-left ${isDropdownOpen
                                    ? 'border-blue-200 ring-2 ring-blue-50 bg-white'
                                    : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:border-blue-100'
                                    }`}
                            >
                                <span className={`text-xs sm:text-sm font-semibold truncate ${(isCustomMode || formData.complaint_type) ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {isCustomMode ? "Others" : (formData.complaint_type || "Select Type")}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={() => setIsDropdownOpen(false)}></div>
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl z-30 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-1.5 max-h-[200px] overflow-y-auto overscroll-contain touch-pan-y space-y-0.5">
                                            {complaintTypes.map((type) => {
                                                const isActive = (type === "Others" && isCustomMode) || (type !== "Others" && !isCustomMode && formData.complaint_type === type);
                                                return (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => {
                                                            if (type === "Others") {
                                                                setIsCustomMode(true);
                                                                setFormData({ ...formData, complaint_type: "" });
                                                            } else {
                                                                setIsCustomMode(false);
                                                                setFormData({ ...formData, complaint_type: type });
                                                            }
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-xs font-bold transition-all ${isActive
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {type}
                                                        {isActive && <Check className="w-3.5 h-3.5" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Custom Complaint Type (only when "Others") */}
                    {isCustomMode && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="text-[10px] sm:text-[11px] font-bold text-gray-600 uppercase tracking-wider ml-0.5 block mb-1">Specify Custom Complaint Type</label>
                            <Input
                                className="h-9 sm:h-10 rounded-xl text-xs sm:text-sm"
                                placeholder="Enter manual entry of complaint type..."
                                value={formData.complaint_type}
                                onChange={(e) => {
                                    setFormData({ ...formData, complaint_type: e.target.value });
                                    if (error) setError("");
                                }}
                            />
                        </div>
                    )}

                    {/* Row 2: Full Name | Contact Number */}
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                        <div>
                            <label className="text-[10px] sm:text-[11px] font-bold text-gray-600 uppercase tracking-wider ml-0.5 block mb-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    className="h-9 sm:h-10 pl-9 text-xs sm:text-sm bg-gray-50/50 hover:bg-white focus:bg-white border-gray-100 rounded-xl group-focus-within:border-blue-200 group-focus-within:ring-2 group-focus-within:ring-blue-50"
                                    placeholder="SMR"
                                    value={formData.customer_name}
                                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            {/* Actions sit beside the label (not over the input) so the full number stays visible on narrow mobile columns */}
                            <div className="flex items-center justify-between gap-1 mb-1 min-h-[15px]">
                                <label htmlFor="contact-number" className="text-[10px] sm:text-[11px] font-bold text-gray-600 uppercase tracking-wider ml-0.5 truncate">Contact Number *</label>
                                {formData.contact_number && (
                                    <div data-testid="contact-actions" className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-0.5 shrink-0">
                                        {features.enableContactActions ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(`tel:${formData.contact_number}`, '_self')}
                                                    className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                                    title="Call Customer"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(`https://wa.me/${formData.contact_number.replace(/\D/g, '')}`, '_blank')}
                                                    className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-md transition-colors"
                                                    title="WhatsApp Customer"
                                                >
                                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                                                    </svg>
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => navigator.clipboard.writeText(formData.contact_number)}
                                                className="px-1.5 py-0.5 text-[10px] font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1"
                                                title="Copy to Clipboard"
                                            >
                                                Copy
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="relative group">
                                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${error && !formData.contact_number ? 'text-red-400 group-focus-within:text-red-500' : 'text-gray-300 group-focus-within:text-blue-500'}`} />
                                <Input
                                    id="contact-number"
                                    type="tel"
                                    inputMode="tel"
                                    className={`h-9 sm:h-10 pl-9 pr-2 text-xs sm:text-sm rounded-xl transition-all ${error && !formData.contact_number
                                        ? 'bg-red-50 border-red-300 text-red-900 placeholder-red-300 focus:bg-white group-focus-within:border-red-400 group-focus-within:ring-2 group-focus-within:ring-red-100'
                                        : 'bg-gray-50/50 hover:bg-white focus:bg-white border-gray-100 group-focus-within:border-blue-200 group-focus-within:ring-2 group-focus-within:ring-blue-50'
                                        }`}
                                    placeholder="+91"
                                    value={formData.contact_number}
                                    onChange={(e) => {
                                        handlePhoneChange(e.target.value);
                                        if (error) setError("");
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Service Address (single line) */}
                    <div>
                        <label className="text-[10px] sm:text-[11px] font-bold text-gray-600 uppercase tracking-wider ml-0.5 block mb-1">Service Address</label>
                        <div className="relative group">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                aria-label="Service Address"
                                className="h-9 sm:h-10 pl-9 text-xs sm:text-sm bg-gray-50/50 hover:bg-white focus:bg-white border-gray-100 rounded-xl group-focus-within:border-blue-200 group-focus-within:ring-2 group-focus-within:ring-blue-50 font-medium"
                                placeholder="Enter complete customer address..."
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Row 4: Issue Description with voice note control inside */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="issue-description" className="text-[10px] sm:text-[11px] font-bold text-gray-600 uppercase tracking-wider ml-0.5">Issue Description</label>
                            {voiceNote ? (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                                    <Activity className="w-3 h-3 text-indigo-600 animate-pulse" />
                                    <span className="text-[10px] font-bold text-indigo-900">Voice note added</span>
                                    <button
                                        type="button"
                                        onClick={() => setVoiceNote(null)}
                                        className="p-0.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                        title="Delete voice note"
                                        aria-label="Delete voice note"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowAudioRecorder(true)}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 transition-all"
                                    title="Record Voice Note"
                                >
                                    <Mic className="w-3 h-3" />
                                    <span className="font-bold text-[10px]">Record Voice Note</span>
                                </button>
                            )}
                        </div>
                        <textarea
                            id="issue-description"
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl bg-gray-50/50 hover:bg-white focus:bg-white transition-all border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 min-h-[48px] sm:min-h-[56px] text-xs sm:text-sm font-medium resize-none"
                            placeholder="Briefly explain what's wrong with the battery..."
                            value={formData.complaint_details}
                            onChange={(e) => setFormData({ ...formData, complaint_details: e.target.value })}
                        />
                    </div>

                    <AudioRecorder
                        isOpen={showAudioRecorder}
                        onClose={() => setShowAudioRecorder(false)}
                        onCapture={(file) => setVoiceNote(file)}
                    />

                    {/* Actions inside the same card */}
                    <div className="flex flex-row gap-2 pt-1 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px] hover:bg-gray-50 transition-all active:scale-[0.98]"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center gap-2 uppercase font-bold tracking-wider text-[11px] rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading ? (
                                <Zap className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Initialize Service Entry
                        </button>
                    </div>
                </div>
            </form>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 backdrop-blur-md text-white px-4 py-2.5 rounded-full flex items-center gap-2.5 shadow-lg max-w-[92vw]"
                    >
                        <AlertTriangle className="w-4 h-4 text-white flex-shrink-0" />
                        <p className="font-bold text-xs tracking-wide">{error}</p>
                        <button
                            onClick={() => setError("")}
                            className="ml-1 text-red-100 hover:text-white rounded-full p-1"
                            type="button"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </motion.div>
                )}

                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white rounded-2xl p-5 max-w-xs w-full space-y-4 shadow-xl border border-gray-100 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Check className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Log Created</h3>
                                    <p className="text-xs text-gray-500 font-medium">Service registered successfully</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Log ID</span>
                                    <div className="text-lg font-black text-blue-600">#{formatServiceLogId(logIdPrefix, showSuccess.logId)}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Customer</span>
                                    <div className="text-xs font-bold text-gray-800 truncate" title={showSuccess.name}>{showSuccess.name}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate("/service")}
                                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs transition-all active:scale-[0.98]"
                            >
                                Continue to Dashboard
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
