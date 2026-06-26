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
  // 🔒 REGISTRATION DISABLED FOR PRODUCTION
  // Only existing users can login. New staff must be added by ADMIN from dashboard.
  return NextResponse.json(
    { 
      error: 'Public registration is disabled. Please contact your restaurant administrator to create an account.',
      code: 'REGISTRATION_DISABLED'
    },
    { status: 403 }
  );

  /* REGISTRATION CODE DISABLED - Uncomment if needed for multi-restaurant SaaS
  
  // More relaxed rate limit for registration (10 requests per minute)
  const rateLimit = checkRateLimit(request, { maxRequests: 10, windowMs: 60 * 1000 });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  try {
    const body = await request.json();
    console.log('[Registration] Request received:', { email: body.email, name: body.name });
    
    const { name, email, password, restaurantName, restaurantAddress } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('[Registration] User already exists:', email);
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    console.log('[Registration] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔒 CRITICAL SECURITY FIX: Each registration creates a NEW restaurant
    // This ensures proper multi-tenant isolation - no data leakage between restaurants
    console.log('[Registration] Creating new restaurant for user...');
    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantName || `${name}'s Restaurant`,
        address: restaurantAddress || 'Update your restaurant address in settings',
      },
    });
    console.log('[Registration] Restaurant created:', restaurant.id);

    // 🔒 SECURITY: First user of new restaurant becomes ADMIN automatically
    // This user has full control over their restaurant
    const role = 'ADMIN';
    console.log('[Registration] Creating ADMIN user for new restaurant...');

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

    console.log('[Registration] User created successfully:', user.id, user.email, user.role);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ 
      ...userWithoutPassword,
      message: 'Restaurant and admin account created successfully! You can now add staff members from settings.'
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as any;
      console.error('[Registration] Validation error:', zodError.errors);
      return NextResponse.json(
        { error: zodError.errors[0].message },
        { status: 400 }
      );
    }

    console.error('[Registration] Internal error:', error);
    console.error('[Registration] Error details:', {
      message: (error as any)?.message,
      code: (error as any)?.code,
      meta: (error as any)?.meta,
    });
    
    return NextResponse.json(
      { error: "Internal server error", details: (error as any)?.message || "Unknown error" },
      { status: 500 }
    );
  }
  */
}