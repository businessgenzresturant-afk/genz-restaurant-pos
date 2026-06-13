'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Pencil, Eye, EyeOff, Trash2, Search, Plus, X, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Tandoor Starters',
  'Chinese Starters',
  'Noodles & Fried Rice',
  'Main Course - Veg',
  'Main Course - Non-Veg',
  'Breads',
  'Biryani',
  'Appetizers',
  'Soups',
  'Momos & Spring Rolls',
  'Beverages',
];

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const router = useRouter();

  // Form state for adding/editing menu item
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Filter menu items based on search and category
  useEffect(() => {
    let filtered = menuItems;

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [menuItems, searchQuery, selectedCategory]);

  const fetchMenuItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/menu');
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      setMenuItems(data);
    } catch (err) {
      setError('Failed to load menu items. Please try again.');
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !price) return;

    setLoading(true);
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          price: parseFloat(price),
          imageUrl,
          available,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create menu item');
      }

      // Reset form
      setName('');
      setCategory('');
      setPrice('');
      setImageUrl('');
      setAvailable(true);
      setShowAddModal(false);
      
      // Refresh menu items
      await fetchMenuItems();
    } catch (err) {
      setError('Failed to create menu item. Please try again.');
      console.error('Error creating menu item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMenuItem = async () => {
    if (!itemToEdit?.id || !name || !category || !price) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/menu/${itemToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          price: parseFloat(price),
          imageUrl,
          available,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update menu item');
      }

      // Reset form
      setName('');
      setCategory('');
      setPrice('');
      setImageUrl('');
      setAvailable(true);
      setShowEditModal(false);
      setItemToEdit(null);
      
      // Refresh menu items
      await fetchMenuItems();
    } catch (err) {
      setError('Failed to update menu item. Please try again.');
      console.error('Error updating menu item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMenuItem = async () => {
    if (!itemToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/menu/${itemToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu item');
      }

      setShowDeleteModal(false);
      setItemToDelete(null);
      await fetchMenuItems();
    } catch (err) {
      setError('Failed to delete menu item. Please try again.');
      console.error('Error deleting menu item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (id: string, currentAvailability: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          available: !currentAvailability,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle availability');
      }

      await fetchMenuItems();
    } catch (err) {
      setError('Failed to toggle availability. Please try again.');
      console.error('Error toggling availability:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading delicious menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="text-red-500">{error}</p>
        <Button onClick={() => { setError(null); fetchMenuItems(); }} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground">Menu Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your restaurant delicious items</p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="gradient"
            size="lg"
            className="gap-2"
          >
            <Plus className="h-5 w-5" /> Add New Item
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border-border/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Search className="h-5 w-5" />
          </div>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Search menu items by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Category Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : 'bg-background text-foreground hover:bg-muted border border-border'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-bold text-primary">{filteredItems.length}</span> of{' '}
          <span className="font-bold text-primary/80">{menuItems.length}</span> items
        </p>
        {(searchQuery || selectedCategory !== 'All') && (
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Add Menu Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">Add Menu Item</h2>
                <p className="text-sm text-muted-foreground">Create a new delicious item</p>
              </div>
            </div>
            <form onSubmit={handleAddMenuItem} className="space-y-4">
              <div>
                <label htmlFor="itemName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Item Name
                </label>
                <Input
                  id="itemName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                  placeholder="e.g., Butter Chicken"
                />
              </div>
              <div>
                <label htmlFor="itemCategory" className="block text-sm font-semibold text-foreground mb-2">
                  Category
                </label>
                <select
                  id="itemCategory"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="itemPrice" className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (₹)
                </label>
                <Input
                  id="itemPrice"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="itemImageUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                  Image URL (Optional)
                </label>
                <Input
                  id="itemImageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                <input
                  type="checkbox"
                  id="itemAvailable"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="h-5 w-5 text-primary rounded border-border"
                />
                <label htmlFor="itemAvailable" className="text-sm font-medium text-foreground">
                  Available for order
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowAddModal(false);
                    setName('');
                    setCategory('');
                    setPrice('');
                    setImageUrl('');
                    setAvailable(true);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" className="flex-1">
                  Add Item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Menu Item Modal */}
      {showEditModal && itemToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Pencil className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">Edit Menu Item</h2>
                <p className="text-sm text-muted-foreground">Update item details</p>
              </div>
            </div>
            <form onSubmit={handleUpdateMenuItem} className="space-y-4">
              <div>
                <label htmlFor="editItemName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Item Name
                </label>
                <Input
                  id="editItemName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <label htmlFor="editItemCategory" className="block text-sm font-semibold text-foreground mb-2">
                  Category
                </label>
                <select
                  id="editItemCategory"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="editItemPrice" className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (₹)
                </label>
                <Input
                  id="editItemPrice"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full"
                  placeholder="Enter price"
                />
              </div>
              <div>
                <label htmlFor="editItemImageUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                  Image URL (Optional)
                </label>
                <Input
                  id="editItemImageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                <input
                  type="checkbox"
                  id="editItemAvailable"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="h-5 w-5 text-primary rounded border-border"
                />
                <label htmlFor="editItemAvailable" className="text-sm font-medium text-foreground">
                  Available for order
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowEditModal(false);
                    setItemToEdit(null);
                    setName('');
                    setCategory('');
                    setPrice('');
                    setImageUrl('');
                    setAvailable(true);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" className="flex-1">
                  Update Item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">Delete Menu Item</h2>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this menu item? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteMenuItem}
                variant="destructive"
                className="flex-1"
              >
                Delete Item
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.length === 0 ? (
          <Card className="p-12 text-center col-span-full border-border/60">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-muted-foreground mb-4">No menu items found</p>
            <p className="text-sm text-muted-foreground/70">
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your search or filters'
                : 'Add your first menu item to get started'}
            </p>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setItemToEdit(item);
                setName(item.name);
                setCategory(item.category);
                setPrice(item.price.toString());
                setImageUrl(item.imageUrl);
                setAvailable(item.available);
                setShowEditModal(true);
              }}
              className={`border rounded-xl p-4 transition-all cursor-pointer hover:border-primary/50 group card-enhanced ${
                item.available ? 'border-border' : 'border-border/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-2">
                  <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    item.available
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}
                >
                  {item.available ? 'Available' : 'Hidden'}
                </span>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-xl font-black text-primary">
                  ₹{item.price.toFixed(2)}
                </p>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleAvailability(item.id, item.available);
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    {item.available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete(item.id);
                      setShowDeleteModal(true);
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

MenuPage.displayName = 'MenuPage';