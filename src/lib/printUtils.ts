/**
 * printReceipt — Professional thermal POS receipt printer
 */

import { RESTAURANT_INFO, PRINTER } from './constants';
import { mergeOrderItems } from './orderUtils';
import { formatCurrency } from './billUtils';

export const printReceipt = (bill: any, type: 'receipt' | 'kot' = 'receipt') => {
  const printWindow = window.open('', '_blank', 'width=300,height=500');
  
  if (!printWindow) {
    alert('Please allow popups for this site to enable printing.');
    return;
  }

  /* ─── helpers ────────────────────────────────────────────────────── */

  const fmt = (n: number) => `${n.toFixed(2)}`;
  const fmtDate = (d: Date) =>
    `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`;
  const fmtTime = (d: Date) =>
    `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

  const isKOT    = type === 'kot';
  const items    = bill.order?.items ?? bill.items ?? [];
  const merged   = mergeOrderItems(items);
  const oTime    = new Date(bill.order?.createdAt ?? bill.createdAt ?? Date.now());
  const origin   = window.location.origin;

  /* ═══════════════════════════════════════════════════════════════════
     KOT RECEIPT
  ═══════════════════════════════════════════════════════════════════ */
  if (isKOT) {
    const kotHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>KOT</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 18px;
    color: #000;
    width: 100%;
    max-width: 78mm;
    padding: 2mm 2mm 2mm 4mm; /* slightly more padding on left to balance right gap */
    margin: 0;
  }
  
  .c { text-align: center; }
  .hr { border-top: 1.5px dashed #000; margin: 3px 0; }
  .row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; width: 100%; }
  .item-name { flex: 1; text-align: left; padding-right: 2mm; font-size: 20px; }
  .item-qty { font-size: 22px; min-width: 15mm; text-align: right; }
</style>
</head>
<body onload="window.print(); setTimeout(function(){ window.close(); }, ${PRINTER.AUTO_PRINT_DELAY});">
<div class="c" style="font-size:28px; letter-spacing: 1px;">KOT</div>
<div class="c" style="font-size:18px; margin-bottom: 4px;">Kitchen Order Ticket</div>
<div class="hr"></div>
<div class="row"><span>Table:</span><span style="font-size:22px;">T-${bill.order?.table?.number ?? bill.table?.number ?? '?'}</span></div>
<div class="row"><span>Time:</span><span>${fmtTime(oTime)}</span></div>
<div class="hr"></div>
<div class="row" style="font-size:18px;"><span class="item-name" style="font-size:18px;">ITEM</span><span class="item-qty" style="font-size:18px;">QTY</span></div>
<div class="hr"></div>
${merged.map(item => `
<div class="row">
  <span class="item-name">${item.menuItem?.name ?? 'Item'}</span>
  <span class="item-qty">x${item.quantity}</span>
</div>
${item.cleanInstr ? `<div style="font-size:16px; font-style:italic; padding-left:2mm; margin-top:-1px; margin-bottom:2px;">* ${item.cleanInstr}</div>` : ''}
`).join('')}
<div class="hr"></div>
<div style="height:5mm;"></div>
</body>
</html>`;
    printWindow.document.write(kotHTML);
    printWindow.document.close();
    return;
  }

  /* ═══════════════════════════════════════════════════════════════════
     CUSTOMER BILL RECEIPT - Simple & Professional
  ═══════════════════════════════════════════════════════════════════ */

  const subtotal = bill.subtotal ?? 0;
  const tax = bill.tax ?? 0;
  const total = bill.total ?? 0;
  const discPct = bill.discountPercent ?? 0;
  const discAmt = discPct > 0 ? (subtotal * discPct) / 100 : 0;
  const svcCharge = (bill.serviceChargeApplied && bill.serviceChargeAmount) ? bill.serviceChargeAmount : 0;
  const showGST = bill.gstApplied !== false && tax > 0;
  const tableNum = bill.order?.table?.number ?? bill.table?.number ?? null;
  const customerName = bill.order?.customerName ?? bill.customerName ?? '';
  const billNo = (bill.id ?? '').slice(-6).toUpperCase();
  const tokenNo = bill.order?.id ? bill.order.id.slice(-3).toUpperCase() : null;
  const totalQty = merged.reduce((s: number, i: any) => s + i.quantity, 0);

  const receiptHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Bill ${billNo}</title>
