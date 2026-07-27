"use client"
import * as React from "react"
import { ArrowLeft } from "lucide-react"
import CustomizationSelector from "./CustomizationSelector"
import ItemHero from "./ItemHero"
import { MenuItem, Category, CartItem, areCustsEqual } from "./types"

interface Props {
  selectedItem: MenuItem
  setSelectedItem: (item: MenuItem | null) => void
  categories: Category[]
  selectedCustomizationBadges: Array<{ name: string; image_url?: string | null; extraPrice: number }>
  itemCustomizations: Record<string, string | string[]>
  setItemCustomizations: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>
  itemNotes: string
  setItemNotes: (notes: string) => void

  addToCartFromDetail: () => void
  getCustomizedItemPrice: (item: MenuItem, custs: Record<string, string | string[]>) => number
  themeCard: string
  themeBorder: string
  theme: "dark" | "light"
  cart: CartItem[]
  updateCartQty: (idx: number, delta: number) => void
}

export default function ItemDetailModal({
  selectedItem,
  setSelectedItem,
  categories,
  selectedCustomizationBadges,
  itemCustomizations,
  setItemCustomizations,
  itemNotes,
  setItemNotes,

  addToCartFromDetail,
  getCustomizedItemPrice,
  themeCard,
  themeBorder,
  theme,
  cart,
  updateCartQty,
}: Props) {
  const cartItemIdx = (cart || []).findIndex(
    c => c.menuItem.id === selectedItem.id &&
      areCustsEqual(c.selectedCustomizations, itemCustomizations) &&
      (c.notes || "") === (itemNotes || "")
  )
  return (
    <div className={`fixed inset-0 z-50 ${theme === "dark" ? "bg-[#0c0c0c] text-white" : "bg-white text-gray-900"} flex flex-col w-full h-[100dvh] overflow-hidden`}>
      <div className="absolute top-4 left-4 z-30">
        <button
          onClick={() => setSelectedItem(null)}
          className="bg-black/60 backdrop-blur-md hover:bg-black/80 text-white p-2.5 rounded-full shadow-lg border border-white/10 active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <ItemHero selectedItem={selectedItem} selectedCustomizationBadges={selectedCustomizationBadges} />

      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-xl mx-auto w-full space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">{selectedItem.display_name}</h2>
            <p className="text-[10px]  font-bold mt-1 uppercase tracking-wider">
              {categories.find(c => c.id === selectedItem.category_id)?.name || "Dish"}
            </p>

          </div>
          <div className="flex items-center flex-col">
            <span className="text-amber-500 font-extrabold text-xl shrink-0">
              ${parseFloat(selectedItem.price.toString()).toFixed(2)}
            </span>
            {(selectedItem.prep_time ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-green-400 px-2 py-0.5 rounded-full">
                ⏱ ~{selectedItem.prep_time} min prep
              </span>
            )}
          </div>

        </div>

        {selectedItem.description && (
          <div className={`space-y-1 p-0.5`}>
            <h4 className="text-xs font-semibold uppercase tracking-widest opacity-90">Description</h4>
            <p className="text-xs leading-relaxed opacity-90">{selectedItem.description}</p>
          </div>
        )}

        {selectedItem.customizations && selectedItem.customizations.length > 0 && (
          <CustomizationSelector
            customizations={selectedItem.customizations}
            itemCustomizations={itemCustomizations}
            setItemCustomizations={setItemCustomizations}
            themeCard={themeCard}
            theme={theme}
          />
        )}

        <div>
          <label className="text-xs font-semibold opacity-90 mb-1.5 block">Special Instructions</label>
          <textarea
            rows={2}
            placeholder="E.g., no onion, extra spicy, gluten allergy..."
            value={itemNotes}
            onChange={e => setItemNotes(e.target.value)}
            style={{
              backgroundColor: theme === "dark" ? "#1c1c1e" : "#ffffff",
              color: theme === "dark" ? "#ffffff" : "#111827",
              borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "#e5e7eb"
            }}
            className="w-full border rounded-xl px-3 py-2.5 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className={`shrink-0 border-t ${themeBorder} ${theme === "dark" ? "bg-[#0b0f19]" : "bg-white"} px-5 py-4 w-full`}>
        <div className="max-w-xl mx-auto flex items-center gap-4">
          {cartItemIdx >= 0 ? (
            <div className="flex-1 flex items-center justify-between bg-[#FFC72C] text-black font-black py-2 px-4 rounded-xl shadow-md">
              <button
                type="button"
                onClick={() => updateCartQty(cartItemIdx, -1)}
                className="w-10 h-10 rounded-lg bg-black/10 hover:bg-black/20 flex items-center justify-center font-black text-xl active:scale-95 transition-all"
              >
                −
              </button>
              <div className="flex flex-col items-center">
                <span className="text-sm font-black leading-tight">{cart[cartItemIdx].quantity} in Cart</span>
                <span className="text-[11px] font-extrabold opacity-85">
                  ${(getCustomizedItemPrice(selectedItem, itemCustomizations) * cart[cartItemIdx].quantity).toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateCartQty(cartItemIdx, 1)}
                className="w-10 h-10 rounded-lg bg-black/10 hover:bg-black/20 flex items-center justify-center font-black text-xl active:scale-95 transition-all"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={addToCartFromDetail}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl transition-all shadow-md shadow-amber-500/10 text-xs sm:text-sm"
            >
              Add to Cart — ${getCustomizedItemPrice(selectedItem, itemCustomizations).toFixed(2)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
