'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  UtensilsCrossed, 
  ClipboardList, 
  ChefHat, 
  ShoppingBag,
  Package,
  Bike,
  Loader2,
  Receipt,
  BarChart3
} from 'lucide-react';
import { TableDrawer } from './TableDrawer';
import { MenuDrawer } from './MenuDrawer';
import { TableSelectModal } from './TableSelectModal';
import { GuestCountModal } from './GuestCountModal';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { TablesOccupiedModal } from './TablesOccupiedModal';
import { KitchenQueueModal } from './KitchenQueueModal';
import { TodayRevenueModal } from './TodayRevenueModal';
import { toast } from 'sonner';

export function Dashboard() {
  const [tables, setTables] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal / Drawer States
  const [isTableSelectModalOpen, setTableSelectModalOpen] = useState(false);
  const [isGuestCountModalOpen, setGuestCountModalOpen] = useState(false);
  const [isCustomerDetailsModalOpen, setCustomerDetailsModalOpen] = useState(false);
  
  const [isTableDrawerOpen, setTableDrawerOpen] = useState(false);
  const [isMenuDrawerOpen, setMenuDrawerOpen] = useState(false);

  const [isTablesOccupiedModalOpen, setTablesOccupiedModalOpen] = useState(false);
  const [isKitchenQueueModalOpen, setKitchenQueueModalOpen] = useState(false);
  const [isTodayRevenueModalOpen, setTodayRevenueModalOpen] = useState(false);

  // Selected state
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [selectedActiveOrder, setSelectedActiveOrder] = useState<any | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<string>('DINE_IN');
  const [customerDetails, setCustomerDetails] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [tablesRes, ordersRes, reportsRes, menuRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/orders?status=PENDING,PREPARING,READY,SERVED'),
        fetch('/api/reports'),
        fetch('/api/menu'),
      ]);

      // Handle auth errors gracefully - redirect to login
      if (tablesRes.status === 401) {
        window.location.href = '/login';
        return;
      }

      const t = tablesRes.ok ? await tablesRes.json() : [];
      setTables(Array.isArray(t) ? t : []);

      const o = ordersRes.ok ? await ordersRes.json() : [];
      setActiveOrders(Array.isArray(o) ? o : []);

      if (reportsRes.ok) {
        const r = await reportsRes.json();
        setRevenue(r.dailySalesTotal || 0);
      }

      const m = menuRes.ok ? await menuRes.json() : [];
      setMenuItems(Array.isArray(m) ? m : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 3 seconds for live updates as requested by user
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const physicalTables = tables.filter(t => t.number < 1000).sort((a, b) => a.number - b.number);
  
  const occupiedTables = physicalTables.filter(t => {
    const hasOrder = activeOrders.some(o => o.tableId === t.id);
    return t.status === 'OCCUPIED' || hasOrder;
  }).length;
  
  const kitchenQueue = activeOrders.filter(o => ['PENDING', 'PREPARING'].includes(o.status)).length;
  
  const dineInOrders = activeOrders.filter(o => o.orderType === 'DINE_IN').length;
  const takeawayOrders = activeOrders.filter(o => o.orderType === 'TAKEAWAY').length;
  const parcelOrders = activeOrders.filter(o => o.orderType === 'PARCEL').length;
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
      setGuestCountModalOpen(true);
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

  const handleGuestCountContinue = (details: any) => {
    setCustomerDetails(details);
    setGuestCountModalOpen(false);
    setSelectedOrderType('DINE_IN');
    setMenuDrawerOpen(true);
  };

  const handleOrderTypeCardClick = (type: 'TAKEAWAY' | 'PARCEL' | 'DELIVERY') => {
    setSelectedOrderType(type);
    setSelectedTable(null);
    setSelectedActiveOrder(null);
    setCustomerDetails(null);
    setCustomerDetailsModalOpen(true);
  };

  const handleCustomerDetailsContinue = (details: any) => {
    setCustomerDetails(details);
    setCustomerDetailsModalOpen(false);
    setMenuDrawerOpen(true);
  };

  const handlePlaceOrder = async (items: any[]) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable?.id || null,
          orderType: selectedOrderType || 'DINE_IN',
          items,
          guests: customerDetails?.guests || null,
          customerName: customerDetails?.customerName || 'Walk-in Customer',
          customerPhone: customerDetails?.customerPhone || null,
        })
      });

      if (!response.ok) throw new Error('Failed to place order');
      toast.success('Order sent to kitchen! 🔔');
      fetchData();
    } catch (err) {
      toast.error('Failed to place order');
    }
  };

  const handleGenerateBill = async (orderId: string) => {
    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (!response.ok) throw new Error('Failed to generate bill');
      toast.success('Bill generated successfully! 🧾');
      setTableDrawerOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to generate bill');
    }
  };

  const handleQuickReorder = async (menuItemId: string, specialInstructions: string) => {
    if (!selectedActiveOrder && !selectedTable) return;
    
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
      toast.success('Reordered successfully! 🔔');
      fetchData();
    } catch (err) {
      toast.error('Failed to quick reorder');
    }
  };

  const handleMarkAsServed = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SERVED' })
      });

      if (!response.ok) throw new Error('Failed to mark as served');
      toast.success('Order marked as served! ✅');
      setTableDrawerOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to mark as served');
    }
  };

  if (loading && tables.length === 0) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const activeOrderForSelectedTable = selectedActiveOrder 
    ? selectedActiveOrder 
    : (selectedTable ? activeOrders.find(o => o.tableId === selectedTable.id) : null);

  return (
    <div className="space-y-8 animate-fade-in pb-12 min-h-[75vh] flex flex-col justify-between">
      <div className="space-y-8">
        {/* Live Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
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
            onClick={() => setTodayRevenueModalOpen(true)}
            className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 shadow-md shadow-emerald-500/5 cursor-pointer hover:scale-[1.02] hover:border-emerald-500/40 transition-all select-none group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 opacity-90 uppercase tracking-wider group-hover:text-emerald-500 transition-colors">Today&apos;s Revenue</p>
              <span className="text-xl font-black text-emerald-500 group-hover:scale-110 transition-transform">₹</span>
            </div>
            <p className="text-4xl font-black text-emerald-900 dark:text-emerald-300 mt-2">₹{revenue.toLocaleString()}</p>
          </Card>
        </div>

        {/* Order Type Cards */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Select Order Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* Dine In Card */}
            <button 
              onClick={() => setTableSelectModalOpen(true)}
              className="p-6 rounded-2xl border-2 border-border/80 bg-card flex flex-col justify-between items-start cursor-pointer hover:border-blue-500/60 hover:bg-blue-500/5 hover:shadow-lg hover:shadow-blue-500/5 transition-all text-left group min-h-[140px]"
            >
              <div className="flex justify-between items-center w-full">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <span className="font-black text-3xl text-foreground group-hover:text-blue-500 transition-colors">{dineInOrders}</span>
              </div>
              <p className="font-black text-lg text-foreground mt-4">Dine In</p>
            </button>

            {/* Takeaway Card */}
            <button 
              onClick={() => handleOrderTypeCardClick('TAKEAWAY')}
              className="p-6 rounded-2xl border-2 border-border/80 bg-card flex flex-col justify-between items-start cursor-pointer hover:border-amber-500/60 hover:bg-amber-500/5 hover:shadow-lg hover:shadow-amber-500/5 transition-all text-left group min-h-[140px]"
            >
              <div className="flex justify-between items-center w-full">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <span className="font-black text-3xl text-foreground group-hover:text-amber-500 transition-colors">{takeawayOrders}</span>
              </div>
              <p className="font-black text-lg text-foreground mt-4">Takeaway</p>
            </button>

            {/* Parcel Card */}
            <button 
              onClick={() => handleOrderTypeCardClick('PARCEL')}
              className="p-6 rounded-2xl border-2 border-border/80 bg-card flex flex-col justify-between items-start cursor-pointer hover:border-emerald-500/60 hover:bg-emerald-500/5 hover:shadow-lg hover:shadow-emerald-500/5 transition-all text-left group min-h-[140px]"
            >
              <div className="flex justify-between items-center w-full">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
                <span className="font-black text-3xl text-foreground group-hover:text-emerald-500 transition-colors">{parcelOrders}</span>
              </div>
              <p className="font-black text-lg text-foreground mt-4">Parcel</p>
            </button>

            {/* Delivery Card */}
            <button 
              onClick={() => handleOrderTypeCardClick('DELIVERY')}
              className="p-6 rounded-2xl border-2 border-border/80 bg-card flex flex-col justify-between items-start cursor-pointer hover:border-rose-500/60 hover:bg-rose-500/5 hover:shadow-lg hover:shadow-rose-500/5 transition-all text-left group min-h-[140px]"
            >
              <div className="flex justify-between items-center w-full">
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Bike className="w-6 h-6" />
                </div>
                <span className="font-black text-3xl text-foreground group-hover:text-rose-500 transition-colors">{deliveryOrders}</span>
              </div>
              <p className="font-black text-lg text-foreground mt-4">Delivery</p>
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
              className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between items-start cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/[0.02] hover:shadow-lg hover:shadow-orange-500/5 transition-all group min-h-[130px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl group-hover:scale-110 transition-transform">
                  <ChefHat className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground group-hover:text-orange-500 transition-colors">Kitchen Display (KDS)</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">Monitor and process kitchen orders in real-time</p>
            </Link>

            {/* Bills Card */}
            <Link 
              href="/bills"
              className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between items-start cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/[0.02] hover:shadow-lg hover:shadow-indigo-500/5 transition-all group min-h-[130px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground group-hover:text-indigo-500 transition-colors">Bills & Receipts</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">Generate guest invoices and track payments</p>
            </Link>

            {/* Orders Card */}
            <Link 
              href="/orders"
              className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between items-start cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/[0.02] hover:shadow-lg hover:shadow-blue-500/5 transition-all group min-h-[130px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground group-hover:text-blue-500 transition-colors">Order History</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">View, edit, and track active and past orders</p>
            </Link>

            {/* Reports Card */}
            <Link 
              href="/reports"
              className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between items-start cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] hover:shadow-lg hover:shadow-emerald-500/5 transition-all group min-h-[130px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground group-hover:text-emerald-500 transition-colors">Reports & Analytics</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">Analyze restaurant performance and revenue metrics</p>
            </Link>

          </div>
        </div>
      </div>

      {/* RAGSPRO Footer Branding */}
      <footer className="pt-8 mt-12 border-t border-border/60 text-center text-xs text-muted-foreground/60">
        <p>Gen-Z Restaurant POS • Private Software designed & developed by RAGSPRO Agency</p>
      </footer>

      {/* Modals & Drawers */}
      <TableSelectModal
        isOpen={isTableSelectModalOpen}
        onClose={() => setTableSelectModalOpen(false)}
        tables={tables}
        activeOrders={activeOrders}
        onSelectTable={handleSelectTable}
      />

      <GuestCountModal
        isOpen={isGuestCountModalOpen}
        onClose={() => setGuestCountModalOpen(false)}
        onBack={() => {
          setGuestCountModalOpen(false);
          setTableSelectModalOpen(true);
        }}
        tableNumber={selectedTable?.number || null}
        onContinue={handleGuestCountContinue}
      />

      <CustomerDetailsModal
        isOpen={isCustomerDetailsModalOpen}
        onClose={() => setCustomerDetailsModalOpen(false)}
        orderType={selectedOrderType as any}
        onContinue={handleCustomerDetailsContinue}
      />

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
      />

      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => {
          setMenuDrawerOpen(false);
          setSelectedTable(null);
        }}
        onBack={() => {
          setMenuDrawerOpen(false);
          if (selectedOrderType === 'DINE_IN') {
            const hasActiveOrder = activeOrders.some(o => o.tableId === selectedTable?.id);
            if (hasActiveOrder) {
              setTableDrawerOpen(true);
            } else {
              setGuestCountModalOpen(true);
            }
          } else {
            setCustomerDetailsModalOpen(true);
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
    </div>
  );
}