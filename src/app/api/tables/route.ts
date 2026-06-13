import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const tables = await prisma.table.findMany({
      orderBy: { number: 'asc' },
      include: { restaurant: true }
    });
    return NextResponse.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { number, capacity, restaurantId } = body;

    const table = await prisma.table.create({
      data: {
        number: parseInt(number),
        capacity: parseInt(capacity),
        restaurantId: restaurantId || 'genz-restaurant'
      }
    });
    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
