'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  dietType: 'VEG' | 'NON_VEG';
  available: boolean;
}

interface ManageMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageMenuModal({ isOpen, onClose }: ManageMenuModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    price: '',
    dietType: 'VEG' as 'VEG' | 'NON_VEG',
  });

  useEffect(() => {
    if (isOpen) {
      fetchMenuItems();
    }
  }, [isOpen]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/menu');
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !currentStatus }),
      });
      fetchMenuItems();
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.price) return;

    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          price: parseFloat(newItem.price),
          available: true,
        }),
      });

      if (response.ok) {
        setNewItem({ name: '', category: '', price: '', dietType: 'VEG' });
        setShowAddForm(false);
        fetchMenuItems();
      }
    } catch (error) {
      console.error('Failed to add menu item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      fetchMenuItems();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', ...new Set(menuItems.map((item) => item.category))];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-background border-2 border-border rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-xl">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Manage Menu</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Add items, edit, or mark out of stock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-muted/80 rounded-xl transition-all duration-200 hover:rotate-90"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-6 border-b-2 border-border space-y-3 bg-muted/10">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 active:scale-[0.97]"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  filterCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-background to-muted/20">
          {/* Add Form */}
          {showAddForm && (
            <div className="bg-muted/50 rounded-xl p-4 mb-6 animate-fade-in">
              <h3 className="text-sm font-bold text-foreground mb-3">Add New Menu Item</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Item Name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={newItem.dietType}
                  onChange={(e) => setNewItem({ ...newItem, dietType: e.target.value as 'VEG' | 'NON_VEG' })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="VEG">🟢 Vegetarian</option>
                  <option value="NON_VEG">🔴 Non-Vegetarian</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 transition-opacity active:scale-[0.97]"
                >
                  Add Item
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg font-bold text-sm hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Menu Items List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No menu items found</div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-card border-2 rounded-xl p-4 flex items-center justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                    !item.available ? 'opacity-60 border-amber-500' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground">{item.name}</p>
                      <span className={item.dietType === 'VEG' ? 'text-green-500' : 'text-red-500'}>
                        {item.dietType === 'VEG' ? '🟢' : '🔴'}
                      </span>
                      {!item.available && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-600 text-[10px] font-bold rounded">
                          OUT OF STOCK
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                    <p className="text-sm font-bold text-primary mt-1">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAvailability(item.id, item.available)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        item.available
                          ? 'bg-amber-500/20 text-amber-600 hover:bg-amber-500/30'
                          : 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
                      }`}
                    >
                      {item.available ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted text-foreground rounded-lg font-bold text-sm hover:bg-muted/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
