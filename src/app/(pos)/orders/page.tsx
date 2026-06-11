'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function OrdersPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<{menuItemId: number, quantity: number, specialInstructions: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tablesRes, menuRes, ordersRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/menu'),
        fetch('/api/orders?status=pending,preparing,ready')
      ]);
      
      const tablesData = await tablesRes.json();
      const menuData = await menuRes.json();
      const ordersData = await ordersRes.json();
      
      setTables(tablesData);
      setMenuItems(menuData.filter((item: any) => item.isAvailable));
      setActiveOrders(ordersData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleRemoveItem = (menuItemId: number) => {
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
    if (!selectedTable || orderItems.length === 0) return;
    
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable,
          items: orderItems
        })
      });
      
      // Reset form
      setSelectedTable(null);
      setOrderItems([]);
      await fetchData();
    } catch (err) {
      console.error('Error placing order:', err);
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      await fetchData();
    } catch (err) {
      console.error('Error completing order:', err);
    }
  };

  const getMenuItemPrice = (id: number) => {
    const item = menuItems.find(m => m.id === id);
    return item ? item.price : 0;
  };
  
  const getMenuItemName = (id: number) => {
    const item = menuItems.find(m => m.id === id);
    return item ? item.name : 'Unknown';
  };

  const currentTotal = orderItems.reduce((sum, item) => sum + (getMenuItemPrice(item.menuItemId) * item.quantity), 0);

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
        <h1 className="text-2xl font-bold">Take Order</h1>
        <p className="text-sm text-gray-500">
          Create new orders and manage active ones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">1. Select Table</h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {tables.map(table => (
                <Button
                  key={table.id}
                  onClick={() => setSelectedTable(table.id)}
                  variant={selectedTable === table.id ? "outline" : "outline"}
                  className={`p-3 rounded-lg border-2 text-center transition-colors ${
                    selectedTable === table.id
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 hover:border-primary/50 text-gray-700'
                  }`}
                >
                  <span className="block font-bold">T{table.number}</span>
                  <span className="text-xs opacity-80">{table.capacity} pax</span>
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">2. Select Items</h2>
            {menuItems.length === 0 ? (
              <p className="text-gray-500">No available menu items found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    className="p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 text-left transition-colors flex flex-col h-full justify-between"
                  >
                    <div>
                      <span className="block font-medium line-clamp-2 leading-tight">{item.name}</span>
                      <span className="text-xs text-gray-500 mt-1 block">{item.category}</span>
                    </div>
                    <span className="block font-bold text-primary mt-2">₹{item.price}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-4 flex flex-col h-[500px]">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Current Order</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {orderItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Select items to build order</p>
              ) : (
                orderItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium truncate">{getMenuItemName(item.menuItemId)}</p>
                      <p className="text-sm text-gray-500">₹{getMenuItemPrice(item.menuItemId)} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleRemoveItem(item.menuItemId)} className="h-7 w-7 p-0">
                        -
                      </Button>
                      <span className="w-4 text-center font-medium">{item.quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => handleAddItem({id: item.menuItemId})} className="h-7 w-7 p-0">
                        +
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t mt-4">
              <div className="flex justify-between mb-4">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-lg text-primary">₹{currentTotal.toFixed(2)}</span>
              </div>
              <Button 
                onClick={handlePlaceOrder}
                disabled={!selectedTable || orderItems.length === 0}
                className="w-full bg-primary text-white py-6 text-lg"
              >
                Place Order
              </Button>
              {!selectedTable && orderItems.length > 0 && (
                <p className="text-red-500 text-sm text-center mt-2">Please select a table first</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Active Orders</h2>
        {activeOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active orders</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 flex flex-col">
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <h3 className="font-bold text-lg">Table {order.table.number}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase
                    ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      order.status === 'preparing' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="flex-1 mb-4 text-sm space-y-1">
                  {order.items.slice(0, 3).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate pr-2">{item.quantity}x {item.menuItem.name}</span>
                      <span className="text-gray-500">₹{item.totalPrice}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="text-gray-500 italic">+ {order.items.length - 3} more items</div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-auto pt-3 border-t">
                  <span className="font-bold text-primary">₹{order.totalAmount}</span>
                  {order.status === 'ready' && (
                    <Button 
                      onClick={() => handleCompleteOrder(order.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}