import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const restaurantId = (auth.session.user as any).restaurantId;
    const order = await prisma.order.findFirst({
      where: {
        id,
        OR: [
          { table: { restaurantId } },
          { items: { some: { menuItem: { restaurantId } } } }
        ]
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
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus } = body;

    const restaurantId = (auth.session.user as any).restaurantId;
    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        OR: [
          { table: { restaurantId } },
          { items: { some: { menuItem: { restaurantId } } } }
        ]
      }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus })
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

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const restaurantId = (auth.session.user as any).restaurantId;
    const order = await prisma.order.findFirst({
      where: {
        id,
        OR: [
          { table: { restaurantId } },
          { items: { some: { menuItem: { restaurantId } } } }
        ]
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'COMPLETED' || order.status === 'SERVED') {
      return NextResponse.json({ error: 'Cannot cancel an order that is SERVED or COMPLETED' }, { status: 400 });
    }

    const deletedOrder = await prisma.$transaction(async (tx) => {
      // Delete the order (cascades to order items)
      const deleted = await tx.order.delete({
        where: { id }
      });

      let activeOrders = 0;
      if (order.tableId) {
        // Check if table has other active orders
        activeOrders = await tx.order.count({
          where: {
            tableId: order.tableId,
            status: { notIn: ['COMPLETED'] },
            id: { not: id }
          }
        });

        if (activeOrders === 0) {
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: 'AVAILABLE' }
          });
        }
      }

      return deleted;
    });

    return NextResponse.json(deletedOrder);
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

