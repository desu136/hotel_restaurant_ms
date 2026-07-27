"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus, Pencil, Trash2, Loader2, Check } from "lucide-react"

interface CategoryTreeItemProps {
  mainCat: any
  children: any[]
  isExpanded: boolean
  onToggleExpand: (id: string) => void
  onOpenEdit: (cat: any) => void
  onDelete: (id: string) => void
  deletingCatId: string | null
  addingSubcatParentId: string | null
  onSetAddingSubcatParentId: (id: string | null) => void
  newSubcatName: string
  setNewSubcatName: (v: string) => void
  subcatAdding: boolean
  onAddSubcategory: (parentId: string) => void
  editingSubcatId: string | null
  editingSubcatName: string
  setEditingSubcatId: (id: string | null) => void
  setEditingSubcatName: (v: string) => void
  onUpdateSubcategory: (id: string, parentId: string) => void
}

export function CategoryTreeItem({
  mainCat, children, isExpanded, onToggleExpand, onOpenEdit, onDelete, deletingCatId,
  addingSubcatParentId, onSetAddingSubcatParentId, newSubcatName, setNewSubcatName,
  subcatAdding, onAddSubcategory, editingSubcatId, editingSubcatName, setEditingSubcatId,
  setEditingSubcatName, onUpdateSubcategory
}: CategoryTreeItemProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-hover)] hover:border-[var(--color-primary-600)]/30 transition-colors">
        <div className="flex items-center gap-2 cursor-pointer select-none flex-1 py-0.5" onClick={() => onToggleExpand(mainCat.id)}>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-[var(--color-primary-600)] shrink-0" /> : <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0" />}
          {isExpanded ? <FolderOpen className="w-4 h-4 text-[var(--color-primary-600)] shrink-0" /> : <Folder className="w-4 h-4 text-[var(--muted)] shrink-0" />}
          <span className="font-bold text-sm">{mainCat.name}</span>
          {children.length > 0 && <span className="text-[10px] text-[var(--color-primary-600)] font-extrabold px-2 py-0.5 bg-[var(--color-primary-600)]/10 rounded-full border border-[var(--color-primary-600)]/20">{children.length} sub</span>}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => { onToggleExpand(mainCat.id); onSetAddingSubcatParentId(addingSubcatParentId === mainCat.id ? null : mainCat.id); setNewSubcatName("") }}
            className="flex items-center gap-1 h-7 px-2.5 text-xs font-bold text-[var(--color-primary-600)] hover:bg-[var(--color-primary-600)]/10 rounded-md transition-colors">
            <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sub</span>
          </button>
          <button onClick={() => onOpenEdit(mainCat)} className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)] transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => onDelete(mainCat.id)} disabled={deletingCatId === mainCat.id} className="p-1.5 rounded text-[var(--muted)] hover:text-red-500 transition-colors">
            {deletingCatId === mainCat.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pl-7 space-y-1.5 border-l-2 border-[var(--color-primary-600)]/15 ml-5">
          {addingSubcatParentId === mainCat.id && (
            <form onSubmit={e => { e.preventDefault(); onAddSubcategory(mainCat.id) }} className="flex gap-2 items-center p-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-hover)]/40">
              <input autoFocus placeholder="Subcategory name…" value={newSubcatName} onChange={e => setNewSubcatName(e.target.value)} className="flex-1 h-8 px-3 text-xs bg-[var(--surface)] border border-[var(--surface-border)] rounded-md focus:outline-none" />
              <button type="submit" disabled={!newSubcatName.trim() || subcatAdding} className="h-8 px-3 text-xs font-bold bg-[var(--color-primary-600)] text-[var(--background)] rounded-md hover:bg-[var(--color-primary-500)] disabled:opacity-50 transition-colors flex items-center gap-1">
                {subcatAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
              </button>
              <button type="button" onClick={() => onSetAddingSubcatParentId(null)} className="h-8 px-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded-md border border-[var(--surface-border)] transition-colors">Cancel</button>
            </form>
          )}

          {children.map(sub => (
            <div key={sub.id} className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-hover)]/20 hover:border-[var(--color-primary-600)]/20 transition-colors">
              {editingSubcatId === sub.id ? (
                <div className="flex-1 flex gap-2 items-center">
                  <input autoFocus value={editingSubcatName} onChange={e => setEditingSubcatName(e.target.value)} className="flex-1 h-7 px-2 text-xs bg-[var(--surface)] border border-[var(--surface-border)] rounded focus:outline-none" />
                  <button onClick={() => onUpdateSubcategory(sub.id, mainCat.id)} className="h-7 px-3 text-xs font-bold bg-[var(--color-primary-600)] text-[var(--background)] rounded hover:bg-[var(--color-primary-500)] transition-colors">Save</button>
                  <button onClick={() => setEditingSubcatId(null)} className="h-7 px-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded border border-[var(--surface-border)] transition-colors">Cancel</button>
                </div>
              ) : (
                <>
                  <span className="text-xs font-semibold">{sub.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingSubcatId(sub.id); setEditingSubcatName(sub.name) }} className="p-1 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)] transition-colors"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => onDelete(sub.id)} disabled={deletingCatId === sub.id} className="p-1 rounded text-[var(--muted)] hover:text-red-500 transition-colors">
                      {deletingCatId === sub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {children.length === 0 && addingSubcatParentId !== mainCat.id && (
            <p className="text-[10px] text-[var(--muted)] italic pl-2 py-1">No subcategories yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
