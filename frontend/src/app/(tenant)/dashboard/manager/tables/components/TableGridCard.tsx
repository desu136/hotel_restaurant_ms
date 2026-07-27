"use client"

import * as React from "react"
import { Loader2, Table2, Trash2 } from "lucide-react"

interface RestaurantTable { id: string; table_number: string; capacity: number; branch_id: string; branch: { id: string; name: string } }

interface TableGridCardProps {
  table: RestaurantTable
  deletingId: string | null
  onDelete: (id: string) => void
}

export function TableGridCard({ table: t, deletingId, onDelete }: TableGridCardProps) {
  return (
    <div className="group rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 hover:border-[var(--color-primary-500)]/40 hover:shadow-sm transition-all flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-600)]/10 flex items-center justify-center">
            <Table2 className="w-5 h-5 text-[var(--color-primary-600)]" />
          </div>
          <div>
            <p className="font-black text-base">Table {t.table_number}</p>
            <p className="text-xs text-[var(--muted)]">{t.capacity} seats</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(t.id)}
          disabled={deletingId === t.id}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/5 disabled:opacity-40"
        >
          {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
      <div className="text-xs text-[var(--muted)] border-t border-[var(--surface-border)]/60 pt-2">
        Branch: <span className="font-semibold text-[var(--foreground)]">{t.branch?.name || "—"}</span>
      </div>
    </div>
  )
}

export type { RestaurantTable }
