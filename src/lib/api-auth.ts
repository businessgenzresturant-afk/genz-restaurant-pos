import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth-config";

export async function checkAuth(req?: any) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        session: null
      };
    }

    return { error: null, session };
  } catch (error) {
    console.error("Auth check error:", error);
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
