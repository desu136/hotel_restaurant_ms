"use client"
import * as React from "react"
import { ShoppingCart } from "lucide-react"

interface Props {
  cartCount: number
  promoDiscount: number
  cartFinalTotal: number
  cartTotal: number
  activeTab: "home" | "cart" | "history"
  onAction: () => void
}

export default function FloatingCartBar({
  cartCount,
  promoDiscount,
  cartFinalTotal,
  cartTotal,
  activeTab,
  onAction,
}: Props) {
  return (
    <div className={`fixed ${activeTab === "home" ? "bottom-16" : "bottom-4"} left-4 right-4 z-40 bg-[#FFC72C] text-black p-3.5 rounded-2xl flex items-center justify-between shadow-2xl transform transition-all duration-300`}>
      <div className="flex items-center gap-3">
        <div className="relative bg-black/10 p-2 rounded-xl">
          <ShoppingCart className="w-5 h-5 text-black" />
          <span className="absolute -top-1.5 -right-2 bg-black text-[#FFC72C] text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#FFC72C]">
            {cartCount}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">Cart Total</p>
          {promoDiscount > 0 ? (
            <div className="flex items-center gap-1.5">
              <p className="font-extrabold text-base">${cartFinalTotal.toFixed(2)}</p>
              <p className="text-[10px] line-through opacity-60">${cartTotal.toFixed(2)}</p>
            </div>
          ) : (
            <p className="font-extrabold text-base">${cartTotal.toFixed(2)}</p>
          )}
        </div>
      </div>

      <button
        onClick={onAction}
        className="bg-black text-[#FFC72C] hover:bg-black/90 active:scale-95 font-black px-5 py-3 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
      >
        {activeTab === "home" ? "Confirm Order" : "Proceed to Payment"}
      </button>
    </div>
  )
}
