"use client"

import * as React from "react"
import { Table2, Loader2, X, Plus } from "lucide-react"

interface Branch { id: string; name: string }

interface TableModalProps {
  show: boolean
  branches: Branch[]
  form: {
    tableNumber: string
    capacity: string
    branchScope: "single" | "multiple" | "all"
    branchId: string
    selectedBranchIds: string[]
  }
  setForm: React.Dispatch<React.SetStateAction<any>>
  submitting: boolean
  error: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function TableModal({ show, branches, form, setForm, submitting, error, onClose, onSubmit }: TableModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2"><Table2 className="w-5 h-5" /> Add Table</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)]"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Table Number / Name *</label>
            <input type="text" value={form.tableNumber} onChange={e => setForm((f: any) => ({ ...f, tableNumber: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none" autoFocus />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Seating Capacity</label>
            <input type="number" min="1" max="100" value={form.capacity} onChange={e => setForm((f: any) => ({ ...f, capacity: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Branch Distribution Scope</label>
            <div className="grid grid-cols-3 gap-2">
              {(["single", "multiple", "all"] as const).map(scope => (
                <button key={scope} type="button" onClick={() => setForm((f: any) => ({ ...f, branchScope: scope }))}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border capitalize transition-all ${form.branchScope === scope ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)]/5 text-[var(--color-primary-600)]" : "border-[var(--surface-border)] hover:bg-[var(--surface-hover)]"}`}>
                  {scope === "all" ? "All Branches" : scope === "multiple" ? "Select Some" : "Single Branch"}
                </button>
              ))}
            </div>
          </div>

          {form.branchScope === "single" && (
            <div>
              <label className="block text-sm font-semibold mb-1.5">Target Branch <span className="text-red-500">*</span></label>
              <select value={form.branchId} onChange={e => setForm((f: any) => ({ ...f, branchId: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none">
                <option value="" disabled>Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {form.branchScope === "multiple" && (
            <div className="space-y-2 border border-[var(--surface-border)] rounded-xl p-3 bg-[var(--surface-hover)]/30">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Choose Branches <span className="text-red-500">*</span></label>
              <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                {branches.map(b => {
                  const checked = form.selectedBranchIds.includes(b.id)
                  return (
                    <label key={b.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] cursor-pointer select-none">
                      <input type="checkbox" checked={checked} onChange={() => setForm((f: any) => ({
                        ...f, selectedBranchIds: checked ? f.selectedBranchIds.filter((id: string) => id !== b.id) : [...f.selectedBranchIds, b.id]
                      }))} className="w-4 h-4 rounded" />
                      <span className="text-xs font-semibold">{b.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-semibold hover:bg-[var(--surface-hover)]">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-500)] disabled:opacity-60 flex items-center justify-center gap-1.5">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Table
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
