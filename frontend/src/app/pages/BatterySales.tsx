import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Plus, Minus, Trash2, ShoppingCart, Search, CreditCard, ChevronUp, CheckCheck, AlertTriangle, FileText } from "lucide-react";
import { Button } from "../components/Button";
import { apiClient } from "../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useDeveloper } from "../contexts/DeveloperContext";
import { CircleLoader } from "../components/ui/CircleLoader";

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

interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number | null;
  quantity: number;
  price: string;
  product?: Battery;
}

interface SaleRecord {
  id: number;
  customer_name: string;
  customer_phone: string;
  vehicle_details: string;
  payment_method: string;
  total_amount: string;
  extra_charges: string;
  discount_amount: string;
  created_at: string;
  items: SaleItem[];
}

interface BillItem {
  id: number | string;
  name: string;
  model: string;
  price: number;
  quantity: number;
  warranty: string;
  type: "Product";
  originalData: Battery;
}

export function BatterySales() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { features } = useDeveloper();
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const billModuleRef = useRef<HTMLDivElement>(null);

  // History State
  const [viewMode, setViewMode] = useState<"NewBill" | "History">("NewBill");
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, salesData] = await Promise.all([
          apiClient.get<Battery[]>('/products'),
          apiClient.get<SaleRecord[]>('/sales')
        ]);
        setBatteries(productsData);
        setSalesHistory(salesData);
      } catch (err: any) {
        setError(err.message || "Failed to load billing data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Context for service conversion
    const routerState = location.state as { fromService?: boolean; serviceId?: number; customerInfo?: any };
    if (routerState?.fromService) {
      console.log("Processing conversion for service:", routerState.serviceId);
    }

    // Load persisted bill items
    const savedItems = localStorage.getItem("pending_bill_items");
    if (savedItems) {
      try {
        setBillItems(JSON.parse(savedItems));
      } catch (e) {
        console.error("Failed to parse saved bill items", e);
      }
    }
  }, []);

  // Persist bill items on change
  useEffect(() => {
    if (billItems.length > 0) {
      localStorage.setItem("pending_bill_items", JSON.stringify(billItems));
    } else {
      localStorage.removeItem("pending_bill_items");
    }
  }, [billItems]);

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

  const addToBill = (battery: Battery) => {
    const existingItem = billItems.find((bi) => bi.id === battery.id);

    if (existingItem) {
      if (existingItem.quantity < battery.stock) {
        setBillItems(
          billItems.map((bi) =>
            bi.id === battery.id
              ? { ...bi, quantity: bi.quantity + 1 }
              : bi
          )
        );
      }
    } else {
      const newItem: BillItem = {
        id: battery.id,
        name: battery.brand,
        model: battery.model,
        price: Number(battery.price),
        quantity: 1,
        warranty: battery.warranty || "N/A",
        type: "Product",
        originalData: battery
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

            const battery = item.originalData as Battery;
            if (newQuantity > battery.stock) return item;

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

  const handleProceedToCheckout = (isQuotation: boolean = false) => {
    if (billItems.length === 0) return;
    const routerState = location.state as { fromService?: boolean; serviceId?: number; customerInfo?: any };

    navigate("/checkout", {
      state: {
        items: billItems,
        subtotal,
        gst,
        total,
        fromService: routerState?.fromService,
        serviceId: routerState?.serviceId,
        customerInfo: routerState?.customerInfo,
        isQuotation
      }
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600 mt-1">Select batteries, generate invoice, or view history</p>
        </div>

        <div className="bg-white rounded-lg p-1.5 border border-gray-200 flex">
          <button
            onClick={() => setViewMode("NewBill")}
            className={`flex-1 px-6 py-2 rounded-md font-bold text-sm transition-all ${viewMode === "NewBill"
              ? "bg-blue-600 text-white"
              : "bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
          >
            New Bill
          </button>

          {features.salesHistory && (
            <button
              onClick={() => setViewMode("History")}
              className={`flex-1 px-6 py-2 rounded-md font-bold text-sm transition-all ${viewMode === "History"
                ? "bg-blue-600 text-white"
                : "bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              Sales History
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center bg-white rounded-2xl border border-gray-100">
          <CircleLoader size="lg" />
        </div>
      ) : error ? (
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
      ) : (
        <>
          {viewMode === "History" && features.salesHistory ? (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Sales History Database
                </h2>
                <span className="text-sm font-semibold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">{salesHistory.length} Records found</span>
              </div>
              <div className="divide-y divide-gray-100">
                {salesHistory.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <p>No sales history available yet.</p>
                  </div>
                ) : (
                  salesHistory.map((sale) => (
                    <div key={sale.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col md:flex-row gap-6 justify-between">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider
                                                  ${sale.payment_method === 'Cash' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}
                                              `}>
                              {sale.payment_method}
                            </div>
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                              #{sale.id}
                            </span>
                            <span className="text-sm font-medium text-gray-400">
                              {new Date(sale.created_at).toLocaleString()}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">{sale.customer_name}</h3>
                            <p className="text-sm font-medium text-gray-500">{sale.customer_phone}</p>
                            {sale.vehicle_details && (
                              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{sale.vehicle_details}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-2">Items Included</h4>
                          <div className="space-y-2">
                            {sale.items.filter(item => item.product_id).map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full bg-blue-400`}></span>
                                  <span className="font-semibold text-gray-700">
                                    {`${item.product?.brand} ${item.product?.model}`}
                                  </span>
                                </div>
                                <span className="text-gray-500">x{item.quantity} · ₹{Number(item.price).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="md:w-48 md:text-right flex flex-row md:flex-col justify-between items-center md:items-end border-t border-gray-100 md:border-none pt-4 md:pt-0">
                          <div className="text-left md:text-right">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Paid</p>
                            <p className="text-2xl font-black text-slate-900">₹{Number(sale.total_amount).toLocaleString()}</p>
                          </div>
                          <div className="mt-2 md:mt-4">
                            {/* Possible Action Example (Viewing details or re-printing) */}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`lg:col-span-${isAdmin ? '2' : '3'} order-2 lg:order-1 space-y-4`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key="product-grid"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
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
                          <div key={battery.id} className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-all">
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
                              {isAdmin && (
                                <Button
                                  onClick={() => addToBill(battery)}
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
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {isAdmin && (
                <div ref={billModuleRef} className="lg:col-span-1 order-1 lg:order-2">
                  <div className="bg-white rounded-xl border border-gray-200 lg:sticky lg:top-24 overflow-hidden">
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
                                      <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider bg-blue-100 text-blue-700`}>
                                        Product
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

                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <Button onClick={() => handleProceedToCheckout(false)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center justify-center gap-2">
                              <CreditCard className="w-4 h-4" /> Billing
                            </Button>
                            <button
                              onClick={() => handleProceedToCheckout(true)}
                              className="border-2 border-blue-600 font-bold text-blue-600 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors py-2"
                            >
                              <FileText className="w-4 h-4" /> Quotation
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {isAdmin && viewMode === "NewBill" && billItems.length > 0 && showFloatingBar && (
        <div className="lg:hidden fixed bottom-[72px] left-4 right-4 p-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl z-30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-xl hidden sm:block">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <p className="text-base sm:text-lg font-black text-gray-900 whitespace-nowrap">{billItems.length} Items</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  billModuleRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                size="sm"
                className="bg-blue-600 text-white px-6 text-sm whitespace-nowrap"
              >
                View Bill
              </Button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && viewMode === "NewBill" && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`lg:hidden fixed bottom-[160px] right-4 w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center z-30 transition-all duration-300 ${(billItems.length > 0 && showFloatingBar) ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"}`}
        >
          <ChevronUp className="w-6 h-6 text-blue-600" />
        </button>
      )}
    </div>
  );
}
