"use client"
import { createPortal } from "react-dom"
import { ArrowLeft } from "lucide-react"
import type { MenuItem, CartItem, Category } from "./types"

interface Props {
  selectedItem: MenuItem | null
  categories: Category[]
  itemCustomizations: Record<string, string | string[]>
  itemNotes: string
  itemQty: number
  onClose: () => void
  onAddToCart: () => void
  setItemQty: (fn: (q: number) => number) => void
  setItemNotes: (v: string) => void
  setItemCustomizations: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>
  getCustomizedPrice: (item: MenuItem, custs: Record<string, string | string[]>) => number
}

export function ItemDetailOverlay({ selectedItem, categories, itemCustomizations, itemNotes, itemQty, onClose, onAddToCart, setItemQty, setItemNotes, setItemCustomizations, getCustomizedPrice }: Props) {
  if (!selectedItem || typeof window === "undefined") return null

  return createPortal(
    <div className="absolute inset-0 z-50 bg-[var(--background)] text-[var(--foreground)] flex flex-col w-full h-full overflow-y-auto">
      <div className="absolute top-4 left-4 z-10">
        <button type="button" onClick={onClose} className="hover:bg-black/80 text-white p-2 rounded-full border border-white/10 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="relative h-56 w-full shrink-0 flex items-center justify-center border-b border-[var(--surface-border)]">
        {selectedItem.image_url ? <img src={selectedItem.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-5xl">Item image</span>}
        <div className="absolute inset-0 rent" />
      </div>

      <div className="flex-1 px-5 py-6 max-w-xl mx-auto w-full space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black">{selectedItem.display_name}</h2>
            <p className="text-[9px] font-bold mt-0.5 uppercase tracking-wider">{categories.find(c => c.id === selectedItem.category_id)?.name || "Menu Item"}</p>
            {(selectedItem.prep_time ?? 0) > 0 && <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">⏱ ~{selectedItem.prep_time} min prep</span>}
          </div>
          <span className="font-extrabold text-lg shrink-0">${parseFloat(selectedItem.price.toString()).toFixed(2)}</span>
        </div>

        {selectedItem.description && (
          <div className="space-y-1 rounded-xl p-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-60">Description</h4>
            <p className="text-xs leading-relaxed opacity-90">{selectedItem.description}</p>
          </div>
        )}

        {selectedItem.customizations && selectedItem.customizations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider opacity-60">Customizations</h3>
            {selectedItem.customizations.map(cust => (
              <div key={cust.key} className="space-y-2 border border-[var(--surface-border)] rounded-xl p-3">
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <span>{cust.label}</span>
                  {cust.multiple && <span className="text-[8px] border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">Multi-select</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cust.values.map(val => {
                    const valName = typeof val === "string" ? val : val.name
                    const valPrice = typeof val === "string" ? 0 : val.extraPrice
                    const selected = cust.multiple ? (itemCustomizations[cust.key] as string[] || []).includes(valName) : itemCustomizations[cust.key] === valName
                    return (
                      <button key={valName} type="button" onClick={() => {
                        if (cust.multiple) {
                          const current = (itemCustomizations[cust.key] as string[] || [])
                          const updated = selected ? current.filter(v => v !== valName) : [...current, valName]
                          setItemCustomizations(prev => ({ ...prev, [cust.key]: updated }))
                        } else {
                          setItemCustomizations(prev => ({ ...prev, [cust.key]: selected ? "" : valName }))
                        }
                      }} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selected ? "order-amber-500 shadow-md" : "border-[var(--surface-border)] opacity-90 hover:bg-[var(--surface-hover)]/80"}`}>
                        {valName} {valPrice > 0 ? `(+$${valPrice.toFixed(2)})` : ""}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-semibold opacity-60 mb-1">Item Notes</label>
          <textarea rows={2} placeholder="e.g. no onions, extra cheese..." value={itemNotes} onChange={e => setItemNotes(e.target.value)}
            className="w-full border border-[var(--surface-border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-3 border border-[var(--surface-border)] rounded-xl px-3 py-2">
            <button type="button" onClick={() => setItemQty(q => Math.max(1, q - 1))} className="font-bold text-base hover:text-amber-500">−</button>
            <span className="font-extrabold text-sm w-4 text-center">{itemQty}</span>
            <button type="button" onClick={() => setItemQty(q => q + 1)} className="font-bold text-base hover:text-amber-500">+</button>
          </div>
          <button type="button" onClick={onAddToCart} className="flex-1 hover:bg-amber-400 font-black py-3 rounded-xl transition-all shadow-md text-xs sm:text-sm">
            Add to Cart — ${(getCustomizedPrice(selectedItem, itemCustomizations) * itemQty).toFixed(2)}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
