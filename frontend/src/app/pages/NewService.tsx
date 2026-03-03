import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Wrench, User, Phone, ArrowLeft, Save, AlertTriangle, Zap, MapPin, ChevronDown, Check } from "lucide-react";
import { apiClient } from "../api/client";
import { Input } from "../components/Input";

export function NewService() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        customer_name: "",
        contact_number: "",
        address: "",
        vehicle_details: "N/A", // Defaulting as it was removed from UI but might be required by backend
        battery_brand: "",
        battery_model: "",
        battery_capacity: "",
        complaint_type: "",
        complaint_details: "",
        service_charge: "",
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
                        customer_name: lastService.customer_name,
                        address: lastService.address || prev.address,
                        battery_brand: lastService.battery_brand || prev.battery_brand,
                        battery_model: lastService.battery_model || prev.battery_model,
                        battery_capacity: lastService.battery_capacity || prev.battery_capacity,
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
                service_charge: Number(formData.service_charge) || 0,
                status: "Pending"
            });

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

                {/* Battery Section */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 divide-y divide-gray-50">
                    <div className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100/50">
                            <Wrench className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">Battery Specifications</h2>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">Model & Technical Data</p>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Brand</label>
                            <Input
                                className="h-12 bg-gray-50/50 hover:bg-white focus:bg-white transition-all border-gray-100 rounded-xl px-4"
                                placeholder="e.g. Exide, Amaron"
                                value={formData.battery_brand}
                                onChange={(e) => setFormData({ ...formData, battery_brand: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Model Name/No.</label>
                            <Input
                                className="h-12 bg-gray-50/50 hover:bg-white focus:bg-white transition-all border-gray-100 rounded-xl px-4"
                                placeholder="e.g. Matrix X7"
                                value={formData.battery_model}
                                onChange={(e) => setFormData({ ...formData, battery_model: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Capacity (Ah)</label>
                            <Input
                                className="h-12 bg-gray-50/50 hover:bg-white focus:bg-white transition-all border-gray-100 rounded-xl px-4"
                                placeholder="e.g. 35Ah, 80Ah"
                                value={formData.battery_capacity}
                                onChange={(e) => setFormData({ ...formData, battery_capacity: e.target.value })}
                            />
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
                    </div>
                </div>

                {/* Financial Section */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 divide-y divide-gray-50">
                    <div className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100/50">
                            <Zap className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">Financials</h2>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">Charges & Billing</p>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="space-y-3 max-w-sm">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Initial Service Charge (₹)</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400 group-focus-within:text-blue-600 transition-colors">₹</span>
                                <Input
                                    type="number"
                                    className="h-16 pl-12 bg-gray-50/50 hover:bg-white focus:bg-white transition-all border-gray-100 rounded-2xl text-2xl font-black text-blue-600 focus:ring-4 focus:ring-blue-50"
                                    placeholder="0.00"
                                    value={formData.service_charge}
                                    onChange={(e) => setFormData({ ...formData, service_charge: e.target.value })}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1">Leave 0 if to be calculated later</p>
                        </div>
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
                    </div>
                </div>
            </form>

            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl text-center space-y-6 overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

                            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner relative">
                                <Check className="w-12 h-12" />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 bg-blue-100/50 rounded-[2rem] -z-10"
                                />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Log Created!</h3>
                                <p className="text-gray-500 font-medium">Service request successfully registered</p>
                            </div>

                            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col items-center gap-4">
                                <div className="text-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Unique Log ID</span>
                                    <div className="text-4xl font-black text-blue-600 mt-1">#{showSuccess.id}</div>
                                </div>
                                <div className="w-full h-px bg-gray-200/50"></div>
                                <div className="text-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer</span>
                                    <div className="text-lg font-bold text-gray-800">{showSuccess.name}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate("/service")}
                                className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:shadow-xl active:scale-[0.98]"
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

