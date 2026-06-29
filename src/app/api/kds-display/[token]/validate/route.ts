import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';

// Force dynamic route
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  // 🔒 SECURITY: Rate limit token validation to prevent brute force attacks
  const rateLimit = checkRateLimit(request, {
    maxRequests: 10,           // 10 validation attempts
    windowMs: 60 * 1000,       // per minute
    identifier: `kds-validate:${request.headers.get('x-forwarded-for') || 'unknown'}`
  });
  
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  try {
    // Await params in Next.js 15
    const { token } = await params;
    
    
    if (!token) {
      console.error('❌ Token validation failed: No token provided');
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find restaurant by token
    const restaurant = await prisma.restaurant.findUnique({
      where: { kdsDisplayToken: token },
      select: { id: true, name: true }
    });

    if (!restaurant) {
      console.error('❌ Token validation failed: Restaurant not found for token:', token.substring(0, 10) + '...');
      
      // DEBUG: Check if ANY restaurants exist with tokens
      const allRestaurants = await prisma.restaurant.findMany({
        select: { id: true, name: true, kdsDisplayToken: true }
      });
      
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      );
    }


    return NextResponse.json({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name
    });
  } catch (error) {
    console.error('❌ Token validation error:', error);
    // 🔒 SECURITY: Don't expose error details
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
