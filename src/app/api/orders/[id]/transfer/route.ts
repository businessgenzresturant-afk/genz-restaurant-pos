import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { newTableId } = body;

    if (!newTableId) {
      return NextResponse.json({ error: 'newTableId is required' }, { status: 400 });
    }

    // 🔒 SECURITY: Validate newTableId is a valid format (basic check)
    if (typeof newTableId !== 'string' || newTableId.length < 10 || newTableId.length > 50) {
      return NextResponse.json({ error: 'Invalid table ID format' }, { status: 400 });
    }

    const restaurantId = (auth.session.user as any).restaurantId;
    
    // 1. Fetch the order
    const order = await prisma.order.findFirst({
      where: {
        id,
        table: { restaurantId }
      },
      include: { table: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const oldTableId = order.tableId;

    if (oldTableId === newTableId) {
      return NextResponse.json({ error: 'Order is already on this table' }, { status: 400 });
    }

    // 2. Fetch the new table to ensure it exists and belongs to the restaurant
    const newTable = await prisma.table.findFirst({
      where: {
        id: newTableId,
        restaurantId
      }
    });

    if (!newTable) {
      return NextResponse.json({ error: 'New table not found' }, { status: 404 });
    }

    // 3. Perform the transfer in a transaction
    await prisma.$transaction(async (tx) => {
      // Update order to new table
      await tx.order.update({
        where: { id: order.id },
        data: { tableId: newTableId }
      });

      // CRITICAL: Transfer bill if it exists
      const existingBill = await tx.bill.findUnique({
        where: { orderId: order.id }
      });

      if (existingBill) {
        await tx.bill.update({
          where: { id: existingBill.id },
          data: { tableId: newTableId }
        });
        console.log(`✅ Bill ${existingBill.id} transferred to Table ${newTable.number}`);
      }

      // Update new table status to OCCUPIED
      await tx.table.update({
        where: { id: newTableId },
        data: { status: 'OCCUPIED' }
      });

      // If there was an old table, check if it has any OTHER active orders
      if (oldTableId) {
        const remainingOrders = await tx.order.count({
          where: {
            tableId: oldTableId,
            status: { in: ['PENDING', 'PREPARING', 'READY', 'SERVED'] },
            id: { not: order.id }
          }
        });

        // If no other active orders on the old table, mark it AVAILABLE
        if (remainingOrders === 0) {
          await tx.table.update({
            where: { id: oldTableId },
            data: { status: 'AVAILABLE' }
          });
          console.log(`✅ Table ${order.table?.number} marked as AVAILABLE (no remaining orders)`);
        } else {
          console.log(`ℹ️ Table ${order.table?.number} still has ${remainingOrders} active order(s)`);
        }
      }
    });

    console.log(`✅ Order ${order.id} transferred: Table ${order.table?.number} → Table ${newTable.number}`);

    return NextResponse.json({ 
      success: true, 
      message: `Order transferred from Table ${order.table?.number || 'Unknown'} to Table ${newTable.number}`,
      oldTable: order.table?.number,
      newTable: newTable.number
    });
  } catch (error) {
    console.error('Error transferring table:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
