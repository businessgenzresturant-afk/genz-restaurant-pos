import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { createTableSchema } from '@/lib/validations';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const user = auth.session.user as any;
    
    // Debug logging
    console.log('[/api/tables] Session user:', {
      email: user?.email,
      role: user?.role,
      restaurantId: user?.restaurantId,
      hasRestaurantId: !!user?.restaurantId
    });

    // CRITICAL FIX: If restaurantId is missing from session, user needs to re-login
    if (!user?.restaurantId) {
      console.error('[/api/tables] MISSING RESTAURANT ID - User needs to logout and login again');
      return NextResponse.json({ 
        error: 'Session expired or invalid. Please logout and login again.',
        code: 'MISSING_RESTAURANT_ID'
      }, { status: 401 });
    }

    const tables = await prisma.table.findMany({
      where: { restaurantId: user.restaurantId },
      orderBy: { number: 'asc' },
      include: { restaurant: true }
    });
    
    console.log(`[/api/tables] Found ${tables.length} tables for restaurant ${user.restaurantId}`);
    
    return NextResponse.json(tables, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('[/api/tables] Error fetching tables:', error);
    console.error('[/api/tables] Error stack:', (error as any)?.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: (error as any)?.message 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  // Restrict to ADMIN
  if ((auth.session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Parse capacity/number if they were passed as strings
    const parsedBody = {
      number: typeof body.number === 'string' ? parseInt(body.number) : body.number,
      capacity: typeof body.capacity === 'string' ? parseInt(body.capacity) : body.capacity,
      restaurantId: body.restaurantId
    };

    const validation = createTableSchema.safeParse(parsedBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const table = await prisma.table.create({
      data: {
        number: validation.data.number,
        capacity: validation.data.capacity,
        restaurantId: (auth.session.user as any).restaurantId
      }
    });
    return NextResponse.json(table, { status: 201 });
  } catch (error: any) {
    console.error('Error creating table:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Table number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
