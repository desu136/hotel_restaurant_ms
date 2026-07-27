"use client"
import * as React from "react"
import { ArrowLeft, CheckCircle, Clock, ChefHat, Bell, Home } from "lucide-react"

export const STATUS_STEPS = [
  { key: "PENDING",   label: "Order Received",  icon: <Clock className="w-5 h-5" />,    desc: "Your order is confirmed and waiting for the kitchen." },
  { key: "PREPARING", label: "Being Prepared",  icon: <ChefHat className="w-5 h-5" />,  desc: "The kitchen is working on your food right now." },
  { key: "READY",     label: "Ready to Serve",  icon: <Bell className="w-5 h-5" />,     desc: "Your order is ready! A staff member is on the way." },
  { key: "COMPLETED", label: "Delivered",        icon: <CheckCircle className="w-5 h-5" />, desc: "Enjoy your meal! Thank you for dining with us." },
]

interface Props {
  onBack: () => void; onSuccess: (orderId: string) => void; router: any; orderId: string; estimatedPrepTime: number
  estimatedReadyAt: string | null; orderStatus: string; methodName?: string; transactionId: string; discountAmount: number
  subtotal: number; promotionTitle?: string | null; total: number; themeBg: string; themeCard: string; themeBorder: string
  themeTextMuted: string; themeTextTitle: string; theme: "light" | "dark"
}

export default function PaymentSuccessView({
  onBack, onSuccess, router, orderId, estimatedPrepTime, estimatedReadyAt, orderStatus, methodName, transactionId,
  discountAmount, subtotal, promotionTitle, total, themeBg, themeCard, themeBorder, themeTextMuted, themeTextTitle, theme,
}: Props) {
  const currentStatusIdx = STATUS_STEPS.findIndex(s => s.key === orderStatus)

  return (
    <div className={`fixed inset-0 z-[60] flex flex-col ${themeBg} overflow-y-auto`}>
      <div className={`flex items-center justify-between px-4 py-4 border-b ${themeBorder} shrink-0`}>
        <button onClick={onBack} className={`flex items-center gap-2 ${themeTextMuted} hover:${themeTextTitle} transition-colors text-xs font-semibold`}>
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </button>
        <button onClick={() => { onSuccess(orderId); router.push("/home") }} className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors text-xs font-semibold">
          <Home className="w-4 h-4" /> Home
        </button>
      </div>

      <div className="flex-1 flex flex-col p-5 gap-5 max-w-sm mx-auto w-full pb-10">
        <div className="flex flex-col items-center text-center pt-4 pb-2">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className={`text-xl font-black ${themeTextTitle}`}>Order Placed!</h1>
          <p className={`text-xs ${themeTextMuted} mt-1`}>The kitchen has been notified.</p>
          <p className="text-[10px] text-amber-400 font-mono font-bold mt-1.5 bg-amber-500/10 px-3 py-1 rounded-full">
            #{orderId.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {estimatedPrepTime > 0 && (
          <div className={`${themeCard} border rounded-2xl p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-bold ${themeTextMuted} uppercase tracking-wider`}>Estimated Ready Time</p>
              <p className="text-amber-400 font-black text-lg leading-tight">~{estimatedPrepTime} min</p>
              {estimatedReadyAt && (
                <p className={`text-[10px] ${themeTextMuted} mt-0.5`}>Ready by {new Date(estimatedReadyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              )}
            </div>
            <div className="text-right">
              <p className={`text-[10px] ${themeTextMuted}`}>Accounts for</p>
              <p className={`text-[10px] ${themeTextMuted}`}>kitchen queue</p>
            </div>
          </div>
        )}

        <div className={`${themeCard} border rounded-2xl p-4`}>
          <p className={`text-[10px] font-bold ${themeTextMuted} uppercase tracking-wider mb-4`}>Order Status</p>
          <div className="flex flex-col gap-0">
            {STATUS_STEPS.map((s, idx) => {
              const isDone = idx < currentStatusIdx, isCurrent = idx === currentStatusIdx, isLast = idx === STATUS_STEPS.length - 1
              return (
                <div key={s.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isDone ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                      isCurrent ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse" :
                      theme === "dark" ? "bg-white/5 text-gray-600 border border-white/10" : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}>
                      {s.icon}
                    </div>
                    {!isLast && <div className={`w-px flex-1 my-1 ${isDone ? "bg-green-500/30" : theme === "dark" ? "bg-white/10" : "bg-gray-200"}`} style={{ minHeight: 20 }} />}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className={`text-xs font-bold leading-snug ${isCurrent ? "text-amber-400" : isDone ? "text-green-400" : themeTextMuted}`}>
                      {s.label}
                      {isCurrent && <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded-full">Now</span>}
                    </p>
                    {isCurrent && <p className={`text-[10px] ${themeTextMuted} mt-0.5 leading-relaxed`}>{s.desc}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className={`${themeCard} border rounded-2xl p-4 space-y-2.5 text-sm`}>
          <p className={`text-[10px] font-bold ${themeTextMuted} uppercase tracking-wider`}>Payment Details</p>
          <div className="flex justify-between"><span className={themeTextMuted}>Method</span><span className="font-semibold">{methodName}</span></div>
          <div className="flex justify-between"><span className={themeTextMuted}>Transaction</span><span className={`font-mono text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>{transactionId}</span></div>
          {discountAmount > 0 && (
            <>
              <div className="flex justify-between text-xs"><span className={themeTextMuted}>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-green-400"><span>Discount ({promotionTitle})</span><span>-${discountAmount.toFixed(2)}</span></div>
            </>
          )}
          <div className={`flex justify-between border-t ${themeBorder} pt-2 mt-1`}><span className={`font-semibold ${themeTextMuted}`}>Amount Paid</span><span className="font-extrabold text-green-400 text-base">${total.toFixed(2)}</span></div>
        </div>

        <div className="flex flex-col gap-2.5 mt-auto">
          <button onClick={() => { onSuccess(orderId); router.push("/home?tab=account") }} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3.5 rounded-xl transition-all text-sm">View in Account →</button>
          <button onClick={onBack} className={`w-full ${theme === "dark" ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800"} border font-bold py-3 rounded-xl transition-all text-sm`}>Back to Menu</button>
        </div>
      </div>
    </div>
  )
}
