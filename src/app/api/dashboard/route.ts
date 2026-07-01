import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { withTiming } from '@/lib/api-logger';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Unified dashboard endpoint — returns tables + active orders in ONE query
 * This replaces the 3 separate fetch calls (tables + orders + reports) on the dashboard
 * 
 * ⚡ Performance: Instead of 3 DB round trips every 10s, this is 2 parallel queries
 */
export const GET = withTiming(async (request: Request) => {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const restaurantId = (auth.session.user as any).restaurantId;
    const isAdmin = (auth.session.user as any).role === 'ADMIN';

    if (!restaurantId) {
      return NextResponse.json({
        error: 'Session expired. Please logout and login again.',
        code: 'MISSING_RESTAURANT_ID'
      }, { status: 401 });
    }

    // ⚡ PERFORMANCE: Run tables + active orders in PARALLEL with minimal selects
    const [tables, activeOrders] = await Promise.all([
      // Tables: Only need status + number for dashboard display
      prisma.table.findMany({
        where: { restaurantId },
        select: {
          id: true,
          number: true,
          capacity: true,
          status: true,
        },
        orderBy: { number: 'asc' }
      }),

      // Active orders: Only PENDING/PREPARING/READY/SERVED
      prisma.order.findMany({
        where: {
          restaurantId,
          status: { in: ['PENDING', 'PREPARING', 'READY', 'SERVED'] }
        },
        select: {
          id: true,
          tableId: true,
          status: true,
          orderType: true,
          totalAmount: true,
          customerName: true,
          customerPhone: true,
          createdAt: true,
          updatedAt: true,
          version: true,
          paymentStatus: true,
          guests: true,
          bill: { select: { id: true, status: true } },
          table: { select: { id: true, number: true, status: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              portionType: true,
              specialInstructions: true,
              status: true,
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  price: true,
                  priceHalf: true,
                  hasHalfFullOption: true,
                  dietType: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Revenue only for admin — calculate from today's PAID bills
    let revenue = 0;
    if (isAdmin) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const todayRevenue = await prisma.bill.aggregate({
        where: {
          restaurantId,
          status: 'PAID',
          OR: [
            { paidAt: { gte: startOfDay, lte: endOfDay } },
            { createdAt: { gte: startOfDay, lte: endOfDay } }
          ]
        },
        _sum: { total: true }
      });
      revenue = todayRevenue._sum.total || 0;
    }

    return NextResponse.json(
      { tables, activeOrders, revenue },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, '/api/dashboard');
