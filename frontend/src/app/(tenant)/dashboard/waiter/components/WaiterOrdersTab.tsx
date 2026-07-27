"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import type { Table, Order } from "./types"

interface Props {
  orders: Order[]
  tables: Table[]
  isManager: boolean
  branchWaiters: { id: string; full_name: string }[]
  selectedWaiterId: string
  filterMyOrUnassigned: (o: Order) => boolean
  getStatusBadge: (status: string) => string
  setSelectedWaiterId: (id: string) => void
  onMarkDelivered: (id: string) => void
  onOpenQr: (o: Order) => void
  onAssignTable: (orderId: string, tableId: string) => void
}

export function WaiterOrdersTab({ orders, tables, isManager, branchWaiters, selectedWaiterId, filterMyOrUnassigned, getStatusBadge, setSelectedWaiterId, onMarkDelivered, onOpenQr, onAssignTable }: Props) {
  const filtered = orders.filter(filterMyOrUnassigned)

  return (
    <div className="space-y-3">
      {isManager && (
        <div className="flex items-center justify-between gap-4 p-3 bg-[var(--surface-hover)]/30 border border-[var(--surface-border)] rounded-xl">
          <span className="text-xs font-bold text-[var(--muted)]">Filter by Waiter:</span>
          <select value={selectedWaiterId} onChange={e => setSelectedWaiterId(e.target.value)} className="border border-[var(--surface-border)] text-xs bg-[var(--surface)] rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer">
            <option value="">All Waiters</option>
            {branchWaiters.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
          </select>
        </div>
      )}

      {filtered.map(order => (
        <Card key={order.id} className="border-[var(--surface-border)] overflow-hidden hover:border-blue-500/20 transition-all p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs uppercase tracking-wider">#{order.order_number || order.id.slice(-6).toUpperCase()}</span>
                {order.table ? <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded">T{order.table.table_number}</span> : <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded capitalize">{order.order_type === "DINE_IN" ? "Pre-order" : order.order_type === "DELIVERY" ? "Delivery" : "Takeaway"}</span>}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${getStatusBadge(order.status)}`}>{order.status}</span>
                <span className="text-[10px]">{new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                {(order.waiter?.full_name || order.table?.waiter?.full_name) && <span className="text-[10px] font-medium bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">Waiter: {order.waiter?.full_name || order.table?.waiter?.full_name}</span>}
              </div>
              <p className="text-[11px] leading-relaxed font-semibold">{order.items.map(it => `${it.quantity}x ${it.menu_item.display_name}`).join(" • ")}</p>
              {order.order_type === "DINE_IN" && !order.table_id && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-semibold">Assign:</span>
                  <select onChange={e => { if (e.target.value) onAssignTable(order.id, e.target.value) }} className="border border-[var(--surface-border)] text-[10px] rounded px-1.5 py-0.5 focus:outline-none" defaultValue="">
                    <option value="" disabled>Select Table...</option>
                    {tables.map(t => <option key={t.id} value={t.id}>Table {t.table_number} (Cap: {t.capacity})</option>)}
                  </select>
                </div>
              )}
              {order.notes && <p className="text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/10 w-fit mt-1"><MessageSquare className="w-3 h-3" /> {order.notes}</p>}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="font-extrabold text-xs">${parseFloat(order.total_amount.toString()).toFixed(2)}</span>
              {order.status === "READY" && (
                <Button onClick={() => (order.table_id || order.placed_by_staff) ? onMarkDelivered(order.id) : onOpenQr(order)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 font-bold text-[10px] px-2.5 py-1 h-7 rounded-lg">
                  Serve
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}

      {filtered.length === 0 && <div className="py-12 text-center text-xs">No active orders found.</div>}
    </div>
  )
}
