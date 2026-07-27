"use client"
import * as React from "react"
import { Sparkles } from "lucide-react"

interface Props {
  promoEvaluation: {
    promotion_id: string | null
    promotion_title: string | null
    discount_amount: number
    hints: string[]
  }
  promoDiscount: number
  cartTotal: number
  cartFinalTotal: number
  prepTime: number
  themeCard: string
  themeBorder: string
  themeTextTitle: string
  themeTextMuted: string
}

export default function CartSummaryCard({
  promoEvaluation,
  promoDiscount,
  cartTotal,
  cartFinalTotal,
  prepTime,
  themeCard,
  themeBorder,
  themeTextTitle,
  themeTextMuted,
}: Props) {
  return (
    <div className="space-y-3">
      {promoEvaluation.hints.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {promoEvaluation.hints.map((hint, i) => (
            <div key={i} className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300 leading-relaxed">{hint}</p>
            </div>
          ))}
        </div>
      )}

      {promoDiscount > 0 && promoEvaluation.promotion_title && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-xl px-3 py-2">
          <Sparkles className="w-3.5 h-3.5 text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-green-400 leading-snug">🎉 {promoEvaluation.promotion_title}</p>
            <p className="text-[10px] text-green-400/70">Saving ${promoDiscount.toFixed(2)} automatically applied</p>
          </div>
        </div>
      )}

      <div className={`p-4 space-y-2 text-xs rounded-2xl ${themeCard} border`}>
        <div className={`flex justify-between ${themeTextMuted}`}>
          <span>Subtotal</span>
          <span className="font-semibold">${cartTotal.toFixed(2)}</span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-green-400 font-bold">
            <span>Discount ({promoEvaluation.promotion_title})</span>
            <span>-${promoDiscount.toFixed(2)}</span>
          </div>
        )}
        {prepTime > 0 && (
          <div className={`flex justify-between ${themeTextMuted}`}>
            <span>Est. Prep Time</span>
            <span className="font-bold text-emerald-400">~{prepTime} mins</span>
          </div>
        )}
        <div className={`flex justify-between font-bold text-sm pt-2 border-t ${themeBorder}`}>
          <span className={themeTextTitle}>Total Amount</span>
          <span className="text-[#FFC72C] text-base font-extrabold">${cartFinalTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
