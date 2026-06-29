export const printReceipt = (bill: any, type: 'receipt' | 'kot' = 'receipt') => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Please allow popups to print');
    return;
  }

  // Merge items for receipt
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

  const isKOT = type === 'kot';
  const mergedItems = bill.order?.items ? mergeItems(bill.order.items) : (bill.items ? mergeItems(bill.items) : []);
  const orderTime = bill.order?.createdAt || bill.createdAt || new Date();

  let receiptHTML = '';

  if (isKOT) {
    receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>KOT - ${bill.id?.slice(-8).toUpperCase() || 'NEW'}</title>
        <base href="${window.location.origin}">
        <style>
          @page { margin: 0; size: 80mm auto; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            color: #000; 
            background: #fff; 
            width: 76mm; /* Standard 80mm roll printable area */
            margin: 0 auto;
            padding: 4mm 2mm;
          }
          .kot-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
          .kot-title { font-size: 32px; font-weight: normal; letter-spacing: 1px; text-transform: uppercase; }
          .info-row { display: flex; justify-content: space-between; font-size: 20px; margin-bottom: 4px; font-weight: normal; }
          .items-header { border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 6px; margin-top: 10px; font-size: 20px; font-weight: normal; display: flex; justify-content: space-between; text-transform: uppercase; }
          .item-row { font-size: 24px; font-weight: normal; display: flex; justify-content: space-between; margin-bottom: 6px; align-items: flex-start; line-height: 1.2; }
          .item-name { flex: 1; padding-right: 8px; }
          .item-qty { font-size: 24px; white-space: nowrap; }
          .item-special { font-size: 18px; color: #000; font-weight: normal; font-style: italic; margin-left: 10px; margin-bottom: 8px; border-left: 2px solid #000; padding-left: 5px; }
          .footer { text-align: center; border-top: 2px dashed #000; margin-top: 12px; padding-top: 8px; font-size: 16px; font-weight: normal; }
        </style>
      </head>
      <body>
        <div class="kot-header">
          <div class="kot-title">KOT</div>
        </div>
        <div class="info-row">
          <span>Table:</span>
          <span>T-${bill.order?.table?.number || bill.table?.number || '?'}</span>
        </div>
        <div class="info-row">
          <span>Time:</span>
          <span>${new Date(orderTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="info-row">
          <span>Order:</span>
          <span>${(bill.order?.id || bill.id || '').slice(-8).toUpperCase()}</span>
        </div>
        
        <div style="margin-top: 10px;">
          <div class="items-header">
            <span>Item</span>
            <span>Qty</span>
          </div>
          ${mergedItems.map((item: any) => `
            <div>
              <div class="item-row">
                <span class="item-name">${item.menuItem?.name || item.name || 'Unknown Item'}</span>
                <span class="item-qty">x${item.quantity}</span>
              </div>
              ${item.cleanInstr || item.specialInstructions ? `<div class="item-special">Note: ${item.cleanInstr || item.specialInstructions}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="footer">
          Printed: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </body>
      </html>
    `;
  } else {
    // Normal Receipt
    receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${(bill.id || '').slice(-8).toUpperCase()}</title>
        <base href="${window.location.origin}">
        <style>
          @page { margin: 0; size: 80mm auto; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px; 
            line-height: 1.45; 
            color: #000; 
            background: #fff; 
            width: 80mm;
            margin: 0 auto;
            padding: 4mm 4mm;
          }
          .text-center { text-align: center; }
          .divider-solid { border-top: 1.5px solid #000; margin: 4px 0; }
          .divider-dashed { border-top: 1px dashed #000; margin: 4px 0; }
          .invoice-title { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
          .restaurant-name { font-size: 16px; font-weight: normal; text-transform: uppercase; margin-top: 2px; }
          .restaurant-info { font-size: 12px; line-height: 1.4; margin-top: 2px; }
          .customer-name { font-size: 13px; margin: 3px 0; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; font-size: 12px; gap: 1px; }
          .text-right { text-align: right; }
          .table-header { display: grid; grid-template-columns: 3fr 1fr 1.5fr 1.5fr; font-size: 12px; }
          .item-row { display: grid; grid-template-columns: 3fr 1fr 1.5fr 1.5fr; font-size: 13px; margin-bottom: 3px; align-items: start; }
          .item-name { word-wrap: break-word; }
          .item-special { font-size: 11px; font-style: italic; padding-left: 12px; margin-bottom: 2px; }
          .summary-row { display: grid; grid-template-columns: 1fr 2fr 1.5fr; font-size: 12px; margin: 1px 0; }
          .grand-total { display: flex; justify-content: space-between; font-size: 15px; margin: 3px 0; }
          .thanks { text-align: center; font-size: 13px; margin-top: 4px; }
          @media print { 
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="invoice-title">RETAIL INVOICE</div>
          <div class="restaurant-name">Gen-Z Restaurant</div>
          <div class="restaurant-info">
            <div>123 Main Street, New Delhi-110001</div>
            <div>GST: 07AABCG1234A1Z5</div>
            <div>Tel: +91 98765 43210</div>
          </div>
        </div>

        <div class="divider-solid"></div>

        <div class="customer-name">Name: ${bill.order?.customerName || bill.customerName || ''}</div>

        <div class="divider-solid"></div>

        <div class="grid-2">
          <div>Date: ${new Date(orderTime).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: '2-digit'})} ${new Date(orderTime).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit', hour12: false})}</div>
          <div class="text-right">${bill.order?.table || bill.table ? `Dine In: ${bill.order?.table?.number || bill.table?.number}` : 'Takeaway'}</div>
          <div>Cashier: admin</div>
          <div class="text-right">Bill No.: ${(bill.id || '').slice(-6).toUpperCase()}</div>
          ${bill.order?.id ? `<div>Token No.: ${bill.order.id.slice(-3).toUpperCase()}</div><div></div>` : ''}
        </div>

        <div class="divider-solid"></div>

        <div class="table-header">
          <span>No.Item</span>
          <span class="text-right">Qty.</span>
          <span class="text-right">Price</span>
          <span class="text-right">Amou</span>
        </div>
        
        <div class="divider-dashed"></div>

        ${mergedItems.map((item: any, idx: number) => `
          <div class="item-row">
            <span class="item-name">${idx + 1} ${item.menuItem?.name || item.name || 'Item'}</span>
            <span class="text-right">${item.quantity}</span>
            <span class="text-right">${(item.menuItem?.price || item.price || 0).toFixed(0)}.</span>
            <span class="text-right">${(item.quantity * (item.menuItem?.price || item.price || 0)).toFixed(0)}.</span>
          </div>
          ${item.cleanInstr ? `<div class="item-special">Note: ${item.cleanInstr}</div>` : ''}
        `).join('')}

        <div class="divider-solid"></div>

        <div class="summary-row">
          <span>Total Qty: ${mergedItems.reduce((acc: number, item: any) => acc + item.quantity, 0)}</span>
          <span class="text-right">Sub Total</span>
          <span class="text-right">${(bill.subtotal || 0).toFixed(0)}.</span>
        </div>

        ${bill.serviceChargeApplied && bill.serviceChargeAmount ? `
        <div class="summary-row">
          <span></span>
          <span class="text-right">Service (10%)</span>
          <span class="text-right">${bill.serviceChargeAmount.toFixed(0)}.</span>
        </div>
        ` : ''}

        ${bill.gstApplied !== false && bill.tax ? `
        <div class="summary-row">
          <span></span>
          <span class="text-right">CGST (9%)</span>
          <span class="text-right">${(bill.tax / 2).toFixed(0)}.</span>
        </div>
        <div class="summary-row">
          <span></span>
          <span class="text-right">SGST (9%)</span>
          <span class="text-right">${(bill.tax / 2).toFixed(0)}.</span>
        </div>
        ` : ''}

        ${bill.discountPercent > 0 ? `
        <div class="summary-row">
          <span></span>
          <span class="text-right">Discount</span>
          <span class="text-right">-${((bill.subtotal * bill.discountPercent) / 100).toFixed(0)}.</span>
        </div>
        ` : ''}

        ${bill.pointsRedeemed > 0 ? `
        <div class="summary-row">
          <span></span>
          <span class="text-right">Points</span>
          <span class="text-right">-${bill.pointsRedeemed.toFixed(0)}.</span>
        </div>
        ` : ''}

        <div class="divider-solid"></div>

        <div class="grand-total">
          <span>Grand Total</span>
          <span>₹ ${(bill.total || 0).toFixed(0)}.</span>
        </div>

        <div class="divider-solid"></div>

        <div class="thanks">Thanks for ordering</div>

        ${bill.status === 'PAID' ? `
        <div class="text-center" style="font-size: 12px; margin-top: 4px;">
          ✓ PAID - ${bill.paymentMethod || 'CASH'}
        </div>
        ` : ''}

        ${bill.paymentMethod === 'SPLIT' ? `
        <div class="summary-row" style="margin-top:6px;">
          <span></span>
          <span class="text-right">Cash:</span>
          <span class="text-right">₹${(bill.cashAmount || 0).toFixed(0)}.</span>
        </div>
        <div class="summary-row">
          <span></span>
          <span class="text-right">Online:</span>
          <span class="text-right">₹${(bill.onlineAmount || 0).toFixed(0)}.</span>
        </div>
        ` : ''}
      </body>
      </html>
    `;
  }

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
  
  // Wait a tiny bit for the logo to maybe load if cached, then print
  setTimeout(() => {
    printWindow.print();
  }, 300);
};
