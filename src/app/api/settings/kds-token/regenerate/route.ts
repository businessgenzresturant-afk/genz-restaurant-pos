import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  // Only ADMIN can regenerate KDS token
  const userRole = (auth.session.user as any).role;
  if (userRole !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const restaurantId = (auth.session.user as any).restaurantId;
    
    // Generate new secure token (32 bytes = 64 hex characters)
    const newToken = crypto.randomBytes(32).toString('hex');
    
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { kdsDisplayToken: newToken },
      select: { kdsDisplayToken: true }
    });


    return NextResponse.json({
      token: restaurant.kdsDisplayToken,
      message: 'Token regenerated successfully'
    });
  } catch (error) {
    console.error('Error regenerating KDS token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
