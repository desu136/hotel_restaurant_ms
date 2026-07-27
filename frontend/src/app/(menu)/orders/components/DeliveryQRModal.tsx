"use client"
import { createPortal } from "react-dom"
import { QrCode } from "lucide-react"

interface Props {
  activeQrOrder: any
  theme: "light" | "dark"
  onClose: () => void
}

export function DeliveryQRModal({ activeQrOrder, theme, onClose }: Props) {
  if (!activeQrOrder || typeof window === "undefined") return null
  const themeCard = theme === "dark" ? "bg-[#0b0f19] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
  const themeTitle = theme === "dark" ? "text-white font-extrabold" : "text-gray-900 font-extrabold"
  const themeMuted = theme === "dark" ? "text-gray-400" : "text-gray-500"

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className={`w-full max-w-sm border rounded-3xl overflow-hidden shadow-2xl relative flex flex-col transition-transform duration-300 ${themeCard}`}>
        <div className={`p-5 border-b flex justify-between items-center shrink-0 ${theme === "dark" ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-gray-100"}`}>
          <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${themeTitle}`}>
            <QrCode className="w-4 h-4 text-amber-500" /> Order QR Code
          </h3>
          <button onClick={onClose} className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${theme === "dark" ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            Close
          </button>
        </div>
        <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
          <p className={`text-xs font-bold ${themeTitle}`}>Share this QR code with the waiter to verify and confirm your order delivery.</p>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-inner flex items-center justify-center">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent("order_delivery:" + activeQrOrder.id)}`} alt="Order QR Code" className="w-52 h-52 object-contain" />
          </div>
          <div className="space-y-1 mt-2">
            <p className={`text-xs font-black uppercase tracking-wider ${themeTitle}`}>Order #{activeQrOrder.order_number || activeQrOrder.id.slice(-6).toUpperCase()}</p>
            <p className={`text-[10px] ${themeMuted}`}>{activeQrOrder.branch?.restaurant?.name || activeQrOrder.branch?.name || "Restaurant"}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
