import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Allow access to auth routes, api routes, and static files without authentication
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated (including homepage)
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login page to dashboard
  if (pathname === '/login' && token) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // P1 FIX: Role-based page protection - ADMIN-only routes
  const userRole = (token as any).role;
  const adminOnlyRoutes = ['/reports', '/settings'];
  
  if (adminOnlyRoutes.some(route => pathname.startsWith(route)) && userRole !== 'ADMIN') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    // Add a query param to show error message
    url.searchParams.set('error', 'admin_required');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};