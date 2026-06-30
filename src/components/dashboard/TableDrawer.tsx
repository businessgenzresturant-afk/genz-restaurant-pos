import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus, Receipt, Minus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  table: any | null;
  activeOrder: any | null;
  onAddItem: (tableId: string | null) => void;
  onGenerateBill: (orderId: string) => void;
  onQuickReorder: (menuItemId: string, specialInstructions: string) => void;
  onMarkAsServed: (orderId: string) => void;
  onTransferClick?: () => void;
  onRefresh?: () => void; // For refreshing after item changes
}

export function TableDrawer({ isOpen, onClose, table, activeOrder, onAddItem, onGenerateBill, onQuickReorder, onMarkAsServed, onTransferClick, onRefresh }: TableDrawerProps) {
  const [isGeneratingBill, setIsGeneratingBill] = React.useState(false);
  const [isMarkingServed, setIsMarkingServed] = React.useState(false);
  const [isReordering, setIsReordering] = React.useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [itemToCancel, setItemToCancel] = React.useState<{itemId: string, itemName: string} | null>(null);
  const [cancelReason, setCancelReason] = React.useState('');
  const [cancelReasonOther, setCancelReasonOther] = React.useState('');
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [quantityChanging, setQuantityChanging] = React.useState<string | null>(null);

  const cancelReasons = [
    'Customer changed mind',
    'Wrong item ordered',
    'Kitchen error',
    'Item unavailable',
    'Too long wait time',
    'Other'
  ];

  const handleCancelItem = (itemId: string, itemName: string) => {
    setItemToCancel({ itemId, itemName });
    setCancelReason('');
    setCancelReasonOther('');
    setShowCancelModal(true);
  };

  const confirmCancelItem = async () => {
    if (!itemToCancel || !activeOrder) return;
    
    const finalReason = cancelReason === 'Other' ? cancelReasonOther : cancelReason;
    
    if (!finalReason || finalReason.trim().length === 0) {
      toast.error('Please select or enter a cancellation reason');
      return;
    }
    
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/orders/${activeOrder.id}/items/${itemToCancel.itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', cancelReason: finalReason.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel item');
      }

      toast.success(`"${itemToCancel.itemName}" cancelled`);
      setShowCancelModal(false);
      setItemToCancel(null);
      setCancelReason('');
      setCancelReasonOther('');
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error('Error cancelling item:', err);
      toast.error(err.message || 'Failed to cancel item');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleQuantityChange = async (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    
    if (newQuantity < 1) {
      toast.error('Use Cancel button to remove items');
      return;
    }
    
    setQuantityChanging(itemId);
    try {
      // For now, use quick reorder for increasing quantity
      // TODO: Implement proper quantity edit API
      if (change > 0 && activeOrder) {
        const item = activeOrder.items.find((i: any) => i.id === itemId);
        if (item) {
          await onQuickReorder(item.menuItem.id, item.specialInstructions || '');
          toast.success('Item added');
          if (onRefresh) await onRefresh();
        }
      } else {
        toast.info('Quantity decrease coming soon - use Cancel for now');
      }
    } catch (err: any) {
      console.error('Error changing quantity:', err);
      toast.error('Failed to change quantity');
    } finally {
      setQuantityChanging(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
          onClick={onClose} 
        />
        <div className="relative w-full max-w-lg bg-background rounded-3xl border-2 border-border shadow-2xl z-[160] flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
          
          {/* Header - Fixed at top */}
          <div className="flex-shrink-0 p-6 border-b-2 border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-foreground capitalize">
                {activeOrder && activeOrder.orderType !== 'DINE_IN' 
                  ? activeOrder.orderType.toLowerCase()
                  : `Table ${table?.number || ''}`}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  {table ? (table.status === 'AVAILABLE' ? '🟢 Available' : '🔴 Occupied') : 'Active Order'}
                </p>
                {table && activeOrder && onTransferClick && (
                  <button
                    onClick={onTransferClick}
                    className="px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-lg transition-colors"
                  >
                    Transfer Table
                  </button>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-all active:scale-[0.90]">
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Customer Info */}
        {activeOrder && (activeOrder.customerName || activeOrder.guests) && (
          <div className="px-6 py-4 border-b border-border bg-muted/10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Customer</p>
                <p className="font-medium text-foreground">{activeOrder.customerName || 'Walk-in'}</p>
                {activeOrder.customerPhone && <p className="text-sm text-muted-foreground">{activeOrder.customerPhone}</p>}
              </div>
              {activeOrder.guests && (
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Guests</p>
                  <p className="font-medium text-foreground">{activeOrder.guests} people</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!activeOrder ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <div className="text-5xl mb-4">🍽️</div>
              <p className="font-semibold text-muted-foreground">No active order</p>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Order Items</h3>
              {(() => {
                // Auto-merge logic for clean display
                const mergedItems = activeOrder.items.reduce((acc: any[], item: any) => {
                  const cleanInstr = (item.specialInstructions || '').replace('[URGENT ADDITION]', '').trim();
                  const existing = acc.find(i => i.menuItem?.id === item.menuItem?.id && i.cleanInstr === cleanInstr);
                  if (existing) {
                    existing.quantity += item.quantity;
                  } else {
                    acc.push({ ...item, cleanInstr });
                  }
                  return acc;
                }, []);

                return mergedItems.map((item: any, i: number) => {
                  const isCancelled = item.status === 'CANCELLED';
                  const isChanging = quantityChanging === item.id;
                  
                  return (
                  <div key={i} className={`flex justify-between items-start p-3 rounded-xl border ${
                    isCancelled 
                      ? 'bg-red-950/20 border-red-500/30 opacity-60' 
                      : 'bg-muted/20 border-border'
                  }`}>
                    <div className="flex-1 pr-2">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className={`font-bold text-foreground flex-1 ${isCancelled ? 'line-through text-red-400' : ''}`}>
                          <span className="text-primary mr-2">{item.quantity}×</span>
                          {item.menuItem?.name || 'Unknown Item'}
                          {isCancelled && <span className="ml-2 text-xs font-black text-red-400 uppercase">CANCELLED</span>}
                        </p>
                        {!isCancelled && activeOrder.status !== 'COMPLETED' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                              disabled={isChanging}
                              className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors disabled:opacity-50"
                              title="Add one more"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancelItem(item.id, item.menuItem?.name || 'item')}
                              disabled={isChanging}
                              className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors disabled:opacity-50"
                              title="Cancel item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      {isCancelled && item.cancelReason && (
                        <p className="text-xs text-red-400 mb-1">
                          Reason: {item.cancelReason}
                        </p>
                      )}
                      {item.cleanInstr && !isCancelled && (
                        <p className="text-xs text-muted-foreground mt-1">📝 {item.cleanInstr}</p>
                      )}
                      {!isCancelled && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 mt-2 px-2 text-xs font-bold text-primary hover:bg-primary/10"
                          disabled={isReordering === item.menuItem.id}
                          onClick={async () => {
                            setIsReordering(item.menuItem.id);
                            try {
                              await onQuickReorder(item.menuItem.id, item.cleanInstr);
                              if (onRefresh) await onRefresh();
                            } finally {
                              setIsReordering(null);
                            }
                          }}
                        >
                          {isReordering === item.menuItem.id ? '...' : '[+ Same Again]'}
                        </Button>
                      )}
                    </div>
                    <p className={`font-semibold whitespace-nowrap ${isCancelled ? 'line-through text-red-400' : ''}`}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                );
                });
              })()}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-background mt-auto">
          {activeOrder && (
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground font-bold">Total Amount</p>
              <p className="text-3xl font-black text-primary">₹{activeOrder.totalAmount?.toFixed(2) || '0.00'}</p>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button 
                className="flex-1 h-14 text-lg font-bold shadow-lg active:scale-[0.97] transition-transform"
                variant="outline"
                onClick={() => onAddItem(table?.id || null)}
              >
                <Plus className="w-5 h-5 mr-2" />
                {activeOrder ? 'Add Item' : 'Create Order'}
              </Button>
              
              {activeOrder && activeOrder.status !== 'SERVED' && (
                <Button 
                  className="flex-1 h-14 text-lg font-bold shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-transform disabled:opacity-50"
                  disabled={isMarkingServed}
                  onClick={async () => {
                    setIsMarkingServed(true);
                    try {
                      await onMarkAsServed(activeOrder.id);
                    } finally {
                      setIsMarkingServed(false);
                    }
                  }}
                >
                  {isMarkingServed ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Receipt className="w-5 h-5 mr-2" />
                      Mark Served
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {activeOrder && (
              <Button 
                className="w-full h-14 text-lg font-bold shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] transition-transform disabled:opacity-50"
                disabled={isGeneratingBill}
                onClick={async () => {
                  setIsGeneratingBill(true);
                  try {
                    await onGenerateBill(activeOrder.id);
                  } finally {
                    setTimeout(() => setIsGeneratingBill(false), 300);
                  }
                }}
              >
                {isGeneratingBill ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Receipt className="w-5 h-5 mr-2" />
                    Generate Bill
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>

      {/* Cancel Item Modal */}
      {showCancelModal && itemToCancel && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => !isCancelling && setShowCancelModal(false)}>
          <div className="bg-card border-2 border-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border">
              <h3 className="text-xl font-black text-foreground">Cancel Item</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Cancelling: <span className="font-bold text-foreground">{itemToCancel.itemName}</span>
              </p>
              <p className="text-xs text-amber-600 mt-2">⚠️ Please select a reason for accountability</p>
            </div>
            
            <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
              {cancelReasons.map((reason) => (
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
                  <input
                    autoFocus
                    type="text"
                    placeholder="Type custom reason..."
                    value={cancelReasonOther}
                    onChange={(e) => setCancelReasonOther(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-primary focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>
              )}
            </div>
            
            <div className="p-5 bg-muted/30 border-t border-border flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCancelModal(false)} 
                className="flex-1 h-11 rounded-xl"
                disabled={isCancelling}
              >
                Keep Item
              </Button>
              <Button 
                onClick={confirmCancelItem} 
                variant="destructive" 
                className="flex-1 h-11 rounded-xl font-bold bg-red-600 hover:bg-red-700"
                disabled={isCancelling || !cancelReason || (cancelReason === 'Other' && !cancelReasonOther.trim())}
              >
                {isCancelling ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Confirm Cancel'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
