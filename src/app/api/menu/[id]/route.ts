import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const menuItem = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name,
        description: body.description,
        price: body.price !== undefined ? parseFloat(body.price) : undefined,
        category: body.category,
        isAvailable: body.isAvailable,
        imageUrl: body.imageUrl
      }
    });
    
    return NextResponse.json(menuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    await prisma.menuItem.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (body.toggleAvailability) {
      const item = await prisma.menuItem.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      
      const updated = await prisma.menuItem.update({
        where: { id: parseInt(id) },
        data: { isAvailable: !item.isAvailable }
      });
      return NextResponse.json(updated);
    }
    
    return NextResponse.json({ error: 'Invalid patch operation' }, { status: 400 });
  } catch (error) {
    console.error('Error patching menu item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
