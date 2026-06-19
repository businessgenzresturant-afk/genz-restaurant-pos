import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET reports data
export async function GET(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  // Restrict to ADMIN - financial reports are sensitive
  if ((auth.session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate') || searchParams.get('start');
    const endDateStr = searchParams.get('endDate') || searchParams.get('end');
    
    // Default to today if no dates provided
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);
    
    // Get completed orders within date range
    const restaurantId = (auth.session.user as any).restaurantId;
    
    // P0 FIX: Use bills (actual collected amounts) instead of orders for revenue calculation
    const bills = await prisma.bill.findMany({
      where: {
        status: 'PAID',
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          { table: { restaurantId } },
          { order: { items: { some: { menuItem: { restaurantId } } } } }
        ]
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                menuItem: true
              }
            }
          }
        }
      }
    });

    // Calculate daily sales total from actual collected amounts (bill.total includes GST, discounts, points)
    const dailySalesTotal = bills.reduce((sum: number, bill: any) => sum + bill.total, 0);
    
    // Calculate orders count
    const ordersCount = bills.length;
    
    // Calculate top 3 selling items from paid bills
    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    bills.forEach((bill: any) => {
      bill.order.items.forEach((item: any) => {
        if (!itemSales[item.menuItemId]) {
          itemSales[item.menuItemId] = {
            name: item.menuItem.name,
            quantity: 0,
            revenue: 0
          };
        }
        
        itemSales[item.menuItemId].quantity += item.quantity;
        itemSales[item.menuItemId].revenue += item.quantity * item.menuItem.price;
      });
    });
    
    const topItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);
    
    // Calculate payment methods breakdown (if we had payment status on orders)
    // For simplicity, we'll skip this for now since we don't have paymentStatus field in order yet
    
    return NextResponse.json({
      dailySalesTotal,
      ordersCount,
      topItems,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}