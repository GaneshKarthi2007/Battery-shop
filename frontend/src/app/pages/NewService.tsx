import { useState } from "react";
import { useNavigate } from "react-router";
import { Wrench, User, Phone, Car, ArrowLeft, Save, AlertTriangle, Zap } from "lucide-react";
import { apiClient } from "../api/client";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

export function NewService() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        customer_name: "",
        contact_number: "",
        vehicle_details: "",
        battery_brand: "",
        battery_model: "",
        service_charge: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError("");

            // Validation
            if (!formData.customer_name || !formData.contact_number || !formData.service_charge) {
                throw new Error("Please fill in all required fields (Name, Contact, and Charge)");
            }

            await apiClient.post("/services", {
                ...formData,
                service_charge: Number(formData.service_charge),
                status: "Pending"
            });

            navigate("/service");
        } catch (err: any) {
            setError(err.message || "Failed to create service request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-600 transition-all border border-transparent hover:border-gray-200"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Service Request</h1>
                    <p className="text-gray-500 text-sm">Create a new battery service or maintenance entry</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 animate-shake">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                    <div className="p-1 px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Customer Details</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Customer Name *</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                <Input
                                    className="pl-11 bg-gray-50/50 hover:bg-white focus:bg-white transition-all border-gray-100 group-focus-within:border-blue-200"
                                    placeholder="e.g. Rahul Sharma"
                                    value={formData.customer_name}
                                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Contact Number *</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                <Input
                                    className="pl-11 bg-gray-50/50 hover:bg-white focus:bg-white transition-all border-gray-100 group-focus-within:border-blue-200"
                                    placeholder="e.g. +91 98765 43210"
                                    value={formData.contact_number}
                                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                    <div className="p-1 px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                            <Car className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Vehicle & Battery Info</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Vehicle Details</label>
                            <Input
                                className="bg-gray-50/50 hover:bg-white focus:bg-white transition-all border-gray-100"
                                placeholder="e.g. Maruti Suzuki Swift (DL 1C A 1234)"
                                value={formData.vehicle_details}
                                onChange={(e) => setFormData({ ...formData, vehicle_details: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Battery Brand</label>
                                <Input
                                    className="bg-gray-50/50 hover:bg-white focus:bg-white transition-all border-gray-100"
                                    placeholder="e.g. Exide"
                                    value={formData.battery_brand}
                                    onChange={(e) => setFormData({ ...formData, battery_brand: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Battery Model</label>
                                <Input
                                    className="bg-gray-50/50 hover:bg-white focus:bg-white transition-all border-gray-100"
                                    placeholder="e.g. Mile-X"
                                    value={formData.battery_model}
                                    onChange={(e) => setFormData({ ...formData, battery_model: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                    <div className="p-1 px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Wrench className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Financials</h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-2 max-w-sm">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Service Charge (₹) *</label>
                            <Input
                                type="number"
                                className="bg-gray-50/50 hover:bg-white focus:bg-white transition-all border-gray-100 text-xl font-bold text-blue-600"
                                placeholder="0.00"
                                value={formData.service_charge}
                                onChange={(e) => setFormData({ ...formData, service_charge: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="flex-1 py-4 uppercase font-black tracking-widest text-xs"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex-2 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-200 flex items-center justify-center gap-2 uppercase font-black tracking-widest text-xs transition-all hover:-translate-y-0.5"
                    >
                        {loading ? (
                            <Zap className="w-5 h-5 animate-pulse text-yellow-400 fill-current" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Save Service Entry
                    </Button>
                </div>
            </form>
        </div>
    );
}
