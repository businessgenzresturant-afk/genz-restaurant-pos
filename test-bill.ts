import { prisma } from './src/lib/prisma';
import { calculateBill } from './src/lib/billUtils';

async function run() {
  try {
    const orderId = "REPLACE_ME"; // I need an order ID. I'll just check the DB logs.
  } catch(e) {
    console.error(e);
  }
}
run();
