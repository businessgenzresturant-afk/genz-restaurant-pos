const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.table.findMany({
    include: {
      orders: {
        include: {
          items: {
            include: {
              menuItem: true
            }
          },
          bill: true
        }
      }
    }
  });

  console.log('=== TABLES & ORDERS ===');
  for (const t of tables) {
    const activeOrders = t.orders.filter(o => o.status !== 'COMPLETED');
    console.log(`Table ${t.number} (${t.status}): ${t.orders.length} orders total, ${activeOrders.length} active`);
    for (const o of t.orders) {
      console.log(`  Order ${o.id} (${o.status}, payment: ${o.paymentStatus}): ${o.items.length} items, total: ₹${o.totalAmount}`);
      for (const item of o.items) {
        console.log(`    - ${item.menuItem.name} x${item.quantity} (${item.status}) - ₹${item.price}`);
      }
      if (o.bill) {
        console.log(`    [Bill ${o.bill.id} (${o.bill.status}): total ₹${o.bill.total}]`);
      }
    }
  }

  const bills = await prisma.bill.findMany({
    where: { tableId: null }
  });
  console.log('\n=== TAKEAWAY/DELIVERY BILLS ===');
  console.log(`Found ${bills.length} bills without table`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
