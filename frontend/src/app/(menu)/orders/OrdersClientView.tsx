"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Clock } from "lucide-react"
import { getUserProfile } from "@/lib/miniapp-bridge"
import { AnimatePresence } from "framer-motion"
import { OrdersHeader, type FilterTab } from "./components/OrdersHeader"
import { CustomerOrderCard } from "./components/CustomerOrderCard"
import { DeliveryQRModal } from "./components/DeliveryQRModal"

export default function OrdersClientView() {
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
      if (saved) setTheme(saved)
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark")
    }
  }, [])

  const showToast = (msg: string, icon = "✅") => {
    setToast({ msg, icon }); setTimeout(() => setToast(null), 2800)
  }

  const fetchOrders = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      let ssoOrders: any[] = []
      try {
        const profile = await getUserProfile()
        if (profile?.id) {
          const res = await fetch(`/api/orders/public/history?userId=${encodeURIComponent(profile.id)}`)
          if (res.ok) ssoOrders = await res.json()
        }
      } catch (_) {}

      const localIds: string[] = []
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith("placed_orders_")) {
            try { const ids: string[] = JSON.parse(localStorage.getItem(key) || "[]"); localIds.push(...ids) } catch (_) {}
          }
        }
      }
      const ssoIds = new Set(ssoOrders.map((o: any) => o.id))
      const remaining = localIds.filter(id => !ssoIds.has(id))
      let localOrders: any[] = []
      if (remaining.length > 0) {
        try {
          const res = await fetch(`/api/orders/public/history?orderIds=${remaining.join(",")}`)
          if (res.ok) localOrders = await res.json()
        } catch (_) {}
      }
      const all = [...ssoOrders, ...localOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setOrders(all)
    } finally { setLoading(false); setRefreshing(false) }
  }, [])

  React.useEffect(() => { fetchOrders() }, [fetchOrders])

  React.useEffect(() => {
    if (!activeQrOrder) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/public/${activeQrOrder.id}`)
        if (res.ok) {
          const order = await res.json()
          if (order.status === "COMPLETED") {
            showToast("Order delivered! Enjoy your meal! 🍽️", "✅")
            setActiveQrOrder(null); fetchOrders(true)
          }
        }
      } catch (_) {}
    }, 3000)
    return () => clearInterval(interval)
  }, [activeQrOrder, fetchOrders])

  const filtered = React.useMemo(() => {
    let list = activeFilter === "ALL" ? orders : orders.filter(o => o.order_type === activeFilter)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(o => {
        const restName = (o.branch?.restaurant?.name || o.branch?.name || "").toLowerCase()
        const orderNum = (o.order_number || "").toString().toLowerCase()
        const orderIdVal = (o.id || "").toString().toLowerCase()
        const hasItem = (o.items || []).some((it: any) => (it.menu_item?.display_name || it.menu_item?.name || "").toLowerCase().includes(q))
        return restName.includes(q) || orderNum.includes(q) || orderIdVal.includes(q) || hasItem
      })
    }
    return list
  }, [orders, activeFilter, searchQuery])

  const themeBg = theme === "dark" ? "bg-[#030712] text-white" : "bg-gray-50 text-gray-900"
  const themePanel = theme === "dark" ? "bg-[#0b0f19] border-white/5" : "bg-white border-gray-100"

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${themeBg}`}>
      <AnimatePresence>
        {toast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] text-xs font-bold px-5 py-3 rounded-full shadow-xl flex items-center gap-2 border backdrop-blur-md transition-all ${theme === "dark" ? "bg-gray-900/90 text-white border-white/10" : "bg-white/90 text-gray-800 border-gray-100"}`}>
            <span>{toast.icon}</span><span>{toast.msg}</span>
          </div>
        )}
      </AnimatePresence>

      <OrdersHeader theme={theme} showSearch={showSearch} searchQuery={searchQuery} activeFilter={activeFilter} orders={orders} refreshing={refreshing}
        onToggleTheme={() => { const next = theme === "dark" ? "light" : "dark"; setTheme(next); localStorage.setItem("menu-theme", next) }}
        onToggleSearch={() => { setShowSearch(s => !s); if (showSearch) setSearchQuery("") }}
        onSearchChange={setSearchQuery} onFilterChange={setActiveFilter} onRefresh={() => fetchOrders(true)} />

      <div className="flex-1 px-4 py-4 flex flex-col gap-3.5 pb-12">
        {loading ? (
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
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className={`w-20 h-20 rounded-full border flex items-center justify-center ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-amber-50 border-amber-100"}`}>
              <Clock className="w-9 h-9 text-amber-500/80" />
            </div>
            <div>
              <p className={`font-black text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>No orders yet</p>
              <p className={`text-[11px] ${theme === "dark" ? "text-gray-400" : "text-gray-500"} mt-1 max-w-[200px] mx-auto leading-relaxed`}>
                {activeFilter === "ALL" ? "You haven't placed any orders yet. Start exploring our menu!" : `No ${activeFilter.toLowerCase().replace("_", "-")} orders found.`}
              </p>
            </div>
            <button onClick={() => router.push("/home")} className="mt-2 bg-amber-500 text-black font-extrabold text-xs px-7 py-2.5 rounded-xl active:scale-95 shadow-sm">
              Browse Menu
            </button>
          </div>
        ) : (
          filtered.map(order => (
            <CustomerOrderCard key={order.id} order={order} theme={theme} onShowQR={setActiveQrOrder} onShowToast={showToast} />
          ))
        )}
      </div>

      <DeliveryQRModal activeQrOrder={activeQrOrder} theme={theme} onClose={() => setActiveQrOrder(null)} />
    </div>
  )
}
