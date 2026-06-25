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
  console.time('⏱️ TOTAL-BILL-GENERATION');
  
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) {
    console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
    return auth.error;
  }

  try {
    const body = await request.json();
    
    const validation = createBillSchema.safeParse(body);
    if (!validation.success) {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { orderId } = validation.data;

    // ⚡ PERFORMANCE: Fetch order with all data in single query
    console.time('⏱️ DB-ORDER-FETCH');
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });
    console.timeEnd('⏱️ DB-ORDER-FETCH');

    if (!order) {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Allow bill generation for any active order status
    // COMPLETED orders already have bills, so reject those
    if (order.status === 'COMPLETED') {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json(
        { error: 'This order already has a bill generated' },
        { status: 400 }
      );
    }

    // Auto-mark orders as SERVED before billing if they're READY
    // This ensures proper workflow tracking
    if (order.status === 'READY') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'SERVED' }
      });
      console.log(`[Bill Creation] Auto-marked order ${orderId} as SERVED (was READY)`);
    }

    // CRITICAL FIX: Get ALL orders for this table (not billed yet)
    // This ensures full table bill includes all orders
    let allTableOrders: any[] = [];
    
    if (order.tableId) {
      console.log(`[Bill Creation] Table ${order.table?.number}: Finding all unbilled orders`);
      
      // ⚡ PERFORMANCE: Fetch all unbilled orders with items in single query
      console.time('⏱️ DB-TABLE-ORDERS-FETCH');
      allTableOrders = await prisma.order.findMany({
        where: {
          tableId: order.tableId,
          status: { in: ['PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'] },
          bill: null // Orders that haven't been billed yet
        },
        include: {
          items: {
            include: {
              menuItem: true
            }
          },
          table: true
        },
        orderBy: { createdAt: 'asc' }
      });
      console.timeEnd('⏱️ DB-TABLE-ORDERS-FETCH');

      console.log(`[Bill Creation] Found ${allTableOrders.length} unbilled orders for Table ${order.table?.number}`);
      allTableOrders.forEach((o, idx) => {
        console.log(`  Order ${idx + 1}: ${o.items.length} items, Status: ${o.status}, Amount: ₹${o.totalAmount}`);
      });
    } else {
      // No table (takeaway/delivery), use the already-fetched order with items
      allTableOrders = [order];
    }

    if (allTableOrders.length === 0) {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json(
        { error: 'No unbilled orders found for this table' },
        { status: 400 }
      );
    }

    // ⚡ PERFORMANCE: Check for existing bills in a single query
    console.time('⏱️ DB-CHECK-EXISTING-BILLS');
    const existingBills = await prisma.bill.findMany({
      where: {
        orderId: { in: allTableOrders.map(o => o.id) }
      }
    });
    console.timeEnd('⏱️ DB-CHECK-EXISTING-BILLS');

    if (existingBills.length > 0) {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json(
        { error: 'One or more orders already have bills. Please refresh and try again.' },
        { status: 400 }
      );
    }

    // Calculate total from ALL orders
    const subtotal = allTableOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const taxRate = process.env.TAX_RATE ? parseFloat(process.env.TAX_RATE) : 0.18;
    const tax = subtotal * taxRate;
    const discount = 0;
    const total = subtotal + tax - discount;

    console.log(`[Bill Creation] Creating bill for Table ${order.table?.number || 'Takeaway'}`);
    console.log(`  Total orders: ${allTableOrders.length}`);
    console.log(`  Subtotal: ₹${subtotal}`);
    console.log(`  Tax: ₹${tax}`);
    console.log(`  Total: ₹${total}`);

    // ⚡ PERFORMANCE OPTIMIZATION: Use batch operations instead of loops
    console.time('⏱️ DB-TRANSACTION');
    const bill = await prisma.$transaction(async (tx) => {
      // Mark ALL orders as COMPLETED in a single batch operation
      // Orders in any status (PENDING, PREPARING, READY, SERVED) should become COMPLETED when billed
      await tx.order.updateMany({
        where: { id: { in: allTableOrders.map(o => o.id) } },
        data: { status: 'COMPLETED' }
      });

      // Create bill linked to PRIMARY order (first one chronologically)
      // But include reference to all order IDs in metadata
      const primaryOrder = allTableOrders[0];
      
      return tx.bill.create({
        data: {
          orderId: primaryOrder.id,
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
          },
          table: true
        }
      });
    });
    console.timeEnd('⏱️ DB-TRANSACTION');

    // IMPORTANT: Manually fetch and attach ALL orders' items to the bill response
    // So frontend gets complete picture
    const allItems = allTableOrders.flatMap(o => o.items);
    
    const enhancedBill = {
      ...bill,
      order: {
        ...bill.order,
        items: allItems // Replace with ALL items from all orders
      },
      _meta: {
        orderCount: allTableOrders.length,
        orderIds: allTableOrders.map(o => o.id)
      }
    };

    console.log(`[Bill Creation] ✅ Bill created with ${allItems.length} total items from ${allTableOrders.length} orders`);

    console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
    return NextResponse.json(enhancedBill, { status: 201 });
  } catch (error) {
    console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
    console.error('[Bill Creation] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create bill. Please try again.' },
      { status: 500 }
    );
  }
}