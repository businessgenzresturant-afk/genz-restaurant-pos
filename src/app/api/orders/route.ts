import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';
import { sanitizeSpecialInstructions, sanitizeCustomerInput } from '@/lib/sanitize';
import { withTiming } from '@/lib/api-logger';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const GET = withTiming(async (request: Request) => {
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
    const limitParam = searchParams.get('limit');
    const limit = limitParam === 'all' ? undefined : (limitParam ? parseInt(limitParam) : 100);

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
      take: limit,
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
}, '/api/orders');

export const POST = withTiming(async (request: Request) => {
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
    
    // 🔥 ERROR HANDLING: Validate restaurantId exists
    if (!restaurantId) {
      console.timeEnd('⏱️ TOTAL-ORDER-CREATION');
      return NextResponse.json(
        { error: 'User session invalid - no restaurant ID' },
        { status: 401 }
      );
    }
    
    // ⚡ PERFORMANCE: Fetch table and menu items in PARALLEL instead of sequential
    console.time('⏱️ DB-PARALLEL-FETCH');
    
    // 🔥 ERROR HANDLING: Wrap DB calls
    let table: any = null;
    let menuItems: any[] = [];
    try {
      [table, menuItems] = await Promise.all([
        // Check table availability and lock it - WITH RESTAURANT VALIDATION
        tableId ? prisma.table.findFirst({
          where: { 
            id: tableId,
            restaurantId: restaurantId // Ensure table belongs to user's restaurant
          },
        }) : Promise.resolve(null),
        
        // Fetch all menu items to get prices and validate - WITH RESTAURANT VALIDATION
        prisma.menuItem.findMany({
          where: {
            id: {
              in: items.map((i: any) => i.menuItemId)
            },
            restaurantId: restaurantId // Ensure menu items belong to user's restaurant
          }
        })
      ]);
    } catch (dbError: any) {
      console.timeEnd('⏱️ DB-PARALLEL-FETCH');
      console.timeEnd('⏱️ TOTAL-ORDER-CREATION');
      console.error('Order creation DB error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again.' },
        { status: 500 }
      );
    }
    
    console.timeEnd('⏱️ DB-PARALLEL-FETCH');

    if (tableId && !table) {
      console.timeEnd('⏱️ TOTAL-ORDER-CREATION');
      return NextResponse.json({ error: 'Table not found or does not belong to your restaurant' }, { status: 404 });
    }
    
    // 🔥 ERROR HANDLING: Validate menuItems is array
    if (!Array.isArray(menuItems)) {
      console.timeEnd('⏱️ TOTAL-ORDER-CREATION');
      return NextResponse.json(
        { error: 'Menu items data invalid' },
        { status: 500 }
      );
    }

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
      
      // 🔧 CRITICAL FIX: Validate stock before creating order
      if (menuItem.stockQuantity !== null && menuItem.stockQuantity !== undefined) {
        if (menuItem.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${menuItem.name}. Available: ${menuItem.stockQuantity}, Requested: ${item.quantity}`);
        }
        if (!menuItem.available) {
          throw new Error(`${menuItem.name} is currently unavailable`);
        }
      }
      
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

    // ✅ CRITICAL FIX: Move table status check and order lookup INSIDE transaction with ROW LOCKING
    // This prevents TOCTOU race condition where multiple devices see "AVAILABLE"
    // and each create separate orders for the same table
    try {
      console.time('⏱️ TRANSACTION');
      const result = await prisma.$transaction(async (tx) => {
        // ✅ CRITICAL FIX: Lock table row with FOR UPDATE to prevent concurrent modifications
        // This ensures only ONE transaction can proceed at a time for this table
        let currentTable = null;
        if (tableId) {
          const lockedTables = await tx.$queryRaw<Array<{id: string, status: string, number: number}>>`
            SELECT id, status, number FROM "Table"
            WHERE id = ${tableId}
            FOR UPDATE
          `;
          currentTable = lockedTables && lockedTables.length > 0 ? lockedTables[0] : null;
          
          if (!currentTable) {
            throw new Error('Table not found');
          }
        }

        // Find active order INSIDE locked transaction (CRITICAL FIX)
        // 🔧 BUGFIX: Include SERVED orders - customers often add items after being served (running table)
        // Only exclude COMPLETED orders (those that have been billed and paid)
        const activeOrder = tableId ? await tx.order.findFirst({
          where: {
            tableId,
            status: { notIn: ['COMPLETED'] }  // ✅ Keep SERVED orders active for running tables
          },
          orderBy: { createdAt: 'desc' }
        }) : null;


        // 🔧 BUGFIX: Append to ANY active order (PENDING/PREPARING/READY/SERVED) - supports running tables
        // Only create new order if table has NO active order or order is COMPLETED
        if (currentTable && ['OCCUPIED', 'RUNNING'].includes(currentTable.status) && activeOrder && ['PENDING', 'PREPARING', 'READY', 'SERVED'].includes(activeOrder.status)) {
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
      }, {
        isolationLevel: 'ReadCommitted',  // Replaced Serializable with ReadCommitted to prevent lock timeouts
        timeout: 10000
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
}, '/api/orders');
