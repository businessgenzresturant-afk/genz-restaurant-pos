'use client';

import React, { useState } from 'react';
import { X, ArrowLeft, ShoppingBag, Truck, Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TakeawayDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'TAKEAWAY' | 'DELIVERY';
  activeOrders: any[];
  onNewOrder: () => void;
  onGenerateBill: (orderId: string) => void;
}

export function TakeawayDeliveryModal({
  isOpen,
  onClose,
  type,
  activeOrders,
  onNewOrder,
  onGenerateBill
}: TakeawayDeliveryModalProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  if (!isOpen) return null;

  const Icon = type === 'TAKEAWAY' ? ShoppingBag : Truck;
  const title = type === 'TAKEAWAY' ? 'Takeaway Orders' : 'Delivery Orders';
  const desc = `Manage active ${type.toLowerCase()} orders and create new ones.`;
  const colorClass = type === 'TAKEAWAY' ? 'emerald' : 'indigo';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" 
        onClick={onClose} 
      />
      <div className="relative w-full sm:max-w-4xl bg-background border-2 border-border shadow-2xl rounded-3xl z-[160] overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b-2 border-border flex justify-between items-center bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`p-3 bg-${colorClass}-500/20 rounded-xl`}>
              <Icon className={`w-6 h-6 text-${colorClass}-500`} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-muted/80 rounded-xl transition-all duration-200 hover:rotate-90"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Content - Proper scrolling fix */}
        <div className="p-6 overflow-y-auto flex-1 bg-muted/5 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* New Order Button */}
            <button
              onClick={onNewOrder}
              className={`flex flex-col items-center justify-center gap-3 min-h-[160px] rounded-2xl border-2 border-dashed border-${colorClass}-500/30 bg-${colorClass}-500/5 hover:bg-${colorClass}-500/10 hover:border-${colorClass}-500/50 transition-all duration-200 active:scale-[0.98] group`}
            >
              <div className={`p-4 bg-${colorClass}-500/10 rounded-full group-hover:scale-110 transition-transform`}>
                <Plus className={`w-8 h-8 text-${colorClass}-600 dark:text-${colorClass}-400`} />
              </div>
              <span className={`font-bold text-${colorClass}-700 dark:text-${colorClass}-300`}>
                New {type === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'}
              </span>
            </button>

            {/* Active Orders List */}
            {activeOrders.map((order) => {
              const elapsedMinutes = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
              
              return (
                <div 
                  key={order.id} 
                  className="flex flex-col min-h-[160px] p-5 rounded-2xl border-2 border-border bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer"
                  onClick={async () => {
                    if (generatingId !== order.id) {
                      setGeneratingId(order.id);
                      try {
                        await onGenerateBill(order.id);
                      } finally {
                        setGeneratingId(null);
                      }
                    }
                  }}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full bg-${colorClass}-500`} />
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">
                        Order #{order.id.slice(-4).toUpperCase()}
                      </h3>
                      {order.customerName && (
                        <p className="text-sm text-muted-foreground font-medium">
                          {order.customerName}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                      {elapsedMinutes}m ago
                    </span>
                  </div>
                  
                  <div className="mt-auto space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-muted-foreground">Items: {order.items?.length || 0}</span>
                      <span className="font-black text-primary">₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                    
                    {order.bill ? (
                      <Button 
                        className="w-full font-bold shadow-sm bg-blue-600 hover:bg-blue-700 active:scale-[0.97] transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = '/bills';
                        }}
                      >
                        <Receipt className="w-4 h-4 mr-2" />
                        View Bill
                      </Button>
                    ) : (
                      <Button 
                        className={`w-full font-bold shadow-sm bg-${colorClass}-600 hover:bg-${colorClass}-700 active:scale-[0.97] transition-transform`}
                        disabled={generatingId === order.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setGeneratingId(order.id);
                          try {
                            await onGenerateBill(order.id);
                          } finally {
                            setGeneratingId(null);
                          }
                        }}
                      >
                        {generatingId === order.id ? (
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Receipt className="w-4 h-4 mr-2" />
                        )}
                        {generatingId === order.id ? 'Generating...' : 'Generate Bill'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
