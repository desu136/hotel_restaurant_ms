"use client"

import * as React from "react"
import { Utensils, X, Loader2, Check, Plus, Trash } from "lucide-react"

interface CustomizationValue { name: string; extraPrice: number; image_url?: string | null; recommended?: boolean }
interface Customization { key: string; label: string; multiple: boolean; values: CustomizationValue[] }

interface MenuItemModalProps {
  show: boolean
  editTarget: any | null
  isBranchManager: boolean
  form: {
    displayName: string; description: string; price: string; prepTime: string
    isMaster: boolean; branchId: string; categoryId: string; availability: boolean
    imageUrl: string; imageUrls: string[]
  }
  setForm: React.Dispatch<React.SetStateAction<any>>
  customizations: Customization[]
  setCustomizations: React.Dispatch<React.SetStateAction<Customization[]>>
  branches: { id: string; name: string }[]
  masterCategories: { id: string; name: string }[]
  branchCategories: { id: string; name: string; branch_id: string }[]
  submitting: boolean
  error: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onSingleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  imageUploading: boolean
}

export function MenuItemModal({
  show, editTarget, isBranchManager, form, setForm, customizations, setCustomizations,
  branches, masterCategories, branchCategories, submitting, error, onClose, onSubmit,
  onSingleImageUpload, imageUploading
}: MenuItemModalProps) {
  if (!show) return null

  const addCustomizationGroup = () => {
    const key = `custom_${Date.now()}`
    setCustomizations(prev => [...prev, { key, label: "", multiple: false, values: [{ name: "", extraPrice: 0 }] }])
  }

  const removeCustomizationGroup = (index: number) => {
    setCustomizations(prev => prev.filter((_, i) => i !== index))
  }

  const addChoiceValue = (groupIndex: number) => {
    setCustomizations(prev => prev.map((g, i) => i === groupIndex ? { ...g, values: [...g.values, { name: "", extraPrice: 0 }] } : g))
  }

  const removeChoiceValue = (groupIndex: number, valIndex: number) => {
    setCustomizations(prev => prev.map((g, i) => i === groupIndex ? { ...g, values: g.values.filter((_, vj) => vj !== valIndex) } : g))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Utensils className="w-5 h-5" /> {editTarget ? "Edit Menu Item" : "Add Dish / Menu Item"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)]"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Display Name *</label>
              <input type="text" value={form.displayName} onChange={e => setForm((f: any) => ({ ...f, displayName: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm" autoFocus />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Price ($) *</label>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm((f: any) => ({ ...f, price: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Prep Time (mins)</label>
              <input type="number" value={form.prepTime} onChange={e => setForm((f: any) => ({ ...f, prepTime: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm resize-none" />
            </div>
          </div>

          {!editTarget && !isBranchManager && (
            <div className="flex items-center gap-2 py-1">
              <input type="checkbox" id="isMasterMenu" checked={form.isMaster} onChange={e => setForm((f: any) => ({ ...f, isMaster: e.target.checked, categoryId: "" }))} className="w-4 h-4 rounded text-[var(--color-primary-600)]" />
              <label htmlFor="isMasterMenu" className="text-xs font-bold cursor-pointer select-none">Broadcast as Master Menu Item to all branches</label>
            </div>
          )}

          {!form.isMaster && !editTarget && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Target Branch *</label>
              <select value={form.branchId} onChange={e => setForm((f: any) => ({ ...f, branchId: e.target.value, categoryId: "" }))} className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm">
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Category</label>
            <select value={form.categoryId} onChange={e => setForm((f: any) => ({ ...f, categoryId: e.target.value }))} className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm">
              <option value="">No Category</option>
              {(form.isMaster ? masterCategories : branchCategories.filter(c => c.branch_id === form.branchId)).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Primary Image</label>
            <div className="flex items-center gap-3">
              {form.imageUrl && <img src={form.imageUrl} alt="preview" className="w-12 h-12 object-cover rounded-lg border" />}
              <label className="cursor-pointer">
                <span className="px-3 py-2 border border-dashed rounded-lg text-xs font-bold hover:bg-[var(--surface-hover)] inline-block">
                  {imageUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload Image"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={onSingleImageUpload} disabled={imageUploading} />
              </label>
            </div>
          </div>

          {/* Customization Options */}
          <div className="border-t border-[var(--surface-border)] pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Customization Groups ({customizations.length})</span>
              <button type="button" onClick={addCustomizationGroup} className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary-600)] hover:underline"><Plus className="w-3.5 h-3.5" /> Add Group</button>
            </div>
            {customizations.map((g, gi) => (
              <div key={g.key || gi} className="p-3 border border-[var(--surface-border)] rounded-xl bg-[var(--surface-hover)]/30 space-y-2">
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="Group Label (e.g. Size, Spice Level)" value={g.label} onChange={e => setCustomizations(prev => prev.map((item, i) => i === gi ? { ...item, label: e.target.value } : item))} className="flex-1 px-2.5 py-1 text-xs border rounded-md" />
                  <button type="button" onClick={() => removeCustomizationGroup(gi)} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><Trash className="w-3.5 h-3.5" /></button>
                </div>
                {g.values.map((v, vi) => (
                  <div key={vi} className="flex items-center gap-2 pl-2">
                    <input type="text" placeholder="Choice (e.g. Large)" value={v.name} onChange={e => setCustomizations(prev => prev.map((item, i) => i === gi ? { ...item, values: item.values.map((val, vj) => vj === vi ? { ...val, name: e.target.value } : val) } : item))} className="flex-1 px-2 py-1 text-xs border rounded" />
                    <input type="number" step="0.01" placeholder="+$ Extra" value={v.extraPrice} onChange={e => setCustomizations(prev => prev.map((item, i) => i === gi ? { ...item, values: item.values.map((val, vj) => vj === vi ? { ...val, extraPrice: Number(e.target.value) || 0 } : val) } : item))} className="w-20 px-2 py-1 text-xs border rounded" />
                    <button type="button" onClick={() => removeChoiceValue(gi, vi)} className="p-1 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addChoiceValue(gi)} className="text-[11px] font-bold text-[var(--color-primary-600)] pl-2 hover:underline">+ Add Choice</button>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-[var(--surface-hover)]">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-500)] flex items-center justify-center gap-1.5">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Dish
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
