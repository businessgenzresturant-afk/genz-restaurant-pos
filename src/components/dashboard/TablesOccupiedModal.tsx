'use client';

import React from 'react';
import { X, ArrowLeft, Users, ChevronRight, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TablesOccupiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: any[];
  activeOrders: any[];
  onSelectTable: (table: any, isOccupied: boolean) => void;
}

export function TablesOccupiedModal({ isOpen, onClose, tables, activeOrders, onSelectTable }: TablesOccupiedModalProps) {
  if (!isOpen) return null;

  // Filter occupied tables (status OCCUPIED or having active order)
  const physicalTables = tables
    .filter((t) => t.number < 1000)
    .sort((a, b) => a.number - b.number);

  const occupiedTablesList = physicalTables.map(table => {
    const activeOrder = activeOrders.find(o => o.tableId === table.id);
    const isOccupied = table.status === 'OCCUPIED' || !!activeOrder;
    return {
      table,
      activeOrder,
      isOccupied
    };
  }).filter(t => t.isOccupied);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'PREPARING':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'READY':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'SERVED':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-fade-in" 
        onClick={onClose} 
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-background border border-border shadow-2xl rounded-3xl z-50 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Occupied Tables ({occupiedTablesList.length})</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Real-time status of seated tables, customer details, and ordered items</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          {occupiedTablesList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <span className="text-4xl block mb-2">🍽️</span>
              <p className="font-semibold text-lg">No occupied tables at the moment.</p>
              <p className="text-sm mt-1">Start a new Dine-In order to occupy a table.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {occupiedTablesList.map(({ table, activeOrder }) => (
                <div 
                  key={table.id}
                  className="border border-border/80 bg-card rounded-2xl p-5 hover:border-blue-500/40 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="flex-1 space-y-3">
                    {/* Table Info & Status Badge */}
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-foreground">T{table.number}</span>
                      {activeOrder?.guests && (
                        <span className="text-xs bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {activeOrder.guests} {activeOrder.guests === 1 ? 'Guest' : 'Guests'}
                        </span>
                      )}
                      {activeOrder?.createdAt && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(activeOrder.createdAt)}
                        </span>
                      )}
                      {activeOrder?.status && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(activeOrder.status)}`}>
                          {activeOrder.status}
                        </span>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Customer: <span className="font-bold text-primary">{activeOrder?.customerName || 'Walk-in'}</span>
                      </p>
                      {activeOrder?.customerPhone && (
                        <p className="text-xs text-muted-foreground mt-0.5">📞 {activeOrder.customerPhone}</p>
                      )}
                    </div>

                    {/* Ordered Items summary */}
                    {activeOrder?.items && activeOrder.items.length > 0 ? (
                      <div className="bg-muted/30 rounded-xl p-3 border border-border/50 text-xs">
                        <p className="font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 text-[10px]">Ordered Items</p>
                        <div className="flex flex-wrap gap-2">
                          {activeOrder.items.map((item: any, idx: number) => (
                            <span 
                              key={idx}
                              className="px-2.5 py-1 bg-background border border-border rounded-lg font-bold text-foreground inline-flex items-center gap-1"
                            >
                              <span className="text-primary">{item.quantity}×</span>
                              {item.menuItem?.name || 'Item'}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No items ordered yet.</p>
                    )}
                  </div>

                  {/* Actions & Price */}
                  <div className="flex md:flex-col items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-border/50">
                    <div className="text-right mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                        ₹{activeOrder?.totalAmount?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    <Button
                      onClick={() => onSelectTable(table, true)}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl shadow-md flex items-center gap-1"
                      size="sm"
                    >
                      Manage Table
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
            onClick={onClose}
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
