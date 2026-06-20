/**
 * Environment Variable Configuration
 *
 * Provides typed access to environment variables with sensible defaults
 * Required env vars should be set in deployment platform (Vercel)
 */

// Build configuration with defaults for production builds
const getEnv = () => ({
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://build:placeholder@localhost:5432/build_db',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET_FALLBACK || 'min-32-char-secret-for-build-only',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || (process.env.NODE_ENV === 'production' ? 'https://pos.gen-z.online' : 'http://localhost:3000'),
  TAX_RATE: process.env.TAX_RATE || '0.18',
  NODE_ENV: process.env.NODE_ENV || 'production',
});

export const env = getEnv();

export type Env = ReturnType<typeof getEnv>;
