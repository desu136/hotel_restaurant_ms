"use client"
import * as React from "react"
import { Timer } from "lucide-react"
import SlideshowImage from "./SlideshowImage"
import { MenuItem, Category, CartItem } from "./types"

interface Props {
  menuListRef: React.RefObject<HTMLDivElement | null>
  filteredMenuItems: MenuItem[]
  activeParentId: string
  categories: Category[]
  filteredSubCategories: Category[]
  cart: CartItem[]
  openItemDetail: (item: MenuItem) => void
  addToCartDirectly: (item: MenuItem) => void
  updateCartQty: (idx: number, delta: number) => void
  themeCard: string
  themeBorder: string
  themeTextTitle: string
  themeTextMuted: string
  theme: "dark" | "light"
}

export default function MenuList({
  menuListRef,
  filteredMenuItems,
  activeParentId,
  categories,
  filteredSubCategories,
  cart,
  openItemDetail,
  addToCartDirectly,
  updateCartQty,
  themeCard,
  themeBorder,
  themeTextTitle,
  themeTextMuted,
  theme,
}: Props) {
  if (filteredMenuItems.length === 0) {
    return (
      <div ref={menuListRef} className="flex-1 overflow-y-auto px-3 pt-3 pb-32">
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🍽️</p>
          <p className="text-xs font-semibold">No items available</p>
        </div>
      </div>
    )
  }

  const parentDirectItems = filteredMenuItems.filter(item => item.category_id === activeParentId)
  const subGroups = filteredSubCategories
    .map(sc => ({ sc, items: filteredMenuItems.filter(item => item.category_id === sc.id) }))
    .filter(g => g.items.length > 0)

  const renderCard = (item: MenuItem) => {
    const itemPrice = parseFloat(item.price.toString())
    const inCartCount = cart
      .filter(c => c.menuItem.id === item.id)
      .reduce((sum, cur) => sum + cur.quantity, 0)

    return (
      <div
        key={item.id}
        onClick={() => openItemDetail(item)}
        className={`w-full ${themeCard}  flex gap-3 p-2 hover:border-[#FFC72C]/30 active:scale-[0.99] transition-all cursor-pointer relative group overflow-hidden`}
      >
        {inCartCount > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-[#FFC72C] text-black text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
            {inCartCount}
          </div>
        )}

        <div className={`w-25 h-23 sm:w-24 sm:h-24  shrink-0 flex items-center justify-center relative overflow-hidden  ${themeBorder}`}>
          {(() => {
            const allImgs = [item.image_url, ...(Array.isArray(item.image_urls) ? item.image_urls : [])].filter(Boolean) as string[]
            return allImgs.length > 0 ? (
              <SlideshowImage
                images={allImgs}
                alt={item.display_name}
                className="w-full h-full"
                interval={2500}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-3xl ${theme === "dark" ? "bg-[#252525]" : "bg-gray-100"}`}>🍽️</div>
            )
          })()}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h3 className={`font-bold text-sm ${themeTextTitle} leading-tight line-clamp-2`}>
              {item.display_name}
            </h3>
            {item.description && (
              <p className={`text-[10px] ${themeTextMuted} mt-0.5 line-clamp-2 leading-normal`}>
                {item.description}
              </p>
            )}
            {(item.prep_time ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                <Timer size={9} strokeWidth={3} /> ~{item.prep_time} min
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-blue-600 font-extrabold text-base">${itemPrice.toFixed(2)}</span>

            <div onClick={e => e.stopPropagation()}>
              {inCartCount > 0 ? (
                <div className="flex items-center gap-2 bg-[#FFC72C] rounded-xl px-2.5 py-1 text-black shadow-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      const cartIdx = cart.findIndex(c => c.menuItem.id === item.id)
                      if (cartIdx >= 0) updateCartQty(cartIdx, -1)
                    }}
                    className="font-black text-sm w-4 h-4 flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="font-black text-xs min-w-[14px] text-center">{inCartCount}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      const cartIdx = cart.findIndex(c => c.menuItem.id === item.id)
                      if (cartIdx >= 0) {
                        updateCartQty(cartIdx, 1)
                      } else {
                        addToCartDirectly(item)
                      }
                    }}
                    className="font-black text-sm w-4 h-4 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    addToCartDirectly(item)
                  }}
                  className="bg-[#FFC72C] hover:bg-yellow-400 active:scale-95 text-black rounded-xl px-4 py-1.5 text-[10px] font-black transition-all shadow-sm"
                >
                  + Add
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={menuListRef} className="flex-1 overflow-y-auto px-3 pt-3 pb-32">
      <div className="space-y-1">
        {parentDirectItems.length > 0 && (
          <div id="subcat-all" className="space-y-2.5 pb-3">
            {subGroups.length > 0 && (
              <p className={`text-[10px] ${themeTextMuted} font-black uppercase tracking-wider px-1 pt-1 pb-0.5`}>
                {categories.find(c => c.id === activeParentId)?.name || "General"}
              </p>
            )}
            {parentDirectItems.map(renderCard)}
          </div>
        )}

        {subGroups.map(({ sc, items }) => (
          <div key={sc.id} id={`subcat-${sc.id}`} className="space-y-2.5 pb-3">
            <p className={`text-[10px] ${themeTextMuted} font-black uppercase tracking-wider px-1 pt-1 pb-0.5`}>
              {sc.name}
            </p>
            {items.map(renderCard)}
          </div>
        ))}
      </div>
    </div>
  )
}
