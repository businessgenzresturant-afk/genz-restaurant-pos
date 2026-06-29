/**
 * printReceipt — Single unified print function for ALL receipts in the app.
 *
 * Key design decisions:
 *  - width:100% on body so the printer driver controls the roll width (works on 58mm AND 80mm).
 *  - @page { margin:0; size:auto } — no browser auto-scaling, no added page margins.
 *  - NO bold font-weight on thermal body text — many thermal printers double-strike bold text
 *    producing visible ghost/shadow. Bold is only used where absolutely needed (restaurant name, grand total).
 *  - Courier New monospace so columns align precisely without CSS grid.
 *  - Items table uses a simple flex layout so text wraps naturally.
 *  - Logo embedded as absolute URL from origin so it always loads in the popup window.
 */

export const printReceipt = (bill: any, type: 'receipt' | 'kot' = 'receipt') => {
  // Open a minimal popup — size does not matter, the print dialog takes over.
  const printWindow = window.open('', '_blank', 'width=600,height=400');

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
     KOT RECEIPT
  ═══════════════════════════════════════════════════════════════════ */
  if (isKOT) {
    const kotHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>KOT ${(bill.order?.id ?? bill.id ?? '').slice(-6).toUpperCase()}</title>
<style>
  @page { margin: 0; size: auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 16px;
    line-height: 1.4;
    color: #000;
    background: #fff;
    width: 100%;
    padding: 4mm 3mm;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .center   { text-align: center; }
  .bold     { font-weight: 700; }
  .hr-solid { border: none; border-top: 1.5px solid #000; margin: 4px 0; }
  .hr-dash  { border: none; border-top: 1px dashed #000;  margin: 4px 0; }
  .row      { display: flex; justify-content: space-between; margin: 2px 0; }
  .item-block { margin: 3px 0; }
  .item-line  { display: flex; justify-content: space-between; font-size: 17px; }
  .item-name  { flex: 1; padding-right: 8px; word-break: break-word; }
  .item-qty   { white-space: nowrap; }
  .note       { font-size: 13px; font-style: italic; padding-left: 10px; }
</style>
</head>
<body>
<div class="center bold" style="font-size:22px; letter-spacing:2px;">KOT</div>
<div class="center" style="font-size:12px;">Kitchen Order Ticket</div>
<div class="hr-solid"></div>
<div class="row"><span>Table:</span><span class="bold">T-${bill.order?.table?.number ?? bill.table?.number ?? '?'}</span></div>
<div class="row"><span>Order:</span><span>${(bill.order?.id ?? bill.id ?? '').slice(-8).toUpperCase()}</span></div>
<div class="row"><span>Time:</span><span>${fmtTime(oTime)}</span></div>
${(bill.order?.customerName || bill.customerName) ? `<div class="row"><span>Customer:</span><span>${bill.order?.customerName ?? bill.customerName}</span></div>` : ''}
<div class="hr-solid"></div>
<div class="row bold"><span>ITEM</span><span>QTY</span></div>
<div class="hr-dash"></div>
${merged.map(item => `<div class="item-block">
  <div class="item-line">
    <span class="item-name bold">${item.menuItem?.name ?? item.name ?? 'Item'}</span>
    <span class="item-qty bold">x${item.quantity}</span>
  </div>
  ${(item.cleanInstr || item.specialInstructions) ? `<div class="note">⚠ ${item.cleanInstr || item.specialInstructions}</div>` : ''}
</div>`).join('')}
<div class="hr-solid"></div>
<div class="center" style="font-size:12px; margin-top:4px;">Printed: ${fmtTime(new Date())}</div>
</body>
</html>`;

    printWindow.document.write(kotHTML);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 400);
    return;
  }

  /* ═══════════════════════════════════════════════════════════════════
     CUSTOMER BILL RECEIPT
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

  // Logo — absolute URL so popup window can fetch it
  const logoUrl = `${origin}/images/Gen-z-logo.jpg`;

  const receiptHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Receipt ${billNo}</title>
<style>
  /* ── Page ── */
  @page {
    margin: 0;
    size: auto;          /* let the printer driver pick the paper size */
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    line-height: 1.5;
    color: #000;
    background: #fff;
    /*
     * DO NOT set a fixed mm width here.
     * width:100% means the browser viewport in the popup, which the
     * OS print dialog maps to the physical roll width automatically.
     * This makes it work on both 58mm and 80mm printers.
     */
    width: 100%;
    padding: 3mm 2mm;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Utilities ── */
  .center    { text-align: center; }
  .right     { text-align: right; }
  .bold      { font-weight: 700; }
  .xlbold    { font-weight: 900; }
  .upper     { text-transform: uppercase; }
  .italic    { font-style: italic; }

  /* ── Dividers ── */
  .hr-solid { border: none; border-top: 1.5px solid #000; margin: 5px 0; }
  .hr-dash  { border: none; border-top: 1px   dashed #000; margin: 3px 0; }

  /* ── Header ── */
  .logo-wrap { display: flex; justify-content: center; margin-bottom: 4px; }
  .logo-img  { width: 60px; height: 60px; object-fit: contain; }
  .rest-name { font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .rest-addr { font-size: 12px; line-height: 1.4; }

  /* ── Info rows ── */
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px 4px;
    font-size: 13px;
  }
  .meta-right { text-align: right; }

  /* ── Items table ── */
  .tbl-head {
    display: flex;
    font-size: 13px;
    font-weight: 700;
    border-bottom: 1px solid #000;
    padding-bottom: 2px;
    margin-bottom: 2px;
  }
  .col-name   { flex: 1; padding-right: 4px; }
  .col-qty    { width: 28px; text-align: center; flex-shrink: 0; }
  .col-price  { width: 52px; text-align: right; flex-shrink: 0; }
  .col-amt    { width: 58px; text-align: right; flex-shrink: 0; }

  .item-row {
    display: flex;
    font-size: 14px;
    margin: 2px 0;
    align-items: flex-start;
  }
  .item-note {
    font-size: 12px;
    font-style: italic;
    padding-left: 8px;
    margin-bottom: 2px;
    color: #333;
  }

  /* ── Totals ── */
  .tot-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    margin: 1px 0;
  }
  .tot-label { flex: 1; }
  .tot-val   { text-align: right; white-space: nowrap; }

  .grand-row {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 900;
    margin: 3px 0;
  }

  /* ── Payment ── */
  .pay-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    margin: 1px 0;
  }

  /* ── Footer ── */
  .footer {
    text-align: center;
    font-size: 13px;
    margin-top: 4px;
    line-height: 1.6;
  }

  /* ── Print overrides (nothing to override — already clean) ── */
  @media print {
    body { padding: 2mm 1.5mm; }
  }
</style>
</head>
<body>

<!-- ═══ HEADER ═══ -->
<div class="center">
  <div class="logo-wrap">
    <img class="logo-img" src="${logoUrl}" alt="Logo" onerror="this.style.display='none'">
  </div>
  <div class="rest-name">Gen-Z Restaurant</div>
  <div class="rest-addr">
    <div>123 Main Street, New Delhi - 110001</div>
    <div>Tel: +91 98765 43210</div>
    <div>GSTIN: 07AABCG1234A1Z5</div>
  </div>
  <div style="font-size:11px; margin-top:3px; letter-spacing:1px;" class="upper">Retail Invoice</div>
</div>

<div class="hr-solid"></div>

<!-- ═══ CUSTOMER + BILL META ═══ -->
<div style="font-size:14px; margin-bottom:3px;">
  <span class="bold">Name: </span>${customerName || 'Walk-in'}
  ${customerPhone ? `&nbsp;&nbsp;<span class="bold">Ph:</span> ${customerPhone}` : ''}
</div>

<div class="meta-grid">
  <div><span class="bold">Date:</span> ${fmtDate(oTime)}</div>
  <div class="meta-right"><span class="bold">Time:</span> ${fmtTime(oTime)}</div>
  <div><span class="bold">Bill No:</span> ${billNo}</div>
  <div class="meta-right">${tableNum ? `<span class="bold">Table:</span> ${tableNum}` : 'Takeaway'}</div>
  <div><span class="bold">Cashier:</span> admin</div>
  ${tokenNo ? `<div class="meta-right"><span class="bold">Token:</span> ${tokenNo}</div>` : '<div></div>'}
</div>

<div class="hr-solid"></div>

<!-- ═══ ITEMS TABLE ═══ -->
<div class="tbl-head">
  <span class="col-name">Item</span>
  <span class="col-qty">Qty</span>
  <span class="col-price">Rate</span>
  <span class="col-amt">Amt</span>
</div>

${merged.map((item: any) => {
  const unitPrice = item.menuItem?.price ?? item.price ?? 0;
  const lineTotal = item.quantity * unitPrice;
  return `<div>
  <div class="item-row">
    <span class="col-name">${item.menuItem?.name ?? item.name ?? 'Item'}</span>
    <span class="col-qty" style="text-align:center">${item.quantity}</span>
    <span class="col-price">${fmt(unitPrice)}</span>
    <span class="col-amt">${fmt(lineTotal)}</span>
  </div>
  ${item.cleanInstr ? `<div class="item-note">  ↳ ${item.cleanInstr}</div>` : ''}
</div>`;
}).join('')}

<div class="hr-solid"></div>

<!-- ═══ SUBTOTAL / TAX / DISCOUNTS ═══ -->
<div class="tot-row">
  <span class="tot-label">Qty: ${totalQty}</span>
  <span class="tot-label" style="text-align:right">Subtotal</span>
  <span class="tot-val">₹${fmt(subtotal)}</span>
</div>

${svcCharge > 0 ? `<div class="tot-row">
  <span class="tot-label"></span>
  <span class="tot-label" style="text-align:right">Service Charge</span>
  <span class="tot-val">₹${fmt(svcCharge)}</span>
</div>` : ''}

${showGST ? `<div class="tot-row">
  <span class="tot-label"></span>
  <span class="tot-label" style="text-align:right">CGST (9%)</span>
  <span class="tot-val">₹${fmt(tax / 2)}</span>
</div>
<div class="tot-row">
  <span class="tot-label"></span>
  <span class="tot-label" style="text-align:right">SGST (9%)</span>
  <span class="tot-val">₹${fmt(tax / 2)}</span>
</div>` : ''}

${discAmt > 0 ? `<div class="tot-row">
  <span class="tot-label"></span>
  <span class="tot-label" style="text-align:right">Discount (${discPct}%)</span>
  <span class="tot-val">-₹${fmt(discAmt)}</span>
</div>` : ''}

${pointsRed > 0 ? `<div class="tot-row">
  <span class="tot-label"></span>
  <span class="tot-label" style="text-align:right">Points Redeemed</span>
  <span class="tot-val">-₹${fmt(pointsRed)}</span>
</div>` : ''}

<div class="hr-solid"></div>

<!-- ═══ GRAND TOTAL ═══ -->
<div class="grand-row">
  <span>Grand Total</span>
  <span>₹${fmt(total)}</span>
</div>

<div class="hr-solid"></div>

<!-- ═══ PAYMENT DETAILS ═══ -->
${bill.status === 'PAID' ? `<div class="pay-row bold">
  <span>Payment: ${bill.paymentMethod ?? 'CASH'}</span>
  <span>PAID ✓</span>
</div>` : ''}

${bill.paymentMethod === 'SPLIT' ? `<div class="pay-row">
  <span>Cash</span><span>₹${fmt(bill.cashAmount ?? 0)}</span>
</div>
<div class="pay-row">
  <span>Online</span><span>₹${fmt(bill.onlineAmount ?? 0)}</span>
</div>` : ''}

<!-- ═══ FOOTER ═══ -->
<div class="hr-dash" style="margin-top:6px;"></div>
<div class="footer">
  <div class="bold">Thank you for dining with us!</div>
  <div>Please visit us again  🙏</div>
  <div style="font-size:11px; margin-top:3px;">www.gen-z.online</div>
</div>
<div style="height:6mm;"></div><!-- cutter clearance -->

</body>
</html>`;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();

  // Give the browser 500ms to load the logo image before triggering print.
  setTimeout(() => { printWindow.print(); }, 500);
};
