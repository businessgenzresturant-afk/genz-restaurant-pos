import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";

export async function checkAuth(req?: Request | NextRequest) {
  try {
    // We strictly need to pass `req` to getToken in App Router
    // so it can extract the cookies/headers natively
    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        session: null
      };
    }

    // Return a session-like object from the JWT token
    const session = {
      user: {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        role: token.role as string,
      }
    };

    return { error: null, session };
  } catch (error) {
    console.error("Auth check error:", error);
    return {
      error: NextResponse.json({ error: "Auth check failed" }, { status: 401 }),
      session: null
    };
  }
}

// Soft auth check - returns session if available, but doesn't block the request
export async function softCheckAuth(req?: Request | NextRequest) {
  try {
    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token) return { error: null, session: null };
    
    const session = {
      user: {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        role: token.role as string,
      }
    };
    return { error: null, session };
  } catch (error) {
    console.error("Soft auth check error:", error);
    return { error: null, session: null };
  }
}
