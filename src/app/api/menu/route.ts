import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let whereClause: any = category ? { category } : {};
    
    const menuItems = await prisma.menuItem.findMany({
      where: whereClause,
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { name, category, price, imageUrl, available, restaurantId } = body;

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        category,
        price,
        imageUrl: imageUrl || '',
        available: available !== false,
        restaurantId: restaurantId || 'genz-restaurant'
      }
    });
    return NextResponse.json(menuItem, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
