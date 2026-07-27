"use client"
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Store, Navigation, Check, ChevronRight } from "lucide-react"
import { Restaurant } from "./types"

interface Props {
  popupVisible: boolean
  setPopupVisible: (v: boolean) => void
  restaurantsList: Restaurant[]
  activeRestaurantId: string
  activeBranchId: string
  loadRestaurantData: (targetId: string, showLoader?: boolean, forTableId?: string, branchId?: string) => Promise<void>
  setCart: (c: any[]) => void
  setOrderNotes: (n: string) => void
  setActiveTab: (tab: "home" | "cart" | "history") => void
  themeCard: string
  themeBorder: string
  themeTextTitle: string
  themeTextMuted: string
  theme: "dark" | "light"
}

export default function RestaurantPickerSheet({
  popupVisible,
  setPopupVisible,
  restaurantsList,
  activeRestaurantId,
  activeBranchId,
  loadRestaurantData,
  setCart,
  setOrderNotes,
  setActiveTab,
  themeCard,
  themeBorder,
  themeTextTitle,
  themeTextMuted,
  theme,
}: Props) {
  return (
    <AnimatePresence>
      {popupVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPopupVisible(false)}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 rounded-t-[32px] shadow-2xl overflow-visible pb-8 pt-3 px-5 border-t ${themeBorder} ${
              theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-gray-900"
            }`}
          >
            <div className={`absolute -top-7 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50 border-2 overflow-hidden ${
              theme === "dark" ? "bg-[#1c1c1e] border-white/[0.08]" : "bg-white border-gray-100"
            }`}>
              <img src="/dexel_logo.png" className="w-11 h-11 object-contain" alt="Dexel Logo" />
            </div>

            <div className="flex justify-center pb-1">
              <div className={`w-10 h-1.5 rounded-full ${ theme === "dark" ? "bg-white/10" : "bg-gray-200" }`} />
            </div>

            <h2 className={`text-sm font-black leading-tight mb-4 pr-12 ${themeTextTitle}`}>
              Which restaurant would you like to eat?
            </h2>

            <div className="flex flex-col gap-2 mb-3 max-h-52 overflow-y-auto pr-1">
              {(() => {
                const outlets: Array<{
                  restaurantId: string
                  branchId: string
                  name: string
                  logo_url?: string | null
                  banner_url?: string | null
                  address?: string | null
                }> = []
                for (const rest of restaurantsList) {
                  if (rest.branches && rest.branches.length > 0) {
                    for (const branch of rest.branches) {
                      outlets.push({
                        restaurantId: rest.id,
                        branchId: branch.id,
                        name: rest.branches.length > 1 ? `${rest.name} — ${branch.name}` : rest.name,
                        logo_url: branch.logo_url || rest.logo_url,
                        banner_url: branch.banner_url || rest.banner_url,
                        address: branch.address,
                      })
                    }
                  } else {
                    outlets.push({
                      restaurantId: rest.id,
                      branchId: "",
                      name: rest.name,
                      logo_url: rest.logo_url,
                      banner_url: rest.banner_url,
                      address: null,
                    })
                  }
                }

                return outlets.map((outlet) => {
                  const isSelected = outlet.branchId
                    ? outlet.branchId === activeBranchId
                    : outlet.restaurantId === activeRestaurantId
                  return (
                    <button
                      key={`${outlet.restaurantId}-${outlet.branchId}`}
                      onClick={async () => {
                        const sameOutlet = outlet.branchId
                          ? outlet.branchId === activeBranchId
                          : outlet.restaurantId === activeRestaurantId
                        if (!sameOutlet) {
                          setPopupVisible(false)
                          setCart([])
                          setOrderNotes("")
                          setActiveTab("home")
                          await loadRestaurantData(outlet.restaurantId, false, "", outlet.branchId)
                        } else {
                          setPopupVisible(false)
                        }
                      }}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left relative ${
                        isSelected
                          ? "border-[#FFC72C] bg-[#FFC72C]/10 shadow-md"
                          : `${themeCard} hover:border-[#FFC72C]/20`
                      }`}
                    >
                      <div className={`w-16 h-14 rounded-xl overflow-hidden shrink-0 border ${themeBorder} flex items-center justify-center`}>
                        {outlet.logo_url || outlet.banner_url ? (
                          <img
                            src={(outlet.logo_url || outlet.banner_url)!}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          {isSelected ? (
                            <span className="text-[9px] font-black text-blue-400 flex items-center gap-0.5 uppercase tracking-wider">
                              <Store className="w-2.5 h-2.5" /> Currently browsing
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-[#FFC72C] flex items-center gap-0.5 uppercase tracking-wider">
                              <Navigation className="w-2.5 h-2.5" /> Switch branch
                            </span>
                          )}
                        </div>
                        <p className={`font-extrabold text-xs leading-snug line-clamp-2 ${themeTextTitle}`}>
                          {outlet.name}
                        </p>
                        {outlet.address && (
                          <p className={`text-[9px] mt-0.5 line-clamp-1 ${themeTextMuted}`}>{outlet.address}</p>
                        )}
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                        isSelected ? "border-[#FFC72C] bg-[#FFC72C]" : `${theme === "dark" ? "border-white/10" : "border-gray-200"}`
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-black" strokeWidth={3.5} />}
                      </div>
                    </button>
                  )
                })
              })()}

              {restaurantsList.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-xs font-semibold">No outlets discovered</div>
              )}
            </div>

            <button
              onClick={() => setPopupVisible(false)}
              className="w-full text-center text-xs text-gray-400 font-bold mb-2 hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
            >
              None of it. Go manually.
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
