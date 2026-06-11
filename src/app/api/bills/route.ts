import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const bills = await prisma.bill.findMany({
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
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Check if bill exists
    const existingBill = await prisma.bill.findUnique({
      where: { orderId: parseInt(orderId) },
      include: {
        order: { include: { table: true, items: { include: { menuItem: true } } } }
      }
    });

    if (existingBill) {
      return NextResponse.json(existingBill);
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const subtotal = order.totalAmount;
    const taxRate = 0.18;
    const taxAmount = subtotal * taxRate;
    const discountAmount = 0;
    const finalAmount = subtotal + taxAmount - discountAmount;

    const bill = await prisma.bill.create({
      data: {
        orderId: order.id,
        amount: subtotal,
        taxAmount,
        discountAmount,
        finalAmount,
        status: 'pending'
      },
      include: {
        order: { include: { table: true, items: { include: { menuItem: true } } } }
      }
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
