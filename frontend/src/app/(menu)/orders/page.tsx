"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, ChevronRight, Clock, QrCode, Sun, Moon, Search, X } from "lucide-react"
import { getUserProfile } from "@/lib/miniapp-bridge"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"

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
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showSearch, setShowSearch] = React.useState(false)
  const [toast, setToast] = React.useState<{ msg: string; icon: string } | null>(null)
  const [activeQrOrder, setActiveQrOrder] = React.useState<any | null>(null)
  const [theme, setTheme] = React.useState<"light" | "dark">("light")

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("menu-theme") as "light" | "dark" | null
      if (saved) {
        setTheme(saved)
      } else {
        const darkQuery = window.matchMedia("(prefers-color-scheme: dark)")
        if (darkQuery.matches) {
          setTheme("dark")
        }
      }
    }
  }, [])



  const themeBg = theme === "dark" ? "bg-[#030712] text-white" : "bg-gray-50 text-gray-900"
  const themeCard = theme === "dark" ? "bg-[#0b0f19] border-white/5 text-white" : "bg-white border-gray-100 text-gray-900"
  const themePanel = theme === "dark" ? "bg-[#0b0f19] border-white/5" : "bg-white border-gray-100"
  const themeBorder = theme === "dark" ? "border-white/5" : "border-gray-100"
  const themeTextTitle = theme === "dark" ? "text-white font-extrabold" : "text-gray-900 font-extrabold"
  const themeTextMuted = theme === "dark" ? "text-gray-400" : "text-gray-500"

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

  React.useEffect(() => {
    if (!activeQrOrder) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/public/${activeQrOrder.id}`)
        if (res.ok) {
          const order = await res.json()
          if (order.status === "COMPLETED") {
            showToast("Order delivered! Enjoy your meal! 🍽️", "✅")
            setActiveQrOrder(null)
            fetchOrders(true)
          }
        }
      } catch (_) {}
    }, 3000)

    return () => clearInterval(interval)
  }, [activeQrOrder, fetchOrders]);

  // ── Filter & Search ────────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    let list = activeFilter === "ALL"
      ? orders
      : orders.filter(o => o.order_type === activeFilter)

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(o => {
        const restName = (o.branch?.restaurant?.name || o.branch?.name || "").toLowerCase()
        const orderNum = (o.order_number || "").toString().toLowerCase()
        const orderIdVal = (o.id || "").toString().toLowerCase()
        const hasItem = (o.items || []).some((it: any) => 
          (it.menu_item?.display_name || it.menu_item?.name || "").toLowerCase().includes(q)
        )
        return restName.includes(q) || orderNum.includes(q) || orderIdVal.includes(q) || hasItem
      })
    }
    return list
  }, [orders, activeFilter, searchQuery])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${themeBg}`}>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] text-xs font-bold px-5 py-3 rounded-full shadow-xl flex items-center gap-2 border backdrop-blur-md transition-all ${
            theme === "dark" 
              ? "bg-gray-900/90 text-white border-white/10" 
              : "bg-white/90 text-gray-800 border-gray-100"
          }`}>
            <span>{toast.icon}</span>
            <span>{toast.msg}</span>
          </div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className={`sticky top-0 z-40 border-b transition-colors ${
        theme === "dark" ? "bg-gray-900/80 border-white/5 backdrop-blur-md" : "bg-white border-gray-100 shadow-sm"
      }`}>
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => router.back()}
            className={`p-2 -ml-1 rounded-full transition-colors ${
              theme === "dark" ? "hover:bg-white/5 text-white" : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className={`font-black text-sm uppercase tracking-wider ${themeTextTitle}`}>My Orders</h1>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setShowSearch(s => !s)
                if (showSearch) setSearchQuery("")
              }}
              className={`p-2 rounded-full border transition-all active:scale-90 ${
                showSearch
                  ? (theme === "dark" ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600")
                  : (theme === "dark" ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10" : "bg-white border-gray-100 shadow-sm text-gray-500 hover:text-amber-600 hover:bg-gray-50")
              }`}
              title="Search Orders"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const next = theme === "dark" ? "light" : "dark"
                setTheme(next)
                localStorage.setItem("menu-theme", next)
              }}
              className={`p-2 rounded-full border transition-all active:scale-90 ${
                theme === "dark" 
                  ? "bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10" 
                  : "bg-white border-gray-100 shadow-sm text-amber-600 hover:bg-gray-50"
              }`}
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className={`p-2 rounded-full transition-colors ${
                theme === "dark" ? "hover:bg-white/5 text-gray-300" : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Collapsible Search Panel ── */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              key="orders-search"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden px-4 pb-2"
            >
              <div className={`relative flex items-center rounded-xl border transition-all ${
                theme === "dark" 
                  ? "bg-white/5 border-white/10 focus-within:border-amber-500/50" 
                  : "bg-gray-100 border-gray-200 focus-within:border-amber-500 focus-within:bg-white"
              }`}>
                <Search className={`w-3.5 h-3.5 absolute left-3 pointer-events-none ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`} />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by restaurant, #number, items..."
                  className={`w-full bg-transparent pl-9 pr-8 py-2.5 text-xs outline-none ${
                    theme === "dark" ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className={`absolute right-2.5 p-1 rounded-full transition-colors ${
                      theme === "dark" ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-400 hover:text-gray-800"
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Filter Tabs ── */}
        <div className="flex gap-0 px-4 pb-0 overflow-x-auto scrollbar-none">
          {FILTER_TABS.map(tab => {
            const count = tab.key === "ALL"
              ? orders.length
              : orders.filter(o => o.order_type === tab.key).length
            const isSelected = activeFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`relative shrink-0 px-4 py-3 text-xs font-bold transition-colors ${
                  isSelected
                    ? "text-amber-500"
                    : (theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-600")
                }`}
              >
                {tab.label}
                {count > 0 && tab.key !== "ALL" && (
                  <span className={`ml-1 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-amber-500 text-black"
                      : (theme === "dark" ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-400")
                  }`}>{count}</span>
                )}
                {isSelected && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-3.5 pb-12">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`rounded-2xl border overflow-hidden animate-pulse ${themePanel}`}>
              <div className={`h-10 ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`} />
              <div className="flex gap-3 p-4">
                <div className={`w-14 h-14 rounded-xl shrink-0 ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`} />
                <div className="flex-1 flex flex-col gap-2 pt-1">
                  <div className={`h-3 rounded-full w-3/4 ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`} />
                  <div className={`h-2 rounded-full w-1/2 ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`} />
                </div>
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <div className={`flex-1 h-8 rounded-xl ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`} />
                <div className="flex-1 h-8 bg-amber-500/20 rounded-xl" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className={`w-20 h-20 rounded-full border flex items-center justify-center ${
              theme === "dark" ? "bg-white/5 border-white/10" : "bg-amber-50 border-amber-100"
            }`}>
              <Clock className="w-9 h-9 text-amber-500/80" />
            </div>
            <div>
              <p className={`font-black text-sm ${themeTextTitle}`}>No orders yet</p>
              <p className={`text-[11px] ${themeTextMuted} mt-1 max-w-[200px] mx-auto leading-relaxed`}>
                {activeFilter === "ALL"
                  ? "You haven't placed any orders yet. Start exploring our menu!"
                  : `No ${activeFilter.toLowerCase().replace("_", "-")} orders found.`}
              </p>
            </div>
            <button
              onClick={() => router.push("/home")}
              className="mt-2 bg-amber-500 text-black font-extrabold text-xs px-7 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm"
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
            const statusColor =
              order.status === "PENDING" ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
              order.status === "PREPARING" ? "text-blue-500 bg-blue-500/10 border-blue-500/20" :
              order.status === "READY" ? "text-green-500 bg-green-500/10 border-green-500/20" :
              order.status === "COMPLETED" ? "text-gray-400 bg-white/5 border-white/10" :
              "text-red-500 bg-red-500/10 border-red-200"

            return (
              <div
                key={order.id}
                className={`border rounded-2xl overflow-hidden shadow-sm transition-colors ${themeCard}`}
              >
                {/* Card Header */}
                <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
                  theme === "dark" ? "bg-white/[0.01] border-white/5" : "bg-gray-50/70 border-gray-100"
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[11px] font-extrabold truncate ${themeTextTitle}`}>
                      {restaurantName}
                    </span>
                    <span className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded border ${
                      theme === "dark" ? "bg-white/5 border-white/10 text-gray-300" : "bg-gray-200 text-gray-800 border-gray-300"
                    }`}>
                      #{order.order_number || order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
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
                  <div className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border ${
                    theme === "dark" ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
                  }`}>
                    {firstImage ? (
                      <img src={firstImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🍽️</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-xs leading-snug line-clamp-1 ${themeTextTitle}`}>
                      {firstItem?.menu_item?.display_name || "Item"}
                    </p>
                    {order.items?.length > 1 && (
                      <p className={`text-[9px] ${themeTextMuted} mt-0.5`}>
                        + {order.items.length - 1} more item{order.items.length - 1 !== 1 ? "s" : ""}
                      </p>
                    )}
                    <p className={`text-[9px] ${themeTextMuted} mt-1`}>
                      {orderDate} · {orderTime}
                    </p>
                    <p className={`text-[9px] ${themeTextMuted}`}>
                      {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="shrink-0 text-right pt-0.5">
                    <p className="font-extrabold text-sm text-amber-500">${totalNum.toFixed(2)}</p>
                  </div>
                </div>



                {/* Card Footer — action buttons */}
                <div className="flex items-center gap-2 px-4 pb-3 border-t border-gray-50 dark:border-white/5 pt-3">
                  {order.status === "READY" ? (
                    <button
                      onClick={() => setActiveQrOrder(order)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[10px] font-extrabold text-white transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Show QR Code
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => showToast("Invoice feature coming soon!", "🧾")}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all active:scale-95 ${
                          theme === "dark"
                            ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
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
                        className="flex-1 py-2 rounded-xl bg-amber-500 text-[10px] font-extrabold text-black active:bg-amber-400 transition-all active:scale-95 shadow-sm"
                      >
                        Order Again
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* activeQrOrder Modal */}
      {activeQrOrder && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className={`w-full max-w-sm border rounded-3xl overflow-hidden shadow-2xl relative flex flex-col transition-transform duration-300 ${
            theme === "dark" ? "bg-[#0b0f19] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
          }`}>
            {/* Header */}
            <div className={`p-5 border-b flex justify-between items-center shrink-0 ${
              theme === "dark" ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-gray-100"
            }`}>
              <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${themeTextTitle}`}>
                <QrCode className="w-4 h-4 text-amber-500" />
                Order QR Code
              </h3>
              <button
                onClick={() => setActiveQrOrder(null)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                  theme === "dark"
                    ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                Close
              </button>
            </div>

            {/* QR Content */}
            <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
              <p className={`text-xs font-bold ${themeTextTitle}`}>
                Share this QR code with the waiter to verify and confirm your order delivery.
              </p>

              <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-inner flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent("order_delivery:" + activeQrOrder.id)}`}
                  alt="Order QR Code"
                  className="w-52 h-52 object-contain"
                />
              </div>

              <div className="space-y-1 mt-2">
                <p className={`text-xs font-black uppercase tracking-wider ${themeTextTitle}`}>
                  Order #{activeQrOrder.order_number || activeQrOrder.id.slice(-6).toUpperCase()}
                </p>
                <p className={`text-[10px] ${themeTextMuted}`}>
                  {activeQrOrder.branch?.restaurant?.name || activeQrOrder.branch?.name || "Restaurant"}
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
