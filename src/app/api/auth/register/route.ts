import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import * as bcrypt from 'bcryptjs';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  restaurantName: z.string().min(2, "Restaurant name is required").optional(),
  restaurantAddress: z.string().min(5, "Restaurant address is required").optional(),
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, RateLimitPresets.AUTH);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  try {
    const body = await request.json();
    const { name, email, password, restaurantName, restaurantAddress } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if a restaurant already exists
    let restaurant = await prisma.restaurant.findFirst();

    // If no restaurant exists, create one with the provided details or defaults
    if (!restaurant) {
      restaurant = await prisma.restaurant.create({
        data: {
          name: restaurantName || 'GenZ Restaurant',
          address: restaurantAddress || 'L-97, Gali No 7, Near Labour Chowk, Mahipalpur, 110037',
        },
      });
    }

    // First user becomes ADMIN, subsequent users become STAFF
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'STAFF';

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        restaurantId: restaurant.id,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ 
      ...userWithoutPassword,
      message: role === 'ADMIN' ? 'Admin account created successfully!' : 'Staff account created successfully!'
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as any;
      return NextResponse.json(
        { error: zodError.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}