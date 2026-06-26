import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// PATCH - Cancel an order item (set status to CANCELLED)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id, itemId } = await params;
    const body = await request.json();
    const { status, cancelReason } = body;

    if (status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Only CANCELLED status is allowed' },
        { status: 400 }
      );
    }

    // 🔒 SECURITY: Require cancel reason with length limit
    if (!cancelReason || cancelReason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    if (cancelReason.length > 500) {
      return NextResponse.json(
        { error: 'Cancellation reason too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // Get user ID from authenticated session
    const userId = (auth.session.user as any).id;

    // Verify the order item exists and belongs to an order in the user's restaurant
    const restaurantId = (auth.session.user as any).restaurantId;
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        orderId: id,
        order: {
          OR: [
            { table: { restaurantId } },
            { items: { some: { menuItem: { restaurantId } } } }
          ]
        }
      },
      include: {
        order: {
          include: {
            table: true
          }
        }
      }
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    const order = orderItem.order;

    // 🔧 CRITICAL FIX: Don't allow cancelling items after ANY bill generated (not just PAID)
    const bill = await prisma.bill.findFirst({
      where: { orderId: id }  // Any bill, regardless of status
    });

    if (bill) {
      return NextResponse.json(
        { error: `Cannot cancel items after bill generated. Bill ID: ${bill.id}` },
        { status: 400 }
      );
    }

    // Update the order item status and recalculate order total
    const result = await prisma.$transaction(async (tx) => {
      // Get the order item details before cancelling
      const itemToCancel = await tx.orderItem.findUnique({
        where: { id: itemId },
        include: {
          menuItem: true
        }
      });

      if (!itemToCancel) {
        throw new Error('Order item not found');
      }

      // Cancel the item with reason and user ID
      const updatedItem = await tx.orderItem.update({
        where: { id: itemId },
        data: { 
          status: 'CANCELLED',
          cancelReason: cancelReason.trim(),
          cancelledByUserId: userId
        }
      });

      // 🔧 CRITICAL FIX: Restore stock when item is cancelled
      if (itemToCancel.menuItem && itemToCancel.menuItem.stockQuantity !== null && itemToCancel.menuItem.stockQuantity !== undefined) {
        const restoredStock = itemToCancel.menuItem.stockQuantity + itemToCancel.quantity;
        await tx.menuItem.update({
          where: { id: itemToCancel.menuItemId },
          data: {
            stockQuantity: restoredStock,
            available: true // Make available again if stock restored
          }
        });
        console.log(`✅ Stock restored for ${itemToCancel.menuItem.name}: ${itemToCancel.menuItem.stockQuantity} → ${restoredStock}`);
      }

      // Recalculate order total (sum of ACTIVE items only)
      const activeItems = await tx.orderItem.findMany({
        where: {
          orderId: id,
          status: 'ACTIVE'
        }
      });

      const newTotal = activeItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Update order total
      await tx.order.update({
        where: { id },
        data: { totalAmount: newTotal }
      });

      // 🔧 UX FIX: Auto-clear table if all items are cancelled
      if (activeItems.length === 0 && order.tableId) {
        // Check if table has any other active orders
        const otherActiveOrders = await tx.order.count({
          where: {
            tableId: order.tableId,
            id: { not: id },
            status: { in: ['PENDING', 'PREPARING', 'READY', 'SERVED'] }
          }
        });

        if (otherActiveOrders === 0) {
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: 'AVAILABLE' }
          });
          console.log(`✅ Table auto-cleared: All items cancelled, no other orders`);
        }
      }

      return updatedItem;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error cancelling order item:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order item' },
      { status: 500 }
    );
  }
}
