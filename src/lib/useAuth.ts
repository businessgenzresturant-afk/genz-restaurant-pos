'use client';

import { useSession } from 'next-auth/react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'WAITER' | 'CHEF' | 'STAFF';
  restaurantId: string;
}

export function useAuth() {
  const session = useSession();
  
  const user = session?.data?.user as AuthUser | undefined;
  
  // Strict check for admin features
  const isAdmin = user?.role === 'ADMIN' || user?.email === 'business.genzresturant@gmail.com';
  
  const isManager = user?.role === 'MANAGER';
  const isWaiter = user?.role === 'WAITER';
  const isChef = user?.role === 'CHEF';
  const isStaff = user?.role === 'STAFF';
  
  const isLoading = session?.status === 'loading';
  const isAuthenticated = session?.status === 'authenticated';

  return {
    user,
    isAdmin,
    isManager,
    isWaiter,
    isChef,
    isStaff,
    isLoading,
    isAuthenticated,
    session: session?.data,
    status: session?.status
  };
}
