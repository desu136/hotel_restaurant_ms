"use client"

import * as React from "react"
import { Bell, Wifi, WifiOff, Utensils, RefreshCw } from "lucide-react"
import { WaiterScreenOrderCard } from "./components/WaiterScreenOrderCard"

interface Restaurant { id: string; name: string }

export function WaiterScreenClientView() {
  const [me, setMe] = React.useState<{ id: string; name: string; branchId?: string | null } | null>(null)
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([])
  const [selectedRestId, setSelectedRestId] = React.useState("")
  const [branches, setBranches] = React.useState<any[]>([])
  const [selectedBranchId, setSelectedBranchId] = React.useState("")
  const [orders, setOrders] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [online, setOnline] = React.useState(true)

  React.useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        const [meRes, restRes, branchRes] = await Promise.all([
          fetch("/api/auth/me"), fetch("/api/restaurant/list"), fetch("/api/branches")
        ])
        const meData = meRes.ok ? await meRes.json() : null
        const restData = restRes.ok ? await restRes.json() : []
        const branchData = branchRes.ok ? await branchRes.json() : []

        setRestaurants(restData); setBranches(branchData)
        const user = meData?.success ? meData.user : null
        if (user) setMe({ id: user.id, name: user.name, branchId: user.branch_id })

        let rId = restData[0]?.id || ""
        let bId = user?.branch_id || branchData[0]?.id || ""
        setSelectedRestId(rId); setSelectedBranchId(bId)
      } finally { setLoading(false) }
    }
    init()
  }, [])

  const fetchReadyOrders = React.useCallback(async (silent = false) => {
    if (!selectedRestId) return
    if (!silent) setLoading(true)
    try {
      let url = `/api/orders/public/ready/${selectedRestId}`
      if (selectedBranchId) url += `?branch_id=${selectedBranchId}`
      const res = await fetch(url)
      if (!res.ok) throw new Error()
      setOrders(await res.json())
      setOnline(true)
    } catch { setOnline(false) } finally { setLoading(false) }
  }, [selectedRestId, selectedBranchId])

  React.useEffect(() => {
    fetchReadyOrders()
    const timer = setInterval(() => fetchReadyOrders(true), 5000)
    return () => clearInterval(timer)
  }, [fetchReadyOrders])

  if (loading && restaurants.length === 0) {
    return <div className="flex items-center justify-center py-20 gap-2"><RefreshCw className="w-6 h-6 animate-spin text-orange-500" /><span className="text-xs">Loading screen…</span></div>
  }

  return (
    <div className="space-y-6 flex flex-col pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[var(--foreground)] text-[var(--background)] p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-amber-400 animate-bounce" />
          <div>
            <h1 className="text-lg font-black flex items-center gap-2">Ready Orders Display Screen</h1>
            <p className="text-xs opacity-80">Real-time alerts for dishes ready to serve</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {restaurants.length > 1 && (
            <select value={selectedRestId} onChange={e => setSelectedRestId(e.target.value)} className="text-xs font-bold rounded-lg px-2.5 py-1 text-[var(--foreground)]">
              {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}

          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${online ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />} {online ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-[var(--surface-border)] bg-[var(--surface)] text-[var(--muted)]">
          <Utensils className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <h3 className="text-sm font-bold">No Ready Orders</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {orders.map(order => {
            const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
            return <WaiterScreenOrderCard key={order.id} order={order} elapsed={elapsed} />
          })}
        </div>
      )}
    </div>
  )
}
