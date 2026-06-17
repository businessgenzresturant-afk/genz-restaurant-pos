"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { signIn } from "next-auth/react"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || errorData.message || "Failed to create account")
      } else {
        // Automatically sign in after successful registration
        const signInResult = await signIn("credentials", {
          redirect: false,
          email: data.email,
          password: data.password,
        })

        if (signInResult?.error) {
          setError("Account created but failed to sign in. Please log in manually.")
        } else {
          router.push("/pos/tables")
          // Note: In Next.js 14, router.push doesn't immediately navigate
          // The navigation will happen after this function completes
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-semibold text-zinc-300 block">Name</label>
        <input
          id="name"
          type="text"
          placeholder="John Doe"
          {...form.register("name")}
          className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
        />
        {form.formState.errors.name && (
          <p className="text-red-400 text-xs mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-zinc-300 block">Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...form.register("email")}
          className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
        />
        {form.formState.errors.email && (
          <p className="text-red-400 text-xs mt-1">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-zinc-300 block">Password</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          {...form.register("password")}
          className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
        />
        {form.formState.errors.password && (
          <p className="text-red-400 text-xs mt-1">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-semibold text-zinc-300 block">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          {...form.register("confirmPassword")}
          className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-red-400 text-xs mt-1">{form.formState.errors.confirmPassword.message}</p>
        )}
      </div>

      <button 
        type="submit" 
        className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base tracking-wide transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-4" 
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  )
}