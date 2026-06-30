import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { createBillSchema } from '@/lib/validations';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';
import { withTiming } from '@/lib/api-logger';
import { calculateBill } from '@/lib/billUtils';
import { TAX } from '@/lib/constants';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET bills with optional filtering
export const GET = withTiming(async (request: Request) => {
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const limit = limitParam === 'all' ? undefined : (limitParam ? parseInt(limitParam) : 100);

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
      where: {
        order: {
          items: {
            some: { menuItem: { restaurantId } }
          }
        },
        ...(statusParam ? { status: statusParam.toUpperCase() as any } : {})
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderType: true,
            customerName: true,
            customerPhone: true,
            status: true,
            createdAt: true,
            table: { select: { id: true, number: true } },
            items: {
              select: {
                id: true,
                quantity: true,
                price: true,
                portionType: true,
                specialInstructions: true,
                status: true,
                menuItem: { select: { id: true, name: true, category: true } }
              }
            }
          }
        }
      }
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, '/api/bills');

// POST create new bill
export const POST = withTiming(async (request: Request) => {
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

    // ⚡ PERFORMANCE BOOST: Fetch order first to get tableId
    console.time('⏱️ DB-FETCH-ORDER');
    
    // 🔒 SECURITY: Scope all queries to the authenticated user's restaurant
    const restaurantId = (auth.session.user as any).restaurantId;
    
    // 🔥 ERROR HANDLING: Wrap DB calls in try-catch
    let order: any;
    try {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          table: true,
          items: {
            include: {
              menuItem: true
            }
          },
          bill: true // CRITICAL FIX: Include bill relationship to check if already billed
        }
      });
    } catch (dbError: any) {
      console.timeEnd('⏱️ DB-FETCH-ORDER');
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      console.error('[Bill Creation] Database error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again.' },
        { status: 500 }
      );
    }
    
    console.timeEnd('⏱️ DB-FETCH-ORDER');

    if (!order) {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Security check: Ensure order belongs to user's restaurant
    if (order.table?.restaurantId !== restaurantId && order.items[0]?.menuItem?.restaurantId !== restaurantId) {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json({ error: 'Unauthorized order' }, { status: 401 });
    }

    let allTableOrders: any[] = [];
    if (order.tableId) {
      console.time('⏱️ DB-FETCH-TABLE-ORDERS');
      try {
        // Fetch ONLY unbilled orders for this SPECIFIC table
        allTableOrders = await prisma.order.findMany({
          where: {
            tableId: order.tableId,
            bill: null, // Orders that haven't been billed yet
            status: { in: ['PENDING', 'PREPARING', 'READY', 'SERVED'] }
          },
          include: {
            items: {
              include: {
                menuItem: true
              }
            },
            table: true,
            bill: true // Include bill for consistency
          },
          orderBy: { createdAt: 'asc' }
        });
      } catch (dbError: any) {
        console.error('[Bill Creation] Database error fetching table orders:', dbError);
        return NextResponse.json({ error: 'Failed to fetch table orders.' }, { status: 500 });
      }
      console.timeEnd('⏱️ DB-FETCH-TABLE-ORDERS');
    }

    if (!order) {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // 🔥 ERROR HANDLING: Validate order has items
    if (!order.items || order.items.length === 0) {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json({ error: 'Order has no items' }, { status: 400 });
    }
    
    // 🔥 ERROR HANDLING: Ensure allTableOrders is array
    if (!Array.isArray(allTableOrders)) {
      console.error('[Bill Creation] allTableOrders is not an array:', allTableOrders);
      allTableOrders = [];
    }

    // Allow bill generation for any active order status
    // COMPLETED orders already have bills, so reject those
    if (order.status === 'COMPLETED') {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json(
        { error: 'This order is already completed. Please refresh the page.' },
        { status: 400 }
      );
    }
    
    // CRITICAL FIX: Check if the main order already has a bill
    if (order.bill !== null && order.bill !== undefined) {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json(
        { error: 'This order already has a bill generated. Bill ID: ' + order.bill.id },
        { status: 400 }
      );
    }

    // (READY→SERVED update is handled inside the transaction below)

    // CRITICAL FIX: Get ALL orders for this table (not billed yet)
    // This ensures full table bill includes all orders
    let finalTableOrders: any[] = [];
    
    if (order.tableId) {
      
      // ⚡ PERFORMANCE: Filter from already-fetched orders instead of new query
      // CRITICAL FIX: Only include orders that have at least 1 ACTIVE item
      finalTableOrders = allTableOrders.filter(o => {
        if (o.tableId !== order.tableId) return false;
        const activeItemCount = o.items.filter((item: any) => item.status === 'ACTIVE').length;
        return activeItemCount > 0;
      });
    } else {
      // No table (takeaway/delivery), use the already-fetched order with items
      // CRITICAL FIX: Only if it has active items
      const activeItemCount = order.items.filter((item: any) => item.status === 'ACTIVE').length;
      if (activeItemCount > 0) {
        finalTableOrders = [order];
      }
    }

    if (finalTableOrders.length === 0) {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json(
        { error: 'No unbilled orders found for this table' },
        { status: 400 }
      );
    }

    // ⚡ PERFORMANCE: Check for existing bills using pre-fetched data instead of new query
    const existingBills = finalTableOrders.filter(o => o.bill !== null);

    if (existingBills.length > 0) {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json(
        { error: 'One or more orders already have bills. Please refresh and try again.' },
        { status: 400 }
      );
    }

    // Calculate total from ALL orders - ONLY ACTIVE ITEMS (exclude CANCELLED)
    // CRITICAL: Must recalculate from actual items, not use stale order.totalAmount
    const subtotal = finalTableOrders.reduce((sum, o) => {
      const orderSubtotal = o.items
        .filter((item: any) => item.status === 'ACTIVE') // Exclude cancelled items
        .reduce((itemSum: number, item: any) => itemSum + (item.price * item.quantity), 0);
      return sum + orderSubtotal;
    }, 0);
    
    // CRITICAL FIX: If subtotal is 0 (all items cancelled), reject bill generation
    if (subtotal <= 0) {
      console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
      return NextResponse.json(
        { error: 'Cannot generate bill: All items have been cancelled. Please add items or clear the table.' },
        { status: 400 }
      );
    }
    
    // Use centralized bill calculation
    const taxRate = process.env.TAX_RATE ? parseFloat(process.env.TAX_RATE) : TAX.GST_RATE;
    const billCalc = calculateBill({
      subtotal,
      applyGST: true,
      taxRate,
      applyServiceCharge: false,
      discountPercent: 0,
      pointsToRedeem: 0,
    });


    // ⚡ PERFORMANCE OPTIMIZATION: Use batch operations instead of loops
    console.time('⏱️ DB-TRANSACTION');
    const bill = await prisma.$transaction(async (tx) => {
      const primaryOrder = finalTableOrders[0];
      const otherOrders = finalTableOrders.slice(1);

      // If there are multiple orders, merge all their items into the primary order
      if (otherOrders.length > 0) {
        const otherOrderIds = otherOrders.map(o => o.id);
        
        // Move all items to primary order
        await tx.orderItem.updateMany({
          where: { orderId: { in: otherOrderIds } },
          data: { orderId: primaryOrder.id }
        });

        // Delete the other orders to avoid ghost/dangling completed orders
        await tx.order.deleteMany({
          where: { id: { in: otherOrderIds } }
        });
      }

      // Mark primary order as COMPLETED (handles READY→SERVED→COMPLETED in one shot)
      await tx.order.update({
        where: { id: primaryOrder.id },
        data: { status: 'COMPLETED' }
      });
      
      // Handle double-clicks: check if bill already exists inside transaction
      const existingTxBill = await tx.bill.findUnique({
        where: { orderId: primaryOrder.id },
        select: { id: true, orderId: true, tableId: true, subtotal: true, tax: true, discount: true, total: true, status: true, createdAt: true }
      });
      
      if (existingTxBill) {
        // Re-fetch with full relations for response
        return tx.bill.findUnique({
          where: { id: existingTxBill.id },
          include: {
            order: {
              include: {
                items: { include: { menuItem: true } },
                table: true
              }
            },
            table: true
          }
        });
      }
      
      return tx.bill.create({
        data: {
          orderId: primaryOrder.id,
          tableId: order.tableId,
          subtotal: billCalc.subtotal,
          tax: billCalc.tax,
          discount: billCalc.discount,
          total: billCalc.total,
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
    if (!bill) {
      return NextResponse.json({ error: 'Bill creation failed unexpectedly.' }, { status: 500 });
    }

    const allItems = finalTableOrders.flatMap(o => o.items);
    
    const enhancedBill = {
      ...bill,
      order: {
        ...(bill as any).order,
        items: allItems // Replace with ALL items from all orders
      },
      _meta: {
        orderCount: finalTableOrders.length,
        orderIds: finalTableOrders.map(o => o.id)
      }
    };


    console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
    return NextResponse.json(enhancedBill, { status: 201 });
  } catch (error) {
    console.timeEnd('⏱️ TOTAL-BILL-GENERATION');
    console.error('[Bill Creation] Error:', error);
    return NextResponse.json(
      { error: `Failed to create bill: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}, '/api/bills');