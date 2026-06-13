import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET reports data
export async function GET(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    
    // Default to today if no dates provided
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);
    
    // Get completed orders within date range
    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    // Calculate daily sales total
    const dailySalesTotal = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
    
    // Calculate orders count
    const ordersCount = orders.length;
    
    // Calculate top 3 selling items
    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
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
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}