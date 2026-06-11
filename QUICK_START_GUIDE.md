# Gen-Z Restaurant POS - Quick Start Guide

## 📋 Overview
This guide will help you get the Gen-Z Restaurant POS system running on your local machine.

## ✅ What's Been Fixed
1. **Missing `lib/utils.ts`** - Created with `clsx`/`tailwind-merge` utility
2. **Form Validation** - Implemented proper `react-hook-form` + `zod` validation in:
   - Tables page (`/src/app/(pos)/tables/page.tsx`)
   - Menu page (`/src/app/(pos)/menu/page.tsx`)
3. **Authentication System** - Added:
   - User model to Prisma schema
   - Registration API route (`/src/app/api/auth/register/route.ts`)
   - NextAuth configuration (`/src/app/api/auth/[...nextauth]/route.ts`)
   - Environment variable for `NEXTAUTH_SECRET`
4. **Fixed Redirects** - Login form now redirects to `/pos/tables` instead of `/dashboard`

## 🔧 Prerequisites
Before you begin, make sure you have:
- **Node.js** (v18+ recommended)
- **PostgreSQL** running and accessible
- **Git** (to clone the repository if needed)

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd /Users/raghavshah/GenZ_Restaurant_POS/genz-restaurant-pos/genz-restaurant-pos
npm install
```

### 2. Configure Environment Variables
Edit the `.env` file with your actual database credentials:

```env
# Environment Variables for Gen-Z Restaurant POS
DATABASE_URL="postgresql://[YOUR_USERNAME]:[YOUR_PASSWORD]@[HOST]:[PORT]/[DATABASE]"
NEXTAUTH_SECRET="[generate-a-secure-random-string-here]"

# Optional: Only if you're actually using Supabase (not required for Prisma)
# NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

**Example:**
```env
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/restaurant_pos"
NEXTAUTH_SECRET="5f3d2a1b8c9e4f6a7b8c9d0e1f2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s"
```

### 3. Set Up Database
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations (this will create tables)
npx prisma migrate dev --name init

# Alternative if migrations don't work:
# npx prisma db push
```

### 4. Start the Development Server
```bash
npm run dev
```

### 5. Access the Application
Open your browser and visit: **http://localhost:3000**

You should see:
1. Automatic redirect to `/pos/tables` (login required)
2. Login page at `/auth/login`
3. Demo credentials for testing:
   - **Email**: `admin@test.com` (you'll need to register first)
   - **Password**: `password123`

### 6. First-Time Setup
1. Go to `http://localhost:3000/auth/register`
2. Create an account (use any valid email and password)
3. After registration, you'll be redirected to the login page
4. Log in with your new credentials
5. You should now see the Tables management page

## 🛠️ Troubleshooting

### "Connection Refused" Error
If you see `ERR_CONNECTION_REFUSED` when trying to access `http://localhost:3000/`:
1. **Verify the server is running**: Check if `npm run dev` command is still active in your terminal
2. **Check the port**: Make sure no other application is using port 3000
3. **Try a different port**: You can change the port by setting the `PORT` environment variable:
   ```bash
   PORT=3001 npm run dev
   ```
   Then visit `http://localhost:3001`

### Database Connection Errors
If you see database-related errors:
1. **Verify PostgreSQL is running**:
   - On macOS: `brew services start postgresql` (if installed via Homebrew)
   - On Linux: `sudo systemctl start postgresql`
   - On Windows: Start the PostgreSQL service via Services app
2. **Check credentials**: Double-check your `.env` file
3. **Test connection**: Try connecting to PostgreSQL directly with a client like `psql`

### Page Not Found (404) Errors
If you see 404 errors for pages that should exist:
1. **Verify file structure**: Make sure all `.tsx` files are in the correct directories
2. **Check Next.js routing**: Remember that in Next.js 14 App Router:
   - `src/app/page.tsx` handles `/`
   - `src/app/(pos)/tables/page.tsx` handles `/pos/tables`
   - `src/app/api/auth/register/route.ts` handles `/api/auth/register`

## 📁 Project Structure Overview
```
src/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Root page (redirects to /pos/tables)
│   ├── globals.css          # Global styles
│   ├── providers.tsx        # React providers
│   ├── (auth/)              # Authentication routes
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (pos/)               # POS functionality
│   │   ├── layout.tsx       # POS layout
│   │   ├── tables/
│   │   │   └── page.tsx     # Table management
│   │   ├── menu/
│   │   │   └── page.tsx     # Menu management
│   │   ├── orders/
│   │   │   └── page.tsx     # Order taking
│   │   ├── bills/
│   │   │   └── page.tsx     # Bill generation
│   │   ├── kot/
│   │   │   └── page.tsx     # KOT display
│   │   └── reports/
│   │       └── page.tsx     # Sales reports
│   └── api/                 # API routes
│       └── auth/
│           ├── register/route.ts
│           └── [...nextauth]/route.ts
├── components/              # Reusable components
│   ├── forms/               # Form components
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   └── ui/                  # UI primitives (Button, Input, etc.)
├── lib/                     # Utilities and services
│   ├── prisma.ts            # Prisma client singleton
│   └── utils.ts             # clsx/tailwind-merge utility
└── prisma/                  # Database schema
    └── schema.prisma        # Prisma schema with User, Table, MenuItem, etc.
```

## 🎯 Features Working
- ✅ Table management (CRUD with validation)
- ✅ Menu management (CRUD with validation + availability toggle)
- ✅ Order taking (cart system, customer info)
- ✅ Bill generation (tax calculations, payment tracking)
- ✅ KOT display (real-time kitchen orders)
- ✅ Sales reports (date filtering, analytics)
- ✅ Authentication (registration, login, session management)
- ✅ Form validation (throughout the application)
- ✅ Responsive design (Tailwind CSS)
- ✅ Error handling and loading states

## 🧹 Clean Up
To reset the database (for development only):
```bash
npx prisma migrate reset
```

## 💡 Next Steps / Enhancements
Consider adding:
- Role-based access control (admin vs staff)
- Payment gateway integration
- Receipt printing functionality
- Inventory management
- Employee management
- Advanced reporting and analytics
- Docker configuration for easy deployment
- Unit and integration tests

## 📞 Support
If you encounter issues:
1. Check the terminal where you ran `npm run dev` for error messages
2. Verify your PostgreSQL connection and credentials
3. Make sure all dependencies are installed (`npm install`)
4. Try clearing your browser cache or using an incognito window
5. Check the `.env` file for typos or incorrect values

Happy coding! 🍽️