"use client"
import * as React from "react"
import { motion } from "framer-motion"
import { Promotion } from "./types"

interface Props {
  promotions: Promotion[]
  promoContainerRef: React.RefObject<HTMLDivElement | null>
  activePromoIndex: number
  setActivePromoIndex: (i: number) => void
  handlePromoScroll: () => void
  setSelectedPromo: (p: Promotion) => void
  theme: "dark" | "light"
  themeTextMuted: string
  themeTextTitle: string
}

export default function PromotionsSection({
  promotions,
  promoContainerRef,
  activePromoIndex,
  setActivePromoIndex,
  handlePromoScroll,
  setSelectedPromo,
  theme,
  themeTextMuted,
  themeTextTitle,
}: Props) {
  const scrollTo = (idx: number) => {
    if (promoContainerRef.current) {
      const container = promoContainerRef.current
      const firstChild = container.children[0] as HTMLElement
      const cardStep = firstChild ? firstChild.offsetWidth + 12 : container.clientWidth * 0.85
      container.scrollTo({ left: idx * cardStep, behavior: "smooth" })
      setActivePromoIndex(idx)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className={`text-[10px] font-extrabold uppercase tracking-wider ${themeTextMuted}`}>Exclusive Offers</h3>
        {promotions.length > 1 && (
          <div className="flex items-center gap-1.5">
            {promotions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollTo(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activePromoIndex === idx ? "w-5 bg-[#DA291C]" : "w-1.5 bg-gray-500/30 hover:bg-gray-500/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <div
        ref={promoContainerRef}
        onScroll={handlePromoScroll}
        className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory"
      >
        {promotions.length > 0 ? (
          promotions.map((promo) => (
            <div
              key={promo.id}
              onClick={() => setSelectedPromo(promo)}
              className={`min-w-[85%] snap-start border rounded-3xl flex flex-col gap-2 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform ${
                theme === "dark"
                  ? "bg-gradient-to-br from-[#DA291C]/15 to-transparent border-red-500/10"
                  : "bg-gradient-to-br from-[#FFC72C]/10 to-transparent border-[#FFC72C]/20 shadow-sm"
              }`}
            >
              {promo.banner_url && (
                <div className="h-28 overflow-hidden">
                  <img src={promo.banner_url} alt={promo.title} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                </div>
              )}
              <div className="p-4 flex flex-col gap-2">
                <div className="absolute top-0 right-0 w-24 h-full bg-[#FFC72C]/10 skew-x-12 transform origin-top-right pointer-events-none" />
                <div className="flex items-center justify-between z-10 gap-2">
                  <span className="text-[8px] font-black bg-[#DA291C] text-white px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                    {promo.type?.replace(/_/g, " ") || "OFFER"}
                  </span>
                  {promo.discount_value && (
                    <span className="text-[8px] font-black bg-[#FFC72C] text-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                      {promo.discount_value}
                    </span>
                  )}
                </div>
                <h4 className={`font-black text-sm z-10 ${themeTextTitle}`}>{promo.title}</h4>
                {promo.description && (
                  <p className={`text-[10px] leading-relaxed z-10 ${themeTextMuted}`}>{promo.description}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className={`min-w-[85%] snap-start border rounded-3xl p-4 flex flex-col gap-2 relative overflow-hidden ${
            theme === "dark"
              ? "bg-gradient-to-br from-[#DA291C]/15 to-transparent border-red-500/10"
              : "bg-gradient-to-br from-[#FFC72C]/10 to-transparent border-[#FFC72C]/20 shadow-sm"
          }`}>
            <div className="absolute top-0 right-0 w-24 h-full bg-[#FFC72C]/10 skew-x-12 transform origin-top-right" />
            <div className="flex items-center justify-between z-10">
              <span className="text-[8px] font-black bg-[#DA291C] text-white px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">APP DEBUG COUPON</span>
              <span className="text-[10px] font-black text-amber-500">Code: DEBUG50</span>
            </div>
            <h4 className={`font-black text-sm z-10 ${themeTextTitle}`}>🍔 50% Off Your First Order! (DEBUG)</h4>
            <p className={`text-[10px] leading-relaxed z-10 ${themeTextMuted}`}>
              Enjoy half price on your first Takeaway or Delivery order. Exclusions apply. (v2)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
