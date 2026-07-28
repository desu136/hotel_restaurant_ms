"use client"
import * as React from "react"
import { Users2, X, Loader2, Check } from "lucide-react"
import { PasswordInput } from "@/components/ui/password-input"

export interface EmployeeFormData {
  fullName: string; email: string; phone: string; password: string
  branchId: string; role: string; status: string; tableIds: string[]
}

interface Props {
  show: boolean
  editTarget: any | null
  form: EmployeeFormData
  setForm: React.Dispatch<React.SetStateAction<EmployeeFormData>>
  branches: { id: string; name: string }[]
  roles: { id: string; code: string; name: string }[]
  allTables: { id: string; table_number: string }[]
  isOwner: boolean
  currentUser?: any
  submitting: boolean
  error: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function EmployeeFormModal({ show, editTarget, form, setForm, branches, roles, allTables, isOwner, currentUser, submitting, error, onClose, onSubmit }: Props) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--surface)] flex items-center justify-between p-6 pb-4 border-b border-[var(--surface-border)]">
          <h2 className="text-xl font-bold flex items-center gap-2"><Users2 className="w-5 h-5" />{editTarget ? "Edit Employee" : "Add Employee"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)]"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="e.g. Abebe Kebede"
                className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="employee@example.com"
                className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+251 900 000 000"
                className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Password {!editTarget && <span className="text-red-500">*</span>}
                {editTarget && <span className="text-[var(--muted)] font-normal ml-1 text-xs">(leave blank to keep)</span>}
              </label>
              <PasswordInput value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" className="w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Assign Branch</label>
              <select value={form.branchId} onChange={e => isOwner && setForm(f => ({ ...f, branchId: e.target.value }))} disabled={!isOwner}
                className={`w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none ${!isOwner ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {isOwner && <option value="">No specific branch (HQ / All)</option>}
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {!isOwner && <p className="text-xs text-[var(--muted)] mt-1">Automatically assigned to your branch.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role <span className="text-red-500">*</span></label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none">
                <option value="">Select Role</option>
                {roles?.filter(r => {
                  if (r.code === "SUPER_ADMIN" || r.code === "OWNER") return false
                  if (currentUser?.tenant?.business_type === "RESTAURANT" && r.code === "RECEPTIONIST") return false
                  return true
                }).map(r => <option key={r.id} value={r.code}>{r.name}</option>)}
              </select>
            </div>
            {editTarget && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            )}
          </div>
          {form.role === "WAITER" && (
            <div className="border border-[var(--surface-border)] bg-[var(--surface-hover)]/30 rounded-xl p-4 space-y-2.5">
              <span className="block text-sm font-bold">Assign Tables for Waiter 🪑</span>
              <p className="text-xs text-[var(--muted)]">Ready orders from these tables will be routed to this waiter.</p>
              {allTables.length === 0 ? (
                <p className="text-xs text-[var(--muted)] italic">No registered tables found. Please register tables first.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                  {allTables.map(table => {
                    const isChecked = form.tableIds.includes(table.id)
                    return (
                      <button key={table.id} type="button"
                        onClick={() => setForm(f => ({ ...f, tableIds: isChecked ? f.tableIds.filter(id => id !== table.id) : [...f.tableIds, table.id] }))}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold select-none transition-all ${isChecked ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)] shadow-sm" : "border-[var(--surface-border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--color-primary-500)]/40"}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />Table {table.table_number}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-[var(--surface-border)] rounded-lg text-sm font-medium hover:bg-[var(--surface-hover)]">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary-600)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-500)] disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editTarget ? "Save Changes" : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
