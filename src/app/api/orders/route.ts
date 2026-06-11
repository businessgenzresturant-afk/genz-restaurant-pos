import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    
    let whereClause = {};
    if (statusParam) {
      whereClause = {
        status: { in: statusParam.split(',') }
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        table: true,
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableId, items, customerName, customerPhone } = body;
    
    if (!tableId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let totalAmount = 0;
    const orderItemsWithDetails = await Promise.all(
      items.map(async (item: any) => {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId }
        });

        if (!menuItem) {
          throw new Error(`Menu item ${item.menuItemId} not found`);
        }

        const totalPrice = menuItem.price * item.quantity;
        totalAmount += totalPrice;

        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: menuItem.price,
          totalPrice,
          specialInstructions: item.specialInstructions || ''
        };
      })
    );

    // Create customer if needed, or just keep it simple
    // The current schema has customerName/phone on Customer model, not Order
    // Wait, let me check schema again. Order has customerId, TableId.
    let customerId = undefined;
    if (customerName || customerPhone) {
      const customer = await prisma.customer.create({
        data: {
          name: customerName || 'Walk-in',
          phone: customerPhone || null
        }
      });
      customerId = customer.id;
    }

    const order = await prisma.order.create({
      data: {
        tableId: parseInt(tableId),
        customerId,
        totalAmount,
        items: {
          create: orderItemsWithDetails
        }
      },
      include: {
        table: true,
        items: true
      }
    });
    
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
