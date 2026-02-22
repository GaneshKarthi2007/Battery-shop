import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, ShieldCheck, Wrench, Package, Info, User, Zap, AlertTriangle } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { apiClient } from "../api/client";
import { useNotifications } from "../contexts/NotificationContext";

interface SalesItem {
    id: number | string;
    name: string;
    model: string;
    price: number;
    quantity: number;
    warranty: string;
    type: "Product" | "Service";
    originalData?: any;
}

export function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const state = location.state as {
        items: SalesItem[];
        subtotal: number;
        gst: number;
        total: number;
    } | undefined;

    const [installCharges, setInstallCharges] = useState<number>(0);
    const [otherCharges, setOtherCharges] = useState<number>(0);
    const [exchangeRate, setExchangeRate] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [warrantyDetails, setWarrantyDetails] = useState({
        freeReplacement: "18 Months",
        proRata: "18 Months",
        totalWarranty: "36 Months"
    });

    const [customerInfo, setCustomerInfo] = useState({
        name: "",
        phone: "",
        city: "Chennai"
    });
    const [vehicleInfo, setVehicleInfo] = useState({
        type: "Car",
        number: ""
    });

    const serviceItem = state?.items?.find(item => item.type === "Service");
    const hasService = !!serviceItem;

    useEffect(() => {
        if (serviceItem && serviceItem.originalData) {
            const serviceData = serviceItem.originalData;
            setCustomerInfo({
                name: serviceData.customer_name || "",
                phone: serviceData.contact_number || "", // Adjusted for backend field name
                city: serviceData.city || "Chennai"
            });
        }
    }, [hasService]);

    if (!state) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <p className="text-gray-500 mb-4">No items selected for checkout.</p>
                <Button onClick={() => navigate("/sales")}>Go to Sales</Button>
            </div>
        );
    }

    const baseSubtotal = state.subtotal;
    const baseGst = state.gst;
    const extraCharges = installCharges + otherCharges;
    const extraGst = extraCharges * 0.18;
    const finalSubtotal = baseSubtotal + extraCharges;
    const finalGst = baseGst + extraGst;
    const grandTotal = finalSubtotal + finalGst - exchangeRate;

    const handleGenerateInvoice = async () => {
        setLoading(true);
        setError("");

        try {
            // Prepare data for backend
            const saleData = {
                customer_name: customerInfo.name || "Walk-in Customer",
                customer_phone: customerInfo.phone,
                vehicle_details: `${vehicleInfo.type}: ${vehicleInfo.number}`,
                items: state.items.map(item => ({
                    product_id: item.type === "Product" ? item.id : null,
                    service_id: item.type === "Service" ? item.id.toString().replace('service-', '') : null,
                    quantity: item.quantity,
                    price: item.price
                })),
                total_amount: grandTotal,
                extra_charges: extraCharges,
                discount_amount: exchangeRate
            };

            await apiClient.post('/sales', saleData);

            // Add notifications
            addNotification({
                type: "SALES",
                title: `New Sale: ₹${grandTotal.toLocaleString()}`,
                message: `${state.items.length} items sold to ${customerInfo.name || 'Walk-in Customer'}.`,
                role: "admin"
            });

            // Navigate to invoice
            navigate("/invoice", {
                state: {
                    ...state,
                    installCharges,
                    otherCharges,
                    exchangeRate,
                    warrantyDetails,
                    customerInfo,
                    vehicleInfo,
                    finalTotal: grandTotal,
                    finalGst: finalGst
                }
            });
        } catch (err: any) {
            setError(err.message || "Failed to process sale. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            {loading && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                    <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-blue-900 font-bold uppercase tracking-widest text-xs animate-pulse">Processing Transaction...</p>
                </div>
            )}

            <div className="space-y-6 max-w-5xl mx-auto pb-20">
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top duration-300">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-900 font-bold text-sm">Transaction Failed</p>
                            <p className="text-red-600 text-sm mt-0.5 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white rounded-full transition-colors border border-gray-200"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Final Checkout</h1>
                        <p className="text-gray-600 mt-1">Add extra charges and warranty details</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Form Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer & Vehicle Info */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                Customer Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g., Ganesh S"
                                        value={customerInfo.name}
                                        onChange={(e) => !hasService && setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                        readOnly={hasService}
                                        className={hasService ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-100" : ""}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g., +91 9876543210"
                                        value={customerInfo.phone}
                                        onChange={(e) => !hasService && setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                        readOnly={hasService}
                                        className={hasService ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-100" : ""}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g., Chennai"
                                        value={customerInfo.city}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                                    />
                                </div>
                            </div>

                            <h2 className="font-bold text-gray-900 mt-8 mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-blue-600" />
                                Vehicle Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={vehicleInfo.type}
                                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, type: e.target.value })}
                                    >
                                        <option value="Car">Car</option>
                                        <option value="Bike">Bike</option>
                                        <option value="Inverter">Inverter (Home)</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle/Unit Number</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g., TN 09 AB 1234"
                                        value={vehicleInfo.number}
                                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, number: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Order Summary Snapshot */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                Selected Products
                            </h2>
                            <div className="divide-y divide-gray-100">
                                {state.items.map((item) => (
                                    <div key={item.id} className="py-3 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === "Product" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                                                {item.type === "Product" ? <Package className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 leading-none mb-1">{item.name} {item.model}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{item.quantity} unit(s) x ₹{item.price.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Charges */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-blue-600" />
                                Service & Additional Charges
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Installation Charges (₹)</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={installCharges || ""}
                                        onChange={(e) => setInstallCharges(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Other Charges (₹)</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={otherCharges || ""}
                                        onChange={(e) => setOtherCharges(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Old Battery Exchange Rate (₹)</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 font-bold">-</div>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="pl-7 text-red-600"
                                            value={exchangeRate || ""}
                                            onChange={(e) => setExchangeRate(Number(e.target.value))}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">This amount will be deducted from the total</p>
                                </div>
                            </div>
                        </div>

                        {/* Warranty Details */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-blue-600" />
                                Warranty Registration
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Warranty Period</label>
                                    <Input
                                        type="text"
                                        value={warrantyDetails.totalWarranty}
                                        onChange={(e) => setWarrantyDetails({ ...warrantyDetails, totalWarranty: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Free Replacement Period</label>
                                    <Input
                                        type="text"
                                        value={warrantyDetails.freeReplacement}
                                        onChange={(e) => setWarrantyDetails({ ...warrantyDetails, freeReplacement: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pro-rata Period</label>
                                    <Input
                                        type="text"
                                        value={warrantyDetails.proRata}
                                        onChange={(e) => setWarrantyDetails({ ...warrantyDetails, proRata: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Calculations */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-lg sticky top-24 overflow-hidden">
                            <div className="p-5 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
                                <h2 className="font-bold">Billing Summary</h2>
                                <p className="text-xs text-blue-200 opacity-80">Final totals including taxes</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="space-y-2 pb-4 border-b border-gray-100">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Items Subtotal</span>
                                        <span className="font-medium">₹{baseSubtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Extra Charges</span>
                                        <span className="font-medium">₹{extraCharges.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Total GST (18%)</span>
                                        <span className="font-medium text-gray-900">₹{finalGst.toLocaleString()}</span>
                                    </div>
                                    {exchangeRate > 0 && (
                                        <div className="flex justify-between text-sm text-red-600 font-medium">
                                            <span>Exchange Discount</span>
                                            <span>- ₹{exchangeRate.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Grand Total</p>
                                            <p className="text-3xl font-black text-blue-600">₹{grandTotal.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleGenerateInvoice}
                                        className="w-full h-12 text-lg shadow-lg shadow-blue-200"
                                    >
                                        Generate Invoice
                                    </Button>

                                    <p className="text-center text-[10px] text-gray-400 mt-4 flex items-center justify-center gap-1">
                                        <Info className="w-3 h-3" />
                                        Prices are inclusive of all taxes
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
