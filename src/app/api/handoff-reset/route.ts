import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = request.headers.get('x-reset-secret');
  if (secret !== 'genz-final-handoff-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Backup core data
    const backup = {
      restaurant: await prisma.restaurant.findFirst(),
      users: await prisma.user.findMany(),
      categories: await prisma.category.findMany(),
      menuItems: await prisma.menuItem.findMany(),
      tables: await prisma.table.findMany(),
    };

    // 2. Wipe transactional data (Order matters for foreign keys)
    await prisma.billItem.deleteMany();
    await prisma.bill.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();

    // 3. Reset tables
    await prisma.table.updateMany({
      data: { status: 'AVAILABLE' }
    });

    return NextResponse.json({
      success: true,
      message: 'Database reset successfully for handoff',
      backup
    });
  } catch (error: any) {
    console.error('Handoff reset error:', error);
    return NextResponse.json({ error: 'Reset failed', detail: error?.message }, { status: 500 });
  }
}
