'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Portal } from '@/components/ui/portal';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/lib/useAuth';
import { toast } from 'sonner';

interface PaymentModalProps {
  bill: any;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

// Helper function to calculate final total including GST
const calculateFinalTotal = (bill: any, discountPct: number = 0, pointsAmt: number = 0, includeGst: boolean = true) => {
  // Base amount with optional GST
  const baseAmount = bill.subtotal + (includeGst ? (bill.tax || 0) : 0);
  const discountAmt = (bill.subtotal * discountPct) / 100;
  return Math.max(0, baseAmount - discountAmt - pointsAmt);
};

const generateUPIPayload = (bill: any) => {
  const upiId = 'merchant@upi'; // Replace with actual UPI ID
  const name = 'GenZ Restaurant';
  const amount = bill.finalAmount.toFixed(2);
  const txnNote = `Bill #${bill.id.slice(-4)}`;
  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(txnNote)}&cu=INR`;
};

export function PaymentModal({ bill, isOpen, onClose, onPaymentSuccess }: PaymentModalProps) {
  const { user, isAdmin, isStaff } = useAuth();
  
  const [paymentConfirmed, setPaymentConfirmed] = useState<'CASH' | 'CARD' | 'UPI' | null>(null);
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
          pointsRedeemed: pointsToRedeem ? parseInt(pointsToRedeem) : 0,
          cashAmount: isSplitPayment && cashAmount ? parseFloat(cashAmount) : undefined,
          onlineAmount: isSplitPayment && onlineAmount ? parseFloat(onlineAmount) : undefined,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update bill');
      }

      toast.success('Payment collected successfully! 💰');
      
      // Trigger print after successful payment
      setTimeout(() => {
        window.print();
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
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="bg-card text-card-foreground rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-foreground">Payment Collection</h2>
              <p className="text-sm text-muted-foreground mt-1">Bill #{bill.id.slice(-8).toUpperCase()}</p>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">✕</Button>
          </div>

          {/* Payment Details Summary */}
          <div className="bg-muted/50 rounded-xl p-4 mb-6 border border-border">
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
            <div className="flex justify-between text-xs text-muted-foreground/80 mt-2">
              <span>Table {bill.order?.table?.number || 'N/A'}</span>
              <span>{bill.order?.customerName || 'Walk-in'}</span>
            </div>
          </div>

          {/* Customer Name Field */}
          <div className="mb-4">
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

          {/* Customer Phone Field */}
          <div className="mb-4">
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
              <p className="text-xs text-muted-foreground mt-1">Checking customer...</p>
            )}
            {customerData && (
              <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm font-bold text-green-600">Welcome back, {customerData.name || 'Valued Customer'}!</p>
                <p className="text-xs text-muted-foreground">Visit #{customerData.totalVisits + 1} · {customerData.pointsBalance} points available (worth ₹{customerData.pointsBalance})</p>
              </div>
            )}
          </div>

          {/* Discount Section */}
          <div className="mb-4">
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
                  
                  // Show error if STAFF tries to exceed 15%
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
          <div className="mb-4">
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
            <div className="mb-4">
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
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-bold text-foreground/80">Select Payment Method</h3>
            
            <div className="grid grid-cols-4 gap-3">
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
                  setPaymentConfirmed('UPI');
                  setIsSplitPayment(false);
                  setCashAmount('');
                  setOnlineAmount('');
                }}
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                  paymentConfirmed === 'UPI' && !isSplitPayment ? 'border-orange-500/50 bg-orange-500/10 text-orange-500' : 'border-border hover:border-orange-500/30 hover:bg-muted text-muted-foreground'
                }`}
              >
                <span className="text-2xl">📱</span>
                <span className="text-xs font-bold">UPI</span>
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
            <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-3">
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

          {/* UPI QR Code Section */}
          {paymentConfirmed === 'UPI' && !isSplitPayment && (
            <div className="bg-primary/10 rounded-xl p-4 mb-6 flex flex-col items-center animate-fade-in border border-primary/20">
              <div className="bg-white p-2 rounded-lg shadow-sm mb-2">
                <QRCodeSVG
                  value={generateUPIPayload(bill)}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-center text-primary font-medium">Scan to pay with any UPI app</p>
            </div>
          )}

          {/* Actions */}
          <Button
            onClick={handlePayAndPrint}
            variant="gradient"
            className="w-full h-14 text-lg font-bold"
            disabled={!paymentConfirmed || isProcessing}
          >
            {isProcessing ? 'Processing...' : '💳 Pay & Print Receipt'}
          </Button>
        </div>
      </div>
    </Portal>
  );
}
