"use client"

import * as React from "react"
import { Play, CheckCircle2, Clock, Printer, Flame, AlertTriangle, Loader2, Check } from "lucide-react"

interface KitchenOrderCardProps {
  order: any
  onUpdateStatus: (id: string, newStatus: string) => void
  onPrintTicket: (order: any) => void
  updatingId: string | null
}

export function KitchenOrderCard({ order, onUpdateStatus, onPrintTicket, updatingId }: KitchenOrderCardProps) {
  const isPending = order.status === "PENDING" || order.status === "CONFIRMED"
  const isPreparing = order.status === "PREPARING"
  const isReady = order.status === "READY"
  const isUpdating = updatingId === order.id

  const minsAgo = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
  const isUrgent = minsAgo >= 15

  const orderNum = order.order_number ? `#${order.order_number}` : `#${order.id.slice(-6).toUpperCase()}`

  return (
    <div className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
      isUrgent
        ? "border-red-500/50 bg-red-500/5 shadow-red-500/10 shadow-lg"
        : isReady
        ? "border-emerald-500/40 bg-emerald-500/5 shadow-md"
        : isPreparing
        ? "border-[var(--color-primary-500)]/40 bg-[var(--surface)] shadow-md"
        : "border-[var(--surface-border)] bg-[var(--surface)] opacity-95"
    }`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--surface-border)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg">{orderNum}</span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isReady
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : isPreparing
                  ? "bg-[var(--color-primary-600)] text-white"
                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              }`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5 font-medium">
              {order.table ? `Table ${order.table.table_number}` : order.order_type}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => onPrintTicket(order)} className="p-2 rounded-lg border border-[var(--surface-border)] hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors" title="Print Ticket">
              <Printer className="w-4 h-4" />
            </button>
            <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${isUrgent ? "bg-red-500 text-white animate-pulse" : "bg-[var(--surface-hover)] text-[var(--muted)]"}`}>
              {isUrgent ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {minsAgo}m
            </div>
          </div>
        </div>

        {/* Item list */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {order.items?.map((it: any) => (
            <div key={it.id} className="text-xs space-y-0.5 border-b border-[var(--surface-border)]/40 pb-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[var(--foreground)]">{it.quantity}x {it.menu_item?.display_name}</span>
              </div>
              {it.customizations && Object.entries(it.customizations).map(([k, v]) => (
                <p key={k} className="text-[11px] text-[var(--muted)] pl-3">↳ <span className="font-medium">{k}:</span> {Array.isArray(v) ? v.join(", ") : String(v)}</p>
              ))}
              {it.notes && <p className="text-[11px] text-amber-500 italic pl-3">📝 Note: {it.notes}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Action footer */}
      <div className="pt-4 border-t border-[var(--surface-border)]/60 mt-4">
        {isPending ? (
          <button
            onClick={() => onUpdateStatus(order.id, "PREPARING")}
            disabled={isUpdating}
            className="w-full py-2.5 bg-[var(--color-primary-600)] text-white font-extrabold text-xs rounded-xl hover:bg-[var(--color-primary-500)] disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
            {isUpdating ? "Updating..." : "Start Preparing"}
          </button>
        ) : isPreparing ? (
          <button
            onClick={() => onUpdateStatus(order.id, "READY")}
            disabled={isUpdating}
            className="w-full py-2.5 bg-emerald-600 text-white font-extrabold text-xs rounded-xl hover:bg-emerald-500 disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isUpdating ? "Updating..." : "Mark Order Ready"}
          </button>
        ) : (
          <button
            onClick={() => onUpdateStatus(order.id, "COMPLETED")}
            disabled={isUpdating}
            className="w-full py-2.5 bg-blue-600 text-white font-extrabold text-xs rounded-xl hover:bg-blue-500 disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isUpdating ? "Updating..." : "Complete & Clear Ticket"}
          </button>
        )}
      </div>
    </div>
  )
}
