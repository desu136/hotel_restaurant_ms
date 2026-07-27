"use client"
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import SlideshowImage from "./SlideshowImage"
import CustomizationSelector from "./CustomizationSelector"
import { MenuItem, Category, SLOTS } from "./types"

interface Props {
  selectedItem: MenuItem
  setSelectedItem: (item: MenuItem | null) => void
  categories: Category[]
  selectedCustomizationBadges: Array<{ name: string; image_url?: string | null; extraPrice: number }>
  itemCustomizations: Record<string, string | string[]>
  setItemCustomizations: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>
  itemNotes: string
  setItemNotes: (notes: string) => void
  itemQty: number
  setItemQty: React.Dispatch<React.SetStateAction<number>>
  addToCartFromDetail: () => void
  getCustomizedItemPrice: (item: MenuItem, custs: Record<string, string | string[]>) => number
  themeCard: string
  themeBorder: string
  theme: "dark" | "light"
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
  itemQty,
  setItemQty,
  addToCartFromDetail,
  getCustomizedItemPrice,
  themeCard,
  themeBorder,
  theme,
}: Props) {
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

      <div className="relative h-52 sm:h-80 bg-gray-950 w-full shrink-0 flex items-center justify-center border-b border-white/5 overflow-hidden">
        {selectedItem.image_url ? (
          <motion.div
            className="w-full h-full"
            animate={{ scale: selectedCustomizationBadges.length > 0 ? [1, 1.04, 1] : 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            key={selectedCustomizationBadges.length}
          >
            {(() => {
              const allImgs = [selectedItem.image_url, ...(Array.isArray(selectedItem.image_urls) ? selectedItem.image_urls : [])].filter(Boolean) as string[]
              return <SlideshowImage images={allImgs} alt={selectedItem.display_name} className="w-full h-full" interval={3000} />
            })()}
          </motion.div>
        ) : (
          <div className="text-center space-y-2 text-gray-500">
            <span className="text-6xl block animate-pulse">🍽️</span>
            <span className="text-xs font-semibold">No Image Available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

        <AnimatePresence>
          {selectedCustomizationBadges.map((choice, index) => {
            const slot = SLOTS[index % SLOTS.length]
            return (
              <motion.div
                key={choice.name}
                initial={{ scale: 0.1, opacity: 1, y: 600, x: index % 2 === 0 ? 120 : -120 }}
                animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
                exit={{ scale: 0, opacity: 2, y: 150 }}
                transition={{ type: "spring", stiffness: 300, damping: 10, delay: 0.05 * index }}
                style={{ position: "absolute", ...slot }}
                className="z-20 flex flex-col items-center pointer-events-none select-none"
              >
                {choice.image_url ? (
                  <>
                    <div className="bg-black/85 backdrop-blur-md border border-amber-500/30 text-white px-2 py-0.5 rounded-full text-[9px] font-black shadow-lg mb-1 whitespace-nowrap">
                      {choice.name} {choice.extraPrice > 0 ? `(+$${choice.extraPrice.toFixed(2)})` : ""}
                    </div>
                    <div className="w-14 h-24 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-none bg-gray-900 shadow-2xl p-0.5">
                      <img src={choice.image_url} alt="" className="w-full h-full object-cover rounded-full" />
                    </div>
                  </>
                ) : (
                  <div className="bg-amber-500 text-black px-3 py-1.5 rounded-full text-[10px] font-black shadow-2xl border border-black/10 flex items-center gap-1.5">
                    <span>✨</span>
                    <span className="whitespace-nowrap">{choice.name}</span>
                    {choice.extraPrice > 0 && <span className="opacity-75">(+${choice.extraPrice.toFixed(2)})</span>}
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 max-w-xl mx-auto w-full space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">{selectedItem.display_name}</h2>
            <p className="text-[10px] text-amber-500 font-bold mt-1 uppercase tracking-wider">
              {categories.find(c => c.id === selectedItem.category_id)?.name || "Dish"}
            </p>
            {(selectedItem.prep_time ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-amber-400 bg-[#FFC72C]/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                ⏱ ~{selectedItem.prep_time} min prep
              </span>
            )}
          </div>
          <span className="text-amber-500 font-extrabold text-xl shrink-0">
            ${parseFloat(selectedItem.price.toString()).toFixed(2)}
          </span>
        </div>

        {selectedItem.description && (
          <div className={`space-y-1 ${theme === "dark" ? "bg-white/5" : "bg-gray-100"} rounded-xl p-3.5`}>
            <h4 className="text-xs font-semibold uppercase tracking-widest opacity-60">Description</h4>
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
          <label className="block text-xs font-semibold opacity-60 mb-1.5">Special Instructions</label>
          <textarea
            rows={2}
            placeholder="E.g., no onion, extra spicy, gluten allergy..."
            value={itemNotes}
            onChange={e => setItemNotes(e.target.value)}
            className={`w-full ${theme === "dark" ? "bg-[#0b0f19]" : "bg-white"} border ${themeBorder} rounded-xl px-3.5 py-2.5 text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none`}
          />
        </div>
      </div>

      <div className={`shrink-0 border-t ${themeBorder} ${theme === "dark" ? "bg-[#0b0f19]" : "bg-white"} px-5 py-4 w-full`}>
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <div className={`flex items-center gap-3 ${theme === "dark" ? "bg-white/5" : "bg-gray-100"} border ${themeBorder} rounded-xl px-3 py-2`}>
            <button onClick={() => setItemQty(q => Math.max(1, q - 1))} className="font-bold text-base w-7 h-7 flex items-center justify-center hover:text-amber-500 transition-colors">
              −
            </button>
            <span className="font-extrabold text-sm w-5 text-center">{itemQty}</span>
            <button onClick={() => setItemQty(q => q + 1)} className="font-bold text-base w-7 h-7 flex items-center justify-center hover:text-amber-500 transition-colors">
              +
            </button>
          </div>
          <button
            onClick={addToCartFromDetail}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl transition-all shadow-md shadow-amber-500/10 text-xs sm:text-sm"
          >
            Add to Cart — ${(getCustomizedItemPrice(selectedItem, itemCustomizations) * itemQty).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  )
}
