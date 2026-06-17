'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function OrdersPage() {
  const router = useRouter();
  const [tables, setTables] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<{menuItemId: string, quantity: number, specialInstructions: string}[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tablesRes, menuRes, ordersRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/menu'),
        fetch('/api/orders?status=PENDING,PREPARING,READY,SERVED')
      ]);
      
      if (!tablesRes.ok || !menuRes.ok || !ordersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const tablesData = await tablesRes.json();
      const menuData = await menuRes.json();
      const ordersData = await ordersRes.json();
      
      setTables(tablesData);
      setMenuItems(menuData);
      setActiveOrders(ordersData);

      // Extract unique categories from menu items
      const uniqueCategories = ['All', ...Array.from(new Set(menuData.map((item: any) => item.category)))];
      setCategories(uniqueCategories as string[]);

    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error fetching data:', err);
      toast.error('Failed to load orders data');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to place order
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (selectedTable && orderItems.length > 0 && !isSubmitting) {
          handlePlaceOrder();
        } else {
          toast.info('Cannot place order: Select table and items first');
        }
      }
      
      // Escape to clear current order
      if (e.key === 'Escape') {
        if (orderItems.length > 0 || selectedTable) {
          setOrderItems([]);
          setSelectedTable(null);
          setCustomerName('');
          setCustomerPhone('');
          toast.info('Order cleared');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable, orderItems, isSubmitting]);

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.available) return false;
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddItem = (menuItem: any) => {
    const existing = orderItems.find(item => item.menuItemId === menuItem.id);
    if (existing) {
      setOrderItems(orderItems.map(item => 
        item.menuItemId === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setOrderItems([...orderItems, { menuItemId: menuItem.id, quantity: 1, specialInstructions: '' }]);
    }
  };

  const handleRemoveItem = (menuItemId: string) => {
    const existing = orderItems.find(item => item.menuItemId === menuItemId);
    if (existing && existing.quantity > 1) {
      setOrderItems(orderItems.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      ));
    } else {
      setOrderItems(orderItems.filter(item => item.menuItemId !== menuItemId));
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedTable || orderItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable,
          items: orderItems,
          customerName: customerName || 'Walk-in Customer',
          customerPhone: customerPhone || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      // Reset form
      setSelectedTable(null);
      setOrderItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setShowCustomerForm(false);
      toast.success('Order placed successfully! 🎉');
      await fetchData();
    } catch (err) {
      setError('Failed to place order. Please try again.');
      console.error('Error placing order:', err);
      toast.error('Failed to place order');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      toast.success(`Order status updated to ${status}`);
      await fetchData();
    } catch (err) {
      setError('Failed to update order status. Please try again.');
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }

      toast.success('Order cancelled successfully');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order. Please try again.');
      console.error('Error cancelling order:', err);
      toast.error('Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async (orderId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate bill');
      }

      toast.success('Bill generated successfully! Redirecting...');
      router.push('/bills');
    } catch (err) {
      setError('Failed to generate bill. Please try again.');
      console.error('Error generating bill:', err);
      toast.error('Failed to generate bill');
      setLoading(false);
    }
  };

  const getMenuItemPrice = (id: string) => {
    const item = menuItems.find(m => m.id === id);
    return item ? item.price : 0;
  };

  const getMenuItemName = (id: string) => {
    const item = menuItems.find(m => m.id === id);
    return item ? item.name : 'Unknown';
  };

  const currentTotal = orderItems.reduce((sum, item) => sum + (getMenuItemPrice(item.menuItemId) * item.quantity), 0);

  if (loading && tables.length === 0) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full border-4 border-orange-600 border-t-transparent h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading your ordering station...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="text-red-500">{error}</p>
        <Button onClick={() => { setError(null); fetchData(); }} variant="gradient" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-border">
        <h1 className="text-3xl font-black text-foreground">Take Order</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create new orders and manage active ones with ease
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 border border-border shadow-sm rounded-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
              Select Table
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table.id)}
                  className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                    selectedTable === table.id
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30 transform scale-105'
                      : table.status === 'OCCUPIED'
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5 text-foreground'
                  }`}
                >
                  <span className="block font-bold text-lg">T{table.number}</span>
                  <span className="text-xs opacity-80">{table.capacity} pax</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 border border-border shadow-sm rounded-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center text-sm">2</span>
              Select Items
            </h2>
            
            {/* Search Bar */}
            <div className="mb-4">
              <Input
                type="text"
                placeholder="🔍 Search for any item... (e.g. Burger)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border-border shadow-sm rounded-xl h-11 text-sm font-medium"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-background text-foreground hover:bg-muted border border-border'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {filteredMenuItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No menu items found matching your search.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredMenuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-left transition-all flex flex-col h-full justify-between card-enhanced group"
                  >
                    <div>
                      <span className="block font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{item.name}</span>
                      <span className="text-xs text-muted-foreground mt-1 block">{item.category}</span>
                    </div>
                    <span className="block font-black text-primary mt-3">
                      ₹{item.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 h-fit">
          <Card id="current-order-card" className="p-5 border border-primary/20 shadow-xl shadow-primary/10 rounded-2xl flex flex-col h-[700px]">
            <h2 className="text-xl font-bold mb-4 pb-3 border-b border-border flex items-center justify-between">
              <span>Current Order</span>
              {selectedTable && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">
                  Table {tables.find(t => t.id === selectedTable)?.number}
                </span>
              )}
            </h2>

            {/* Customer Data Capture */}
            {selectedTable && (
              <div className="mb-4 p-3 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">👤</span>
                  <span className="font-bold text-foreground text-sm">Customer Details</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">💡 Optional but helpful for future visits & offers</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {orderItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <div className="text-5xl mb-3">🛒</div>
                  <p className="font-semibold text-muted-foreground">Your tray is empty</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Select items to build an order</p>
                </div>
              ) : (
                orderItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-muted/30 hover:bg-muted/50 transition-colors p-3 rounded-xl border border-border">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-bold text-foreground truncate">{getMenuItemName(item.menuItemId)}</p>
                      <p className="text-xs text-muted-foreground mb-2 font-medium">₹{getMenuItemPrice(item.menuItemId)} × {item.quantity}</p>
                      <Input
                        placeholder="Special instructions..."
                        value={item.specialInstructions || ''}
                        onChange={(e) => {
                          const newOrderItems = [...orderItems];
                          newOrderItems[index].specialInstructions = e.target.value;
                          setOrderItems(newOrderItems);
                        }}
                        className="h-8 text-xs bg-background border-border"
                      />
                    </div>
                    <div className="flex items-center space-x-3 shrink-0 bg-background rounded-lg border border-border p-1 shadow-sm">
                      <button onClick={() => handleRemoveItem(item.menuItemId)} className="w-7 h-7 flex items-center justify-center rounded bg-muted hover:bg-muted/80 text-foreground font-bold transition-colors">
                        -
                      </button>
                      <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => handleAddItem({id: item.menuItemId})} className="w-7 h-7 flex items-center justify-center rounded bg-primary/10 hover:bg-primary/20 text-primary font-bold transition-colors">
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-5 border-t border-border mt-4 bg-background">
              <div className="flex justify-between items-end mb-5">
                <span className="font-bold text-muted-foreground">Total Amount</span>
                <span className="font-black text-3xl text-primary">
                  ₹{currentTotal.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={handlePlaceOrder}
                disabled={!selectedTable || orderItems.length === 0 || isSubmitting}
                variant="gradient"
                className="w-full h-14 text-lg shadow-lg shadow-orange-500/25"
              >
                {isSubmitting ? 'Processing...' : (tables.find(t => t.id === selectedTable)?.status === 'OCCUPIED' ? 'Add to Order 📝' : 'Place Order 🚀')}
              </Button>
              {!selectedTable && orderItems.length > 0 && (
                <p className="text-amber-500 text-sm font-semibold text-center mt-3 bg-amber-50 py-2 rounded-lg">
                  ⚠️ Please select a table first
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Active Orders Section */}
      <div className="pt-8">
        <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
          🔥 Active Orders
        </h2>
        {activeOrders.length === 0 ? (
          <Card className="p-12 text-center border-dashed border">
            <div className="text-5xl mb-4">💤</div>
            <p className="text-muted-foreground font-medium">No active orders right now</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeOrders.map(order => (
              <Card key={order.id} className="p-5 border border-border hover:border-primary/50 transition-colors flex flex-col rounded-2xl shadow-sm hover:shadow-md">
                <div className="flex justify-between items-center border-b border-border pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-black text-foreground">
                      T{order.table?.number}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">#{order.id.slice(-4).toUpperCase()}</span>
                  </div>
                  <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider ${
                    order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 
                    order.status === 'PREPARING' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 
                    order.status === 'READY' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                    order.status === 'SERVED' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex-1 mb-5 space-y-2">
                  {order.items.slice(0, 3).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="font-medium text-foreground truncate pr-2">
                        <span className="text-primary font-bold mr-1">{item.quantity}×</span> 
                        {item.menuItem?.name || 'Unknown Item'}
                      </span>
                      <span className="text-muted-foreground font-medium whitespace-nowrap">
                        ₹{((item.quantity * (item.menuItem?.price || 0)).toFixed(2))}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded inline-block mt-2">
                      + {order.items.length - 3} more items
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border mt-auto">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total</p>
                    <span className="font-black text-lg text-foreground">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                  
                  {order.status === 'READY' && (
                    <Button
                      onClick={() => handleUpdateOrderStatus(order.id, 'SERVED')}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20"
                    >
                      🍽️ Serve Order
                    </Button>
                  )}
                  {order.status === 'SERVED' && (
                    <Button
                      onClick={() => handleGenerateBill(order.id)}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20"
                    >
                      🧾 Generate Bill
                    </Button>
                  )}
                  {(order.status === 'PENDING' || order.status === 'PREPARING') && (
                    <Button
                      onClick={() => handleCancelOrder(order.id)}
                      size="sm"
                      variant="outline"
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10 font-bold rounded-xl"
                    >
                      ❌ Cancel
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button for Mobile */}
      {orderItems.length > 0 && (
        <div className="lg:hidden fixed bottom-6 right-6 z-[100]">
          <button
            onClick={() => {
              document.getElementById('current-order-card')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="rounded-full h-14 w-14 bg-primary text-primary-foreground shadow-2xl flex items-center justify-center text-2xl relative border-2 border-primary-foreground hover:scale-105 active:scale-95 transition-all"
          >
            🛒
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-background">
              {orderItems.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

OrdersPage.displayName = 'OrdersPage';