import { useState, useEffect } from "react";
import { RefreshCcw, Calculator, CheckCircle, Info, Loader2 } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { apiClient } from "../api/client";

interface OldBattery {
  brand: string;
  age: number;
  condition: "Excellent" | "Good" | "Fair" | "Poor";
  weight: number;
}

interface Product {
  id: number;
  brand: string;
  model: string;
  price: number;
  warranty?: string;
  type: string;
}

export function BatteryExchange() {
  const [oldBattery, setOldBattery] = useState<OldBattery>({
    brand: "",
    age: 0,
    condition: "Good",
    weight: 0,
  });
  const [batteries, setBatteries] = useState<Product[]>([]);
  const [selectedNewBattery, setSelectedNewBattery] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<Product[]>('/products');
      setBatteries(data);
    } catch (err: any) {
      console.error(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const calculateExchangeValue = (): number => {
    if (!oldBattery.brand || !oldBattery.weight) return 0;

    let baseValue = oldBattery.weight * 150; // ₹150 per kg base rate

    const conditionMultipliers = {
      Excellent: 1.2,
      Good: 1.0,
      Fair: 0.7,
      Poor: 0.4,
    };
    baseValue *= conditionMultipliers[oldBattery.condition];

    const ageDepreciation = Math.max(0, 1 - oldBattery.age * 0.1);
    baseValue *= ageDepreciation;

    return Math.round(baseValue);
  };

  const exchangeValue = calculateExchangeValue();
  const discountedPrice = selectedNewBattery ? Number(selectedNewBattery.price) - exchangeValue : 0;
  const gst = discountedPrice * 0.18;
  const finalAmount = discountedPrice + gst;

  const handleCompleteExchange = () => {
    if (!selectedNewBattery) {
      alert("Please select a new battery");
      return;
    }
    alert(
      `Exchange completed!\n\nOld Battery Value: ₹${exchangeValue}\nNew Battery: ${selectedNewBattery.brand} ${selectedNewBattery.model}\nFinal Amount: ₹${finalAmount.toLocaleString()}\n\nNote: In a full implementation, this would create a Sale record with a discount.`
    );
    setOldBattery({ brand: "", age: 0, condition: "Good", weight: 0 });
    setSelectedNewBattery(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">Loading Products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Battery Exchange / Resale</h1>
        <p className="text-gray-600 mt-1">Exchange old battery for a new one with instant valuation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 order-1 lg:order-1 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <RefreshCcw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Old Battery Details</h2>
                <p className="text-sm text-gray-600">Enter details for valuation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Battery Brand</label>
                <Input
                  type="text"
                  placeholder="e.g., Exide, Amaron"
                  value={oldBattery.brand}
                  onChange={(e) => setOldBattery({ ...oldBattery, brand: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age (Years)</label>
                <Input
                  type="number"
                  placeholder="e.g., 3"
                  min="0"
                  value={oldBattery.age || ""}
                  onChange={(e) => setOldBattery({ ...oldBattery, age: parseInt(e.target.value) || 0 })}
                />
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
                <Input
                  type="number"
                  placeholder="e.g., 25"
                  min="0"
                  step="0.1"
                  value={oldBattery.weight || ""}
                  onChange={(e) => setOldBattery({ ...oldBattery, weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">Valuation Factors</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Base rate: ₹150 per kg</li>
                    <li>• Condition affects value by 40% to 120%</li>
                    <li>• Age depreciation: 10% per year</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Select New Battery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {batteries.map((battery) => (
                <div
                  key={battery.id}
                  onClick={() => setSelectedNewBattery(battery)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedNewBattery?.id === battery.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{battery.brand}</h3>
                      <p className="text-sm text-gray-600">{battery.model}</p>
                    </div>
                    {selectedNewBattery?.id === battery.id && (
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-600">Warranty:</span>
                    <span className="font-medium text-gray-900">{battery.warranty || "N/A"}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="text-lg font-bold text-gray-900">₹{Number(battery.price).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 order-2 lg:order-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm lg:sticky lg:top-24">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Exchange Summary</h2>
                  <p className="text-sm text-gray-600">Calculated value</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Old Battery Value</p>
                <p className="text-3xl font-bold text-green-700">₹{exchangeValue.toLocaleString()}</p>
              </div>

              {selectedNewBattery && (
                <>
                  <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Selected Battery</p>
                      <p className="font-medium text-gray-900">{selectedNewBattery.brand} {selectedNewBattery.model}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price</span>
                      <span className="font-medium">₹{Number(selectedNewBattery.price).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Exchange Value</span>
                      <span className="font-medium text-green-600">- ₹{exchangeValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₹{discountedPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST (18%)</span>
                      <span className="font-medium">₹{gst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                      <span className="font-bold">Final Amount</span>
                      <span className="font-bold text-xl text-blue-600">₹{finalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCompleteExchange}
                    disabled={exchangeValue === 0}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  >
                    Complete Exchange
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
