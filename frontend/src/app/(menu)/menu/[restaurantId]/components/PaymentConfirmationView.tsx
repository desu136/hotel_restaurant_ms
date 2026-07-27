"use client"
import * as React from "react"
import { ArrowLeft, Loader2 } from "lucide-react"

interface Props {
  method: { id: string; name: string; logo: string; color: string; description: string }
  onBack: () => void
  phone: string
  setPhone: (phone: string) => void
  handlePay: () => void
  paying: boolean
  discountAmount: number
  subtotal: number
  promotionTitle?: string | null
  total: number
  themeBg: string
  themeCard: string
  themeBorder: string
  themeTextMuted: string
  themeTextTitle: string
  theme: "light" | "dark"
}

export default function PaymentConfirmationView({
  method,
  onBack,
  phone,
  setPhone,
  handlePay,
  paying,
  discountAmount,
  subtotal,
  promotionTitle,
  total,
  themeBg,
  themeCard,
  themeBorder,
  themeTextMuted,
  themeTextTitle,
  theme,
}: Props) {
  return (
    <div className={`fixed inset-0 z-[60] flex flex-col ${themeBg} overflow-y-auto`}>
      <div className={`flex items-center gap-3 p-4 border-b ${themeBorder} shrink-0`}>
        <button onClick={onBack} className={`p-2 ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"} rounded-lg`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-black text-base">Confirm Payment</h2>
      </div>

      <div className="flex-1 flex flex-col p-5 gap-5 max-w-sm mx-auto w-full">
        <div className={`flex items-center gap-3 ${themeCard} border rounded-2xl p-4`}>
          <span className="text-3xl">{method.logo}</span>
          <div>
            <p className="font-bold">{method.name}</p>
            <p className={`text-xs ${themeTextMuted}`}>{method.description}</p>
          </div>
        </div>

        {(method.id === "telebirr" || method.id === "cbe" || method.id === "amole") && (
          <div>
            <label className={`block text-xs font-semibold ${themeTextMuted} mb-2`}>Mobile Phone Number</label>
            <div className="flex gap-2">
              <span className={`flex items-center px-3 ${theme === "dark" ? "bg-[#0b0f19] border-white/10 text-gray-300" : "bg-white border-gray-300 text-gray-700"} border rounded-xl text-sm font-semibold`}>+251</span>
              <input
                type="tel"
                placeholder="9XXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/, ""))}
                maxLength={9}
                className={`flex-1 ${theme === "dark" ? "bg-[#0b0f19] border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"} border rounded-xl px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50`}
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5">You will receive a push notification to approve the payment.</p>
          </div>
        )}

        {method.id === "chapa" && (
          <div className="space-y-3">
            <div>
              <label className={`block text-xs font-semibold ${themeTextMuted} mb-2`}>Card Number</label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                className={`w-full ${theme === "dark" ? "bg-[#0b0f19] border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"} border rounded-xl px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50`}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={`block text-xs font-semibold ${themeTextMuted} mb-2`}>Expiry</label>
                <input type="text" placeholder="MM/YY" className={`w-full ${theme === "dark" ? "bg-[#0b0f19] border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"} border rounded-xl px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50`} />
              </div>
              <div className="flex-1">
                <label className={`block text-xs font-semibold ${themeTextMuted} mb-2`}>CVV</label>
                <input type="text" placeholder="123" maxLength={3} className={`w-full ${theme === "dark" ? "bg-[#0b0f19] border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"} border rounded-xl px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50`} />
              </div>
            </div>
          </div>
        )}

        <div className={`${themeCard} border rounded-2xl p-4 space-y-2`}>
          <p className={`text-xs font-bold ${themeTextMuted} uppercase tracking-wider`}>Order Total</p>
          {discountAmount > 0 ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className={themeTextMuted}>Subtotal</span>
                <span className={`font-bold ${themeTextTitle}`}>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-green-400">
                <span>Discount ({promotionTitle})</span>
                <span className="font-bold">-${discountAmount.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between pt-1.5 border-t ${themeBorder}`}>
                <span className={`font-extrabold ${themeTextTitle}`}>Payable</span>
                <span className="text-3xl font-black text-amber-400">${total.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="text-3xl font-black text-amber-400">${total.toFixed(2)}</p>
          )}
          <p className={`text-[10px] ${themeTextMuted}`}>Taxes and service charges included</p>
        </div>

        <button
          onClick={handlePay}
          disabled={paying || ((method.id === "telebirr" || method.id === "cbe" || method.id === "amole") && phone.length !== 9)}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-auto"
          style={{ backgroundColor: method.color, color: "white" }}
        >
          {paying ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing Payment…</>
          ) : (
            `Pay ${method.name} · $${total.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  )
}
