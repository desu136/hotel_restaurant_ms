"use client"

import * as React from "react"
import emailjs from "@emailjs/browser"
import { X, Mail, KeyRound, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = React.useState<"email" | "code" | "success">("email")
  const [email, setEmail] = React.useState("")
  const [resetCode, setResetCode] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [infoMessage, setInfoMessage] = React.useState("")
  const [demoCode, setDemoCode] = React.useState<string | null>(null)

  if (!isOpen) return null

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }

    setLoading(true)
    setError("")
    setInfoMessage("")
    setDemoCode(null)

    try {
      // 1. Call backend to verify email and generate 6-digit reset code
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to process forgot password request.")
        return
      }

      const generatedCode = data.resetCode
      const userName = data.userName || "User"
      setDemoCode(generatedCode)

      // 2. Dispatch email via EmailJS
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

      if (serviceId && templateId && publicKey) {
        try {
          await emailjs.send(
            serviceId,
            templateId,
            {
              to_email: email.trim(),
              to_name: userName,
              reset_code: generatedCode,
              message: `Your password reset code is: ${generatedCode}. It expires in 15 minutes.`,
            },
            publicKey
          )
          setInfoMessage(`Reset code sent to ${email.trim()} via EmailJS. Please check your inbox!`)
        } catch (emailErr: any) {
          console.warn("EmailJS send notice:", emailErr)
          setInfoMessage(`Reset code generated for ${email.trim()}. (EmailJS notice: enter code below)`)
        }
      } else {
        setInfoMessage(`Reset code generated for ${email.trim()}. Enter the 6-digit code below to set your new password.`)
      }

      setStep("code")
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetCode.trim()) {
      setError("Please enter the 6-digit reset code.")
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          resetCode: resetCode.trim(),
          newPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to reset password.")
        return
      }

      setStep("success")
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setStep("email")
    setEmail("")
    setResetCode("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    setInfoMessage("")
    setDemoCode(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2 text-[var(--foreground)]">
            <KeyRound className="w-5 h-5 text-[var(--color-primary-600)]" />
            {step === "email" && "Reset Password"}
            {step === "code" && "Verify Reset Code"}
            {step === "success" && "Password Changed"}
          </h3>
          <button onClick={handleCloseModal} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            {error}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Enter your account email address. We will send a 6-digit password reset verification code using EmailJS.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
            <Button type="submit" className="w-full" isLoading={loading} disabled={loading}>
              Send Reset Code <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {infoMessage && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                {infoMessage}
              </div>
            )}

            {/* {demoCode && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-mono flex items-center justify-between">
                <span>Verification Code: <strong>{demoCode}</strong></span>
                <button
                  type="button"
                  onClick={() => setResetCode(demoCode)}
                  className="px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded text-[11px] font-sans font-bold hover:underline"
                >
                  Auto-fill Code
                </button>
              </div>
            )} */}

            <div className="space-y-2">
              <label className="text-sm font-medium">6-Digit Reset Code</label>
              <Input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="font-mono tracking-widest text-center text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <PasswordInput
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password</label>
              <PasswordInput
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" isLoading={loading} disabled={loading}>
              Reset Password
            </Button>
          </form>
        )}

        {step === "success" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-lg">Password Reset Successfully!</h4>
            <p className="text-sm text-[var(--muted)]">
              Your password has been updated. You can now log in with your new password.
            </p>
            <Button onClick={handleCloseModal} className="w-full">
              Back to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
