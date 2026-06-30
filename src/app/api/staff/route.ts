import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { hash } from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET all staff members for the restaurant
export async function GET(request: Request) {
  const auth = await checkAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  try {
    const restaurantId = (auth.session.user as any).restaurantId;

    const staff = await prisma.user.findMany({
      where: {
        restaurantId,
        // Exclude the current admin if they are managing their own account
        NOT: {
          id: (auth.session.user as any).id
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

// POST create a new staff member
export async function POST(request: Request) {
  const auth = await checkAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { name, email, password, role } = body;
    const restaurantId = (auth.session.user as any).restaurantId;

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const sanitizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: {
          equals: sanitizedEmail,
          mode: 'insensitive'
        }
      }
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    const newStaff = await prisma.user.create({
      data: {
        name,
        email: sanitizedEmail,
        password: hashedPassword,
        role: role || 'STAFF',
        active: true,
        restaurantId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true
      }
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
