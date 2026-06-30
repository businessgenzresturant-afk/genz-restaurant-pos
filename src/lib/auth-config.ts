import NextAuth, { type NextAuthOptions, type DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';

// Extend the User type with role
interface ExtendedUser extends DefaultUser {
  role?: string;
  restaurantId?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // 🔒 BRUTE FORCE PROTECTION: Rate limit login attempts per email
        try {
        // Rate limit by email (per-user, not per-IP to avoid shared IP issues)
        const mockRequest = {
          headers: new Headers({ 'x-forwarded-for': '127.0.0.1' })
        } as Request;
        
        const rateLimit = checkRateLimit(mockRequest, {
          maxRequests: 10,             // 10 login attempts
          windowMs: 5 * 60 * 1000,    // per 5 minutes
          identifier: `login:${credentials.email.toLowerCase()}`
        });
        
        if (!rateLimit.success) {
          const retryAfterSeconds = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
          console.warn(`🚨 Rate limit exceeded for login: ${credentials.email}`);
          return null;
        }
        } catch (error) {
          console.error('Rate limit check error:', error);
          // Continue with auth if rate limit fails (fail open for availability)
        }
        
        try {
          // Sanity check - log env state on first auth attempt
          if (!process.env.DATABASE_URL) {
            console.error('🚨 CRITICAL: DATABASE_URL is not set!');
            return null;
          }

          const sanitizedEmail = credentials.email.toLowerCase().trim();

          const user = await prisma.user.findFirst({ 
            where: { 
              email: {
                equals: sanitizedEmail,
                mode: 'insensitive'
              } 
            } 
          });

          if (!user) {
            console.warn(`Login attempt for non-existent user: ${sanitizedEmail}`);
            return null;
          }

          if (user.active === false) {
            console.warn(`Login attempt for inactive user: ${sanitizedEmail}`);
            throw new Error('Your account has been deactivated. Please contact the administrator.');
          }

          const isValid = await compare(credentials.password, user.password);
          if (!isValid) {
            console.warn(`Invalid password for user: ${credentials.email}`);
            return null;
          }

          console.log(`✅ Successful login: ${credentials.email} (role: ${user.role})`);
          return { 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            image: user.image,
            role: user.role, 
            restaurantId: user.restaurantId 
          } as ExtendedUser;
        } catch (error: any) { 
          console.error("🚨 Auth DB error:", error?.message || error);
          console.error("Auth error code:", error?.code);
          return null; 
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: { signIn: "/login" },
  callbacks: {
    jwt: ({ token, user, trigger, session }) => {
      // Handle session updates (e.g. from settings page when updating image)
      if (trigger === 'update' && session?.user) {
        if (session.user.image !== undefined) token.picture = session.user.image;
        if (session.user.name !== undefined) token.name = session.user.name;
      }
      
      const extendedUser = user as ExtendedUser | undefined;
      return extendedUser ? { ...token, role: extendedUser.role, id: extendedUser.id, restaurantId: extendedUser.restaurantId, picture: extendedUser.image } : token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, role: token.role as string, id: token.id as string, restaurantId: token.restaurantId as string, image: token.picture as string | null }
    })
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

// Production safety check: Fail fast if NEXTAUTH_SECRET is missing in production
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'CRITICAL SECURITY ERROR: NEXTAUTH_SECRET environment variable is not set in production. ' +
    'Sessions cannot be secured without this secret. Add NEXTAUTH_SECRET to your environment variables immediately.'
  );
}