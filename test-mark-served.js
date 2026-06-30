const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const order = await prisma.order.findFirst();
  if (!order) return console.log('No order');
  
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'SERVED',
          version: { increment: 1 }
        },
        include: {
          table: true,
          items: { include: { menuItem: true } }
        }
      });
      
      if (updatedOrder.tableId) {
        await tx.table.update({
          where: { id: updatedOrder.tableId },
          data: { status: 'RUNNING' }
        });
      }
      return updatedOrder;
    });
    console.log('Success:', updated.id);
  } catch(e) {
    console.error('Error updating:', e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
