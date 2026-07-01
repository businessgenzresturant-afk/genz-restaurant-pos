'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DietIndicator } from '@/components/ui/diet-indicator';
import { Portal } from '@/components/ui/portal';
import { Receipt, X, Clock, Search } from 'lucide-react';

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && (window as any).__pos_orders_cache?.allOrders) {
      return (window as any).__pos_orders_cache.allOrders;
    }
    return [];
  });
  
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && (window as any).__pos_orders_cache?.allOrders) {
      return false;
    }
    return true;
  });
  
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Cancel reason state
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
  const [itemToCancel, setItemToCancel] = useState<{orderId: string, itemId: string} | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonOther, setCancelReasonOther] = useState('');

  const statuses = ['ALL', 'PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];

  useEffect(() => {
    fetchData();
    // Auto-refresh every 15s to catch external changes
    const interval = setInterval(fetchData, 15000);
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const fetchData = async () => {
    setError(null);
    try {
      const response = await fetch('/api/orders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const ordersData = await response.json();
      const finalOrders = Array.isArray(ordersData) ? ordersData : [];

      setOrders(finalOrders);

      if (typeof window !== 'undefined') {
        (window as any).__pos_orders_cache = {
          ...((window as any).__pos_orders_cache || {}),
          allOrders: finalOrders
        };
      }
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error fetching data:', err);
      toast.error('Failed to load orders history');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    // Optimistic update: change UI immediately
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    if (selectedOrder?.id === orderId) setSelectedOrder((prev: any) => prev ? { ...prev, status } : prev);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update order status');
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      // Revert on failure
      setError('Failed to update order status. Please try again.');
      toast.error('Failed to update order status');
      fetchData(); // Revert by fetching fresh data
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    // Optimistic update
    setOrders(prev => prev.filter(o => o.id !== orderId));
    if (selectedOrder?.id === orderId) setShowOrderDetails(false);
    try {
      const response = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }
      toast.success('Order cancelled successfully');
    } catch (err: any) {
      toast.error('Failed to cancel order');
      fetchData(); // Revert by fetching fresh
    }
  };

  const handleGenerateBill = async (orderId: string) => {
    setLoading(true);
    try {
      // First, mark the order as SERVED if it isn't already, so the bills API accepts it
      const markResponse = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SERVED' })
      });
      
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate bill');
      }

      toast.success('Bill generated successfully! Redirecting...');
      router.push('/bills');
    } catch (err) {
      setError('Failed to generate bill. Please try again.');
      console.error('Error generating bill:', err);
      toast.error('Failed to generate bill');
      setLoading(false);
    }
  };

  const handleCancelOrderItem = async (orderId: string, itemId: string) => {
    setItemToCancel({ orderId, itemId });
    setCancelReason('');
    setCancelReasonOther('');
    setShowCancelReasonModal(true);
  };

  const confirmCancelOrderItem = async () => {
    if (!itemToCancel) return;
    
    const finalReason = cancelReason === 'Other' ? cancelReasonOther : cancelReason;
    if (!finalReason || finalReason.trim().length === 0) {
      toast.error('Please select or enter a cancellation reason');
      return;
    }
    
    try {
      const response = await fetch(`/api/orders/${itemToCancel.orderId}/items/${itemToCancel.itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', cancelReason: finalReason.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel item');
      }

      toast.success('Item cancelled successfully');
      setShowCancelReasonModal(false);
      setItemToCancel(null);
      await fetchData();
      
      if (selectedOrder?.id === itemToCancel.orderId) {
        const updatedOrder = orders.find(o => o.id === itemToCancel.orderId);
        if (updatedOrder) setSelectedOrder(updatedOrder);
      }
    } catch (err: any) {
      console.error('Error cancelling item:', err);
      toast.error(err.message || 'Failed to cancel item');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status Filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
      
      // Search Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const orderIdMatch = order.id.toLowerCase().includes(q);
        const customerMatch = order.customerName?.toLowerCase().includes(q);
        return orderIdMatch || customerMatch;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="rounded-full border-4 border-primary border-t-transparent h-12 w-12 mx-auto animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading order history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4 text-foreground">Error</h2>
        <p className="text-red-500">{error}</p>
        <Button onClick={() => { setError(null); fetchData(); }} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="pb-4 border-b border-border flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Order History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all past and active orders
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search Order ID or Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${
              statusFilter === status
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {status}
            {status === 'ALL' ? (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-muted-foreground/20 text-xs">
                {orders.length}
              </span>
            ) : (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-muted-foreground/20 text-xs">
                {orders.filter(o => o.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 flex flex-col items-center justify-center">
          <div className="text-6xl mb-4 opacity-50">📋</div>
          <h3 className="text-xl font-bold text-foreground">No orders found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrders.map(order => {
            const timeStr = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
            
            return (
              <Card key={order.id} className="p-5 border border-border hover:border-primary/50 transition-colors flex flex-col rounded-2xl shadow-sm hover:shadow-md h-full">
                <div className="flex justify-between items-start border-b border-border pb-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex flex-col items-center justify-center font-black text-primary border border-primary/20">
                      {order.table?.number ? `T${order.table.number}` : (order.orderType === 'TAKEAWAY' ? 'TK' : 'DL')}
                    </div>
                    <div>
                      <span className="text-base font-bold text-foreground block">#{order.id.slice(-6).toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {dateStr}, {timeStr}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-black rounded-full uppercase tracking-wider ${
                    order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 
                    order.status === 'PREPARING' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 
                    order.status === 'READY' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                    order.status === 'SERVED' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 
                    order.status === 'COMPLETED' ? 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400' : 
                    order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {order.customerName && (
                  <div className="mb-3 px-3 py-1.5 bg-muted/30 rounded-lg text-sm text-foreground font-medium">
                    👤 {order.customerName}
                  </div>
                )}

                <div className="flex-1 mb-4 space-y-1">
                  {order.items.filter((item: any) => item.status === 'ACTIVE').slice(0, 3).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="font-medium text-foreground truncate pr-2">
                        <span className="text-primary font-bold mr-1">{item.quantity}×</span> 
                        {item.menuItem?.name || 'Unknown Item'}
                      </span>
                      <span className="text-muted-foreground font-medium whitespace-nowrap">
                        ₹{((item.quantity * (item.price || 0)).toFixed(2))}
                      </span>
                    </div>
                  ))}
                  
                  {order.items.filter((item: any) => item.status === 'ACTIVE').length > 3 && (
                    <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded inline-block mt-2">
                      + {order.items.filter((item: any) => item.status === 'ACTIVE').length - 3} more items
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border mt-auto flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Amount</p>
                      <span className="font-black text-lg text-foreground">₹{order.totalAmount.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                      className="text-sm font-bold text-primary hover:text-primary/80 underline px-2 py-1"
                    >
                      View Details
                    </button>
                  </div>
                  
                  {/* Action Buttons based on status */}
                  <div className="flex gap-2">
                    {order.status === 'READY' && (
                      <Button
                        onClick={() => handleUpdateOrderStatus(order.id, 'SERVED')}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                      >
                        🍽️ Serve
                      </Button>
                    )}
                    {order.status === 'SERVED' && !order.bill && (
                      <Button
                        onClick={() => handleGenerateBill(order.id)}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-900 text-white font-bold rounded-xl shadow-md"
                      >
                        <Receipt className="w-4 h-4 mr-2" /> Generate Bill
                      </Button>
                    )}
                    {order.status === 'SERVED' && order.bill && (
                      <Button
                        onClick={() => router.push('/bills')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                      >
                        <Receipt className="w-4 h-4 mr-2" /> View Bill
                      </Button>
                    )}
                    {(order.status === 'PENDING' || order.status === 'PREPARING') && (
                      <Button
                        onClick={() => handleCancelOrder(order.id)}
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10 font-bold rounded-xl"
                      >
                        ❌ Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <Portal>
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-card text-card-foreground border-2 border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="sticky top-0 bg-card/95 backdrop-blur border-b-2 border-border p-6 z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-foreground mb-1">
                      {selectedOrder.table?.number ? `Order Details - Table ${selectedOrder.table.number}` : `Takeaway / Delivery Order`}
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">#{selectedOrder.id}</span>
                      {selectedOrder.customerName && <span>• {selectedOrder.customerName}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowOrderDetails(false);
                      setSelectedOrder(null);
                    }}
                    className="p-2 hover:bg-muted rounded-full transition-colors active:scale-95"
                  >
                    <X className="w-6 h-6 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">📝</span>
                    Active Items
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items
                      .filter((item: any) => item.status === 'ACTIVE')
                      .map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <DietIndicator dietType={item.menuItem?.dietType || 'VEG'} />
                              <p className="font-bold text-foreground">
                                <span className="text-primary mr-2">{item.quantity}×</span>
                                {item.menuItem?.name || 'Unknown Item'}
                              </p>
                            </div>
                            {item.portionType && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary inline-block mt-1 uppercase tracking-wider">
                                {item.portionType} PORTION
                              </span>
                            )}
                            {item.specialInstructions && item.specialInstructions.replace(/\[URGENT ADDITION\]/g, '').replace(/\[SERVED\]/g, '').trim() && (
                              <p className="text-sm text-muted-foreground mt-1.5 flex items-start gap-1">
                                <span className="opacity-60 mt-0.5">↳</span> {item.specialInstructions.replace(/\[URGENT ADDITION\]/g, '').replace(/\[SERVED\]/g, '').trim()}
                              </p>
                            )}
                            <p className="text-sm font-bold text-muted-foreground mt-1.5">
                              ₹{item.price.toFixed(2)} each
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-3 ml-4">
                            <span className="font-black text-xl text-foreground">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                            {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'PREPARING') && (
                              <Button
                                onClick={() => handleCancelOrderItem(selectedOrder.id, item.id)}
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-600 font-bold h-8 px-3 rounded-lg"
                              >
                                Cancel Item
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    {selectedOrder.items.filter((item: any) => item.status === 'ACTIVE').length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-border rounded-2xl">
                        <p className="text-muted-foreground font-medium">No active items left</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedOrder.items.some((item: any) => item.status === 'CANCELLED') && (
                  <div className="pt-6 mt-6 border-t border-border">
                    <h3 className="font-bold text-lg mb-3 text-red-500 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-xs">❌</span>
                      Cancelled Items
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.items
                        .filter((item: any) => item.status === 'CANCELLED')
                        .map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-2xl opacity-75"
                          >
                            <div>
                              <p className="font-bold text-foreground line-through decoration-red-500/50">
                                {item.quantity}× {item.menuItem?.name || 'Unknown Item'}
                                {item.portionType && (
                                  <span className="ml-2 text-[10px] uppercase bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-black no-underline">
                                    {item.portionType}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-red-500/80 font-medium mt-1">
                                Reason: {item.cancelReason || 'Not specified'}
                              </p>
                            </div>
                            <span className="font-bold text-muted-foreground line-through">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-muted/20 border-t-2 border-border mt-auto">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold uppercase tracking-wider">Order Total</span>
                  <span className="font-black text-3xl text-primary">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Cancel Item Reason Modal */}
      {showCancelReasonModal && (
        <Portal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-card border-2 border-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
              <div className="p-5 border-b border-border">
                <h3 className="text-xl font-black text-foreground">Cancel Item</h3>
                <p className="text-sm text-muted-foreground mt-1">Please select a reason for cancellation</p>
              </div>
              <div className="p-5 space-y-2">
                {['Customer changed mind', 'Item out of stock', 'Long wait time', 'Mistake in order', 'Other'].map(reason => (
                  <button
                    key={reason}
                    onClick={() => setCancelReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 font-semibold transition-colors ${
                      cancelReason === reason 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    {reason}
                  </button>
                ))}

                {cancelReason === 'Other' && (
                  <div className="pt-2 animate-fade-in">
                    <Input
                      autoFocus
                      placeholder="Type custom reason..."
                      value={cancelReasonOther}
                      onChange={(e) => setCancelReasonOther(e.target.value)}
                      className="border-primary focus-visible:ring-primary h-11"
                    />
                  </div>
                )}
              </div>
              <div className="p-5 bg-muted/30 border-t border-border flex gap-3">
                <Button variant="outline" onClick={() => setShowCancelReasonModal(false)} className="flex-1 h-11 rounded-xl">
                  Keep Item
                </Button>
                <Button 
                  onClick={confirmCancelOrderItem} 
                  variant="destructive" 
                  className="flex-1 h-11 rounded-xl font-bold bg-red-600 hover:bg-red-700"
                  disabled={cancelReason === 'Other' && !cancelReasonOther.trim()}
                >
                  Confirm Cancel
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>}>
      <OrdersPageContent />
    </Suspense>
  );
}