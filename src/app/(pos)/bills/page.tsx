'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';

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

  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bills');
      if (!response.ok) {
        throw new Error('Failed to fetch bills');
      }
      const json = await response.json();
      // API wraps response in { success: true, data: [...] }
      const billsData = json.data ?? json;
      setBills(Array.isArray(billsData) ? billsData : []);
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

  const handleInitiatePayment = (bill: any) => {
    setSelectedBill(bill);
    setShowPaymentModal(true);
    setPaymentConfirmed(false);
  };

  // UPI QR Code payload format: upi://pay?pa=ADDRESS&pn=NAME&am=AMOUNT&cu=INR
  const generateUPIPayload = (bill: any) => {
    const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'restaurant@upi';
    const merchantName = 'Gen-Z Restaurant';
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
      <div className="space-y-6">
        <div className="h-10 w-1/4 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-xl"></div>
          ))}
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
  const completedOrdersWithoutBills = bills
    .map(bill => bill.order)
    .filter((order: any) => order && order.status === 'COMPLETED' && !bills.some((bill: any) => bill.orderId === order.id));

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <h1 className="text-2xl font-bold flex items-center justify-between">
          Bills & Payments
          <Button
            onClick={() => setShowGenerateModal(true)}
            disabled={completedOrdersWithoutBills.length === 0}
            className="bg-primary text-white"
          >
            Generate Bill
          </Button>
        </h1>
        <p className="text-sm text-gray-500">
          Generate and manage bills for completed orders
        </p>
      </div>

      {/* UPI Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center text-3xl mx-auto mb-4">
                💳
              </div>
              <h2 className="text-2xl font-black text-gray-900">Scan to Pay</h2>
              <p className="text-sm text-gray-500 mt-1">UPI QR Code for payment</p>
            </div>

            {/* QR Code Section */}
            <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl p-6 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-lg flex justify-center">
                <QRCodeSVG
                  value={generateUPIPayload(selectedBill)}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-center text-xs text-gray-600 mt-4 font-medium">
                Scan with any UPI app (GPay, PhonePe, Paytm, BHIM)
              </p>
            </div>

            {/* Payment Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Bill Amount</span>
                <span className="font-bold text-gray-900">₹{selectedBill.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Table Number</span>
                <span className="font-bold text-gray-900">Table {selectedBill.order.table?.number}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Customer</span>
                <span className="font-bold text-gray-900">{selectedBill.order.customerName || 'Walk-in'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  handleMarkPaid(selectedBill.id, 'UPI');
                }}
                variant="gradient"
                className="flex-1 h-12 text-lg"
                disabled={!paymentConfirmed}
              >
                ✓ Confirm Payment Received
              </Button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
              ⚠️ Only confirm after verifying payment in your UPI app
            </p>
          </div>
        </div>
      )}

      {/* Generate Bill Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Select Order to Bill</h2>
              <Button
                onClick={() => setShowGenerateModal(false)}
                variant="outline"
                size="sm"
                className="text-gray-500"
              >
                Close
              </Button>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-3">
              {completedOrdersWithoutBills.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No unbilled completed orders.</p>
              ) : (
                completedOrdersWithoutBills.map((order: any) => (
                  <div key={order.id} className="border p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">Table {order.table?.number || 'Unknown'}</h3>
                      <p className="text-sm text-gray-500">
                        {order.customerName || 'Walk-in'} • ₹{order.totalAmount?.toFixed(2)}
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleGenerateBill(order.id)}
                      className="bg-primary text-white"
                    >
                      Generate
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {showBillModal && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Bill #{selectedBill.id}</h2>
              <Button
                onClick={() => setShowBillModal(false)}
                variant="outline"
                className="text-gray-500 hover:bg-gray-100"
              >
                Close
              </Button>
            </div>

            <div id="print-receipt" className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-violet-200 print:bg-white print:border-none print:w-full print:max-w-full print:p-4">
              <div className="text-center mb-4">
                <div className="flex justify-center mb-3">
                  <div className="w-32">
                    <Image src="/logo.svg" alt="Gen-Z Restaurant" width={128} height={128} className="w-full" />
                  </div>
                </div>
                <h2 className="text-lg font-black uppercase tracking-wider mb-1">GEN-Z RESTAURANT</h2>
                <p className="text-xs text-gray-600">123 Main Street, New Delhi, India</p>
                <p className="text-xs text-gray-600">GST No: 07AABCG1234A1Z5</p>
                <p className="text-xs text-gray-600">Tel: +91 98765 43210</p>
              </div>

              <div className="border-t-2 border-b-2 border-dashed border-gray-300 py-3 mb-4 text-xs space-y-1.5 bg-white p-3 rounded-lg">
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

              <div className="mb-4 bg-white p-3 rounded-lg">
                <div className="flex justify-between font-black text-gray-700 border-b-2 border-gray-200 pb-2 mb-2 text-xs uppercase tracking-wider">
                  <span>Item</span>
                  <span>Amt</span>
                </div>
                <div className="space-y-2">
                  {selectedBill.order.items.map((item: any, idx: number) => (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">{item.quantity}x {item.menuItem.name}</span>
                        <span className="font-semibold">₹{(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                      {item.specialInstructions && (
                        <div className="text-red-500 text-xs mt-0.5 ml-1 font-medium">
                          ⚠️ {item.specialInstructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t-2 border-dashed border-gray-300 pt-3 space-y-2 text-xs bg-white p-3 rounded-lg">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{selectedBill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>CGST (9%)</span>
                  <span>₹{(selectedBill.tax / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>SGST (9%)</span>
                  <span>₹{(selectedBill.tax / 2).toFixed(2)}</span>
                </div>
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{selectedBill.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-lg mt-3 pt-3 border-t-2 border-gray-300 bg-gradient-to-r from-violet-50 to-pink-50 p-2 rounded">
                  <span>TOTAL</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600">₹{selectedBill.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedBill.status === 'PAID' && (
                <div className="mt-4 text-center font-black text-sm border-2 border-green-500 text-green-600 py-2 rounded-lg bg-green-50">
                  ✓ PAID VIA {selectedBill.paymentMethod || 'CASH'}
                </div>
              )}

              <div className="text-center mt-6 text-xs text-gray-500">
                <p className="font-medium">Thank you for dining with us! 💚</p>
                <p className="mt-1">Visit us again at genz-restaurant.com</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Payment Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Status:</p>
                  <p className={`text-lg font-medium
                    ${selectedBill.status === 'PENDING' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {selectedBill.status.charAt(0).toUpperCase() + selectedBill.status.slice(1)}
                  </p>
                </div>
                {selectedBill.status === 'PAID' && (
                  <div>
                    <p className="text-sm text-gray-500">Payment Method:</p>
                    <p className="text-lg font-medium">{selectedBill.paymentMethod || 'Not specified'}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              {selectedBill.status === 'PENDING' && (
                <>
                  <Button
                    onClick={() => handleInitiatePayment(selectedBill)}
                    variant="gradient"
                    className="bg-gradient-to-r from-violet-600 to-pink-600"
                  >
                    💳 Pay via UPI
                  </Button>
                  <Button
                    onClick={() => {
                      const paymentMethod = prompt('Enter payment method (cash, card, etc.)') || 'cash';
                      handleMarkPaid(selectedBill.id, paymentMethod);
                    }}
                    variant="outline"
                  >
                    Cash/Card
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
      )}

      {/* Bills List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Bill History</h2>

        {bills.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            No bills generated yet. Complete some orders to generate bills.
          </p>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => (
              <div key={bill.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">Bill #{bill.id}</h3>
                    <p className="text-sm text-gray-500">
                      Order #{bill.order.id} • Table #{bill.order.table.number} •
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full
                      ${bill.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'}`}>
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </span>
                    {bill.status === 'PAID' && (
                      <Button
                        onClick={() => handlePrintBill()}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        Print
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-lg font-medium text-right">
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