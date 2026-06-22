/**
 * Environment Variable Configuration
 *
 * Provides typed access to environment variables
 * CRITICAL: All required env vars MUST be set in deployment platform (Vercel)
 * No fallback secrets allowed for security
 */

const getEnv = () => {
  // In production, fail safely if critical env vars are missing
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required in production');
    }
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET is required in production');
    }
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_dev',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-min-32-chars-for-local-only',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || (process.env.NODE_ENV === 'production' ? 'https://pos.gen-z.online' : 'http://localhost:3000'),
    TAX_RATE: process.env.TAX_RATE || '0.18',
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
};

export const env = getEnv();

export type Env = ReturnType<typeof getEnv>;
