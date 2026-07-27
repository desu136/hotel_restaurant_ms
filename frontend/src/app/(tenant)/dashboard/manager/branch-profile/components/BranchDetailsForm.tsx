"use client"

import * as React from "react"
import { Loader2, Check, AlertCircle, Store, Image as ImageIcon, Calendar, MapPin, Phone, Pencil } from "lucide-react"

interface Branch {
  id: string; name: string; address?: string | null; phone?: string | null
  logo_url?: string | null; banner_url?: string | null; created_at: string
}
type BranchForm = { name: string; address: string; phone: string; logo_url: string; banner_url: string }

interface BranchProfileFormProps {
  branch: Branch
  form: BranchForm
  setForm: React.Dispatch<React.SetStateAction<BranchForm>>
  isEditing: boolean
  setIsEditing: (v: boolean) => void
  submitting: boolean
  error: string
  setError: (v: string) => void
  success: boolean
  onSubmit: (e: React.FormEvent) => void
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => void
  logoUploading: boolean
  bannerUploading: boolean
}

export function BranchProfileHeader({ form, branch }: { form: BranchForm; branch: Branch }) {
  return (
    <div className="rounded-2xl border border-[var(--surface-border)] overflow-hidden shadow bg-[var(--surface)]">
      <div className="relative h-56 bg-gradient-to-br from-[var(--color-primary-600)]/15 to-purple-600/5 flex items-center justify-center overflow-hidden"
        style={form.banner_url ? { backgroundImage: `url(${form.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
        {!form.banner_url && <div className="flex flex-col items-center gap-1.5 text-[var(--muted)]/50"><ImageIcon className="w-8 h-8" /><span className="text-xs font-semibold">No Banner Added</span></div>}
      </div>
      <div className="p-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div className="flex items-end gap-4 min-w-0 -mt-14 md:-mt-16">
          {form.logo_url
            ? <img src={form.logo_url} alt="logo" className="w-20 h-20 rounded-2xl object-cover border-4 border-[var(--surface)] shadow-lg shrink-0 relative z-10" />
            : <div className="w-20 h-20 rounded-2xl bg-[var(--color-primary-600)]/10 border-4 border-[var(--surface)] shadow-lg flex items-center justify-center shrink-0 relative z-10"><Store className="w-8 h-8 text-[var(--color-primary-600)]" /></div>
          }
          <div className="pb-1 min-w-0">
            <h2 className="text-2xl font-black tracking-tight truncate">{form.name || branch.name}</h2>
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] mt-0.5 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              Registered {new Date(branch.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BranchDetailsForm({ form, setForm, isEditing, setIsEditing, submitting, error, setError, onSubmit, onImageUpload, logoUploading, bannerUploading }: BranchProfileFormProps) {
  if (!isEditing) {
    return (
      <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--surface-border)]">
          <h3 className="font-black text-base">Profile Details</h3>
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-4 py-2 border border-[var(--surface-border)] rounded-xl text-xs font-bold hover:bg-[var(--surface-hover)] transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Edit Profile Details
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: <MapPin className="w-4 h-4 text-[var(--muted)]" />, label: "Address", val: form.address || "No address specified" },
            { icon: <Phone className="w-4 h-4 text-[var(--muted)]" />, label: "Phone Number", val: form.phone || "No phone number added" },
          ].map(({ icon, label, val }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center shrink-0">{icon}</div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
                <p className="text-sm font-medium text-[var(--foreground)] mt-0.5">{val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--surface-border)]">
        <h3 className="font-black text-base">Edit Details</h3>
        <button type="button" onClick={() => { setIsEditing(false); setError("") }} className="text-xs font-semibold hover:underline">Cancel</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: "name", label: "Branch Name *", type: "text", span: false },
          { key: "phone", label: "Phone Number", type: "tel", span: false },
          { key: "address", label: "Address", type: "text", span: true },
        ].map(({ key, label, type, span }) => (
          <div key={key} className={span ? "md:col-span-2" : ""}>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">{label}</label>
            <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl text-sm" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--surface-border)]/60">
        {(["logo", "banner"] as const).map((type) => (
          <div key={type}>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">{type === "logo" ? "Logo Upload" : "Banner Image Upload"}</label>
            <div className={type === "logo" ? "flex items-center gap-3" : "space-y-2"}>
              {form[`${type}_url`] && <img src={form[`${type}_url`]} alt={type} className={type === "logo" ? "w-14 h-14 object-cover rounded-xl border border-[var(--surface-border)] shadow-sm" : "w-full h-20 object-cover rounded-xl border border-[var(--surface-border)] shadow-sm"} />}
              <label className={type === "logo" ? "flex-1 cursor-pointer" : "cursor-pointer block"}>
                <div className="w-full px-4 py-3 border border-dashed border-[var(--surface-border)] rounded-xl text-xs font-bold text-center hover:bg-[var(--surface-hover)] transition-colors">
                  {(type === "logo" ? logoUploading : bannerUploading) ? <Loader2 className="w-4 h-4 animate-spin inline" /> : `Upload ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => onImageUpload(e, type)} disabled={type === "logo" ? logoUploading : bannerUploading} />
              </label>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

      <div className="flex gap-3 pt-4 border-t border-[var(--surface-border)]/60 justify-end">
        <button type="button" onClick={() => { setIsEditing(false); setError("") }} className="px-5 py-2.5 border border-[var(--surface-border)] rounded-xl text-sm font-semibold hover:bg-[var(--surface-hover)]">Cancel</button>
        <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-[var(--color-primary-600)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-500)] shadow-lg disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}Save Changes
        </button>
      </div>
    </form>
  )
}
