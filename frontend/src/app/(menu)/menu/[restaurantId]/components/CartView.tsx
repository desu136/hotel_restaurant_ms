"use client"
import * as React from "react"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import CartSummaryCard from "./CartSummaryCard"
import { CartItem, MenuItem } from "./types"

interface Props {
  cart: CartItem[]
  tableId: string
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  setOrderType: (t: "DINE_IN" | "TAKEAWAY" | "DELIVERY") => void
  deliveryAddress: string
  setDeliveryAddress: (addr: string) => void
  orderNotes: string
  setOrderNotes: (notes: string) => void
  promoEvaluation: {
    promotion_id: string | null
    promotion_title: string | null
    discount_amount: number
    hints: string[]
  }
  promoDiscount: number
  cartTotal: number
  cartFinalTotal: number
  updateCartQty: (idx: number, delta: number) => void
  getCustomizedItemPrice: (item: MenuItem, custs: Record<string, string | string[]>) => number
  setActiveTab: (tab: "home" | "cart" | "history") => void
  themeCard: string
  themeBorder: string
  themeTextTitle: string
  themeTextMuted: string
  theme: "dark" | "light"
}

export default function CartView({
  cart,
  tableId,
  orderType,
  setOrderType,
  deliveryAddress,
  setDeliveryAddress,
  orderNotes,
  setOrderNotes,
  promoEvaluation,
  promoDiscount,
  cartTotal,
  cartFinalTotal,
  updateCartQty,
  getCustomizedItemPrice,
  setActiveTab,
  themeCard,
  themeBorder,
  themeTextTitle,
  themeTextMuted,
  theme,
}: Props) {
  const prepTime = Math.max(...cart.map(c => c.menuItem.prep_time ?? 0), 0)

  return (
    <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setActiveTab("home")} className={`p-1.5 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
          <ArrowLeft className={`w-5 h-5 ${themeTextTitle}`} />
        </button>
        <h2 className="text-lg font-black">Your Order Cart</h2>
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 space-y-3">
          <ShoppingCart className="w-14 h-14 opacity-20" />
          <div>
            <p className={`font-bold ${themeTextTitle}`}>Your cart is empty</p>
            <p className={`text-xs ${themeTextMuted} mt-1`}>Explore our categories and add delicious food!</p>
          </div>
          <button
            onClick={() => setActiveTab("home")}
            className="bg-amber-500 text-black font-black px-6 py-2.5 rounded-xl text-xs active:scale-95 transition-all shadow-md"
          >
            Go to Menu
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-32 scrollbar-none">
            <div className="space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className={`flex gap-3 ${themeCard} rounded-2xl p-3 border`}>
                  <div className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border ${themeBorder} flex items-center justify-center`}>
                    {item.menuItem.image_url ? (
                      <img src={item.menuItem.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-xl ${ theme === "dark" ? "bg-[#252525]" : "bg-gray-100" }`}>🍽️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${themeTextTitle} leading-tight`}>{item.menuItem.display_name}</p>
                    {Object.entries(item.selectedCustomizations).map(([k, v]) => (
                      <p key={k} className="text-[10px] text-[#FFC72C] mt-0.5 font-semibold">
                        • {k}: {Array.isArray(v) ? v.join(", ") : v}
                      </p>
                    ))}
                    {item.notes && (
                      <p className={`text-[10px] ${themeTextMuted} italic mt-1 border-l-2 border-[#FFC72C]/40 pl-2`}>
                        "{item.notes}"
                      </p>
                    )}
                    {(item.menuItem.prep_time ?? 0) > 0 && (
                      <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                        ⏱ ~{item.menuItem.prep_time}m prep
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <span className="text-[#FFC72C] font-extrabold text-sm">
                      ${(getCustomizedItemPrice(item.menuItem, item.selectedCustomizations) * item.quantity).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2 bg-[#FFC72C] rounded-xl px-2.5 py-1 text-black">
                      <button onClick={() => updateCartQty(idx, -1)} className="font-black text-sm w-4 h-4 flex items-center justify-center">−</button>
                      <span className="font-black text-xs min-w-[14px] text-center">{item.quantity}</span>
                      <button onClick={() => updateCartQty(idx, 1)} className="font-black text-sm w-4 h-4 flex items-center justify-center">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`border-t ${themeBorder} pt-4 space-y-4`}>
              {!tableId && (
                <div className="space-y-2">
                  <label className={`block text-xs font-black uppercase tracking-wider ${themeTextMuted}`}>Order Option</label>
                  <div className={`grid grid-cols-3 gap-1.5 p-1 rounded-2xl border ${ theme === "dark" ? "bg-[#1c1c1e] border-white/[0.08]" : "bg-gray-100 border-gray-200" }`}>
                    {(["DINE_IN", "TAKEAWAY", "DELIVERY"] as const).map(type => (
                      <button
                        key={type} type="button" onClick={() => setOrderType(type)}
                        className={`py-2.5 px-2 rounded-xl text-[10px] font-black transition-all ${
                          orderType === type
                            ? "bg-[#FFC72C] text-black shadow-md shadow-amber-500/20"
                            : `${ theme === "dark" ? "text-neutral-400 hover:text-white" : "text-gray-500 hover:text-gray-900" }`
                        }`}
                      >
                        {type === "DINE_IN" ? "🪑 Dine-In" : type === "TAKEAWAY" ? "🛍️ Takeaway" : "🚗 Delivery"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {orderType === "DELIVERY" && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className={`block text-xs font-black uppercase tracking-wider ${themeTextMuted}`}>Delivery Address</label>
                  <input
                    type="text" placeholder="Enter your complete delivery address..." value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    style={{
                      backgroundColor: theme === "dark" ? "#1c1c1e" : "#ffffff",
                      color: theme === "dark" ? "#ffffff" : "#111827",
                      borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "#e5e7eb"
                    }}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    required
                  />
                </div>
              )}

              <div>
                <label className={`block text-xs font-semibold ${themeTextMuted} mb-1.5`}>Add Chef Instruction Notes</label>
                <textarea
                  rows={2} placeholder="E.g., no onion, extra spicy, deliver order items together..."
                  value={orderNotes} onChange={e => setOrderNotes(e.target.value)}
                  style={{
                    backgroundColor: theme === "dark" ? "#1c1c1e" : "#ffffff",
                    color: theme === "dark" ? "#ffffff" : "#111827",
                    borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "#e5e7eb"
                  }}
                  className="w-full border rounded-xl px-3 py-2 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                />
              </div>

              <CartSummaryCard
                promoEvaluation={promoEvaluation} promoDiscount={promoDiscount} cartTotal={cartTotal}
                cartFinalTotal={cartFinalTotal} prepTime={prepTime} themeCard={themeCard}
                themeBorder={themeBorder} themeTextTitle={themeTextTitle} themeTextMuted={themeTextMuted}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
