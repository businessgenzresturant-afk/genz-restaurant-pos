import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { updateBillSchema } from '@/lib/validations';

// GET single bill by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const restaurantId = (auth.session.user as any).restaurantId;
    const bill = await prisma.bill.findFirst({
      where: {
        id: params.id,
        OR: [
          { table: { restaurantId } },
          { order: { items: { some: { menuItem: { restaurantId } } } } }
        ]
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                menuItem: true
              }
            }
          }
        },
        table: true
      }
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update bill status (mark as paid)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { status, paymentMethod, customerPhone, customerName, discountPercent, pointsToRedeem, gstApplied } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // RBAC: Role-based discount and points validation
    const userRole = (auth.session.user as any).role;
    const hasDiscount = discountPercent && discountPercent > 0;
    const hasPoints = pointsToRedeem && pointsToRedeem > 0;
    
    if (userRole === 'STAFF') {
      // STAFF: Allow discount up to 15%, block points completely
      if (hasPoints) {
        return NextResponse.json(
          { error: 'Forbidden: Only ADMIN can redeem points' },
          { status: 403 }
        );
      }
      if (hasDiscount && discountPercent > 15) {
        return NextResponse.json(
          { error: 'Discounts above 15% require admin approval' },
          { status: 403 }
        );
      }
    } else if (userRole !== 'ADMIN') {
      // Non-ADMIN, non-STAFF: block everything
      if (hasDiscount || hasPoints) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }
    }
    // ADMIN: no restrictions

    // Get the bill with order and table info and verify restaurant ownership
    const restaurantId = (auth.session.user as any).restaurantId;
    const existingBill = await prisma.bill.findFirst({
      where: {
        id: params.id,
        OR: [
          { table: { restaurantId } },
          { order: { items: { some: { menuItem: { restaurantId } } } } }
        ]
      },
      include: {
        order: {
          include: {
            table: true
          }
        }
      }
    });

    if (!existingBill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Constants for loyalty program (documented for easy adjustment)
    const POINTS_EARNING_RATE = 10; // 10 points per ₹100 spent
    const POINTS_REDEMPTION_VALUE = 1; // 1 point = ₹1

    // Update bill and handle customer loyalty in a transaction if payment is confirmed
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let customerId = null;
      let pointsEarned = 0;
      let pointsRedeemed = 0;
      let discountAmount = 0;
      
      // Apply GST based on toggle (default true for backward compatibility)
      const includeGst = gstApplied !== false; // Default to true if not specified
      const baseAmount = existingBill.subtotal + (includeGst ? existingBill.tax : 0);
      let finalTotal = baseAmount;

      // Apply discount if provided (discount on subtotal only, tax remains)
      if (discountPercent && discountPercent > 0) {
        discountAmount = (existingBill.subtotal * discountPercent) / 100;
        finalTotal -= discountAmount;
      }

      // Handle customer and points if phone provided and bill is being paid
      if (status === 'PAID' && customerPhone) {
        // Find or create customer
        let customer = await tx.customer.findUnique({
          where: { phone: customerPhone }
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              phone: customerPhone,
              name: customerName || existingBill.order.customerName || null
            }
          });
        } else if (customerName && !customer.name) {
          // Update customer name if provided and not already set
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: { name: customerName }
          });
        }

        customerId = customer.id;

        // Redeem points if requested (already verified ADMIN above)
        if (pointsToRedeem && pointsToRedeem > 0) {
          if (pointsToRedeem > customer.pointsBalance) {
            throw new Error('Insufficient points balance');
          }
          if (pointsToRedeem > finalTotal) {
            throw new Error('Cannot redeem more points than bill total');
          }

          pointsRedeemed = pointsToRedeem;
          finalTotal -= pointsRedeemed * POINTS_REDEMPTION_VALUE;

          // Create redemption transaction
          await tx.pointTransaction.create({
            data: {
              customerId: customer.id,
              billId: params.id,
              points: -pointsRedeemed,
              type: 'REDEEMED'
            }
          });

          // Update customer points balance
          await tx.customer.update({
            where: { id: customer.id },
            data: {
              pointsBalance: { decrement: pointsRedeemed }
            }
          });
        }

        // Calculate points earned on final amount
        pointsEarned = Math.floor((finalTotal / 100) * POINTS_EARNING_RATE);

        // Create earning transaction
        if (pointsEarned > 0) {
          await tx.pointTransaction.create({
            data: {
              customerId: customer.id,
              billId: params.id,
              points: pointsEarned,
              type: 'EARNED'
            }
          });
        }

        // Update customer totals
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            totalVisits: { increment: 1 },
            totalSpend: { increment: finalTotal },
            pointsBalance: { increment: pointsEarned }
          }
        });
      }

      // Update the bill
      const updatedBill = await tx.bill.update({
        where: { id: params.id },
        data: {
          status,
          paymentMethod: paymentMethod || null,
          cashAmount: body.cashAmount || 0,
          onlineAmount: body.onlineAmount || 0,
          paidAt: status === 'PAID' ? new Date() : null,
          customerId,
          discount: discountAmount,
          total: finalTotal,
          pointsEarned,
          pointsRedeemed,
          gstApplied: includeGst
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
          customer: true
        }
      });

      // If bill is paid, update order payment status and free the table
      if (status === 'PAID') {
        await tx.order.update({
          where: { id: existingBill.orderId },
          data: { paymentStatus: 'PAID' }
        });

        // Free the table if order was linked to a table
        if (existingBill.order.tableId) {
          await tx.table.update({
            where: { id: existingBill.order.tableId },
            data: { status: 'AVAILABLE' }
          });
        }
      }

      return updatedBill;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating bill:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update bill. Please try again.' },
      { status: 500 }
    );
  }
}