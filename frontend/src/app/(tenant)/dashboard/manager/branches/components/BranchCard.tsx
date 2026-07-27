"use client"

import * as React from "react"
import { Pencil, Loader2, GitBranch, MapPin, Phone, Trash2 } from "lucide-react"

interface Branch {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  created_at: string
  _count?: { categories: number; menuItems: number; restaurantTables: number }
}

interface BranchCardProps {
  branch: Branch
  deletingId: string | null
  onEdit: (branch: Branch) => void
  onDelete: (id: string) => void
}

export function BranchCard({ branch, deletingId, onEdit, onDelete }: BranchCardProps) {
  return (
    <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 flex flex-col justify-between hover:border-[var(--color-primary-500)]/40 hover:shadow-sm transition-all">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
              <GitBranch className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{branch.name}</p>
              <p className="text-[10px] text-[var(--muted)] font-mono">ID: {branch.id.slice(0, 8)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(branch)}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--color-primary-600)] transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(branch.id)}
              disabled={deletingId === branch.id}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-500 transition-colors disabled:opacity-40"
            >
              {deletingId === branch.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-[var(--muted)] pt-1 border-t border-[var(--surface-border)]/60">
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="truncate">{branch.address || "No address added"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span>{branch.phone || "No phone added"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-[var(--surface-border)]/60">
        {[
          { label: "Categories", val: branch._count?.categories ?? 0 },
          { label: "Menu Items", val: branch._count?.menuItems ?? 0 },
          { label: "Tables", val: branch._count?.restaurantTables ?? 0 },
        ].map(({ label, val }) => (
          <div key={label} className="text-center rounded-lg bg-[var(--surface-hover)] py-2 px-1">
            <p className="text-base font-black">{val}</p>
            <p className="text-[8px] text-[var(--muted)] uppercase font-semibold">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export type { Branch }
