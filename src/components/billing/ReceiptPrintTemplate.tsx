'use client';

import Image from 'next/image';

interface ReceiptPrintTemplateProps {
  bill: any;
  onClose?: () => void;
}

export function ReceiptPrintTemplate({ bill, onClose }: ReceiptPrintTemplateProps) {
  const handlePrint = () => {
    import('@/lib/printUtils').then(({ printReceipt }) => {
      printReceipt(bill, 'receipt');
    });
  };

  // Merge items with same name and special instructions
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
  const orderTime = bill.order?.createdAt || bill.createdAt;

  return (
    <div className="space-y-4">
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <span>🖨️</span>
        Print Receipt
      </button>

      {/* Screen Preview - matches exactly what will print */}
      <div className="bg-white border border-gray-300 shadow-md mx-auto font-mono text-black p-4 max-h-[500px] overflow-y-auto text-sm" style={{ maxWidth: '320px' }}>
        
        {/* Header */}
        <div className="text-center mb-2">
          <div className="text-xs uppercase tracking-widest">RETAIL INVOICE</div>
          <div className="font-bold text-base uppercase mt-0.5">Gen-Z Restaurant</div>
          <div className="text-xs mt-1 leading-tight">
            <div>123 Main Street, New Delhi-110001</div>
            <div>GST: 07AABCG1234A1Z5</div>
            <div>Tel: +91 98765 43210</div>
          </div>
        </div>

        <div className="border-t-2 border-black my-1.5"></div>

        {/* Customer Name */}
        <div className="text-xs mb-1">
          <span className="font-semibold">Name:</span> {bill.order?.customerName || bill.customerName || ''}
        </div>

        <div className="border-t-2 border-black my-1.5"></div>

        {/* Date / Table info */}
        <div className="grid grid-cols-2 gap-x-2 text-xs mb-1">
          <div>
            Date: {orderTime ? new Date(orderTime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}{' '}
            {orderTime ? new Date(orderTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
          </div>
          <div className="text-right">
            {bill.order?.table || bill.table ? `Dine In: ${bill.order?.table?.number || bill.table?.number}` : 'Takeaway'}
          </div>
          <div>Cashier: admin</div>
          <div className="text-right">Bill No.: {(bill.id || '').slice(-6).toUpperCase()}</div>
          {bill.order?.id && <div>Token No.: {bill.order.id.slice(-3).toUpperCase()}</div>}
        </div>

        <div className="border-t-2 border-black my-1.5"></div>

        {/* Items Table */}
        <div className="text-xs">
          <div className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr] font-semibold mb-1">
            <span>No.Item</span>
            <span className="text-center">Qty.</span>
            <span className="text-right">Price</span>
            <span className="text-right">Amou</span>
          </div>
          <div className="border-t border-black mb-1"></div>
          <div className="space-y-0.5">
            {mergedItems.map((item: any, idx: number) => (
              <div key={idx}>
                <div className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr]">
                  <span className="truncate pr-1">{idx + 1} {item.menuItem?.name || item.name || 'Item'}</span>
                  <span className="text-center">{item.quantity}</span>
                  <span className="text-right">{(item.menuItem?.price || item.price || 0).toFixed(0)}.</span>
                  <span className="text-right">{(item.quantity * (item.menuItem?.price || item.price || 0)).toFixed(0)}.</span>
                </div>
                {item.cleanInstr && (
                  <div className="italic ml-3 text-[10px]">Note: {item.cleanInstr}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-black my-1.5"></div>

        {/* Totals */}
        <div className="text-xs">
          <div className="flex justify-between">
            <span>Total Qty: {mergedItems.reduce((acc: number, item: any) => acc + item.quantity, 0)}</span>
            <span>Sub Total</span>
            <span>{bill.subtotal?.toFixed(0)}.</span>
          </div>

          {bill.gstApplied !== false && bill.tax > 0 && (
            <>
              <div className="flex justify-between">
                <span></span>
                <span>CGST (9%)</span>
                <span>{(bill.tax / 2).toFixed(0)}.</span>
              </div>
              <div className="flex justify-between">
                <span></span>
                <span>SGST (9%)</span>
                <span>{(bill.tax / 2).toFixed(0)}.</span>
              </div>
            </>
          )}

          {bill.discountPercent > 0 && (
            <div className="flex justify-between">
              <span></span>
              <span>Discount</span>
              <span>-{((bill.subtotal * bill.discountPercent) / 100).toFixed(0)}.</span>
            </div>
          )}

          {bill.pointsRedeemed > 0 && (
            <div className="flex justify-between">
              <span></span>
              <span>Points</span>
              <span>-{bill.pointsRedeemed.toFixed(0)}.</span>
            </div>
          )}
        </div>

        <div className="border-t-2 border-black my-1.5"></div>

        <div className="flex justify-between font-bold text-sm">
          <span>Grand Total</span>
          <span>₹{bill.total?.toFixed(0)}.</span>
        </div>

        <div className="border-t-2 border-black my-1.5"></div>

        <div className="text-center font-semibold text-xs mt-1">
          Thanks for ordering
        </div>

        {bill.status === 'PAID' && (
          <div className="text-center text-xs mt-1 font-semibold">
            ✓ PAID - {bill.paymentMethod || 'CASH'}
          </div>
        )}
      </div>
    </div>
  );
}
