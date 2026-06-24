import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CSRF Protection Middleware
 * 
 * Validates that state-changing requests (POST, PATCH, DELETE, PUT) 
 * come from the same origin to prevent Cross-Site Request Forgery attacks.
 */
export function middleware(request: NextRequest) {
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
  matcher: '/api/:path*', // Apply to all API routes
};
