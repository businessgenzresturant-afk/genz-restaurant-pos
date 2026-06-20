'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        toast.error('Invalid email or password. Please try again.');
        setIsLoading(false);
      } else if (result?.ok) {
        toast.success('Welcome back! 🍽️');
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.error('Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT — Restaurant Image Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-950">
        <img
          src="/images/restaurant-bg.jpg"
          alt="Gen-Z Restaurant"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-orange-900/60 bg-[length:200%_200%] animate-pulse-glow" />

        {/* Branding on image */}
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          {/* Top badge */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-lg bg-zinc-900 border border-zinc-800 flex-shrink-0 relative">
              <img src="/images/Gen-z-logo.jpg" alt="Gen-Z Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white font-black text-lg tracking-tight leading-none">Gen-Z Restaurant</p>
              <p className="text-orange-300 text-xs font-semibold tracking-widest uppercase">Point of Sale</p>
            </div>
          </div>

          {/* Center quote */}
          <div className="space-y-6">
            <div className="w-12 h-1 bg-orange-500 rounded-full" />
            <h1 className="text-4xl font-black text-white leading-tight">
              Great Food.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                Faster Service.
              </span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-sm">
              Manage tables, orders, kitchen & billing — all from one powerful dashboard designed for modern restaurants.
            </p>
          </div>

          {/* Bottom credit */}
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span>© {new Date().getFullYear()} Gen-Z Restaurant. All rights reserved.</span>
            <span className="flex items-center gap-1">
              Built by{' '}
              <a href="https://ragspro.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
                RAGSPRO
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT — Login Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-zinc-950 px-6 py-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-zinc-900 border border-zinc-800 flex-shrink-0 relative">
              <img src="/images/Gen-z-logo.jpg" alt="Gen-Z Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white font-black text-lg leading-none">Gen-Z Restaurant</p>
              <p className="text-orange-400 text-xs font-semibold tracking-widest uppercase">Point of Sale</p>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tight">
              Welcome back 👋
            </h2>
            <p className="text-zinc-400 text-base">
              Sign in to your restaurant dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-zinc-300 block">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="you@restaurant.com"
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-zinc-300 block">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
              />
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base tracking-wide transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="text-center">
            <p className="text-zinc-500 text-sm">
              Don&apos;t have an account?{' '}
              <a
                href="/register"
                className="text-orange-500 font-bold hover:text-orange-400 transition-colors"
              >
                Create one now
              </a>
            </p>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <p className="text-zinc-600 text-xs">
              Powered by{' '}
              <a href="https://ragspro.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 font-bold hover:text-orange-400 transition-colors">
                RAGSPRO
              </a>
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 " />
              <span className="text-zinc-500 text-xs font-medium">System Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}