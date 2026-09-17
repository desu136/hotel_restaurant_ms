"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, AlertCircle } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { PasswordInput } from "@/components/ui/password-input"
import { ForgotPasswordModal } from "./components/ForgotPasswordModal"
import Link from "next/link"

export default function LoginClientView() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [isForgotModalOpen, setIsForgotModalOpen] = React.useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (res.ok) {
        router.push(data.redirectUrl || "/dashboard")
        router.refresh()
      } else {
        setError(data.error || "Login failed")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="glass overflow-hidden border-[var(--surface-border)]/50 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl flex justify-center items-center font-bold tracking-tight">
              <div className="flex flex-col items-center gap-3">
                <BrandLogo className="h-24 w-24 object-contain" alt="DFoodie" />
                <span className="text-xl font-bold tracking-tight">Welcome Back</span>
              </div>
            </CardTitle>
            <CardDescription>For cafés, restaurants, and any food chain</CardDescription>
            <CardDescription>Enter your credentials to access your account</CardDescription>

          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
              {error && (
                <div
                  className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center"
                  data-testid="login-error"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Email address</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="login-email"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Password</label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs text-[var(--color-primary-600)] hover:underline"
                    data-testid="login-forgot"
                  >
                    Forgot password?
                  </button>
                </div>
                <PasswordInput
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="login-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full mt-2" isLoading={isLoading} disabled={isLoading} data-testid="login-submit">
                Sign In <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-[var(--surface-border)] pt-6 pb-6 bg-[var(--surface-hover)]/50">
            <p className="text-sm text-[var(--muted)]">
              Don't have an account? <Link href="/register" className="text-[var(--color-primary-600)] font-medium hover:underline">Register now</Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  )
}
