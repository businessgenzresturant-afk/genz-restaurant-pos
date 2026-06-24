import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';
import { sanitizeSpecialInstructions, sanitizeCustomerInput } from '@/lib/sanitize';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tableId = searchParams.get('tableId');

    const restaurantId = (auth.session.user as any).restaurantId;
    let whereClause: any = {
      OR: [
        { table: { restaurantId } },
        { items: { some: { menuItem: { restaurantId } } } }
      ]
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
    
    return NextResponse.json(orders, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.time('⏱️ TOTAL-ORDER-CREATION');
  
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    console.timeEnd('⏱️ TOTAL-ORDER-CREATION');
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) {
    console.timeEnd('⏱️ TOTAL-ORDER-CREATION');
    return auth.error;
  }

  try {
    const body = await request.json();
    const { tableId, items, customerName, customerPhone, orderType, guests } = body;

    // Input validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: items are required' },
        { status: 400 }
      );
    }
    
    if ((!orderType || orderType === 'DINE_IN') && !tableId) {
      return NextResponse.json(
        { error: 'tableId is required for DINE_IN orders' },
        { status: 400 }
      );
    }

    // Validate quantities and sanitize inputs
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
      // 🔒 SECURITY: Sanitize special instructions to prevent SQL injection and XSS
      if (item.specialInstructions) {
        item.specialInstructions = sanitizeSpecialInstructions(item.specialInstructions);
      }
    }

    // P1 FIX: Validate table and menu items belong to user's restaurant for multi-tenant isolation
    const restaurantId = (auth.session.user as any).restaurantId;
    
    // Check table availability and lock it - WITH RESTAURANT VALIDATION
    let table = null;
    if (tableId) {
      table = await prisma.table.findFirst({
        where: { 
          id: tableId,
          restaurantId: restaurantId // Ensure table belongs to user's restaurant
        },
      });

      if (!table) {
        return NextResponse.json({ error: 'Table not found or does not belong to your restaurant' }, { status: 404 });
      }
    }

    // Fetch all menu items to get prices and validate - WITH RESTAURANT VALIDATION
    console.time('⏱️ DB-MENU-FETCH');
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: items.map((i: any) => i.menuItemId)
        },
        restaurantId: restaurantId // Ensure menu items belong to user's restaurant
      }
    });
    console.timeEnd('⏱️ DB-MENU-FETCH');

    if (menuItems.length !== items.length) {
      return NextResponse.json(
        { error: 'One or more menu items not found or do not belong to your restaurant' },
        { status: 404 }
      );
    }

    // Create a map for quick lookup
    const menuItemMap = new Map(menuItems.map(m => [m.id, m]));

    // 🔒 SECURITY: Sanitize customer inputs to prevent injection attacks
    const sanitizedCustomerName = customerName ? sanitizeCustomerInput(customerName) : 'Walk-in Customer';
    const sanitizedCustomerPhone = customerPhone ? sanitizeCustomerInput(customerPhone) : null;

    // Calculate total amount and prepare items for creation
    let totalAmount = 0;
    const orderItemsData = items.map((item: any) => {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem) throw new Error('Menu item not found');
      
      // Determine price based on portion type
      let price = menuItem.price;
      if (item.portionType === 'HALF' && menuItem.priceHalf) {
        price = menuItem.priceHalf;
      }
      
      totalAmount += price * item.quantity;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: price,
        portionType: item.portionType || null,
        specialInstructions: item.specialInstructions || null
      };
    });

    // CRITICAL FIX: Move table status check and order lookup INSIDE transaction
    // This prevents TOCTOU race condition where multiple devices see "AVAILABLE"
    // and each create separate orders for the same table
    try {
      console.time('⏱️ TRANSACTION');
      const result = await prisma.$transaction(async (tx) => {
        // Check table status INSIDE transaction (CRITICAL FIX)
        const currentTable = tableId ? await tx.table.findUnique({
          where: { id: tableId }
        }) : null;

        // Find active order INSIDE transaction (CRITICAL FIX)
        // BUGFIX: Exclude SERVED orders - once served, table should start fresh order
        const activeOrder = tableId ? await tx.order.findFirst({
          where: {
            tableId,
            status: { notIn: ['COMPLETED', 'SERVED'] }
          },
          orderBy: { createdAt: 'desc' }
        }) : null;

        console.log('[Order Creation] Table status:', currentTable?.status);
        console.log('[Order Creation] Active order found:', !!activeOrder);
        console.log('[Order Creation] Active order status:', activeOrder?.status);

        // BUGFIX: If table is OCCUPIED but order is SERVED, treat as NEW order
        // Only append to PENDING/PREPARING/READY orders
        if (currentTable && currentTable.status === 'OCCUPIED' && activeOrder && ['PENDING', 'PREPARING', 'READY'].includes(activeOrder.status)) {
          // Create new order items
          await tx.orderItem.createMany({
            data: orderItemsData.map(item => ({ 
              ...item, 
              orderId: activeOrder.id
            }))
          });

          // Decrement stock for items that are stock-tracked (PARALLEL)
          console.time('⏱️ STOCK-UPDATES');
          await Promise.all(
            orderItemsData
              .filter(item => {
                const menuItem = menuItemMap.get(item.menuItemId);
                return menuItem && menuItem.stockQuantity !== null && menuItem.stockQuantity !== undefined;
              })
              .map(item => {
                const menuItem = menuItemMap.get(item.menuItemId)!;
                const newStock = menuItem.stockQuantity! - item.quantity;
                return tx.menuItem.update({
                  where: { id: item.menuItemId },
                  data: {
                    stockQuantity: Math.max(0, newStock),
                    available: newStock > 0 ? menuItem.available : false
                  }
                });
              })
          );
          console.timeEnd('⏱️ STOCK-UPDATES');

          // Optimistic locking: Check version before update
          const updatedOrderCount = await tx.order.updateMany({
            where: { 
              id: activeOrder.id,
              version: activeOrder.version // Only update if version matches
            },
            data: {
              totalAmount: { increment: totalAmount },
              status: 'PENDING', // Reset to PENDING so kitchen gets notified
              version: { increment: 1 } // Increment version on every update
            }
          });

          // If no rows were updated, version mismatch occurred (conflict)
          if (updatedOrderCount.count === 0) {
            throw new Error('VERSION_CONFLICT');
          }

          // Fetch the updated order with relations
          const updatedOrder = await tx.order.findUnique({
            where: { id: activeOrder.id },
            include: {
              table: true,
              items: {
                include: {
                  menuItem: true
                }
              }
            }
          });

          return { type: 'UPDATE', order: updatedOrder };
        }

        // Otherwise, create NEW order (table not occupied or no active order)
        // Otherwise, create NEW order (table not occupied or no active order)
        const newOrder = await tx.order.create({
          data: {
            tableId: tableId || null,
            orderType: orderType || 'DINE_IN',
            guests: guests ? parseInt(guests) : null,
            customerName: sanitizedCustomerName,
            customerPhone: sanitizedCustomerPhone,
            totalAmount,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            version: 0, // Initial version
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

        // Update table status to OCCUPIED if applicable
        if (tableId) {
          await tx.table.update({
            where: { id: tableId },
            data: { status: 'OCCUPIED' }
          });
        }

        // Decrement stock for new order items (PARALLEL)
        console.time('⏱️ STOCK-UPDATES');
        await Promise.all(
          orderItemsData
            .filter(item => {
              const menuItem = menuItemMap.get(item.menuItemId);
              return menuItem && menuItem.stockQuantity !== null && menuItem.stockQuantity !== undefined;
            })
            .map(item => {
              const menuItem = menuItemMap.get(item.menuItemId)!;
              const newStock = menuItem.stockQuantity! - item.quantity;
              return tx.menuItem.update({
                where: { id: item.menuItemId },
                data: {
                  stockQuantity: Math.max(0, newStock),
                  available: newStock > 0 ? menuItem.available : false
                }
              });
            })
        );
        console.timeEnd('⏱️ STOCK-UPDATES');

        return { type: 'CREATE', order: newOrder };
      });
      console.timeEnd('⏱️ TRANSACTION');

      console.timeEnd('⏱️ TOTAL-ORDER-CREATION');
      return NextResponse.json(result.order, { status: 201 });
    } catch (error: any) {
      console.timeEnd('⏱️ TRANSACTION');
      console.timeEnd('⏱️ TOTAL-ORDER-CREATION');
      
      if (error.message === 'VERSION_CONFLICT') {
        return NextResponse.json(
          { 
            error: 'Conflict detected: Order was modified by another session. Please refresh and try again.',
            code: 'VERSION_CONFLICT'
          },
          { status: 409 }
        );
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    console.timeEnd('⏱️ TOTAL-ORDER-CREATION');
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
