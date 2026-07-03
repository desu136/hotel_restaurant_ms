"use client"
import * as React from "react"
import {
  Store, Pencil, Loader2, Check, X, AlertCircle,
  GitBranch, MapPin, Phone, Calendar, Image as ImageIcon
} from "lucide-react"

interface Branch {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  logo_url?: string | null
  banner_url?: string | null
  created_at: string
}

export default function BranchProfilePage() {
  const [branch, setBranch] = React.useState<Branch | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isEditing, setIsEditing] = React.useState(false)
  const [form, setForm] = React.useState({
    name: "",
    address: "",
    phone: "",
    logo_url: "",
    banner_url: ""
  })
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)
  const [logoUploading, setLogoUploading] = React.useState(false)
  const [bannerUploading, setBannerUploading] = React.useState(false)

  const loadProfile = React.useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      // 1. Get logged-in user profile
      const meRes = await fetch("/api/auth/me")
      if (!meRes.ok) throw new Error("Could not authenticate session.")
      const meData = await meRes.json()

      const branchId = meData?.user?.branch_id
      if (!branchId) {
        throw new Error("You are not assigned to any branch profile.")
      }

      // 2. Get specific branch details
      const branchRes = await fetch(`/api/branches/${branchId}`)
      if (!branchRes.ok) throw new Error("Failed to load branch profile information.")
      const branchData = await branchRes.json()

      setBranch(branchData)
      setForm({
        name: branchData.name ?? "",
        address: branchData.address ?? "",
        phone: branchData.phone ?? "",
        logo_url: branchData.logo_url ?? "",
        banner_url: branchData.banner_url ?? ""
      })
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
    const file = e.target.files?.[0]
    if (!file) return

    if (type === "logo") setLogoUploading(true)
    else setBannerUploading(true)

    setError("")
    const formData = new FormData()
    formData.append("image", file)

    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok && data.success) {
        setForm(f => ({ ...f, [`${type}_url`]: data.data.url }))
      } else {
        setError(data.error || `Failed to upload ${type}.`)
      }
    } catch {
      setError(`Network error uploading ${type}.`)
    } finally {
      if (type === "logo") setLogoUploading(false)
      else setBannerUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError("Branch name is required.")
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch(`/api/branches/${branch!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          logo_url: form.logo_url || null,
          banner_url: form.banner_url || null
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update branch profile details.")
      }

      setBranch(data)
      setSuccess(true)
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
      </div>
    )
  }

  if (error && !branch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
        <AlertCircle className="w-10 h-10 text-red-500/50" />
        <p className="text-[var(--muted)] text-sm max-w-md">{error}</p>
        <button onClick={loadProfile} className="px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-lg text-xs font-bold hover:bg-[var(--color-primary-500)] transition-colors">
          Retry Loading
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Branch Profile</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Customize your local branch's public information, logo, and brand images.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold">
          <Check className="w-4 h-4 shrink-0" />
          Branch profile saved successfully!
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {branch && (
        <div className="space-y-6">
          {/* Card Showcase */}
          <div className="rounded-2xl border border-[var(--surface-border)] overflow-hidden shadow bg-[var(--surface)]">
            {/* Banner preview */}
            <div
              className="relative h-56 bg-gradient-to-br from-[var(--color-primary-600)]/15 to-purple-600/5 relative flex items-center justify-center overflow-hidden"
              style={form.banner_url ? {
                backgroundImage: `url(${form.banner_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              } : {}}
            >
              {!form.banner_url && (
                <div className="flex flex-col items-center gap-1.5 text-[var(--muted)]/50">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs font-semibold">No Banner Added</span>
                </div>
              )}
            </div>

            {/* Profile details */}
            <div className="p-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div className="flex items-end gap-4 min-w-0 -mt-14 md:-mt-16">
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="logo"
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-[var(--surface)] shadow-lg shrink-0 relative z-10"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[var(--color-primary-600)]/10 border-4 border-[var(--surface)] shadow-lg flex items-center justify-center shrink-0 relative z-10">
                    <Store className="w-8 h-8 text-[var(--color-primary-600)]" />
                  </div>
                )}
                <div className="pb-1 min-w-0">
                  <h2 className="text-2xl font-black tracking-tight truncate">{form.name || branch.name}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] mt-0.5 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    Registered {new Date(branch.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-[var(--surface-border)] rounded-xl text-xs font-bold hover:bg-[var(--surface-hover)] shadow transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Profile Details
                </button>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--surface-border)]">
                <h3 className="font-black text-base">Edit Details</h3>
                <button type="button" onClick={() => { setIsEditing(false); setError("") }} className="text-xs font-semibold hover:underline">Cancel</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Branch Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--surface-border)]/60">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Logo Upload</label>
                  <div className="flex items-center gap-3">
                    {form.logo_url && <img src={form.logo_url} alt="logo" className="w-14 h-14 object-cover rounded-xl border border-[var(--surface-border)] shadow-sm" />}
                    <label className="flex-1 cursor-pointer">
                      <div className="w-full px-4 py-3 border border-dashed border-[var(--surface-border)] rounded-xl text-xs font-bold text-center hover:bg-[var(--surface-hover)] transition-colors">
                        {logoUploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Upload Logo"}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "logo")} disabled={logoUploading} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Banner Image Upload</label>
                  <div className="space-y-2">
                    {form.banner_url && <img src={form.banner_url} alt="banner" className="w-full h-20 object-cover rounded-xl border border-[var(--surface-border)] shadow-sm" />}
                    <label className="cursor-pointer block">
                      <div className="w-full px-4 py-3 border border-dashed border-[var(--surface-border)] rounded-xl text-xs font-bold text-center hover:bg-[var(--surface-hover)] transition-colors">
                        {bannerUploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Upload Banner"}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "banner")} disabled={bannerUploading} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[var(--surface-border)]/60 justify-end">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setError("") }}
                  className="px-5 py-2.5 border border-[var(--surface-border)] rounded-xl text-sm font-semibold hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[var(--color-primary-600)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-500)] shadow-lg disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            /* Information Grid */
            <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 space-y-6">
              <h3 className="font-black text-base pb-3 border-b border-[var(--surface-border)]">Profile Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[var(--muted)]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Address</p>
                    <p className="text-sm font-medium text-[var(--foreground)] mt-0.5">
                      {branch.address || "No address specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-[var(--muted)]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Phone Number</p>
                    <p className="text-sm font-medium text-[var(--foreground)] mt-0.5">
                      {branch.phone || "No phone number added"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
