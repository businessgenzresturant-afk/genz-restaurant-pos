'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, UtensilsCrossed, ShoppingBag, Bike, Package, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

// Sound notification queue item
interface SoundNotification {
  id: string;
  type: 'new' | 'urgent';
  timestamp: number;
  repeatCount: number;
}

const SkeletonCard = () => (
  <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-4 ">
    <div className="flex justify-between items-center pb-3 border-b border-zinc-800/40">
      <div className="h-6 w-24 bg-zinc-800 rounded-lg" />
      <div className="h-4 w-12 bg-zinc-800 rounded-lg" />
    </div>
    <div className="space-y-2">
      <div className="h-5 w-5/6 bg-zinc-800/80 rounded-lg" />
      <div className="h-4 w-1/2 bg-zinc-800/50 rounded-lg" />
    </div>
    <div className="pt-3 border-t border-zinc-800/40">
      <div className="h-9 w-full bg-zinc-800 rounded-xl" />
    </div>
  </div>
);

export default function KitchenDisplaySystem() {
  const [orders, setOrders] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && (window as any).__pos_kds_cache?.orders) {
      return (window as any).__pos_kds_cache.orders;
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && (window as any).__pos_kds_cache?.orders) {
      return false;
    }
    return true;
  });
  const [now, setNow] = useState(new Date());
  const [soundQueue, setSoundQueue] = useState<SoundNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousOrdersRef = useRef<any[]>([]);
  const soundTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const audioContextRef = useRef<{ new: HTMLAudioElement | null; urgent: HTMLAudioElement | null }>({
    new: null,
    urgent: null
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Preload audio files
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current.new = new Audio('/sounds/new-order.mp3');
      audioContextRef.current.urgent = new Audio('/sounds/urgent.mp3');
      
      // Preload
      audioContextRef.current.new.load();
      audioContextRef.current.urgent.load();
    }
  }, []);

  // Play sound with queue management
  const playSound = useCallback((type: 'new' | 'urgent', notificationId?: string) => {
    if (!soundEnabled) return;
    
    try {
      const audio = type === 'new' ? audioContextRef.current.new : audioContextRef.current.urgent;
      if (!audio) return;
      
      // Clone the audio to allow overlapping sounds
      const soundClone = audio.cloneNode() as HTMLAudioElement;
      
      if (type === 'urgent') {
        // Play 2-3 quick beeps for urgent
        soundClone.play().catch(() => {});
        setTimeout(() => {
          const beep2 = audio.cloneNode() as HTMLAudioElement;
          beep2.play().catch(() => {});
        }, 200);
        setTimeout(() => {
          const beep3 = audio.cloneNode() as HTMLAudioElement;
          beep3.play().catch(() => {});
        }, 400);
      } else {
        soundClone.play().catch(() => {});
      }
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }, [soundEnabled]);

  // Add sound notification to queue with repeat logic
  const addSoundNotification = useCallback((type: 'new' | 'urgent', orderId: string) => {
    const notificationId = `${type}-${orderId}-${Date.now()}`;
    
    const notification: SoundNotification = {
      id: notificationId,
      type,
      timestamp: Date.now(),
      repeatCount: 0
    };

    setSoundQueue(prev => [...prev, notification]);
    
    // Play immediately
    playSound(type, notificationId);
    
    // Set up repeat timer (every 30 seconds, max 4 times = 2 minutes)
    const repeatTimer = setInterval(() => {
      setSoundQueue(prev => {
        const existing = prev.find(n => n.id === notificationId);
        if (!existing) {
          clearInterval(repeatTimer);
          soundTimersRef.current.delete(notificationId);
          return prev;
        }
        
        if (existing.repeatCount >= 3) { // 0, 1, 2, 3 = 4 times total over 2 minutes
          clearInterval(repeatTimer);
          soundTimersRef.current.delete(notificationId);
          return prev.filter(n => n.id !== notificationId);
        }
        
        playSound(type, notificationId);
        
        return prev.map(n => 
          n.id === notificationId 
            ? { ...n, repeatCount: n.repeatCount + 1 }
            : n
        );
      });
    }, 30000); // 30 seconds
    
    soundTimersRef.current.set(notificationId, repeatTimer);
  }, [playSound]);

  // Acknowledge all sounds
  const acknowledgeAllSounds = useCallback(() => {
    // Clear all timers
    soundTimersRef.current.forEach((timer) => {
      clearInterval(timer);
    });
    soundTimersRef.current.clear();
    
    // Clear queue
    setSoundQueue([]);
    
    toast.success('All notifications acknowledged');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundTimersRef.current.forEach((timer) => {
        clearInterval(timer);
      });
      soundTimersRef.current.clear();
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders?status=PENDING,PREPARING');
      if (!response.ok) return;
      const data = await response.json();
      const finalOrders = Array.isArray(data) ? data : [];
      
      // Detect new urgent additions or new orders to play sound
      const prev = previousOrdersRef.current;
      if (prev.length > 0) {
        let hasUrgent = false;
        let hasNew = false;
        const urgentOrderIds: string[] = [];
        const newOrderIds: string[] = [];

        finalOrders.forEach((order: any) => {
          const oldOrder = prev.find(o => o.id === order.id);
          if (!oldOrder) {
            hasNew = true;
            newOrderIds.push(order.id);
          } else if (order.items.length > oldOrder.items.length) {
            // Check if any item was added significantly after order creation
            const orderTime = new Date(order.createdAt).getTime();
            const hasUrgentItem = order.items.some((i: any) => {
              return new Date(i.createdAt).getTime() - orderTime > 60000; // > 1 min diff
            });
            if (hasUrgentItem) {
              hasUrgent = true;
              urgentOrderIds.push(order.id);
            } else {
              hasNew = true;
              newOrderIds.push(order.id);
            }
          }
        });

        if (hasUrgent) {
          toast.error('🔥 URGENT RUNNING TABLE ADDITION!', { duration: 5000 });
          urgentOrderIds.forEach(orderId => {
            addSoundNotification('urgent', orderId);
          });
        }
        
        if (hasNew) {
          toast.success('🔔 NEW ORDER RECEIVED', { duration: 3000 });
          newOrderIds.forEach(orderId => {
            addSoundNotification('new', orderId);
          });
        }
      }

      previousOrdersRef.current = finalOrders;
      setOrders(finalOrders);

      // Save to cache
      if (typeof window !== 'undefined') {
        (window as any).__pos_kds_cache = {
          orders: finalOrders
        };
      }
    } catch (error) {
      console.error('Error fetching KDS:', error);
    } finally {
      setLoading(false);
    }
  }, [addSoundNotification]);

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
      await fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    }, 2000); // 2 second aggressive polling when tab is active

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchOrders]);

  // Extract Urgent Additions
  const urgentAdditions: any[] = [];
  const normalOrders = orders.map(order => {
    const normalItems: any[] = [];
    const urgentItems: any[] = [];
    const orderTime = new Date(order.createdAt).getTime();
    
    order.items.forEach((item: any) => {
      const isUrgent = new Date(item.createdAt).getTime() - orderTime > 60000;
      if (isUrgent) {
        urgentItems.push(item);
      } else {
        normalItems.push(item);
      }
    });

    if (urgentItems.length > 0) {
      urgentAdditions.push({
        ...order,
        items: urgentItems
      });
    }

    return {
      ...order,
      items: normalItems
    };
  }).filter(o => o.items.length > 0);

  const dineIn = normalOrders.filter(o => o.orderType === 'DINE_IN');
  const takeaway = normalOrders.filter(o => o.orderType === 'TAKEAWAY');
  const delivery = normalOrders.filter(o => o.orderType === 'DELIVERY');

  const OrderCard = ({ order, type, icon: Icon, isUrgent = false }: any) => {
    const diffSecs = Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / 1000);
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    
    const timeColor = mins >= 10 ? 'text-red-500' : mins >= 5 ? 'text-amber-500' : 'text-green-500';
    
    // Determine which items are newly added (within last 5 seconds)
    const isItemNew = (itemCreatedAt: string) => {
      const itemTime = new Date(itemCreatedAt).getTime();
      const nowTime = now.getTime();
      return (nowTime - itemTime) < 5000; // 5 seconds
    };

    return (
      <Card className={`p-4 border-2 ${isUrgent ? 'bg-red-950 border-red-500 shadow-lg shadow-red-500/20' : 'bg-zinc-900 border-zinc-800'} flex flex-col justify-between h-full`}>
        <div>
          <div className={`flex justify-between items-start pb-3 border-b ${isUrgent ? 'border-red-800' : 'border-zinc-800'} mb-3`}>
            <div className="flex items-center gap-2">
              {Icon && <Icon className={`w-6 h-6 ${isUrgent ? 'text-red-500' : 'text-zinc-400'}`} />}
              <span className={`text-xl font-black ${isUrgent ? 'text-red-500' : 'text-white'}`}>
                {order.table ? `Table ${order.table.number}` : type}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-zinc-500 text-xs font-bold">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className={`text-sm font-black ${timeColor}`}>
                {mins.toString().padStart(2, '0')}m {secs.toString().padStart(2, '0')}s
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {order.items.map((item: any, i: number) => {
              const isNew = isItemNew(item.createdAt);
              const isCancelled = item.status === 'CANCELLED';
              
              return (
                <div 
                  key={i} 
                  className={`flex justify-between items-start ${
                    isNew ? 'animate-pulse bg-green-500/20 p-2 rounded-lg border-2 border-green-500' : ''
                  } ${
                    isCancelled ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="flex-1">
                    <p className={`font-bold text-lg ${
                      isCancelled 
                        ? 'text-red-400' 
                        : isUrgent 
                          ? 'text-red-100' 
                          : 'text-zinc-100'
                    }`}>
                      <span className={`${
                        isCancelled 
                          ? 'text-red-500' 
                          : isUrgent 
                            ? 'text-red-400' 
                            : 'text-primary'
                      } mr-2`}>
                        {isCancelled ? '❌' : ''}{item.quantity}×
                      </span>
                      {item.menuItem?.name || 'Unknown'}
                      {isNew && <span className="ml-2 text-xs font-black text-green-400 uppercase">NEW</span>}
                      {isCancelled && <span className="ml-2 text-xs font-black text-red-400 uppercase">CANCELLED</span>}
                    </p>
                    {item.portionType && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded inline-block mt-1 ${
                        isCancelled 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-primary/20 text-primary'
                      }`}>
                        {item.portionType}
                      </span>
                    )}
                    {item.specialInstructions && (
                      <p className={`text-sm mt-1 font-medium ${
                        isCancelled 
                          ? 'text-red-400' 
                          : isUrgent 
                            ? 'text-red-300' 
                            : 'text-zinc-400'
                      }`}>
                        📝 {item.specialInstructions}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap gap-2 items-center justify-between">
          <div>
            {order.status === 'PENDING' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-wider">
                🍳 Pending
              </span>
            ) : order.status === 'PREPARING' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-orange-500/10 border border-orange-500/20 text-orange-400 uppercase tracking-wider">
                🍳 Preparing
              </span>
            ) : null}
          </div>
          
          {isUrgent && (
            <div className="">
              <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl tracking-widest uppercase">
                RUNNING TABLE
              </span>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const showSkeletons = loading && orders.length === 0;

  return (
    <div className="min-h-screen bg-black p-6 overflow-x-hidden font-sans">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-zinc-800">
        <h1 className="text-4xl font-black text-white tracking-tight">KITCHEN DISPLAY</h1>
        <div className="flex gap-4 items-center">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
              soundEnabled 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' 
                : 'bg-red-900/20 border-red-500/50 text-red-400'
            }`}
            title={soundEnabled ? 'Sounds Enabled' : 'Sounds Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="font-bold text-sm tracking-wider">
              {soundEnabled ? 'SOUND ON' : 'MUTED'}
            </span>
          </button>

          {/* Acknowledge Button */}
          {soundQueue.length > 0 && (
            <button
              onClick={acknowledgeAllSounds}
              className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full border-2 border-amber-400 font-black text-sm tracking-wider uppercase shadow-lg shadow-amber-500/30 animate-pulse"
            >
              🔔 Acknowledge ({soundQueue.length})
            </button>
          )}

          {/* Live Indicator */}
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-zinc-300 font-bold text-sm tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Urgent Additions Row */}
        {urgentAdditions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-red-500 flex items-center gap-2">
              <Flame className="w-8 h-8" /> 
              URGENT ADDITIONS (RUNNING TABLES)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {urgentAdditions.map(order => (
                <OrderCard key={`${order.id}-urgent`} order={order} type="Dine In" icon={UtensilsCrossed} isUrgent={true} />
              ))}
            </div>
          </div>
        )}

        {/* Regular Queues */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Dine In */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-blue-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
              <UtensilsCrossed /> DINE IN ({dineIn.length})
            </h2>
            <div className="space-y-4">
              {showSkeletons ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                dineIn.map(order => <OrderCard key={order.id} order={order} type="Dine In" icon={UtensilsCrossed} />)
              )}
              {!showSkeletons && dineIn.length === 0 && <p className="text-zinc-600 font-bold italic">No active orders</p>}
            </div>
          </div>

          {/* Takeaway */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-amber-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
              <ShoppingBag /> TAKEAWAY ({takeaway.length})
            </h2>
            <div className="space-y-4">
              {showSkeletons ? (
                <SkeletonCard />
              ) : (
                takeaway.map(order => <OrderCard key={order.id} order={order} type="Takeaway" icon={ShoppingBag} />)
              )}
              {!showSkeletons && takeaway.length === 0 && <p className="text-zinc-600 font-bold italic">No active orders</p>}
            </div>
          </div>

          {/* Delivery */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-rose-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Bike /> DELIVERY ({delivery.length})
            </h2>
            <div className="space-y-4">
              {showSkeletons ? (
                <SkeletonCard />
              ) : (
                delivery.map(order => <OrderCard key={order.id} order={order} type="Delivery" icon={Bike} />)
              )}
              {!showSkeletons && delivery.length === 0 && <p className="text-zinc-600 font-bold italic">No active orders</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
