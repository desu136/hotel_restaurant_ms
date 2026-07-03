"use client"
import * as React from "react"
import { 
  Bell, Clock, CheckCircle2, AlertTriangle, Coffee, 
  Utensils, Wifi, WifiOff, RefreshCw, ChefHat, User
} from "lucide-react"

interface OrderItem {
  id: string
  quantity: number
  menu_item: { display_name: string }
}

interface ReadyOrder {
  id: string
  order_number?: string | null
  table_id: string | null
  waiter_id: string | null
  status: string
  order_type: string
  total_amount: number
  created_at: string
  items: OrderItem[]
  table: {
    id: string
    table_number: string
    waiter: {
      id: string
      full_name: string
    } | null
  } | null
}

interface Restaurant {
  id: string
  name: string
}

export default function WaiterScreenPage() {
  const [me, setMe] = React.useState<{ id: string; name: string; branchId?: string | null } | null>(null)
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([])
  const [selectedRestId, setSelectedRestId] = React.useState("")
  const [branches, setBranches] = React.useState<{ id: string; name: string; restaurant_id: string }[]>([])
  const [selectedBranchId, setSelectedBranchId] = React.useState("")
  const [orders, setOrders] = React.useState<ReadyOrder[]>([])
  const [loading, setLoading] = React.useState(true)
  const [online, setOnline] = React.useState(true)
  const [time, setTime] = React.useState(new Date())

  // Fetch initial auth user info, restaurants and branches
  React.useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        const [meRes, restRes, branchRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/restaurant/list"),
          fetch("/api/branches")
        ])

        const meData = meRes.ok ? await meRes.json() : null
        const loggedInUser = meData?.success && meData?.user ? meData.user : null

        const restData = restRes.ok ? await restRes.json() : []
        setRestaurants(restData)

        const branchData = branchRes.ok ? await branchRes.json() : []
        setBranches(branchData)

        let finalMe = null
        if (loggedInUser) {
          finalMe = {
            id: loggedInUser.id,
            name: loggedInUser.name,
            branchId: loggedInUser.branchId
          }
          setMe(finalMe)
        }

        let activeRestId = ""
        let activeBranchId = ""

        if (finalMe?.branchId) {
          const myBranch = branchData.find((b: any) => b.id === finalMe.branchId)
          activeBranchId = finalMe.branchId
          activeRestId = myBranch?.restaurant_id || restData[0]?.id || ""
        } else {
          activeRestId = restData[0]?.id || ""
          const restaurantBranches = branchData.filter((b: any) => b.restaurant_id === activeRestId)
          activeBranchId = restaurantBranches[0]?.id || ""
        }

        setSelectedRestId(activeRestId)
        setSelectedBranchId(activeBranchId)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Poll ready orders
  const fetchReadyOrders = React.useCallback(async (silent = false) => {
    if (!selectedRestId) return
    if (!silent) setLoading(true)
    try {
      let url = `/api/orders/public/ready/${selectedRestId}`
      if (selectedBranchId) {
        url += `?branch_id=${selectedBranchId}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOrders(data)
      setOnline(true)
    } catch {
      setOnline(false)
    } finally {
      setLoading(false)
    }
  }, [selectedRestId, selectedBranchId])

  React.useEffect(() => {
    fetchReadyOrders()
    const timer = setInterval(() => fetchReadyOrders(true), 5000)
    return () => clearInterval(timer)
  }, [fetchReadyOrders])

  const handleRestaurantChange = (rId: string) => {
    setSelectedRestId(rId)
    const restaurantBranches = branches.filter(b => b.restaurant_id === rId)
    setSelectedBranchId(restaurantBranches[0]?.id || "")
  }

  const handleBranchChange = (bId: string) => {
    setSelectedBranchId(bId)
  }

  // Clock ticker
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 10000)
    return () => clearInterval(t)
  }, [])

  const getElapsedMins = (createdAt: string) =>
    Math.floor((time.getTime() - new Date(createdAt).getTime()) / 60000)

  if (loading && restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm text-[var(--muted)]">Loading Waiter Display Screen…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col pb-12">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-4 bg-[var(--surface)] border border-[var(--surface-border)] p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-500">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Ready Orders Unified Screen 🍽️
              <span className={`w-2 h-2 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            </h1>
            <p className="text-xs text-[var(--muted)]">Displays all ready orders to be served by assigned waiters</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!me?.branchId ? (
            <>
              {restaurants.length > 1 && (
                <select
                  value={selectedRestId}
                  onChange={e => handleRestaurantChange(e.target.value)}
                  className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}
              <select
                value={selectedBranchId}
                onChange={e => handleBranchChange(e.target.value)}
                className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">— Select Branch —</option>
                {branches
                  .filter(b => b.restaurant_id === selectedRestId)
                  .map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))
                }
              </select>
            </>
          ) : (
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-orange-500/10 text-orange-400 border-orange-500/20">
              📍 {branches.find(b => b.id === me.branchId)?.name || "Assigned Branch"}
            </span>
          )}

          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
            online
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}>
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {online ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      {orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[var(--surface-border)] rounded-2xl p-12 text-center">
          <Utensils className="w-12 h-12 text-[var(--muted)] opacity-20 mb-3" />
          <h3 className="text-lg font-bold text-white">No Ready Orders</h3>
          <p className="text-xs text-[var(--muted)] mt-1">Ready orders from the kitchen will appear here instantly.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 min-h-0 pr-1">
          {orders.map(order => {
            const elapsed = getElapsedMins(order.created_at)
            const isLate = elapsed >= 10
            return (
              <div 
                key={order.id} 
                className={`flex flex-col bg-[var(--surface)] border rounded-2xl overflow-hidden shadow-md transition-all ${
                  isLate 
                    ? "border-red-500/30 ring-1 ring-red-500/10" 
                    : "border-[var(--surface-border)]"
                }`}
              >
                {/* Card Header */}
                <div className={`px-4 py-3 border-b flex justify-between items-start gap-2 ${
                  isLate ? "bg-red-500/5 border-red-500/20" : "bg-[var(--surface-hover)]/30 border-[var(--surface-border)]"
                }`}>
                  <div>
                    <span className="text-[10px] font-mono text-[var(--muted)]">ORDER {order.order_number ? `#${order.order_number} (${order.id.slice(-6).toUpperCase()})` : `#${order.id.slice(-6).toUpperCase()}`}</span>
                    <h2 className="text-lg font-black text-white mt-0.5">
                      {order.table ? `Table ${order.table.table_number}` : order.order_type === "DINE_IN" ? "Pre-order Dine-In" : order.order_type === "DELIVERY" ? "Delivery" : "Takeaway"}
                    </h2>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`flex items-center gap-1 text-xs font-semibold ${
                      isLate ? "text-red-400 font-bold" : "text-amber-400"
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      {elapsed}m ago
                    </span>
                    {isLate && (
                      <span className="text-[9px] text-red-500 font-black tracking-wider flex items-center gap-0.5 mt-0.5 uppercase">
                        <AlertTriangle className="w-3 h-3" /> LATE
                      </span>
                    )}
                  </div>
                </div>

                {/* Waiter info */}
                <div className="px-4 py-2 bg-blue-500/5 border-b border-[var(--surface-border)] flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-blue-400">
                    Waiter: {order.table?.waiter?.full_name || "Unassigned"}
                  </span>
                </div>

                {/* Items */}
                <div className="flex-1 p-4 space-y-2 max-h-48 overflow-y-auto">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-orange-500 font-black shrink-0">{it.quantity}×</span>
                      <span className="text-white font-medium">{it.menu_item.display_name}</span>
                    </div>
                  ))}
                </div>

                {/* Footer status indicator */}
                <div className="px-4 py-2.5 bg-[var(--surface-hover)]/20 border-t border-[var(--surface-border)] flex justify-between items-center text-[10px] text-[var(--muted)]">
                  <span>DINE_IN</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold uppercase tracking-wider">
                    READY TO SERVE
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
