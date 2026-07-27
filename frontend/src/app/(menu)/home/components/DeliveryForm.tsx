"use client"
import { ArrowLeft } from "lucide-react"

interface Props {
  onBack: () => void
  delivName: string
  setDelivName: (v: string) => void
  delivPhone: string
  setDelivPhone: (v: string) => void
  delivAddress: string
  setDelivAddress: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  theme: "dark" | "light"
  themePanel: string
  themeTextMuted: string
  themeTextTitle: string
}

export default function DeliveryForm({
  onBack, delivName, setDelivName, delivPhone, setDelivPhone,
  delivAddress, setDelivAddress, onSubmit, theme, themePanel, themeTextMuted, themeTextTitle,
}: Props) {
  const inputClass = `rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
    theme === "dark" ? "bg-white/5 border-white/5 text-white" : "bg-gray-50 border-gray-100 text-gray-900"
  }`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className={`p-2 rounded-full border text-gray-600 active:scale-90 transition-all ${
            theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-gray-100"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className={`font-extrabold text-lg ${themeTextTitle}`}>Delivery Details</h2>
      </div>
      <form onSubmit={onSubmit} className={`border rounded-3xl p-5 flex flex-col gap-4 shadow-sm ${themePanel}`}>
        <div className="flex flex-col gap-1.5">
          <label className={`text-[9px] font-bold uppercase tracking-wider ${themeTextMuted}`}>Your Name</label>
          <input type="text" placeholder="e.g. John Doe" value={delivName} onChange={(e) => setDelivName(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={`text-[9px] font-bold uppercase tracking-wider ${themeTextMuted}`}>Phone Number</label>
          <input type="tel" placeholder="e.g. +251 911..." value={delivPhone} onChange={(e) => setDelivPhone(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={`text-[9px] font-bold uppercase tracking-wider ${themeTextMuted}`}>Delivery Address</label>
          <input type="text" placeholder="e.g. Room 402, Block B, Main Campus" value={delivAddress} onChange={(e) => setDelivAddress(e.target.value)} className={inputClass} />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs py-3.5 rounded-xl shadow-md active:scale-98 transition-all text-center mt-2"
        >
          Select Restaurant & Open Menu
        </button>
      </form>
    </div>
  )
}
