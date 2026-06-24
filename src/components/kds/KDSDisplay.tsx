'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
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
  <div className="p-4 bg-muted/50 border border-border rounded-2xl space-y-4 animate-pulse">
    <div className="flex justify-between items-center pb-3 border-b border-border">
      <div className="h-6 w-24 bg-muted rounded-lg" />
      <div className="h-4 w-12 bg-muted rounded-lg" />
    </div>
    <div className="space-y-2">
      <div className="h-5 w-5/6 bg-muted rounded-lg" />
      <div className="h-4 w-1/2 bg-muted/50 rounded-lg" />
    </div>
    <div className="pt-3 border-t border-border">
      <div className="h-9 w-full bg-muted rounded-xl" />
    </div>
  </div>
);

interface KDSDisplayProps {
  restaurantId: string;
  readOnly?: boolean;
  enableReconnect?: boolean;
}

export default function KDSDisplay({ restaurantId, readOnly = false, enableReconnect = false }: KDSDisplayProps) {
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
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
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
    if (!soundEnabled) {
      console.log('🔇 Sound disabled, skipping');
      return;
    }
    
    try {
      const audio = type === 'new' ? audioContextRef.current.new : audioContextRef.current.urgent;
      if (!audio) {
        console.error('❌ Audio element not found for type:', type);
        return;
      }
      
      console.log(`🔊 Playing ${type} sound`);
      
      // Clone the audio to allow overlapping sounds
      const soundClone = audio.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.7; // Set volume
      
      if (type === 'urgent') {
        // Play 3 quick beeps for urgent
        soundClone.play().catch((e) => console.error('Sound play error:', e));
        setTimeout(() => {
          const beep2 = audio.cloneNode() as HTMLAudioElement;
          beep2.volume = 0.7;
          beep2.play().catch(() => {});
        }, 300);
        setTimeout(() => {
          const beep3 = audio.cloneNode() as HTMLAudioElement;
          beep3.volume = 0.7;
          beep3.play().catch(() => {});
        }, 600);
      } else {
        soundClone.play().catch((e) => console.error('Sound play error:', e));
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
      if (!response.ok) {
        if (enableReconnect) {
          setFailureCount(prev => prev + 1);
          if (failureCount > 2) {
            setIsReconnecting(true);
          }
        }
        return;
      }
      
      // Reset failure count on success
      if (enableReconnect) {
        setFailureCount(0);
        setIsReconnecting(false);
      }
      
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
          const oldOrder = prev.find((o: any) => o.id === order.id);
          
          const hasUrgentInstruction = order.items.some((item: any) => 
            item.specialInstructions && item.specialInstructions.includes('[URGENT ADDITION]')
          );

          // Case 1: Completely new order
          if (!oldOrder) {
            if (hasUrgentInstruction) {
              hasUrgent = true;
              urgentOrderIds.push(order.id);
              console.log('🔥 URGENT NEW order detected:', order.id);
            } else {
              hasNew = true;
              newOrderIds.push(order.id);
              console.log('🆕 New order detected:', order.id, order.table?.number || 'No table');
            }
          } 
          // Case 2: Existing order with more items (Running Table)
          else if (order.items.length > oldOrder.items.length) {
            const newItemsCount = order.items.length - oldOrder.items.length;
            console.log(`🔥 Running table: Order ${order.id} (Table ${order.table?.number || 'N/A'}) has ${newItemsCount} new items`);
            console.log(`   Old items: ${oldOrder.items.length}, New items: ${order.items.length}`);
            console.log(`   Order status: ${order.status}`);
            
            hasUrgent = true;
            urgentOrderIds.push(order.id);
          }
          // Case 3: New order on same table as a recently SERVED order (within 5 mins)
          else if (!oldOrder && order.tableId) {
            const recentlyServedOrder = prev.find((o: any) => 
              o.tableId === order.tableId && 
              o.status === 'SERVED' &&
              (new Date().getTime() - new Date(o.updatedAt || o.createdAt).getTime() < 5 * 60 * 1000)
            );
            
            if (recentlyServedOrder) {
              console.log(`🔥 NEW order on recently served table ${order.table?.number}: This is a running table!`);
              console.log(`   Previous order ${recentlyServedOrder.id} was served ${Math.floor((new Date().getTime() - new Date(recentlyServedOrder.updatedAt || recentlyServedOrder.createdAt).getTime()) / 1000)}s ago`);
              hasUrgent = true;
              urgentOrderIds.push(order.id);
            }
          }
        });

        if (hasUrgent) {
          console.log('🔥 URGENT: Running table additions detected!');
          toast.error('🔥 URGENT RUNNING TABLE ADDITION!', { duration: 5000 });
          urgentOrderIds.forEach(orderId => {
            addSoundNotification('urgent', orderId);
          });
        }
        
        if (hasNew) {
          console.log('🔔 NEW: Fresh orders detected!');
          toast.success('🔔 NEW ORDER RECEIVED', { duration: 3000 });
          newOrderIds.forEach(orderId => {
            addSoundNotification('new', orderId);
          });
        }
      } else {
        // First load - don't play sound for existing orders
        console.log('📊 Initial load - no sound played');
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
      if (enableReconnect) {
        setFailureCount(prev => prev + 1);
        if (failureCount > 2) {
          setIsReconnecting(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [addSoundNotification, enableReconnect, failureCount]);

  useEffect(() => {
    // Initial fetch
    fetchOrders();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 Tab visible, fetching orders...');
        fetchOrders();
      }
    };

    // Handle browser online event for TV reconnection
    const handleOnline = () => {
      if (enableReconnect) {
        console.log('🌐 Network back online, fetching orders...');
        setIsReconnecting(false);
        setFailureCount(0);
        fetchOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (enableReconnect) {
      window.addEventListener('online', handleOnline);
    }

    // More aggressive polling - every 3 seconds when active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    }, 3000); // 3 seconds

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (enableReconnect) {
        window.removeEventListener('online', handleOnline);
      }
    };
  }, [fetchOrders, enableReconnect]);

  // Extract Urgent Additions & categorize orders
  const urgentAdditions: any[] = [];
  const normalOrders = orders.map(order => {
    const normalItems: any[] = [];
    const urgentItems: any[] = [];
    const orderTime = new Date(order.createdAt).getTime();
    
    // Find the earliest item creation time
    let earliestItemTime = orderTime;
    if (order.items.length > 0) {
      earliestItemTime = Math.min(
        ...order.items.map((i: any) => new Date(i.createdAt).getTime())
      );
    }
    
    order.items.forEach((item: any) => {
      const itemTime = new Date(item.createdAt).getTime();
      // Item is "urgent" if it was added more than 2 minutes after the earliest item
      const isUrgent = (itemTime - earliestItemTime > 120000) || (item.specialInstructions && item.specialInstructions.includes('[URGENT ADDITION]'));
      
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

  // Count by order type
  const dineInCount = normalOrders.filter(o => o.orderType === 'DINE_IN').length;
  const takeawayCount = normalOrders.filter(o => o.orderType === 'TAKEAWAY').length;
  const deliveryCount = normalOrders.filter(o => o.orderType === 'DELIVERY').length;

  // Sort all orders by creation time (oldest first)
  const allOrdersSorted = [...normalOrders].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const OrderCard = ({ order, isUrgent = false }: any) => {
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

    // Determine badge color and icon based on order type
    const getOrderTypeBadge = () => {
      switch (order.orderType) {
        case 'DINE_IN':
          return { label: 'DINE IN', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: UtensilsCrossed };
        case 'TAKEAWAY':
          return { label: 'TAKEAWAY', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: ShoppingBag };
        case 'DELIVERY':
          return { label: 'DELIVERY', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: Bike };
        default:
          return { label: 'ORDER', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', icon: Package };
      }
    };

    const badge = getOrderTypeBadge();
    const BadgeIcon = badge.icon;

    return (
      <Card className={`p-4 border-2 ${isUrgent ? 'bg-red-950 border-red-500 shadow-lg shadow-red-500/20' : 'bg-card border-border'} flex flex-col justify-between h-full hover:shadow-xl hover:shadow-border/10 transition-all active:scale-[0.98]`}>
        <div>
          {/* Order Type Badge */}
          <div className="mb-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${badge.color} uppercase tracking-wider`}>
              <BadgeIcon className="w-3.5 h-3.5" />
              {badge.label}
            </span>
          </div>

          <div className={`flex justify-between items-start pb-3 border-b ${isUrgent ? 'border-red-800' : 'border-border'} mb-3`}>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-black ${isUrgent ? 'text-red-500' : 'text-foreground'}`}>
                {order.table ? `Table ${order.table.number}` : `#${order.id.slice(-4).toUpperCase()}`}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs font-bold">
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
                          : 'text-foreground'
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
                            : 'text-muted-foreground'
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
        
        <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2 items-center justify-between">
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
            <div className="flex-1 flex justify-end">
              <span className="bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-black px-4 py-2 rounded-xl tracking-widest uppercase shadow-lg shadow-red-500/50 animate-pulse border-2 border-red-400">
                🔥 URGENT
              </span>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const showSkeletons = loading && orders.length === 0;

  const handleStartKDS = () => {
    setHasInteracted(true);
    // Silent play to unlock audio context
    if (audioContextRef.current.new) {
      audioContextRef.current.new.play().catch(() => {});
      audioContextRef.current.new.pause();
    }
    if (audioContextRef.current.urgent) {
      audioContextRef.current.urgent.play().catch(() => {});
      audioContextRef.current.urgent.pause();
    }
  };

  if (!hasInteracted) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center cursor-pointer" onClick={handleStartKDS}>
        <div className="bg-card p-12 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.2)] text-center border-4 border-primary hover:scale-105 transition-transform duration-300">
          <div className="bg-primary/20 p-6 rounded-full inline-block mb-6 animate-pulse">
            <Volume2 className="w-20 h-20 text-primary" />
          </div>
          <h2 className="text-4xl font-black mb-4">Click anywhere to start KDS</h2>
          <p className="text-xl text-muted-foreground font-bold">This enables order notification sounds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 overflow-x-hidden font-sans">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-border">
        <h1 className="text-4xl font-black text-foreground tracking-tight">KITCHEN DISPLAY</h1>
        <div className="flex gap-4 items-center">
          {/* Reconnecting Indicator */}
          {isReconnecting && enableReconnect && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-full">
              <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-400 font-bold text-sm tracking-wider">Reconnecting...</span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all active:scale-[0.95] ${
              soundEnabled 
                ? 'bg-muted border-border text-muted-foreground hover:bg-muted/80' 
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
          {soundQueue.length > 0 && !readOnly && (
            <button
              onClick={acknowledgeAllSounds}
              className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full border-2 border-amber-400 font-black text-sm tracking-wider uppercase shadow-lg shadow-amber-500/30 animate-pulse active:scale-[0.95] transition-transform"
            >
              🔔 Acknowledge ({soundQueue.length})
            </button>
          )}

          {/* Live Indicator */}
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full border border-border">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-muted-foreground font-bold text-sm tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Urgent Additions Row - Only shown if there are urgent items */}
        {urgentAdditions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-red-500 flex items-center gap-2">
              <Flame className="w-8 h-8" /> 
              URGENT ORDERS & ADDITIONS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
              {urgentAdditions.map(order => (
                <OrderCard key={`${order.id}-urgent`} order={order} isUrgent={true} />
              ))}
            </div>
          </div>
        )}

        {/* Category Summary - Compact single line */}
        {!showSkeletons && allOrdersSorted.length > 0 && (
          <div className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground font-bold">Active Orders:</span>
            <span className="text-blue-400 font-bold flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4" />
              Dine In: {dineInCount}
            </span>
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              Takeaway: {takeawayCount}
            </span>
            <span className="text-rose-400 font-bold flex items-center gap-1.5">
              <Bike className="w-4 h-4" />
              Delivery: {deliveryCount}
            </span>
          </div>
        )}

        {/* Unified Grid - All Orders Sorted by Time (Oldest First) - TV OPTIMIZED */}
        {showSkeletons ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : allOrdersSorted.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
            {allOrdersSorted.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-xl font-bold">No active orders</p>
          </div>
        )}

      </div>
    </div>
  );
}
