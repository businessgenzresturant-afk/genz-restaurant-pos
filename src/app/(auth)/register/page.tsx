import { RegisterForm } from "@/components/forms/register-form"
import Link from "next/link"

export default function RegisterPage() {
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
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-orange-900/50" />
        
        {/* Content over image */}
        <div className="absolute inset-0 p-12 flex flex-col justify-between">
          {/* Top badge */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-lg bg-zinc-900 border border-zinc-800 flex-shrink-0 relative">
              <img src="/images/Gen-z-logo.jpg" alt="Gen-Z Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white font-black text-lg tracking-tight leading-none">Gen-Z Restaurant</p>
              <p className="text-orange-500 font-bold text-xs tracking-widest uppercase mt-1">Point of Sale</p>
            </div>
          </div>

          <div className="max-w-md">
            <div className="w-12 h-1 bg-orange-500 mb-8 rounded-full" />
            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              Join the future.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
                Register now.
              </span>
            </h1>
            <p className="mt-6 text-zinc-300 text-lg leading-relaxed font-medium">
              Create an account to manage tables, orders, kitchen & billing — all
              from one powerful dashboard designed for modern restaurants.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            <span>© 2026 Gen-Z Restaurant. All rights reserved.</span>
            <span>Built by RAGSPRO</span>
          </div>
        </div>
      </div>

      {/* RIGHT — Register Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-zinc-950 px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-zinc-900 border border-zinc-800 flex-shrink-0 relative">
              <img src="/images/Gen-z-logo.jpg" alt="Gen-Z Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white font-black text-lg leading-none">Gen-Z Restaurant</p>
              <p className="text-orange-500 font-bold text-xs tracking-widest uppercase mt-1">POS System</p>
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-black text-white tracking-tight">Create Account ✨</h2>
            <p className="mt-2 text-zinc-400 text-sm font-medium">
              Sign up for your restaurant dashboard
            </p>
          </div>

          <RegisterForm />

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <p className="text-zinc-600 text-xs">
              Powered by{' '}
              <span className="text-orange-500 font-bold">RAGSPRO Agency</span>
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 " />
              <span className="text-zinc-500 text-xs font-medium">System Online</span>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <Link href="/login" className="text-orange-500 hover:text-orange-400 text-sm font-semibold transition-colors">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
