import { useState, useEffect } from "react";
import { Package, Plus, Edit, AlertTriangle, TrendingUp, Trash2 } from "lucide-react";
import { BatteryLoader } from "../components/ui/BatteryLoader";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { apiClient } from "../api/client";

interface Product {
  id: number;
  brand: string;
  model: string;
  type: string;
  ah: string;
  price: number;
  stock: number;
  min_stock: number;
  last_restocked?: string;
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
    type: "Car",
    stock: 0,
    min_stock: 0,
    price: 0,
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
    (item) => filterType === "All" || item.type === filterType
  );

  const lowStockItems = inventory.filter((item) => item.stock < item.min_stock);
  const totalValue = inventory.reduce((sum, item) => sum + (Number(item.price) * item.stock), 0);
  const totalUnits = inventory.reduce((sum, item) => sum + item.stock, 0);

  const handleAddStock = () => {
    setShowAddModal(true);
    setEditingItem(null);
    setFormData({
      brand: "",
      model: "",
      ah: "",
      type: "Car",
      stock: 0,
      min_stock: 0,
      price: 0,
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
      stock: item.stock,
      min_stock: item.min_stock,
      price: Number(item.price),
    });
  };

  const handleSaveStock = async () => {
    try {
      if (editingItem) {
        await apiClient.put(`/products/${editingItem.id}`, formData);
      } else {
        await apiClient.post('/products', formData);
      }
      fetchInventory();
      setShowAddModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to save product");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await apiClient.delete(`/products/${id}`);
      fetchInventory();
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  };

  const getStockStatus = (stock: number, min_stock: number) => {
    const percentage = (stock / min_stock) * 100;
    if (percentage < 50) return { label: "Critical", color: "text-red-600 bg-red-100" };
    if (percentage < 100) return { label: "Low", color: "text-orange-600 bg-orange-100" };
    return { label: "Good", color: "text-green-600 bg-green-100" };
  };

  if (loading) {
    return <BatteryLoader />;
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage battery stock levels</p>
        </div>
        <Button
          onClick={handleAddStock}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Stock
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Stock Value</p>
              <h3 className="text-2xl font-bold text-gray-900">₹{(totalValue / 100000).toFixed(1)}L</h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Units</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalUnits}</h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
              <h3 className="text-2xl font-bold text-gray-900">{lowStockItems.length}</h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        {["All", "Car", "Inverter"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${filterType === type
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
              }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Battery Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Last Restocked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const status = getStockStatus(item.stock, item.min_stock);
                const isLowStock = item.stock < item.min_stock;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors ${isLowStock ? "bg-orange-50/50" : ""
                      }`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{item.brand}</div>
                        <div className="text-sm text-gray-600">{item.model}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {item.ah} Ah
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.stock} units</div>
                      <div className="text-xs text-gray-500">Min: {item.min_stock}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      ₹{Number(item.price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.last_restocked || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditStock(item)}
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteProduct(item.id)}
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? "Edit Stock" : "Add New Stock"}
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., Exide"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., IT 500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (Ah)</label>
                  <Input
                    value={formData.ah}
                    onChange={(e) => setFormData({ ...formData, ah: e.target.value })}
                    placeholder="e.g., 150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Car">Car</option>
                    <option value="Inverter">Inverter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Stock
                  </label>
                  <Input
                    type="number"
                    value={formData.stock || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                    }
                    placeholder="e.g., 20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Stock
                  </label>
                  <Input
                    type="number"
                    value={formData.min_stock || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })
                    }
                    placeholder="e.g., 10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                  <Input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
                    }
                    placeholder="e.g., 15000"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleSaveStock}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  {editingItem ? "Update Stock" : "Add Stock"}
                </Button>
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
