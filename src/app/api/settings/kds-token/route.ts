import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  // Only ADMIN can view KDS token
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
      select: { kdsDisplayToken: true, id: true }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // 🔒 SECURITY FIX: DO NOT auto-generate token
    // Admin must explicitly generate token via button click
    if (!restaurant.kdsDisplayToken) {
      return NextResponse.json({
        token: null,
        message: 'No token generated yet. Click "Generate Token" button to create one.'
      });
    }

    return NextResponse.json({
      token: restaurant.kdsDisplayToken
    });
  } catch (error) {
    console.error('Error fetching KDS token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// NEW: Update token with custom value
export async function PUT(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  // Only ADMIN can update KDS token
  const userRole = (auth.session.user as any).role;
  if (userRole !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { customToken } = await request.json();
    const restaurantId = (auth.session.user as any).restaurantId;

    // Validate custom token
    if (!customToken || typeof customToken !== 'string') {
      return NextResponse.json(
        { error: 'Custom token is required' },
        { status: 400 }
      );
    }

    // Token must be alphanumeric and 6-64 characters
    if (!/^[a-zA-Z0-9_-]{6,64}$/.test(customToken)) {
      return NextResponse.json(
        { error: 'Token must be 6-64 characters (letters, numbers, _, - only)' },
        { status: 400 }
      );
    }

    // Check if token already exists for another restaurant
    const existingToken = await prisma.restaurant.findUnique({
      where: { kdsDisplayToken: customToken },
      select: { id: true }
    });

    if (existingToken && existingToken.id !== restaurantId) {
      return NextResponse.json(
        { error: 'This token is already in use by another restaurant' },
        { status: 409 }
      );
    }

    // Update token
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { kdsDisplayToken: customToken },
      select: { kdsDisplayToken: true }
    });


    return NextResponse.json({
      token: restaurant.kdsDisplayToken,
      message: 'Token updated successfully'
    });
  } catch (error) {
    console.error('Error updating KDS token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
