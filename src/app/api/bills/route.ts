import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { createBillSchema } from '@/lib/validations';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET bills with optional filtering
export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    const restaurantId = (auth.session.user as any).restaurantId;
    let whereClause: any = {
      OR: [
        { table: { restaurantId } },
        { order: { items: { some: { menuItem: { restaurantId } } } } }
      ]
    };
    if (statusParam) {
      whereClause.status = statusParam.toUpperCase();
    }

    const bills = await prisma.bill.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            items: {
              include: {
                menuItem: true
              }
            },
            table: true
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

// POST create new bill
export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    
    const validation = createBillSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { orderId } = validation.data;

    // Check if order exists and is completed
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'COMPLETED' && order.status !== 'SERVED') {
      return NextResponse.json(
        { error: 'Can only generate bill for served or completed orders' },
        { status: 400 }
      );
    }

    // Check if bill already exists
    const existingBill = await prisma.bill.findUnique({
      where: { orderId }
    });

    if (existingBill) {
      return NextResponse.json(
        { error: 'Bill already exists for this order' },
        { status: 400 }
      );
    }

    // Calculate bill amounts using TAX_RATE from environment or default to 18%
    const subtotal = order.totalAmount;
    const taxRate = process.env.TAX_RATE ? parseFloat(process.env.TAX_RATE) : 0.18;
    const tax = subtotal * taxRate;
    const discount = 0; // Can be added later
    const total = subtotal + tax - discount;

    const bill = await prisma.$transaction(async (tx) => {
      // If order is SERVED, mark it as COMPLETED
      if (order.status === 'SERVED') {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'COMPLETED' }
        });
      }

      return tx.bill.create({
        data: {
          orderId,
          tableId: order.tableId,
          subtotal,
          tax,
          discount,
          total,
          status: 'PENDING'
        },
        include: {
          order: {
            include: {
              items: {
                include: {
                  menuItem: true
                }
              },
              table: true
            }
          }
        }
      });
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json(
      { error: 'Failed to create bill. Please try again.' },
      { status: 500 }
    );
  }
}