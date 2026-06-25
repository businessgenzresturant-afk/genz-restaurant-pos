import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

// 🔒 SECURITY: This debug endpoint should NEVER be accessible in production
// Force disable in production build
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // P0 FIX: Require ADMIN authentication
  const auth = await checkAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  // Double-check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    // Check database connection
    await prisma.$connect();
    
    // Count users
    const userCount = await prisma.user.count();
    
    // Get all user emails (without passwords)
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        restaurantId: true,
      }
    });

    // Check restaurant
    const restaurant = await prisma.restaurant.findFirst();

    // Check environment variables (safely)
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      hasNextauthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextauthUrl: !!process.env.NEXTAUTH_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
      nodeEnv: process.env.NODE_ENV,
    };

    return NextResponse.json({
      status: 'ok',
      database: {
        connected: true,
        userCount,
        users,
        restaurant: restaurant ? { id: restaurant.id, name: restaurant.name } : null,
      },
      environment: envCheck,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    // 🔒 SECURITY: Don't expose stack traces in production
    return NextResponse.json({
      status: 'error',
      error: 'Internal server error',
    }, { status: 500 });
  }
}
