import NextAuth, { type NextAuthOptions, type DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from '@/lib/prisma';

// Extend the User type with role
interface ExtendedUser extends DefaultUser {
  role?: string;
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
          // Auto-seed admin user if database is completely empty
          const userCount = await prisma.user.count();
          if (userCount === 0) {
            const { hash } = await import('bcryptjs');
            const adminPassword = await hash('GenZ2026!', 12);
            const managerPassword = await hash('Manager2026!', 12);
            const cashierPassword = await hash('Cashier2026!', 12);
            
            await prisma.user.createMany({
              data: [
                { name: 'Admin User', email: 'admin@genzrestaurant.com', password: adminPassword, role: 'ADMIN' },
                { name: 'Restaurant Manager', email: 'manager@genzrestaurant.com', password: managerPassword, role: 'STAFF' },
                { name: 'Cashier Staff', email: 'cashier@genzrestaurant.com', password: cashierPassword, role: 'STAFF' },
              ]
            });
            // Auto-create a default restaurant as well so they don't crash elsewhere
            await prisma.restaurant.create({
              data: { id: 'genz-restaurant', name: 'Gen-Z Restaurant', address: 'Mahipalpur, New Delhi - 110037' }
            });
          }

          const user = await prisma.user.findUnique({ where: { email: credentials.email } });
          if (!user) return null;
          const isValid = await compare(credentials.password, user.password);
          if (!isValid) return null;
          return { id: user.id, email: user.email, name: user.name, role: user.role } as ExtendedUser;
        } catch (error) { 
          console.error("Auth error:", error);
          return null; 
        }
      }
    })
  ],
  pages: { signIn: "/login" },
  callbacks: {
    jwt: ({ token, user }) => {
      const extendedUser = user as ExtendedUser | undefined;
      return extendedUser ? { ...token, role: extendedUser.role, id: extendedUser.id } : token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, role: token.role as string, id: token.id as string }
    })
  },
  secret: process.env.NEXTAUTH_SECRET,
};