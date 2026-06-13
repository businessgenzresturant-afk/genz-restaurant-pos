import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tableId = searchParams.get('tableId');

    let whereClause: any = {
      table: { restaurantId: (auth.session.user as any).restaurantId }
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
    
    if (tableId) whereClause.tableId = tableId;

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
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { tableId, items, customerName, customerPhone } = body;

    // Input validation
    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: tableId and items are required' },
        { status: 400 }
      );
    }

    // Validate quantities
    for (const item of items) {
      if (!item.menuItemId) {
        return NextResponse.json(
          { error: 'Each item must have a menuItemId' },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity < 1 || item.quantity > 1000) {
        return NextResponse.json(
          { error: 'Quantity must be between 1 and 1000' },
          { status: 400 }
        );
      }
      // Sanitize special instructions (basic XSS prevention)
      if (item.specialInstructions) {
        item.specialInstructions = item.specialInstructions
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
          .substring(0, 500); // Limit length
      }
    }

    // Check table availability and lock it
    const table = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Fetch all menu items to get prices and validate
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: items.map((i: any) => i.menuItemId)
        }
      }
    });

    if (menuItems.length !== items.length) {
      return NextResponse.json(
        { error: 'One or more menu items not found' },
        { status: 404 }
      );
    }

    // Create a map for quick price lookup
    const priceMap = new Map(menuItems.map(m => [m.id, m.price]));

    // Calculate total amount and prepare items for creation
    let totalAmount = 0;
    const orderItemsData = items.map((item: any) => {
      const price = priceMap.get(item.menuItemId) || 0;
      totalAmount += price * item.quantity;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: price,
        specialInstructions: item.specialInstructions || null
      };
    });

    if (table.status === 'OCCUPIED') {
      // Find the active order for this table
      const activeOrder = await prisma.order.findFirst({
        where: {
          tableId,
          status: { notIn: ['COMPLETED'] }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (activeOrder) {
        // Append items to the active order
        const updatedOrder = await prisma.$transaction(async (tx) => {
          await tx.orderItem.createMany({
            data: orderItemsData.map(item => ({ ...item, orderId: activeOrder.id }))
          });

          return tx.order.update({
            where: { id: activeOrder.id },
            data: {
              totalAmount: { increment: totalAmount },
              status: 'PENDING' // Reset to PENDING so kitchen gets notified
            },
            include: {
              table: true,
              items: {
                include: {
                  menuItem: true
                }
              }
            }
          });
        });

        return NextResponse.json(updatedOrder, { status: 201 });
      }
    }

    // Create order and update table status in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          tableId,
          customerName: customerName || 'Walk-in Customer',
          customerPhone: customerPhone || null,
          totalAmount,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          items: {
            create: orderItemsData
          }
        },
        include: {
          table: true,
          items: {
            include: {
              menuItem: true
            }
          }
        }
      });

      // Update table status to OCCUPIED
      await tx.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' }
      });

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    );
  }
}
