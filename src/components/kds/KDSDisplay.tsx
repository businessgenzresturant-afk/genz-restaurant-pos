'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Flame, UtensilsCrossed, ShoppingBag, Bike, Package, Volume2, VolumeX, Printer, X, ClipboardList } from 'lucide-react';
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
  autoStart?: boolean; // TV mode - skip interaction requirement
}

export default function KDSDisplay({ restaurantId, readOnly = false, enableReconnect = false, autoStart = false }: KDSDisplayProps) {
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
  const [soundEnabled, setSoundEnabled] = useState(true); // Default to true, catch errors if browser blocks autoplay
  const [hasInteracted, setHasInteracted] = useState(autoStart); // Skip interaction requirement overlay in TV mode
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [selectedOrderSummary, setSelectedOrderSummary] = useState<any | null>(null);
  // 🔧 BUG-07 FIX: Use ref instead of state for failureCount.
  // useState caused fetchOrders to be recreated on every failure (it was in the dep array),
  // which tore down and restarted the polling interval on EVERY network error.
  // useRef lets us mutate the count without triggering re-renders or dep-array changes.
  const failureCountRef = useRef(0);
  const previousOrdersRef = useRef<any[]>([]);
  const soundTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const audioContextRef = useRef<{ new: HTMLAudioElement | null; urgent: HTMLAudioElement | null }>({
    new: null,
    urgent: null
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(timer);
    };
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
      if (!audio) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Audio element not found for type:', type);
        }
        return;
      }
      
      // Clone the audio to allow overlapping sounds
      const soundClone = audio.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.7;
      
      if (type === 'urgent') {
        // Play 3 quick beeps for urgent
        soundClone.play().catch((e) => {
          if (process.env.NODE_ENV === 'development') console.error('Sound play error:', e);
        });
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
        soundClone.play().catch((e) => {
          if (process.env.NODE_ENV === 'development') console.error('Sound play error:', e);
        });
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error playing sound:', e);
      }
    }
  }, [soundEnabled]);

  // Add sound notification (plays exactly once per order/urgent addition)
  const addSoundNotification = useCallback((type: 'new' | 'urgent', orderId: string) => {
    // Play immediately
    playSound(type);
  }, [playSound]);

  // Acknowledge all sounds
  const acknowledgeAllSounds = useCallback(() => {
    // Clear all timers
    soundTimersRef.current.forEach((timer) => {
      clearInterval(timer);
    });
    soundTimersRef.current.clear();
    
    // Clear timers
    soundTimersRef.current.forEach((timer) => {
      clearInterval(timer);
    });
    soundTimersRef.current.clear();
    
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
      let signal;
      let timeoutId;
      
      // Fallback for old TV browsers that don't support AbortController
      if (typeof AbortController !== 'undefined') {
        const controller = new AbortController();
        signal = controller.signal;
        timeoutId = setTimeout(() => controller.abort(), 8000); // 8s max
      }
      
      const url = `/api/kds-orders?restaurantId=${restaurantId}&status=PENDING,PREPARING&_t=${Date.now()}`;
      
      const response = await fetch(url, {
        signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'omit'
      });
      
      if (timeoutId) clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[KDS] API error: ${response.status} ${response.statusText}`);
        }
        
        if (enableReconnect) {
          failureCountRef.current += 1;
          
          if (failureCountRef.current > 5) {
            setIsReconnecting(true);
          }
        }
        return;
      }
      
      if (enableReconnect) {
        failureCountRef.current = 0;
        setIsReconnecting(false);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[KDS] Invalid JSON response:', jsonError);
        }
        return;
      }
      
      const finalOrders = Array.isArray(data) ? data : [];
      
      const validOrders = finalOrders.filter((order: any) => {
        if (!order || !order.id) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[KDS] Invalid order (no ID):', order);
          }
          return false;
        }
        if (!Array.isArray(order.items)) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[KDS] Invalid order (no items array):', order.id);
          }
          return false;
        }
        return true;
      });
      
      // Detect new urgent additions or new orders to play sound
      const prev = previousOrdersRef.current;
      if (prev.length > 0) {
        let hasUrgent = false;
        let hasNew = false;
        const urgentOrderIds: string[] = [];
        const newOrderIds: string[] = [];

        validOrders.forEach((order: any) => {
          const oldOrder = prev.find((o: any) => o.id === order.id);
          
          const hasUrgentInstruction = order.items.some((item: any) => 
            item.specialInstructions && item.specialInstructions.includes('[URGENT ADDITION]')
          );

          if (!oldOrder) {
            // Case 1: Completely new order
            if (hasUrgentInstruction) {
              hasUrgent = true;
              urgentOrderIds.push(order.id);
            } else {
              hasNew = true;
              newOrderIds.push(order.id);
            }
          } else {
            // Case 2: Existing order — check if NEW items were added (Running Table)
            // Compare by item IDs: any item in current order not in previous snapshot = new addition
            const oldItemIds = new Set(oldOrder.items.map((i: any) => i.id));
            const hasNewItems = order.items.some((item: any) => !oldItemIds.has(item.id));
            if (hasNewItems) {
              hasUrgent = true;
              urgentOrderIds.push(order.id);
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

      previousOrdersRef.current = validOrders;
      setOrders(validOrders);

      if (typeof window !== 'undefined') {
        (window as any).__pos_kds_cache = {
          orders: validOrders
        };
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[KDS] Fetch error:', error);
        
        if (error.name === 'AbortError') {
          console.error('[KDS] Fetch timeout after 30s');
        } else if (error.message && error.message.includes('Failed to fetch')) {
          console.error('[KDS] Network error - check internet connection');
        } else {
          console.error('[KDS] Unexpected error:', error.message || error);
        }
      }
      
      if (enableReconnect) {
          failureCountRef.current += 1;
          
          if (failureCountRef.current > 5) {
            setIsReconnecting(true);
          }
        }
    } finally {
      setLoading(false);
    }
  }, [restaurantId, addSoundNotification, enableReconnect]);

  useEffect(() => {
    fetchOrders();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    };

    // Handle browser online event for TV reconnection
    const handleOnline = () => {
      if (enableReconnect) {
        console.log('🌐 Network back online, fetching orders...');
        setIsReconnecting(false);
        failureCountRef.current = 0;
        fetchOrders();
      }
    };

    // ⚡ BroadcastChannel: instant KDS refresh when order is placed from same device
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('pos_order_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'ORDER_SAVED') {
          fetchOrders();
        }
      };
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (enableReconnect) {
      window.addEventListener('online', handleOnline);
    }

    // Poll every 2s (was 5s) for faster kitchen updates
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      bc?.close();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (enableReconnect) {
        window.removeEventListener('online', handleOnline);
      }
    };
  }, [fetchOrders, enableReconnect]);

  // Extract Urgent Additions & categorize orders
  const urgentAdditions: any[] = [];
  const normalOrders = orders.map(order => {
    if (!order || !order.id || !Array.isArray(order.items)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[KDS] Skipping invalid order:', order);
      }
      return null;
    }
    
    const normalItems: any[] = [];
    const urgentItems: any[] = [];
    
    // Get the previous snapshot of this order (from last poll) for item comparison
    const prevOrder = previousOrdersRef.current.find((o: any) => o.id === order.id);
    const prevItemIds: Set<string> = prevOrder
      ? new Set(prevOrder.items.map((i: any) => i.id))
      : new Set();
    
    // An item is "urgent" if:
    // 1. It was added AFTER the order was already on the KDS (prevOrder exists but item is new)
    // 2. OR it has [URGENT ADDITION] special instruction
    order.items.forEach((item: any) => {
      if (!item || !item.menuItem) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[KDS] Skipping invalid item in order:', order.id);
        }
        return;
      }
      
      const isNewAddition = prevOrder !== undefined && !prevItemIds.has(item.id);
      const isUrgentInstruction = item.specialInstructions && item.specialInstructions.includes('[URGENT ADDITION]');
      const isUrgent = isNewAddition || isUrgentInstruction;
      
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

    // If ALL items are urgent (first-time additions), show the order in both urgent + normal
    // If some normal items remain, show them in normal section too
    return normalItems.length > 0 ? { ...order, items: normalItems } : null;
  }).filter(o => o !== null && o.items.length > 0);

  // Count by order type
  const dineInCount = normalOrders.filter(o => o.orderType === 'DINE_IN').length;
  const takeawayCount = normalOrders.filter(o => o.orderType === 'TAKEAWAY').length;
  const deliveryCount = normalOrders.filter(o => o.orderType === 'DELIVERY').length;

  // Sort all orders by creation time (oldest first)
  const allOrdersSorted = [...normalOrders].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const OrderCard = ({ order, isUrgent = false }: any) => {
    if (!order || !order.id) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[KDS] OrderCard received invalid order');
      }
      return null;
    }
    
    let diffSecs = 0;
    try {
      const createdTime = new Date(order.createdAt).getTime();
      if (!isNaN(createdTime)) {
        diffSecs = Math.floor((now.getTime() - createdTime) / 1000);
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[KDS] Date calculation error for order:', order.id);
      }
    }
    
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
                    {item.specialInstructions && item.specialInstructions.replace('[URGENT ADDITION]', '').trim() && (
                      <p className={`text-sm mt-1 font-medium ${
                        isCancelled 
                          ? 'text-red-400' 
                          : isUrgent 
                            ? 'text-red-300' 
                            : 'text-muted-foreground'
                      }`}>
                        📝 {item.specialInstructions.replace('[URGENT ADDITION]', '').trim()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-border space-y-2">
          <div className="flex flex-wrap gap-2 items-center justify-between">
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
          {/* KOT Actions Row */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedOrderSummary(order)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-[0.97]"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Details
            </button>
            <button
              onClick={() => {
                import('@/lib/printUtils').then(({ printReceipt }) => {
                  printReceipt(order, 'kot');
                });
                toast.success('KOT sent to printer!');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-[0.97]"
            >
              <Printer className="w-3.5 h-3.5" />
              Print KOT
            </button>
          </div>
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
      <div 
        className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 z-50 flex items-center justify-center cursor-pointer"
        onClick={handleStartKDS}
        style={{ touchAction: 'manipulation' }}
      >
        <div className="w-full h-full flex items-center justify-center p-8">
          <div className="bg-card p-16 md:p-24 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] text-center border-8 border-primary max-w-4xl w-full">
            <div className="bg-primary/20 p-10 rounded-full inline-block mb-10 animate-pulse">
              <Volume2 className="w-32 h-32 md:w-40 md:h-40 text-primary" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
              Click anywhere to start KDS
            </h2>
            <p className="text-2xl md:text-4xl text-muted-foreground font-bold">
              This enables order notification sounds
            </p>
            <div className="mt-12 pt-8 border-t-4 border-border">
              <p className="text-xl md:text-2xl text-primary font-bold animate-bounce">
                👆 TAP SCREEN TO START
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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

    {/* Order Summary Popup - MUST be inside return wrapper */}
    {selectedOrderSummary && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={() => setSelectedOrderSummary(null)}
      >
        <div
          className="bg-card border-2 border-border rounded-3xl shadow-2xl w-full max-w-sm p-6 relative"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setSelectedOrderSummary(null)}
            className="absolute top-4 right-4 p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="mb-4">
            <h2 className="text-2xl font-black text-foreground">
              {selectedOrderSummary.table ? `Table ${selectedOrderSummary.table.number}` : `#${selectedOrderSummary.id.slice(-6).toUpperCase()}`}
            </h2>
            <p className="text-sm text-muted-foreground font-bold mt-1">
              {selectedOrderSummary.orderType.replace('_', ' ')} &bull; {new Date(selectedOrderSummary.createdAt).toLocaleTimeString()}
            </p>
          </div>

          <div className="space-y-2 mb-5 max-h-72 overflow-y-auto">
            {selectedOrderSummary.items.filter((i: any) => i.status !== 'CANCELLED').map((item: any, idx: number) => (
              <div key={idx} className="flex items-start justify-between gap-2 p-2 rounded-xl bg-muted/40">
                <div>
                  <p className="font-bold text-sm text-foreground">
                    <span className="text-primary font-black mr-1.5">{item.quantity}×</span>
                    {item.menuItem?.name || 'Item'}
                  </p>
                  {item.portionType && (
                    <span className="text-xs text-primary/70 font-semibold">{item.portionType}</span>
                  )}
                  {item.specialInstructions && item.specialInstructions.replace('[URGENT ADDITION]', '').trim() && (
                    <p className="text-xs text-muted-foreground mt-0.5">📝 {item.specialInstructions.replace('[URGENT ADDITION]', '').trim()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-border pt-4">
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black border uppercase tracking-wider ${
              selectedOrderSummary.status === 'PENDING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
            }`}>
              🍳 {selectedOrderSummary.status}
            </span>
            <button
              onClick={() => {
                import('@/lib/printUtils').then(({ printReceipt }) => {
                  printReceipt(selectedOrderSummary, 'kot');
                });
                toast.success('KOT sent to printer!');
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              Reprint KOT
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
