import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';

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
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

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
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: items.map((i: any) => i.menuItemId)
        },
        restaurantId: restaurantId // Ensure menu items belong to user's restaurant
      }
    });

    if (menuItems.length !== items.length) {
      return NextResponse.json(
        { error: 'One or more menu items not found or do not belong to your restaurant' },
        { status: 404 }
      );
    }

    // Create a map for quick lookup
    const menuItemMap = new Map(menuItems.map(m => [m.id, m]));

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

    if (table && table.status === 'OCCUPIED') {
      // Find the active order for this table
      const activeOrder = await prisma.order.findFirst({
        where: {
          tableId,
          status: { notIn: ['COMPLETED', 'SERVED'] }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (activeOrder) {
        // Append items to the active order
        const updatedOrder = await prisma.$transaction(async (tx) => {
          await tx.orderItem.createMany({
            data: orderItemsData.map(item => ({ 
              ...item, 
              orderId: activeOrder.id
            }))
          });

          // Decrement stock for items that are stock-tracked
          for (const item of orderItemsData) {
            const menuItem = menuItemMap.get(item.menuItemId);
            if (menuItem && menuItem.stockQuantity !== null && menuItem.stockQuantity !== undefined) {
              const newStock = menuItem.stockQuantity - item.quantity;
              await tx.menuItem.update({
                where: { id: item.menuItemId },
                data: {
                  stockQuantity: Math.max(0, newStock),
                  // Auto-set to unavailable if stock reaches 0
                  available: newStock > 0 ? menuItem.available : false
                }
              });
            }
          }

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
          tableId: tableId || null,
          orderType: orderType || 'DINE_IN',
          guests: guests ? parseInt(guests) : null,
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

      // Update table status to OCCUPIED if applicable
      if (tableId) {
        await tx.table.update({
          where: { id: tableId },
          data: { status: 'OCCUPIED' }
        });
      }

      // Decrement stock for items that are stock-tracked
      for (const item of orderItemsData) {
        const menuItem = menuItemMap.get(item.menuItemId);
        if (menuItem && menuItem.stockQuantity !== null && menuItem.stockQuantity !== undefined) {
          const newStock = menuItem.stockQuantity - item.quantity;
          await tx.menuItem.update({
            where: { id: item.menuItemId },
            data: {
              stockQuantity: Math.max(0, newStock),
              // Auto-set to unavailable if stock reaches 0
              available: newStock > 0 ? menuItem.available : false
            }
          });
        }
      }

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
