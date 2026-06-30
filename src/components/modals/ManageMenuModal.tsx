'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  dietType: 'VEG' | 'NON_VEG';
  available: boolean;
  hasHalfFullOption?: boolean;
  priceHalf?: number;
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
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    price: '',
    dietType: 'VEG' as 'VEG' | 'NON_VEG',
    hasHalfFullOption: false,
    priceHalf: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchMenuItems();
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/menu/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchMenuItems = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await fetch('/api/menu');
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setMenuItems(data);
      } else {
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update for smoothness
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, available: !currentStatus } : item
    ));

    const toastId = toast.loading(currentStatus ? '⏸️ Marking unavailable...' : '✅ Marking available...');
    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !currentStatus }),
      });
      
      if (response.ok) {
        toast.success(currentStatus ? '⏸️ Marked as unavailable!' : '✅ Marked as available!', { id: toastId });
        // Background fetch to ensure consistency
        fetchMenuItems(false);
      } else {
        // Revert on failure
        setMenuItems(prev => prev.map(item => 
          item.id === id ? { ...item, available: currentStatus } : item
        ));
        toast.error('❌ Failed to update', { id: toastId });
      }
    } catch (error) {
      // Revert on failure
      setMenuItems(prev => prev.map(item => 
        item.id === id ? { ...item, available: currentStatus } : item
      ));
      console.error('Failed to update availability:', error);
      toast.error('❌ Error updating item', { id: toastId });
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.price) {
      toast.error('❌ Please fill all required fields');
      return;
    }

    const toastId = toast.loading('➕ Adding item...');
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name,
          category: newItem.category,
          price: parseFloat(newItem.price),
          dietType: newItem.dietType,
          available: true,
          hasHalfFullOption: newItem.hasHalfFullOption,
          ...(newItem.hasHalfFullOption && newItem.priceHalf
            ? { priceHalf: parseFloat(newItem.priceHalf) }
            : {}),
        }),
      });

      if (response.ok) {
        toast.success('✅ Item added successfully!', { id: toastId });
        setNewItem({ name: '', category: '', price: '', dietType: 'VEG', hasHalfFullOption: false, priceHalf: '' });
        setShowAddForm(false);
        fetchMenuItems(false);
      } else {
        const error = await response.json();
        toast.error(`❌ ${error.error || 'Failed to add item'}`, { id: toastId });
      }
    } catch (error) {
      console.error('Failed to add menu item:', error);
      toast.error('❌ Error adding item', { id: toastId });
    }
  };

  const handleDeleteItem = async (id: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) return;

    const toastId = toast.loading('🗑️ Deleting item...');
    try {
      const response = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('✅ Item deleted successfully!', { id: toastId });
        fetchMenuItems(false);
      } else {
        const error = await response.json();
        toast.error(`❌ ${error.error || 'Failed to delete item'}`, { id: toastId });
      }
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      toast.error('❌ Error deleting item', { id: toastId });
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !editingItem.name || !editingItem.category || !editingItem.price) {
      toast.error('❌ Please fill all required fields');
      return;
    }

    const toastId = toast.loading('💾 Updating item...');
    try {
      const response = await fetch(`/api/menu/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingItem.name,
          category: editingItem.category,
          price: editingItem.price,
          dietType: editingItem.dietType,
          hasHalfFullOption: editingItem.hasHalfFullOption,
          priceHalf: editingItem.hasHalfFullOption ? editingItem.priceHalf : null,
        }),
      });

      if (response.ok) {
        toast.success('✅ Item updated successfully!', { id: toastId });
        setShowEditForm(false);
        setEditingItem(null);
        fetchMenuItems(false);
      } else {
        const error = await response.json();
        toast.error(`❌ ${error.error || 'Failed to update item'}`, { id: toastId });
      }
    } catch (error) {
      console.error('Failed to update menu item:', error);
      toast.error('❌ Error updating item', { id: toastId });
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const allCategories = ['ALL', ...categories];

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
            {allCategories.map((category) => (
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
        <div className="manage-menu-content flex-1 overflow-y-auto p-6 bg-gradient-to-b from-background to-muted/20 custom-scrollbar">
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
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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

              {/* Half/Full Portion Toggle */}
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.hasHalfFullOption}
                    onChange={(e) =>
                      setNewItem({ ...newItem, hasHalfFullOption: e.target.checked, priceHalf: e.target.checked ? newItem.priceHalf : '' })
                    }
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                  />
                  <span className="text-sm font-bold text-foreground">Enable Half Plate option</span>
                </label>
              </div>

              {newItem.hasHalfFullOption && (
                <div className="mb-3">
                  <input
                    type="number"
                    placeholder="Half Plate Price"
                    value={newItem.priceHalf}
                    onChange={(e) => setNewItem({ ...newItem, priceHalf: e.target.value })}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-1/2"
                  />
                </div>
              )}
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

          {/* Edit Form Modal */}
          {showEditForm && editingItem && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-background border-2 border-border rounded-3xl shadow-2xl w-full max-w-lg p-6 animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-primary" />
                    Edit Menu Item
                  </h3>
                  <button 
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingItem(null);
                    }}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Item Name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Price"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={editingItem.dietType}
                  onChange={(e) => setEditingItem({ ...editingItem, dietType: e.target.value as 'VEG' | 'NON_VEG' })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="VEG">🟢 Vegetarian</option>
                  <option value="NON_VEG">🔴 Non-Vegetarian</option>
                </select>
              </div>

              {/* Half/Full Portion Toggle */}
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.hasHalfFullOption}
                    onChange={(e) =>
                      setEditingItem({ 
                        ...editingItem, 
                        hasHalfFullOption: e.target.checked, 
                        priceHalf: e.target.checked ? editingItem.priceHalf : undefined 
                      })
                    }
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                  />
                  <span className="text-sm font-bold text-foreground">Enable Half Plate option</span>
                </label>
              </div>

              {editingItem.hasHalfFullOption && (
                <div className="mb-3">
                  <input
                    type="number"
                    placeholder="Half Plate Price"
                    value={editingItem.priceHalf || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, priceHalf: parseFloat(e.target.value) || 0 })}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-1/2"
                  />
                </div>
              )}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdateItem}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors active:scale-[0.97]"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 py-3 bg-muted text-foreground rounded-xl font-bold hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
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
                    <div className="flex items-center gap-2 mt-1">
                      {item.hasHalfFullOption ? (
                        <>
                          <p className="text-sm font-bold text-primary">
                            Half: ₹{item.priceHalf} / Full: ₹{item.price}
                          </p>
                          <span className="px-2 py-0.5 bg-primary/15 text-primary text-[10px] font-bold rounded">
                            Half/Full
                          </span>
                        </>
                      ) : (
                        <p className="text-sm font-bold text-primary">₹{item.price}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Edit item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
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
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete item"
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
