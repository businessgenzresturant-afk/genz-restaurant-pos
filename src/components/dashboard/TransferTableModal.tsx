'use client';

import React from 'react';
import { X, ArrowRightLeft } from 'lucide-react';

interface TransferTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: any[];
  activeOrders: any[];
  currentTableId?: string;
  onConfirmTransfer: (newTableId: string) => void;
}

export function TransferTableModal({ isOpen, onClose, tables, activeOrders, currentTableId, onConfirmTransfer }: TransferTableModalProps) {
  if (!isOpen) return null;

  // Filter and sort physical tables T1-T10
  const physicalTables = tables
    .filter((t) => t.number < 1000)
    .sort((a, b) => a.number - b.number);

  const availableTables = physicalTables.filter((table) => {
    const hasOrder = activeOrders.some((o) => o.tableId === table.id);
    const isOccupied = table.status === 'OCCUPIED' || hasOrder;
    // We only want available tables that aren't the current one
    return !isOccupied && table.id !== currentTableId;
  });

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" 
        onClick={onClose} 
      />
      <div className="relative w-full sm:max-w-2xl bg-background border-2 border-border shadow-2xl rounded-3xl z-[180] overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b-2 border-border flex justify-between items-center bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-xl">
              <ArrowRightLeft className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Transfer Table</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Select an available table to transfer the current order</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-muted/80 rounded-xl transition-all duration-200 hover:rotate-90">
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {availableTables.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No available tables to transfer to.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {availableTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => onConfirmTransfer(table.id)}
                  className="aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200 transform hover:scale-[1.03] shadow-md bg-green-500/5 border-green-500/30 hover:border-green-500/50 text-green-600 dark:text-green-400"
                >
                  <span className="text-3xl font-black mb-1">T{table.number}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                    Available
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-border font-bold text-muted-foreground hover:bg-muted transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
