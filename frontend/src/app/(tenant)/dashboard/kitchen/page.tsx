"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChefHat, Play, CheckCircle2, Clock,
  MessageSquare, Flame, AlertTriangle, Award,
  RefreshCw, Printer, Wifi, WifiOff
} from "lucide-react"

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  customizations?: Record<string, string | string[]> | null
  notes?: string | null
  menu_item: {
    id: string
    display_name: string
  }
}

interface KitchenOrder {
  id: string
  status: string
  order_type: string
  total_amount: string | number
  created_at: string
  notes?: string | null
  table?: { id: string; table_number: number } | null
  items: OrderItem[]
}

function getOrderTypeLabel(order: KitchenOrder): string {
  if (order.table) {
    return `Table ${order.table.table_number}`;
  }
  switch (order.order_type) {
    case "DINE_IN":
      return "Pre-order Dine-In";
    case "TAKEAWAY":
      return "Takeaway";
    case "DELIVERY":
      return "Delivery";
    default:
      return "Takeaway";
  }
}

// ─── Build HTML for a kitchen ticket ─────────────────────────────
function buildTicketHTML(order: KitchenOrder): string {
  const tableLabel = getOrderTypeLabel(order)
  const timeStr = new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const orderNum = order.id.slice(-6).toUpperCase()

  const itemRows = order.items.map(it => {
    const custLines = it.customizations
      ? Object.entries(it.customizations)
        .filter(([, v]) => (Array.isArray(v) ? v.length > 0 : !!v))
        .map(([k, v]) => `<div style="margin-left:28px;color:#555;font-size:11px;">&#8627; ${k}: ${Array.isArray(v) ? v.join(", ") : v}</div>`)
        .join("")
      : ""
    return `
      <div style="margin-bottom:6px;">
        <span style="font-weight:bold;">${it.quantity}&times;&nbsp;${it.menu_item.display_name}</span>
        ${custLines}
      </div>`
  }).join("")

  const totalStr = parseFloat(order.total_amount.toString()).toFixed(2)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ticket #${orderNum}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: #000;
      background: #fff;
      padding: 8px;
      width: 72mm;
    }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .large { font-size: 16px; font-weight: bold; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #444; }
    .total { font-size: 15px; font-weight: bold; }
    @media print {
      @page { size: 72mm auto; margin: 2mm; }
      html, body { width: 72mm; }
    }
  </style>
</head>
<body>
  <div class="center bold" style="font-size:15px;">&#x1F37D; KITCHEN TICKET</div>
  <div class="divider"></div>
  <div class="label">Order</div>
  <div class="large">#${orderNum}</div>
  <div style="margin-top:4px;">${tableLabel}</div>
  <div class="label" style="margin-top:2px;">Placed at ${timeStr}</div>
  <div class="divider"></div>
  <div class="label" style="margin-bottom:6px;">Items</div>
  ${itemRows}
  ${order.notes ? `<div class="divider"></div><div style="font-size:11px;">&#x1F4DD; <em>${order.notes}</em></div>` : ""}
  <div class="divider"></div>
  <div class="label">Total</div>
  <div class="total">ETB ${totalStr}</div>
  <div class="divider"></div>
</body>
</html>`
}


// ─── Main Component ────────────────────────────────────────────────
export default function KitchenDashboard() {
  const [orders, setOrders] = React.useState<KitchenOrder[]>([])
  const [loading, setLoading] = React.useState(true)
  const [online, setOnline] = React.useState(true)
  const [time, setTime] = React.useState(new Date())
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  const prevOrderIdsRef = React.useRef<Set<string>>(new Set())
  // Hidden iframe used for instant silent printing (no popup dialog)
  const printIframeRef = React.useRef<HTMLIFrameElement | null>(null)

  // ── Silent iframe print – fires print job immediately without user click ──
  const printOrderTicket = React.useCallback((order: KitchenOrder) => {
    const iframe = printIframeRef.current
    if (!iframe) return
    const html = buildTicketHTML(order)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    doc.open()
    doc.write(html)
    doc.close()
    // Give browser one tick to render the iframe content, then print silently
    iframe.onload = () => {
      try {
        iframe.contentWindow?.print()
      } catch {
        // fallback: open in new tab if iframe print is blocked
        const w = window.open("", "_blank")
        if (w) { w.document.write(html); w.document.close(); w.print() }
      }
      iframe.onload = null
    }
  }, [])

  // ── Fetch live orders from API ──
  const fetchOrders = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch("/api/orders?limit=60")
      if (!res.ok) throw new Error("fetch failed")
      const data: KitchenOrder[] = await res.json()
      // Only show active (non-completed, non-cancelled) orders
      const active = data.filter(o =>
        !["COMPLETED", "CANCELLED"].includes(o.status)
      )

      // Detect new orders to auto-print
      const currentIds = new Set(active.map(o => o.id))
      if (prevOrderIdsRef.current.size > 0) {
        for (const o of active) {
          if (!prevOrderIdsRef.current.has(o.id)) {
            // New order appeared – auto print
            printOrderTicket(o)
          }
        }
      }
      prevOrderIdsRef.current = currentIds
      setOrders(active)
      setOnline(true)
    } catch {
      setOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch + polling every 6 seconds
  React.useEffect(() => {
    fetchOrders()
    const poll = setInterval(() => fetchOrders(true), 6000)
    return () => clearInterval(poll)
  }, [fetchOrders])

  // Clock ticker
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 10000)
    return () => clearInterval(t)
  }, [])

  // ── Status update ──
  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId)
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      })
      // Optimistic update + re-fetch
      setOrders(prev =>
        nextStatus === "COMPLETED"
          ? prev.filter(o => o.id !== orderId)
          : prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o)
      )
    } catch {
      // Swallow – polling will correct
    } finally {
      setUpdatingId(null)
    }
  }

  const getElapsedMins = (createdAt: string) =>
    Math.floor((time.getTime() - new Date(createdAt).getTime()) / 60000)

  const getTimerStyle = (mins: number) => {
    if (mins >= 15) return "text-red-500 font-black"
    if (mins >= 10) return "text-yellow-500 font-bold"
    return "text-[var(--muted)]"
  }

  const pendingOrders = orders.filter(o => o.status === "PENDING")
  const preparingOrders = orders.filter(o => o.status === "PREPARING")
  const readyOrders = orders.filter(o => ["READY", "CONFIRMED"].includes(o.status))

  // ── Order Card ──
  const OrderCard = ({ order, action }: { order: KitchenOrder; action: React.ReactNode }) => {
    const elapsed = getElapsedMins(order.created_at)
    const isLate = elapsed >= 15
    const tableLabel = getOrderTypeLabel(order)
    const orderNum = order.id.slice(-6).toUpperCase()
    const isUpdating = updatingId === order.id

    return (
      <Card className={`overflow-hidden transition-all border ${isLate
        ? "border-red-500/30 bg-red-500/5"
        : "border-[var(--surface-border)] glass hover:border-[var(--color-primary-500)]/30"
        }`}>
        <CardContent className="p-0 flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-start px-4 py-3 border-b border-[var(--surface-border)]">
            <div>
              <h3 className="font-black text-sm tracking-tight text-white">#{orderNum}</h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">{tableLabel}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`flex items-center gap-1 text-xs ${getTimerStyle(elapsed)}`}>
                <Clock className="w-3.5 h-3.5" />
                {elapsed}m ago
              </span>
              {isLate && (
                <span className="text-[9px] text-red-500 font-black uppercase tracking-wider flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" /> LATE
                </span>
              )}
              <button
                onClick={() => printOrderTicket(order)}
                className="text-[10px] text-[var(--muted)] hover:text-white flex items-center gap-0.5 mt-0.5 transition-colors"
                title="Print ticket"
              >
                <Printer className="w-3 h-3" /> Print
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 px-4 py-3 space-y-2">
            {order.items.map((it) => (
              <div key={it.id} className="text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 font-black shrink-0">{it.quantity}×</span>
                  <span className="text-white font-semibold leading-snug">{it.menu_item.display_name}</span>
                </div>
                {it.customizations && Object.entries(it.customizations).map(([k, v]) => {
                  const display = Array.isArray(v) ? v.join(", ") : v
                  return display ? (
                    <p key={k} className="text-[10px] text-blue-400 italic ml-5 mt-0.5">
                      → {k}: {display}
                    </p>
                  ) : null
                })}
              </div>
            ))}
          </div>

          {/* Order notes */}
          {order.notes && (
            <div className="mx-4 mb-3 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 flex items-start gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-400/90 font-medium leading-relaxed">{order.notes}</p>
            </div>
          )}

          {/* Action */}
          <div className="px-4 pb-4 border-t border-[var(--surface-border)] pt-3">
            {isUpdating ? (
              <div className="w-full h-9 flex items-center justify-center text-xs text-[var(--muted)]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Updating…
              </div>
            ) : action}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-500">
            <Flame className="w-6 h-6" />
          </div> */}
          <div>
            <h1 className="text-xl font-black tracking-tight text-[var(--foreground)] flex items-center gap-2">
              Kitchen Display System
              <span className={`w-2 h-2 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            </h1>
            <p className="text-xs text-[var(--muted)]">Real-time order queue — auto-refreshes every 6 seconds</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live status */}
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg text-[20px] text-bold  flex items-center gap-1.5 ${online
            ? " text-emerald-400 "
            : " text-red-400 "
            }`}>
            {online ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            {online ? "LIVE" : "OFFLINE"}
          </span>

          <span className="text-xs text-[var(--foreground)] font-semibold text-[20px] border border-[var(--surface-border)] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Active: {orders.length}
          </span>
          <span className="text-xs text-[20px] text-red-400 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Late (&gt;15m): {orders.filter(o => getElapsedMins(o.created_at) >= 15).length}
          </span>
          <button
            onClick={() => fetchOrders()}
            className="p-2 rounded-lg bg-[var(--foreground)] text-[var(--background)]  hover:bg-gray-500 hover:cursor-pointer  transition-colors"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--color-primary-500)]" />
            <p className="text-sm text-[var(--muted)]">Loading kitchen orders…</p>
          </div>
        </div>
      ) : (
        /* Kanban columns */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 min-h-0">

          {/* ── Column 1: New Orders ── */}
          <div className="flex flex-col bg-[var(--surface)]/20 border border-[var(--surface-border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--surface-border)] bg-[var(--surface-hover)]/30 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <h2 className="font-bold text-sm uppercase tracking-wider text-[var(--foreground)] ">New Orders</h2>
              </div>
              <span className="text-[15px] font-bold font-black px-2 py-0.5 rounded-md  text-[var(--foreground)] ">
                {pendingOrders.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {pendingOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--muted)] py-12 text-center">
                  <ChefHat className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-xs">No pending orders</p>
                </div>
              ) : pendingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  action={
                    <Button
                      onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                      className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-2"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Preparing
                    </Button>
                  }
                />
              ))}
            </div>
          </div>

          {/* ── Column 2: Preparing ── */}
          <div className="flex flex-col bg-[var(--surface)]/20 border border-[var(--surface-border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--surface-border)] bg-[var(--surface-hover)]/30 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h2 className="font-bold text-sm uppercase tracking-wider text-[var(--foreground)]">Preparing</h2>
              </div>
              <span className="text-[15px] font-bold font-black px-2 py-0.5 rounded-md  text-[var(--foreground)] ">
                {preparingOrders.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {preparingOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--muted)] py-12 text-center">
                  <ChefHat className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-xs">No active cooking ticket</p>
                </div>
              ) : preparingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  action={
                    <Button
                      onClick={() => handleUpdateStatus(order.id, "READY")}
                      className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Ready
                    </Button>
                  }
                />
              ))}
            </div>
          </div>

          {/* ── Column 3: Ready / Pickup ── */}
          <div className="flex flex-col bg-[var(--surface)]/20 border border-[var(--surface-border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--surface-border)] bg-[var(--surface-hover)]/30 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="font-bold text-sm uppercase tracking-wider text-[var(--foreground)]">Ready / Pickup</h2>
              </div>
              <span className="text-[15px] font-bold font-black px-2 py-0.5 rounded-md  text-[var(--foreground)] ">
                {readyOrders.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {readyOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--muted)] py-12 text-center">
                  <Award className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-xs">No food waiting pickup</p>
                </div>
              ) : readyOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  action={
                    <Button
                      onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                      className="w-full h-9 bg-[var(--surface-hover)] hover:bg-emerald-600 border border-[var(--surface-border)] hover:border-emerald-500 text-[var(--muted)] hover:text-white text-xs font-bold gap-2 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                    </Button>
                  }
                />
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Hidden iframe – used to silently fire print jobs without popup dialogs */}
      <iframe
        ref={printIframeRef}
        title="print-frame"
        style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "72mm", height: "200mm", border: "none" }}
        aria-hidden="true"
      />
    </div>
  )
}
