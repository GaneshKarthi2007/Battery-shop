import { useState, useEffect } from "react";
import { Package, Plus, Edit, AlertTriangle, TrendingUp, Trash2 } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { apiClient } from "../api/client";
import { CircleLoader } from "../components/ui/CircleLoader";

interface BatterySerialItem {
  id: number;
  serial_number: string;
  status: string;
}

interface Product {
  id: number;
  brand: string;
  model: string;
  type: string;
  ah: string;
  voltage?: string;
  vehicle_compatibility?: string;
  price: number;
  purchase_price?: number;
  warranty_months?: number;
  stock: number;
  min_stock: number;
  stock_status?: string;
  last_restocked?: string;
  supplier_name?: string;
  warranty?: string;
  serials?: BatterySerialItem[];
}

export function Inventory() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [filterType, setFilterType] = useState<string>("All");

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    ah: "",
    type: "Automotive",
    voltage: "12V",
    vehicle_compatibility: "",
    stock: 0,
    min_stock: 0,
    price: 0,
    purchase_price: 0,
    warranty_months: 24,
    supplier_name: "",
    serialsInput: "",
  });

  const fetchInventory = async () => {
    try {
      const data = await apiClient.get<Product[]>('/products');
      setInventory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredInventory = inventory.filter(
    (item) => filterType === "All" || item.type.toLowerCase() === filterType.toLowerCase()
  );

  const lowStockItems = inventory.filter((item) => item.stock <= item.min_stock);
  const totalValue = inventory.reduce((sum, item) => sum + (Number(item.price) * item.stock), 0);
  const totalUnits = inventory.reduce((sum, item) => sum + item.stock, 0);

  const handleAddStock = () => {
    setShowAddModal(true);
    setEditingItem(null);
    setFormData({
      brand: "",
      model: "",
      ah: "",
      type: "Automotive",
      voltage: "12V",
      vehicle_compatibility: "",
      stock: 0,
      min_stock: 2,
      price: 0,
      purchase_price: 0,
      warranty_months: 24,
      supplier_name: "",
      serialsInput: "",
    });
  };

  const handleEditStock = (item: Product) => {
    setEditingItem(item);
    setShowAddModal(true);
    setFormData({
      brand: item.brand,
      model: item.model,
      ah: item.ah,
      type: item.type,
      voltage: item.voltage || "12V",
      vehicle_compatibility: item.vehicle_compatibility || "",
      stock: item.stock,
      min_stock: item.min_stock,
      price: Number(item.price),
      purchase_price: Number(item.purchase_price || 0),
      warranty_months: item.warranty_months || 24,
      supplier_name: item.supplier_name || "",
      serialsInput: "",
    });
  };

  const handleSaveStock = async () => {
    try {
      const serialsArray = formData.serialsInput
        ? formData.serialsInput.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...formData,
        serials: serialsArray,
      };

      if (editingItem) {
        await apiClient.put(`/products/${editingItem.id}`, payload);
      } else {
        await apiClient.post('/products', payload);
      }
      fetchInventory();
      setShowAddModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to save product");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this battery product?")) return;
    try {
      await apiClient.delete(`/products/${id}`);
      fetchInventory();
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  };

  const getStockStatus = (stock: number, min_stock: number) => {
    if (stock === 0) return { label: "Out of Stock", color: "text-red-600 bg-red-100 dark:bg-red-900/30" };
    if (stock <= min_stock) return { label: "Low Stock", color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30" };
    return { label: "In Stock", color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#15161E] p-6 rounded-2xl border border-gray-100 dark:border-[#2E3B55] shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-blue-600" /> Battery Inventory & Serial Tracking
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Manage battery specifications, vehicle compatibility, purchase/selling pricing, and serial numbers</p>
        </div>
        <Button
          onClick={handleAddStock}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Battery Stock
        </Button>
      </div>

      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55]">
          <CircleLoader size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 mb-2">Sync Error</h3>
          <p className="text-red-600/80 font-medium mb-6">{error}</p>
          <button
            onClick={fetchInventory}
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#15161E] rounded-2xl p-6 border border-gray-100 dark:border-[#2E3B55] shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Stock Value</p>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">₹{totalValue.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#15161E] rounded-2xl p-6 border border-gray-100 dark:border-[#2E3B55] shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Batteries</p>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">{totalUnits} units</h3>
                </div>
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#15161E] rounded-2xl p-6 border border-gray-100 dark:border-[#2E3B55] shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Low Stock Alerts</p>
                  <h3 className="text-2xl font-black text-orange-600">{lowStockItems.length} items</h3>
                </div>
                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Type Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {["All", "Automotive", "Inverter", "Solar", "Heavy Vehicle"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filterType.toLowerCase() === type.toLowerCase()
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-black"
                    : "bg-white dark:bg-[#15161E] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#2E3B55] hover:bg-gray-50"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Inventory Table */}
          <div className="bg-white dark:bg-[#15161E] rounded-2xl border border-gray-100 dark:border-[#2E3B55] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-[#1E293B] text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-5 py-3.5">Brand & Model</th>
                    <th className="px-5 py-3.5">Type & Compatibility</th>
                    <th className="px-5 py-3.5">Specs & Warranty</th>
                    <th className="px-5 py-3.5">Stock</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Prices (Cost / MRP)</th>
                    <th className="px-5 py-3.5">Serial Numbers</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {filteredInventory.map((item) => {
                    const status = getStockStatus(item.stock, item.min_stock);
                    const serialsCount = item.serials ? item.serials.length : 0;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-black text-sm text-gray-900 dark:text-gray-100">{item.brand}</div>
                          <div className="text-gray-500 font-bold">{item.model}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-md uppercase text-[10px]">
                            {item.type}
                          </span>
                          {item.vehicle_compatibility && (
                            <div className="text-[11px] text-gray-400 mt-1 font-medium truncate max-w-xs">
                              Fits: {item.vehicle_compatibility}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-900 dark:text-gray-100">{item.ah} Ah • {item.voltage || '12V'}</div>
                          <div className="text-[11px] text-emerald-600 font-bold">
                            {item.warranty_months || 24} Months Warranty
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-black text-sm text-gray-900 dark:text-gray-100">{item.stock} units</div>
                          <div className="text-[10px] text-gray-400 font-bold">Min: {item.min_stock}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-black text-gray-900 dark:text-gray-100">Sell: ₹{Number(item.price).toLocaleString()}</div>
                          {item.purchase_price ? (
                            <div className="text-[10px] text-gray-400 font-bold">Cost: ₹{Number(item.purchase_price).toLocaleString()}</div>
                          ) : null}
                        </td>
                        <td className="px-5 py-4">
                          {serialsCount > 0 ? (
                            <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 font-mono text-[10px] font-bold rounded-lg border border-purple-100 dark:border-purple-800">
                              {serialsCount} Registered S/Ns
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">No S/Ns linked</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditStock(item)}
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(item.id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add/Edit Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#15161E] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-100 dark:border-[#2E3B55] shadow-2xl">
                <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-100 dark:border-gray-800">
                  <h3 className="text-base font-black uppercase text-gray-900 dark:text-gray-100">
                    {editingItem ? "Edit Battery Product Specs" : "Add Battery Stock & Specifications"}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Brand Name *</label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g., Exide, Amaron, Luminous"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Model Name / Code *</label>
                    <Input
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g., Matrix Red 35Ah, DIN55"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Capacity (Ah) *</label>
                    <Input
                      value={formData.ah}
                      onChange={(e) => setFormData({ ...formData, ah: e.target.value })}
                      placeholder="e.g., 35Ah, 150Ah"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Voltage</label>
                    <Input
                      value={formData.voltage}
                      onChange={(e) => setFormData({ ...formData, voltage: e.target.value })}
                      placeholder="e.g., 12V, 24V"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Battery Category</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                    >
                      <option value="Automotive">Automotive (Cars / 2W)</option>
                      <option value="Inverter">Home / Commercial Inverter</option>
                      <option value="Heavy Vehicle">Heavy Vehicle / Truck</option>
                      <option value="Solar">Solar Power Battery</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Vehicle / App Compatibility</label>
                    <Input
                      value={formData.vehicle_compatibility}
                      onChange={(e) => setFormData({ ...formData, vehicle_compatibility: e.target.value })}
                      placeholder="e.g., Swift Petrol, Honda City, Inverter"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Selling Price (MRP ₹) *</label>
                    <Input
                      type="number"
                      value={formData.price || ""}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      placeholder="5000"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Purchase Cost (₹)</label>
                    <Input
                      type="number"
                      value={formData.purchase_price || ""}
                      onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                      placeholder="3800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Current Stock Units *</label>
                    <Input
                      type="number"
                      value={formData.stock || ""}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Warranty Period (Months)</label>
                    <Input
                      type="number"
                      value={formData.warranty_months || ""}
                      onChange={(e) => setFormData({ ...formData, warranty_months: parseInt(e.target.value) || 24 })}
                      placeholder="24"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                      Register Battery Serial Numbers (Comma Separated)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.serialsInput}
                      onChange={(e) => setFormData({ ...formData, serialsInput: e.target.value })}
                      placeholder="e.g. EX-9876541, EX-9876542, EX-9876543"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold"
                    ></textarea>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStock}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700"
                  >
                    {editingItem ? "Update Battery Product" : "Save Battery Stock"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
