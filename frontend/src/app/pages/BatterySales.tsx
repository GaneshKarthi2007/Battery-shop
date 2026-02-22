import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, Minus, Trash2, ShoppingCart, Search, CreditCard, ChevronUp, Wrench, CheckCircle, CheckCheck, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "../components/Button";
import { apiClient } from "../api/client";
import { motion, AnimatePresence } from "framer-motion";

interface Battery {
  id: number;
  brand: string;
  model: string;
  ah: string;
  type: string;
  price: number;
  warranty?: string;
  stock: number;
}

interface ServiceRequest {
  id: number;
  customer_name: string;
  vehicle_details: string;
  status: string;
  service_charge: number;
  battery_brand?: string;
  battery_model?: string;
}

interface BillItem {
  id: number | string;
  name: string;
  model: string;
  price: number;
  quantity: number;
  warranty: string;
  type: "Product" | "Service";
  originalData: Battery | ServiceRequest;
}

export function BatterySales() {
  const navigate = useNavigate();
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [completedServices, setCompletedServices] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [activeTab, setActiveTab] = useState<"Product" | "Service">("Product");
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const billModuleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, servicesData] = await Promise.all([
          apiClient.get<Battery[]>('/products'),
          apiClient.get<ServiceRequest[]>('/services')
        ]);
        setBatteries(productsData);
        setCompletedServices(servicesData.filter(s => s.status === "Completed"));
      } catch (err: any) {
        setError(err.message || "Failed to load billing data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingBar(!entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (billModuleRef.current) {
      observer.observe(billModuleRef.current);
    }

    return () => observer.disconnect();
  }, [billItems.length]);

  const filteredBatteries = batteries.filter((battery) => {
    const matchesSearch =
      battery.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      battery.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || battery.type === filterType;
    return matchesSearch && matchesType;
  });

  const addToBill = (item: Battery | ServiceRequest, type: "Product" | "Service") => {
    const itemId = type === "Product" ? (item as Battery).id : `service-${(item as ServiceRequest).id}`;
    const existingItem = billItems.find((bi) => bi.id === itemId);

    if (existingItem) {
      if (type === "Product" && existingItem.quantity < (item as Battery).stock) {
        setBillItems(
          billItems.map((bi) =>
            bi.id === itemId
              ? { ...bi, quantity: bi.quantity + 1 }
              : bi
          )
        );
      }
    } else {
      const newItem: BillItem = {
        id: itemId,
        name: type === "Product" ? (item as Battery).brand : (item as ServiceRequest).customer_name,
        model: type === "Product" ? (item as Battery).model : `${(item as ServiceRequest).battery_brand || ''} ${(item as ServiceRequest).battery_model || ''}`,
        price: type === "Product" ? Number((item as Battery).price) : Number((item as ServiceRequest).service_charge),
        quantity: 1,
        warranty: type === "Product" ? ((item as Battery).warranty || "N/A") : "N/A",
        type: type,
        originalData: item
      };
      setBillItems([...billItems, newItem]);
    }
  };

  const updateQuantity = (itemId: number | string, change: number) => {
    setBillItems(
      billItems
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) return null;

            if (item.type === "Product") {
              const battery = item.originalData as Battery;
              if (newQuantity > battery.stock) return item;
            }

            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item): item is BillItem => item !== null)
    );
  };

  const removeFromBill = (itemId: number | string) => {
    setBillItems(billItems.filter((item) => item.id !== itemId));
  };

  const subtotal = billItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const handleProceedToCheckout = () => {
    if (billItems.length === 0) return;
    navigate("/checkout", {
      state: {
        items: billItems,
        subtotal,
        gst,
        total
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-sm">Loading Billing Systems...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-black text-gray-900 mb-2">Sync Error</h3>
        <p className="text-red-600/80 font-medium mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600 mt-1">Select batteries and generate invoice</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 order-2 lg:order-1 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === "Product" ? (
              <motion.div
                key="product-grid"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by brand or model..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      {["All", "Car", "Inverter"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${filterType === type ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredBatteries.map((battery) => {
                    const isAdded = billItems.some(item => item.id === battery.id);
                    return (
                      <div key={battery.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900">{battery.brand}</h3>
                            <p className="text-sm text-gray-600">{battery.model}</p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md">
                            {battery.type}
                          </span>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Capacity:</span>
                            <span className="font-medium text-gray-900">{battery.ah} Ah</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Warranty:</span>
                            <span className="font-medium text-gray-900">{battery.warranty || "N/A"}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Stock:</span>
                            <span className={`font-medium ${battery.stock < 10 ? "text-orange-600" : "text-green-600"}`}>
                              {battery.stock} units
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div>
                            <p className="text-xs text-gray-500">Price</p>
                            <p className="text-xl font-bold text-gray-900">₹{Number(battery.price).toLocaleString()}</p>
                          </div>
                          <Button
                            onClick={() => addToBill(battery, "Product")}
                            disabled={battery.stock === 0 || isAdded}
                            size="sm"
                            className={`flex items-center gap-2 transition-all ${isAdded ? "bg-green-600 hover:bg-green-600 cursor-default opacity-80" : ""}`}
                          >
                            {isAdded ? (
                              <><CheckCheck className="w-4 h-4" /> Added</>
                            ) : (
                              <><Plus className="w-4 h-4" /> Add</>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="service-grid"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {completedServices.map((service) => {
                  const isAdded = billItems.some(item => item.id === `service-${service.id}`);
                  return (
                    <div key={service.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-md">
                          Completed
                        </span>
                      </div>
                      <div className="mb-4">
                        <h3 className="font-bold text-gray-900 uppercase tracking-tight">{service.customer_name}</h3>
                        <p className="text-xs text-gray-500">{service.battery_brand} {service.battery_model}</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Service Charge</p>
                          <p className="text-lg font-bold text-gray-900">₹{Number(service.service_charge).toLocaleString()}</p>
                        </div>
                        <Button
                          onClick={() => addToBill(service, "Service")}
                          variant={isAdded ? "primary" : "outline"}
                          size="sm"
                          disabled={isAdded}
                          className={`flex items-center gap-2 transition-all ${isAdded ? "bg-green-600 border-green-600 text-white cursor-default opacity-80" : "border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"}`}
                        >
                          {isAdded ? (
                            <><CheckCheck className="w-4 h-4" /> Added</>
                          ) : (
                            <><Plus className="w-4 h-4" /> Add to Bill</>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {completedServices.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No completed services available for billing</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={billModuleRef} className="lg:col-span-1 order-1 lg:order-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm lg:sticky lg:top-24 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Current Bill</h2>
                  <p className="text-sm text-gray-600">{billItems.length} items</p>
                </div>
              </div>
            </div>

            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setActiveTab("Product")}
                className={`flex-1 py-2.5 font-bold text-[10px] uppercase tracking-wider transition-all border-b-2 ${activeTab === "Product" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"}`}
              >
                Product Billing
              </button>
              <button
                onClick={() => setActiveTab("Service")}
                className={`flex-1 py-2.5 font-bold text-[10px] uppercase tracking-wider transition-all border-b-2 ${activeTab === "Service" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"}`}
              >
                Service Billing
              </button>
            </div>

            <div className="p-5">
              {billItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No items added yet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {billItems.map((item) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider ${item.type === "Product" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                                {item.type}
                              </span>
                              <p className="font-bold text-gray-900 text-xs">{item.name}</p>
                            </div>
                            <p className="text-[10px] text-gray-600">{item.model}</p>
                          </div>
                          <button onClick={() => removeFromBill(item.id)} className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 bg-white border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 bg-white border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="font-medium text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 py-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST (18%)</span>
                      <span className="font-medium text-gray-900">₹{gst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-xl text-blue-600">₹{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button onClick={handleProceedToCheckout} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center justify-center gap-2 mt-4">
                    <CreditCard className="w-5 h-5" /> Proceed to Checkout
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {billItems.length > 0 && showFloatingBar && (
        <div className="lg:hidden fixed bottom-[72px] left-4 right-4 p-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl z-30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <p className="text-lg font-black text-gray-900">{billItems.length} Items</p>
            </div>
            <Button onClick={handleProceedToCheckout} size="sm" className="bg-blue-600 text-white px-6">Checkout</Button>
          </div>
        </div>
      )}

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`lg:hidden fixed bottom-[160px] right-4 w-12 h-12 bg-white border border-gray-200 rounded-full shadow-xl flex items-center justify-center z-30 transition-all duration-300 ${billItems.length > 0 && showFloatingBar ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"}`}
      >
        <ChevronUp className="w-6 h-6 text-blue-600" />
      </button>
    </div>
  );
}
