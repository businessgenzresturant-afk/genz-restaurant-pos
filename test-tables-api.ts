import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  try {
    const tableCount = await prisma.table.count();
    console.log(`Total tables in database: ${tableCount}`);

    const allTables = await prisma.table.findMany({
      include: { restaurant: true }
    });
    console.log('Successfully fetched all tables. Count:', allTables.length);
    if (allTables.length > 0) {
      console.log('Sample table:', JSON.stringify({
        id: allTables[0].id,
        number: allTables[0].number,
        capacity: allTables[0].capacity,
        status: allTables[0].status,
        restaurantId: allTables[0].restaurantId,
        restaurant: allTables[0].restaurant
      }, null, 2));
    }

    const restaurantId = '00000000-0000-0000-0000-000000000001';
    const restaurantTables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' },
      include: { restaurant: true }
    });
    console.log(`Successfully fetched tables for restaurantId ${restaurantId}. Count: ${restaurantTables.length}`);

    // Try query with undefined restaurantId
    try {
      console.log('Testing query with undefined restaurantId...');
      await prisma.table.findMany({
        where: { restaurantId: undefined as any },
        orderBy: { number: 'asc' },
        include: { restaurant: true }
      });
      console.log('Query with undefined restaurantId succeeded.');
    } catch (e: any) {
      console.log('Query with undefined restaurantId FAILED. Error:');
      console.error(e.message || e);
    }
  } catch (error: any) {
    console.error('Error during prisma query execution:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
