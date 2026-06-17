'use client';

import React from 'react';
import { X, ArrowLeft, ChefHat, Clock, ChevronRight, UtensilsCrossed, ShoppingBag, Package, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KitchenQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOrders: any[];
  onManageOrder: (order: any) => void;
}

export function KitchenQueueModal({ isOpen, onClose, activeOrders, onManageOrder }: KitchenQueueModalProps) {
  if (!isOpen) return null;

  // Filter orders in queue (PENDING or PREPARING)
  const queueOrders = activeOrders
    .filter(o => ['PENDING', 'PREPARING'].includes(o.status))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // oldest first

  const getRelativeTime = (dateStr: string) => {
    try {
      const diffMs = new Date().getTime() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 min ago';
      return `${diffMins} mins ago`;
    } catch (e) {
      return '';
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return <UtensilsCrossed className="w-4 h-4 text-blue-500" />;
      case 'TAKEAWAY':
        return <ShoppingBag className="w-4 h-4 text-amber-500" />;
      case 'PARCEL':
        return <Package className="w-4 h-4 text-emerald-500" />;
      case 'DELIVERY':
        return <Bike className="w-4 h-4 text-rose-500" />;
      default:
        return <ChefHat className="w-4 h-4 text-gray-500" />;
    }
  };

  const getOrderTypeColor = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'TAKEAWAY':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'PARCEL':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'DELIVERY':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'PENDING') {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 animate-pulse';
    }
    return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25';
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-fade-in" 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }} 
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-background border border-border shadow-2xl rounded-3xl z-50 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Kitchen Queue ({queueOrders.length})</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Active preparation queue, elapsed time, and kitchen tickets</p>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }} 
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          {queueOrders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <span className="text-4xl block mb-2">👨‍🍳</span>
              <p className="font-semibold text-lg">Kitchen queue is empty!</p>
              <p className="text-sm mt-1">Place orders to send them to the kitchen queue.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queueOrders.map((order) => (
                <div 
                  key={order.id}
                  className="border border-border/85 bg-card rounded-2xl p-5 hover:border-orange-500/40 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="flex-1 space-y-3">
                    {/* Order Meta & Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold font-mono bg-muted px-2 py-0.5 rounded border border-border">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${getOrderTypeColor(order.orderType)}`}>
                        {getOrderTypeIcon(order.orderType)}
                        {order.orderType === 'DINE_IN' ? `Table ${order.table?.number || ''}` : order.orderType}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {getRelativeTime(order.createdAt)}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Customer */}
                    <p className="text-sm font-semibold text-foreground">
                      Customer: <span className="font-bold">{order.customerName || 'Walk-in'}</span>
                    </p>

                    {/* Items & Special Instructions */}
                    <div className="bg-muted/30 rounded-xl p-3 border border-border/50 space-y-2">
                      <p className="font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Kitchen Ticket Items</p>
                      <div className="space-y-1">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-start text-xs">
                            <span className="font-bold text-foreground">
                              <span className="text-primary mr-2">{item.quantity}×</span>
                              {item.menuItem?.name || 'Item'}
                            </span>
                            {item.specialInstructions && (
                              <span className="text-red-500 text-xs italic ml-2">
                                📝 {item.specialInstructions}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Manage Button */}
                  <div className="flex md:flex-col items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-border/50">
                    <div className="text-right mb-2 hidden md:block">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</p>
                      <p className="text-xl font-black text-foreground">
                        ₹{order.totalAmount?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    <Button
                      onClick={() => onManageOrder(order)}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl shadow-md flex items-center gap-1"
                      size="sm"
                    >
                      Manage Order
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/10 flex justify-end">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            variant="outline"
            className="px-6 rounded-xl font-bold text-muted-foreground hover:bg-muted text-sm"
          >
            Close
          </Button>
        </div>

      </div>
    </>
  );
}
