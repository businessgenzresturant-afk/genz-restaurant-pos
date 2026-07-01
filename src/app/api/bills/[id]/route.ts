import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { updateBillSchema } from '@/lib/validations';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';
import { sanitizeCustomerInput } from '@/lib/sanitize';
import { LOYALTY } from '@/lib/constants';
import { calculatePointsEarned, calculatePointsValue } from '@/lib/billUtils';

// GET single bill by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const restaurantId = (auth.session.user as any).restaurantId;
    const bill = await prisma.bill.findFirst({
      where: {
        id,
        order: { items: { some: { menuItem: { restaurantId } } } }
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                menuItem: { select: { id: true, name: true, category: true, price: true } }
              }
            }
          }
        },
        table: { select: { id: true, number: true } }
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
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentMethod, customerPhone, customerName, discountPercent, pointsToRedeem, gstApplied, serviceChargeApplied, serviceChargeAmount: serviceChargeAmountRaw } = body;

    // 🔒 BUG-01 FIX: Validate and normalise service charge from request body
    const serviceChargeAmountValue = typeof serviceChargeAmountRaw === 'number' && serviceChargeAmountRaw > 0 ? serviceChargeAmountRaw : 0;
    const serviceChargeAppliedValue = serviceChargeApplied === true && serviceChargeAmountValue > 0;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // 🔒 SECURITY: Sanitize customer inputs to prevent injection attacks
    const sanitizedCustomerName = customerName ? sanitizeCustomerInput(customerName) : null;
    const sanitizedCustomerPhone = customerPhone ? sanitizeCustomerInput(customerPhone) : null;

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
        id,
        order: { items: { some: { menuItem: { restaurantId } } } }
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

    // Update bill and handle customer loyalty in a transaction if payment is confirmed
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let customerId = null;
      let pointsEarned = 0;
      let pointsRedeemed = 0;
      let discountAmount = 0;
      
      // Apply GST based on toggle (default true for backward compatibility)
      const includeGst = gstApplied !== false; // Default to true if not specified
      // 🔒 BUG-01 FIX: Include service charge in base amount (matches frontend calculateFinalTotal)
      // Order of operations: subtotal + serviceCharge + GST − discount − points
      const baseAmount = existingBill.subtotal + serviceChargeAmountValue + (includeGst ? existingBill.tax : 0);
      let finalTotal = baseAmount;

      // Apply discount if provided (discount on subtotal only, service charge and tax excluded from discount base)
      if (discountPercent && discountPercent > 0) {
        discountAmount = (existingBill.subtotal * discountPercent) / 100;
        finalTotal -= discountAmount;
      }

      // Handle customer and points if phone provided and bill is being paid
      if (status === 'PAID' && sanitizedCustomerPhone) {
        // Find or create customer
        let customer = await tx.customer.findUnique({
          where: { phone: sanitizedCustomerPhone }
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              phone: sanitizedCustomerPhone,
              name: sanitizedCustomerName || existingBill.order.customerName || null
            }
          });
        } else if (sanitizedCustomerName && !customer.name) {
          // Update customer name if provided and not already set
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: { name: sanitizedCustomerName }
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
          finalTotal -= pointsRedeemed * LOYALTY.REDEMPTION_VALUE_PER_POINT;

          // Create redemption transaction
          await tx.pointTransaction.create({
            data: {
              customerId: customer.id,
              billId: id,
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

        // Calculate points earned on final amount using centralized utility
        pointsEarned = calculatePointsEarned(finalTotal);

        // Create earning transaction
        if (pointsEarned > 0) {
          await tx.pointTransaction.create({
            data: {
              customerId: customer.id,
              billId: id,
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

      // 🔒 FIX: Always update the order's customerName if provided, even if no phone is given
      if (sanitizedCustomerName) {
        await tx.order.update({
          where: { id: existingBill.orderId },
          data: { customerName: sanitizedCustomerName }
        });
      }

      // Update the bill
      // 🔒 BUG-01 FIX: Persist serviceChargeApplied and serviceChargeAmount to DB
      const updatedBill = await tx.bill.update({
        where: { id },
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
          gstApplied: includeGst,
          serviceChargeApplied: serviceChargeAppliedValue,
          serviceChargeAmount: serviceChargeAmountValue
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
        // Update the primary order (the one the bill is linked to)
        await tx.order.update({
          where: { id: existingBill.orderId },
          data: { 
            paymentStatus: 'PAID',
            status: 'COMPLETED' // Order is now fully complete
          }
        });

        // For multi-order tables, also mark ALL other orders on this
        // table as PAID and COMPLETED.
        if (existingBill.order.tableId) {
          await tx.order.updateMany({
            where: {
              tableId: existingBill.order.tableId,
              status: { in: ['SERVED', 'COMPLETED'] },
              paymentStatus: 'PENDING',
              id: { not: existingBill.orderId } // Already updated above
            },
            data: { 
              paymentStatus: 'PAID',
              status: 'COMPLETED'
            }
          });
        }

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
    // 🔒 BUG-08 FIX: Only pass known user-facing error messages to the client.
    // Unknown errors get a generic message so internal DB/Prisma details aren't leaked.
    const USER_FACING_ERRORS = [
      'Insufficient points balance',
      'Cannot redeem more points than bill total'
    ];
    const isUserFacingError = USER_FACING_ERRORS.includes(error.message);
    
    console.error('[Bill Update] Error updating bill:', {
      billId: 'redacted', // don't log bill ID in error, already in context
      message: error.message,
      code: error.code
    });
    return NextResponse.json(
      { error: isUserFacingError ? error.message : 'Failed to update bill. Please try again.' },
      { status: isUserFacingError ? 400 : 500 }
    );
  }
}