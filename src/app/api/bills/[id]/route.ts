import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!body.paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    const bill = await prisma.bill.update({
      where: { id: parseInt(id) },
      data: { 
        status: 'paid',
        paymentMethod: body.paymentMethod
      }
    });
    
    await prisma.order.update({
      where: { id: bill.orderId },
      data: { paymentStatus: 'paid' }
    });

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