<style>
@page { margin: 0; size: 80mm auto; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 16px;
  color: #000;
  width: 100%;
  max-width: 78mm;
  padding: 2mm 2mm 2mm 4mm; /* pushing text a bit more to the right side by reducing right padding and increasing left padding slightly if needed, wait, if we want to shift right, we increase left margin/padding. Let's just use 2mm right padding */
  margin: 0;
}

.c { text-align: center; }
.r { text-align: right; }
.hr { border-top: 1px dashed #000; margin: 3px 0; }
.dash { border-top: 1px dashed #000; margin: 3px 0; }
table { width: 100%; border-collapse: collapse; }
th { border-bottom: 1px dashed #000; padding: 3px 0; font-size: 16px; }
td { padding: 3px 0; font-size: 16px; }
th:nth-child(1), td:nth-child(1) { text-align: left; }
th:nth-child(2), td:nth-child(2) { text-align: center; width: 15%; }
th:nth-child(3), td:nth-child(3) { text-align: right; width: 22%; }
th:nth-child(4), td:nth-child(4) { text-align: right; width: 28%; }
.row { display: flex; justify-content: space-between; font-size: 16px; line-height: 1.3; margin-bottom: 2px; width: 100%; }
</style>
</head>
<body onload="window.print(); setTimeout(function(){ window.close(); }, ${PRINTER.AUTO_PRINT_DELAY});">

<div class="c">
<div style="font-size:22px; margin-bottom:2px; text-transform: uppercase;">${RESTAURANT_INFO.NAME}</div>
<div style="font-size:14px; line-height:1.3;">
${RESTAURANT_INFO.ADDRESS}<br>
GST: ${RESTAURANT_INFO.GST_NUMBER}<br>
Contact: ${RESTAURANT_INFO.PHONE}
</div>
<div style="font-size:16px; margin:3px 0;">RETAIL INVOICE</div>
</div>

<div class="hr"></div>

<div style="font-size:16px;">Name: ${customerName || 'Walk-in Customer'}</div>
<div class="row">
<span>Date: ${fmtDate(oTime)}</span>
<span>Time: ${fmtTime(oTime)}</span>
</div>
<div class="row">
<span>Bill No: ${billNo}</span>
<span>Table: ${tableNum ?? '-'}</span>
</div>
<div class="row">
<span>Cashier: admin</span>
${tokenNo ? `<span>Token: ${tokenNo}</span>` : '<span></span>'}
</div>

<div class="hr"></div>

<table>
<thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead>
<tbody>
${merged.map((item: any) => {
  const price = item.menuItem?.price ?? item.price ?? 0;
  const amt = item.quantity * price;
  return `<tr><td>${item.menuItem?.name ?? 'Item'}</td><td>${item.quantity}</td><td>${fmt(price)}</td><td>${fmt(amt)}</td></tr>`;
}).join('\n')}
</tbody>
</table>

<div class="hr"></div>

<div class="row"><span>Qty: ${totalQty}</span><span>Subtotal</span><span class="r">₹${fmt(subtotal)}</span></div>
${svcCharge > 0 ? `<div class="row"><span></span><span>Service</span><span class="r">₹${fmt(svcCharge)}</span></div>` : ''}
${showGST ? `<div class="row"><span></span><span>CGST (9%)</span><span class="r">₹${fmt(tax/2)}</span></div><div class="row"><span></span><span>SGST (9%)</span><span class="r">₹${fmt(tax/2)}</span></div>` : ''}
${discAmt > 0 ? `<div class="row"><span></span><span>Discount (${discPct}%)</span><span class="r">-₹${fmt(discAmt)}</span></div>` : ''}

<div class="hr"></div>

<div class="row" style="font-size:20px;"><span>Grand Total</span><span>₹${fmt(total)}</span></div>

<div class="hr"></div>

${bill.status === 'PAID' ? `<div class="row" style="font-size:18px;"><span>Paid via: ${bill.paymentMethod ?? 'CASH'}</span><span>PAID ✓</span></div>` : ''}

<div class="dash"></div>
<div class="c" style="font-size:14px; line-height:1.3;">
<div>Thank you for ordering</div>
<div>Please visit again 🙏</div>
<div style="font-size:12px;">${RESTAURANT_INFO.WEBSITE}</div>
</div>

<div style="height:5mm;"></div>
</body>
</html>`;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
};

