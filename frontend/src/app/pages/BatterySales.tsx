import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Plus, Minus, Trash2, ShoppingCart, Search, CreditCard, CheckCheck, AlertTriangle, FileText, History, ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "../components/Button";
import { apiClient } from "../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { CircleLoader } from "../components/ui/CircleLoader";
import { getBrandProductImage, FALLBACK_BATTERY_IMAGE } from "../utils/productImages";

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
  const location = useLocation();
  const routerState = location.state as {
    fromService?: boolean;
    serviceId?: number;
    isNewConnection?: boolean;
    customerInfo?: { name?: string; phone?: string; address?: string };
    serviceSpecs?: {
      complaint_type?: string;
      complaint_details?: string;
      vehicle_details?: string;
      battery_brand?: string;
      battery_model?: string;
      battery_capacity?: string;
    };
  } | null;
  const isStaff = user?.role === "staff";
  const isAdmin = user?.role === "admin";
  const canBill = isAdmin || user?.role === "manager" || (isStaff && Boolean(routerState?.fromService));
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(() => {
    const specs = (location.state as any)?.serviceSpecs;
    return specs?.battery_brand || specs?.battery_model || "";
  });
  const [filterType, setFilterType] = useState<string>(() => {
    const specs = (location.state as any)?.serviceSpecs;
    const hint = `${specs?.complaint_details || ""} ${specs?.vehicle_details || ""}`.toLowerCase();
    if (hint.includes("inverter") || hint.includes("ups")) return "Inverter";
    if (hint.includes("car") || hint.includes("bike") || hint.includes("vehicle")) return "Car";
    return "All";
  });
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isFirstMount = useRef(true);

  const [billingMode, setBillingMode] = useState<"Billing" | "Quotation">("Billing");

  // Staff may only access Billing when coming from a New Connection / service task
  useEffect(() => {
    if (isStaff && !routerState?.fromService) {
      navigate("/assigned-jobs", { replace: true });
    }
  }, [isStaff, routerState?.fromService, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productsData = await apiClient.get<Battery[]>('/products');
        setBatteries(productsData);
      } catch (err: any) {
        setError(err.message || "Failed to load billing data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (routerState?.fromService) {
      localStorage.removeItem("pending_bill_items");
      return;
    }

    // Load persisted bill items for walk-in billing
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

  // Refresh products & clear cart when billingMode changes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const refreshProducts = async () => {
      try {
        const productsData = await apiClient.get<Battery[]>('/products');
        setBatteries(productsData);
      } catch (err) {
        console.error("Failed to refresh products", err);
      }
    };

    refreshProducts();
    setBillItems([]);
  }, [billingMode]);

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
      setBillItems(
        billItems.map((bi) =>
          bi.id === battery.id
            ? { ...bi, quantity: bi.quantity + 1 }
            : bi
        )
      );
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
    setIsCartOpen(false);

    navigate("/checkout", {
      state: {
        items: billItems,
        subtotal,
        gst,
        total,
        fromService: routerState?.fromService,
        serviceId: routerState?.serviceId,
        isNewConnection: routerState?.isNewConnection,
        customerInfo: routerState?.customerInfo,
        serviceSpecs: routerState?.serviceSpecs,
        isQuotation
      }
    });
  };

  const renderBillPanelContent = () => {
    if (billItems.length === 0) {
      return (
        <div className="text-center py-10">
          <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-2.5" />
          <p className="text-sm font-medium text-gray-500">No items added yet</p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-2.5 mb-4 max-h-64 overflow-y-auto pr-1">
          {billItems.map((item) => (
            <div key={item.id} className="p-3 bg-gray-50 dark:bg-[#0D1B2A] rounded-lg border border-gray-200 dark:border-[#2E3B55]">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                      Product
                    </span>
                    <p className="font-bold text-gray-900 dark:text-white text-xs truncate">{item.name}</p>
                  </div>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{item.model}</p>
                </div>
                <button onClick={() => removeFromBill(item.id)} aria-label={`Remove ${item.name}`} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, -1)} aria-label={`Decrease quantity for ${item.name}`} className="w-7 h-7 bg-white dark:bg-[#1B263B] border border-gray-300 dark:border-[#2E3B55] rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors dark:text-white">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-medium dark:text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase quantity for ${item.name}`} className="w-7 h-7 bg-white dark:bg-[#1B263B] border border-gray-300 dark:border-[#2E3B55] rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors dark:text-white">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="font-bold text-gray-900 dark:text-white">₹{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 py-3 border-t border-gray-200 dark:border-[#2E3B55]">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="font-medium text-gray-900 dark:text-white">₹{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">GST (18%)</span>
            <span className="font-medium text-gray-900 dark:text-white">₹{gst.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-[#2E3B55]">
            <span className="font-bold text-gray-900 dark:text-white">Total</span>
            <span className="font-bold text-xl text-blue-600">₹{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-3">
          {billingMode === "Billing" ? (
            <Button
              onClick={() => handleProceedToCheckout(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center justify-center gap-2 py-3"
            >
              <CreditCard className="w-4 h-4" /> Proceed to Billing
            </Button>
          ) : (
            <Button
              onClick={() => handleProceedToCheckout(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center justify-center gap-2 py-3"
            >
              <FileText className="w-4 h-4" /> Proceed to Quotation
            </Button>
          )}
        </div>
      </>
    );
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Top Floating Cart Bar (replaces Current Bill card on mobile) */}
      {canBill && (
        <div
          data-testid="mobile-top-cart-bar"
          className="lg:hidden sticky top-14 z-20 -mx-1 px-3.5 py-2.5 bg-white/95 dark:bg-[#0D1B2A]/95 backdrop-blur-md border border-blue-100 dark:border-[#25314D] rounded-2xl shadow-md flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4" />
              {billItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#0D1B2A]">
                  {billItems.length}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                {billItems.length === 0 ? "Cart Empty" : `${billItems.length} Item${billItems.length > 1 ? "s" : ""} in Cart`}
              </p>
              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                ₹{total.toLocaleString()} <span className="text-[9px] text-gray-400 font-medium">(incl. GST)</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label="Open Cart"
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Cart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {routerState?.fromService && routerState?.serviceId && (
            <button
              type="button"
              onClick={() => navigate(`/service/${routerState.serviceId}`)}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-[#2E3B55] bg-white hover:bg-gray-50 dark:bg-[#1B263B] text-gray-700 dark:text-gray-200 transition-all shadow-xs"
              title="Back to Service"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {routerState?.isNewConnection ? "New Connection — Product Billing" : "Billing"}
            </h1>
            <p className="text-gray-600 mt-1">
              {routerState?.fromService && routerState?.customerInfo?.name
                ? `Billing product for ${routerState.customerInfo.name}`
                : "Select batteries, generate invoice, or view history"}
            </p>
          </div>
        </div>

        {!isStaff && (
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => navigate("/reports")}
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2E3B55] bg-white hover:bg-gray-50 dark:bg-[#1B263B] dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 transition-all shadow-sm flex items-center gap-2 font-bold text-sm"
              title="View All History & Reports"
            >
              <History className="w-4 h-4 text-blue-600" />
              <span>History</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-start">
        <div className="bg-white dark:bg-[#1B263B] rounded-xl p-1 border border-gray-200 dark:border-[#2E3B55] flex">
          <button
            onClick={() => setBillingMode("Billing")}
            className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${billingMode === "Billing"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Billing Mode
          </button>
          <button
            onClick={() => setBillingMode("Quotation")}
            className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${billingMode === "Quotation"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Quotation Mode
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center bg-white dark:bg-[#1B263B] rounded-2xl border border-gray-100 dark:border-[#2E3B55]">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`lg:col-span-${canBill ? '2' : '3'} order-2 lg:order-1 space-y-4`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key="product-grid"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="bg-white dark:bg-[#1B263B] rounded-xl p-4 border border-gray-200 dark:border-[#2E3B55]">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search by brand or model..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2 border border-gray-300 dark:border-[#2E3B55] dark:bg-[#0D1B2A] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          {["All", "Car", "Inverter"].map((type) => (
                            <button
                              key={type}
                              onClick={() => setFilterType(type)}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${filterType === type ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div data-testid="product-grid" className="grid grid-cols-3 gap-2 sm:gap-3.5">
                      {filteredBatteries.map((battery) => {
                        const isAdded = billItems.some(item => item.id === battery.id);
                        const productImg = getBrandProductImage(battery.brand, battery.type);
                        return (
                          <div
                            key={battery.id}
                            className="bg-white dark:bg-[#1B263B] rounded-xl border border-gray-200 dark:border-[#2E3B55] hover:border-blue-400 hover:shadow-md transition-all flex flex-col overflow-hidden group"
                          >
                            {/* E-commerce Brand Product Image Stage */}
                            <div className="relative aspect-square bg-white p-1.5 sm:p-3 flex items-center justify-center border-b border-gray-100 dark:border-[#25314D] overflow-hidden">
                              <img
                                src={productImg}
                                alt={`${battery.brand} ${battery.model}`}
                                loading="lazy"
                                onError={(e) => {
                                  if (e.currentTarget.src !== FALLBACK_BATTERY_IMAGE) {
                                    e.currentTarget.src = FALLBACK_BATTERY_IMAGE;
                                  }
                                }}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-1 left-1 sm:top-2 sm:left-2 px-1.5 py-0.5 bg-blue-50/95 text-blue-700 text-[8px] sm:text-[10px] font-bold rounded border border-blue-100">
                                {battery.type}
                              </span>
                              <span
                                className={`hidden sm:inline-flex absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                  battery.stock <= 0
                                    ? "bg-red-50 text-red-600"
                                    : battery.stock < 10
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-emerald-50 text-emerald-600"
                                }`}
                              >
                                {battery.stock} left
                              </span>
                            </div>

                            {/* Product Info */}
                            <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between gap-1.5">
                              <div className="min-w-0 space-y-0.5">
                                <p className="text-[9px] sm:text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider truncate">
                                  {battery.brand}
                                </p>
                                <h3 className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                                  {battery.model}
                                </h3>
                                <p className="text-[9px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                  {battery.ah} Ah · {battery.warranty || "N/A"}
                                </p>
                              </div>

                              <div className="pt-1.5 border-t border-gray-100 dark:border-[#25314D] space-y-1.5">
                                <div className="flex items-baseline justify-between gap-1">
                                  <p className="text-xs sm:text-base font-black text-gray-900 dark:text-white truncate">
                                    ₹{Number(battery.price).toLocaleString()}
                                  </p>
                                  <span
                                    className={`sm:hidden text-[8px] font-bold ${
                                      battery.stock <= 0 ? "text-red-600" : battery.stock < 10 ? "text-orange-600" : "text-green-600"
                                    }`}
                                  >
                                    {battery.stock}u
                                  </span>
                                </div>
                                {canBill && (
                                  <Button
                                    onClick={() => addToBill(battery)}
                                    disabled={isAdded}
                                    size="sm"
                                    className={`w-full py-1 sm:py-1.5 text-[10px] sm:text-xs flex items-center justify-center gap-1 transition-all ${isAdded ? "bg-green-600 hover:bg-green-600 cursor-default opacity-85" : ""}`}
                                  >
                                    {isAdded ? (
                                      <><CheckCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Added</>
                                    ) : (
                                      <><Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Add</>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Desktop Current Bill Sidebar (hidden on mobile; mobile uses top floating bar + Cart drawer) */}
              {canBill && (
                <div className="hidden lg:block lg:col-span-1 order-1 lg:order-2">
                  <div className="bg-white dark:bg-[#1B263B] rounded-xl border border-gray-200 dark:border-[#2E3B55] lg:sticky lg:top-24 overflow-hidden">
                    <div className="p-5 border-b border-gray-200 dark:border-[#2E3B55] bg-gradient-to-r from-blue-50 to-blue-100 dark:from-[#1B263B] dark:to-[#0D1B2A]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="font-bold text-gray-900 dark:text-white">Current Bill</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{billItems.length} items</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      {renderBillPanelContent()}
                    </div>
                  </div>
                </div>
              )}
            </div>
        </>
      )}

      {/* Mobile Cart Drawer / Sheet */}
      <AnimatePresence>
        {canBill && isCartOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              data-testid="mobile-cart-drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-[#1B263B] rounded-t-3xl sm:rounded-3xl border border-gray-200 dark:border-[#2E3B55] shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-200 dark:border-[#2E3B55] bg-gradient-to-r from-blue-50 to-blue-100 dark:from-[#1B263B] dark:to-[#0D1B2A] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white text-sm">Your Cart</h2>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{billItems.length} item(s)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  aria-label="Close Cart"
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-white/60 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 max-h-[75vh] overflow-y-auto">
                {renderBillPanelContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
