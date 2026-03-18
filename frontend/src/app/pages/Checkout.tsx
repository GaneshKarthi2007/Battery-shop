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
}: {
    label: string;
    value: string;
    onValueChange: (v: string) => void;
}) {
    return (
        <div className="flex items-center justify-between group">
            <label className="text-[14px] font-black !text-[#FFFFFF] uppercase tracking-widest ml-1">{label}</label>
            <div className="relative w-32">
                <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => onValueChange(e.target.value)}
                    className="w-full bg-slate-900 border-2 border-slate-600 rounded-xl px-4 h-12 !text-[#FFFFFF] font-black text-lg focus:ring-4 focus:ring-blue-500/10 focus:border-[#2E6DFF] outline-none transition-all placeholder:!text-[#CBD5E1] text-right"
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
    const [vehicleModel, setVehicleModel] = useState(""); // UI-only for now or shared with vehicleNumber
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
    const [freeReplacementVal, setFreeReplacementVal] = useState("18");
    const [warrantyUnit, setWarrantyUnit] = useState<"Months" | "Years">("Months");

    /** ── Payment ── */
    const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Split">("Cash");
    const [cashPart, setCashPart] = useState<number>(0);

    /** ── UI state ── */
    const [loading, setLoading] = useState(false);

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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="!text-[#FFFFFF]">No items selected for checkout.</p>
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
    const totalWarrantyExpiry = calcExpiry(totalWarrantyVal, warrantyUnit);
    const freeReplacementExpiry = calcExpiry(freeReplacementVal, warrantyUnit);

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
        };
    };

    /* ── Submit Sale ── */
    const handleProcessSale = async () => {
        if (!customerInfo.name.trim()) { alert("Customer name is required."); return; }
        if (!customerInfo.phone.replace("+91 ", "").trim()) { alert("Phone number is required."); return; }

        setLoading(true);

        try {
            const vehicleDetails = productType === "Vehicle"
                ? `Vehicle: ${vehicleNumber} ${vehicleModel ? `(${vehicleModel})` : ""}`
                : `Inverter Installation`;

            const installationAddress = productType === "Inverter" ? installAddress : "";

            const saleData = {
                customer_name: customerInfo.name || "Walk-in Customer",
                customer_phone: customerInfo.phone,
                vehicle_details: vehicleDetails,
                installation_address: installationAddress,
                product_category: state?.fromService ? "Converted to New Order" : productType,
                type: "Sale",
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
                payment_method: paymentMethod,
                cash_amount: paymentMethod === "Split" ? cashPart : (paymentMethod === "Cash" ? grandTotal : 0),
                upi_amount: paymentMethod === "Split" ? (grandTotal - cashPart) : (paymentMethod === "UPI" ? grandTotal : 0),
            };

            await apiClient.post('/sales', saleData);
            localStorage.removeItem("pending_bill_items");

            addNotification({
                type: "SALES",
                title: `New Sale: ₹${grandTotal.toLocaleString()}`,
                message: `${state.items.length} item(s) sold via ${paymentMethod} to ${customerInfo.name || "Walk-in Customer"}.`,
                role: "admin",
            });

            navigate("/invoice", { state: { ...buildInvoiceState() } });
        } catch (err: any) {
            const msg = err.message || "Failed to process sale. Please try again.";
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
                // Months to Years
                const result = num / 12;
                return Number.isInteger(result) ? result.toString() : result.toFixed(1);
            } else {
                // Years to Months
                return Math.round(num * 12).toString();
            }
        };

        setTotalWarrantyVal(convert(totalWarrantyVal));
        setFreeReplacementVal(convert(freeReplacementVal));
        setWarrantyUnit(newUnit);
    };

    const inputClass = "bg-slate-900 border border-slate-600 h-14 !text-[#FFFFFF] font-medium focus:ring-2 focus:ring-[#2E6DFF]/20 rounded-xl transition-all placeholder:!text-[#CBD5E1]";
    const chargeInput = "bg-transparent border-none w-24 text-right font-black !text-[#FFFFFF] focus:ring-0 outline-none p-0 text-[16px] placeholder:!text-[#CBD5E1]";

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans !text-[#FFFFFF] transition-colors duration-500">
            {loading && <BatteryLoader />}

            {/* ── Fixed Checkout Header ── */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 !text-[#FFFFFF]" />
                </button>
                <h1 className="text-lg font-black !text-[#FFFFFF] tracking-tight uppercase">Final Checkout</h1>
                <div className="w-9" />
            </header>

            <main className="flex-1 px-4 pt-24 pb-12 space-y-10 max-w-2xl mx-auto w-full">

                {/* ── Section: Customer Details ── */}
                <section className="space-y-4">
                    <SectionHead icon={<User className="w-5 h-5 text-[#2E6DFF]" />} title="Customer Details" />
                    <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 space-y-6">
                        <div className="grid grid-cols-1 gap-6">
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
                                <div className="flex items-center gap-2">
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
                                        <ContactActions phoneNumber={customerInfo.phone} iconSize={18} className="p-1" />
                                    )}
                                </div>
                            </Field>
                            <Field label="Billing Address">
                                <textarea
                                    value={customerInfo.billingAddress}
                                    onChange={(e) => {
                                        setCustomerInfo({ ...customerInfo, billingAddress: e.target.value });
                                        if (sameAsBilling) setInstallAddress(e.target.value);
                                    }}
                                    rows={3}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-4 !text-[#FFFFFF] font-medium focus:ring-2 focus:ring-[#2E6DFF]/20 outline-none resize-none transition-all placeholder:!text-[#CBD5E1]"
                                    placeholder="Door No, Street, City, Pincode"
                                />
                            </Field>
                        </div>
                    </div>
                </section>

                {/* ── Section: Installation Info ── */}
                <section className="space-y-4">
                    <SectionHead icon={<Zap className="w-5 h-5 text-[#2E6DFF]" />} title="Installation Info" />
                    <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 space-y-6">
                        <div className="flex p-1.5 bg-slate-800 rounded-2xl">
                            <button
                                onClick={() => setProductType("Vehicle")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${productType === "Vehicle" ? "bg-slate-700 !text-[#FFFFFF]" : "!text-[#FFFFFF] hover:!text-[#FFFFFF]"}`}
                            >
                                <Zap className="w-4 h-4" /> BATTERY / VEHICLE
                            </button>
                            <button
                                onClick={() => setProductType("Inverter")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${productType === "Inverter" ? "bg-slate-700 !text-[#FFFFFF]" : "!text-[#FFFFFF] hover:!text-[#FFFFFF]"}`}
                            >
                                <Zap className="w-4 h-4" /> UPS / INVERTER
                            </button>
                        </div>

                        <div className="space-y-6 pt-2">
                            <Field label={productType === "Vehicle" ? "Vehicle Model" : "Inverter Model"}>
                                <Input
                                    type="text" value={vehicleModel}
                                    onChange={(e) => setVehicleModel(e.target.value)}
                                    className={inputClass} placeholder={productType === "Vehicle" ? "e.g. Swift VDi" : "e.g. Luminous 1.5kVA"}
                                />
                            </Field>
                            <Field label={productType === "Vehicle" ? "Vehicle Number" : "Installation ID / Note"}>
                                <Input
                                    type="text" value={vehicleNumber}
                                    onChange={(e) => setVehicleNumber(e.target.value)}
                                    className={inputClass} placeholder={productType === "Vehicle" ? "e.g. TN 38 BU 1234" : "e.g. Floor 2 / Unit A"}
                                />
                            </Field>
                            <div className="pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox" checked={sameAsBilling}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setSameAsBilling(checked);
                                                if (checked) setInstallAddress(customerInfo.billingAddress);
                                            }}
                                            className="sr-only"
                                        />
                                        <div className={`w-12 h-6 rounded-full transition-colors ${sameAsBilling ? "bg-[#2E6DFF]" : "bg-slate-700"}`}></div>
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${sameAsBilling ? "translate-x-6" : ""}`}></div>
                                    </div>
                                    <span className="text-[14px] font-bold !text-[#FFFFFF] transition-colors">Same as Billing Address</span>
                                </label>
                            </div>

                            {!sameAsBilling && (
                                <div className="space-y-4 mt-4 animate-in slide-in-from-top-2 duration-300">
                                    <Field label="Installation Address">
                                        <textarea
                                            value={installAddress}
                                            onChange={(e) => setInstallAddress(e.target.value)}
                                            rows={2}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-4 !text-[#FFFFFF] font-medium focus:ring-2 focus:ring-[#2E6DFF]/20 outline-none resize-none transition-all placeholder:!text-[#CBD5E1]"
                                            placeholder="Specific installation location..."
                                        />
                                    </Field>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Section: Order Items & Charges ── */}
                <section className="space-y-4">
                    <SectionHead icon={<FileText className="w-5 h-5 text-[#2E6DFF]" />} title="Order Items & Charges" />
                    <div className="bg-slate-900 rounded-[32px] border border-slate-800 overflow-hidden">
                        {/* Items list */}
                        <div className="divide-y divide-slate-800">
                            {state.items.map((item) => (
                                <div key={item.id} className="p-5 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${item.type === "Product" ? "bg-blue-900/30 text-blue-400" : "bg-emerald-900/30 text-emerald-400"}`}>
                                            {item.type === "Product" ? <Zap className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="text-[15px] font-black !text-[#FFFFFF] tracking-tight">{item.name} {item.model}</h3>
                                            <p className="text-[11px] !text-[#FFFFFF] font-black uppercase tracking-widest">
                                                {item.quantity} unit(s) · ₹{item.price.toLocaleString()}
                                                {item.type === "Product" && <span className="!text-[#FFFFFF]"> · GST included</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-black !text-[#FFFFFF] tracking-tighter">₹{(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>

                        {/* Charges */}
                        <div className="p-8 bg-slate-800/30 space-y-6 border-t border-slate-800">
                            <ChargeRow label="Installation Charges" sublabel="No GST applied">
                                <div className="flex items-center bg-slate-900 rounded-2xl px-4 py-3 border border-slate-700 transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
                                    <span className="!text-[#FFFFFF] font-bold mr-1">₹</span>
                                    <input
                                        type="number" min="0"
                                        value={installCharges || ""}
                                        onChange={(e) => setInstallCharges(Number(e.target.value))}
                                        className={chargeInput} placeholder="0"
                                    />
                                </div>
                            </ChargeRow>

                            <ChargeRow label="Delivery Charges" sublabel="No GST applied">
                                <div className="flex items-center bg-slate-900 rounded-2xl px-4 py-3 border border-slate-700 transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
                                    <Truck className="w-4 h-4 !text-[#FFFFFF] mr-2" />
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
                                    <span className="text-[14px] font-black text-rose-500 uppercase tracking-widest">Old Battery Exchange</span>
                                </div>
                                {loadingExchanges ? (
                                    <p className="text-xs !text-[#FFFFFF] py-2">Loading exchange records…</p>
                                ) : exchangeRecords.length === 0 ? (
                    <div className="bg-slate-900 rounded-2xl p-6 border border-dashed border-slate-700 text-center transition-all">
                        <p className="text-[12px] !text-[#FFFFFF] font-bold uppercase tracking-widest">No pending exchange records found</p>
                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Deselect option */}
                                        {selectedExchange && (
                                            <button
                                                onClick={() => setSelectedExchange(null)}
                                                className="text-xs !text-[#FFFFFF] hover:!text-[#FFFFFF] underline transition-colors"
                                            >
                                                Remove exchange selection
                                            </button>
                                        )}
                                        {exchangeRecords.map(rec => (
                                            <div
                                                key={rec.id}
                                                onClick={() => setSelectedExchange(selectedExchange?.id === rec.id ? null : rec)}
                                                className={`flex items-center justify-between p-5 rounded-[22px] border-2 cursor-pointer transition-all duration-300 group ${selectedExchange?.id === rec.id
                                                    ? "border-rose-400 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-500"
                                                    : "border-slate-800 bg-slate-900 hover:border-rose-900"
                                                    }`}
                                            >
                                                <div>
                                                    <p className="text-[14px] font-black !text-[#FFFFFF] transition-colors group-hover:text-rose-600">{rec.battery_brand} {rec.battery_model}</p>
                                                    <p className="text-[11px] !text-[#FFFFFF] font-medium tracking-tight mt-0.5">{rec.customer_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-rose-500 tracking-tighter">- ₹{Number(rec.valuation_amount).toLocaleString()}</p>
                                                    {selectedExchange?.id === rec.id && (
                                                        <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mt-0.5">Selected</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Summary breakdown */}
                        <div className="p-8 space-y-3 bg-slate-900/50 border-t border-slate-800">
                            {serviceSubtotal > 0 && (
                                <SummaryRow label="Service Charges" value={`₹${serviceSubtotal.toLocaleString()}`} />
                            )}
                            <SummaryRow label={`Product Subtotal`} value={`₹${productSubtotal.toLocaleString()}`} />
                            <SummaryRow label="Product GST (18%)" value={`₹${productGst.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                            {installCharges > 0 && <SummaryRow label="Installation Charges" value={`₹${installCharges.toLocaleString()}`} />}
                            {deliveryCharges > 0 && <SummaryRow label="Delivery Charges" value={`₹${deliveryCharges.toLocaleString()}`} />}
                            {exchangeDiscount > 0 && (
                                <SummaryRow label="Exchange Discount" value={`- ₹${exchangeDiscount.toLocaleString()}`} accent="text-rose-500" />
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Section: Warranty Registration ── */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <SectionHead icon={<ShieldCheck className="w-5 h-5 text-[#2E6DFF]" />} title="Warranty Registration" />
                        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                            <button
                                onClick={() => handleUnitChange("Months")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${warrantyUnit === "Months" ? "bg-blue-600 !text-[#FFFFFF]" : "text-white/40 hover:text-white/70"}`}
                            >
                                MONTHS
                            </button>
                            <button
                                onClick={() => handleUnitChange("Years")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${warrantyUnit === "Years" ? "bg-blue-600 !text-[#FFFFFF]" : "text-white/40 hover:text-white/70"}`}
                            >
                                YEARS
                            </button>
                        </div>
                    </div>
                    <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 space-y-8">
                        <div className="space-y-6">
                            <WarrantyInput
                                label="Total Warranty"
                                value={totalWarrantyVal}
                                onValueChange={setTotalWarrantyVal}
                            />
                            <div className="h-px bg-slate-800/50 w-full" />
                            <WarrantyInput
                                label="Free Replacement"
                                value={freeReplacementVal}
                                onValueChange={setFreeReplacementVal}
                            />
                        </div>
                        {(parseInt(totalWarrantyVal) > 0 || parseInt(freeReplacementVal) > 0) && (
                            <div className="bg-[#2E6DFF]/5 rounded-2xl p-6 space-y-2 border border-blue-900/30">
                                <p className="text-[11px] font-black !text-[#FFFFFF] uppercase tracking-[0.2em]">Calculated Expiry Dates</p>
                                {parseInt(totalWarrantyVal) > 0 && (
                                    <p className="text-[14px] !text-[#FFFFFF] font-bold">
                                        Total Warranty: <span className="text-blue-400 font-black">{totalWarrantyExpiry}</span>
                                    </p>
                                )}
                                {parseInt(freeReplacementVal) > 0 && (
                                    <p className="text-[14px] !text-[#FFFFFF] font-bold">
                                        Free Replacement: <span className="text-blue-400 font-black">{freeReplacementExpiry}</span>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Payment Method & Action ── */}
                <div className="bg-slate-900 rounded-[40px] border border-slate-800 p-8 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
                    
                    {/* Grand Total */}
                    <div className="flex items-end justify-between relative z-10">
                        <div className="space-y-1">
                            <p className="text-[11px] font-black !text-[#FFFFFF] uppercase tracking-[0.2em] mb-1">
                                Grand Total Payable
                                <span className="text-[9px] normal-case font-bold ml-1 !text-[#FFFFFF]">
                                    (Incl. ₹{productGst.toLocaleString(undefined, { maximumFractionDigits: 0 })} GST)
                                </span>
                            </p>
                            <p className="text-5xl font-black !text-[#FFFFFF] tracking-tighter transition-all">
                                ₹{Math.max(0, grandTotal).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-emerald-500/10 dark:bg-emerald-500/20 px-5 py-2 rounded-full border border-emerald-500/20">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Confirmed</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Dropdown */}
                    <div className="space-y-4 relative z-10">
                        <label className="text-[12px] font-black !text-[#FFFFFF] uppercase tracking-[0.15em] block ml-1">Transaction Method</label>
                        <div className="relative group">
                            <select
                                value={paymentMethod}
                                onChange={(e) => {
                                    const val = e.target.value as "Cash" | "UPI" | "Split";
                                    setPaymentMethod(val);
                                    if (val === "Split") setCashPart(0);
                                }}
                                className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-6 h-16 !text-[#FFFFFF] font-black text-lg focus:ring-4 focus:ring-blue-500/10 focus:border-[#2E6DFF] outline-none appearance-none cursor-pointer transition-all pr-12 group-hover:bg-slate-800"
                            >
                                <option value="Cash">Cash Transaction</option>
                                <option value="UPI">UPI / QR Payment</option>
                                <option value="Split">Split Payment (Mix Mode)</option>
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none !text-[#FFFFFF]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    {/* Split Payment Inputs */}
                    {paymentMethod === "Split" && (
                        <div className="grid grid-cols-2 gap-5 animate-in fade-in zoom-in-95 duration-500 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black !text-[#FFFFFF] uppercase tracking-widest ml-1">Cash Part</label>
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 !text-[#FFFFFF] font-bold text-lg">₹</span>
                                    <input
                                        type="number"
                                        value={cashPart || ""}
                                        onChange={(e) => {
                                            const val = Math.min(grandTotal, Math.max(0, Number(e.target.value)));
                                            setCashPart(val);
                                        }}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-900 !text-[#FFFFFF] placeholder:!text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black !text-[#FFFFFF] uppercase tracking-widest ml-1">UPI Part</label>
                                <div className="relative group">
                                    <div className="w-full bg-blue-900/20 border-2 border-blue-800/50 rounded-2xl flex items-center px-6 h-16 transition-all group-hover:bg-blue-900/30">
                                        <span className="!text-[#FFFFFF] font-bold mr-2 text-lg">₹</span>
                                        <span className="text-blue-400 font-black text-2xl tracking-tighter">
                                            {(grandTotal - cashPart).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                    <div className="absolute -top-1 -right-1 bg-[#2E6DFF] !text-[#FFFFFF] text-[9px] font-black px-2 py-0.5 rounded-full border border-white dark:border-slate-900">
                                        AUTO
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action button */}
                    <Button
                        onClick={handleProcessSale}
                        disabled={loading}
                        className={`w-full !text-[#FFFFFF] h-20 rounded-[28px] text-xl font-black transition-all active:scale-[0.97] flex items-center justify-center gap-4 relative z-10 ${paymentMethod === "Cash"
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : paymentMethod === "Split"
                                ? "bg-gradient-to-r from-emerald-500 via-[#2E6DFF] to-blue-600 hover:opacity-95"
                                : "bg-[#2E6DFF] hover:bg-blue-600"
                            }`}
                    >
                        {loading ? (
                            <Zap className="w-8 h-8 animate-pulse text-yellow-300 fill-current" />
                        ) : (
                            <>
                                <div className="p-2 bg-white/20 rounded-xl">
                                    {paymentMethod === "Cash" ? <Banknote className="w-6 h-6" /> : paymentMethod === "Split" ? <RefreshCcw className="w-6 h-6" /> : <QrCode className="w-6 h-6" />}
                                </div>
                                <span className="uppercase tracking-widest">Generate Bill & Pay</span>
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
        <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                {icon}
            </div>
            <h2 className="text-[13px] font-black !text-[#FFFFFF] uppercase tracking-[0.2em]">{title}</h2>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2.5">
            <label className="text-[12px] font-black !text-[#FFFFFF] uppercase tracking-widest ml-1">{label}</label>
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
                <span className="text-[15px] font-black !text-[#FFFFFF] transition-colors group-hover:text-blue-500">{label}</span>
                {sublabel && <p className="text-[10px] !text-[#FFFFFF] font-bold uppercase tracking-widest mt-0.5">{sublabel}</p>}
            </div>
            {children}
        </div>
    );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
    return (
        <div className="flex justify-between items-center py-0.5">
            <span className="text-[14px] !text-[#FFFFFF] font-bold tracking-tight">{label}</span>
            <span className={`text-[15px] font-black ${accent ?? "!text-[#FFFFFF]"} tracking-tight`}>{value}</span>
        </div>
    );
}
