"use client"

import * as React from "react"
import { GitBranch, X } from "lucide-react"

export interface BranchFormData {
  name: string
  address: string
  phone: string
}

interface BranchModalProps {
  show: boolean
  editTarget: any | null
  formData: BranchFormData
  setFormData: React.Dispatch<React.SetStateAction<BranchFormData>>
  submitting: boolean
  error: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function BranchModal({
  show,
  editTarget,
  formData,
  setFormData,
  submitting,
  error,
  onClose,
  onSubmit,
}: BranchModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            {editTarget ? "Edit Branch" : "Add Branch"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 hover:bg-[var(--surface-hover)] hover:cursor-pointer px-4 py-2.5 border rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 hover:bg-[var(--color-primary-500)] hover:cursor-pointer bg-[var(--color-primary-600)] text-white rounded-lg text-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
