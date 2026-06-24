import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CSRF Protection Middleware
 * 
 * Validates that state-changing requests (POST, PATCH, DELETE, PUT) 
 * come from the same origin to prevent Cross-Site Request Forgery attacks.
 * 
 * Also handles KDS display token validation and redirect server-side
 * for compatibility with old TV browsers that struggle with JavaScript.
 */
export async function middleware(request: NextRequest) {
  // Handle KDS display token validation SERVER-SIDE
  const kdsDisplayMatch = request.nextUrl.pathname.match(/^\/kds-display\/([^\/]+)$/);
  
  if (kdsDisplayMatch && !request.nextUrl.searchParams.has('rid')) {
    const token = kdsDisplayMatch[1];
    console.log('🔍 Server-side KDS token validation for:', token.substring(0, 10));
    
    try {
      // Validate token against database
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const restaurant = await prisma.restaurant.findUnique({
        where: { kdsDisplayToken: token },
        select: { id: true, name: true }
      });
      
      await prisma.$disconnect();
      
      if (restaurant) {
        console.log('✅ Server-side validation success, redirecting with rid');
        // Redirect to same URL with restaurant ID
        const url = request.nextUrl.clone();
        url.searchParams.set('rid', restaurant.id);
        return NextResponse.redirect(url);
      } else {
        console.error('❌ Server-side validation failed: Invalid token');
      }
    } catch (error) {
      console.error('❌ Server-side validation error:', error);
    }
  }
  
  // Only check CSRF for state-changing methods
  if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const referer = request.headers.get('referer');
    
    // Allow requests from same origin
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`,
      process.env.NEXT_PUBLIC_APP_URL,
      'https://pos.gen-z.online',
      'http://localhost:3000' // Allow local development
    ].filter(Boolean);
    
    // Check origin header (modern browsers)
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed || ''))) {
      console.warn(`🚨 CSRF blocked: origin=${origin}, host=${host}`);
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }
    
    // Check referer header (fallback for older browsers)
    if (!origin && referer && !allowedOrigins.some(allowed => referer.startsWith(allowed || ''))) {
      console.warn(`🚨 CSRF blocked: referer=${referer}, host=${host}`);
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/kds-display/:token'], // Apply to API routes and KDS display
};
