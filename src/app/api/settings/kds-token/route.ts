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
    
    let restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { kdsDisplayToken: true, id: true }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // AUTO-GENERATE token if it doesn't exist
    if (!restaurant.kdsDisplayToken) {
      console.log('🔐 No KDS token found, auto-generating...');
      const newToken = crypto.randomBytes(32).toString('hex');
      
      restaurant = await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { kdsDisplayToken: newToken },
        select: { kdsDisplayToken: true, id: true }
      });
      
      console.log('✅ KDS Display Token auto-generated for restaurant:', restaurantId);
      console.log(`   URL: https://pos.gen-z.online/kds-display/${newToken}`);
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
