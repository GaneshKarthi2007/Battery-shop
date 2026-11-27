import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
    ArrowLeft, Zap, Banknote, QrCode, RefreshCcw, ChevronDown
} from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { apiClient } from "../api/client";
import { useNotifications } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import { BatteryLoader } from "../components/ui/BatteryLoader";
import { ContactActions } from "../components/ui/ContactActions";
import { MinimalConfirmDialog } from "../components/ui/MinimalConfirmDialog";
import {
    isValidMobile10,
    normalizeMobile10,
    capitalizeEachWord,
    capitalizeFirstLetter,
} from "../utils/inputFormatters";

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
        isNewConnection?: boolean;
        customerInfo?: {
            name: string;
            phone: string;
            address: string;
        };
        serviceSpecs?: {
            complaint_type?: string;
            complaint_details?: string;
            vehicle_details?: string;
            battery_brand?: string;
            battery_model?: string;
            battery_capacity?: string;
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

    /** ── Product / Type & Installation ── */
    const [usageType, setUsageType] = useState<"Vehicle" | "Home">("Home");
    const [vehicleModel, setVehicleModel] = useState("");
    const [installationRequired, setInstallationRequired] = useState(true);
    const [installAddress, setInstallAddress] = useState("");
    const [sameAsBilling, setSameAsBilling] = useState(true);

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
    const [showExtras, setShowExtras] = useState(false);
    const [showBackConfirm, setShowBackConfirm] = useState(false);

    const serviceItem = state?.items?.find(item => item.type === "Service");
    const hasService = !!serviceItem;

    /* Auto-fill billedBy from logged-in user */
    useEffect(() => {
        if (user) setBilledBy(user.name);
    }, [user]);

    /* Auto-fill customer & installation details from service / new connection state */
    useEffect(() => {
        const formatIndianPhone = (raw?: string) => {
            if (!raw) return "+91 ";
            const digits = raw.replace(/\D/g, "");
            if (digits.length === 10) return `+91 ${digits}`;
            if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2)}`;
            return raw.startsWith("+") ? raw : `+91 ${raw}`;
        };

        if (state?.fromService && state.customerInfo) {
            const addr = state.customerInfo.address || "";
            setCustomerInfo({
                name: state.customerInfo.name || "",
                phone: formatIndianPhone(state.customerInfo.phone),
                billingAddress: addr,
            });
            if (addr) {
                setSameAsBilling(true);
                setInstallAddress(addr);
            }

            const vehicleHint = state.serviceSpecs?.vehicle_details?.trim();
            const hasRealVehicle = Boolean(vehicleHint && vehicleHint.toUpperCase() !== "N/A");
            const prodType = (productItem?.originalData?.type || "").toLowerCase();

            if (prodType.includes("invert") || (state.isNewConnection && !hasRealVehicle)) {
                setUsageType("Home");
                setInstallationRequired(true);
            } else if (hasRealVehicle) {
                setUsageType("Vehicle");
                setVehicleModel(vehicleHint || "");
            }
        } else if (serviceItem?.originalData) {
            const svc = serviceItem.originalData;
            setCustomerInfo(prev => ({
                ...prev,
                name: svc.customer_name || "",
                phone: formatIndianPhone(svc.contact_number),
                billingAddress: svc.address || ""
            }));
        }
    }, [hasService, serviceItem, productItem, state?.fromService, state?.isNewConnection, state?.customerInfo, state?.serviceSpecs]);

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
        const formattedVehicleDetails = vehicleModel ? `Vehicle: ${vehicleModel}` : "";
        const formattedInstallAddress = installationRequired
            ? (sameAsBilling ? customerInfo.billingAddress : installAddress)
            : "";

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
            vehicleNumber: "",
            vehicleDetails: formattedVehicleDetails,
            installationRequired,
            sameAsBilling,
            installAddress: formattedInstallAddress,
            landmark: "",
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
        if (!isValidMobile10(customerInfo.phone)) { alert("Please enter a valid 10-digit mobile number."); return; }

        const formattedName = capitalizeEachWord(customerInfo.name.trim());
        const normalizedPhone = normalizeMobile10(customerInfo.phone);
        const formattedBillingAddr = capitalizeFirstLetter(customerInfo.billingAddress);
        const formattedInstallAddr = capitalizeFirstLetter(installAddress);

        setLoading(true);
        try {
            const vehicleDetailsPayload = vehicleModel ? `Vehicle: ${vehicleModel}` : "";
            const installAddressPayload = installationRequired
                ? (sameAsBilling ? formattedBillingAddr : formattedInstallAddr)
                : "";

            const saleData = {
                customer_name: formattedName || "Walk-in Customer",
                customer_phone: normalizedPhone,
                vehicle_details: vehicleDetailsPayload,
                installation_address: installAddressPayload,
                product_category: state?.fromService ? (state?.isNewConnection ? "New Connection" : "Converted to New Order") : usageType,
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

    const inputClass = "bg-gray-50/50 hover:bg-white focus:bg-white dark:bg-[#070A13] border border-gray-200 dark:border-[#25314D] h-9 sm:h-10 text-gray-900 dark:text-[#FFFFFF] text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#2E6DFF]/20 rounded-xl transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 px-3";
    const chargeInput = "bg-transparent border-none w-20 text-right font-black text-gray-900 dark:text-[#FFFFFF] focus:ring-0 outline-none p-0 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500";

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#05050A] flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors duration-500">
            {loading && <BatteryLoader />}

            {/* ── Fixed Compact Checkout Header ── */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0D121F]/90 backdrop-blur-md border-b border-gray-200 dark:border-[#25314D] px-3.5 py-2.5 flex items-center justify-between shadow-xs">
                <button
                    onClick={() => setShowBackConfirm(true)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#161D30] rounded-xl transition-colors text-gray-700 dark:text-gray-200"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="text-sm sm:text-base font-black text-gray-900 dark:text-white tracking-tight uppercase">
                    {state.isQuotation ? "Quotation Details" : "Final Checkout"}
                </h1>
                <div className="w-7" />
            </header>

            <main className="flex-1 px-2.5 sm:px-4 pt-14 pb-6 max-w-2xl mx-auto w-full">
                {/* Single Unified Compact Checkout Card */}
                <div
                    data-testid="checkout-unified-card"
                    className="bg-white dark:bg-[#0D121F] rounded-2xl border border-gray-200 dark:border-[#25314D] shadow-xs divide-y divide-gray-100 dark:divide-[#25314D] overflow-hidden"
                >
                    {/* 1. Customer Inputs: Name, Mobile Number, Address, Installation Required */}
                    <div className="p-3.5 sm:p-4 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <Field label="Name">
                                <Input
                                    type="text"
                                    aria-label="Name"
                                    value={customerInfo.name}
                                    onChange={(e) => !hasService && setCustomerInfo({ ...customerInfo, name: capitalizeEachWord(e.target.value) })}
                                    readOnly={hasService}
                                    className={inputClass}
                                    placeholder="e.g. Ganesh S"
                                />
                            </Field>
                            <Field label="Mobile Number">
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        type="tel"
                                        aria-label="Mobile Number"
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
                                        <ContactActions phoneNumber={customerInfo.phone} iconSize={14} className="shrink-0" />
                                    )}
                                </div>
                            </Field>
                        </div>

                        <Field label="Address">
                            <textarea
                                aria-label="Address"
                                value={customerInfo.billingAddress}
                                onChange={(e) => {
                                    const nextAddr = capitalizeFirstLetter(e.target.value);
                                    setCustomerInfo({ ...customerInfo, billingAddress: nextAddr });
                                    if (sameAsBilling) setInstallAddress(nextAddr);
                                }}
                                rows={2}
                                className="w-full bg-gray-50/50 hover:bg-white focus:bg-white dark:bg-[#070A13] border border-gray-200 dark:border-[#25314D] rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#2E6DFF]/20 outline-none resize-none transition-all placeholder:text-gray-400"
                                placeholder="Door No, Street, City, Pincode"
                            />
                        </Field>

                        {!state.isQuotation && (
                            <div className="pt-0.5 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <label className="inline-flex items-center gap-2 cursor-pointer">
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

                                    {installationRequired && (
                                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={sameAsBilling}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setSameAsBilling(checked);
                                                    if (checked) setInstallAddress(customerInfo.billingAddress);
                                                }}
                                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer"
                                            />
                                            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                                                Same as Address
                                            </span>
                                        </label>
                                    )}
                                </div>

                                {installationRequired && !sameAsBilling && (
                                    <Input
                                        type="text"
                                        aria-label="Installation Address"
                                        value={installAddress}
                                        onChange={(e) => setInstallAddress(capitalizeFirstLetter(e.target.value))}
                                        className={inputClass}
                                        placeholder="Specific installation address & landmark..."
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* 2. Ordered Items Details */}
                    <div className="p-3.5 sm:p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                Ordered Items ({state.items.length})
                            </span>
                            {!state.isQuotation && (
                                <button
                                    type="button"
                                    onClick={() => setShowExtras(!showExtras)}
                                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                                >
                                    <span>Charges / Exchange / Warranty</span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExtras ? "rotate-180" : ""}`} />
                                </button>
                            )}
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-[#25314D] rounded-xl border border-gray-100 dark:border-[#25314D] bg-gray-50/40 dark:bg-[#070A13]/40">
                            {state.items.map((item) => (
                                <div key={item.id} className="px-3 py-2 flex justify-between items-center gap-2">
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {item.name} {item.model}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                                            {item.quantity} × ₹{item.price.toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white shrink-0">
                                        ₹{(item.price * item.quantity).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Optional collapsed charges, exchange & warranty */}
                        {!state.isQuotation && showExtras && (
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#070A13] border border-gray-200 dark:border-[#25314D] space-y-2.5">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <ChargeRow label="Install ₹">
                                        <input
                                            type="number" min="0"
                                            value={installCharges || ""}
                                            onChange={(e) => setInstallCharges(Number(e.target.value))}
                                            className={chargeInput} placeholder="0"
                                        />
                                    </ChargeRow>
                                    <ChargeRow label="Delivery ₹">
                                        <input
                                            type="number" min="0"
                                            value={deliveryCharges || ""}
                                            onChange={(e) => setDeliveryCharges(Number(e.target.value))}
                                            className={chargeInput} placeholder="0"
                                        />
                                    </ChargeRow>
                                </div>

                                <div className="pt-2 border-t border-gray-200 dark:border-[#25314D] space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Warranty ({totalWarrantyExpiry})</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsWarrantyEditable(!isWarrantyEditable)}
                                            className="text-[10px] font-bold text-blue-600 hover:underline"
                                        >
                                            {isWarrantyEditable ? "Done" : "Edit"}
                                        </button>
                                    </div>
                                    {isWarrantyEditable && (
                                        <div className="space-y-1.5">
                                            <div className="flex gap-1.5">
                                                <button type="button" onClick={() => handleUnitChange("Months")} className={`px-2 py-0.5 rounded text-[9px] font-bold ${warrantyUnit === "Months" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800"}`}>MONTHS</button>
                                                <button type="button" onClick={() => handleUnitChange("Years")} className={`px-2 py-0.5 rounded text-[9px] font-bold ${warrantyUnit === "Years" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800"}`}>YEARS</button>
                                            </div>
                                            <WarrantyInput label="Total Warranty" value={totalWarrantyVal} onValueChange={setTotalWarrantyVal} />
                                            <WarrantyInput label="Free Replacement" value={freeReplacementVal} onValueChange={setFreeReplacementVal} />
                                        </div>
                                    )}
                                </div>

                                {!loadingExchanges && exchangeRecords.length > 0 && (
                                    <div className="pt-2 border-t border-gray-200 dark:border-[#25314D] space-y-1">
                                        <span className="text-[10px] font-bold text-rose-500 uppercase">Old Battery Exchange</span>
                                        {exchangeRecords.map(rec => (
                                            <button
                                                key={rec.id}
                                                type="button"
                                                onClick={() => setSelectedExchange(selectedExchange?.id === rec.id ? null : rec)}
                                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left text-xs ${selectedExchange?.id === rec.id ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20" : "border-gray-200 dark:border-[#25314D] bg-white dark:bg-[#0D121F]"}`}
                                            >
                                                <span className="font-semibold truncate">{rec.battery_brand} {rec.battery_model} ({rec.customer_name})</span>
                                                <span className="font-black text-rose-500 shrink-0">- ₹{Number(rec.valuation_amount).toLocaleString()}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-1 pt-1 text-xs">
                            {serviceSubtotal > 0 && <SummaryRow label="Service Charges" value={`₹${serviceSubtotal.toLocaleString()}`} />}
                            <SummaryRow label="Product Subtotal" value={`₹${productSubtotal.toLocaleString()}`} />
                            {gstEnabled && (
                                <SummaryRow label="GST (18%)" value={`₹${productGst.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                            )}
                            {installCharges > 0 && <SummaryRow label="Installation" value={`₹${installCharges.toLocaleString()}`} />}
                            {deliveryCharges > 0 && <SummaryRow label="Delivery" value={`₹${deliveryCharges.toLocaleString()}`} />}
                            {exchangeDiscount > 0 && <SummaryRow label="Exchange Discount" value={`- ₹${exchangeDiscount.toLocaleString()}`} accent="text-rose-500" />}
                        </div>
                    </div>

                    {/* 3. GST Checkbox, Payment Method, Grand Total & Submit */}
                    <div className="p-3.5 sm:p-4 space-y-3 bg-gray-50/30 dark:bg-[#070A13]/30">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={gstEnabled}
                                    onChange={(e) => setGstEnabled(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                                />
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                    GST Invoice (18%)
                                </span>
                                <span className="text-[10px] font-semibold text-gray-500">
                                    ({gstEnabled ? "GST" : "Non-GST"})
                                </span>
                            </label>

                            {!state.isQuotation && (
                                <select
                                    aria-label="Transaction Method"
                                    value={paymentMethod}
                                    onChange={(e) => {
                                        const val = e.target.value as "Cash" | "UPI" | "Split";
                                        setPaymentMethod(val);
                                        if (val === "Split") setCashPart(0);
                                    }}
                                    className="bg-white dark:bg-[#070A13] border border-gray-200 dark:border-[#25314D] rounded-xl px-2.5 h-8 text-gray-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI / QR</option>
                                    <option value="Split">Split (Cash + UPI)</option>
                                </select>
                            )}
                        </div>

                        {!state.isQuotation && paymentMethod === "Split" && (
                            <div className="grid grid-cols-2 gap-2.5 animate-in fade-in duration-200">
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-900 dark:text-white font-bold text-xs">₹</span>
                                    <input
                                        type="number"
                                        aria-label="Cash Part"
                                        value={cashPart || ""}
                                        onChange={(e) => setCashPart(Math.min(grandTotal, Math.max(0, Number(e.target.value))))}
                                        className="w-full pl-6 pr-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#25314D] bg-white dark:bg-[#070A13] text-gray-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Cash amount"
                                    />
                                </div>
                                <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl flex items-center px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                                    UPI: ₹{(grandTotal - cashPart).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Grand Total</p>
                                <p data-testid="checkout-grand-total" className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                    ₹{Math.max(0, grandTotal).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <Button
                                onClick={handleProcessSale}
                                disabled={loading}
                                className={`text-white px-5 h-11 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${paymentMethod === "Cash"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : paymentMethod === "Split"
                                        ? "bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 hover:opacity-95"
                                        : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                            >
                                {loading ? (
                                    <Zap className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        {paymentMethod === "Cash" ? <Banknote className="w-4 h-4" /> : paymentMethod === "Split" ? <RefreshCcw className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                                        <span>
                                            {state.isQuotation ? "Confirm Quotation" : "Generate Bill & Pay"}
                                        </span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <MinimalConfirmDialog
                isOpen={showBackConfirm}
                title="Leave Checkout?"
                message="Your checkout details will not be saved."
                confirmLabel="Leave"
                cancelLabel="Stay"
                onConfirm={() => {
                    setShowBackConfirm(false);
                    navigate(-1);
                }}
                onCancel={() => setShowBackConfirm(false)}
            />
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
