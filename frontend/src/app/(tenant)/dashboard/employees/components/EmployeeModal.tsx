"use client"

import * as React from "react"
import { Users2, X, Loader2, Check } from "lucide-react"
import { PasswordInput } from "@/components/ui/password-input"

interface EmployeeModalProps {
  show: boolean
  editTarget: any | null
  form: any
  setForm: React.Dispatch<React.SetStateAction<any>>
  branches: { id: string; name: string }[]
  roles: { id: string; code: string; name: string }[]
  allTables: { id: string; table_number: string }[]
  isOwner: boolean
  submitting: boolean
  error: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function EmployeeModal({
  show, editTarget, form, setForm, branches, roles, allTables, isOwner, submitting, error, onClose, onSubmit
}: EmployeeModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users2 className="w-5 h-5" /> {editTarget ? "Edit Employee Profile" : "Register Employee"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)]"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Full Name *</label>
            <input type="text" value={form.fullName} onChange={e => setForm((f: any) => ({ ...f, fullName: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg" autoFocus />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Email Address *</label>
            <input type="email" value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg" />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Password {editTarget ? "(Optional)" : "*"}</label>
            <PasswordInput value={form.password} onChange={e => setForm((f: any) => ({ ...f, password: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg" />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Assigned Role *</label>
            <select value={form.role} onChange={e => setForm((f: any) => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg">
              <option value="">— Select Role —</option>
              {roles.map(r => <option key={r.id} value={r.code}>{r.name}</option>)}
            </select>
          </div>

          {isOwner && (
            <div>
              <label className="block font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Branch Outlet</label>
              <select value={form.branchId} onChange={e => setForm((f: any) => ({ ...f, branchId: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg">
                <option value="">All Branches / Master</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {form.role === "WAITER" && (
            <div>
              <label className="block font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Assigned Tables</label>
              <div className="max-h-28 overflow-y-auto border border-[var(--surface-border)] rounded-lg p-2 space-y-1">
                {allTables.map(t => {
                  const checked = form.tableIds.includes(t.id)
                  return (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={() => setForm((f: any) => ({
                        ...f, tableIds: checked ? f.tableIds.filter((id: string) => id !== t.id) : [...f.tableIds, t.id]
                      }))} className="rounded" />
                      <span>Table {t.table_number}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {error && <p className="text-red-500 font-semibold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-lg hover:bg-[var(--surface-hover)]">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-[var(--color-primary-600)] text-white rounded-lg flex items-center justify-center gap-1">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Staff
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
