'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function KOTPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKOTs();
    // Auto-refresh KOTs every 10 seconds
    const interval = setInterval(() => {
      fetchKOTs(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchKOTs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/orders?status=pending,preparing');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching KOTs:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await fetchKOTs(false);
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const calculateTimeElapsed = (createdAt: string) => {
    const diff = new Date().getTime() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    return minutes;
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
      <div className="pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Kitchen Display</h1>
          <p className="text-sm text-gray-500">
            Manage active Kitchen Order Tickets (Auto-refreshes)
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          <p className="text-xl">No active orders in kitchen.</p>
          <p className="mt-2">Waiting for new orders...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map(order => {
            const minutesElapsed = calculateTimeElapsed(order.createdAt);
            const isLate = minutesElapsed > 15;
            
            return (
              <Card key={order.id} className={`flex flex-col h-full border-2 ${
                order.status === 'pending' ? 'border-yellow-400' : 'border-blue-400'
              }`}>
                <div className={`p-3 text-white flex justify-between items-center ${
                  order.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}>
                  <span className="font-bold text-lg">Table {order.table.number}</span>
                  <span className="font-mono bg-white/20 px-2 py-1 rounded">#{order.id}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full uppercase ${
                    order.status === 'pending' ? 'text-yellow-700 bg-yellow-100' : 'text-blue-700 bg-blue-100'
                  }`}>
                    {order.status}
                  </span>
                  <span className={`text-sm font-medium ${isLate ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                    ⏱ {minutesElapsed} min ago
                  </span>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto bg-white">
                  <ul className="space-y-3">
                    {order.items.map((item: any, idx: number) => (
                      <li key={idx} className="flex border-b border-gray-100 pb-2 last:border-0">
                        <span className="font-bold text-lg min-w-[2rem]">{item.quantity}x</span>
                        <div>
                          <span className="font-medium text-lg">{item.menuItem.name}</span>
                          {item.specialInstructions && (
                            <p className="text-sm text-red-500 italic mt-1">Note: {item.specialInstructions}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-3 bg-gray-50 border-t mt-auto">
                  {order.status === 'pending' ? (
                    <Button 
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg"
                    >
                      START PREPARING
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg"
                    >
                      MARK AS READY
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}