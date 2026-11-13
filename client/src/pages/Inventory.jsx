import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  Filter,
  DollarSign,
  TrendingUp,
  X,
  Edit2
} from 'lucide-react';
import api from '../api';
import Header from '../components/Header';

const DEFAULT_CATEGORIES = [
  'ALL',
  'Oils & Fluids',
  'Filters',
  'Brakes',
  'Engine Parts',
  'Electrical'
];

export default function Inventory({ onOpenMobileMenu }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Item Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    category: 'Oils & Fluids',
    quantity: '10',
    buyPrice: '10.00',
    sellPrice: '20.00',
    minStockLevel: '5'
  });

  useEffect(() => {
    loadInventory();
  }, [selectedCategory, searchQuery]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const res = await api.get('/inventory', { params });
      setItems(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (itemId, delta) => {
    try {
      const res = await api.patch(`/inventory/${itemId}/stock`, { delta });
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: res.data.quantity } : i))
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to adjust stock');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', newItem);
      setIsAddOpen(false);
      setNewItem({
        sku: '',
        name: '',
        category: 'Oils & Fluids',
        quantity: '10',
        buyPrice: '10.00',
        sellPrice: '20.00',
        minStockLevel: '5'
      });
      loadInventory();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add item');
    }
  };

  const totalItems = items.length;
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalValuation = items.reduce((sum, i) => sum + i.quantity * i.sellPrice, 0);
  const lowStockCount = items.filter((i) => i.quantity <= i.minStockLevel).length;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8FAFC]">
      <Header
        title="Spare Parts & Stock Inventory"
        subtitle="Live stock levels, margin ratios & low-stock alerts"
        onRefresh={loadInventory}
        onOpenMobileMenu={onOpenMobileMenu}
        loading={loading}
      />

      <main className="p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* KPI Mini Row (2x2 on mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] sm:text-xs text-slate-500 uppercase font-semibold">SKUs</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {totalItems}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] sm:text-xs text-slate-500 uppercase font-semibold">Units</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {totalUnits}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] sm:text-xs text-slate-500 uppercase font-semibold">Valuation</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 mt-1 tabular-nums truncate">
              ${totalValuation.toFixed(2)}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] sm:text-xs text-slate-500 uppercase font-semibold">Low Stock</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-rose-600 mt-1 tabular-nums">
              {lowStockCount} items
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Category Tabs (Swipeable on touch) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0 -mx-1 px-1">
            {DEFAULT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[34px] ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Box & Add Item Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search SKU or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all min-h-[40px]"
              />
            </div>

            <button
              onClick={() => setIsAddOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl shadow-xs inline-flex items-center gap-1.5 shrink-0 min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Item</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadInventory}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium ml-3 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Part / Consumable Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                  <th className="py-3 px-4 text-right">Retail</th>
                  <th className="py-3 px-4 text-right">Markup</th>
                  <th className="py-3 px-4 text-center">Quick Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isLowStock = item.quantity <= item.minStockLevel;
                  const marginPct = item.buyPrice > 0
                    ? Math.round(((item.sellPrice - item.buyPrice) / item.buyPrice) * 100)
                    : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {item.sku}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-none">{item.name}</span>
                          {isLowStock && (
                            <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              Low
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[10px] font-medium text-slate-700">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-baseline gap-1">
                          <span
                            className={`font-mono text-xs font-bold tabular-nums ${
                              isLowStock ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {item.quantity}
                          </span>
                          <span className="text-[10px] text-slate-400">/ {item.minStockLevel}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-500 tabular-nums">
                        ${item.buyPrice.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        ${item.sellPrice.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-medium tabular-nums">
                        +{marginPct}%
                      </td>

                      {/* Touch-Friendly Inline Quick Restock +/- */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            onClick={() => handleAdjustStock(item.id, -1)}
                            disabled={item.quantity <= 0}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Decrement 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-8 text-center font-mono font-bold text-xs tabular-nums text-slate-900">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => handleAdjustStock(item.id, 1)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Increment 1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleAdjustStock(item.id, 10)}
                            className="px-2 py-1 ml-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-mono font-medium transition-all min-h-[28px] flex items-center justify-center"
                            title="Restock +10"
                          >
                            +10
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
      </main>

      {/* Add Item Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in pb-safe">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Add Inventory Item</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-2 -mr-2">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BRK-PAD-02"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Category *</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[40px]"
                  >
                    {DEFAULT_CATEGORIES.filter((c) => c !== 'ALL').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Item Description Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ceramic Front Brake Pads"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[40px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItem.minStockLevel}
                    onChange={(e) => setNewItem({ ...newItem, minStockLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono min-h-[40px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Buy / Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newItem.buyPrice}
                    onChange={(e) => setNewItem({ ...newItem, buyPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono tabular-nums min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Sell / Retail ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newItem.sellPrice}
                    onChange={(e) => setNewItem({ ...newItem, sellPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono tabular-nums min-h-[40px]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 min-h-[44px]"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
