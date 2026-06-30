import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

/**
 * Production Cleanup Endpoint
 * Clears all orders, bills, order items. Preserves menu, tables, users, restaurant config.
 * ADMIN only — accessible from Settings > Danger Zone
 */
export async function POST(req: Request) {
  try {
    const { error, session } = await checkAuth(req);
    if (error || !session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    // Delete in strict FK order (no transactions needed - sequential deletes handle constraints)
    const deletedPT = await prisma.pointTransaction.deleteMany({});
    const deletedOI = await prisma.orderItem.deleteMany({});
    const deletedBills = await prisma.bill.deleteMany({});
    const deletedOrders = await prisma.order.deleteMany({});
    const resetTables = await prisma.table.updateMany({
      data: { status: 'AVAILABLE' }
    });

    return NextResponse.json({
      success: true,
      message: 'All order data deleted. Tables reset to available.',
      stats: {
        pointTransactions: deletedPT.count,
        orderItems: deletedOI.count,
        bills: deletedBills.count,
        orders: deletedOrders.count,
        tablesReset: resetTables.count,
      }
    });
  } catch (error: any) {
    console.error('Cleanup error:', error?.message);
    return NextResponse.json({
      error: 'Failed to clean database',
      detail: error?.message
    }, { status: 500 });
  }
}
