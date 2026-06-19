import NextAuth, { type NextAuthOptions, type DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from '@/lib/prisma';

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
};

// Production safety check: Fail fast if NEXTAUTH_SECRET is missing in production
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'CRITICAL SECURITY ERROR: NEXTAUTH_SECRET environment variable is not set in production. ' +
    'Sessions cannot be secured without this secret. Add NEXTAUTH_SECRET to your environment variables immediately.'
  );
}