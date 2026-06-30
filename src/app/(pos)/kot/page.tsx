'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { OrderWithItems } from '@/types/prisma';

const SkeletonCard = () => (
  <Card className="overflow-hidden border border-border shadow-lg shadow-border/50 rounded-2xl ">
    <div className="bg-muted p-4 flex justify-between items-center h-16">
      <div className="h-6 w-24 bg-muted-foreground/20 rounded-lg" />
      <div className="h-6 w-12 bg-muted-foreground/20 rounded-full" />
    </div>
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <div className="h-5 w-2/3 bg-muted rounded-lg" />
        <div className="h-4 w-1/3 bg-muted rounded-lg" />
      </div>
      <div className="h-[100px] bg-muted/50 rounded-xl" />
      <div className="flex gap-2">
        <div className="h-9 flex-1 bg-muted rounded-xl" />
        <div className="h-9 w-20 bg-muted rounded-xl" />
      </div>
    </div>
  </Card>
);

export default function KOTPage() {
  const [orders, setOrders] = useState<Record<number, OrderWithItems[]>>(() => {
    if (typeof window !== 'undefined' && (window as any).__pos_kot_cache?.orders) {
      return (window as any).__pos_kot_cache.orders;
    }
    return {};
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && (window as any).__pos_kot_cache?.orders) {
      return false;
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchKOTOrders();

    // Reduced polling frequency to minimize database connections
    // 10 seconds is adequate for KOT updates
    const intervalId = setInterval(fetchKOTOrders, 10000); // 10 seconds (was 5s - reduced by 50%)

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

      // Save to cache
      if (typeof window !== 'undefined') {
        (window as any).__pos_kot_cache = {
          orders: groupedOrders
        };
      }

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
    import('@/lib/printUtils').then(({ printReceipt }) => {
      printReceipt(order, 'kot');
    });
  };

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
  const showSkeletons = loading && orderGroups.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-border">
        <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
          🧑‍🍳 Kitchen Orders
        </h1>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
          Active orders for kitchen staff
          <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-orange-500 "></span>
            Live Updates
          </span>
        </p>
      </div>

      {showSkeletons ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-start">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : orderGroups.length === 0 ? (
        <Card className="p-16 text-center border-dashed border border-border bg-muted/50">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-bold text-foreground mb-2">Kitchen is all caught up!</h3>
          <p className="text-muted-foreground">Waiting for new orders to arrive...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-start">
          {orderGroups.map(([tableNumber, tableOrders]) => (
            <Card key={tableNumber} className="overflow-hidden border border-border shadow-lg shadow-border/50 rounded-2xl hover:border-primary/50 transition-colors animate-slide-up">
              <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight">Table {tableNumber}</h2>
                <div className="bg-background/20 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-md">
                  {tableOrders.length} Order{tableOrders.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="p-3 space-y-4">
                {tableOrders.map((order: OrderWithItems) => (
                  <div key={order.id} className="bg-card rounded-xl border border-border shadow-sm relative overflow-hidden group flex flex-col max-h-[450px]">
                    {/* Status accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 z-10 ${
                      order.status === 'PENDING' ? 'bg-yellow-400' : 
                      order.status === 'PREPARING' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    
                    {/* Header: sticky at top */}
                    <div className="flex justify-between items-start mb-2 pl-4 pt-4 pr-4 shrink-0 bg-card z-10">
                      <div>
                        <h3 className="font-bold text-foreground">Ticket #{order.id.slice(-4).toUpperCase()}</h3>
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mt-1">
                          ⏱️ {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${
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

                    {/* Scrollable Items List */}
                    <div className="space-y-2 pl-4 pr-2 overflow-y-auto custom-scrollbar flex-1 pb-2">
                      {order.items.filter((i: any) => !i.specialInstructions?.includes('[SERVED]')).map((item: any, index: number) => (
                        <div key={index} className="flex gap-3 items-start p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                          <div className="bg-primary/10 text-primary font-black px-2 py-1 rounded text-base min-w-[2rem] text-center border border-primary/20 shadow-sm">
                            {item.quantity}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className="font-bold text-foreground leading-tight text-sm">{item.menuItem.name}</p>
                            {item.specialInstructions && item.specialInstructions.replace(/\[URGENT ADDITION\]/g, '').replace(/\[SERVED\]/g, '').trim() && (
                              <p className="text-xs font-medium text-destructive mt-1 bg-destructive/10 p-1 rounded border border-destructive/20 inline-block">
                                ⚠️ {item.specialInstructions.replace(/\[URGENT ADDITION\]/g, '').replace(/\[SERVED\]/g, '').trim()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons: sticky at bottom */}
                    <div className="mt-auto pt-3 border-t border-border px-4 pb-4 space-y-2 shrink-0 bg-card z-10">
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
                          onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                          variant="outline"
                          className="w-full h-10 font-bold text-sm text-foreground border border-border hover:bg-muted rounded-xl transition-all shadow-sm"
                        >
                          🍽️ Mark as Served
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => handlePrintTicket(order)}
                        variant="ghost"
                        className="w-full h-10 font-bold text-sm text-muted-foreground hover:bg-muted rounded-xl mt-2"
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