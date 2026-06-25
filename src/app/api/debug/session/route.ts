import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { checkAuth } from '@/lib/api-auth';

/**
 * 🔒 SECURITY: DEBUG ENDPOINT - ADMIN ONLY
 * Helps diagnose why dashboard shows "No tables found" despite tables existing
 */
export async function GET(request: Request) {
  // P0 FIX: Require ADMIN authentication
  const auth = await checkAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  // Double-check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({
        error: 'No session found',
        hint: 'User is not logged in or session expired',
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      session: {
        user: {
          email: session.user?.email,
          name: session.user?.name,
          role: (session.user as any)?.role,
          restaurantId: (session.user as any)?.restaurantId,
        },
        expires: session.expires,
      },
      hint: 'This is what the API sees when you make requests',
    });

  } catch (error) {
    console.error('[DEBUG-SESSION] Error:', error);
    // 🔒 SECURITY: Don't expose details in production
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
