'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@genz.com', password: 'admin123' },
  { role: 'Staff', email: 'staff@genz.com', password: 'staff123' },
];

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const fillDemoCredentials = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    onSubmit({ email, password }); // Auto-submit when clicking demo accounts
  };

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        ...data,
      });

      if (result?.error) {
        toast.error('Invalid credentials. Please try again.');
      } else {
        toast.success('Welcome back!');
        window.location.href = '/';
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <div className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-orange-500 bg-gradient-to-r from-orange-500 to-amber-500 mb-4 shadow-lg shadow-orange-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 36v-3m-3 3h.01M9 17h.01M9 21h.01M15 17h.01M15 21h.01M5.01 17h.01M5.01 21h.01" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Gen-Z Restaurant POS</h2>
          <p className="text-sm text-gray-600">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block font-medium text-gray-700">
              Email Address
            </label>
            <Input
              id="email"
              {...register('email')}
              className={`${errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'} w-full`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block font-medium text-gray-700">
              Password
            </label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              className={`${errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'} w-full`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-2.5"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-orange-600 hover:text-orange-500">
              Create one
            </Link>
          </p>
        </div>

        {/* Demo Accounts Section */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Demo Accounts (Click to auto-login):
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={isLoading}
                onClick={() => fillDemoCredentials(account.email, account.password)}
                className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 transition-all duration-200 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-orange-900">
                      {account.role}
                    </p>
                    <p className="text-xs text-gray-600 group-hover:text-orange-600">{account.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-gray-500 group-hover:text-orange-500 bg-white px-2 py-1 rounded">
                      {account.password}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Powered by{' '}
            <span className="font-semibold text-orange-500">
              RagsPro
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
}