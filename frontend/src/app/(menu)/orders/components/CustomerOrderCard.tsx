"use client"
import { useRouter } from "next/navigation"
import { QrCode } from "lucide-react"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", PREPARING: "Preparing", READY: "Ready", COMPLETED: "Completed", CANCELLED: "Cancelled",
}

interface Props {
  order: any
  theme: "light" | "dark"
  onShowQR: (order: any) => void
  onShowToast: (msg: string, icon?: string) => void
}

export function CustomerOrderCard({ order, theme, onShowQR, onShowToast }: Props) {
  const router = useRouter()
  const restaurantName: string = order.branch?.restaurant?.name || order.branch?.name || "Restaurant"
  const restaurantId: string | null = order.branch?.restaurant?.id || null
  const firstItem = (order.items || [])[0]
  const firstImage = firstItem?.menu_item?.image_url
  const itemCount = (order.items || []).reduce((s: number, it: any) => s + (it.quantity || 1), 0)
  const totalNum = parseFloat((order.total_amount || 0).toString())
  const orderDate = new Date(order.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
  const orderTime = new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const orderTypeLabel = order.order_type === "DINE_IN" ? "Dine-In" : order.order_type === "TAKEAWAY" ? "Takeaway" : order.order_type === "DELIVERY" ? "Delivery" : "Order"
  const statusLabel = STATUS_LABEL[order.status] || order.status
  const statusColor = order.status === "PENDING" ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
    : order.status === "PREPARING" ? "text-blue-500 bg-blue-500/10 border-blue-500/20"
      : order.status === "READY" ? "text-green-500 bg-green-500/10 border-green-500/20"
        : order.status === "COMPLETED" ? "text-gray-400 bg-white/5 border-white/10" : "text-red-500 bg-red-500/10 border-red-200"

  const themeCard = theme === "dark" ? "bg-[#0b0f19] border-white/5 text-white" : "bg-white border-gray-100 text-gray-900"
  const themeTitle = theme === "dark" ? "text-white font-extrabold" : "text-gray-900 font-extrabold"
  const themeMuted = theme === "dark" ? "text-gray-400" : "text-gray-500"

  return (
    <div className={`border rounded-2xl overflow-hidden shadow-sm transition-colors ${themeCard}`}>
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${theme === "dark" ? "bg-white/[0.01] border-white/5" : "bg-gray-50/70 border-gray-100"}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[11px] font-extrabold truncate ${themeTitle}`}>{restaurantName}</span>
          <span className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded border ${theme === "dark" ? "bg-white/5 border-white/10 text-gray-300" : "bg-gray-200 text-gray-800 border-gray-300"}`}>
            #{order.order_number || order.id.slice(-6).toUpperCase()}
          </span>
          <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">{orderTypeLabel}</span>
        </div>
        <span className={`shrink-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>{statusLabel}</span>
      </div>

      <div className="flex gap-3 px-4 py-3">
        <div className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border ${theme === "dark" ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"}`}>
          {firstImage ? <img src={firstImage} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🍽️</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-xs leading-snug line-clamp-1 ${themeTitle}`}>{firstItem?.menu_item?.display_name || "Item"}</p>
          {order.items?.length > 1 && <p className={`text-[9px] ${themeMuted} mt-0.5`}>+ {order.items.length - 1} more item{order.items.length - 1 !== 1 ? "s" : ""}</p>}
          <p className={`text-[9px] ${themeMuted} mt-1`}>{orderDate} · {orderTime}</p>
          <p className={`text-[9px] ${themeMuted}`}>{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="shrink-0 text-right pt-0.5">
          <p className="font-extrabold text-sm text-amber-500">${totalNum.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pb-3 border-t border-gray-50 dark:border-white/5 pt-3">
        {order.status === "READY" ? (
          <button onClick={() => onShowQR(order)} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[10px] font-extrabold text-white transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
            <QrCode className="w-3.5 h-3.5" /> Show QR Code
          </button>
        ) : (
          <>
            <button onClick={() => onShowToast("Invoice feature coming soon!", "🧾")} className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all active:scale-95 ${theme === "dark" ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              Get Invoice
            </button>
            <button onClick={() => { if (restaurantId) router.push(`/menu/${restaurantId}?orderType=${order.order_type || "DINE_IN"}`); else router.push("/home") }} className="flex-1 py-2 rounded-xl bg-amber-500 text-[10px] font-extrabold text-black active:bg-amber-400 transition-all active:scale-95 shadow-sm">
              Order Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
