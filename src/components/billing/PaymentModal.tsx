'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Portal } from '@/components/ui/portal';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/lib/useAuth';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

interface PaymentModalProps {
  bill: any;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onAddItem?: () => void; // Optional callback to add items
}

// Helper function to calculate final total including GST
const calculateFinalTotal = (bill: any, discountPct: number = 0, pointsAmt: number = 0, includeGst: boolean = true) => {
  // Base amount with optional GST
  const baseAmount = bill.subtotal + (includeGst ? (bill.tax || 0) : 0);
  const discountAmt = (bill.subtotal * discountPct) / 100;
  return Math.max(0, baseAmount - discountAmt - pointsAmt);
};

// Helper function to print receipt
const printReceipt = (bill: any) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Please allow popups to print the receipt');
    return;
  }

  // Merge items
  const mergeItems = (items: any[]) => {
    const merged: any[] = [];
    items.forEach((item: any) => {
      const cleanInstr = (item.specialInstructions || '').replace('[URGENT ADDITION]', '').trim();
      const existing = merged.find(
        i => i.menuItem?.id === item.menuItem?.id && i.cleanInstr === cleanInstr
      );
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        merged.push({ ...item, cleanInstr });
      }
    });
    return merged;
  };

  const mergedItems = bill.order?.items ? mergeItems(bill.order.items) : [];

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${bill.id.slice(-8).toUpperCase()}</title>
      <style>
        @page { margin: 10mm; size: 80mm auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; color: #000; background: #fff; padding: 10px; max-width: 300px; margin: 0 auto; }
        .receipt-header { text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
        .restaurant-name { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; }
        .restaurant-info { font-size: 10px; line-height: 1.5; }
        .bill-info { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; font-size: 11px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .info-label { font-weight: bold; }
        .items-section { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
        .items-header { display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 8px; font-size: 11px; text-transform: uppercase; }
        .item-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; }
        .item-name { flex: 1; font-weight: 600; }
        .item-price { font-weight: bold; min-width: 70px; text-align: right; }
        .item-special { color: #666; font-size: 10px; margin-left: 15px; margin-top: 2px; }
        .totals-section { padding-bottom: 10px; margin-bottom: 10px; font-size: 11px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .total-final { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
        .payment-status { text-align: center; font-weight: bold; font-size: 12px; padding: 8px; border: 2px solid #000; margin: 10px 0; text-transform: uppercase; }
        .footer { text-align: center; border-top: 2px dashed #000; padding-top: 10px; margin-top: 15px; font-size: 10px; }
        .footer-message { font-weight: bold; margin-bottom: 5px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="receipt-header">
        <div class="restaurant-name">Gen-Z Restaurant</div>
        <div class="restaurant-info">
          <div>123 Main Street, New Delhi, India</div>
          <div>GST No: 07AABCG1234A1Z5</div>
          <div>Tel: +91 98765 43210</div>
        </div>
      </div>

      <div class="bill-info">
        <div class="info-row">
          <span class="info-label">Bill #:</span>
          <span>${bill.id.slice(-8).toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span>${new Date(bill.order?.createdAt || bill.createdAt).toLocaleString('en-IN')}</span>
        </div>
        ${bill.order?.table ? `
        <div class="info-row">
          <span class="info-label">Table:</span>
          <span>Table ${bill.order.table.number}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Customer:</span>
          <span>${bill.order?.customerName || 'Walk-in Customer'}</span>
        </div>
        ${bill.order?.customerPhone ? `
        <div class="info-row">
          <span class="info-label">Phone:</span>
          <span>${bill.order.customerPhone}</span>
        </div>
        ` : ''}
      </div>

      <div class="items-section">
        <div class="items-header">
          <span>Item</span>
          <span>Amount</span>
        </div>
        ${mergedItems.map((item: any) => `
          <div>
            <div class="item-row">
              <span class="item-name">${item.quantity}× ${item.menuItem?.name || 'Unknown Item'}</span>
              <span class="item-price">₹${(item.quantity * (item.menuItem?.price || item.price || 0)).toFixed(2)}</span>
            </div>
            ${item.cleanInstr ? `<div class="item-special">Note: ${item.cleanInstr}</div>` : ''}
          </div>
        `).join('')}
      </div>

      <div class="totals-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>₹${bill.subtotal.toFixed(2)}</span>
        </div>
        ${bill.gstApplied !== false ? `
        <div class="total-row">
          <span>CGST (9%):</span>
          <span>₹${((bill.tax || 0) / 2).toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>SGST (9%):</span>
          <span>₹${((bill.tax || 0) / 2).toFixed(2)}</span>
        </div>
        ` : ''}
        ${bill.discountPercent > 0 ? `
        <div class="total-row">
          <span>Discount (${bill.discountPercent}%):</span>
          <span>-₹${((bill.subtotal * bill.discountPercent) / 100).toFixed(2)}</span>
        </div>
        ` : ''}
        ${bill.pointsRedeemed > 0 ? `
        <div class="total-row">
          <span>Points Redeemed:</span>
          <span>-₹${bill.pointsRedeemed.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="total-row total-final">
          <span>TOTAL:</span>
          <span>₹${bill.total.toFixed(2)}</span>
        </div>
      </div>

      ${bill.status === 'PAID' ? `
      <div class="payment-status">
        ✓ PAID - ${bill.paymentMethod || 'CASH'}
      </div>
      ` : ''}

      ${bill.paymentMethod === 'SPLIT' ? `
      <div class="totals-section">
        <div class="total-row">
          <span>Cash:</span>
          <span>₹${(bill.cashAmount || 0).toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Online:</span>
          <span>₹${(bill.onlineAmount || 0).toFixed(2)}</span>
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <div class="footer-message">Thank you for dining with us! 💚</div>
        <div>Visit us again soon!</div>
        <div>www.genzrestaurant.com</div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
};

export function PaymentModal({ bill, isOpen, onClose, onPaymentSuccess, onAddItem }: PaymentModalProps) {
  const { user, isAdmin, isStaff } = useAuth();
  
  const [paymentConfirmed, setPaymentConfirmed] = useState<'CASH' | 'CARD' | null>(null);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [onlineAmount, setOnlineAmount] = useState<string>('');
  
  // Customer and loyalty state
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerData, setCustomerData] = useState<any>(null);
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false);
  
  // Discount state
  const [discountPercent, setDiscountPercent] = useState<string>('');
  const [pointsToRedeem, setPointsToRedeem] = useState<string>('');
  const [discountError, setDiscountError] = useState<string>('');
  
  // GST toggle state
  const [gstApplied, setGstApplied] = useState(true);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Debounced customer lookup
  useEffect(() => {
    if (!customerPhone || customerPhone.length < 10) {
      setCustomerData(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingCustomer(true);
      try {
        const response = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(customerPhone)}`);
        if (response.ok) {
          const data = await response.json();
          setCustomerData(data);
        } else {
          setCustomerData(null);
        }
      } catch (error) {
        console.error('Error looking up customer:', error);
        setCustomerData(null);
      } finally {
        setIsCheckingCustomer(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [customerPhone]);

  const handlePayAndPrint = async () => {
    if (!paymentConfirmed || isProcessing) return;

    // Validate split payment amounts
    if (isSplitPayment) {
      const cash = cashAmount ? parseFloat(cashAmount) : 0;
      const online = onlineAmount ? parseFloat(onlineAmount) : 0;
      const finalTotal = calculateFinalTotal(
        bill,
        discountPercent ? parseFloat(discountPercent) : 0,
        pointsToRedeem ? parseInt(pointsToRedeem) : 0,
        gstApplied
      );
      
      if (Math.abs(cash + online - finalTotal) > 0.01) {
        toast.error('Split payment amounts must match the bill total');
        return;
      }
    }

    // Validate staff discount limit
    const discount = discountPercent ? parseFloat(discountPercent) : 0;
    if (isStaff && discount > 15) {
      toast.error('Staff discount limit is 15%. Please contact admin.');
      return;
    }

    setIsProcessing(true);

    try {
      const updateResponse = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paymentMethod: isSplitPayment ? 'SPLIT' : paymentConfirmed,
          gstApplied,
          customerName: customerName || bill.order?.customerName || undefined,
          customerPhone: customerPhone || bill.order?.customerPhone || undefined,
          discount: discount || 0,
          discountPercent: discount || 0,
          pointsRedeemed: pointsToRedeem ? parseInt(pointsToRedeem) : 0,
          cashAmount: isSplitPayment && cashAmount ? parseFloat(cashAmount) : paymentConfirmed === 'CASH' ? calculateFinalTotal(bill, discount, pointsToRedeem ? parseInt(pointsToRedeem) : 0, gstApplied) : 0,
          onlineAmount: isSplitPayment && onlineAmount ? parseFloat(onlineAmount) : (paymentConfirmed === 'CARD') ? calculateFinalTotal(bill, discount, pointsToRedeem ? parseInt(pointsToRedeem) : 0, gstApplied) : 0,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update bill');
      }

      const updatedBill = await updateResponse.json();
      
      toast.success('Payment collected successfully! 💰');
      
      // Trigger print with proper receipt content
      setTimeout(() => {
        printReceipt(updatedBill);
      }, 300);

      onPaymentSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" 
          onClick={onClose} 
        />
        <div className="relative bg-background text-foreground rounded-3xl shadow-2xl border-2 border-border w-full max-w-6xl max-h-[90vh] overflow-hidden animate-scale-in flex flex-col z-[210]">
          
          {/* Header - spans both columns */}
          <div className="flex justify-between items-start p-6 border-b-2 border-border bg-gradient-to-r from-primary/5 to-primary/10">
            <div>
              <h2 className="text-2xl font-black text-foreground">Payment Collection</h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>Bill #{bill.id.slice(-8).toUpperCase()}</span>
                {bill.order?.table && <span>Table {bill.order.table.number}</span>}
                <span>{bill.order?.customerName || 'Walk-in'}</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 hover:bg-muted/80 rounded-xl transition-all duration-200 hover:rotate-90"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          {/* Two-column layout */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            
            {/* LEFT COLUMN - Order Items */}
            <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
              <h3 className="text-lg font-bold text-foreground mb-4">Order Items</h3>
              
              <div className="space-y-3">
                {bill.order?.items?.map((item: any, index: number) => (
                  <div 
                    key={index}
                    className="flex justify-between items-start p-3 bg-muted/30 rounded-lg border border-border/50"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-foreground">
                        <span className="text-primary mr-2">{item.quantity}×</span>
                        {item.menuItem?.name || 'Unknown Item'}
                      </p>
                      {item.portionType && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/20 text-primary inline-block mt-1">
                          {item.portionType}
                        </span>
                      )}
                      {item.specialInstructions && (
                        <p className="text-sm text-muted-foreground mt-1">
                          📝 {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-muted-foreground">
                        ₹{(item.menuItem?.price || 0).toFixed(2)} each
                      </p>
                      <p className="font-bold text-foreground">
                        ₹{((item.menuItem?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {(!bill.order?.items || bill.order.items.length === 0) && (
                  <p className="text-muted-foreground text-center py-8">No items in this order</p>
                )}
              </div>

              {/* Add Item Button */}
              {onAddItem && (
                <button
                  onClick={onAddItem}
                  className="w-full mt-4 p-3 border-2 border-dashed border-border hover:border-primary/50 rounded-lg flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Add Item</span>
                </button>
              )}
            </div>

            {/* RIGHT COLUMN - Payment & Customer */}
            <div className="w-full lg:w-[480px] flex flex-col">
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                
                {/* Payment Summary */}
                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="font-bold text-foreground">₹{bill.subtotal.toFixed(2)}</span>
                  </div>
                  {gstApplied && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">GST (18%)</span>
                      <span className="font-bold text-foreground">₹{(bill.tax || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {discountPercent && parseFloat(discountPercent) > 0 && (
                    <div className="flex justify-between items-center mb-2 text-green-600">
                      <span className="text-sm">Discount ({discountPercent}%)</span>
                      <span className="font-bold">-₹{((bill.subtotal * parseFloat(discountPercent)) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {pointsToRedeem && parseInt(pointsToRedeem) > 0 && (
                    <div className="flex justify-between items-center mb-2 text-green-600">
                      <span className="text-sm">Points Redeemed ({pointsToRedeem})</span>
                      <span className="font-bold">-₹{parseInt(pointsToRedeem).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-sm font-bold text-foreground">Total Amount Due</span>
                    <span className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                      ₹{(() => {
                        const discountPct = discountPercent ? parseFloat(discountPercent) : 0;
                        const pointsAmt = pointsToRedeem ? parseInt(pointsToRedeem) : 0;
                        return calculateFinalTotal(bill, discountPct, pointsAmt, gstApplied).toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>

                {/* Customer Name */}
                <div>
                  <label htmlFor="customerName" className="block text-sm font-semibold text-foreground mb-2">
                    Customer Name (Optional)
                  </label>
                  <Input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full"
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-semibold text-foreground mb-2">
                    Customer Phone Number (Optional)
                  </label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter 10-digit phone number"
                    className="w-full"
                    maxLength={10}
                  />
                  {isCheckingCustomer && (
                    <p className="text-xs text-muted-foreground mt-1 animate-pulse">Checking customer...</p>
                  )}
                  {customerData && (
                    <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm font-bold text-green-600">Welcome back, {customerData.name || 'Valued Customer'}!</p>
                      <p className="text-xs text-muted-foreground">Visit #{customerData.totalVisits + 1} · {customerData.pointsBalance} points available (worth ₹{customerData.pointsBalance})</p>
                    </div>
                  )}
                </div>

                {/* Discount */}
                <div>
                  <label htmlFor="discountPercent" className="block text-sm font-semibold text-foreground mb-2">
                    Apply Discount (%) {isStaff && <span className="text-xs text-amber-600">(Staff max: 15%)</span>}
                  </label>
                  <Input
                    id="discountPercent"
                    type="number"
                    value={discountPercent}
                    onChange={(e) => {
                      const val = e.target.value;
                      const numVal = parseFloat(val);
                      
                      if (!val || (numVal >= 0 && numVal <= 30)) {
                        setDiscountPercent(val);
                        
                        if (isStaff && numVal > 15) {
                          setDiscountError('Discounts above 15% require admin approval');
                        } else {
                          setDiscountError('');
                        }
                      }
                    }}
                    placeholder="0"
                    className={`w-full ${discountError ? 'border-red-500' : ''}`}
                    min="0"
                    max={isStaff ? 15 : 30}
                    step="0.1"
                  />
                  {discountError ? (
                    <p className="text-xs text-red-500 mt-1">{discountError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum discount: {isStaff ? '15%' : '30%'}
                    </p>
                  )}
                </div>

                {/* GST Toggle */}
                <div>
                  <label className="flex items-center justify-between cursor-pointer p-3 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-semibold text-foreground">Apply GST (18%)</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={gstApplied}
                        onChange={(e) => setGstApplied(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {gstApplied ? 'GST will be applied to this bill' : 'Bill will be generated without GST'}
                  </p>
                </div>

                {/* Points Redemption - ADMIN ONLY */}
                {(isAdmin === true) && customerData && customerData.pointsBalance > 0 && (
                  <div>
                    <label htmlFor="pointsToRedeem" className="block text-sm font-semibold text-foreground mb-2">
                      Redeem Points (1 point = ₹1)
                    </label>
                    <Input
                      id="pointsToRedeem"
                      type="number"
                      value={pointsToRedeem}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = val ? parseInt(val) : 0;
                        const maxRedeem = Math.min(
                          customerData.pointsBalance,
                          bill.subtotal - (discountPercent ? (bill.subtotal * parseFloat(discountPercent)) / 100 : 0)
                        );
                        if (!val || (numVal >= 0 && numVal <= maxRedeem)) {
                          setPointsToRedeem(val);
                        }
                      }}
                      placeholder="0"
                      className="w-full"
                      min="0"
                      max={Math.min(customerData.pointsBalance, bill.subtotal)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: {customerData.pointsBalance} points · Max redeemable: {Math.floor(Math.min(
                        customerData.pointsBalance,
                        bill.subtotal - (discountPercent ? (bill.subtotal * parseFloat(discountPercent)) / 100 : 0)
                      ))}
                    </p>
                  </div>
                )}

                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground/80">Select Payment Method</h3>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        setPaymentConfirmed('CASH');
                        setIsSplitPayment(false);
                        setCashAmount('');
                        setOnlineAmount('');
                      }}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                        paymentConfirmed === 'CASH' && !isSplitPayment ? 'border-green-500/50 bg-green-500/10 text-green-500' : 'border-border hover:border-green-500/30 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <span className="text-2xl">💵</span>
                      <span className="text-xs font-bold">Cash</span>
                    </button>
                    <button
                      onClick={() => {
                        setPaymentConfirmed('CARD');
                        setIsSplitPayment(false);
                        setCashAmount('');
                        setOnlineAmount('');
                      }}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                        paymentConfirmed === 'CARD' && !isSplitPayment ? 'border-blue-500/50 bg-blue-500/10 text-blue-500' : 'border-border hover:border-blue-500/30 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <span className="text-2xl">💳</span>
                      <span className="text-xs font-bold">Card</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsSplitPayment(true);
                        setPaymentConfirmed('CASH');
                        setCashAmount('');
                        setOnlineAmount('');
                      }}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                        isSplitPayment ? 'border-purple-500/50 bg-purple-500/10 text-purple-500' : 'border-border hover:border-purple-500/30 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <span className="text-2xl">💰</span>
                      <span className="text-xs font-bold">Split</span>
                    </button>
                  </div>
                </div>

                {/* Split Payment Inputs */}
                {isSplitPayment && (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-3">
                    <h4 className="text-sm font-bold text-purple-600">Split Payment</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="cashAmount" className="block text-xs font-semibold text-foreground mb-1">
                          Cash Amount (₹)
                        </label>
                        <Input
                          id="cashAmount"
                          type="number"
                          value={cashAmount}
                          onChange={(e) => {
                            setCashAmount(e.target.value);
                            const finalTotal = calculateFinalTotal(
                              bill,
                              discountPercent ? parseFloat(discountPercent) : 0,
                              pointsToRedeem ? parseInt(pointsToRedeem) : 0,
                              gstApplied
                            );
                            const cash = e.target.value ? parseFloat(e.target.value) : 0;
                            const remaining = finalTotal - cash;
                            if (remaining >= 0) {
                              setOnlineAmount(remaining.toFixed(2));
                            }
                          }}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label htmlFor="onlineAmount" className="block text-xs font-semibold text-foreground mb-1">
                          Online Amount (₹)
                        </label>
                        <Input
                          id="onlineAmount"
                          type="number"
                          value={onlineAmount}
                          onChange={(e) => {
                            setOnlineAmount(e.target.value);
                            const finalTotal = calculateFinalTotal(
                              bill,
                              discountPercent ? parseFloat(discountPercent) : 0,
                              pointsToRedeem ? parseInt(pointsToRedeem) : 0,
                              gstApplied
                            );
                            const online = e.target.value ? parseFloat(e.target.value) : 0;
                            const remaining = finalTotal - online;
                            if (remaining >= 0) {
                              setCashAmount(remaining.toFixed(2));
                            }
                          }}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full"
                        />
                      </div>
                    </div>
                    {(() => {
                      const finalTotal = calculateFinalTotal(
                        bill,
                        discountPercent ? parseFloat(discountPercent) : 0,
                        pointsToRedeem ? parseInt(pointsToRedeem) : 0,
                        gstApplied
                      );
                      const cash = cashAmount ? parseFloat(cashAmount) : 0;
                      const online = onlineAmount ? parseFloat(onlineAmount) : 0;
                      const total = cash + online;
                      const difference = total - finalTotal;
                      
                      if (Math.abs(difference) > 0.01) {
                        return (
                          <p className="text-xs text-red-600 font-medium">
                            ⚠️ Amounts don&apos;t match bill total. Difference: ₹{Math.abs(difference).toFixed(2)} {difference > 0 ? 'excess' : 'short'}
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {/* Fixed Pay Button at bottom */}
              <div className="p-6 border-t border-border bg-card">
                <Button
                  onClick={handlePayAndPrint}
                  variant="gradient"
                  className="w-full h-14 text-lg font-bold"
                  disabled={!paymentConfirmed || isProcessing}
                >
                  {isProcessing ? (<><svg className="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</>) : '💳 Pay & Print Receipt'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
