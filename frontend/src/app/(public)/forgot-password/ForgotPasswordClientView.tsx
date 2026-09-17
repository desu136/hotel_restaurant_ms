"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { PasswordInput } from "@/components/ui/password-input"
import { EthiopianPhoneInput } from "@/components/ui/ethiopian-phone-input"
import { isEmailIdentifier, isValidEthiopianPhone, normalizeEthiopianPhone } from "@/lib/ethiopian-phone"

export default function ForgotPasswordClientView() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const loginEmail = email.trim().toLowerCase()
    if (!isEmailIdentifier(loginEmail)) {
      setError("Enter a valid email address")
      return
    }
    if (!isValidEthiopianPhone(phone)) {
      setError("Enter a valid Ethiopian phone number (+2519..., 09..., or 9...)")
      return
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          phone: normalizeEthiopianPhone(phone),
          newPassword,
          confirmPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.error || "Could not reset password")
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="glass overflow-hidden border-[var(--surface-border)]/50 shadow-2xl">
          {success ? (
            <>
              <CardHeader className="text-center space-y-3">
                <div className="mx-auto w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Password updated</CardTitle>
                <CardDescription>You can now sign in with your new password.</CardDescription>
              </CardHeader>
              <CardFooter className="justify-center pb-8">
                <Button className="w-full" onClick={() => router.push("/login")}>
                  Back to Sign In
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl flex justify-center items-center font-bold tracking-tight">
                  <div className="flex flex-col items-center gap-3">
                    <BrandLogo className="h-16 w-16 object-contain" alt="DFoodie" />
                    <span className="text-xl font-bold tracking-tight">Reset password</span>
                  </div>
                </CardTitle>
                <CardDescription>Enter the email and phone number on your account, then choose a new password.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReset} className="space-y-4" data-testid="forgot-password-form">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email address</label>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone number</label>
                    <EthiopianPhoneInput required value={phone} onChange={setPhone} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New password</label>
                    <PasswordInput
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm new password</label>
                    <PasswordInput
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full mt-2" isLoading={isLoading} disabled={isLoading}>
                    Update password
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="justify-center border-t border-[var(--surface-border)] pt-6 pb-6 bg-[var(--surface-hover)]/50">
                <a href="/login" className="text-sm text-[var(--color-primary-600)] font-medium hover:underline inline-flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sign In
                </a>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
