import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth-config";

/**
 * Authentication helper for API routes
 * 
 * SECURITY NOTES:
 * - All API routes requiring authentication MUST call checkAuth()
 * - Session-based authentication provides sufficient security for this internal POS
 * - CSRF protection: Not implemented as this is an internal, same-origin tool
 *   - NextAuth provides CSRF protection for /api/auth/* routes
 *   - Custom API routes are internal-only (no public exposure)
 *   - Same-origin policy prevents cross-site attacks
 *   - If this becomes a public API, implement CSRF tokens
 * - For production: Ensure NEXTAUTH_SECRET is set (validated in auth-config.ts)
 */

export type UserRole = 'ADMIN' | 'STAFF';

export async function checkAuth(req?: any, requiredRole?: UserRole) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        session: null
      };
    }

    // Role-based authorization check
    if (requiredRole) {
      const userRole = (session.user as any)?.role;
      
      if (requiredRole === 'ADMIN' && userRole !== 'ADMIN') {
        return {
          error: NextResponse.json(
            { 
              error: "Forbidden: Admin access required",
              code: "INSUFFICIENT_PRIVILEGES"
            },
            { status: 403 }
          ),
          session: null
        };
      }
      
      // STAFF can access STAFF-level endpoints (no additional check needed)
      // Both ADMIN and STAFF can access STAFF-level endpoints
    }

    return { error: null, session };
  } catch (error: any) {
    console.error("Auth check error:", error);
    
    // 🔧 FIX: Detect Invalid JWT errors (Invalid Compact JWE, JWEInvalid, etc.)
    // This happens when session token is corrupted or from different NEXTAUTH_SECRET
    const errorMessage = error?.message || error?.name || '';
    const isInvalidToken = errorMessage.includes('JWE') || 
                          errorMessage.includes('JWT') || 
                          errorMessage.includes('Invalid') ||
                          error?.name === 'JWEInvalid' ||
                          error?.name === 'JWTExpired';
    
    if (isInvalidToken) {
      console.error('⚠️ Invalid session token detected - user needs to re-login');
      return {
        error: NextResponse.json({ 
          error: "Session expired or invalid. Please logout and login again.",
          code: "INVALID_SESSION_TOKEN"
        }, { status: 401 }),
        session: null
      };
    }
    
    return {
      error: NextResponse.json({ error: "Auth check failed" }, { status: 401 }),
      session: null
    };
  }
}

export async function softCheckAuth(req?: any) {
  try {
    const session = await getServerSession(authOptions);
    return { error: null, session };
  } catch (error) {
    console.error("Soft auth check error:", error);
    return { error: null, session: null };
  }
}

/**
 * Helper function to check if user has admin role
 */
export function isAdmin(session: any): boolean {
  return (session?.user as any)?.role === 'ADMIN';
}

/**
 * Helper function to check if user has staff role
 */
export function isStaff(session: any): boolean {
  const role = (session?.user as any)?.role;
  return role === 'STAFF' || role === 'ADMIN'; // Admin can do staff tasks
}
