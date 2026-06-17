import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

// This endpoint resets admin & staff passwords to known values
// Protected by a secret key
export async function POST(request: Request) {
  try {
    const { secret } = await request.json();
    
    if (secret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminHash = await hash('admin123', 12);
    const staffHash = await hash('staff123', 12);

    // Reset admin password
    const admin = await prisma.user.upsert({
      where: { email: 'admin@genz.com' },
      update: { password: adminHash, role: 'ADMIN', name: 'Admin User' },
      create: {
        email: 'admin@genz.com',
        password: adminHash,
        name: 'Admin User',
        role: 'ADMIN',
        restaurantId: (await prisma.restaurant.findFirst())?.id || undefined,
      },
    });

    // Reset staff password
    const staff = await prisma.user.upsert({
      where: { email: 'staff@genz.com' },
      update: { password: staffHash, role: 'STAFF', name: 'Staff User' },
      create: {
        email: 'staff@genz.com',
        password: staffHash,
        name: 'Staff User',
        role: 'STAFF',
        restaurantId: (await prisma.restaurant.findFirst())?.id || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Passwords reset successfully',
      admin: admin.email,
      staff: staff.email,
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
