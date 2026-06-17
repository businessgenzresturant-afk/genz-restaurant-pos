'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UtensilsCrossed, 
  ClipboardList, 
  IndianRupee, 
  ChefHat, 
  ShoppingBag,
  Package,
  Bike,
  Loader2
} from 'lucide-react';
import { TableDrawer } from './TableDrawer';
import { OrderModal } from './OrderModal';
import { MenuDrawer } from './MenuDrawer';
import { toast } from 'sonner';

export function Dashboard() {
  const [tables, setTables] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Drawer States
  const [isTableDrawerOpen, setTableDrawerOpen] = useState(false);
  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [isMenuDrawerOpen, setMenuDrawerOpen] = useState(false);

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
        setRevenue(r.totalRevenue || 0);
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
    // Poll every 5 seconds for live updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const physicalTables = tables.filter(t => t.number < 1000).sort((a, b) => a.number - b.number);
  
  const occupiedTables = physicalTables.filter(t => t.status === 'OCCUPIED').length;
  const kitchenQueue = activeOrders.filter(o => ['PENDING', 'PREPARING'].includes(o.status)).length;
  
  const dineInOrders = activeOrders.filter(o => o.orderType === 'DINE_IN').length;
  const takeawayOrders = activeOrders.filter(o => o.orderType === 'TAKEAWAY').length;
  const parcelOrders = activeOrders.filter(o => o.orderType === 'PARCEL').length;
  const deliveryOrders = activeOrders.filter(o => o.orderType === 'DELIVERY').length;

  const handleTableClick = (table: any) => {
    setSelectedTable(table);
    setSelectedActiveOrder(null);
    setTableDrawerOpen(true);
  };
  
  const handleViewOrder = (order: any) => {
    if (order.table) {
      setSelectedTable(order.table);
    } else {
      setSelectedTable(null);
    }
    setSelectedActiveOrder(order);
    setTableDrawerOpen(true);
  };

  const handleNewOrderClick = () => {
    setOrderModalOpen(true);
  };

  const handleSelectOrderType = (type: string, details?: any) => {
    setSelectedOrderType(type);
    setCustomerDetails(details);
    setOrderModalOpen(false);
    
    if (type === 'DINE_IN') {
      toast.info('Please select a table from the dashboard to start Dine In.');
    } else {
      setSelectedTable(null);
      setSelectedActiveOrder(null);
      setMenuDrawerOpen(true);
    }
  };

  const handlePlaceOrder = async (items: any[]) => {
    // Determine if we're appending or creating
    // If selectedTable is set, we might be appending, API handles this.
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

  if (loading && tables.length === 0) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

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

  const activeOrderForSelectedTable = selectedActiveOrder 
    ? selectedActiveOrder 
    : (selectedTable ? activeOrders.find(o => o.tableId === selectedTable.id) : null);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400">
          <p className="text-sm font-bold opacity-80 uppercase">Tables Occupied</p>
          <p className="text-3xl font-black mt-1">{occupiedTables}/{physicalTables.length}</p>
        </Card>
        <Card className="p-4 bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400">
          <p className="text-sm font-bold opacity-80 uppercase">Kitchen Queue</p>
          <p className="text-3xl font-black mt-1">{kitchenQueue}</p>
        </Card>
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
          <p className="text-sm font-bold opacity-80 uppercase">Today&apos;s Revenue</p>
          <p className="text-3xl font-black mt-1">₹{revenue.toLocaleString()}</p>
        </Card>
        <Button 
          variant="gradient" 
          className="h-full text-lg shadow-lg hover:scale-[1.02] transition-transform"
          onClick={handleNewOrderClick}
        >
          <ClipboardList className="mr-2 h-6 w-6" /> NEW ORDER
        </Button>
      </div>

      {/* Order Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card flex justify-between items-center cursor-pointer hover:border-primary/50" onClick={() => toast.info('Click a table below')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><UtensilsCrossed /></div>
            <p className="font-bold">Dine In</p>
          </div>
          <span className="font-black text-xl">{dineInOrders}</span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card flex justify-between items-center cursor-pointer hover:border-amber-500/50" onClick={() => handleSelectOrderType('TAKEAWAY')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><ShoppingBag /></div>
            <p className="font-bold">Takeaway</p>
          </div>
          <span className="font-black text-xl">{takeawayOrders}</span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card flex justify-between items-center cursor-pointer hover:border-emerald-500/50" onClick={() => handleSelectOrderType('PARCEL')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Package /></div>
            <p className="font-bold">Parcel</p>
          </div>
          <span className="font-black text-xl">{parcelOrders}</span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card flex justify-between items-center cursor-pointer hover:border-rose-500/50" onClick={() => handleSelectOrderType('DELIVERY')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg"><Bike /></div>
            <p className="font-bold">Delivery</p>
          </div>
          <span className="font-black text-xl">{deliveryOrders}</span>
        </div>
      </div>

      {/* Recent Orders Widget */}
      {activeOrders.length > 0 && (
        <div className="bg-muted/10 border border-border rounded-xl p-4">
          <h3 className="text-sm font-bold opacity-80 uppercase mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Recent Active Orders
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {activeOrders.slice(0, 5).map(order => (
              <button 
                key={order.id} 
                onClick={() => handleViewOrder(order)}
                className="flex-shrink-0 bg-background border border-border p-3 rounded-lg flex flex-col gap-1 min-w-[140px] hover:border-primary/50 text-left transition-colors"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-sm">
                    {order.table ? `T${order.table.number}` : order.orderType}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    order.status === 'PENDING' ? 'bg-rose-500/10 text-rose-500' :
                    order.status === 'PREPARING' ? 'bg-amber-500/10 text-amber-500' :
                    order.status === 'READY' ? 'bg-emerald-500/10 text-emerald-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <span className="font-black text-primary">₹{order.totalAmount?.toFixed(2)}</span>
                {order.customerName && <span className="text-xs text-muted-foreground truncate w-full">{order.customerName}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visual Table Grid */}
      <div>
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          <span>Dine-In Tables</span>
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {physicalTables.map(table => {
            const hasOrder = activeOrders.some(o => o.tableId === table.id);
            // Yellow if we want to show Bill pending, for now Red is occupied
            const isOccupied = table.status === 'OCCUPIED' || hasOrder;
            
            return (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-sm ${
                  isOccupied
                    ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                    : 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                }`}
              >
                <span className="text-2xl font-black mb-1">T{table.number}</span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                  {isOccupied ? 'Occupied' : 'Available'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onSelectOrderType={handleSelectOrderType}
      />

      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => {
          setMenuDrawerOpen(false);
          setSelectedTable(null);
        }}
        menuItems={menuItems}
        tableId={selectedTable?.id || null}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
}