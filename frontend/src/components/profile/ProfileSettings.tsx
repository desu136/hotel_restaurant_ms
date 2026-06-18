"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { User, KeyRound, Trash2, Camera, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ProfileSettings() {
  const router = useRouter()
  const [user, setUser] = React.useState<{ name: string; email: string; phone: string; avatar_url: string | null } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [savingProfile, setSavingProfile] = React.useState(false)
  const [savingPassword, setSavingPassword] = React.useState(false)
  const [deletingAccount, setDeletingAccount] = React.useState(false)

  // Profile fields
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [avatarUrl, setAvatarUrl] = React.useState("")
  const [uploading, setUploading] = React.useState(false)
  const [profileMsg, setProfileMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  // Password fields
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [passwordMsg, setPasswordMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  // Delete account fields
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [confirmDeletePass, setConfirmDeletePass] = React.useState("")
  const [deleteError, setDeleteError] = React.useState("")

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        if (data?.user) {
          setUser(data.user)
          setName(data.user.name || "")
          setPhone(data.user.phone || "")
          setAvatarUrl(data.user.avatar_url || "")
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false))
  }, [router])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, avatar_url: avatarUrl || null }),
      })
      const data = await res.json()
      if (res.ok) {
        setProfileMsg({ type: "success", text: "Profile updated successfully!" })
        router.refresh()
      } else {
        setProfileMsg({ type: "error", text: data.error || "Failed to update profile" })
      }
    } catch {
      setProfileMsg({ type: "error", text: "A network error occurred." })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg(null)
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" })
      return
    }
    setSavingPassword(true)
    try {
      const res = await fetch("/api/auth/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordMsg({ type: "success", text: "Password changed successfully!" })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setPasswordMsg({ type: "error", text: data.error || "Failed to change password" })
      }
    } catch {
      setPasswordMsg({ type: "error", text: "A network error occurred." })
    } finally {
      setSavingPassword(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setProfileMsg(null)
    const formData = new FormData()
    formData.append("image", file)
    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data?.data?.url) {
        setAvatarUrl(data.data.url)
        setProfileMsg({ type: "success", text: "Photo uploaded. Save profile to apply changes." })
      } else {
        setProfileMsg({ type: "error", text: data.error || "Upload failed" })
      }
    } catch {
      setProfileMsg({ type: "error", text: "Failed to upload photo" })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeletingAccount(true)
    setDeleteError("")
    try {
      const res = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: confirmDeletePass }),
      })
      const data = await res.json()
      if (res.ok) {
        setShowDeleteModal(false)
        router.push("/login")
      } else {
        setDeleteError(data.error || "Failed to delete account")
      }
    } catch {
      setDeleteError("Failed to delete account due to network error")
    } finally {
      setDeletingAccount(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
        <p className="text-sm text-[var(--muted)]">Loading settings...</p>
      </div>
    )
  }

  const initials = name
    ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "U"

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Manage your account information, security settings, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column - profile picture & fast info */}
        <div className="space-y-6">
          <Card className="glass">
            <CardContent className="pt-6 text-center">
              <div className="relative w-28 h-28 mx-auto mb-4 group">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-[var(--surface-border)]" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-[var(--surface-border)] shadow-inner">
                    {initials}
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>

              {uploading && <p className="text-xs text-[var(--color-primary-600)] animate-pulse mb-2">Uploading picture...</p>}
              <h2 className="font-bold text-lg">{user?.name}</h2>
              <p className="text-xs text-[var(--muted)] mb-4">{user?.email}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Details Form */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-[var(--color-primary-600)]" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details and contact email/phone.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4">
                {profileMsg && (
                  <div className={`p-3 rounded-lg text-sm ${profileMsg.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-200" : "bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-200"}`}>
                    {profileMsg.text}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-[var(--muted)]">Full Name</label>
                    <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-[var(--muted)]">Phone Number</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[var(--muted)]">Email Address</label>
                  <Input disabled value={user?.email} className="opacity-60 bg-transparent" />
                  <p className="text-[10px] text-[var(--muted)]">Email address changes must be requested through support.</p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={savingProfile} className="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white">
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Password Change Form */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                Change Password
              </CardTitle>
              <CardDescription>Keep your account secure by modifying your password regularly.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSave} className="space-y-4">
                {passwordMsg && (
                  <div className={`p-3 rounded-lg text-sm ${passwordMsg.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-200" : "bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-200"}`}>
                    {passwordMsg.text}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[var(--muted)]">Current Password</label>
                  <PasswordInput required placeholder="Enter current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-[var(--muted)]">New Password</label>
                    <PasswordInput required placeholder="At least 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-[var(--muted)]">Confirm New Password</label>
                    <PasswordInput required placeholder="Repeat new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={savingPassword} className="bg-amber-600 hover:bg-amber-700 text-white">
                    {savingPassword ? "Updating Password..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200/50 bg-red-50/5 dark:bg-red-950/5">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Actions in this area are destructive and cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Delete Account</h4>
                  <p className="text-xs text-[var(--muted)]">Permanently remove your account, staff profiles, and access to all data.</p>
                </div>
                <Button onClick={() => setShowDeleteModal(true)} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl z-10 p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">Are you absolutely sure?</h3>
            </div>
            <p className="text-sm text-[var(--muted)] mb-4">
              This action is permanent and cannot be undone. To proceed, please confirm your current password below.
            </p>
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Confirm Password</label>
                <PasswordInput required value={confirmDeletePass} onChange={e => setConfirmDeletePass(e.target.value)} placeholder="Type password to confirm" />
              </div>

              {deleteError && (
                <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 p-2.5 rounded-lg">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={deletingAccount} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  {deletingAccount ? "Deleting..." : "Permanently Delete"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
