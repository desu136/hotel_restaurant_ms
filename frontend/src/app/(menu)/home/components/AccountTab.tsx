"use client"
import { ChevronRight, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { MiniAppUser } from "@/lib/miniapp-bridge"

interface Props {
  userProfile: MiniAppUser | null
  orderHistory: any[]
  loadingHistory: boolean
  showToast: (msg: string, icon?: string) => void
  theme: "dark" | "light"
  themeTextMuted: string
  themeTextTitle: string
}

const SETTINGS_ITEMS = [
  { icon: "📍", label: "My Addresses" },
  { icon: "🔔", label: "Notifications" },
  { icon: "🌐", label: "Language" },
  { icon: "⭐", label: "Rate the App" },
]

export default function AccountTab({ userProfile, orderHistory, loadingHistory, showToast, theme, themeTextMuted, themeTextTitle }: Props) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-0 pb-24">
      {/* Profile Hero */}
      <div className={`relative overflow-hidden rounded-3xl p-6 ${
        theme === "dark"
          ? "bg-gradient-to-br from-[#FFC72C]/15 via-amber-700/10 to-transparent border border-white/[0.08]"
          : "bg-gradient-to-br from-[#FFC72C] to-amber-500 text-white"
      }`}>
        {theme === "dark" && (
          <>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />
          </>
        )}
        {theme === "light" && (
          <>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/5 translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          </>
        )}
        <div className="relative z-10 flex items-center gap-4">
          <div className="relative shrink-0">
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/30 shadow-xl" alt="Avatar" />
            ) : (
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl border-2 ${
                theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white/20 backdrop-blur-sm border-white/30 text-white"
              }`}>
                {userProfile?.name?.charAt(0).toUpperCase() || <User className="w-7 h-7 text-white" />}
              </div>
            )}
            {userProfile?.id && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FFC72C] text-black flex items-center justify-center shadow-md border-2 border-[#0c0c0c]">
                <span className="text-[9px] font-black">✓</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-lg leading-tight text-white">{userProfile?.name || "Guest User"}</h2>
            <p className={`text-[10px] font-semibold mt-0.5 truncate ${theme === "dark" ? "text-gray-400" : "text-white/80"}`}>
              {userProfile?.email || "eChat Authenticated Guest"}
            </p>
            <span className={`inline-block mt-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
              theme === "dark" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-white/20 text-white border-white/30"
            }`}>
              {userProfile?.id ? "Member" : "Guest"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick action grid */}
      <div className="mx-4 -mt-8 relative z-10">
        <div className={`rounded-2xl shadow-xl border grid grid-cols-4 divide-x ${
          theme === "dark" ? "bg-[#1c1c1e] border-white/[0.08] divide-white/[0.08]" : "bg-white border-gray-100 divide-gray-100"
        }`}>
          {[
            { icon: "📋", label: "My Orders", sub: `${orderHistory.length} order${orderHistory.length !== 1 ? "s" : ""}`, action: () => router.push("/orders") },
            { icon: "❤️", label: "Saved", sub: "Coming soon", action: () => showToast("Saved places coming soon!", "❤️") },
            { icon: "🎟️", label: "Vouchers", sub: "0 active", action: () => showToast("Vouchers coming soon!", "🎟️") },
            { icon: "💬", label: "Support", sub: "Help center", action: () => showToast("Support coming soon!", "💬") },
          ].map((item) => (
            <button key={item.label} onClick={item.action} className="flex flex-col items-center gap-1 py-4 px-1 transition-all hover:scale-105 active:scale-95">
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span className={`text-[9px] font-black ${themeTextTitle}`}>{item.label}</span>
              <span className={`text-[8px] ${themeTextMuted} font-semibold`}>{item.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* My Orders Link */}
      <div className="mt-6 px-4 flex flex-col gap-3">
        <h3 className={`font-extrabold text-sm ${themeTextTitle}`}>My Orders</h3>
        <button
          onClick={() => router.push("/orders")}
          className={`w-full p-4 rounded-2xl border text-[11px] font-extrabold flex items-center justify-between active:scale-95 transition-all ${
            theme === "dark" ? "bg-[#0b0f19] border-white/5 text-gray-200 hover:bg-white/5" : "bg-white border-gray-100 text-gray-700 hover:bg-gray-50 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div className="text-left">
              <p className={`font-bold text-xs ${themeTextTitle}`}>View Recent Orders</p>
              <p className={`text-[9px] ${themeTextMuted} font-semibold mt-0.5`}>
                {loadingHistory ? "Loading your orders..." : orderHistory.length > 0 ? `Check details of your ${orderHistory.length} orders` : "View your order history"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {orderHistory.length > 0 && !loadingHistory && (
              <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">{orderHistory.length} total</span>
            )}
            <ChevronRight className={`w-4 h-4 ${themeTextMuted}`} />
          </div>
        </button>
      </div>

      {/* Settings List */}
      <div className={`mt-6 mx-4 border rounded-2xl overflow-hidden shadow-sm ${theme === "dark" ? "bg-[#0b0f19] border-white/5" : "bg-white border-gray-100"}`}>
        {SETTINGS_ITEMS.map((item, idx, arr) => (
          <button
            key={item.label}
            onClick={() => showToast(`${item.label} coming soon!`, item.icon)}
            className={`w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-gray-50 transition-colors ${
              idx < arr.length - 1 ? (theme === "dark" ? "border-b border-white/5" : "border-b border-gray-50") : ""
            } ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{item.icon}</span>
              <span className={`text-xs font-semibold ${themeTextTitle}`}>{item.label}</span>
            </div>
            <ChevronRight className={`w-4 h-4 ${themeTextMuted}`} />
          </button>
        ))}
      </div>
    </div>
  )
}
