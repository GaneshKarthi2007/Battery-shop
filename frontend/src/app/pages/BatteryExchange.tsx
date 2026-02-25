import { useState, useEffect } from "react";
import { RefreshCcw, Calculator, CheckCircle, Info, Zap, Clock, History } from "lucide-react";
import { BatteryLoader } from "../components/ui/BatteryLoader";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { apiClient } from "../api/client";

interface OldBattery {
  brand: string;
  model: string;
  age: number;
  condition: "Excellent" | "Good" | "Fair" | "Poor";
  weight: number;
  address: string;
  phone: string;
}

interface Product {
  id: number;
  brand: string;
  model: string;
  price: number;
  warranty?: string;
  type: string;
}

interface ExchangeRecord {
  id: number;
  customer_name: string;
  customer_phone: string;
  battery_brand: string;
  battery_model: string;
  valuation_amount: number;
  status: "pending" | "consumed";
  created_at: string;
}

export function BatteryExchange() {
  const [customerName, setCustomerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oldBattery, setOldBattery] = useState<OldBattery>({
    brand: "",
    model: "",
    age: 0,
    condition: "Good",
    weight: 0,
    address: "",
    phone: "",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_batteries, _setBatteries] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRecords, setExchangeRecords] = useState<ExchangeRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"evaluate" | "history">("evaluate");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchExchangeRecords();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      await apiClient.get<Product[]>('/products');
    } catch (err: any) {
      console.error(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRecords = async () => {
    try {
      const data = await apiClient.get<ExchangeRecord[]>('/exchanges');
      setExchangeRecords(data);
    } catch {
      // silent
    }
  };

  const calculateExchangeValue = (): number => {
    if (!oldBattery.brand || !oldBattery.weight) return 0;
    let baseValue = oldBattery.weight * 150;
    const conditionMultipliers: Record<string, number> = {
      Excellent: 1.2, Good: 1.0, Fair: 0.7, Poor: 0.4,
    };
    baseValue *= conditionMultipliers[oldBattery.condition];
    const ageDepreciation = Math.max(0, 1 - oldBattery.age * 0.1);
    baseValue *= ageDepreciation;
    return Math.round(baseValue);
  };

  const exchangeValue = calculateExchangeValue();

  const handleSaveExchangeRecord = async () => {
    if (!customerName) { alert("Please enter customer name"); return; }
    if (!oldBattery.brand) { alert("Please enter battery brand"); return; }
    if (!oldBattery.weight) { alert("Please enter battery weight for valuation"); return; }

    try {
      setIsSubmitting(true);
      const record = await apiClient.post<ExchangeRecord>('/exchanges', {
        customer_name: customerName,
        customer_phone: oldBattery.phone,
        customer_address: oldBattery.address,
        battery_brand: oldBattery.brand,
        battery_model: oldBattery.model,
        valuation_amount: exchangeValue,
      });

      setExchangeRecords(prev => [record, ...prev]);
      setSuccessMsg(`Exchange record saved! Valuation: ₹${exchangeValue.toLocaleString()} — This record will appear in checkout for deduction.`);
      setOldBattery({ brand: "", model: "", age: 0, condition: "Good", weight: 0, address: "", phone: "" });
      setCustomerName("");
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch (err: any) {
      alert(err.message || "Failed to save exchange record");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <BatteryLoader />;

  const pendingCount = exchangeRecords.filter(r => r.status === "pending").length;
  const consumedCount = exchangeRecords.filter(r => r.status === "consumed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Battery Exchange</h1>
          <p className="text-gray-600 mt-1">Evaluate old batteries and save exchange records for checkout</p>
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Tab navigation */}
      <div className="bg-gray-100 p-1 rounded-xl flex gap-1 w-full max-w-xs">
        {([
          { key: "evaluate", label: "Evaluate Battery" },
          { key: "history", label: `History (${exchangeRecords.length})` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "evaluate" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {successMsg && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 font-medium">{successMsg}</p>
              </div>
            )}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <RefreshCcw className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Battery Valuation</h2>
                  <p className="text-sm text-gray-600">Enter old battery details to calculate exchange value</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <Input type="text" placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <Input type="tel" placeholder="+91 98765 43210" value={oldBattery.phone} onChange={(e) => setOldBattery({ ...oldBattery, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Old Battery Brand</label>
                  <Input type="text" placeholder="e.g., Exide, Amaron" value={oldBattery.brand} onChange={(e) => setOldBattery({ ...oldBattery, brand: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Battery Model</label>
                  <Input type="text" placeholder="Model (optional)" value={oldBattery.model} onChange={(e) => setOldBattery({ ...oldBattery, model: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age (Years)</label>
                  <Input type="number" placeholder="e.g., 3" min="0" value={oldBattery.age || ""} onChange={(e) => setOldBattery({ ...oldBattery, age: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                  <select
                    value={oldBattery.condition}
                    onChange={(e) => setOldBattery({ ...oldBattery, condition: e.target.value as OldBattery["condition"] })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (Kg)</label>
                  <Input type="number" placeholder="e.g., 25" min="0" step="0.1" value={oldBattery.weight || ""} onChange={(e) => setOldBattery({ ...oldBattery, weight: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Valuation Formula</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Base rate: ₹150 per kg</li>
                      <li>• Condition: Excellent ×1.2 | Good ×1.0 | Fair ×0.7 | Poor ×0.4</li>
                      <li>• Age depreciation: 10% per year</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm lg:sticky lg:top-24">
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Exchange Value</h2>
                    <p className="text-sm text-gray-600">Calculated from details</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Estimated Value</p>
                  <p className="text-4xl font-bold text-green-700">₹{exchangeValue.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">Will be deducted as discount at checkout</p>
                </div>
                <Button
                  onClick={handleSaveExchangeRecord}
                  disabled={exchangeValue === 0 || isSubmitting || !customerName}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  {isSubmitting ? (
                    <><Zap className="w-4 h-4 mr-2 animate-pulse text-yellow-300 fill-current" />Saving…</>
                  ) : "Save Exchange Record"}
                </Button>
                <p className="text-[11px] text-gray-400 text-center mt-3 font-medium">
                  Record will appear in Checkout for battery deduction
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-gray-500" />
              <h2 className="font-bold text-gray-900">Exchange Records</h2>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-full">{pendingCount} pending</span>
              <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 font-bold rounded-full">{consumedCount} used</span>
            </div>
          </div>
          {exchangeRecords.length === 0 ? (
            <div className="py-20 text-center">
              <RefreshCcw className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No exchange records yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {exchangeRecords.map(rec => (
                <div key={rec.id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rec.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>
                      {rec.status === "pending" ? <Clock className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{rec.battery_brand} {rec.battery_model}</p>
                      <p className="text-xs text-gray-500">{rec.customer_name}{rec.customer_phone ? ` · ${rec.customer_phone}` : ""}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(rec.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900">₹{Number(rec.valuation_amount).toLocaleString()}</p>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${rec.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {rec.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
