import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  // P0 FIX: Protect env-check endpoint - only accessible to authenticated ADMIN users
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  // Restrict to ADMIN only
  if ((auth.session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  return NextResponse.json({
    DATABASE_URL_exists: !!process.env.DATABASE_URL,
    DATABASE_URL_starts_with: process.env.DATABASE_URL?.substring(0, 20) || 'EMPTY',
    DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
    NEXTAUTH_SECRET_exists: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
}
