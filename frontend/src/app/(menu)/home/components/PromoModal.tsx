"use client"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Promotion } from "./types"

interface Props {
  selectedPromo: Promotion | null
  setSelectedPromo: (p: Promotion | null) => void
  activeRestaurant: any
  sortedRestaurants: any[]
  selectedService: string
  theme: "dark" | "light"
}

export default function PromoModal({ selectedPromo, setSelectedPromo, activeRestaurant, sortedRestaurants, selectedService, theme }: Props) {
  const handleOrder = () => {
    if (!selectedPromo) return
    setSelectedPromo(null)
    const targetRestId = selectedPromo.restaurant_id || activeRestaurant?.id || sortedRestaurants[0]?.id
    if (!targetRestId) return
    const orderType = selectedService.toUpperCase() || "DINE_IN"
    let url = `/menu/${targetRestId}?orderType=${orderType}`
    if (selectedPromo.branch_id) url += `&branchId=${selectedPromo.branch_id}`
    if (selectedPromo.scope === "CATEGORY" && selectedPromo.category_id) url += `&categoryId=${selectedPromo.category_id}`
    else if (selectedPromo.scope === "MENU_ITEM" && selectedPromo.menu_item_id) url += `&menuItemId=${selectedPromo.menu_item_id}`
    localStorage.setItem("show_restaurants_popup", "false")
    window.location.href = url
  }

  return (
    <AnimatePresence>
      {selectedPromo && (
        <>
          <motion.div
            key="promo-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedPromo(null)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="promo-modal"
            initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
            className={`fixed bottom-0 inset-x-0 z-50 max-w-md mx-auto rounded-t-3xl border-t p-6 pb-8 flex flex-col gap-4 shadow-2xl ${
              theme === "dark" ? "bg-[#1c1c1e] border-white/[0.08] text-white" : "bg-white border-gray-200 text-gray-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase bg-[#DA291C] text-white px-2 py-0.5 rounded shadow-sm">
                {selectedPromo.type?.replace(/_/g, " ") || "PROMOTION"}
              </span>
              <button
                onClick={() => setSelectedPromo(null)}
                className={`p-1.5 rounded-full ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedPromo.banner_url && (
              <div className="h-40 rounded-2xl overflow-hidden shadow-md">
                <img src={selectedPromo.banner_url} alt={selectedPromo.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-black leading-snug">{selectedPromo.title}</h3>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {selectedPromo.discount_value && (
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">{selectedPromo.discount_value}</span>
                )}
                {selectedPromo.code && (
                  <span className="text-xs font-mono font-bold bg-[var(--surface-hover)] border border-[var(--surface-border)] px-2 py-0.5 rounded text-neutral-400">
                    Code: {selectedPromo.code}
                  </span>
                )}
              </div>
              {selectedPromo.description && (
                <p className={`text-xs leading-relaxed mt-2 ${theme === "dark" ? "text-neutral-300" : "text-gray-600"}`}>
                  {selectedPromo.description}
                </p>
              )}
              {selectedPromo.terms_conditions && (
                <div className="mt-2 border-t pt-2 border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Terms & Conditions</p>
                  <p className={`text-[10px] leading-relaxed mt-1 whitespace-pre-line ${theme === "dark" ? "text-neutral-400" : "text-gray-500"}`}>
                    {selectedPromo.terms_conditions}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleOrder}
              className="w-full py-3 bg-[#DA291C] text-white rounded-xl font-bold text-sm shadow-lg hover:bg-[#DA291C]/90 transition-all text-center mt-2"
            >
              {selectedPromo.scope === "MENU_ITEM" ? "Go to Menu Item" : selectedPromo.scope === "CATEGORY" ? "Go to Category" : "Start Ordering"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
