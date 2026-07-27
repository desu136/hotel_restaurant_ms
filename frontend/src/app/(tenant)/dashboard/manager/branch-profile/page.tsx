"use client"

import * as React from "react"
import { Loader2, Check, AlertCircle } from "lucide-react"
import { BranchProfileHeader, BranchDetailsForm } from "./components/BranchDetailsForm"

interface Branch {
  id: string; name: string; address?: string | null; phone?: string | null
  logo_url?: string | null; banner_url?: string | null; created_at: string
}
type BranchForm = { name: string; address: string; phone: string; logo_url: string; banner_url: string }

export default function BranchProfilePage() {
  const [branch, setBranch] = React.useState<Branch | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isEditing, setIsEditing] = React.useState(false)
  const [form, setForm] = React.useState<BranchForm>({ name: "", address: "", phone: "", logo_url: "", banner_url: "" })
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)
  const [logoUploading, setLogoUploading] = React.useState(false)
  const [bannerUploading, setBannerUploading] = React.useState(false)

  const loadProfile = React.useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const meRes = await fetch("/api/auth/me")
      if (!meRes.ok) throw new Error("Could not authenticate session.")
      const meData = await meRes.json()
      const branchId = meData?.user?.branch_id
      if (!branchId) throw new Error("You are not assigned to any branch profile.")
      const branchRes = await fetch(`/api/branches/${branchId}`)
      if (!branchRes.ok) throw new Error("Failed to load branch profile information.")
      const branchData = await branchRes.json()
      setBranch(branchData)
      setForm({ name: branchData.name ?? "", address: branchData.address ?? "", phone: branchData.phone ?? "", logo_url: branchData.logo_url ?? "", banner_url: branchData.banner_url ?? "" })
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadProfile() }, [loadProfile])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
    const file = e.target.files?.[0]
    if (!file) return
    if (type === "logo") setLogoUploading(true)
    else setBannerUploading(true)
    setError("")
    const fd = new FormData()
    fd.append("image", file)
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok && data.success) setForm(f => ({ ...f, [`${type}_url`]: data.data.url }))
      else setError(data.error || `Failed to upload ${type}.`)
    } catch {
      setError(`Network error uploading ${type}.`)
    } finally {
      if (type === "logo") setLogoUploading(false)
      else setBannerUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError("Branch name is required."); return }
    setSubmitting(true)
    setError("")
    setSuccess(false)
    try {
      const res = await fetch(`/api/branches/${branch!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), address: form.address.trim() || null, phone: form.phone.trim() || null, logo_url: form.logo_url || null, banner_url: form.banner_url || null })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update branch profile.")
      setBranch(data)
      setSuccess(true)
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" /></div>

  if (error && !branch) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
      <AlertCircle className="w-10 h-10 text-red-500/50" />
      <p className="text-[var(--muted)] text-sm max-w-md">{error}</p>
      <button onClick={loadProfile} className="px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-lg text-xs font-bold">Retry Loading</button>
    </div>
  )

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Branch Profile</h1>
        <p className="text-[var(--muted)] text-sm mt-1">Customize your local branch's public information, logo, and brand images.</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold">
          <Check className="w-4 h-4 shrink-0" /> Branch profile saved successfully!
        </div>
      )}

      {branch && (
        <div className="space-y-6">
          <BranchProfileHeader form={form} branch={branch} />
          <BranchDetailsForm
            form={form} setForm={setForm} branch={branch}
            isEditing={isEditing} setIsEditing={setIsEditing}
            submitting={submitting} error={error} setError={setError} success={success}
            onSubmit={handleSubmit} onImageUpload={handleImageUpload}
            logoUploading={logoUploading} bannerUploading={bannerUploading}
          />
        </div>
      )}
    </div>
  )
}
