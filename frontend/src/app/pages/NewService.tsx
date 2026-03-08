import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { User, Phone, ArrowLeft, Save, AlertTriangle, Zap, MapPin, ChevronDown, Check, Mic, Trash2, Activity } from "lucide-react";
import { apiClient } from "../api/client";
import { Input } from "../components/Input";
import { AudioRecorder } from "../components/AudioRecorder/AudioRecorder";

export function NewService() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        customer_name: "",
        contact_number: "",
        address: "",
        vehicle_details: "N/A", // Defaulting as it was removed from UI but might be required by backend
        complaint_type: "",
        complaint_details: "",
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    const [voiceNote, setVoiceNote] = useState<File | null>(null);

    const complaintTypes = [
        "Charging Issue",
        "Dead Battery",
        "Self Start Issue",
        "Warranty Claim",
        "Periodic Maintenance",
        "Other"
    ];

    const [showSuccess, setShowSuccess] = useState<{ id: number; name: string } | null>(null);

    const handlePhoneChange = async (phone: string) => {
        setFormData({ ...formData, contact_number: phone });
        if (phone.length >= 10) {
            try {
                // Search for existing customer in services
                const services = await apiClient.get<any[]>(`/services?search=${phone}`);
                if (services.length > 0) {
                    const lastService = services[0];
                    setFormData(prev => ({
                        ...prev,
                        customer_name: prev.customer_name || lastService.customer_name,
                    }));
                }
            } catch (err) {
                console.error("Auto-fetch failed", err);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError("");

            // Validation
            if (!formData.customer_name || !formData.contact_number) {
                throw new Error("Please fill in required fields (Customer Name and Contact Number)");
            }

            const response = await apiClient.post<any>("/services", {
                ...formData,
                status: "Pending"
            });

            if (voiceNote) {
                const fd = new FormData();
                fd.append('voice_note', voiceNote);
                await apiClient.post(`/services/${response.id}/voice-note`, fd);
            }

            setShowSuccess({ id: response.id, name: response.customer_name });
            // Don't navigate immediately, show success first
        } catch (err: any) {
            setError(err.message || "Failed to create service request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white hover:bg-gray-50 rounded-2xl text-gray-500 hover:text-blue-600 transition-all border border-gray-100 shadow-sm hover:shadow-md active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">New Service</h1>
                        <p className="text-gray-500 text-sm font-medium">Register a new service request </p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Draft Mode</span>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-2xl p-4 flex items-center gap-3 animate-shake">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Customer Section */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 divide-y divide-gray-50">
                    <div className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100/50">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">Customer Information</h2>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">Profile & Contact Details</p>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Full Name *</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    className="h-14 pl-12 bg-gray-50/50 hover:bg-white focus:bg-white transition-all border-gray-100 group-focus-within:border-blue-200 group-focus-within:ring-4 group-focus-within:ring-blue-50 rounded-2xl"
                                    placeholder="e.g. Rahul Sharma"
                                    value={formData.customer_name}
                                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Contact Number *</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    className="h-14 pl-12 bg-gray-50/50 hover:bg-white focus:bg-white transition-all border-gray-100 group-focus-within:border-blue-200 group-focus-within:ring-4 group-focus-within:ring-blue-50 rounded-2xl"
                                    placeholder="+91 00000 00000"
                                    value={formData.contact_number}
                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Service Address</label>
                            <div className="relative group">
                                <MapPin className="absolute left-4 top-4 w-4 h-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                <textarea
                                    className="w-full pl-12 pr-4 py-4 min-h-[100px] bg-gray-50/50 hover:bg-white focus:bg-white transition-all border border-gray-100 rounded-2xl focus:outline-none group-focus-within:border-blue-200 group-focus-within:ring-4 group-focus-within:ring-blue-50 text-sm font-medium"
                                    placeholder="Enter complete customer address..."
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Complaint Section */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 divide-y divide-gray-50">
                    <div className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100/50">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">Service Details</h2>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">Issue & Fix Requirements</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Modern Dropdown */}
                        <div className="space-y-2 relative">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Complaint Type</label>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full h-14 px-5 rounded-2xl flex items-center justify-between transition-all border text-left ${isDropdownOpen
                                    ? 'border-blue-200 ring-4 ring-blue-50 bg-white'
                                    : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:border-blue-100'
                                    }`}
                            >
                                <span className={`font-semibold ${formData.complaint_type ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {formData.complaint_type || "Select Complaint Type"}
                                </span>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-2 max-h-[300px] overflow-y-auto">
                                            {complaintTypes.map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, complaint_type: type });
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full px-4 py-3.5 rounded-xl flex items-center justify-between text-sm font-bold transition-all ${formData.complaint_type === type
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {type}
                                                    {formData.complaint_type === type && <Check className="w-4 h-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Issue Description</label>
                            <textarea
                                className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 hover:bg-white focus:bg-white transition-all border border-gray-100 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 min-h-[140px] text-sm font-medium"
                                placeholder="Briefly explain what's wrong with the battery..."
                                value={formData.complaint_details}
                                onChange={(e) => setFormData({ ...formData, complaint_details: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3 pt-6 border-t border-gray-100">
                            <div>
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Voice Note Explainer (Optional)</label>
                                <p className="text-xs text-gray-500 font-medium ml-1 mt-1 mb-3">Record a quick audio message describing the battery issue</p>
                            </div>

                            {voiceNote ? (
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50/50 border border-indigo-100 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600">
                                            <Activity className="w-6 h-6 animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Audio Recorded</p>
                                            <p className="text-xs text-indigo-600 font-medium tracking-tight">Ready to enclose with log</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setVoiceNote(null)}
                                        className="w-10 h-10 flex items-center justify-center text-red-500 bg-white hover:bg-red-50 hover:text-red-600 rounded-full shadow-sm transition-colors active:scale-95"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowAudioRecorder(true)}
                                    className="w-full group relative overflow-hidden rounded-2xl p-[1px] transition-all"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-40 group-hover:opacity-100 transition-opacity blur-sm"></div>
                                    <div className="relative w-full py-5 bg-white rounded-2xl flex items-center justify-center gap-3 text-gray-600 group-hover:text-indigo-600 transition-colors shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-100 transition-transform">
                                            <Mic className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <span className="font-bold text-sm">Tap to Record Voice Note</span>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <AudioRecorder
                    isOpen={showAudioRecorder}
                    onClose={() => setShowAudioRecorder(false)}
                    onCapture={(file) => setVoiceNote(file)}
                />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex-1 py-5 rounded-2xl border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest text-xs hover:bg-gray-50 hover:text-gray-600 hover:border-gray-200 transition-all active:scale-[0.98]"
                    >
                        Discard Changes
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] py-5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 uppercase font-black tracking-widest text-xs transition-all hover:-translate-y-1 active:scale-[0.98] disabled:opacity-70 rounded-2xl"
                    >
                        {loading ? (
                            <Zap className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Initialize Service Entry
                    </button>
                </div>
            </form>

            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <Check className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Log Created</h3>
                                    <p className="text-sm text-gray-500 font-medium">Service registered successfully</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Log ID</span>
                                    <div className="text-xl font-black text-blue-600">#{showSuccess.id}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Customer</span>
                                    <div className="text-sm font-bold text-gray-800 truncate" title={showSuccess.name}>{showSuccess.name}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate("/service")}
                                className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg active:scale-[0.98]"
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

