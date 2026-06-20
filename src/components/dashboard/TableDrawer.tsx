import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus, Receipt } from 'lucide-react';

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
}

export function TableDrawer({ isOpen, onClose, table, activeOrder, onAddItem, onGenerateBill, onQuickReorder, onMarkAsServed, onTransferClick }: TableDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[150] backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-[160] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-start bg-muted/30">
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

                return mergedItems.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-start p-3 bg-muted/20 rounded-xl border border-border">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-foreground">
                        <span className="text-primary mr-2">{item.quantity}×</span>
                        {item.menuItem?.name || 'Unknown Item'}
                      </p>
                      {item.cleanInstr && (
                        <p className="text-xs text-muted-foreground mt-1">📝 {item.cleanInstr}</p>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 mt-2 px-2 text-xs font-bold text-primary hover:bg-primary/10"
                        onClick={() => onQuickReorder(item.menuItem.id, item.cleanInstr)}
                      >
                        [+ Same Again]
                      </Button>
                    </div>
                    <p className="font-semibold whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ));
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
                  className="flex-1 h-14 text-lg font-bold shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-transform"
                  onClick={() => onMarkAsServed(activeOrder.id)}
                >
                  <Receipt className="w-5 h-5 mr-2" /> {/* Reusing icon for space, ideally Check */}
                  Mark Served
                </Button>
              )}
            </div>
            
            {activeOrder && (
              <Button 
                className="w-full h-14 text-lg font-bold shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] transition-transform"
                onClick={() => onGenerateBill(activeOrder.id)}
              >
                <Receipt className="w-5 h-5 mr-2" />
                Generate Bill
              </Button>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
