/**
 * printReceipt — Professional thermal POS receipt printer
 * 
 * Matches reference restaurant receipt exactly:
 * - Professional thermal printer format (58mm/80mm)
 * - Dark, readable text
 * - Perfect alignment
 * - No double printing
 * - No huge margins
 * - Compact layout like real restaurant bills
 */

export const printReceipt = (bill: any, type: 'receipt' | 'kot' = 'receipt') => {
  const printWindow = window.open('', '_blank', 'width=320,height=600');
  
  if (!printWindow) {
    alert('Please allow popups for this site to enable printing.');
    return;
  }

  /* ─── helpers ────────────────────────────────────────────────────── */

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

  const fmt = (n: number) => `${n.toFixed(2)}`;
  const fmtDate = (d: Date) =>
    `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`;
  const fmtTime = (d: Date) =>
    `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

  const isKOT    = type === 'kot';
  const items    = bill.order?.items ?? bill.items ?? [];
  const merged   = mergeItems(items);
  const oTime    = new Date(bill.order?.createdAt ?? bill.createdAt ?? Date.now());
  const origin   = window.location.origin;

  /* ═══════════════════════════════════════════════════════════════════
     KOT RECEIPT - KITCHEN ORDER TICKET
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
    font-family: 'Courier New', monospace;
    font-size: 15px;
    line-height: 1.3;
    color: #000;
    background: #fff;
    width: 100%;
    max-width: 80mm;
    padding: 4mm 3mm;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .hr { border: none; border-top: 2px solid #000; margin: 3px 0; }
  .dash { border: none; border-top: 1px dashed #000; margin: 3px 0; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 14px; }
  .item { margin: 3px 0; font-size: 15px; }
  .note { font-size: 13px; font-style: italic; padding-left: 6px; color: #333; }
</style>
</head>
<body onload="window.print(); window.onfocus = function() { setTimeout(function() { window.close(); }, 100); }">
<div class="center bold" style="font-size:20px; letter-spacing:1px;">KOT</div>
<div class="center" style="font-size:12px;">Kitchen Order Ticket</div>
<div class="hr"></div>
<div class="row"><span>Table:</span><span class="bold">T-${bill.order?.table?.number ?? bill.table?.number ?? '?'}</span></div>
<div class="row"><span>Order:</span><span>${(bill.order?.id ?? bill.id ?? '').slice(-6).toUpperCase()}</span></div>
<div class="row"><span>Time:</span><span>${fmtTime(oTime)}</span></div>
${(bill.order?.customerName || bill.customerName) ? `<div class="row"><span>Customer:</span><span>${bill.order?.customerName ?? bill.customerName}</span></div>` : ''}
<div class="hr"></div>
<div class="row bold"><span>ITEM</span><span>QTY</span></div>
<div class="dash"></div>
${merged.map(item => `<div class="item">
  <div class="row bold">
    <span>${item.menuItem?.name ?? 'Item'}</span>
    <span>x${item.quantity}</span>
  </div>
  ${(item.cleanInstr || item.specialInstructions) ? `<div class="note">⚠ ${item.cleanInstr || item.specialInstructions}</div>` : ''}
</div>`).join('')}
<div class="hr"></div>
<div class="center" style="font-size:12px; margin-top:3px;">Printed: ${fmtTime(new Date())}</div>
<div style="height:10mm;"></div>
</body>
</html>`;

    printWindow.document.write(kotHTML);
    printWindow.document.close();
    return;
  }

  /* ═══════════════════════════════════════════════════════════════════
     CUSTOMER BILL RECEIPT - Matches reference image exactly
  ═══════════════════════════════════════════════════════════════════ */

  const subtotal       = bill.subtotal ?? 0;
  const tax            = bill.tax ?? 0;
  const total          = bill.total ?? 0;
  const discPct        = bill.discountPercent ?? 0;
  const discAmt        = discPct > 0 ? (subtotal * discPct) / 100 : 0;
  const pointsRed      = bill.pointsRedeemed ?? 0;
  const svcCharge      = (bill.serviceChargeApplied && bill.serviceChargeAmount) ? bill.serviceChargeAmount : 0;
  const showGST        = bill.gstApplied !== false && tax > 0;
  const tableNum       = bill.order?.table?.number ?? bill.table?.number ?? null;
  const customerName   = bill.order?.customerName ?? bill.customerName ?? '';
  const customerPhone  = bill.order?.customerPhone ?? bill.customerPhone ?? '';
  const billNo         = (bill.id ?? '').slice(-6).toUpperCase();
  const tokenNo        = bill.order?.id ? bill.order.id.slice(-3).toUpperCase() : null;
  const totalQty       = merged.reduce((s: number, i: any) => s + i.quantity, 0);
  const logoUrl        = `${origin}/images/Gen-z-logo.jpg`;

  const receiptHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Receipt ${billNo}</title>
