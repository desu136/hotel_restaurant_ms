"use client"

import * as React from "react"
import { Search, Receipt, CheckCircle2 } from "lucide-react"

interface CashierOrder {
  id: string
  orderNumber: string
  tableNumber: string
  waiter: string
  items: { name: string; quantity: number; price: number }[]
  total: number
}

interface CashierOrderListProps {
  unpaidOrders: CashierOrder[]
  paidHistory: any[]
  selectedOrderId: string
  onSelectOrder: (id: string) => void
  searchQuery: string
  setSearchQuery: (v: string) => void
}

export function CashierOrderList({
  unpaidOrders, paidHistory, selectedOrderId, onSelectOrder, searchQuery, setSearchQuery
}: CashierOrderListProps) {
  const filteredUnpaid = unpaidOrders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.tableNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search order # or table..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl text-xs font-semibold focus:outline-none"
        />
      </div>

      {/* Unpaid Bills List */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Unpaid Orders ({filteredUnpaid.length})</p>
        {filteredUnpaid.length === 0 ? (
          <div className="p-4 text-center border border-dashed rounded-xl text-xs text-[var(--muted)]">No unpaid orders found.</div>
        ) : (
          filteredUnpaid.map(order => {
            const isSelected = order.id === selectedOrderId
            return (
              <button
                key={order.id}
                onClick={() => onSelectOrder(order.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)]/10 shadow-sm"
                    : "border-[var(--surface-border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <div>
                  <p className="font-bold text-sm flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[var(--color-primary-600)]" />
                    {order.orderNumber}
                  </p>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">Table {order.tableNumber} · {order.items.length} items</p>
                </div>
                <p className="font-black text-sm text-[var(--color-primary-600)]">${order.total.toFixed(2)}</p>
              </button>
            )
          })
        )}
      </div>

      {/* Paid History */}
      {paidHistory.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-[var(--surface-border)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Settled Bills ({paidHistory.length})
          </p>
          <div className="space-y-1.5">
            {paidHistory.slice(0, 4).map(bill => (
              <div key={bill.id} className="p-2.5 rounded-lg border border-[var(--surface-border)]/60 bg-[var(--surface)] flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold">{bill.orderNumber}</p>
                  <p className="text-[10px] text-[var(--muted)]">Table {bill.tableNumber} · {bill.time}</p>
                </div>
                <p className="font-bold text-emerald-500">${bill.total?.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
