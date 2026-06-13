import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

// POST force clear table
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const tableId = params.id;

    // Check if table exists
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Force clear table
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: { status: 'AVAILABLE' }
    });

    return NextResponse.json(updatedTable);
  } catch (error) {
    console.error('Error clearing table:', error);
    return NextResponse.json(
      { error: 'Failed to clear table. Please try again.' },
      { status: 500 }
    );
  }
}
