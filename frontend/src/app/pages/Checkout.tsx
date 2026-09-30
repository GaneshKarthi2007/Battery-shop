import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
    ArrowLeft, User, FileText, Zap, ShieldCheck, Wrench,
    Truck, RefreshCcw, Banknote, QrCode
} from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { apiClient } from "../api/client";
import { useNotifications } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import { BatteryLoader } from "../components/ui/BatteryLoader";
import { ContactActions } from "../components/ui/ContactActions";

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

function parseWarrantyString(wStr: string | undefined): { val: string; unit: "Months" | "Years" } {
    if (!wStr || wStr === "N/A" || wStr === "0") {
        return { val: "36", unit: "Months" };
    }
    const match = wStr.match(/^(\d+)\s*(Months|Month|Years|Year|M|Y)?/i);
    if (match) {
        const val = match[1];
        let unit: "Months" | "Years" = "Months";
        const unitStr = match[2]?.toLowerCase() || "";
        if (unitStr.startsWith("y")) {
            unit = "Years";
        }
        return { val, unit };
    }
    return { val: "36", unit: "Months" };
}

interface ExchangeRecord {
    id: number;
    customer_name: string;
    battery_brand: string;
    battery_model: string;
    valuation_amount: number;
    status: string;
}

function WarrantyInput({
    label,
    value,
    onValueChange,
    disabled = false,
}: {
    label: string;
    value: string;
    onValueChange: (v: string) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-between group py-0.5">
            <label className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider ml-0.5">{label}</label>
            <div className="relative w-24 sm:w-28">
                <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => onValueChange(e.target.value)}
                    disabled={disabled}
                    className="w-full bg-white dark:bg-[#070A13] border border-gray-300 dark:border-[#25314D] rounded-xl px-3 h-9 text-gray-900 dark:text-[#FFFFFF] font-bold text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-[#2E6DFF] outline-none transition-all placeholder:text-gray-400 text-right disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="0"
                />
            </div>
        </div>
    );
}

