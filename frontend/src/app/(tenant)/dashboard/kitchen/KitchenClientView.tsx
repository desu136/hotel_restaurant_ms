"use client"

import * as React from "react"
import { Loader2, ChefHat, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { KitchenOrderCard } from "./components/KitchenOrderCard"

function buildTicketHTML(order: any): string {
  const tableLabel = order.table ? `Table ${order.table.table_number}` : order.order_type
  const timeStr = new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const orderNum = order.order_number ? `#${order.order_number}` : `#${order.id.slice(-6).toUpperCase()}`

  const itemRows = order.items?.map((it: any) => `
    <div style="margin-bottom:6px;">
      <span style="font-weight:bold;">${it.quantity}&times;&nbsp;${it.menu_item?.display_name}</span>
    </div>`).join("") ?? ""

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Ticket ${orderNum}</title>
  <style>body{font-family:monospace;font-size:13px;padding:8px;width:72mm;}</style></head>
  <body><div style="text-align:center;font-weight:bold;">🍽 KITCHEN TICKET</div><hr/>
  <div>Order ${orderNum}</div><div>${tableLabel}</div><div>Time: ${timeStr}</div><hr/>
  <div>Items:</div>${itemRows}</body></html>`
}

export function KitchenClientView() {
  const [orders, setOrders] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [online, setOnline] = React.useState(true)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  const printIframeRef = React.useRef<HTMLIFrameElement | null>(null)

  const printOrderTicket = React.useCallback((order: any) => {
    const iframe = printIframeRef.current
    if (!iframe) return
    const html = buildTicketHTML(order)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    doc.open(); doc.write(html); doc.close()
    try { iframe.contentWindow?.print() } catch {
      const w = window.open("", "_blank")
      if (w) { w.document.write(html); w.document.close(); w.print() }
    }
  }, [])

  const fetchOrders = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch("/api/orders?limit=60")
      if (!res.ok) throw new Error("Fetch failed")
      const data = await res.json()
      const active = data.filter((o: any) => !["COMPLETED", "CANCELLED"].includes(o.status))
      setOrders(active)
      setOnline(true)
    } catch {
      setOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchOrders()
    const poll = setInterval(() => fetchOrders(true), 6000)
    return () => clearInterval(poll)
  }, [fetchOrders])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) await fetchOrders(true)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" /></div>

  return (
    <div className="space-y-6 pb-12">
      <iframe ref={printIframeRef} className="hidden" title="print-frame" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-[var(--color-primary-600)]" /> Kitchen Display System
          </h1>
          <p className="text-[var(--muted)] text-sm mt-1">Real-time incoming food preparation queue</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${online ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {online ? "Live Feed Active" : "Disconnected"}
          </span>

          <button onClick={() => fetchOrders()} className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[var(--surface-border)] rounded-xl text-xs font-bold hover:bg-[var(--surface-hover)]">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--surface-border)] py-20 text-center bg-[var(--surface)]">
          <ChefHat className="w-12 h-12 mx-auto text-[var(--muted)] mb-3 opacity-30" />
          <h3 className="text-base font-bold mb-1">Kitchen Queue Clear</h3>
          <p className="text-xs text-[var(--muted)]">No pending or active orders right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map(order => (
            <KitchenOrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} onPrintTicket={printOrderTicket} updatingId={updatingId} />
          ))}
        </div>
      )}
    </div>
  )
}
