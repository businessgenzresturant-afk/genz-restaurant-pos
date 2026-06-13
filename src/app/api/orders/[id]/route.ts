import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { status, paymentStatus } = body;

    const order = await prisma.order.update({
      where: { id: params.id },
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
