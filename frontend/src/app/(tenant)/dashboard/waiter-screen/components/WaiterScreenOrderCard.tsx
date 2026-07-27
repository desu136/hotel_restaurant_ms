"use client"

import * as React from "react"
import { Clock, AlertTriangle, User } from "lucide-react"

interface WaiterScreenOrderCardProps {
  order: any
  elapsed: number
}

export function WaiterScreenOrderCard({ order, elapsed }: WaiterScreenOrderCardProps) {
  const isLate = elapsed >= 10
  const orderNum = order.order_number ? `#${order.order_number}` : `#${order.id.slice(-6).toUpperCase()}`
  const tableLabel = order.table ? `Table ${order.table.table_number}` : order.order_type

  return (
    <div className={`flex flex-col shadow-lg rounded-2xl overflow-hidden transition-all bg-[var(--surface)] border ${
      isLate ? "border-red-500/30 ring-1 ring-red-500/10" : "border-[var(--surface-border)]"
    }`}>
      <div className="px-4 py-3 border-b border-[var(--surface-border)] flex justify-between items-start gap-2">
        <div>
          <span className="text-[10px] bg-[var(--foreground)] text-[var(--background)] px-2 py-0.5 rounded font-bold">
            {orderNum}
          </span>
          <h2 className="text-base font-black mt-1">{tableLabel}</h2>
        </div>
        <div className="flex flex-col items-end">
          <span className={`flex items-center gap-1 text-xs font-semibold ${isLate ? "text-red-500 font-bold" : "text-amber-500"}`}>
            <Clock className="w-3.5 h-3.5" /> {elapsed}m ago
          </span>
          {isLate && <span className="text-[9px] text-red-600 font-black tracking-wider uppercase">LATE</span>}
        </div>
      </div>

      <div className="px-4 py-2 flex items-center gap-2 text-xs border-b border-[var(--surface-border)]/50 text-[var(--muted)]">
        <User className="w-3.5 h-3.5" />
        <span className="font-bold text-[var(--foreground)]">
          Waiter: {order.table?.waiter?.full_name || "Unassigned"}
        </span>
      </div>

      <div className="flex-1 p-3 space-y-1.5 max-h-36 overflow-y-auto">
        {order.items?.map((it: any, idx: number) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <span className="font-black shrink-0">{it.quantity}×</span>
            <span className="font-medium truncate">{it.menu_item?.display_name}</span>
          </div>
        ))}
      </div>

      <div className="px-4 py-2.5 bg-[var(--foreground)] text-[var(--background)] flex justify-between items-center text-xs">
        <span className="font-bold uppercase text-[10px]">{order.order_type}</span>
        <span className="px-2 py-0.5 text-emerald-400 font-extrabold uppercase text-[10px]">
          READY TO SERVE
        </span>
      </div>
    </div>
  )
}
