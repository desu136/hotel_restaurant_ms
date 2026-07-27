"use client"
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import SlideshowImage from "./SlideshowImage"
import { MenuItem, SLOTS } from "./types"

interface ItemHeroProps {
  selectedItem: MenuItem
  selectedCustomizationBadges: Array<{ name: string; image_url?: string | null; extraPrice: number }>
}

export default function ItemHero({ selectedItem, selectedCustomizationBadges }: ItemHeroProps) {
  return (
    <div className="relative h-40 sm:h-80 bg-gray-950 w-full shrink-0 flex items-center justify-center border-b border-white/5 overflow-hidden">
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
  )
}
