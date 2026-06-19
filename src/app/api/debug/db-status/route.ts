import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
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
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
