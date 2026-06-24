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
          // Create a mock request object for rate limiting
          const mockRequest = {
            headers: new Headers({
              'x-forwarded-for': '127.0.0.1', // Will be replaced by actual IP in production
            })
          } as Request;
          
          const rateLimit = checkRateLimit(mockRequest, {
            maxRequests: 5,              // 5 login attempts
            windowMs: 15 * 60 * 1000,    // per 15 minutes
            identifier: `login:${credentials.email.toLowerCase()}`
          });
          
          if (!rateLimit.success) {
            const retryAfterSeconds = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
            console.warn(`🚨 Rate limit exceeded for login: ${credentials.email}`);
            console.warn(`   Retry after: ${retryAfterSeconds}s`);
            return null; // Deny login
          }
        } catch (error) {
          console.error('Rate limit check error:', error);
          // Continue with auth if rate limit fails (fail open for availability)
        }
        
        try {
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });

          if (!user) {
            console.warn(`Login attempt for non-existent user: ${credentials.email}`);
            return null;
          }

          const isValid = await compare(credentials.password, user.password);
          if (!isValid) {
            console.warn(`Invalid password for user: ${credentials.email}`);
            return null;
          }

          console.log(`✅ Successful login: ${credentials.email}`);
          return { 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            role: user.role, 
            restaurantId: user.restaurantId 
          } as ExtendedUser;
        } catch (error: any) { 
          console.error("Auth error:", error?.message || error);
          console.error("Auth error stack:", error?.stack);
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
    jwt: ({ token, user }) => {
      const extendedUser = user as ExtendedUser | undefined;
      return extendedUser ? { ...token, role: extendedUser.role, id: extendedUser.id, restaurantId: extendedUser.restaurantId } : token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, role: token.role as string, id: token.id as string, restaurantId: token.restaurantId as string }
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