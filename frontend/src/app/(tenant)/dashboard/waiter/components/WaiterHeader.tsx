"use client"
import type { Table, Order } from "./types"

interface Me { id: string; name: string; email: string; branchId?: string | null; roles?: string[] }

interface Props {
  me: Me | null
  restaurants: { id: string; name: string }[]
  selectedRestId: string
  branches: { id: string; name: string; restaurant_id: string }[]
  selectedBranchId: string
  myTables: Table[]
  orders: Order[]
  readyOrdersCount: number
  filterMyOrUnassigned: (o: Order) => boolean
  getTableStatus: (id: string) => string
  onRestChange: (id: string) => void
  onBranchChange: (id: string) => void
}

export function WaiterHeader({ me, restaurants, selectedRestId, branches, selectedBranchId, myTables, orders, readyOrdersCount, filterMyOrUnassigned, getTableStatus, onRestChange, onBranchChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Waiter Station</h1>
          <p>Active User: <strong>{me?.name || "Loading..."}</strong> • Manage your assigned tables and ready orders.</p>
        </div>
        <div className="flex items-center gap-3">
          {!me?.branchId ? (
            <>
              {restaurants.length > 1 && (
                <select value={selectedRestId} onChange={e => onRestChange(e.target.value)} className="border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none">
                  {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              )}
              <select value={selectedBranchId} onChange={e => onBranchChange(e.target.value)} className="border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none">
                <option value="">— Select Branch —</option>
                {branches.filter(b => b.restaurant_id === selectedRestId).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </>
          ) : (
            <span className="text-xs font-bold border border-[var(--surface-border)] px-3 py-1.5 rounded-lg">
              {branches.find(b => b.id === me.branchId)?.name || "Assigned Branch"}
            </span>
          )}
        </div>
      </div>

      <div className="border border-[var(--surface-border)] backdrop-blur-md rounded-2xl p-4 flex items-center justify-between gap-4 text-xs font-semibold shadow-sm">
        <div className="flex items-center flex-wrap gap-x-1 gap-y-2">
          <div className="flex items-center gap-2"><span>Tables:</span><span className="font-bold">{myTables.filter(t => getTableStatus(t.id) === "OCCUPIED").length}/{myTables.length}</span></div>
          <span className="hidden sm:inline">|</span>
          <div className="flex items-center gap-2"><span>Orders:</span><span className="font-bold">{orders.filter(filterMyOrUnassigned).length}</span></div>
          <span className="hidden sm:inline">|</span>
          <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span>Ready:</span><span className="font-bold">{readyOrdersCount}</span></div>
        </div>
        <div className="text-[10px] uppercase tracking-wider font-bold border border-[var(--surface-border)] px-2.5 py-1 rounded-full">Live Station</div>
      </div>
    </div>
  )
}
