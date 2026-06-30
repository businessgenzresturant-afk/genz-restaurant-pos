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
  @page { margin: 0; size: 78mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    color: #000;
    width: 76mm;
    padding: 2mm 1mm;
    margin: 0 auto;
  }
  .c { text-align: center; }
  .hr { border-top: 1px dashed #000; margin: 3px 0; }
  .row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; width: 100%; }
  .item-name { flex: 1; text-align: left; padding-right: 2mm; font-size: 16px; font-weight: bold; }
  .item-qty { font-size: 18px; font-weight: bold; min-width: 15mm; text-align: right; }
</style>
</head>
<body onload="window.print(); setTimeout(function(){ window.close(); }, ${PRINTER.AUTO_PRINT_DELAY});">
<div class="c" style="font-size:24px; font-weight:bold; letter-spacing: 1px;">KOT</div>
<div class="c" style="font-size:14px; margin-bottom: 3px;">Kitchen Order Ticket</div>
<div class="hr"></div>
<div class="row"><span>Table:</span><span style="font-size:18px; font-weight:bold;">T-${bill.order?.table?.number ?? bill.table?.number ?? '?'}</span></div>
<div class="row"><span>Time:</span><span>${fmtTime(oTime)}</span></div>
<div class="hr"></div>
<div class="row" style="font-size:14px; font-weight:bold;"><span class="item-name" style="font-size:14px;">ITEM</span><span class="item-qty" style="font-size:14px;">QTY</span></div>
<div class="hr"></div>
${merged.map(item => `
<div class="row">
  <span class="item-name">${item.menuItem?.name ?? 'Item'}</span>
  <span class="item-qty">x${item.quantity}</span>
</div>
${item.cleanInstr ? `<div style="font-size:12px; font-style:italic; padding-left:2mm; margin-top:-1px; margin-bottom:2px;">* ${item.cleanInstr}</div>` : ''}
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
@page { margin: 0; size: 78mm auto; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  color: #000;
  width: 76mm;
  padding: 2mm 1mm;
  margin: 0 auto;
}
.c { text-align: center; }
.r { text-align: right; }
.b { font-weight: bold; }
.hr { border-top: 1px dashed #000; margin: 3px 0; }
.dash { border-top: 1px dashed #000; margin: 3px 0; }
table { width: 100%; border-collapse: collapse; }
th { border-bottom: 1px dashed #000; padding: 2px 0; font-size: 12px; font-weight: bold; }
td { padding: 2px 0; font-size: 12px; }
th:nth-child(1), td:nth-child(1) { text-align: left; }
th:nth-child(2), td:nth-child(2) { text-align: center; width: 15%; }
th:nth-child(3), td:nth-child(3) { text-align: right; width: 22%; }
th:nth-child(4), td:nth-child(4) { text-align: right; width: 28%; }
.row { display: flex; justify-content: space-between; font-size: 12px; line-height: 1.3; margin-bottom: 2px; width: 100%; }
</style>
</head>
<body onload="window.print(); setTimeout(function(){ window.close(); }, ${PRINTER.AUTO_PRINT_DELAY});">

<div class="c">
<div class="b" style="font-size:18px; margin-bottom:2px;">${RESTAURANT_INFO.NAME.toUpperCase()}</div>
<div style="font-size:11px; line-height:1.3;">
${RESTAURANT_INFO.ADDRESS}<br>
GST: ${RESTAURANT_INFO.GST_NUMBER}<br>
Contact: ${RESTAURANT_INFO.PHONE}
</div>
<div class="b" style="font-size:12px; margin:3px 0;">RETAIL INVOICE</div>
</div>

<div class="hr"></div>

<div style="font-size:12px;"><b>Name:</b> ${customerName || 'Walk-in Customer'}</div>
<div class="row">
<span><b>Date:</b> ${fmtDate(oTime)}</span>
<span><b>Time:</b> ${fmtTime(oTime)}</span>
</div>
<div class="row">
<span><b>Bill No:</b> ${billNo}</span>
<span><b>Table:</b> ${tableNum ?? '-'}</span>
</div>
<div class="row">
<span><b>Cashier:</b> admin</span>
${tokenNo ? `<span><b>Token:</b> ${tokenNo}</span>` : '<span></span>'}
</div>

<div class="hr"></div>

<table>
<thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead>
<tbody>
${merged.map((item: any) => {
  const price = item.menuItem?.price ?? item.price ?? 0;
  const amt = item.quantity * price;
  return `<tr><td>${item.menuItem?.name ?? 'Item'}</td><td class="b">${item.quantity}</td><td>${fmt(price)}</td><td class="b">${fmt(amt)}</td></tr>`;
}).join('\n')}
</tbody>
</table>

<div class="hr"></div>

<div class="row"><span>Qty: ${totalQty}</span><span>Subtotal</span><span class="r">₹${fmt(subtotal)}</span></div>
${svcCharge > 0 ? `<div class="row"><span></span><span>Service</span><span class="r">₹${fmt(svcCharge)}</span></div>` : ''}
${showGST ? `<div class="row"><span></span><span>CGST (9%)</span><span class="r">₹${fmt(tax/2)}</span></div><div class="row"><span></span><span>SGST (9%)</span><span class="r">₹${fmt(tax/2)}</span></div>` : ''}
${discAmt > 0 ? `<div class="row"><span></span><span>Discount (${discPct}%)</span><span class="r">-₹${fmt(discAmt)}</span></div>` : ''}

<div class="hr"></div>

<div class="row b" style="font-size:16px;"><span>Grand Total</span><span>₹${fmt(total)}</span></div>

<div class="hr"></div>

${bill.status === 'PAID' ? `<div class="row b" style="font-size:14px;"><span>Paid via: ${bill.paymentMethod ?? 'CASH'}</span><span>PAID ✓</span></div>` : ''}

<div class="dash"></div>
<div class="c" style="font-size:11px; line-height:1.3;">
<div class="b">Thank you for ordering</div>
<div>Please visit again 🙏</div>
<div style="font-size:10px;">${RESTAURANT_INFO.WEBSITE}</div>
</div>

<div style="height:5mm;"></div>
</body>
</html>`;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
};

