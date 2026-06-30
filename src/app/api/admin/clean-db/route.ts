import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { error, session } = await checkAuth(req);
    if (error || !session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete in correct FK order
    await prisma.pointTransaction.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.bill.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.table.updateMany({ data: { status: 'AVAILABLE' } });

    return NextResponse.json({
      success: true,
      message: 'Testing data successfully cleaned and tables reset to AVAILABLE.'
    });
  } catch (error: any) {
    console.error('Database Clean Error:', error?.message);
    return NextResponse.json({ error: 'Failed to clean database', detail: error?.message }, { status: 500 });
  }
}
