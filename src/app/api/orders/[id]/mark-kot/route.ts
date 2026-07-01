import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/orders/[id]/mark-kot
 * Marks all unprinted active items in an order as KOT printed.
 */
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
    const orderId = id;
    const restaurantId = (auth.session.user as any).restaurantId;

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'User session invalid - no restaurant ID' },
        { status: 401 }
      );
    }

    // Verify the order exists and belongs to the restaurant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { table: { restaurantId } },
          { items: { some: { menuItem: { restaurantId } } } }
        ]
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Mark unprinted items as printed
    const updateResult = await prisma.orderItem.updateMany({
      where: {
        orderId: orderId,
        kotPrinted: false,
        status: 'ACTIVE'
      },
      data: {
        kotPrinted: true
      }
    });

    return NextResponse.json({
      success: true,
      updatedCount: updateResult.count
    });

  } catch (error: any) {
    console.error('Error marking KOT printed:', error);
    return NextResponse.json(
      { error: 'Failed to mark KOT printed', details: error.message },
      { status: 500 }
    );
  }
}
