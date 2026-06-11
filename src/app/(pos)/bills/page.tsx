'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function BillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bills');
      const data = await res.json();
      setBills(data);
    } catch (err) {
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async (orderId: number) => {
    try {
      await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      await fetchBills();
    } catch (err) {
      console.error('Error generating bill:', err);
    }
  };

  const handlePayBill = (bill: any) => {
    setSelectedBill(bill);
    setPaymentMethod('cash');
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    if (!selectedBill) return;
    try {
      await fetch(`/api/bills/${selectedBill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod })
      });
      setShowPaymentModal(false);
      setSelectedBill(null);
      await fetchBills();
    } catch (err) {
      console.error('Error processing payment:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-12 w-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Billing & Payments</h1>
          <p className="text-sm text-gray-500">
            Generate bills and process payments
          </p>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 print:hidden">Recent Bills</h2>

        {bills.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No bills found.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bills.map(bill => (
              <Card key={bill.id} className="p-4 border-2">
                <div className="flex justify-between items-start border-b pb-4 mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Bill #{bill.id}</h3>
                    <p className="text-gray-500">Table {bill.order?.table?.number}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(bill.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                      ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {bill.status}
                    </span>
                    {bill.status === 'paid' && (
                      <p className="text-xs text-gray-500 mt-2 uppercase font-semibold">
                        Via {bill.paymentMethod}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {bill.order?.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.menuItem.name}</span>
                      <span>₹{item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{bill.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (18%)</span>
                    <span>₹{bill.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                    <span>Total</span>
                    <span className="text-primary">₹{bill.finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3 print:hidden">
                  <Button 
                    variant="outline" 
                    onClick={handlePrint}
                    className="flex-1"
                  >
                    Print
                  </Button>
                  {bill.status !== 'paid' && (
                    <Button 
                      onClick={() => handlePayBill(bill)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Process Payment
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full bg-white shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Process Payment</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Bill Amount</span>
                <span className="text-2xl font-bold text-primary">₹{selectedBill?.finalAmount.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500 text-right">Table {selectedBill?.order?.table?.number}</p>
            </div>

            <div className="space-y-4 mb-8">
              <label className="block font-medium mb-2">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {['cash', 'card', 'upi'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-4 border-2 rounded-lg text-center font-bold uppercase transition-colors ${
                      paymentMethod === method 
                        ? 'border-primary bg-primary text-white' 
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={submitPayment}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-8"
              >
                Confirm Payment
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}