<style>
  @page { margin: 0; size: 58mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Courier New', monospace;
    font-size: 11px;
    font-weight: bold;
    line-height: 1.2;
    color: #000;
    background: #fff;
    width: 58mm;
    padding: 2mm 1mm;
    position: relative;
  }
  
  body::before {
    content: '';
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 45mm;
    height: 45mm;
    background-image: url('${logoUrl}');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 0.08;
    z-index: 0;
    pointer-events: none;
  }
  
  body > * {
    position: relative;
    z-index: 1;
  }
  
  .c { text-align: center; }
  .r { text-align: right; }
  .b { font-weight: 900; }
  
  .hr { border-top: 1px solid #000; margin: 1mm 0; }
  .dash { border-top: 1px dashed #000; margin: 1mm 0; }
  
  .rn { font-size: 14px; font-weight: 900; }
  .ri { font-size: 9px; line-height: 1.1; }
  
  .row { display: flex; justify-content: space-between; font-size: 10px; }
  
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { font-weight: bold; border-bottom: 1px solid #000; padding: 1px 0; }
  th:nth-child(1) { text-align: left; }
  th:nth-child(2) { text-align: center; width: 22px; }
  th:nth-child(3) { text-align: right; width: 40px; }
  th:nth-child(4) { text-align: right; width: 45px; }
  
  td { font-weight: bold; padding: 1px 0; }
  td:nth-child(1) { text-align: left; font-size: 11px; }
  td:nth-child(2) { text-align: center; width: 22px; }
  td:nth-child(3) { text-align: right; width: 40px; }
  td:nth-child(4) { text-align: right; width: 45px; }
  
  .tr { display: flex; justify-content: space-between; font-size: 11px; }
  .tl { flex: 1; }
  .tv { min-width: 50px; text-align: right; }
  
  .gt { font-size: 14px; font-weight: 900; }
  
  @media print {
    body { padding: 1mm; }
    body::before { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body onload="window.print(); window.onfocus = function() { setTimeout(function() { window.close(); }, 100); }">

<!-- HEADER -->
<div class="c">
  <div class="rn">GEN-Z RESTAURANT</div>
  <div class="ri">
    29 Main Street, New Delhi-110001<br>
    GST: 07AABCG1234A1Z5<br>
    Contact: +91 98765-43210
  </div>
  <div style="font-size:10px; font-weight:bold; margin:1mm 0;">
    RETAIL INVOICE
  </div>
</div>

<div class="hr"></div>

<!-- CUSTOMER INFO -->
<div style="font-size:10px;">
  <b>Name:</b> ${customerName || 'Walk-in Customer'}
</div>
${customerPhone ? `<div style="font-size:10px;"><b>Phone:</b> ${customerPhone}</div>` : ''}

<!-- BILL META -->
<div class="row">
  <span><b>Date:</b> ${fmtDate(oTime)}</span>
  <span><b>Time:</b> ${fmtTime(oTime)}</span>
</div>
<div class="row">
  <span><b>Bill:</b> ${billNo}</span>
  <span><b>Table:</b> ${tableNum ?? '-'}</span>
</div>
<div class="row">
  <span><b>Cashier:</b> admin</span>
  ${tokenNo ? `<span><b>Token:</b> ${tokenNo}</span>` : '<span></span>'}
</div>

<div class="hr"></div>

<!-- ITEMS TABLE -->
<table>
  <thead>
    <tr>
      <th>Item</th>
      <th>Qty</th>
      <th>Rate</th>
      <th>Amt</th>
    </tr>
  </thead>
  <tbody>
${merged.map((item: any) => {
  const unitPrice = item.menuItem?.price ?? item.price ?? 0;
  const lineTotal = item.quantity * unitPrice;
  return `    <tr>
      <td>${item.menuItem?.name ?? 'Item'}</td>
      <td>${item.quantity}</td>
      <td>${fmt(unitPrice)}</td>
      <td>${fmt(lineTotal)}</td>
    </tr>`;
}).join('\n')}
  </tbody>
</table>

<div class="hr"></div>

<!-- TOTALS -->
<div class="tr">
  <span class="tl">Qty: ${totalQty}</span>
  <span class="tl r">Subtotal</span>
  <span class="tv">₹${fmt(subtotal)}</span>
</div>

${svcCharge > 0 ? `<div class="tr">
  <span class="tl"></span>
  <span class="tl r">Service</span>
  <span class="tv">₹${fmt(svcCharge)}</span>
</div>` : ''}

${showGST ? `<div class="tr">
  <span class="tl"></span>
  <span class="tl r">CGST (9%)</span>
  <span class="tv">₹${fmt(tax / 2)}</span>
</div>
<div class="tr">
  <span class="tl"></span>
  <span class="tl r">SGST (9%)</span>
  <span class="tv">₹${fmt(tax / 2)}</span>
</div>` : ''}

${discAmt > 0 ? `<div class="tr">
  <span class="tl"></span>
  <span class="tl r">Disc (${discPct}%)</span>
  <span class="tv">-₹${fmt(discAmt)}</span>
</div>` : ''}

${pointsRed > 0 ? `<div class="tr">
  <span class="tl"></span>
  <span class="tl r">Points</span>
  <span class="tv">-₹${fmt(pointsRed)}</span>
</div>` : ''}

<div class="hr"></div>

<!-- GRAND TOTAL -->
<div class="tr gt">
  <span class="b">Grand Total</span>
  <span class="b">₹${fmt(total)}</span>
</div>

<div class="hr"></div>

<!-- PAYMENT -->
${bill.status === 'PAID' ? `<div class="tr b">
  <span>Payment: ${bill.paymentMethod ?? 'CASH'}</span>
  <span>PAID ✓</span>
</div>` : ''}

${bill.paymentMethod === 'SPLIT' ? `<div class="tr">
  <span>Cash</span><span>₹${fmt(bill.cashAmount ?? 0)}</span>
</div>
<div class="tr">
  <span>Online</span><span>₹${fmt(bill.onlineAmount ?? 0)}</span>
</div>` : ''}

<!-- FOOTER -->
<div class="dash"></div>
<div class="c" style="font-size:10px; line-height:1.3;">
  <div class="b">Thank you for ordering</div>
  <div>Please visit again 🙏</div>
  <div style="font-size:9px;">www.gen-z.online</div>
</div>

<!-- Cutter space -->
<div style="height:8mm;"></div>

</body>
</html>`;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
};

