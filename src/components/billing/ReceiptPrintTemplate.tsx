'use client';

import Image from 'next/image';

interface ReceiptPrintTemplateProps {
  bill: any;
  onClose?: () => void;
}

/**
 * ReceiptPrintTemplate
 *
 * Renders a SCREEN PREVIEW of the receipt (visible inside the bill modal).
 * Actual printing is done by the single printReceipt() function in printUtils.ts.
 * There is NO hidden print div here — we only ever print from printUtils.ts.
 */
export function ReceiptPrintTemplate({ bill, onClose }: ReceiptPrintTemplateProps) {

  const handlePrint = () => {
    import('@/lib/printUtils').then(({ printReceipt }) => {
      printReceipt(bill, 'receipt');
    });
  };

  /* ── helpers ─────────────────────────────────────────────────────── */
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

  const fmt      = (n: number) => n.toFixed(2);
  const items    = bill.order?.items ?? [];
  const merged   = mergeItems(items);
  const oTime    = new Date(bill.order?.createdAt ?? bill.createdAt ?? Date.now());
  const subtotal = bill.subtotal ?? 0;
  const tax      = bill.tax ?? 0;
  const total    = bill.total ?? 0;
  const discPct  = bill.discountPercent ?? 0;
  const discAmt  = discPct > 0 ? (subtotal * discPct) / 100 : 0;
  const totalQty = merged.reduce((s, i) => s + i.quantity, 0);

  const HR = () => <div style={{ borderTop: '1px solid #000', margin: '4px 0' }} />;
  const HRDash = () => <div style={{ borderTop: '1px dashed #555', margin: '3px 0' }} />;

  return (
    <div className="space-y-3">

      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
      >
        <span>🖨️</span> Print Receipt
      </button>

      {/*
        ── SCREEN PREVIEW ──────────────────────────────────────────────
        Styled to mimic what the thermal print will look like.
        Uses the same font and layout proportions as the print template.
      */}
      <div
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '13px',
          lineHeight: '1.5',
          color: '#000',
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '12px 10px',
          maxHeight: '520px',
          overflowY: 'auto',
          maxWidth: '340px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'4px' }}>
            <Image
              src="/images/Gen-z-logo.jpg"
              alt="Gen-Z Logo"
              width={50}
              height={50}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div style={{ fontSize:'16px', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px' }}>
            Gen-Z Restaurant
          </div>
          <div style={{ fontSize:'11px', lineHeight:'1.4' }}>
            <div>123 Main Street, New Delhi - 110001</div>
            <div>Tel: +91 98765 43210</div>
            <div>GSTIN: 07AABCG1234A1Z5</div>
          </div>
          <div style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase', marginTop:'2px' }}>
            Retail Invoice
          </div>
        </div>

        <HR />

        {/* Customer */}
        <div style={{ fontSize:'13px', marginBottom:'3px' }}>
          <strong>Name:</strong> {bill.order?.customerName ?? bill.customerName ?? 'Walk-in'}
        </div>

        {/* Meta */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', fontSize:'12px', gap:'1px 4px' }}>
          <div><strong>Date:</strong> {oTime.toLocaleDateString('en-GB')}</div>
          <div style={{ textAlign:'right' }}><strong>Time:</strong> {oTime.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}</div>
          <div><strong>Bill:</strong> {(bill.id ?? '').slice(-6).toUpperCase()}</div>
          <div style={{ textAlign:'right' }}>
            {bill.order?.table?.number ? <><strong>Table:</strong> {bill.order.table.number}</> : 'Takeaway'}
          </div>
          {bill.order?.id && (
            <div><strong>Token:</strong> {bill.order.id.slice(-3).toUpperCase()}</div>
          )}
        </div>

        <HR />

        {/* Items header */}
        <div style={{ display:'flex', fontWeight:700, fontSize:'12px', borderBottom:'1px solid #000', paddingBottom:'2px', marginBottom:'2px' }}>
          <span style={{ flex:1 }}>Item</span>
          <span style={{ width:'28px', textAlign:'center' }}>Qty</span>
          <span style={{ width:'52px', textAlign:'right' }}>Rate</span>
          <span style={{ width:'58px', textAlign:'right' }}>Amt</span>
        </div>

        {/* Items */}
        {merged.map((item, idx) => {
          const unitPrice = item.menuItem?.price ?? item.price ?? 0;
          const lineTotal = item.quantity * unitPrice;
          return (
            <div key={idx}>
              <div style={{ display:'flex', fontSize:'13px', margin:'2px 0', alignItems:'flex-start' }}>
                <span style={{ flex:1, paddingRight:'4px', wordBreak:'break-word' }}>
                  {item.menuItem?.name ?? item.name ?? 'Item'}
                </span>
                <span style={{ width:'28px', textAlign:'center' }}>{item.quantity}</span>
                <span style={{ width:'52px', textAlign:'right' }}>{fmt(unitPrice)}</span>
                <span style={{ width:'58px', textAlign:'right' }}>{fmt(lineTotal)}</span>
              </div>
              {item.cleanInstr && (
                <div style={{ fontSize:'11px', fontStyle:'italic', paddingLeft:'8px', color:'#444' }}>
                  ↳ {item.cleanInstr}
                </div>
              )}
            </div>
          );
        })}

        <HR />

        {/* Subtotal row */}
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', margin:'1px 0' }}>
          <span>Qty: {totalQty}</span>
          <span>Subtotal</span>
          <span>₹{fmt(subtotal)}</span>
        </div>

        {/* Service charge */}
        {bill.serviceChargeApplied && bill.serviceChargeAmount > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', margin:'1px 0' }}>
            <span></span><span>Service Charge</span><span>₹{fmt(bill.serviceChargeAmount)}</span>
          </div>
        )}

        {/* GST */}
        {bill.gstApplied !== false && tax > 0 && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', margin:'1px 0' }}>
              <span></span><span>CGST (9%)</span><span>₹{fmt(tax / 2)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', margin:'1px 0' }}>
              <span></span><span>SGST (9%)</span><span>₹{fmt(tax / 2)}</span>
            </div>
          </>
        )}

        {/* Discount */}
        {discAmt > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', margin:'1px 0' }}>
            <span></span><span>Discount ({discPct}%)</span><span>-₹{fmt(discAmt)}</span>
          </div>
        )}

        {/* Points */}
        {(bill.pointsRedeemed ?? 0) > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', margin:'1px 0' }}>
            <span></span><span>Points Redeemed</span><span>-₹{fmt(bill.pointsRedeemed)}</span>
          </div>
        )}

        <HR />

        {/* Grand Total */}
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'17px', fontWeight:900, margin:'3px 0' }}>
          <span>Grand Total</span>
          <span>₹{fmt(total)}</span>
        </div>

        <HR />

        {/* Payment */}
        {bill.status === 'PAID' && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', fontWeight:700, margin:'1px 0' }}>
            <span>Payment: {bill.paymentMethod ?? 'CASH'}</span>
            <span>PAID ✓</span>
          </div>
        )}
        {bill.paymentMethod === 'SPLIT' && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', margin:'1px 0' }}>
              <span>Cash</span><span>₹{fmt(bill.cashAmount ?? 0)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', margin:'1px 0' }}>
              <span>Online</span><span>₹{fmt(bill.onlineAmount ?? 0)}</span>
            </div>
          </>
        )}

        <HRDash />

        {/* Footer */}
        <div style={{ textAlign:'center', fontSize:'12px', marginTop:'4px', lineHeight:'1.6' }}>
          <div style={{ fontWeight:700 }}>Thank you for dining with us!</div>
          <div>Please visit us again 🙏</div>
          <div style={{ fontSize:'10px' }}>www.gen-z.online</div>
        </div>
      </div>
    </div>
  );
}
