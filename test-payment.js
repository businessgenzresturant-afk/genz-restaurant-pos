const id = "123"; // I don't have a real ID, but I can use a fake one to get the error message
fetch('http://localhost:3000/api/bills/' + id, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'PAID',
    paymentMethod: 'CASH',
    gstApplied: false,
    serviceChargeApplied: false,
    serviceChargeAmount: 0,
    customerName: undefined,
    customerPhone: undefined,
    discount: 5,
    discountPercent: 5,
    pointsRedeemed: 0,
    cashAmount: 171,
    onlineAmount: 0,
  }),
}).then(res => res.json()).then(console.log).catch(console.error);
