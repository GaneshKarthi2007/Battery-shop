import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
    ArrowLeft, User, FileText, Zap, ShieldCheck, Wrench,
    Car, Home, Truck, RefreshCcw, CheckCircle,
    Banknote, QrCode
} from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { apiClient } from "../api/client";
import { useNotifications } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import { BatteryLoader } from "../components/ui/BatteryLoader";
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
    unit,
    onValueChange,
    onUnitChange,
}: {
    label: string;
    value: string;
    unit: string;
    onValueChange: (v: string) => void;
    onUnitChange: (u: string) => void;
}) {
    return (
        <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-500 ml-1">{label}</label>
            <div className="flex gap-2">
                <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => onValueChange(e.target.value)}
                    className="flex-1 bg-[#F8FAFF] border border-transparent rounded-xl px-4 h-14 text-slate-900 font-bold focus:ring-2 focus:ring-[#2E6DFF]/20 outline-none"
                    placeholder="0"
                />
                <select
                    value={unit}
                    onChange={(e) => onUnitChange(e.target.value)}
                    className="h-14 bg-[#F8FAFF] border border-transparent rounded-xl px-3 text-slate-700 font-semibold focus:ring-2 focus:ring-[#2E6DFF]/20 outline-none min-w-[110px]"
                >
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                </select>
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
    } | undefined;

    /** ── Customer ── */
    const [customerInfo, setCustomerInfo] = useState({
        name: "",
        phone: "+91 ",
        billingAddress: "",
    });
    const [billedBy, setBilledBy] = useState("");

    /** ── Product / Type ── */
    const [productType, setProductType] = useState<"Vehicle" | "Inverter">("Vehicle");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [installAddress, setInstallAddress] = useState("");
    const [sameAsBilling, setSameAsBilling] = useState(false);

    /** ── Charges ── */
    const [installCharges, setInstallCharges] = useState(0);
    const [deliveryCharges, setDeliveryCharges] = useState(0);

    /** ── Exchange ── */
    const [exchangeRecords, setExchangeRecords] = useState<ExchangeRecord[]>([]);
    const [selectedExchange, setSelectedExchange] = useState<ExchangeRecord | null>(null);
    const [loadingExchanges, setLoadingExchanges] = useState(false);

    /** ── Warranty ── */
    const [totalWarrantyVal, setTotalWarrantyVal] = useState("36");
    const [totalWarrantyUnit, setTotalWarrantyUnit] = useState("Months");
    const [freeReplacementVal, setFreeReplacementVal] = useState("18");
    const [freeReplacementUnit, setFreeReplacementUnit] = useState("Months");

    /** ── Payment ── */
    const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI">("Cash");

    /** ── UI state ── */
    const [loading, setLoading] = useState(false);

    const serviceItem = state?.items?.find(item => item.type === "Service");
    const hasService = !!serviceItem;

    /* Auto-fill billedBy from logged-in user */
    useEffect(() => {
        if (user) setBilledBy(user.name);
    }, [user]);

    /* Auto-fill customer from service data */
    useEffect(() => {
        if (serviceItem?.originalData) {
            const svc = serviceItem.originalData;
            setCustomerInfo(prev => ({
                ...prev,
                name: svc.customer_name || "",
                phone: svc.contact_number || "+91 ",
            }));
        }
    }, [hasService, serviceItem]);

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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-gray-500">No items selected for checkout.</p>
                <Button onClick={() => navigate("/sales")}>Go to Sales</Button>
            </div>
        );
    }

    /* ── Calculations ── */
    // GST applies only to product subtotal
    const productSubtotal = state.items
        .filter(i => i.type === "Product")
        .reduce((s, i) => s + i.price * i.quantity, 0);
    const serviceSubtotal = state.items
        .filter(i => i.type === "Service")
        .reduce((s, i) => s + i.price * i.quantity, 0);

    const productGst = productSubtotal * 0.18;
    const exchangeDiscount = selectedExchange ? Number(selectedExchange.valuation_amount) : 0;
    const grandTotal = productSubtotal + productGst + serviceSubtotal + installCharges + deliveryCharges - exchangeDiscount;

    /* ── Warranty expiry calculation (hidden, for invoice) ── */
    const calcExpiry = (val: string, unit: string) => {
        const n = parseInt(val) || 0;
        const d = new Date();
        if (unit === "Years") d.setFullYear(d.getFullYear() + n);
        else d.setMonth(d.getMonth() + n);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };
    const totalWarrantyExpiry = calcExpiry(totalWarrantyVal, totalWarrantyUnit);
    const freeReplacementExpiry = calcExpiry(freeReplacementVal, freeReplacementUnit);

    /* ── Build invoice state helper ── */
    const buildInvoiceState = () => {
        const installationAddress = productType === "Inverter" ? installAddress : "";
        return {
            ...state,
            installCharges,
            deliveryCharges,
            exchangeDiscount,
            selectedExchange,
            customerInfo: { ...customerInfo },
            productType,
            vehicleNumber,
            installAddress: installationAddress,
            warrantyDetails: {
                totalWarranty: `${totalWarrantyVal} ${totalWarrantyUnit}`,
                totalWarrantyExpiry,
                freeReplacement: `${freeReplacementVal} ${freeReplacementUnit}`,
                freeReplacementExpiry,
            },
            billedBy,
            finalTotal: grandTotal,
            productGst,
            productSubtotal,
            serviceSubtotal,
            paymentMethod,
        };
    };

    /* ── Submit Sale ── */
    const handleProcessSale = async () => {
        if (!customerInfo.name.trim()) { alert("Customer name is required."); return; }
        if (!customerInfo.phone.replace("+91 ", "").trim()) { alert("Phone number is required."); return; }

        setLoading(true);

        try {
            const vehicleDetails = productType === "Vehicle"
                ? `Vehicle: ${vehicleNumber}`
                : `Inverter Installation`;

            const installationAddress = productType === "Inverter" ? installAddress : "";

            const saleData = {
                customer_name: customerInfo.name || "Walk-in Customer",
                customer_phone: customerInfo.phone,
                vehicle_details: vehicleDetails,
                installation_address: installationAddress,
                product_category: productType,
                type: "Sale", // Explicitly added the 'type' field
                items: state.items.map(item => ({
                    product_id: item.type === "Product" ? Number(item.id) : null,
                    service_id: item.type === "Service" ? Number(item.id.toString().replace("service-", "")) : null,
                    quantity: item.quantity,
                    price: item.price,
                })),
                total_amount: grandTotal,
                extra_charges: installCharges + deliveryCharges,
                discount_amount: exchangeDiscount,
                exchange_record_id: selectedExchange?.id ?? null,
                payment_method: paymentMethod,
            };

            await apiClient.post('/sales', saleData);

            addNotification({
                type: "SALES",
                title: `New Sale: ₹${grandTotal.toLocaleString()}`,
                message: `${state.items.length} item(s) sold via ${paymentMethod} to ${customerInfo.name || "Walk-in Customer"}.`,
                role: "admin",
            });

            navigate("/invoice", { state: { ...buildInvoiceState() } });
        } catch (err: any) {
            const msg = err.message || "Failed to process sale. Please try again.";
            alert(msg); // standard browser warning popup
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "bg-[#F8FAFF] border border-transparent h-14 text-slate-900 font-medium focus:ring-2 focus:ring-[#2E6DFF]/20 rounded-xl";
    const chargeInput = "bg-transparent border-none w-24 text-right font-black text-slate-900 focus:ring-0 outline-none p-0 text-[16px]";

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-900">
            {loading && <BatteryLoader />}

            {/* ── Fixed Checkout Header ── */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-800" />
                </button>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">Final Checkout</h1>
                <div className="w-9" />
            </header>

            <main className="flex-1 px-4 pt-20 pb-10 space-y-8 max-w-2xl mx-auto w-full">

                {/* ── Section: Customer Details ── */}
                <section className="space-y-4">
                    <SectionHead icon={<User className="w-5 h-5 text-[#2E6DFF]" />} title="Customer Details" />
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
                        <div className="grid grid-cols-1 gap-5">
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
                                <Input
                                    type="tel"
                                    value={customerInfo.phone}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (!val.startsWith("+91 ")) setCustomerInfo({ ...customerInfo, phone: "+91 " + val.replace(/^\+91\s?/, "") });
                                        else setCustomerInfo({ ...customerInfo, phone: val });
                                    }}
                                    className={inputClass}
                                    placeholder="+91 98765 43210"
                                />
                            </Field>
                            <Field label="Billing Address">
                                <textarea
                                    value={customerInfo.billingAddress}
                                    onChange={(e) => {
                                        setCustomerInfo({ ...customerInfo, billingAddress: e.target.value });
                                        if (sameAsBilling) setInstallAddress(e.target.value);
                                    }}
                                    rows={3}
                                    className="w-full bg-[#F8FAFF] border border-transparent rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-[#2E6DFF]/20 outline-none resize-none"
                                    placeholder="Door No, Street, City, Pincode"
                                />
                            </Field>
                        </div>
                    </div>
                </section>

                {/* ── Section: Product Information ── */}
                <section className="space-y-4">
                    <SectionHead icon={<Zap className="w-5 h-5 text-[#2E6DFF]" />} title="Product Information" />
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
                        {/* Toggle: Vehicle vs Inverter */}
                        <div className="bg-[#E4E9F2] p-1.5 rounded-2xl flex gap-1">
                            {([
                                { value: "Vehicle", icon: <Car className="w-4 h-4" />, label: "Vehicle" },
                                { value: "Inverter", icon: <Home className="w-4 h-4" />, label: "Inverter" },
                            ] as const).map(({ value, icon, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setProductType(value)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${productType === value
                                        ? "bg-white text-[#2E6DFF] shadow-md"
                                        : "text-slate-500 hover:bg-white/50"
                                        }`}
                                >
                                    {icon} {label}
                                </button>
                            ))}
                        </div>

                        {/* Conditional fields */}
                        {productType === "Vehicle" ? (
                            <Field label="Vehicle Number">
                                <Input
                                    type="text"
                                    value={vehicleNumber}
                                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                    className={inputClass}
                                    placeholder="e.g. TN 09 AB 1234"
                                />
                            </Field>
                        ) : (
                            <div className="space-y-3">
                                {/* Same-as-billing checkbox */}
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <div
                                        onClick={() => {
                                            const next = !sameAsBilling;
                                            setSameAsBilling(next);
                                            if (next) setInstallAddress(customerInfo.billingAddress);
                                        }}
                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${sameAsBilling ? "bg-[#2E6DFF] border-[#2E6DFF]" : "border-gray-300"}`}
                                    >
                                        {sameAsBilling && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <span className="text-[13px] font-semibold text-slate-600">
                                        Installation address same as billing address
                                    </span>
                                </label>
                                <Field label="Installation Address">
                                    <textarea
                                        value={installAddress}
                                        onChange={(e) => {
                                            setInstallAddress(e.target.value);
                                            if (sameAsBilling) setSameAsBilling(false);
                                        }}
                                        rows={3}
                                        className="w-full bg-[#F8FAFF] border border-transparent rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-[#2E6DFF]/20 outline-none resize-none"
                                        placeholder="Installation address…"
                                    />
                                </Field>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Section: Order Items & Charges ── */}
                <section className="space-y-4">
                    <SectionHead icon={<FileText className="w-5 h-5 text-[#2E6DFF]" />} title="Order Items & Charges" />
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Items list */}
                        <div className="divide-y divide-gray-50">
                            {state.items.map((item) => (
                                <div key={item.id} className="p-5 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === "Product" ? "bg-blue-50 text-[#2E6DFF]" : "bg-emerald-50 text-emerald-600"}`}>
                                            {item.type === "Product" ? <Zap className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="text-[15px] font-bold text-slate-900">{item.name} {item.model}</h3>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                                                {item.quantity} unit(s) · ₹{item.price.toLocaleString()}
                                                {item.type === "Product" && <span className="text-slate-300"> · GST included</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[16px] font-black text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>

                        {/* Charges */}
                        <div className="p-6 bg-[#F8FAFF]/50 space-y-5 border-t border-gray-100">
                            <ChargeRow label="Installation Charges" sublabel="No GST applied">
                                <div className="flex items-center bg-white rounded-xl px-4 py-2.5 border border-blue-100 shadow-sm">
                                    <span className="text-slate-400 font-bold mr-1">₹</span>
                                    <input
                                        type="number" min="0"
                                        value={installCharges || ""}
                                        onChange={(e) => setInstallCharges(Number(e.target.value))}
                                        className={chargeInput} placeholder="0"
                                    />
                                </div>
                            </ChargeRow>

                            <ChargeRow label="Delivery Charges" sublabel="No GST applied">
                                <div className="flex items-center bg-white rounded-xl px-4 py-2.5 border border-blue-100 shadow-sm">
                                    <Truck className="w-4 h-4 text-slate-300 mr-2" />
                                    <input
                                        type="number" min="0"
                                        value={deliveryCharges || ""}
                                        onChange={(e) => setDeliveryCharges(Number(e.target.value))}
                                        className={chargeInput} placeholder="0"
                                    />
                                </div>
                            </ChargeRow>

                            {/* Old Battery Exchange selection */}
                            <div className="space-y-2 pt-1">
                                <div className="flex items-center gap-2">
                                    <RefreshCcw className="w-4 h-4 text-red-400" />
                                    <span className="text-[14px] font-bold text-red-500">Old Battery Exchange</span>
                                </div>
                                {loadingExchanges ? (
                                    <p className="text-xs text-slate-400 py-2">Loading exchange records…</p>
                                ) : exchangeRecords.length === 0 ? (
                                    <div className="bg-white rounded-xl p-4 border border-dashed border-gray-200 text-center">
                                        <p className="text-[12px] text-slate-400 font-medium">No pending exchange records found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Deselect option */}
                                        {selectedExchange && (
                                            <button
                                                onClick={() => setSelectedExchange(null)}
                                                className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
                                            >
                                                Remove exchange selection
                                            </button>
                                        )}
                                        {exchangeRecords.map(rec => (
                                            <div
                                                key={rec.id}
                                                onClick={() => setSelectedExchange(selectedExchange?.id === rec.id ? null : rec)}
                                                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedExchange?.id === rec.id
                                                    ? "border-red-400 bg-red-50"
                                                    : "border-gray-100 bg-white hover:border-gray-200"
                                                    }`}
                                            >
                                                <div>
                                                    <p className="text-[13px] font-bold text-slate-900">{rec.battery_brand} {rec.battery_model}</p>
                                                    <p className="text-[11px] text-slate-500">{rec.customer_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[14px] font-black text-red-500">- ₹{Number(rec.valuation_amount).toLocaleString()}</p>
                                                    {selectedExchange?.id === rec.id && (
                                                        <p className="text-[10px] text-red-400 font-bold">Selected</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* GST note */}
                        <div className="px-6 py-3 bg-amber-50 border-t border-amber-100">
                            <p className="text-[11px] text-amber-700 font-medium">
                                ⚡ GST (18%) applies only to product items. Installation and delivery charges are GST-exempt.
                            </p>
                        </div>

                        {/* Summary breakdown */}
                        <div className="p-6 space-y-2 border-t border-gray-100">
                            {serviceSubtotal > 0 && (
                                <SummaryRow label="Service Charges" value={`₹${serviceSubtotal.toLocaleString()}`} />
                            )}
                            <SummaryRow label={`Product Subtotal`} value={`₹${productSubtotal.toLocaleString()}`} />
                            <SummaryRow label="Product GST (18%)" value={`₹${productGst.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                            {installCharges > 0 && <SummaryRow label="Installation Charges" value={`₹${installCharges.toLocaleString()}`} />}
                            {deliveryCharges > 0 && <SummaryRow label="Delivery Charges" value={`₹${deliveryCharges.toLocaleString()}`} />}
                            {exchangeDiscount > 0 && (
                                <SummaryRow label="Exchange Discount" value={`- ₹${exchangeDiscount.toLocaleString()}`} accent="text-red-500" />
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Section: Warranty Registration ── */}
                <section className="space-y-4">
                    <SectionHead icon={<ShieldCheck className="w-5 h-5 text-[#2E6DFF]" />} title="Warranty Registration" />
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            <WarrantyInput
                                label="Total Warranty"
                                value={totalWarrantyVal}
                                unit={totalWarrantyUnit}
                                onValueChange={setTotalWarrantyVal}
                                onUnitChange={setTotalWarrantyUnit}
                            />
                            <WarrantyInput
                                label="Free Replacement Period"
                                value={freeReplacementVal}
                                unit={freeReplacementUnit}
                                onValueChange={setFreeReplacementVal}
                                onUnitChange={setFreeReplacementUnit}
                            />
                        </div>
                        {(parseInt(totalWarrantyVal) > 0 || parseInt(freeReplacementVal) > 0) && (
                            <div className="bg-blue-50 rounded-xl p-4 space-y-1.5 border border-blue-100">
                                <p className="text-[11px] font-black text-blue-500 uppercase tracking-wider">Calculated Expiry Dates</p>
                                {parseInt(totalWarrantyVal) > 0 && (
                                    <p className="text-[13px] text-slate-700 font-semibold">
                                        Total Warranty expires: <span className="text-[#2E6DFF] font-black">{totalWarrantyExpiry}</span>
                                    </p>
                                )}
                                {parseInt(freeReplacementVal) > 0 && (
                                    <p className="text-[13px] text-slate-700 font-semibold">
                                        Free Replacement upto: <span className="text-[#2E6DFF] font-black">{freeReplacementExpiry}</span>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Payment Method & Action ── */}
                <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 space-y-5">
                    {/* Grand Total */}
                    <div className="flex items-end justify-between">
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                Grand Total
                                <span className="text-[9px] normal-case font-medium ml-1">
                                    (Incl. ₹{productGst.toLocaleString(undefined, { maximumFractionDigits: 0 })} GST)
                                </span>
                            </p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter">
                                ₹{Math.max(0, grandTotal).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">Confirmed</p>
                        </div>
                    </div>

                    {/* Payment Method Dropdown */}
                    <div className="space-y-3">
                        <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block">Transaction Method</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as "Cash" | "UPI")}
                            className="w-full bg-[#F8FAFF] border border-gray-100 rounded-2xl px-5 h-16 text-slate-900 font-bold focus:ring-2 focus:ring-[#2E6DFF]/20 outline-none appearance-none cursor-pointer"
                        >
                            <option value="Cash">Cash Transaction</option>
                            <option value="UPI">UPI / QR Payment</option>
                        </select>
                    </div>

                    {/* Action button */}
                    <Button
                        onClick={handleProcessSale}
                        disabled={loading}
                        className={`w-full text-white h-16 rounded-[20px] text-xl font-black shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${paymentMethod === "Cash"
                            ? "bg-green-500 hover:bg-green-600 shadow-green-400/25"
                            : "bg-[#2E6DFF] hover:bg-[#1E5AFF] shadow-[#2E6DFF]/25"
                            }`}
                    >
                        {loading ? (
                            <Zap className="w-6 h-6 animate-pulse text-yellow-300 fill-current" />
                        ) : (
                            <>
                                {paymentMethod === "Cash" ? <Banknote className="w-6 h-6" /> : <QrCode className="w-6 h-6" />}
                                Complete Transaction & Invoice
                            </>
                        )}
                    </Button>
                </div>

                {/* Bottom spacer for mobile nav */}
                <div className="h-20" />
            </main>
        </div>
    );
}

/** Helpers */
function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2 px-1">
            {icon}
            <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">{title}</h2>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-500 ml-1">{label}</label>
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
        <div className="flex items-center justify-between">
            <div>
                <span className="text-[14px] font-bold text-slate-600">{label}</span>
                {sublabel && <p className="text-[10px] text-slate-400 font-medium">{sublabel}</p>}
            </div>
            {children}
        </div>
    );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-[13px] text-slate-500 font-medium">{label}</span>
            <span className={`text-[14px] font-bold ${accent ?? "text-slate-900"}`}>{value}</span>
        </div>
    );
}
