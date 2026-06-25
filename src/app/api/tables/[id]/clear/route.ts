import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';

// POST force clear table
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

  const { id } = await params;

  try {
    const tableId = id;

    // Check if table exists
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // 🔒 SECURITY: Enhanced checks before clearing table
    // Check for unpaid bills on any order linked to this table
    const unpaidBill = await prisma.bill.findFirst({
      where: {
        tableId,
        status: 'PENDING'
      },
      include: {
        order: true
      }
    });

    if (unpaidBill) {
      return NextResponse.json(
        { 
          error: `Cannot clear table - unpaid bill exists for Order #${unpaidBill.orderId}. Collect payment first.` 
        },
        { status: 400 }
      );
    }

    // 🔒 SECURITY: Check for active orders without bills
    const activeOrders = await prisma.order.count({
      where: {
        tableId,
        status: {
          in: ['PENDING', 'PREPARING', 'READY', 'SERVED']
        }
      }
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        { 
          error: `Cannot clear table - ${activeOrders} active order(s) found. Generate bills first.` 
        },
        { status: 400 }
      );
    }

    // Force clear table
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: { status: 'AVAILABLE' }
    });

    return NextResponse.json(updatedTable);
  } catch (error) {
    console.error('Error clearing table:', error);
    return NextResponse.json(
      { error: 'Failed to clear table. Please try again.' },
      { status: 500 }
    );
  }
}
