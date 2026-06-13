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
          let user = await prisma.user.findUnique({ where: { email: credentials.email } });

          // Resilient auto-seed for Demo Accounts
          if (!user && (credentials.email === 'admin@genz.com' || credentials.email === 'staff@genz.com')) {
            const { hash } = await import('bcryptjs');
            const roleToUse = credentials.email === 'admin@genz.com' ? 'ADMIN' : 'STAFF';
            const passwordToUse = credentials.email === 'admin@genz.com' ? 'admin123' : 'staff123';
            
            let restaurant = await prisma.restaurant.findFirst();
            if (!restaurant) {
              restaurant = await prisma.restaurant.create({
                data: { id: '00000000-0000-0000-0000-000000000001', name: 'GenZ Restaurant', address: '123 Main Street' }
              });
            }

            user = await prisma.user.create({
              data: {
                name: roleToUse === 'ADMIN' ? 'Admin User' : 'Staff User',
                email: credentials.email,
                password: await hash(passwordToUse, 10),
                role: roleToUse,
                restaurantId: restaurant.id
              }
            });
          }

          if (!user) return null;
          const isValid = await compare(credentials.password, user.password);
          if (!isValid) return null;
          return { id: user.id, email: user.email, name: user.name, role: user.role, restaurantId: user.restaurantId } as ExtendedUser;
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