import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import * as bcrypt from 'bcryptjs';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, RateLimitPresets.AUTH);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  try {
    const body = await request.json();
    const { name, email, password } = registerSchema.parse(body);

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

    // Get or create default restaurant
    let restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      restaurant = await prisma.restaurant.create({
        data: { 
          id: '00000000-0000-0000-0000-000000000001', 
          name: 'GenZ Restaurant', 
          address: '123 Main Street' 
        }
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        restaurantId: restaurant.id,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as any;
      return NextResponse.json(
        { error: zodError.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}