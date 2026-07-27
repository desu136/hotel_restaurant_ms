"use client"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ShoppingBag, Search, Plus } from "lucide-react"
import type { Table, MenuItem, CartItem, Category } from "./types"

interface Props {
  show: boolean
  selectedTable: string
  myTables: Table[]
  cart: CartItem[]
  orderNotes: string
  orderModalView: "catalog" | "ticket"
  searchTerm: string
  parentCategories: Category[]
  subCategories: Category[]
  filteredMenuItems: MenuItem[]
  activeParentId: string
  activeSubCatId: string
  cartTotal: number
  cartCount: number
  error: string
  setSearchTerm: (v: string) => void
  setActiveParentId: (v: string) => void
  setActiveSubCatId: (v: string) => void
  setOrderModalView: (v: "catalog" | "ticket") => void
  setOrderNotes: (v: string) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onAddToCartDirectly: (item: MenuItem) => void
  onUpdateCartQty: (idx: number, delta: number) => void
  onOpenItemDetail: (item: MenuItem) => void
}

export function OrderModal({ show, selectedTable, myTables, cart, orderNotes, orderModalView, searchTerm, parentCategories, subCategories, filteredMenuItems, activeParentId, activeSubCatId, cartTotal, cartCount, error, setSearchTerm, setActiveParentId, setActiveSubCatId, setOrderModalView, setOrderNotes, onClose, onSubmit, onAddToCartDirectly, onUpdateCartQty, onOpenItemDetail }: Props) {
  if (!show || typeof window === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[var(--background)] text-[var(--foreground)] w-full h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[var(--surface-border)] flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black">{selectedTable ? `Order for Table ${myTables.find(t => t.id === selectedTable)?.table_number || ""}` : "New Table Order"}</h2>
          <p className="text-[10px]">Select items from categories and customize to add to ticket.</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-hover)] transition-colors">✕</button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Catalog view */}
          <div className={`flex-1 flex flex-col min-h-0 ${orderModalView === "catalog" ? "" : "hidden"}`}>
            <div className="p-4 border-b border-[var(--surface-border)] space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3" />
                <Input placeholder="Search menu items..." className="pl-9 h-10 border-[var(--surface-border)] text-xs rounded-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {parentCategories.map(pc => (
                  <button key={pc.id} type="button" onClick={() => { setActiveParentId(pc.id); setActiveSubCatId("all") }}
                    className={`shrink-0 px-4 py-2 rounded-full text-[11px] font-bold transition-all ${activeParentId === pc.id ? "shadow-md shadow-amber-500/10" : "hover:bg-[var(--surface-hover)]/80"}`}>
                    {pc.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden min-h-0">
              <div className="w-24 border-r border-[var(--surface-border)] overflow-y-auto shrink-0 py-2">
                {parentCategories.length > 0 && (
                  <button type="button" onClick={() => setActiveSubCatId("all")} className={`w-full text-left px-3 py-3 text-[11px] font-medium border-l-2 transition-all leading-snug ${activeSubCatId === "all" ? "border-amber-500 font-black" : "border-transparent hover:bg-[var(--surface-hover)]"}`}>All Items</button>
                )}
                {subCategories.map(sc => (
                  <button key={sc.id} type="button" onClick={() => setActiveSubCatId(sc.id)} className={`w-full text-left px-3 py-3 text-[11px] font-medium border-l-2 transition-all leading-snug ${activeSubCatId === sc.id ? "border-amber-500 font-black" : "border-transparent hover:bg-[var(--surface-hover)]"}`}>
                    {sc.name}
                  </button>
                ))}
              </div>

              <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${cartCount > 0 ? "pb-28" : "pb-4"}`}>
                {filteredMenuItems.map(item => {
                  const inCartCount = cart.filter(c => c.menuItemId === item.id).reduce((s, c) => s + c.quantity, 0)
                  return (
                    <div key={item.id} onClick={() => onOpenItemDetail(item)} className="w-full border border-[var(--surface-border)] rounded-2xl flex gap-3.5 p-3 hover:border-amber-500/20 transition-all cursor-pointer relative group select-none min-h-[96px]">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[var(--background)] border border-[var(--surface-border)] flex items-center justify-center">
                        {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🍽️</span>}
                      </div>
                      <div className="flex-1 min-w-0 pr-20 flex flex-col justify-between">
                        <div>
                          <h3 className="font-extrabold text-sm leading-tight line-clamp-1 group-hover:text-amber-500 transition-colors">{item.display_name}</h3>
                          {item.description && <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed">{item.description}</p>}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="font-black text-sm">${parseFloat(item.price.toString()).toFixed(2)}</span>
                          {(item.prep_time ?? 0) > 0 && <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">⏱ ~{item.prep_time}m</span>}
                        </div>
                      </div>
                      <div className="absolute bottom-3 right-3" onClick={e => e.stopPropagation()}>
                        {inCartCount > 0 ? (
                          <div className="flex items-center gap-2 rounded-xl px-2.5 py-1 shadow-lg font-black text-xs">
                            <button type="button" onClick={() => { const idx = cart.findIndex(c => c.menuItemId === item.id && Object.keys(c.selectedCustomizations).length === 0); if (idx >= 0) onUpdateCartQty(idx, -1) }} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 text-sm font-bold">−</button>
                            <span className="w-4 text-center font-black">{inCartCount}</span>
                            <button type="button" onClick={() => onAddToCartDirectly(item)} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 text-sm font-bold">+</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => onAddToCartDirectly(item)} className="hover:bg-amber-400 active:scale-95 rounded-xl px-4 py-1.5 text-xs font-black shadow-md transition-all flex items-center gap-1">
                            <span>Add</span><Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {filteredMenuItems.length === 0 && <div className="text-center py-12 text-xs">No items found matching search filters.</div>}
              </div>
            </div>
          </div>

          {/* Ticket view */}
          <div className={`w-full flex-1 p-5 md:p-8 flex flex-col min-h-0 shrink-0 ${orderModalView === "ticket" ? "flex" : "hidden"}`}>
            <form onSubmit={onSubmit} className="flex flex-col h-full min-h-0 gap-4">
              <Button type="button" onClick={() => setOrderModalView("catalog")} className="w-full sm:w-auto self-start hover:bg-zinc-700 font-extrabold text-xs py-2.5 px-5 rounded-xl mb-4 flex items-center justify-center gap-1.5 shadow-md">
                <ArrowLeft className="w-4 h-4" /> Back to Menu
              </Button>
              <div className="bg-[var(--background)] border border-[var(--surface-border)] rounded-xl p-3 flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider">Table</span>
                <span className="text-xs font-black uppercase">Table {myTables.find(t => t.id === selectedTable)?.table_number || "Selected"}</span>
              </div>
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto py-2 border-y border-[var(--surface-border)] space-y-3">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">Order Ticket Items</span>
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-2.5 bg-[var(--background)] border border-[var(--surface-border)] rounded-xl p-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs leading-tight truncate">{item.name}</p>
                      {Object.entries(item.selectedCustomizations).map(([k, v]) => (
                        <p key={k} className="text-[9px] font-semibold mt-0.5">• {k}: {Array.isArray(v) ? v.join(", ") : v}</p>
                      ))}
                      {item.notes && <p className="text-[9px] italic mt-0.5 line-clamp-1">"{item.notes}"</p>}
                      {(item.prepTime ?? 0) > 0 && <p className="text-[9px] text-amber-500 font-bold mt-1">⏱ ~{item.prepTime}m</p>}
                    </div>
                    <div className="flex flex-col items-end justify-between shrink-0">
                      <span className="font-extrabold text-xs">${(item.price * item.quantity).toFixed(2)}</span>
                      <div className="flex items-center gap-1.5 rounded-lg px-1.5 py-0.5">
                        <button type="button" onClick={() => onUpdateCartQty(idx, -1)} className="font-bold text-[10px] w-3.5 h-3.5 flex items-center justify-center hover:text-amber-500">−</button>
                        <span className="font-bold text-[10px] min-w-[8px] text-center">{item.quantity}</span>
                        <button type="button" onClick={() => onUpdateCartQty(idx, 1)} className="font-bold text-[10px] w-3.5 h-3.5 flex items-center justify-center hover:text-amber-500">+</button>
                      </div>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && <div className="flex-1 flex flex-col items-center justify-center text-center py-12"><ShoppingBag className="w-8 h-8 mb-2 opacity-50" /><p className="text-xs">Cart is empty</p></div>}
              </div>
              <div className="space-y-1 shrink-0">
                <label className="text-[10px] font-bold uppercase tracking-wider">Chef Instructions</label>
                <Input placeholder="E.g., Extra hot sauce, no sesame..." value={orderNotes} onChange={e => setOrderNotes(e.target.value)} className="bg-[var(--background)] border-[var(--surface-border)] text-xs" />
              </div>
              <div className="mt-auto pt-3 border-t border-[var(--surface-border)] space-y-3 shrink-0">
                {Math.max(...cart.map(c => c.prepTime ?? 0), 0) > 0 && (
                  <div className="flex justify-between items-center text-xs text-[var(--muted)]">
                    <span>Est. Prep Time:</span><span className="font-bold text-amber-500">~{Math.max(...cart.map(c => c.prepTime ?? 0), 0)} mins</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold opacity-80">Total:</span><span className="font-black text-sm">${cartTotal.toFixed(2)}</span>
                </div>
                {error && <p className="text-[10px] text-red-500 bg-red-950/20 border border-red-500/20 rounded-lg p-2 leading-relaxed">{error}</p>}
                <Button type="submit" disabled={!selectedTable || cart.length === 0} className="w-full hover:bg-amber-400 font-black text-xs py-3.5 rounded-xl transition-all">
                  Place Order · ${cartTotal.toFixed(2)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Floating cart button */}
      {orderModalView === "catalog" && cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] w-[calc(100%-2rem)] max-w-lg">
          <button type="button" onClick={() => setOrderModalView("ticket")} className="w-full flex items-center justify-between gap-4 hover:bg-amber-400 active:scale-[0.98] px-5 py-4 rounded-2xl shadow-[0_8px_40px_rgba(245,158,11,0.45)] transition-all font-black">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-2"><ShoppingBag className="w-5 h-5 text-black" /></div>
              <div className="text-left">
                <p className="text-sm font-black leading-none">${cartTotal.toFixed(2)}</p>
                <p className="text-[11px] font-semibold opacity-75 mt-0.5">A total of {cartCount} item{cartCount !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5"><span className="text-sm font-black">Proceed to Order</span></div>
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}
