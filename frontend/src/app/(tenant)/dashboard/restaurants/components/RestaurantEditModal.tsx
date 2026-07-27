"use client"
import * as React from "react"
import { Store, Loader2, X } from "lucide-react"

interface RestForm { name: string; logo_url: string; banner_url: string }

interface Props {
  show: boolean
  restForm: RestForm
  setRestForm: React.Dispatch<React.SetStateAction<RestForm>>
  isEdit: boolean
  submitting: boolean
  error: string
  logoUploading: boolean
  bannerUploading: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function RestaurantEditModal({ show, restForm, setRestForm, isEdit, submitting, error, logoUploading, bannerUploading, onClose, onSubmit, onLogoUpload, onBannerUpload }: Props) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Store className="w-5 h-5 text-[var(--foreground)]" />
            {isEdit ? "Edit Restaurant Profile" : "Set Up Your Restaurant"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Restaurant Name <span className="text-red-500">*</span></label>
            <input type="text" value={restForm.name} onChange={e => setRestForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm" autoFocus />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Logo</label>
            <div className="flex items-center gap-3">
              {restForm.logo_url && <img src={restForm.logo_url} alt="logo" className="w-14 h-14 object-cover rounded-lg border" />}
              <label className="flex-1 cursor-pointer">
                <div className="w-full px-3 py-2 border border-dashed rounded-lg text-sm text-center">
                  {logoUploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Upload Logo"}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} disabled={logoUploading} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Banner Image</label>
            <div className="space-y-2">
              {restForm.banner_url && <img src={restForm.banner_url} alt="banner" className="w-full h-20 object-cover rounded-lg border" />}
              <label className="cursor-pointer block">
                <div className="w-full px-3 py-2 border border-dashed rounded-lg text-sm text-center">
                  {bannerUploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Upload Banner"}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={onBannerUpload} disabled={bannerUploading} />
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border hover:bg-[var(--surface-hover)] rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 hover:bg-[var(--surface-hover)] border rounded-lg text-sm flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
