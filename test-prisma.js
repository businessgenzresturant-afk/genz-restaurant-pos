const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    // Just try to find a bill and select serviceChargeAmount
    const bill = await prisma.bill.findFirst({
      select: {
        id: true,
        serviceChargeAmount: true
      }
    });
    console.log("Success! Prisma recognizes serviceChargeAmount.");
    console.log(bill);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
