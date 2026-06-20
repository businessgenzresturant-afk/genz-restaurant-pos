import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTakeawayFlow() {
  console.log('--- TESTING TAKEAWAY & DELIVERY FLOW ---');
  
  try {
    // 1. Fetch any random menu item to add to the order
    const menuItem = await prisma.menuItem.findFirst();
    if (!menuItem) {
      console.log('❌ No menu items found in DB. Please seed the DB.');
      return;
    }

    // 2. Create a TAKEAWAY order (No tableId)
    console.log('1️⃣ Creating new TAKEAWAY order without a table...');
    const order = await prisma.order.create({
      data: {
        orderType: 'TAKEAWAY',
        customerName: 'Automated Test User',
        status: 'PENDING',
        totalAmount: 0, // Will update when adding items
        // Note: tableId is deliberately left out!
      }
    });
    console.log(`✅ Order created successfully! ID: ${order.id}`);

    // 3. Add items to the order
    console.log(`2️⃣ Adding item (${menuItem.name}) to the order...`);
    const quantity = 2;
    const itemTotal = menuItem.price * quantity;
    
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        menuItemId: menuItem.id,
        quantity: quantity,
        price: menuItem.price
      }
    });

    // Update order total
    await prisma.order.update({
      where: { id: order.id },
      data: { totalAmount: itemTotal }
    });
    console.log(`✅ Items added! Total Amount: ₹${itemTotal}`);

    // 4. Generate a bill for this table-less order
    console.log(`3️⃣ Generating Bill for the Takeaway order...`);
    const tax = itemTotal * 0.05; // 5% GST
    const finalTotal = itemTotal + tax;

    const bill = await prisma.bill.create({
      data: {
        orderId: order.id,
        subtotal: itemTotal,
        tax: tax,
        total: finalTotal,
        status: 'PENDING',
      }
    });
    console.log(`✅ Bill generated successfully! Bill ID: ${bill.id}, Total: ₹${finalTotal}`);

    console.log('--- 🎉 ALL TESTS PASSED! THE FLOW WORKS PERFECTLY! 🎉 ---');

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTakeawayFlow();
