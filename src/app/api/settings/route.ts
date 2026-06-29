import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  // Only ADMIN can view settings
  const userRole = (auth.session.user as any).role;
  if (userRole !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const restaurantId = (auth.session.user as any).restaurantId;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        gstNumber: true,
        taxRate: true,
        currency: true,
        timeZone: true,
        serviceChargeRate: true,
        enableDelivery: true,
        minOrderAmount: true,
        deliveryCharge: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  // Only ADMIN can update settings
  const userRole = (auth.session.user as any).role;
  if (userRole !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const restaurantId = (auth.session.user as any).restaurantId;
    const body = await request.json();

    const {
      name,
      address,
      phone,
      gstNumber,
      taxRate,
      currency,
      timeZone,
      serviceChargeRate,
      enableDelivery,
      minOrderAmount,
      deliveryCharge,
    } = body;

    // Validate required fields
    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (address !== undefined) updateData.address = String(address).trim();
    if (phone !== undefined) updateData.phone = String(phone).trim() || null;
    if (gstNumber !== undefined) updateData.gstNumber = String(gstNumber).trim() || null;
    if (taxRate !== undefined) updateData.taxRate = parseFloat(taxRate) || 0;
    if (currency !== undefined) updateData.currency = String(currency).trim();
    if (timeZone !== undefined) updateData.timeZone = String(timeZone).trim();
    if (serviceChargeRate !== undefined) updateData.serviceChargeRate = parseFloat(serviceChargeRate) || 0;
    if (enableDelivery !== undefined) updateData.enableDelivery = Boolean(enableDelivery);
    if (minOrderAmount !== undefined) updateData.minOrderAmount = parseFloat(minOrderAmount) || 0;
    if (deliveryCharge !== undefined) updateData.deliveryCharge = parseFloat(deliveryCharge) || 0;

    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        gstNumber: true,
        taxRate: true,
        currency: true,
        timeZone: true,
        serviceChargeRate: true,
        enableDelivery: true,
        minOrderAmount: true,
        deliveryCharge: true,
      },
    });

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
