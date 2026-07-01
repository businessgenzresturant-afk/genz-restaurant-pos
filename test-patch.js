const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPatchBill() {
  try {
    const restaurantId = 'a72b7f37-884f-49d8-9790-cac3091fa45d';
    // Get the bill we just created
    const bill = await prisma.bill.findFirst({
      where: { restaurantId, status: 'PENDING' },
      include: {
        order: {
          include: {
            table: true
          }
        }
      }
    });

    if (!bill) {
      console.log('No pending bill found');
      return;
    }

    console.log('Found bill:', bill.id);

    // Simulate PATCH logic
    const existingBill = await prisma.bill.findFirst({
      where: {
        id: bill.id,
        order: { items: { some: { menuItem: { restaurantId } } } }
      },
      include: {
        order: {
          include: {
            table: true
          }
        }
      }
    });

    if (!existingBill) {
      console.error('Bill not found with restaurantId filter!');
      return;
    }
    
    console.log('Bill found with restaurant ownership check');
    
    // Test the customer update
    const sanitizedCustomerName = 'Staff Test Customer';
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: existingBill.orderId },
        data: { customerName: sanitizedCustomerName }
      });
      console.log('Updated order customer name in transaction');
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
testPatchBill();
