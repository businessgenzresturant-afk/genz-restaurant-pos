import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    
    if (!start || !end) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const bills = await prisma.bill.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'paid'
      },
      include: {
        order: {
          include: {
            table: true,
            items: {
              include: {
                menuItem: true
              }
            }
          }
        }
      }
    });

    const totalSales = bills.reduce((sum, bill) => sum + bill.finalAmount, 0);
    const totalTax = bills.reduce((sum, bill) => sum + bill.taxAmount, 0);
    const totalDiscount = bills.reduce((sum, bill) => sum + bill.discountAmount, 0);
    const totalBills = bills.length;
    
    const paymentMethodStats = bills.reduce((acc: any, bill) => {
      const method = bill.paymentMethod || 'cash';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    const itemPopularity: Record<string, { name: string; quantity: number; revenue: number }> = {};
    bills.forEach(bill => {
      bill.order.items.forEach((item: any) => {
        const itemId = item.menuItem.id;
        if (!itemPopularity[itemId]) {
          itemPopularity[itemId] = {
            name: item.menuItem.name,
            quantity: 0,
            revenue: 0
          };
        }
        itemPopularity[itemId].quantity += item.quantity;
        itemPopularity[itemId].revenue += (item.quantity * item.unitPrice);
      });
    });

    const topItems = Object.values(itemPopularity)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const hourlySales: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlySales[i] = 0;
    }
    
    bills.forEach(bill => {
      const hour = new Date(bill.createdAt).getHours();
      hourlySales[hour] = (hourlySales[hour] || 0) + bill.finalAmount;
    });

    const hourlyData = Object.entries(hourlySales)
      .map(([hour, amount]) => ({
        hour: parseInt(hour),
        amount: amount as number
      }))
      .sort((a, b) => a.hour - b.hour);

    return NextResponse.json({
      dateRange: { start, end },
      totals: { sales: totalSales, tax: totalTax, discount: totalDiscount, bills: totalBills },
      paymentMethods: paymentMethodStats,
      topItems,
      hourlySales: hourlyData
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