export function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const { user } = useAuth();

    const state = location.state as {
        items: SalesItem[];
        subtotal: number;
        gst: number;
        total: number;
        fromService?: boolean;
        serviceId?: number;
        customerInfo?: {
            name: string;
            phone: string;
            address: string;
        };
        isQuotation?: boolean;
    } | undefined;

    /** ── Customer ── */
    const [customerInfo, setCustomerInfo] = useState({
        name: "",
        phone: "+91 ",
        billingAddress: "",
    });
    const [billedBy, setBilledBy] = useState("");

    /** ── Product / Type & Usage ── */
    const [usageType, setUsageType] = useState<"Vehicle" | "Home">("Vehicle");
    const [vehicleModel, setVehicleModel] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [installationRequired, setInstallationRequired] = useState(true);
    const [installAddress, setInstallAddress] = useState("");
    const [landmark, setLandmark] = useState("");
    const [sameAsBilling, setSameAsBilling] = useState(false);

    /** ── Charges ── */
    const [installCharges, setInstallCharges] = useState(0);
    const [deliveryCharges, setDeliveryCharges] = useState(0);

    /** ── Exchange ── */
    const [exchangeRecords, setExchangeRecords] = useState<ExchangeRecord[]>([]);
    const [selectedExchange, setSelectedExchange] = useState<ExchangeRecord | null>(null);
    const [loadingExchanges, setLoadingExchanges] = useState(false);

    const productItem = state?.items?.find(item => item.type === "Product");
    const parsedWarranty = parseWarrantyString(productItem?.warranty);

    /** ── Warranty ── */
    const [totalWarrantyVal, setTotalWarrantyVal] = useState(parsedWarranty.val);
    const [freeReplacementVal, setFreeReplacementVal] = useState(() => {
        const tVal = parseInt(parsedWarranty.val) || 0;
        return Math.round(tVal / 2).toString();
    });
    const [warrantyUnit, setWarrantyUnit] = useState<"Months" | "Years">(parsedWarranty.unit);
    const [isWarrantyEditable, setIsWarrantyEditable] = useState(false);

    /** ── Payment ── */
    const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Split">("Cash");
    const [cashPart, setCashPart] = useState<number>(0);

    /** ── UI state ── */
    const [loading, setLoading] = useState(false);
    const [gstEnabled, setGstEnabled] = useState(true);

    const serviceItem = state?.items?.find(item => item.type === "Service");
    const hasService = !!serviceItem;

    /* Auto-fill billedBy from logged-in user */
    useEffect(() => {
        if (user) setBilledBy(user.name);
    }, [user]);

    /* Auto-fill customer from service data or conversion state */
    useEffect(() => {
        if (state?.fromService && state.customerInfo) {
            setCustomerInfo({
                name: state.customerInfo.name || "",
                phone: state.customerInfo.phone || "+91 ",
                billingAddress: state.customerInfo.address || "",
            });
            if (state.customerInfo.address) {
                setSameAsBilling(true);
            }
        } else if (serviceItem?.originalData) {
            const svc = serviceItem.originalData;
            setCustomerInfo(prev => ({
                ...prev,
                name: svc.customer_name || "",
                phone: svc.contact_number || "+91 ",
                billingAddress: svc.address || ""
            }));
        }
    }, [hasService, serviceItem, state?.fromService, state?.customerInfo]);

    /* Same-as-billing checkbox logic */
    useEffect(() => {
        if (sameAsBilling) setInstallAddress(customerInfo.billingAddress);
    }, [sameAsBilling, customerInfo.billingAddress]);

    /* Fetch pending exchange records on mount */
    useEffect(() => {
        const fetchExchanges = async () => {
            try {
                setLoadingExchanges(true);
                const data = await apiClient.get<ExchangeRecord[]>('/exchanges/pending');
                setExchangeRecords(data);
            } catch {
                // Silent fail – exchange is optional
            } finally {
                setLoadingExchanges(false);
            }
        };
        fetchExchanges();
    }, []);

    if (!state) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-900 dark:text-white">
                <p>No items selected for checkout.</p>
                <Button onClick={() => navigate("/sales")}>Go to Sales</Button>
            </div>
        );
    }

    /* ── Calculations ── */
    const productSubtotal = state.items
        .filter(i => i.type === "Product")
        .reduce((s, i) => s + i.price * i.quantity, 0);
    const serviceSubtotal = state.items
        .filter(i => i.type === "Service")
        .reduce((s, i) => s + i.price * i.quantity, 0);

    const productGst = gstEnabled ? productSubtotal * 0.18 : 0;
    const exchangeDiscount = selectedExchange ? Number(selectedExchange.valuation_amount) : 0;
    const grandTotal = productSubtotal + productGst + serviceSubtotal + installCharges + deliveryCharges - exchangeDiscount;

    /* ── Warranty expiry calculation ── */
    const calcExpiry = (val: string, unit: string) => {
        const n = parseInt(val) || 0;
        const d = new Date();
        if (unit === "Years") d.setFullYear(d.getFullYear() + n);
        else d.setMonth(d.getMonth() + n);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };
    const totalWarrantyExpiry = calcExpiry(totalWarrantyVal, warrantyUnit);
    const freeReplacementExpiry = calcExpiry(freeReplacementVal, warrantyUnit);

    /* ── Build invoice state helper ── */
    const buildInvoiceState = () => {
        let formattedVehicleDetails = "";
        let formattedInstallAddress = "";

        if (usageType === "Vehicle") {
            formattedVehicleDetails = vehicleNumber
                ? `Vehicle: ${vehicleNumber}${vehicleModel ? ` (${vehicleModel})` : ""}`
                : (vehicleModel ? `Vehicle: ${vehicleModel}` : "Vehicle");
        } else if (usageType === "Home" && installationRequired) {
            formattedInstallAddress = sameAsBilling ? customerInfo.billingAddress : installAddress;
        }

        return {
            ...state,
            installCharges,
            deliveryCharges,
            exchangeDiscount,
            selectedExchange,
            customerInfo: { ...customerInfo },
            usageType,
            productType: usageType,
            vehicleModel,
            vehicleNumber,
            vehicleDetails: formattedVehicleDetails,
            installationRequired: usageType === "Home" ? installationRequired : false,
            sameAsBilling,
            installAddress: formattedInstallAddress,
            landmark: (usageType === "Home" && installationRequired) ? landmark : "",
            warrantyDetails: {
                totalWarranty: `${totalWarrantyVal} ${warrantyUnit}`,
                totalWarrantyExpiry,
                freeReplacement: `${freeReplacementVal} ${warrantyUnit}`,
                freeReplacementExpiry,
            },
            billedBy,
            finalTotal: grandTotal,
            productGst,
            productSubtotal,
            serviceSubtotal,
            paymentMethod,
            cashAmount: paymentMethod === "Split" ? cashPart : (paymentMethod === "Cash" ? grandTotal : 0),
            upiAmount: paymentMethod === "Split" ? (grandTotal - cashPart) : (paymentMethod === "UPI" ? grandTotal : 0),
            gst_enabled: gstEnabled,
        };
    };

    /* ── Submit Sale / Quotation ── */
    const handleProcessSale = async () => {
        if (!customerInfo.name.trim()) { alert("Customer name is required."); return; }
        if (!customerInfo.phone.replace("+91 ", "").trim()) { alert("Phone number is required."); return; }

        setLoading(true);
        try {
            let vehicleDetailsPayload = "";
            let installAddressPayload = "";

            if (usageType === "Vehicle") {
                vehicleDetailsPayload = vehicleNumber
                    ? `Vehicle: ${vehicleNumber}${vehicleModel ? ` (${vehicleModel})` : ""}`
                    : (vehicleModel ? `Vehicle: ${vehicleModel}` : "Vehicle");
            } else if (usageType === "Home" && installationRequired) {
                const baseAddr = sameAsBilling ? customerInfo.billingAddress : installAddress;
                installAddressPayload = baseAddr + (landmark ? (baseAddr ? `\nLandmark: ${landmark}` : `Landmark: ${landmark}`) : "");
            }

            const saleData = {
                customer_name: customerInfo.name || "Walk-in Customer",
                customer_phone: customerInfo.phone,
                vehicle_details: vehicleDetailsPayload,
                installation_address: installAddressPayload,
                product_category: state?.fromService ? "Converted to New Order" : usageType,
                type: state.isQuotation ? "Quotation" : "Sale",
                items: state.items.map(item => ({
                    product_id: item.type === "Product" ? Number(item.id) : null,
                    service_id: item.type === "Service" ? Number(item.id.toString().replace("service-", "")) : (state?.fromService ? state.serviceId : null),
                    quantity: item.quantity,
                    price: item.price,
                })),
                total_amount: grandTotal,
                extra_charges: installCharges + deliveryCharges,
                discount_amount: exchangeDiscount,
                exchange_record_id: selectedExchange?.id ?? null,
                payment_method: state.isQuotation ? "Cash" : paymentMethod,
                cash_amount: state.isQuotation ? 0 : (paymentMethod === "Split" ? cashPart : (paymentMethod === "Cash" ? grandTotal : 0)),
                upi_amount: state.isQuotation ? 0 : (paymentMethod === "Split" ? (grandTotal - cashPart) : (paymentMethod === "UPI" ? grandTotal : 0)),
                gst_enabled: gstEnabled ? 1 : 0,
            };

            const response = await apiClient.post<any>('/sales', saleData);
            localStorage.removeItem("pending_bill_items");

            if (!state.isQuotation) {
                addNotification({
                    type: "SALES",
                    title: `New Sale: ₹${grandTotal.toLocaleString()}`,
                    message: `${state.items.length} item(s) sold via ${paymentMethod} to ${customerInfo.name || "Walk-in Customer"}.`,
                    role: "admin",
                });
            }

            navigate("/invoice", { state: { ...buildInvoiceState(), id: response?.id, created_at: response?.created_at } });
        } catch (err: any) {
            const msg = err.message || "Failed to process. Please try again.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleUnitChange = (newUnit: "Months" | "Years") => {
        if (newUnit === warrantyUnit) return;

        const convert = (val: string) => {
            const num = parseFloat(val) || 0;
            if (newUnit === "Years") {
                const result = num / 12;
                return Number.isInteger(result) ? result.toString() : result.toFixed(1);
            } else {
                return Math.round(num * 12).toString();
            }
        };

        setTotalWarrantyVal(convert(totalWarrantyVal));
        setFreeReplacementVal(convert(freeReplacementVal));
        setWarrantyUnit(newUnit);
    };

    const inputClass = "bg-gray-50/50 hover:bg-white focus:bg-white dark:bg-[#070A13] border border-gray-200 dark:border-[#25314D] h-10 sm:h-11 text-gray-900 dark:text-[#FFFFFF] text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#2E6DFF]/20 rounded-xl transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 px-3.5";
    const chargeInput = "bg-transparent border-none w-20 text-right font-black text-gray-900 dark:text-[#FFFFFF] focus:ring-0 outline-none p-0 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500";

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#05050A] flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors duration-500">
            {loading && <BatteryLoader />}

            {/* ── Fixed Compact Checkout Header ── */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0D121F]/90 backdrop-blur-md border-b border-gray-200 dark:border-[#25314D] px-3.5 py-2.5 flex items-center justify-between shadow-xs">
                <button
                    onClick={() => navigate(-1)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#161D30] rounded-xl transition-colors text-gray-700 dark:text-gray-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight uppercase">
                    {state.isQuotation ? "Quotation Details" : "Final Checkout"}
                </h1>
                <div className="w-7" />
            </header>

            <main className="flex-1 px-2 sm:px-4 pt-16 pb-6 space-y-3.5 max-w-2xl mx-auto w-full">

                {/* ── Section: Customer Details ── */}
                <div className="bg-white dark:bg-[#0D121F] rounded-2xl border border-gray-200 dark:border-[#25314D] shadow-xs overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-[#161D30]/80 border-b border-gray-200 dark:border-[#25314D] flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <h2 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Customer Details</h2>
                    </div>

                    <div className="p-3.5 sm:p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <Field label="Full Name">
                                <Input
                                    type="text"
                                    value={customerInfo.name}
                                    onChange={(e) => !hasService && setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    readOnly={hasService}
                                    className={inputClass}
                                    placeholder="e.g. Ganesh S"
                                />
                            </Field>
                            <Field label="Mobile Number">
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        type="tel"
                                        value={customerInfo.phone}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (!val.startsWith("+91 ")) setCustomerInfo({ ...customerInfo, phone: "+91 " + val.replace(/^\+91\s?/, "") });
                                            else setCustomerInfo({ ...customerInfo, phone: val });
                                        }}
                                        className={`flex-1 ${inputClass}`}
                                        placeholder="+91 98765 43210"
                                    />
                                    {customerInfo.phone && customerInfo.phone.replace(/\D/g, "").length > 2 && (
                                        <ContactActions phoneNumber={customerInfo.phone} iconSize={16} className="p-1" />
                                    )}
                                </div>
                            </Field>
                        </div>
                        <Field label="Billing Address">
                            <textarea
                                value={customerInfo.billingAddress}
                                onChange={(e) => {
                                    setCustomerInfo({ ...customerInfo, billingAddress: e.target.value });
                                    if (sameAsBilling) setInstallAddress(e.target.value);
                                }}
                                rows={2}
                                className="w-full bg-gray-50/50 hover:bg-white focus:bg-white dark:bg-[#070A13] border border-gray-200 dark:border-[#25314D] rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#2E6DFF]/20 outline-none resize-none transition-all placeholder:text-gray-400 min-h-[52px]"
                                placeholder="Door No, Street, City, Pincode"
                            />
                        </Field>
                    </div>
                </div>

                {/* ── Section: Installation Info ── */}
                {!state.isQuotation && (
                <div className="bg-white dark:bg-[#0D121F] rounded-2xl border border-gray-200 dark:border-[#25314D] shadow-xs overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-[#161D30]/80 border-b border-gray-200 dark:border-[#25314D] flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <h2 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Installation Info</h2>
                    </div>

                    <div className="p-3.5 sm:p-4 space-y-3">
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider ml-0.5">
                                Usage Selection
                            </label>
                            <div className="flex flex-row gap-2.5">
                                <label
                                    onClick={() => setUsageType("Vehicle")}
                                    className={`flex-1 flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${usageType === "Vehicle" ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" : "border-gray-200 dark:border-[#25314D] bg-white dark:bg-[#070A13] text-gray-700 dark:text-gray-300"}`}
                                >
                                    <input
                                        type="radio"
                                        name="usageType"
                                        checked={usageType === "Vehicle"}
                                        onChange={() => setUsageType("Vehicle")}
                                        className="w-3.5 h-3.5 text-blue-600 accent-blue-600"
                                    />
                                    <span className="text-xs font-bold uppercase tracking-wider">Vehicle Usage</span>
                                </label>

                                <label
                                    onClick={() => setUsageType("Home")}
                                    className={`flex-1 flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${usageType === "Home" ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" : "border-gray-200 dark:border-[#25314D] bg-white dark:bg-[#070A13] text-gray-700 dark:text-gray-300"}`}
                                >
                                    <input
                                        type="radio"
                                        name="usageType"
                                        checked={usageType === "Home"}
                                        onChange={() => setUsageType("Home")}
                                        className="w-3.5 h-3.5 text-blue-600 accent-blue-600"
                                    />
                                    <span className="text-xs font-bold uppercase tracking-wider">Home / UPS Usage</span>
                                </label>
                            </div>
                        </div>

                        {usageType === "Vehicle" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1 animate-in fade-in duration-200">
                                <Field label="Vehicle Model">
                                    <Input
                                        type="text"
                                        value={vehicleModel}
                                        onChange={(e) => setVehicleModel(e.target.value)}
                                        className={inputClass}
                                        placeholder="e.g. Swift VDi / Honda Activa"
                                    />
                                </Field>
                                <Field label="Vehicle Number">
                                    <Input
                                        type="text"
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value)}
                                        className={inputClass}
                                        placeholder="e.g. TN 38 BU 1234"
                                    />
                                </Field>
                            </div>
                        )}

                        {usageType === "Home" && (
                            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                                <div>
                                    <label className="flex items-center gap-2.5 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={installationRequired}
                                            onChange={(e) => setInstallationRequired(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                                        />
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                            Installation Required
                                        </span>
                                    </label>
                                </div>

                                {installationRequired && (
                                    <div className="space-y-3 pt-1 pl-2 border-l-2 border-blue-500/20">
                                        <div>
                                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={sameAsBilling}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setSameAsBilling(checked);
                                                        if (checked) setInstallAddress(customerInfo.billingAddress);
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600"
                                                />
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Same as Billing Address</span>
                                            </label>
                                        </div>

                                        {sameAsBilling && (
                                            <Field label="Landmark">
                                                <Input
                                                    type="text"
                                                    value={landmark}
                                                    onChange={(e) => setLandmark(e.target.value)}
                                                    className={inputClass}
                                                    placeholder="e.g. Near Pillayar Temple"
                                                />
                                            </Field>
                                        )}

                                        {!sameAsBilling && (
                                            <div className="space-y-2.5 animate-in slide-in-from-top-1 duration-200">
                                                <Field label="Installation Address">
                                                    <textarea
                                                        value={installAddress}
                                                        onChange={(e) => setInstallAddress(e.target.value)}
                                                        rows={2}
                                                        className="w-full bg-gray-50/50 hover:bg-white focus:bg-white dark:bg-[#070A13] border border-gray-200 dark:border-[#25314D] rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#2E6DFF]/20 outline-none resize-none transition-all placeholder:text-gray-400 min-h-[52px]"
                                                        placeholder="Specific installation location..."
                                                    />
                                                </Field>
                                                <Field label="Landmark">
                                                    <Input
                                                        type="text"
                                                        value={landmark}
                                                        onChange={(e) => setLandmark(e.target.value)}
                                                        className={inputClass}
                                                        placeholder="e.g. Near Pillayar Temple"
                                                    />
                                                </Field>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                )}

                {/* ── Section: Warranty Registration ── */}
                {!state.isQuotation && (
                    <div className="bg-white dark:bg-[#0D121F] rounded-2xl border border-gray-200 dark:border-[#25314D] shadow-xs overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-[#161D30]/80 border-b border-gray-200 dark:border-[#25314D] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-600" />
                                <h2 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Warranty Registration</h2>
                            </div>
                            {!isWarrantyEditable ? (
                                <button
                                    type="button"
                                    onClick={() => setIsWarrantyEditable(true)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg transition-all uppercase tracking-wider"
                                >
                                    Edit
                                </button>
                            ) : (
                                <div className="flex bg-gray-100 dark:bg-[#161D30] p-0.5 rounded-lg border border-gray-200 dark:border-[#25314D]">
                                    <button
                                        onClick={() => handleUnitChange("Months")}
                                        className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-all ${warrantyUnit === "Months" ? "bg-blue-600 text-white" : "text-gray-500 dark:text-white/40"}`}
                                    >
                                        MONTHS
                                    </button>
                                    <button
                                        onClick={() => handleUnitChange("Years")}
                                        className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-all ${warrantyUnit === "Years" ? "bg-blue-600 text-white" : "text-gray-500 dark:text-white/40"}`}
                                    >
                                        YEARS
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-3.5 sm:p-4 space-y-3">
                            <div className="space-y-2">
                                <WarrantyInput
                                    label="Total Warranty"
                                    value={totalWarrantyVal}
                                    onValueChange={setTotalWarrantyVal}
                                    disabled={!isWarrantyEditable}
                                />
                                <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />
                                <WarrantyInput
                                    label="Free Replacement"
                                    value={freeReplacementVal}
                                    onValueChange={setFreeReplacementVal}
                                    disabled={!isWarrantyEditable}
                                />
                            </div>
                            {(parseInt(totalWarrantyVal) > 0 || parseInt(freeReplacementVal) > 0) && (
                                <div className="bg-blue-50/60 dark:bg-blue-950/20 rounded-xl p-3 space-y-1 border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Calculated Expiry Dates</p>
                                    {parseInt(totalWarrantyVal) > 0 && (
                                        <p className="text-xs text-gray-800 dark:text-white font-semibold">
                                            Total Warranty: <span className="text-blue-600 dark:text-blue-400 font-bold">{totalWarrantyExpiry}</span>
                                        </p>
                                    )}
                                    {parseInt(freeReplacementVal) > 0 && (
                                        <p className="text-xs text-gray-800 dark:text-white font-semibold">
                                            Free Replacement: <span className="text-blue-600 dark:text-blue-400 font-bold">{freeReplacementExpiry}</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Section: Order Items & Charges ── */}
                <div className="bg-white dark:bg-[#0D121F] rounded-2xl border border-gray-200 dark:border-[#25314D] shadow-xs overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-[#161D30]/80 border-b border-gray-200 dark:border-[#25314D] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <h2 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Order Items & Charges</h2>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-[#25314D]">
                        {state.items.map((item) => (
                            <div key={item.id} className="p-3.5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${item.type === "Product" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"}`}>
                                        {item.type === "Product" ? <Zap className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white tracking-tight">{item.name} {item.model}</h3>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                                            {item.quantity} unit(s) · ₹{item.price.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white tracking-tight">₹{(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>

                    {!state.isQuotation && (
                        <div className="p-3.5 bg-gray-50/50 dark:bg-[#070A13]/50 space-y-3 border-t border-gray-200 dark:border-[#25314D]">
                            <ChargeRow label="Installation Charges" sublabel="No GST applied">
                                <div className="flex items-center bg-white dark:bg-[#070A13] rounded-xl px-3 py-1.5 border border-gray-200 dark:border-[#25314D]">
                                    <span className="text-gray-900 dark:text-white font-bold text-xs mr-1">₹</span>
                                    <input
                                        type="number" min="0"
                                        value={installCharges || ""}
                                        onChange={(e) => setInstallCharges(Number(e.target.value))}
                                        className={chargeInput} placeholder="0"
                                    />
                                </div>
                            </ChargeRow>

                            <ChargeRow label="Delivery Charges" sublabel="No GST applied">
                                <div className="flex items-center bg-white dark:bg-[#070A13] rounded-xl px-3 py-1.5 border border-gray-200 dark:border-[#25314D]">
                                    <Truck className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
                                    <input
                                        type="number" min="0"
                                        value={deliveryCharges || ""}
                                        onChange={(e) => setDeliveryCharges(Number(e.target.value))}
                                        className={chargeInput} placeholder="0"
                                    />
                                </div>
                            </ChargeRow>

                            {/* Old Battery Exchange */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex items-center gap-1.5">
                                    <RefreshCcw className="w-3.5 h-3.5 text-rose-500" />
                                    <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Old Battery Exchange</span>
                                </div>
                                {loadingExchanges ? (
                                    <p className="text-xs text-gray-400 py-1">Loading exchanges…</p>
                                ) : exchangeRecords.length === 0 ? (
                                    <div className="bg-white dark:bg-[#070A13] rounded-xl p-3 border border-dashed border-gray-200 dark:border-[#25314D] text-center">
                                        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">No pending exchange records found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {selectedExchange && (
                                            <button
                                                onClick={() => setSelectedExchange(null)}
                                                className="text-[10px] text-gray-500 hover:text-gray-700 underline"
                                            >
                                                Remove exchange selection
                                            </button>
                                        )}
                                        {exchangeRecords.map(rec => (
                                            <div
                                                key={rec.id}
                                                onClick={() => setSelectedExchange(selectedExchange?.id === rec.id ? null : rec)}
                                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedExchange?.id === rec.id
                                                    ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20"
                                                    : "border-gray-200 dark:border-[#25314D] bg-white dark:bg-[#070A13]"
                                                    }`}
                                            >
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white">{rec.battery_brand} {rec.battery_model}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">{rec.customer_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-rose-500">- ₹{Number(rec.valuation_amount).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="p-3.5 space-y-1.5 bg-gray-50/30 dark:bg-[#070A13]/30 border-t border-gray-200 dark:border-[#25314D]">
                        {serviceSubtotal > 0 && (
                            <SummaryRow label="Service Charges" value={`₹${serviceSubtotal.toLocaleString()}`} />
                        )}
                        <SummaryRow label={`Product Subtotal`} value={`₹${productSubtotal.toLocaleString()}`} />
                        {gstEnabled && (
                            <SummaryRow label="Product GST (18%)" value={`₹${productGst.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                        )}
                        {installCharges > 0 && <SummaryRow label="Installation Charges" value={`₹${installCharges.toLocaleString()}`} />}
                        {deliveryCharges > 0 && <SummaryRow label="Delivery Charges" value={`₹${deliveryCharges.toLocaleString()}`} />}
                        {exchangeDiscount > 0 && (
                            <SummaryRow label="Exchange Discount" value={`- ₹${exchangeDiscount.toLocaleString()}`} accent="text-rose-500" />
                        )}
                    </div>
                </div>

                {/* ── Payment Method & Action Card ── */}
                <div className="bg-white dark:bg-[#0D121F] rounded-2xl border border-gray-200 dark:border-[#25314D] p-3.5 sm:p-4 space-y-3.5 shadow-xs relative overflow-hidden">
                    <div className="space-y-1.5 relative z-10">
                        <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block ml-0.5">
                            Billing Selection (GST / Non-GST)
                        </label>
                        <div className="flex flex-row gap-2.5">
                            <label
                                onClick={() => setGstEnabled(true)}
                                className={`flex-1 flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${gstEnabled ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" : "border-gray-200 dark:border-[#25314D] bg-white dark:bg-[#070A13] text-gray-700 dark:text-gray-300"}`}
                            >
                                <input
                                    type="radio"
                                    name="gstBillingType"
                                    checked={gstEnabled}
                                    onChange={() => setGstEnabled(true)}
                                    className="w-3.5 h-3.5 text-blue-600 accent-blue-600"
                                />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider">GST Tax Invoice</p>
                                </div>
                            </label>

                            <label
                                onClick={() => setGstEnabled(false)}
                                className={`flex-1 flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${!gstEnabled ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" : "border-gray-200 dark:border-[#25314D] bg-white dark:bg-[#070A13] text-gray-700 dark:text-gray-300"}`}
                            >
                                <input
                                    type="radio"
                                    name="gstBillingType"
                                    checked={!gstEnabled}
                                    onChange={() => setGstEnabled(false)}
                                    className="w-3.5 h-3.5 text-blue-600 accent-blue-600"
                                />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider">Non-GST / Cash Bill</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Grand Total Display */}
                    <div className="flex items-end justify-between relative z-10 pt-2 border-t border-gray-100 dark:border-[#25314D]">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                                Grand Total Payable
                            </p>
                            <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                ₹{Math.max(0, grandTotal).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Confirmed</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    {!state.isQuotation && (
                        <>
                            <div className="space-y-1 relative z-10">
                                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block ml-0.5">Transaction Method</label>
                                <div className="relative">
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => {
                                            const val = e.target.value as "Cash" | "UPI" | "Split";
                                            setPaymentMethod(val);
                                            if (val === "Split") setCashPart(0);
                                        }}
                                        className="w-full bg-white dark:bg-[#070A13] border border-gray-200 dark:border-[#25314D] rounded-xl px-3.5 h-11 text-gray-900 dark:text-white font-bold text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer transition-all pr-10"
                                    >
                                        <option value="Cash">Cash Transaction</option>
                                        <option value="UPI">UPI / QR Payment</option>
                                        <option value="Split">Split Payment (Mix Mode)</option>
                                    </select>
                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            {paymentMethod === "Split" && (
                                <div className="grid grid-cols-2 gap-3 relative z-10 animate-in fade-in duration-200">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Cash Part</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 dark:text-white font-bold text-xs">₹</span>
                                            <input
                                                type="number"
                                                value={cashPart || ""}
                                                onChange={(e) => {
                                                    const val = Math.min(grandTotal, Math.max(0, Number(e.target.value)));
                                                    setCashPart(val);
                                                }}
                                                className="w-full pl-7 pr-3 py-2 rounded-xl border border-gray-200 dark:border-[#25314D] bg-white dark:bg-[#070A13] text-gray-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">UPI Part</label>
                                        <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl flex items-center px-3 h-9 text-xs font-bold text-blue-600 dark:text-blue-400">
                                            ₹{(grandTotal - cashPart).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Submit Action Button */}
                    <Button
                        onClick={handleProcessSale}
                        disabled={loading}
                        className={`w-full text-white h-12 sm:h-13 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 relative z-10 ${paymentMethod === "Cash"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : paymentMethod === "Split"
                                ? "bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 hover:opacity-95 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                    >
                        {loading ? (
                            <Zap className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {paymentMethod === "Cash" ? <Banknote className="w-4 h-4" /> : paymentMethod === "Split" ? <RefreshCcw className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                                <span>
                                    {state.isQuotation ? "Confirm Quotation Details" : "Generate Bill & Pay"}
                                </span>
                            </>
                        )}
                    </Button>
                </div>

                <div className="h-10" />
            </main>
        </div>
    );
}

/** Helpers */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider ml-0.5">{label}</label>
            {children}
        </div>
    );
}

function ChargeRow({
    label, sublabel, children,
}: {
    label: string; sublabel?: string; children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between group">
            <div>
                <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{label}</span>
                {sublabel && <p className="text-[10px] text-gray-400 font-medium mt-0.5">{sublabel}</p>}
            </div>
            {children}
        </div>
    );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
    return (
        <div className="flex justify-between items-center py-0.5">
            <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{label}</span>
            <span className={`text-xs sm:text-sm font-bold ${accent ?? "text-gray-900 dark:text-white"}`}>{value}</span>
        </div>
    );
}
