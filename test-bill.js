const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBillGen() {
  try {
    const restaurantId = 'a72b7f37-884f-49d8-9790-cac3091fa45d';
    // Create a dummy menuItem
    const menuItem = await prisma.menuItem.findFirst({ where: { restaurantId } });
    if (!menuItem) {
      console.log('No menu item found');
      return;
    }
    
    // Create a dummy order
    const order = await prisma.order.create({
      data: {
        restaurantId,
        orderType: 'TAKEAWAY',
        status: 'PENDING',
        totalAmount: menuItem.price,
        items: {
          create: {
            menuItemId: menuItem.id,
            quantity: 1,
            price: menuItem.price,
          }
        }
      },
      include: {
        table: true,
        items: {
          include: { menuItem: true }
        },
        bill: true
      }
    });
    
    console.log('Created order:', order.id);

    // Simulate POST /api/bills logic
    const orderRestaurantId = order.restaurantId || order.table?.restaurantId || order.items[0]?.menuItem?.restaurantId;
    if (orderRestaurantId !== restaurantId) {
      console.error('Unauthorized order', { orderRestaurantId, restaurantId });
      return;
    }

    let allTableOrders = [];
    if (order.tableId) {
      // not tableId
    }

    let finalTableOrders = [];
    const activeItemCount = order.items.filter((item) => item.status === 'ACTIVE').length;
    if (activeItemCount > 0) {
      finalTableOrders = [order];
    }
    
    if (finalTableOrders.length === 0) {
      console.error('No unbilled orders found');
      return;
    }

    const subtotal = finalTableOrders.reduce((sum, o) => {
      const orderSubtotal = o.items
        .filter((item) => item.status === 'ACTIVE') // Exclude cancelled items
        .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
      return sum + orderSubtotal;
    }, 0);
    
    if (subtotal <= 0) {
      console.error('Subtotal 0');
      return;
    }
    
    const taxRate = 5;
    
    const bill = await prisma.$transaction(async (tx) => {
      return tx.bill.create({
        data: {
          orderId: order.id,
          restaurantId,
          subtotal: subtotal,
          tax: subtotal * 0.05,
          total: subtotal * 1.05,
          status: 'PENDING'
        }
      });
    });

    console.log('Successfully generated bill:', bill.id);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
testBillGen();
