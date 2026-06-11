'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    isAvailable: true,
    imageUrl: ''
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenuItems(data);
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedItem ? `/api/menu/${selectedItem.id}` : '/api/menu';
      const method = selectedItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to save menu item');
      
      resetForm();
      await fetchMenuItems();
    } catch (err) {
      console.error('Error saving menu item:', err);
    }
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      imageUrl: item.imageUrl || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      await fetchMenuItems();
    } catch (err) {
      console.error('Error deleting menu item:', err);
    }
  };

  const handleToggleAvailability = async (id: number) => {
    try {
      await fetch(`/api/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleAvailability: true })
      });
      await fetchMenuItems();
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      isAvailable: true,
      imageUrl: ''
    });
    setSelectedItem(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-12 w-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <p className="text-sm text-gray-500">
          Create and manage your restaurant menu items
        </p>
      </div>

      {showAddForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {selectedItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <form onSubmit={handleSubmitMenu} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Item Name</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="e.g., appetizer, main, dessert"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter item description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price (₹)</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
                <Input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <label className="flex items-center text-sm font-medium">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                  className="mr-2"
                />
                Available for sale
              </label>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="outline"
                onClick={resetForm}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white">
                {selectedItem ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Menu Items</h2>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-primary text-white"
          >
            Add Menu Item
          </Button>
        </div>

        {menuItems.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            No menu items found. Add your first item above.
          </p>
        ) : (
          <div className="space-y-4">
            {menuItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category}</p>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-medium">₹{item.price}</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAvailability(item.id)}
                        className={`text-sm ${item.isAvailable ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        {item.isAvailable ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}