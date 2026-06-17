'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';
import { Portal } from '@/components/ui/portal';

export default function BillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const [completedOrders, setCompletedOrders] = useState<any[]>([]);

  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both bills and completed orders concurrently
      const [billsResponse, ordersResponse] = await Promise.all([
        fetch('/api/bills'),
        fetch('/api/orders?status=COMPLETED')
      ]);

      if (!billsResponse.ok || !ordersResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const billsJson = await billsResponse.json();
      const ordersData = await ordersResponse.json();

      const billsData = billsJson.data ?? billsJson;
      setBills(Array.isArray(billsData) ? billsData : []);
      setCompletedOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error fetching data:', err);
      toast.error('Failed to load bills data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async (orderId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate bill');
      }

      setShowGenerateModal(false);
      toast.success('Bill generated successfully!');
      await fetchBills();
      
      // Auto-open the newly generated bill by finding it from the updated list
      // Since fetchBills might take time, let's wait a bit and then find the bill
      setTimeout(async () => {
        const updatedBillsRes = await fetch('/api/bills');
        const updatedBillsJson = await updatedBillsRes.json();
        const updatedBills = updatedBillsJson.data ?? updatedBillsJson;
        if (Array.isArray(updatedBills)) {
          const newBill = updatedBills.find((b: any) => b.orderId === orderId);
          if (newBill) {
            setSelectedBill(newBill);
            setShowBillModal(true);
          }
        }
      }, 500);
    } catch (err) {
      setError('Failed to generate bill. Please try again.');
      console.error('Error generating bill:', err);
      toast.error('Failed to generate bill');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (billId: string, paymentMethod: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paymentMethod
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update bill status');
      }

      toast.success('Payment recorded successfully!');
      setShowPaymentModal(false);
      setShowBillModal(false);
      setSelectedBill(null);
      await fetchBills();
    } catch (err) {
      setError('Failed to update bill status. Please try again.');
      console.error('Error updating bill status:', err);
      toast.error('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleClearTable = async (tableId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tables/${tableId}/clear`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to clear table');
      }
      toast.success('Table cleared successfully!');
    } catch (err) {
      setError('Failed to clear table. Please try again.');
      console.error('Error clearing table:', err);
      toast.error('Failed to clear table');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = (bill: any) => {
    setSelectedBill(bill);
    setShowPaymentModal(true);
    setPaymentConfirmed(false);
  };

  // UPI QR Code payload format: upi://pay?pa=ADDRESS&pn=NAME&am=AMOUNT&cu=INR
  const generateUPIPayload = (bill: any) => {
    const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'restaurant@upi';
    const merchantName = 'Gen-Z POS';
    const amount = bill.total.toFixed(2);
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=Bill_${bill.id}`;
  };

  const handlePrintBill = () => {
    if (selectedBill) {
      const printContents = document.getElementById('print-receipt')?.innerHTML;
      if (printContents) {
        const printWindow = window.open('', '', 'height=800,width=600');
        if (printWindow) {
          printWindow.document.write(`
            <html><head><title>Bill Receipt</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              .receipt { max-width: 400px; margin: 0 auto; }
              .text-center { text-align: center; }
              .border-t { border-top: 1px dashed #000; }
              .border-b { border-bottom: 1px dashed #000; }
              .flex { display: flex; justify-content: space-between; }
              .font-bold { font-weight: bold; }
              .mt-4 { margin-top: 16px; }
            </style>
            </head><body onload="window.print(); window.close();">
            <div class="receipt">${printContents}</div>
            </body></html>
          `);
          printWindow.document.close();
        }
      }
    }
  };

  if (loading && bills.length === 0) {
    return (
      <div className="min-h-[600px] flex items-center justify-center animate-fade-in">
        <div className="text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-r-4 border-green-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-4 rounded-full border-b-4 border-blue-500 animate-spin" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">🧾</div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground tracking-tight">Loading Billing System</h3>
            <p className="text-muted-foreground font-medium">Fetching recent bills and completed orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="text-red-500">{error}</p>
        <Button onClick={() => { setError(null); fetchBills(); }} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  // Find completed orders without bills for the quick generate button
  const completedOrdersWithoutBills = completedOrders.filter(
    (order: any) => !bills.some((bill: any) => bill.orderId === order.id)
  );

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <h1 className="text-2xl font-bold flex items-center justify-between text-foreground">
          Bills & Payments
          <Button
            onClick={() => setShowGenerateModal(true)}
            disabled={completedOrdersWithoutBills.length === 0}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Generate Bill
          </Button>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate and manage bills for completed orders
        </p>
      </div>

      {/* Unified Payment Modal */}
      {showPaymentModal && selectedBill && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card text-card-foreground rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 animate-fade-in">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-foreground">Payment Collection</h2>
                  <p className="text-sm text-muted-foreground mt-1">Select payment method for Bill #{selectedBill.id}</p>
                </div>
                <Button onClick={() => setShowPaymentModal(false)} variant="outline" size="sm">✕</Button>
              </div>

              {/* Payment Details Summary */}
              <div className="bg-muted/50 rounded-xl p-4 mb-6 border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Total Amount Due</span>
                  <span className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                    ₹{selectedBill.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground/80">
                  <span>Table {selectedBill.order.table?.number}</span>
                  <span>{selectedBill.order.customerName || 'Walk-in'}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-bold text-foreground/80">Select Method</h3>
                
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentConfirmed('CASH' as any)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      paymentConfirmed === ('CASH' as any) ? 'border-green-500/50 bg-green-500/10 text-green-500' : 'border-border hover:border-green-500/30 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="text-2xl">💵</span>
                    <span className="text-xs font-bold">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentConfirmed('CARD' as any)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      paymentConfirmed === ('CARD' as any) ? 'border-blue-500/50 bg-blue-500/10 text-blue-500' : 'border-border hover:border-blue-500/30 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="text-2xl">💳</span>
                    <span className="text-xs font-bold">Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentConfirmed('UPI' as any)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      paymentConfirmed === ('UPI' as any) ? 'border-orange-500/50 bg-orange-500/10 text-orange-500' : 'border-border hover:border-orange-500/30 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="text-2xl">📱</span>
                    <span className="text-xs font-bold">UPI</span>
                  </button>
                </div>
              </div>

              {/* UPI QR Code Section */}
              {paymentConfirmed === ('UPI' as any) && (
                <div className="bg-primary/10 rounded-xl p-4 mb-6 flex flex-col items-center animate-fade-in border border-primary/20">
                  <div className="bg-white p-2 rounded-lg shadow-sm mb-2">
                    <QRCodeSVG
                      value={generateUPIPayload(selectedBill)}
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
                onClick={() => handleMarkPaid(selectedBill.id, paymentConfirmed as any)}
                variant="gradient"
                className="w-full h-12 text-lg font-bold"
                disabled={!paymentConfirmed}
              >
                Confirm {paymentConfirmed ? String(paymentConfirmed) : ''} Payment
              </Button>
            </div>
          </div>
        </Portal>
      )}

      {/* Generate Bill Modal */}
      {showGenerateModal && (
        <Portal>
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card text-card-foreground rounded-2xl shadow-xl w-full max-w-lg p-6 border border-border">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-foreground">Select Order to Bill</h2>
                <Button
                  onClick={() => setShowGenerateModal(false)}
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground"
                >
                  Close
                </Button>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-3 custom-scrollbar">
                {completedOrdersWithoutBills.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No unbilled completed orders.</p>
                ) : (
                  completedOrdersWithoutBills.map((order: any) => (
                    <div key={order.id} className="border border-border p-4 rounded-xl flex justify-between items-center bg-muted/30">
                      <div>
                        <h3 className="font-bold text-foreground">Table {order.table?.number || 'Unknown'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.customerName || 'Walk-in'} • ₹{order.totalAmount?.toFixed(2)}
                        </p>
                      </div>
                      <Button 
                        onClick={() => handleGenerateBill(order.id)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Generate
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Bill Modal */}
      {showBillModal && selectedBill && (
        <Portal>
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card text-card-foreground rounded-2xl shadow-xl border border-border w-full max-w-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-foreground">Bill #{selectedBill.id}</h2>
                <Button
                  onClick={() => setShowBillModal(false)}
                  variant="outline"
                  className="text-muted-foreground hover:bg-muted"
                >
                  Close
                </Button>
              </div>

              <div id="print-receipt" className="mb-6 p-6 bg-card text-card-foreground rounded-2xl border border-border print:bg-white print:text-black print:border-none print:w-full print:max-w-full print:p-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
                <div className="text-center mb-4">
                  <div className="flex justify-center mb-3">
                    <div className="w-32 rounded-lg overflow-hidden bg-white p-2">
                      <Image src="/logo.svg" alt="Gen-Z POS" width={128} height={128} className="w-full" />
                    </div>
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-wider mb-1">Gen-Z POS</h2>
                  <p className="text-xs text-muted-foreground print:text-gray-600">123 Main Street, New Delhi, India</p>
                  <p className="text-xs text-muted-foreground print:text-gray-600">GST No: 07AABCG1234A1Z5</p>
                  <p className="text-xs text-muted-foreground print:text-gray-600">Tel: +91 98765 43210</p>
                </div>

                <div className="border-t border-b border-dashed border-border py-3 mb-4 text-xs space-y-1.5 bg-muted/30 print:bg-transparent p-3 rounded-lg print:border-black">
                  <div className="flex justify-between">
                    <span className="font-semibold">Order #:</span>
                    <span className="font-mono">{selectedBill.order.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Date:</span>
                    <span>{new Date(selectedBill.order.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Table:</span>
                    <span className="font-bold">Table {selectedBill.order.table?.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Customer:</span>
                    <span>{selectedBill.order.customerName || 'Walk-in'}</span>
                  </div>
                  {selectedBill.order.customerPhone && (
                    <div className="flex justify-between">
                      <span className="font-semibold">Phone:</span>
                      <span>{selectedBill.order.customerPhone}</span>
                    </div>
                  )}
                </div>

                <div className="mb-4 bg-muted/30 print:bg-transparent p-3 rounded-lg">
                  <div className="flex justify-between font-black text-foreground border-b border-border pb-2 mb-2 text-xs uppercase tracking-wider print:border-black">
                    <span>Item</span>
                    <span>Amt</span>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const mergedItems = selectedBill.order.items.reduce((acc: any[], item: any) => {
                        const cleanInstr = (item.specialInstructions || '').replace('[URGENT ADDITION]', '').trim();
                        const existing = acc.find(i => i.menuItem?.id === item.menuItem?.id && i.cleanInstr === cleanInstr);
                        if (existing) {
                          existing.quantity += item.quantity;
                        } else {
                          acc.push({ ...item, cleanInstr });
                        }
                        return acc;
                      }, []);

                      return mergedItems.map((item: any, idx: number) => (
                        <div key={idx} className="text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-foreground print:text-black">{item.quantity}x {item.menuItem.name}</span>
                            <span className="font-semibold">₹{(item.quantity * item.price).toFixed(2)}</span>
                          </div>
                          {item.cleanInstr && (
                            <div className="text-red-500 text-xs mt-0.5 ml-1 font-medium">
                              ⚠️ {item.cleanInstr}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="border-t border-dashed border-border pt-3 space-y-2 text-xs bg-muted/30 print:bg-transparent p-3 rounded-lg print:border-black">
                  <div className="flex justify-between text-muted-foreground print:text-black">
                    <span>Subtotal</span>
                    <span>₹{selectedBill.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground print:text-black">
                    <span>CGST (9%)</span>
                    <span>₹{((selectedBill.tax || 0) / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground print:text-black">
                    <span>SGST (9%)</span>
                    <span>₹{((selectedBill.tax || 0) / 2).toFixed(2)}</span>
                  </div>
                  {(selectedBill.discount || 0) > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>Discount</span>
                      <span>-₹{(selectedBill.discount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-lg mt-3 pt-3 border-t border-border bg-primary/10 print:bg-transparent p-2 rounded print:border-black">
                    <span>TOTAL</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 print:text-black">₹{selectedBill.total.toFixed(2)}</span>
                  </div>
                </div>

                {selectedBill.status === 'PAID' && (
                  <div className="mt-4 text-center font-black text-sm border border-green-500/50 text-green-500 py-2 rounded-lg bg-green-500/10">
                    ✓ PAID VIA {selectedBill.paymentMethod || 'CASH'}
                  </div>
                )}

                <div className="text-center mt-6 text-xs text-muted-foreground print:text-gray-500">
                  <p className="font-medium">Thank you for dining with us! 💚</p>
                  <p className="mt-1">Visit us again at genzpos.com</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-foreground mb-2">Payment Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status:</p>
                    <p className={`text-lg font-medium
                      ${selectedBill.status === 'PENDING' ? 'text-yellow-500' : 'text-green-500'}`}>
                      {selectedBill.status.charAt(0).toUpperCase() + selectedBill.status.slice(1)}
                    </p>
                  </div>
                  {selectedBill.status === 'PAID' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method:</p>
                      <p className="text-lg font-medium text-foreground">{selectedBill.paymentMethod || 'Not specified'}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                {selectedBill.status === 'PENDING' && (
                  <>
                    {selectedBill.order.tableId && (
                      <Button
                        onClick={() => handleClearTable(selectedBill.order.tableId)}
                        variant="outline"
                        className="border-red-500/50 text-red-500 hover:bg-red-500/10 mr-auto"
                      >
                        🧹 Clear Table
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setPaymentConfirmed(false);
                        setShowPaymentModal(true);
                      }}
                      variant="gradient"
                      className="bg-gradient-to-r from-orange-600 to-amber-600"
                    >
                      💳 Make Payment
                    </Button>
                    <Button
                      onClick={handlePrintBill}
                      variant="outline"
                    >
                      🖨️ Print
                    </Button>
                  </>
                )}

                {selectedBill.status === 'PAID' && (
                  <Button
                    onClick={handlePrintBill}
                    variant="gradient"
                    className="bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    🖨️ Re-print Bill
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Bills List */}
      <Card className="p-6 border-border/60">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Bill History</h2>

        {bills.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No bills generated yet. Complete some orders to generate bills.
          </p>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => (
              <div key={bill.id} className="border border-border bg-card rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-foreground">Bill #{bill.id}</h3>
                    <p className="text-sm text-muted-foreground">
                      Order #{bill.order.id} • {bill.order.table ? `Table #${bill.order.table.number}` : bill.order.orderType} •
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border
                      ${bill.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </span>
                    <Button
                      onClick={() => {
                        setSelectedBill(bill);
                        setShowBillModal(true);
                      }}
                      variant={bill.status === 'PENDING' ? 'default' : 'outline'}
                      size="sm"
                      className={bill.status === 'PENDING' ? 'bg-primary text-primary-foreground font-bold shadow-md' : 'text-primary hover:bg-primary/10 border-transparent shadow-none'}
                    >
                      {bill.status === 'PENDING' ? 'View & Pay' : 'View / Print'}
                    </Button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-lg font-medium text-right text-foreground">
                    Amount: ₹{bill.total.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

BillsPage.displayName = 'BillsPage';