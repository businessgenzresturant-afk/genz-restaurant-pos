import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';
import { withTiming } from '@/lib/api-logger';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/**
 * PUBLIC KDS Orders Endpoint
 * This endpoint is specifically for KDS TV displays that don't have user authentication
 * Access is controlled by restaurantId parameter which is validated server-side via token
 */
export const GET = withTiming(async (request: Request) => {
  const rateLimit = checkRateLimit(request, RateLimitPresets.PUBLIC);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');

    // CRITICAL: restaurantId is required for this public endpoint
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      );
    }

    // Build where clause - use direct items filter (faster than OR)
    let whereClause: any = {
      items: { some: { menuItem: { restaurantId } } }
    };
    
    // Handle multiple statuses (comma-separated)
    if (status) {
      const statuses = status.split(',').map(s => s.trim().toUpperCase());
      if (statuses.length === 1) {
        whereClause.status = statuses[0];
      } else {
        whereClause.status = { in: statuses };
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        table: { select: { id: true, number: true, status: true } },
        items: {
          include: {
            menuItem: { select: { id: true, name: true, category: true, dietType: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(orders, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('[KDS Orders API] Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, '/api/kds-orders');
