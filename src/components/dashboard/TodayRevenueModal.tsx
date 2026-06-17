'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, BarChart3, Receipt, Calendar, CreditCard, DollarSign, Wallet, Printer, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TodayRevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayRevenue: number;
}

export function TodayRevenueModal({ isOpen, onClose, todayRevenue }: TodayRevenueModalProps) {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTodayBills();
    }
  }, [isOpen]);

  const fetchTodayBills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bills');
      if (!res.ok) throw new Error('Failed to fetch bills');
      const data = await res.json();
      
      // Filter for bills created today
      const todayStr = new Date().toDateString();
      const todayBills = data.filter((bill: any) => 
        new Date(bill.createdAt).toDateString() === todayStr
      );
      setBills(todayBills);
    } catch (e) {
      console.error(e);
      toast.error('Failed to fetch today\'s bills');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = (bill: any) => {
    const printContents = document.getElementById(`receipt-print-content-${bill.id}`)?.innerHTML;
    if (printContents) {
      const printWindow = window.open('', '', 'height=800,width=600');
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>Receipt #${bill.id.slice(-6).toUpperCase()}</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            .receipt { max-width: 400px; margin: 0 auto; }
            .text-center { text-align: center; }
            .border-t { border-top: 1px dashed #000; }
            .border-b { border-bottom: 1px dashed #000; }
            .flex { display: flex; justify-content: space-between; }
            .font-bold { font-weight: bold; }
            .mt-4 { margin-top: 16px; }
            .mb-4 { margin-bottom: 16px; }
            .text-sm { font-size: 12px; }
            .text-xs { font-size: 10px; }
          </style>
          </head><body onload="window.print(); window.close();">
          <div class="receipt">${printContents}</div>
          </body></html>
        `);
        printWindow.document.close();
      }
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'CASH':
        return <DollarSign className="w-3.5 h-3.5 text-green-500" />;
      case 'CARD':
        return <CreditCard className="w-3.5 h-3.5 text-blue-500" />;
      case 'UPI':
        return <Wallet className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return <Receipt className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'PAID') {
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    }
    return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-[150] backdrop-blur-sm animate-fade-in" 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }} 
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full sm:max-w-4xl bg-background border border-border shadow-2xl rounded-3xl z-[160] overflow-hidden animate-fade-in max-h-[85vh] flex flex-col">
        
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
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Today&apos;s Revenue & Bills</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Summary of total sales, billing history, and payment collection for today</p>
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

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left panel: Stats & Bills List */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-border/50 space-y-6">
            
            {/* Today's Sales Stat Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between shadow-md shadow-emerald-500/5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Today&apos;s Sales Volume</p>
                <p className="text-3xl font-black text-emerald-950 dark:text-emerald-300 mt-1">₹{todayRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground/80 mt-1">Calculated from completed/paid orders today</p>
              </div>
              <div className="p-4 bg-emerald-500/20 rounded-full text-emerald-600 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
            </div>

            {/* Bills Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                <span>Billing History</span>
                <span className="font-mono text-xs text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                  {bills.length} {bills.length === 1 ? 'bill' : 'bills'} today
                </span>
              </h3>

              {loading ? (
                <div className="py-12 flex justify-center items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : bills.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <span className="text-4xl block mb-2">🧾</span>
                  <p className="font-semibold text-lg">No bills generated today.</p>
                  <p className="text-sm mt-1">Orders must be completed to generate receipts.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bills.map((bill) => (
                    <div 
                      key={bill.id}
                      onClick={() => setSelectedBill(bill)}
                      className={`border p-4 rounded-xl cursor-pointer hover:border-emerald-500/40 transition-all flex justify-between items-center bg-card ${
                        selectedBill?.id === bill.id ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-border/80'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            Bill #{bill.id.slice(-6).toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusStyle(bill.status)}`}>
                            {bill.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {bill.order.table ? `Table T${bill.order.table.number}` : bill.order.orderType} • {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs font-semibold text-foreground">
                          {bill.order.customerName || 'Walk-in Customer'}
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1.5">
                        <p className="text-lg font-black text-foreground">₹{bill.total.toFixed(2)}</p>
                        {bill.paymentMethod && (
                          <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded border border-border flex items-center gap-1">
                            {getPaymentMethodIcon(bill.paymentMethod)}
                            {bill.paymentMethod}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right panel: Receipt Preview */}
          <div className="w-full md:w-[360px] bg-muted/20 p-6 flex flex-col overflow-hidden border-t md:border-t-0 md:border-l border-border/50">
            {selectedBill ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-primary" />
                    Receipt Preview
                  </h4>
                  <Button
                    onClick={() => handlePrintReceipt(selectedBill)}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Receipt
                  </Button>
                </div>

                {/* Printable receipt box */}
                <div 
                  id={`receipt-print-content-${selectedBill.id}`}
                  className="flex-1 bg-card text-card-foreground border border-border/80 rounded-2xl p-5 font-mono text-xs overflow-y-auto custom-scrollbar shadow-inner"
                >
                  <div className="text-center mb-4">
                    <h2 className="text-sm font-black uppercase tracking-wider mb-0.5">GEN-Z POS</h2>
                    <p className="text-[10px] text-muted-foreground">GST No: 07AABCG1234A1Z5</p>
                    <p className="text-[10px] text-muted-foreground">Tel: +91 98765 43210</p>
                  </div>

                  <div className="border-t border-b border-dashed border-border py-2 mb-4 text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span>Order #:</span>
                      <span>{selectedBill.order.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{new Date(selectedBill.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Table:</span>
                      <span>{selectedBill.order.table ? `Table T${selectedBill.order.table.number}` : selectedBill.order.orderType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span>{selectedBill.order.customerName || 'Walk-in'}</span>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-border pb-2 mb-3">
                    <div className="flex justify-between font-bold text-[10px] uppercase tracking-wider mb-1.5">
                      <span>Item</span>
                      <span>Amt</span>
                    </div>
                    <div className="space-y-1.5 text-[10px]">
                      {selectedBill.order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-start">
                          <span>{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                          <span>₹{(item.quantity * item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>₹{selectedBill.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>CGST (9%)</span>
                      <span>₹{(selectedBill.tax / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>SGST (9%)</span>
                      <span>₹{(selectedBill.tax / 2).toFixed(2)}</span>
                    </div>
                    {selectedBill.discount > 0 && (
                      <div className="flex justify-between text-green-500 font-bold">
                        <span>Discount</span>
                        <span>-₹{selectedBill.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm border-t border-border pt-2 mt-2">
                      <span>TOTAL</span>
                      <span>₹{selectedBill.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {selectedBill.status === 'PAID' && (
                    <div className="mt-4 text-center font-bold border border-green-500/40 text-green-600 bg-green-500/5 py-1.5 rounded-lg text-[10px]">
                      ✓ PAID VIA {selectedBill.paymentMethod || 'CASH'}
                    </div>
                  )}

                  <div className="text-center mt-5 text-[9px] text-muted-foreground space-y-0.5">
                    <p>Thank you for dining with us! 💚</p>
                    <p>Visit again at genzpos.com</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                <Receipt className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="font-semibold text-sm text-muted-foreground">Select a bill from the history list to preview receipt details.</p>
              </div>
            )}
          </div>

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
