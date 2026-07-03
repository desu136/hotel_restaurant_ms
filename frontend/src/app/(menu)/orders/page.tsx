"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, ChevronRight, Clock } from "lucide-react"
import { getUserProfile } from "@/lib/miniapp-bridge"

// ─── Types ───────────────────────────────────────────────────────────────────
type FilterTab = "ALL" | "DINE_IN" | "TAKEAWAY" | "DELIVERY"

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL",      label: "All" },
  { key: "DINE_IN",  label: "Dine-In" },
  { key: "TAKEAWAY", label: "Takeaway" },
  { key: "DELIVERY", label: "Delivery" },
]

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Pending",
  PREPARING: "Preparing",
  READY:     "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "text-amber-600 bg-amber-50 border-amber-200",
  PREPARING: "text-blue-600 bg-blue-50 border-blue-200",
  READY:     "text-green-600 bg-green-50 border-green-200",
  COMPLETED: "text-gray-500 bg-gray-50 border-gray-200",
  CANCELLED: "text-red-500 bg-red-50 border-red-200",
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("ALL")
  const [toast, setToast] = React.useState<{ msg: string; icon: string } | null>(null)

  const showToast = (msg: string, icon = "✅") => {
    setToast({ msg, icon })
    setTimeout(() => setToast(null), 2800)
  }

  // ── Fetch orders (dual strategy: SSO userId + localStorage IDs) ────────────
  const fetchOrders = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      let ssoOrders: any[] = []

      // Strategy 1: SSO userId
      try {
        const profile = await getUserProfile()
        if (profile?.id) {
          const res = await fetch(
            `/api/orders/public/history?userId=${encodeURIComponent(profile.id)}`
          )
          if (res.ok) ssoOrders = await res.json()
        }
      } catch (_) {}

      // Strategy 2: localStorage order IDs
      const localIds: string[] = []
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith("placed_orders_")) {
            try {
              const ids: string[] = JSON.parse(localStorage.getItem(key) || "[]")
              localIds.push(...ids)
            } catch (_) {}
          }
        }
      }

      const ssoIds = new Set(ssoOrders.map((o: any) => o.id))
      const remaining = localIds.filter(id => !ssoIds.has(id))

      let localOrders: any[] = []
      if (remaining.length > 0) {
        try {
          const res = await fetch(
            `/api/orders/public/history?orderIds=${remaining.join(",")}`
          )
          if (res.ok) localOrders = await res.json()
        } catch (_) {}
      }

      const all = [...ssoOrders, ...localOrders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setOrders(all)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = activeFilter === "ALL"
    ? orders
    : orders.filter(o => o.order_type === activeFilter)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[system-ui,sans-serif]">

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-fade-in">
          <span>{toast.icon}</span>{toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-1 rounded-full active:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-extrabold text-sm text-gray-900">My Orders</h1>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="p-2 -mr-1 rounded-full active:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex gap-0 px-4 pb-0 overflow-x-auto scrollbar-none">
          {FILTER_TABS.map(tab => {
            const count = tab.key === "ALL"
              ? orders.length
              : orders.filter(o => o.order_type === tab.key).length
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`relative shrink-0 px-4 py-2.5 text-xs font-bold transition-colors ${
                  activeFilter === tab.key
                    ? "text-amber-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
                {count > 0 && tab.key !== "ALL" && (
                  <span className={`ml-1 text-[9px] font-black px-1 py-0.5 rounded-full ${
                    activeFilter === tab.key
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}>{count}</span>
                )}
                {activeFilter === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-3 pb-10">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-10 bg-gray-100" />
              <div className="flex gap-3 p-4">
                <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 flex flex-col gap-2 pt-1">
                  <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                  <div className="h-2 bg-gray-100 rounded-full w-1/3" />
                </div>
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <div className="flex-1 h-8 bg-gray-100 rounded-xl" />
                <div className="flex-1 h-8 bg-amber-100 rounded-xl" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Clock className="w-9 h-9 text-amber-300" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-gray-800">No orders yet</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                {activeFilter === "ALL"
                  ? "You haven't placed any orders yet. Start exploring our menu!"
                  : `No ${activeFilter.toLowerCase().replace("_", "-")} orders found.`}
              </p>
            </div>
            <button
              onClick={() => router.push("/home")}
              className="mt-2 bg-amber-500 text-white font-extrabold text-xs px-7 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          // Order cards
          filtered.map((order: any) => {
            const restaurantName: string =
              order.branch?.restaurant?.name ||
              order.branch?.name ||
              "Restaurant"
            const restaurantId: string | null =
              order.branch?.restaurant?.id || null


            const firstItem = (order.items || [])[0]
            const firstImage = firstItem?.menu_item?.image_url
            const itemCount = (order.items || []).reduce(
              (s: number, it: any) => s + (it.quantity || 1), 0
            )
            const totalNum = parseFloat((order.total_amount || 0).toString())
            const orderDate = new Date(order.created_at).toLocaleDateString([], {
              month: "short", day: "numeric", year: "numeric"
            })
            const orderTime = new Date(order.created_at).toLocaleTimeString([], {
              hour: "2-digit", minute: "2-digit"
            })

            const orderTypeLabel =
              order.order_type === "DINE_IN"  ? "Dine-In"  :
              order.order_type === "TAKEAWAY" ? "Takeaway" :
              order.order_type === "DELIVERY" ? "Delivery" : "Order"

            const statusLabel = STATUS_LABEL[order.status] || order.status
            const statusColor = STATUS_COLOR[order.status] || "text-gray-500 bg-gray-50 border-gray-200"

            return (
              <div
                key={order.id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/70 border-b border-gray-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-extrabold text-gray-800 truncate">
                      {restaurantName}
                    </span>
                    {(order as any).order_number && (
                      <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-200 text-gray-800 border border-gray-300">
                        #{(order as any).order_number}
                      </span>
                    )}
                    <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200">
                      {orderTypeLabel}
                    </span>
                  </div>
                  <span className={`shrink-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Card Body */}
                <div className="flex gap-3 px-4 py-3">
                  {/* Food thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
                    {firstImage ? (
                      <img src={firstImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🍽️</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-gray-900 leading-snug line-clamp-1">
                      {firstItem?.menu_item?.display_name || "Item"}
                    </p>
                    {order.items?.length > 1 && (
                      <p className="text-[9px] text-gray-400 mt-0.5">
                        + {order.items.length - 1} more item{order.items.length - 1 !== 1 ? "s" : ""}
                      </p>
                    )}
                    <p className="text-[9px] text-gray-400 mt-1">
                      {orderDate} · {orderTime}
                    </p>
                    <p className="text-[9px] text-gray-400">
                      {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="shrink-0 text-right pt-0.5">
                    <p className="font-extrabold text-sm text-gray-900">${totalNum.toFixed(2)}</p>
                  </div>
                </div>

                {/* Card Footer — action buttons */}
                <div className="flex items-center gap-2 px-4 pb-3">
                  <button
                    onClick={() => showToast("Invoice feature coming soon!", "🧾")}
                    className="flex-1 py-2 rounded-xl border border-gray-200 text-[10px] font-bold text-gray-600 bg-white active:bg-gray-50 transition-all active:scale-95"
                  >
                    Get Invoice
                  </button>
                  <button
                    onClick={() => {
                      if (restaurantId) {
                        router.push(`/menu/${restaurantId}?orderType=${order.order_type || "DINE_IN"}`)
                      } else {
                        router.push("/home")
                      }
                    }}
                    className="flex-1 py-2 rounded-xl bg-amber-500 text-[10px] font-extrabold text-white active:bg-amber-600 transition-all active:scale-95 shadow-sm"
                  >
                    Order Again
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
