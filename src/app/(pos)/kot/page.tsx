'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { OrderWithItems } from '@/types/prisma';

export default function KOTPage() {
  const [orders, setOrders] = useState<Record<number, OrderWithItems[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchKOTOrders();

    // Set up polling for real-time updates
    const intervalId = setInterval(fetchKOTOrders, 5000); // Poll every 5 seconds

    // Update elapsed time every second
    const timerId = setInterval(() => {
      setElapsedTime(prev => {
        const updated: Record<string, number> = {};
        Object.keys(prev).forEach(key => {
          updated[key] = prev[key] + 1;
        });
        return updated;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(timerId);
    };
  }, []);

  const fetchKOTOrders = async () => {
    try {
      const response = await fetch('/api/orders?status=PENDING,PREPARING,READY');
      if (!response.ok) {
        throw new Error('Failed to fetch KOT orders');
      }
      const data: OrderWithItems[] = await response.json();

      // Group orders by table for KOT display
      const groupedOrders = data.reduce((acc: Record<number, OrderWithItems[]>, order) => {
        const tableNumber = order.table?.number || 0;
        if (!acc[tableNumber]) {
          acc[tableNumber] = [];
        }
        acc[tableNumber].push(order);
        return acc;
      }, {});

      setOrders(groupedOrders);

      // Initialize elapsed time for new orders
      setElapsedTime(prev => {
        const updated = { ...prev };
        data.forEach((order: OrderWithItems) => {
          if (!updated[order.id]) {
            const createdAt = new Date(order.createdAt).getTime();
            const now = Date.now();
            updated[order.id] = Math.floor((now - createdAt) / 1000);
          }
        });
        return updated;
      });

      setError(null);
    } catch (err) {
      setError('Failed to load KOT orders. Please try again.');
      console.error('Error fetching KOT orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (seconds: number): string => {
    if (seconds < 300) return 'text-green-600 bg-green-50'; // < 5 min
    if (seconds < 600) return 'text-yellow-600 bg-yellow-50'; // < 10 min
    return 'text-red-600 bg-red-50'; // > 10 min
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      toast.success(`Order marked as ${newStatus} 🍳`);
      // Refresh orders after update
      await fetchKOTOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
    }
  };

  const handlePrintTicket = (order: OrderWithItems) => {
    const printWindow = window.open('', '', 'height=600,width=400');
    if (!printWindow) return;

    const itemsHtml = order.items.map((item: any) => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: bold;">${item.quantity}x ${item.menuItem.name}</span>
      </div>
      ${item.specialInstructions ? `<div style="font-size: 12px; margin-left: 16px;">⚠️ ${item.specialInstructions}</div>` : ''}
    `).join('');

    printWindow.document.write(`
      <html><head><title>KOT #${order.id.slice(-4).toUpperCase()}</title>
      <style>
        body { font-family: monospace; padding: 10px; max-width: 300px; margin: 0 auto; }
        .text-center { text-align: center; }
        .border-y { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin: 10px 0; }
        h2 { margin: 0 0 5px 0; }
      </style>
      </head><body onload="window.print(); window.close();">
      <div class="text-center">
        <h2>KITCHEN TICKET</h2>
        <h3>Table ${order.table?.number}</h3>
      </div>
      <div class="border-y">
        <div>Ticket: #${order.id.slice(-4).toUpperCase()}</div>
        <div>Time: ${new Date(order.createdAt).toLocaleTimeString()}</div>
        ${order.customerName ? `<div>Name: ${order.customerName}</div>` : ''}
      </div>
      <div style="margin-top: 15px;">
        ${itemsHtml}
      </div>
      </body></html>
    `);
    printWindow.document.close();
  };

  if (loading && Object.keys(orders).length === 0) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full border-4 border-orange-500 border-t-transparent h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading Kitchen Tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="text-red-500">{error}</p>
        <Button onClick={() => { setError(null); fetchKOTOrders(); }} variant="gradient" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  // Convert grouped orders to array for rendering
  const orderGroups = Object.entries(orders);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
          🧑‍🍳 Kitchen Orders
        </h1>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
          Active orders for kitchen staff
          <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Live Updates
          </span>
        </p>
      </div>

      {orderGroups.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 border-gray-200 bg-gray-50/50">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Kitchen is all caught up!</h3>
          <p className="text-gray-500">Waiting for new orders to arrive...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {orderGroups.map(([tableNumber, tableOrders]) => (
            <Card key={tableNumber} className="overflow-hidden border-2 border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl hover:border-orange-200 transition-colors">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight">Table {tableNumber}</h2>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-md">
                  {tableOrders.length} Order{tableOrders.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="p-5 space-y-6 bg-[url('/receipt-pattern.png')] bg-repeat">
                {tableOrders.map((order: OrderWithItems) => (
                  <div key={order.id} className="bg-white rounded-xl border-2 border-gray-100 p-4 shadow-sm relative overflow-hidden group">
                    {/* Status accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      order.status === 'PENDING' ? 'bg-yellow-400' : 
                      order.status === 'PREPARING' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    
                    <div className="flex justify-between items-start mb-4 pl-2">
                      <div>
                        <h3 className="font-bold text-gray-900">Ticket #{order.id.slice(-4).toUpperCase()}</h3>
                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-1">
                          ⏱️ {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest ${
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                          order.status === 'PREPARING' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                          {order.status}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${getTimeColor(elapsedTime[order.id] || 0)}`}>
                          ⏱️ {formatTime(elapsedTime[order.id] || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pl-2">
                      {order.items.map((item: any, index: number) => (
                        <div key={index} className="flex gap-3 items-start p-2 rounded-lg bg-gray-50/80 group-hover:bg-gray-50 transition-colors">
                          <div className="bg-orange-100 text-orange-700 font-black px-2 py-1 rounded text-lg min-w-[2.5rem] text-center border border-orange-200 shadow-sm">
                            {item.quantity}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="font-bold text-gray-900 leading-tight text-lg">{item.menuItem.name}</p>
                            {item.specialInstructions && (
                              <p className="text-sm font-medium text-red-500 mt-1 bg-red-50 p-1.5 rounded border border-red-100 inline-block">
                                ⚠️ {item.specialInstructions}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 pt-4 border-t border-gray-100 pl-2 space-y-2">
                      {order.status === 'PENDING' && (
                        <Button
                          onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 text-sm shadow-lg shadow-blue-500/30 rounded-xl"
                        >
                          👨‍🍳 Start Preparing
                        </Button>
                      )}
                      {order.status === 'PREPARING' && (
                        <Button
                          onClick={() => handleUpdateStatus(order.id, 'READY')}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10 text-sm shadow-lg shadow-green-500/30 rounded-xl"
                        >
                          🔔 Mark as Ready
                        </Button>
                      )}
                      {order.status === 'READY' && (
                        <Button
                          onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                          variant="outline"
                          className="w-full h-10 font-bold text-sm text-gray-700 border-2 border-gray-200 hover:bg-gray-50 rounded-xl"
                        >
                          🍽️ Mark as Served
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => handlePrintTicket(order)}
                        variant="ghost"
                        className="w-full h-10 font-bold text-sm text-gray-600 hover:bg-gray-100 rounded-xl mt-2"
                      >
                        🖨️ Print Ticket
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

KOTPage.displayName = 'KOTPage';