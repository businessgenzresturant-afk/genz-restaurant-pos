'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  UtensilsCrossed, 
  ClipboardList, 
  ChefHat, 
  ShoppingBag,
  Bike,
  Loader2,
  Receipt,
  BarChart3,
  Lock
} from 'lucide-react';
import { TableDrawer } from './TableDrawer';
import { MenuDrawer } from './MenuDrawer';
import { TableSelectModal } from './TableSelectModal';
// import { GuestCountModal } from './GuestCountModal'; // No longer needed
// import { CustomerDetailsModal } from './CustomerDetailsModal'; // No longer needed
import { TablesOccupiedModal } from './TablesOccupiedModal';
import { KitchenQueueModal } from './KitchenQueueModal';
import { TodayRevenueModal } from './TodayRevenueModal';
import { TakeawayDeliveryModal } from './TakeawayDeliveryModal';
import { TransferTableModal } from './TransferTableModal';
import { PaymentModal } from '@/components/billing/PaymentModal';
import { Portal } from '@/components/ui/portal';
import { toast } from 'sonner';
import { useAuth } from '@/lib/useAuth';

export function Dashboard() {
  const router = useRouter();
  const { isAdmin, isManager, isChef } = useAuth();
  
  const [tables, setTables] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && (window as any).__pos_cache?.tables) {
      return (window as any).__pos_cache.tables;
    }
    return [];
  });
  const [menuItems, setMenuItems] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && (window as any).__pos_cache?.menuItems) {
      return (window as any).__pos_cache.menuItems;
    }
    return [];
  });
  const [activeOrders, setActiveOrders] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && (window as any).__pos_cache?.activeOrders) {
      return (window as any).__pos_cache.activeOrders;
    }
    return [];
  });
  const [revenue, setRevenue] = useState(() => {
    if (typeof window !== 'undefined' && (window as any).__pos_cache?.revenue) {
      return (window as any).__pos_cache.revenue;
    }
    return 0;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && (window as any).__pos_cache?.tables) {
      return false;
    }
    return true;
  });

  // Modal / Drawer States
  const [isTableSelectModalOpen, setTableSelectModalOpen] = useState(false);
  const [isGuestCountModalOpen, setGuestCountModalOpen] = useState(false);
  // const [isCustomerDetailsModalOpen, setCustomerDetailsModalOpen] = useState(false); // Removed
  const [isTakeawayDeliveryModalOpen, setTakeawayDeliveryModalOpen] = useState(false);
  
  const [isTableDrawerOpen, setTableDrawerOpen] = useState(false);
  const [isMenuDrawerOpen, setMenuDrawerOpen] = useState(false);

  const [isTablesOccupiedModalOpen, setTablesOccupiedModalOpen] = useState(false);
  const [isKitchenQueueModalOpen, setKitchenQueueModalOpen] = useState(false);
  const [isTodayRevenueModalOpen, setTodayRevenueModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isTransferTableModalOpen, setTransferTableModalOpen] = useState(false);

  // Selected state
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [selectedActiveOrder, setSelectedActiveOrder] = useState<any | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<string>('DINE_IN');
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [generatedBill, setGeneratedBill] = useState<any | null>(null);

  // Removed dashboard click sound - sounds should ONLY play on KDS page
  // when actual new orders arrive, not on dashboard button clicks

  const fetchMenuData = useCallback(async () => {
    try {
      const menuRes = await fetch('/api/menu', { cache: 'no-store' });
      if (menuRes.ok) {
        const m = await menuRes.json();
        const validMenu = Array.isArray(m) ? m : [];
        setMenuItems(validMenu);
        if (typeof window !== 'undefined') {
          (window as any).__pos_cache = { ...(window as any).__pos_cache, menuItems: validMenu };
        }
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching menu data:', error);
    }
  }, []);

  const fetchReportsData = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const reportsRes = await fetch('/api/reports', { cache: 'no-store' });
      if (reportsRes.ok) {
        const r = await reportsRes.json();
        setRevenue(r.dailySalesTotal || 0);
        if (typeof window !== 'undefined') {
          (window as any).__pos_cache = { ...(window as any).__pos_cache, revenue: r.dailySalesTotal || 0 };
        }
      } else if (reportsRes.status === 401) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching reports data:', error);
    }
  }, [isAdmin]);

  const fetchCoreData = useCallback(async () => {
    try {
      const fetchPromises: Promise<Response>[] = [
        fetch('/api/tables', { cache: 'no-store' }),
        fetch('/api/orders?status=PENDING,PREPARING,READY,SERVED', { cache: 'no-store' })
      ];

      const responses = await Promise.all(fetchPromises);
      const [tablesRes, ordersRes] = responses;

      if (tablesRes.status === 401 || ordersRes.status === 401) {
        window.location.href = '/login';
        return;
      }

      const t = tablesRes.ok ? await tablesRes.json() : [];
      const o = ordersRes.ok ? await ordersRes.json() : [];

      const validTables = Array.isArray(t) ? t : [];
      const validOrders = Array.isArray(o) ? o : [];

      setTables(validTables);
      setActiveOrders(validOrders);

      if (typeof window !== 'undefined') {
        (window as any).__pos_cache = {
          ...(window as any).__pos_cache,
          tables: validTables,
          activeOrders: validOrders
        };
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching core data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    await Promise.all([
      fetchCoreData(),
      fetchReportsData(),
      menuItems.length === 0 ? fetchMenuData() : Promise.resolve()
    ]);
  }, [fetchCoreData, fetchReportsData, fetchMenuData, menuItems.length]);

  useEffect(() => {
    fetchData();
    // Core operational data every 10 seconds
    const coreInterval = setInterval(fetchCoreData, 10000);
    // Reports every 60 seconds
    const reportsInterval = setInterval(fetchReportsData, 60000);
    
    // Also refetch when the tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchCoreData();
        fetchReportsData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      clearInterval(coreInterval);
      clearInterval(reportsInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchData, fetchCoreData, fetchReportsData]);

  // Removed dashboard click sound preloading

  // Removed playClickSound function - no sounds on dashboard buttons

  const physicalTables = tables.filter(t => t.number < 1000).sort((a, b) => a.number - b.number);
  
  const occupiedTables = physicalTables.filter(t => {
    return activeOrders.some(o => o.tableId === t.id);
  }).length;
  
  const kitchenQueue = activeOrders.filter(o => ['PENDING', 'PREPARING'].includes(o.status)).length;
  
  const dineInOrders = activeOrders.filter(o => o.orderType === 'DINE_IN').length;
  const takeawayOrders = activeOrders.filter(o => o.orderType === 'TAKEAWAY').length;
  const deliveryOrders = activeOrders.filter(o => o.orderType === 'DELIVERY').length;

  const handleSelectTable = (table: any, isOccupied: boolean) => {
    setTableSelectModalOpen(false);
    setTablesOccupiedModalOpen(false);
    setSelectedTable(table);
    
    if (isOccupied) {
      setSelectedActiveOrder(null);
      setTableDrawerOpen(true);
    } else {
      setSelectedActiveOrder(null);
      setSelectedOrderType('DINE_IN');
      setMenuDrawerOpen(true);
    }
  };

  const closeTablesOccupiedModal = useCallback(() => {
    setTimeout(() => setTablesOccupiedModalOpen(false), 100);
  }, []);

  const closeKitchenQueueModal = useCallback(() => {
    setTimeout(() => setKitchenQueueModalOpen(false), 100);
  }, []);

  const closeTodayRevenueModal = useCallback(() => {
    setTimeout(() => setTodayRevenueModalOpen(false), 100);
  }, []);

  const handleManageOrder = (order: any) => {
    setKitchenQueueModalOpen(false);
    setTablesOccupiedModalOpen(false);
    
    if (order.tableId) {
      const tbl = tables.find(t => t.id === order.tableId);
      setSelectedTable(tbl || null);
      setSelectedActiveOrder(null);
    } else {
      setSelectedTable(null);
      setSelectedActiveOrder(order);
    }
    setTableDrawerOpen(true);
  };

  // Guest count modal removed - no longer needed
  // const handleGuestCountContinue = (details: any) => {
  //   setCustomerDetails(details);
  //   setGuestCountModalOpen(false);
  //   setSelectedOrderType('DINE_IN');
  //   setMenuDrawerOpen(true);
  // };

  const handleOrderTypeCardClick = (type: 'TAKEAWAY' | 'DELIVERY') => {
    setSelectedOrderType(type);
    setSelectedTable(null);
    setSelectedActiveOrder(null);
    setCustomerDetails(null);
    setTakeawayDeliveryModalOpen(true);
  };

  const handleNewOrderFromModal = () => {
    setTakeawayDeliveryModalOpen(false);
    setCustomerDetails(null);
    setMenuDrawerOpen(true);
  };

  const handleCustomerDetailsContinue = (details: any) => {
    setCustomerDetails(details);
    // setCustomerDetailsModalOpen(false); // Removed
    setMenuDrawerOpen(true);
  };

  const handlePlaceOrder = async (items: any[], action: 'SAVE' | 'SAVE_KDS' | 'SAVE_PRINT' | 'SAVE_EBILL' | 'SAVE_BILL' = 'SAVE') => {
    const toastId = toast.loading('🔥 Saving Order...', { duration: Infinity });
    
    // ⚡ OPTIMISTIC UI: Instantly close the drawer for standard "SAVE" to make UI feel 0ms fast
    if (action === 'SAVE' || action === 'SAVE_KDS') {
      setMenuDrawerOpen(false);
    }
    
    try {

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable?.id || null,
          orderType: selectedOrderType || 'DINE_IN',
          items,
          guests: null,
          customerName: customerDetails?.customerName || 'Walk-in Customer',
          customerPhone: customerDetails?.customerPhone || null,
          skipKds: action === 'SAVE', // True only if we ONLY want to save to dashboard without hitting KDS
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // 🔙 Revert optimistic UI if failed
        if (action === 'SAVE' || action === 'SAVE_KDS') setMenuDrawerOpen(true);
        throw new Error(errorData.error || 'Failed to place order');
      }
      
      const orderData = await response.json();
      
      // ⚡ Instantly notify KDS on same device (no poll wait needed)
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('pos_order_channel');
          bc.postMessage({ type: 'ORDER_SAVED', orderId: orderData.id });
          bc.close();
        }
      } catch (_) {}
      
      toast.success('✅ Done', { id: toastId, duration: 2000 });
      
      // Close drawer if it wasn't already closed optimistically
      if (action !== 'SAVE' && action !== 'SAVE_KDS') {
        setMenuDrawerOpen(false);
      }
      
      if (action === 'SAVE_PRINT') {
        import('@/lib/printUtils').then(({ printReceipt }) => {
          printReceipt({ ...orderData, order: orderData }, 'kot');
        });
      } else if (action === 'SAVE_BILL') {
        await handleGenerateBill(orderData.id);
      } else if (action === 'SAVE_EBILL') {
        // Mark as served
        await fetch(`/api/orders/${orderData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SERVED' })
        });
        
        // Generate bill
        const billResponse = await fetch('/api/bills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: orderData.id })
        });
        const newBill = await billResponse.json();
        
        // Send eBill via WhatsApp
        const phone = customerDetails?.customerPhone || '';
        const name = customerDetails?.customerName || 'Customer';
        const billTotal = newBill.total ? newBill.total.toFixed(2) : orderData.totalAmount.toFixed(2);
        
        const text = `Hi ${name}, thank you for your order!\n\nYour bill total is ₹${billTotal}.\n\nView your receipt here: https://pos.gen-z.online/receipt/${newBill.id || 'order-' + orderData.id}`;
        
        // Open WhatsApp in new tab
        const waUrl = `https://wa.me/${phone ? '91'+phone : ''}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
      }
      
      fetchData();
    } catch (err: any) {
      toast.error('❌ Failed: ' + (err.message || 'Try again'), { id: toastId });
      throw err;
    }
  };

  const handleGenerateBill = async (orderId: string) => {
    // ⚡ OPTIMISTIC UI: Close drawers INSTANTLY so UI doesn't feel stuck
    setTableDrawerOpen(false);
    setTakeawayDeliveryModalOpen(false);
    
    const toastId = toast.loading('🧾 Generating bill...', { duration: Infinity });
    
    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate bill');
      }
      
      const newBill = await response.json();
      toast.success('✅ Bill ready!', { id: toastId, duration: 2000 });
      
      
      // Open payment modal INSTANTLY
      setGeneratedBill(newBill);
      setPaymentModalOpen(true);
    } catch (err: any) {
      toast.error('❌ Failed: ' + (err.message || 'Try again'), { id: toastId, duration: 4000 });
      throw err;
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentModalOpen(false);
    setGeneratedBill(null);
    toast.success('Payment completed successfully! 🎉');
    // Refresh dashboard data
    await fetchData();
  };

  const handleQuickReorder = async (menuItemId: string, specialInstructions: string) => {
    if (!selectedActiveOrder && !selectedTable) return;
    
    const toastId = toast.loading('➕ Adding...', { duration: Infinity });
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable?.id || null,
          orderType: selectedActiveOrder?.orderType || 'DINE_IN',
          items: [{ menuItemId, quantity: 1, specialInstructions }]
        })
      });

      if (!response.ok) throw new Error('Failed to quick reorder');
      toast.success('✅ Item added!', { id: toastId, duration: 2000 });
      fetchData();
    } catch (err) {
      toast.error('❌ Failed to add', { id: toastId });
      throw err;
    }
  };

  const handleTransferTable = async (newTableId: string) => {
    try {
      if (!activeOrderForSelectedTable) return;
      const response = await fetch(`/api/orders/${activeOrderForSelectedTable.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTableId })
      });
      if (!response.ok) throw new Error('Failed to transfer table');
      toast.success('Table transferred successfully! 🔄');
      setTransferTableModalOpen(false);
      setTableDrawerOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to transfer table');
    }
  };

  const handleMarkAsServed = async (orderId: string) => {
    const toastId = toast.loading('✅ Marking served...', { duration: Infinity });
    
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SERVED' })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Mark as Served] Error response:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to mark as served');
      }
      
      toast.success('✅ Marked as served!', { id: toastId, duration: 2000 });
      setTableDrawerOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('[Mark as Served] Exception:', err);
      toast.error(`❌ ${err.message || 'Failed to mark as served'}`, { id: toastId });
      throw err;
    }
  };

  if (loading && tables.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="h-8 w-48 bg-muted rounded-md"></div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
            <div className="h-10 w-24 bg-muted rounded-md"></div>
            <div className="h-10 w-24 bg-muted rounded-md"></div>
            <div className="h-10 w-24 bg-muted rounded-md"></div>
          </div>
        </div>
        
        {/* Top Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl"></div>
          ))}
        </div>

        {/* Tables Grid Skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-muted rounded-md"></div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-24 sm:h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeOrderForSelectedTable = selectedActiveOrder 
    ? selectedActiveOrder 
    : (selectedTable ? activeOrders.find(o => o.tableId === selectedTable.id && ['PENDING', 'PREPARING', 'READY', 'SERVED'].includes(o.status)) : null);

  return (
    <div className="space-y-8 animate-fade-in pb-12 min-h-[75vh] flex flex-col justify-between">
      <div className="space-y-8">
        {/* Live Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
          <Card 
            role="button"
            tabIndex={0}
            onClick={() => setTablesOccupiedModalOpen(true)}
            className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 shadow-md shadow-blue-500/5 cursor-pointer hover:scale-[1.02] hover:border-blue-500/40 transition-all select-none group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-blue-700 dark:text-blue-400 opacity-90 uppercase tracking-wider group-hover:text-blue-500 transition-colors">Tables Occupied</p>
              <Users className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-4xl font-black text-blue-900 dark:text-blue-300 mt-2">{occupiedTables}/{physicalTables.length}</p>
          </Card>
          
          <Card 
            role="button"
            tabIndex={0}
            onClick={() => setKitchenQueueModalOpen(true)}
            className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 shadow-md shadow-orange-500/5 cursor-pointer hover:scale-[1.02] hover:border-orange-500/40 transition-all select-none group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-orange-700 dark:text-orange-400 opacity-90 uppercase tracking-wider group-hover:text-orange-500 transition-colors">Kitchen Queue</p>
              <ChefHat className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-4xl font-black text-orange-900 dark:text-orange-300 mt-2">{kitchenQueue}</p>
          </Card>
          
          <Card 
            role="button"
            tabIndex={0}
            onClick={() => {
              if (isAdmin || isManager) {
                setTodayRevenueModalOpen(true);
              } else {
                toast.error("Can't access, only admin access", { icon: <Lock className="w-4 h-4 text-red-500" /> });
              }
            }}
            className={`p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 shadow-md shadow-emerald-500/5 transition-all select-none group relative ${
              isAdmin || isManager 
                ? 'cursor-pointer hover:scale-[1.02] hover:border-emerald-500/40 active:scale-[0.99]' 
                : 'opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 opacity-90 uppercase tracking-wider group-hover:text-emerald-500 transition-colors">Today&apos;s Revenue</p>
              {!(isAdmin || isManager) ? (
                <Lock className="w-5 h-5 text-muted-foreground/60" />
              ) : (
                <span className="text-xl font-black text-emerald-500 group-hover:scale-110 transition-transform">₹</span>
              )}
            </div>
            <p className="text-4xl font-black text-emerald-900 dark:text-emerald-300 mt-2">
              {!(isAdmin || isManager) ? '---' : `₹${revenue.toLocaleString()}`}
            </p>
          </Card>
        </div>

        {/* Order Type Cards */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Select Order Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 stagger-children">
            
            {/* Dine In Card */}
            <button 
              onClick={() => {
                setTableSelectModalOpen(true);
              }}
              className="relative overflow-hidden p-6 rounded-3xl border border-border/60 bg-gradient-to-br from-slate-900 to-black flex flex-col justify-between items-start cursor-pointer hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 active:scale-[0.97] transition-all duration-300 text-left group min-h-[200px]"
            >
              {/* 3D Image Background */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-48 h-48 opacity-90 group-hover:scale-110 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-500 mix-blend-screen pointer-events-none">
                <img src="/images/dashboard/dine_in.png" alt="Dine In" className="w-full h-full object-contain" />
              </div>
              
              <div className="relative z-10 flex flex-col h-full justify-between w-full">
                <div className="flex justify-between items-start w-full">
                  <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl backdrop-blur-md border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <span className="font-black text-4xl text-white drop-shadow-lg group-hover:text-blue-400 transition-colors">{dineInOrders}</span>
                </div>
                <div className="mt-12">
                  <p className="font-black text-2xl text-white tracking-tight drop-shadow-md">Dine In</p>
                  <p className="text-sm text-gray-400 font-medium mt-1">Table Service</p>
                </div>
              </div>
            </button>

            {/* Takeaway Card */}
            <button 
              onClick={() => {
                handleOrderTypeCardClick('TAKEAWAY');
              }}
              className="relative overflow-hidden p-6 rounded-3xl border border-border/60 bg-gradient-to-br from-zinc-900 to-black flex flex-col justify-between items-start cursor-pointer hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 active:scale-[0.97] transition-all duration-300 text-left group min-h-[200px]"
            >
              {/* 3D Image Background */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-48 h-48 opacity-90 group-hover:scale-110 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-500 mix-blend-screen pointer-events-none">
                <img src="/images/dashboard/takeaway.png" alt="Takeaway" className="w-full h-full object-contain" />
              </div>
              
              <div className="relative z-10 flex flex-col h-full justify-between w-full">
                <div className="flex justify-between items-start w-full">
                  <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl backdrop-blur-md border border-amber-500/20 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <span className="font-black text-4xl text-white drop-shadow-lg group-hover:text-amber-400 transition-colors">{takeawayOrders}</span>
                </div>
                <div className="mt-12">
                  <p className="font-black text-2xl text-white tracking-tight drop-shadow-md">Takeaway</p>
                  <p className="text-sm text-gray-400 font-medium mt-1">Self Pickup</p>
                </div>
              </div>
            </button>

            {/* Delivery Card */}
            <button 
              onClick={() => {
                handleOrderTypeCardClick('DELIVERY');
              }}
              className="relative overflow-hidden p-6 rounded-3xl border border-border/60 bg-gradient-to-br from-stone-900 to-black flex flex-col justify-between items-start cursor-pointer hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-500/10 active:scale-[0.97] transition-all duration-300 text-left group min-h-[200px]"
            >
              {/* 3D Image Background */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-48 h-48 opacity-90 group-hover:scale-110 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-500 mix-blend-screen pointer-events-none">
                <img src="/images/dashboard/delivery.png" alt="Delivery" className="w-full h-full object-contain" />
              </div>
              
              <div className="relative z-10 flex flex-col h-full justify-between w-full">
                <div className="flex justify-between items-start w-full">
                  <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl backdrop-blur-md border border-rose-500/20 group-hover:scale-110 transition-transform">
                    <Bike className="w-6 h-6" />
                  </div>
                  <span className="font-black text-4xl text-white drop-shadow-lg group-hover:text-rose-400 transition-colors">{deliveryOrders}</span>
                </div>
                <div className="mt-12">
                  <p className="font-black text-2xl text-white tracking-tight drop-shadow-md">Delivery</p>
                  <p className="text-sm text-gray-400 font-medium mt-1">Direct to Door</p>
                </div>
              </div>
            </button>

          </div>
        </div>

        {/* System Modules Grid */}
        <div className="space-y-4 pt-6 border-t border-border/50">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">System Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* KDS Card */}
            <Link 
              href="/kds"
              className="relative overflow-hidden p-5 rounded-3xl border border-border/60 bg-gradient-to-br from-orange-950 to-black flex flex-col justify-between items-start cursor-pointer hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10 transition-all group min-h-[160px]"
            >
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-32 h-32 opacity-80 group-hover:scale-110 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-500 mix-blend-screen pointer-events-none">
                <img src="/images/dashboard/kds.png" alt="KDS" className="w-full h-full object-contain" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between w-full">
                <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl backdrop-blur-md border border-orange-500/20 group-hover:scale-110 transition-transform w-fit">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div className="mt-6 w-[70%]">
                  <h3 className="font-black text-xl text-white drop-shadow-md">Kitchen Display</h3>
                  <p className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">Monitor kitchen orders</p>
                </div>
              </div>
            </Link>

            {/* Bills Card */}
            <Link 
              href={isAdmin || isManager ? "/bills" : "#"}
              onClick={(e) => {
                if (!isAdmin && !isManager) {
                  e.preventDefault();
                  toast.error("Can't access, only admin access", { icon: <Lock className="w-4 h-4 text-red-500" /> });
                }
              }}
              className={`relative overflow-hidden p-5 rounded-3xl border border-border/60 flex flex-col justify-between items-start transition-all group min-h-[160px] ${
                isAdmin || isManager 
                  ? 'bg-gradient-to-br from-indigo-950 to-black cursor-pointer hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10' 
                  : 'bg-zinc-900/50 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-32 h-32 opacity-80 group-hover:scale-110 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-500 mix-blend-screen pointer-events-none">
                <img src="/images/dashboard/bills.png" alt="Bills" className="w-full h-full object-contain" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between w-full">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl backdrop-blur-md border border-indigo-500/20 group-hover:scale-110 transition-transform w-fit">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="mt-6 w-[70%]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-white drop-shadow-md">Bills & Receipts</h3>
                    {!(isAdmin || isManager) && <Lock className="w-4 h-4 text-muted-foreground/60" />}
                  </div>
                  <p className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">Generate guest invoices</p>
                </div>
              </div>
            </Link>

            {/* Orders Card */}
            <Link 
              href="/orders"
              className="relative overflow-hidden p-5 rounded-3xl border border-border/60 bg-gradient-to-br from-blue-950 to-black flex flex-col justify-between items-start cursor-pointer hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group min-h-[160px]"
            >
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-32 h-32 opacity-80 group-hover:scale-110 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-500 mix-blend-screen pointer-events-none">
                <img src="/images/dashboard/history.png" alt="History" className="w-full h-full object-contain" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between w-full">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl backdrop-blur-md border border-blue-500/20 group-hover:scale-110 transition-transform w-fit">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="mt-6 w-[70%]">
                  <h3 className="font-black text-xl text-white drop-shadow-md">Order History</h3>
                  <p className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">View and track orders</p>
                </div>
              </div>
            </Link>

            {/* Reports Card */}
            <Link 
              href={isAdmin || isManager ? "/reports" : "#"}
              onClick={(e) => {
                if (!isAdmin && !isManager) {
                  e.preventDefault();
                  toast.error("Can't access, only admin access", { icon: <Lock className="w-4 h-4 text-red-500" /> });
                }
              }}
              className={`relative overflow-hidden p-5 rounded-3xl border border-border/60 flex flex-col justify-between items-start transition-all group min-h-[160px] ${
                isAdmin || isManager 
                  ? 'bg-gradient-to-br from-emerald-950 to-black cursor-pointer hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10' 
                  : 'bg-zinc-900/50 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-32 h-32 opacity-80 group-hover:scale-110 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-500 mix-blend-screen pointer-events-none">
                <img src="/images/dashboard/reports.png" alt="Reports" className="w-full h-full object-contain" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between w-full">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl backdrop-blur-md border border-emerald-500/20 group-hover:scale-110 transition-transform w-fit">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="mt-6 w-[70%]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-white drop-shadow-md">Reports</h3>
                    {!(isAdmin || isManager) && <Lock className="w-4 h-4 text-muted-foreground/60" />}
                  </div>
                  <p className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">Analyze performance</p>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>

      {/* RAGSPRO Footer Branding */}
      <footer className="pt-8 mt-12 border-t border-border/60 text-center text-xs text-muted-foreground/60">
        <p>
          Gen-Z Restaurant POS &bull; Private Software designed & developed by{' '}
          <a href="https://ragspro.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-foreground transition-colors">
            RAGSPRO
          </a>
        </p>
      </footer>

      {/* Modals & Drawers */}
      <Portal>
        <TableSelectModal
          isOpen={isTableSelectModalOpen}
          onClose={() => setTableSelectModalOpen(false)}
          tables={tables}
          activeOrders={activeOrders}
          onSelectTable={handleSelectTable}
        />

        {/* Guest Count Modal removed - direct to menu */}
        {/* <GuestCountModal
          isOpen={isGuestCountModalOpen}
          onClose={() => setGuestCountModalOpen(false)}
          onBack={() => {
            setGuestCountModalOpen(false);
            setTableSelectModalOpen(true);
          }}
          tableNumber={selectedTable?.number || null}
          onContinue={handleGuestCountContinue}
        /> */}

        <TableDrawer 
          isOpen={isTableDrawerOpen} 
          onClose={() => setTableDrawerOpen(false)} 
          table={selectedTable}
          activeOrder={activeOrderForSelectedTable}
          onAddItem={() => {
            setTableDrawerOpen(false);
            setMenuDrawerOpen(true);
          }}
          onGenerateBill={handleGenerateBill}
          onQuickReorder={handleQuickReorder}
          onMarkAsServed={handleMarkAsServed}
          onTransferClick={() => setTransferTableModalOpen(true)}
          onRefresh={fetchData}
        />

        <TransferTableModal
          isOpen={isTransferTableModalOpen}
          onClose={() => setTransferTableModalOpen(false)}
          tables={tables}
          activeOrders={activeOrders}
          currentTableId={selectedTable?.id}
          onConfirmTransfer={handleTransferTable}
        />

        <MenuDrawer
          isOpen={isMenuDrawerOpen}
          onClose={() => {
            setMenuDrawerOpen(false);
            if (!selectedActiveOrder) {
              if (selectedOrderType === 'TAKEAWAY' || selectedOrderType === 'DELIVERY') {
                setTakeawayDeliveryModalOpen(true);
              } else {
                setTableSelectModalOpen(true);
              }
            } else {
              // Open TableDrawer if they were managing an active order
              setTableDrawerOpen(true);
            }
          }}
          menuItems={menuItems}
          tableId={selectedTable?.id || null}
          onPlaceOrder={handlePlaceOrder}
        />

        <TablesOccupiedModal
          isOpen={isTablesOccupiedModalOpen}
          onClose={closeTablesOccupiedModal}
          tables={tables}
          activeOrders={activeOrders}
          onSelectTable={handleSelectTable}
        />

        <KitchenQueueModal
          isOpen={isKitchenQueueModalOpen}
          onClose={closeKitchenQueueModal}
          activeOrders={activeOrders}
          onManageOrder={handleManageOrder}
        />

        <TodayRevenueModal
          isOpen={isTodayRevenueModalOpen}
          onClose={closeTodayRevenueModal}
          todayRevenue={revenue}
        />

        <TakeawayDeliveryModal
          isOpen={isTakeawayDeliveryModalOpen}
          onClose={() => setTakeawayDeliveryModalOpen(false)}
          type={selectedOrderType === 'DELIVERY' ? 'DELIVERY' : 'TAKEAWAY'}
          activeOrders={activeOrders.filter(o => o.orderType === selectedOrderType)}
          onNewOrder={handleNewOrderFromModal}
          onGenerateBill={handleGenerateBill}
        />

        {/* Payment Modal - Opens after Generate Bill */}
        {generatedBill && (
          <PaymentModal
            bill={generatedBill}
            isOpen={isPaymentModalOpen}
            onClose={() => {
              setPaymentModalOpen(false);
              setGeneratedBill(null);
            }}
            onPaymentSuccess={handlePaymentSuccess}
            onAddItem={() => {
              setPaymentModalOpen(false);
              setMenuDrawerOpen(true);
            }}
            onRefreshBill={() => {
              if (generatedBill?.orderId) {
                handleGenerateBill(generatedBill.orderId);
              }
            }}
          />
        )}
      </Portal>
    </div>
  );
}