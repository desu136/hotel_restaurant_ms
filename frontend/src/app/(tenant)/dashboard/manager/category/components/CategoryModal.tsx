"use client"

import * as React from "react"
import { Tag, X, Loader2, Check } from "lucide-react"

interface Branch { id: string; name: string }

interface CategoryModalProps {
  show: boolean
  editTarget: any | null
  isBranchManager: boolean
  form: { name: string; isMaster: boolean; branchId: string; parentId: string }
  setForm: React.Dispatch<React.SetStateAction<any>>
  branches: Branch[]
  rootMasterCats: any[]
  nonMasterBranchCats: any[]
  isAlreadyParent: boolean
  submitting: boolean
  error: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function CategoryModal({
  show, editTarget, isBranchManager, form, setForm, branches, rootMasterCats,
  nonMasterBranchCats, isAlreadyParent, submitting, error, onClose, onSubmit
}: CategoryModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {editTarget ? "Edit Category" : "Add Category"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Category Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[var(--surface-border)] rounded-lg text-sm" autoFocus />
          </div>

          {!editTarget && !isBranchManager && (
            <div className="flex items-center gap-2 py-1">
              <input type="checkbox" id="isMasterCat" checked={form.isMaster}
                onChange={e => setForm((f: any) => ({ ...f, isMaster: e.target.checked, parentId: "" }))}
                className="w-4 h-4 rounded text-[var(--color-primary-600)]" />
              <label htmlFor="isMasterCat" className="text-sm font-semibold cursor-pointer select-none">
                Broadcast as Master Category to all branches
              </label>
            </div>
          )}

          {!form.isMaster && !editTarget && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Target Branch <span className="text-red-500">*</span></label>
              {isBranchManager ? (
                <p className="px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm text-[var(--muted)]">
                  {branches.find(b => b.id === form.branchId)?.name ?? "Your Branch"}
                </p>
              ) : (
                <select value={form.branchId} onChange={e => setForm((f: any) => ({ ...f, branchId: e.target.value, parentId: "" }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)]/10 border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none">
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
            </div>
          )}

          {!isAlreadyParent && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Parent Category <span className="text-xs text-[var(--muted)] font-normal">(optional)</span>
              </label>
              <select value={form.parentId} onChange={e => setForm((f: any) => ({ ...f, parentId: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none">
                <option value="">None — Top-level category</option>
                {(form.isMaster ? rootMasterCats : nonMasterBranchCats.filter(c => c.branch_id === form.branchId && !c.parent_id))
                  .filter(c => !editTarget || c.id !== editTarget.id)
                  .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                }
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border rounded-lg text-sm hover:bg-[var(--surface-hover)]">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] text-[var(--background)] rounded-lg text-sm flex items-center justify-center gap-1">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
