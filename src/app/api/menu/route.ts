import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { createMenuItemSchema } from '@/lib/validations';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let whereClause: any = category ? { category, restaurantId: (auth.session.user as any).restaurantId } : { restaurantId: (auth.session.user as any).restaurantId };
    
    const menuItems = await prisma.menuItem.findMany({
      where: whereClause,
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
    
    return NextResponse.json(menuItems, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    
    const validation = createMenuItemSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name: validation.data.name,
        category: validation.data.category,
        price: validation.data.price,
        priceHalf: validation.data.priceHalf || null,
        hasHalfFullOption: validation.data.hasHalfFullOption || false,
        dietType: validation.data.dietType || 'VEG',
        stockQuantity: validation.data.stockQuantity || null,
        imageUrl: validation.data.imageUrl || '',
        available: validation.data.available !== false,
        restaurantId: (auth.session.user as any).restaurantId
      }
    });
    return NextResponse.json(menuItem, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
