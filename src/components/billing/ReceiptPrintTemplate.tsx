'use client';

import Image from 'next/image';

interface ReceiptPrintTemplateProps {
  bill: any;
  onClose?: () => void;
}

export function ReceiptPrintTemplate({ bill, onClose }: ReceiptPrintTemplateProps) {
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Please allow popups to print the receipt');
      return;
    }

    // Get the receipt content
    const receiptContent = document.getElementById('receipt-print-content')?.innerHTML || '';
    
    // Write the print document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill Receipt - ${bill.id.slice(-8).toUpperCase()}</title>
        <style>
          @page {
            margin: 10mm;
            size: 80mm auto;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.5;
            color: #000;
            background: #fff;
            padding: 10px;
            max-width: 300px;
            margin: 0 auto;
          }
          
          .receipt-header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px dashed #000;
            padding-bottom: 15px;
          }
          
          .logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 10px;
            border-radius: 50%;
            overflow: hidden;
          }
          
          .restaurant-name {
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 5px;
          }
          
          .restaurant-info {
            font-size: 11px;
            line-height: 1.6;
          }
          
          .bill-info {
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
            font-size: 12px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          
          .info-label {
            font-weight: bold;
          }
          
          .items-section {
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          
          .items-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            margin-bottom: 8px;
            font-size: 12px;
            text-transform: uppercase;
          }
          
          .item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 12px;
          }
          
          .item-name {
            flex: 1;
            font-weight: 600;
          }
          
          .item-price {
            font-weight: bold;
            min-width: 70px;
            text-align: right;
          }
          
          .item-special {
            color: #666;
            font-size: 11px;
            margin-left: 15px;
            margin-top: 2px;
          }
          
          .totals-section {
            padding-bottom: 10px;
            margin-bottom: 10px;
            font-size: 12px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          
          .total-final {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 8px;
            margin-top: 8px;
          }
          
          .payment-status {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            padding: 8px;
            border: 2px solid #000;
            margin: 10px 0;
            text-transform: uppercase;
          }
          
          .footer {
            text-align: center;
            border-top: 2px dashed #000;
            padding-top: 10px;
            margin-top: 15px;
            font-size: 11px;
          }
          
          .footer-message {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 12px;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            button {
              display: none !important;
            }
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        ${receiptContent}
      </body>
      </html>
    `);
    
    printWindow.document.close();
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

      {/* Hidden print content */}
      <div id="receipt-print-content" className="hidden">
        <div className="receipt-header">
          <div className="logo">
            <img src="/images/Gen-z-logo.jpg" alt="Gen-Z Logo" width="120" height="120" style={{ objectFit: 'cover' }} />
          </div>
          <div className="restaurant-name">Gen-Z Restaurant</div>
          <div className="restaurant-info">
            <div>123 Main Street, New Delhi, India</div>
            <div>GST No: 07AABCG1234A1Z5</div>
            <div>Tel: +91 98765 43210</div>
          </div>
        </div>

        <div className="bill-info">
          <div className="info-row">
            <span className="info-label">Bill #:</span>
            <span>{bill.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Date:</span>
            <span>{new Date(bill.order?.createdAt || bill.createdAt).toLocaleString('en-IN')}</span>
          </div>
          {bill.order?.table && (
            <div className="info-row">
              <span className="info-label">Table:</span>
              <span>Table {bill.order.table.number}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">Customer:</span>
            <span>{bill.order?.customerName || 'Walk-in Customer'}</span>
          </div>
          {bill.order?.customerPhone && (
            <div className="info-row">
              <span className="info-label">Phone:</span>
              <span>{bill.order.customerPhone}</span>
            </div>
          )}
        </div>

        <div className="items-section">
          <div className="items-header">
            <span>Item</span>
            <span>Amount</span>
          </div>
          {mergedItems.map((item: any, idx: number) => (
            <div key={idx}>
              <div className="item-row">
                <span className="item-name">
                  {item.quantity}× {item.menuItem?.name || 'Unknown Item'}
                </span>
                <span className="item-price">
                  ₹{(item.quantity * (item.menuItem?.price || item.price || 0)).toFixed(2)}
                </span>
              </div>
              {item.cleanInstr && (
                <div className="item-special">Note: {item.cleanInstr}</div>
              )}
            </div>
          ))}
        </div>

        <div className="totals-section">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>₹{bill.subtotal.toFixed(2)}</span>
          </div>
          {bill.gstApplied !== false && (
            <>
              <div className="total-row">
                <span>CGST (9%):</span>
                <span>₹{((bill.tax || 0) / 2).toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>SGST (9%):</span>
                <span>₹{((bill.tax || 0) / 2).toFixed(2)}</span>
              </div>
            </>
          )}
          {bill.discountPercent > 0 && (
            <div className="total-row">
              <span>Discount ({bill.discountPercent}%):</span>
              <span>-₹{((bill.subtotal * bill.discountPercent) / 100).toFixed(2)}</span>
            </div>
          )}
          {bill.pointsRedeemed > 0 && (
            <div className="total-row">
              <span>Points Redeemed:</span>
              <span>-₹{bill.pointsRedeemed.toFixed(2)}</span>
            </div>
          )}
          <div className="total-row total-final">
            <span>TOTAL:</span>
            <span>₹{bill.total.toFixed(2)}</span>
          </div>
        </div>

        {bill.status === 'PAID' && (
          <div className="payment-status">
            ✓ PAID - {bill.paymentMethod || 'CASH'}
          </div>
        )}

        {bill.paymentMethod === 'SPLIT' && (
          <div className="totals-section">
            <div className="total-row">
              <span>Cash:</span>
              <span>₹{(bill.cashAmount || 0).toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Online:</span>
              <span>₹{(bill.onlineAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="footer">
          <div className="footer-message">Thank you for dining with us! 💚</div>
          <div>Visit us again soon!</div>
          <div>www.genzrestaurant.com</div>
        </div>
      </div>

      {/* Preview (visible on screen) */}
      <div className="bg-card border-2 border-border rounded-xl p-6 max-h-[500px] overflow-y-auto">
        <div className="text-center mb-4 pb-4 border-b-2 border-dashed border-border">
          <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-3 border-2 border-primary shadow-lg">
            <Image 
              src="/images/Gen-z-logo.jpg" 
              alt="Gen-Z Logo" 
              width={128} 
              height={128}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-lg font-black text-foreground uppercase tracking-wider">Gen-Z Restaurant</h2>
          <p className="text-xs text-muted-foreground">123 Main Street, New Delhi, India</p>
          <p className="text-xs text-muted-foreground">GST No: 07AABCG1234A1Z5</p>
          <p className="text-xs text-muted-foreground">Tel: +91 98765 43210</p>
        </div>

        <div className="mb-4 pb-4 border-b border-dashed border-border">
          <div className="text-xs space-y-2">
            <div className="flex justify-between">
              <span className="font-bold">Bill #:</span>
              <span className="font-mono">{bill.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Date:</span>
              <span>{new Date(bill.order?.createdAt || bill.createdAt).toLocaleString('en-IN')}</span>
            </div>
            {bill.order?.table && (
              <div className="flex justify-between">
                <span className="font-bold">Table:</span>
                <span>Table {bill.order.table.number}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-bold">Customer:</span>
              <span>{bill.order?.customerName || 'Walk-in Customer'}</span>
            </div>
            {bill.order?.customerPhone && (
              <div className="flex justify-between">
                <span className="font-bold">Phone:</span>
                <span>{bill.order.customerPhone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 pb-4 border-b border-dashed border-border">
          <div className="flex justify-between text-xs font-bold mb-3 text-muted-foreground uppercase">
            <span>Item</span>
            <span>Amount</span>
          </div>
          <div className="space-y-2">
            {mergedItems.map((item: any, idx: number) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between">
                  <span className="font-bold">{item.quantity}× {item.menuItem?.name || 'Unknown Item'}</span>
                  <span className="font-semibold">₹{(item.quantity * (item.menuItem?.price || item.price || 0)).toFixed(2)}</span>
                </div>
                {item.cleanInstr && (
                  <div className="text-amber-600 text-xs ml-4 mt-1">Note: {item.cleanInstr}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal:</span>
            <span>₹{bill.subtotal.toFixed(2)}</span>
          </div>
          {bill.gstApplied !== false && (
            <>
              <div className="flex justify-between text-muted-foreground">
                <span>CGST (9%):</span>
                <span>₹{((bill.tax || 0) / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>SGST (9%):</span>
                <span>₹{((bill.tax || 0) / 2).toFixed(2)}</span>
              </div>
            </>
          )}
          {bill.discountPercent > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({bill.discountPercent}%):</span>
              <span>-₹{((bill.subtotal * bill.discountPercent) / 100).toFixed(2)}</span>
            </div>
          )}
          {bill.pointsRedeemed > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Points Redeemed:</span>
              <span>-₹{bill.pointsRedeemed.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-lg pt-3 mt-3 border-t-2 border-border">
            <span>TOTAL:</span>
            <span className="text-primary">₹{bill.total.toFixed(2)}</span>
          </div>
        </div>

        {bill.status === 'PAID' && (
          <div className="mt-4 text-center font-bold text-sm border-2 border-green-500 text-green-600 py-2 rounded-lg bg-green-500/10">
            ✓ PAID - {bill.paymentMethod || 'CASH'}
          </div>
        )}

        <div className="text-center mt-6 pt-4 border-t-2 border-dashed border-border text-xs text-muted-foreground">
          <p className="font-bold">Thank you for dining with us! 💚</p>
          <p className="mt-1">Visit us again soon!</p>
        </div>
      </div>
    </div>
  );
}
