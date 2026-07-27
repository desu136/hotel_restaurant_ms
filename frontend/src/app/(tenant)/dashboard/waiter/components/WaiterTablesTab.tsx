"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import type { Table, Order } from "./types"

interface Props {
  myTables: Table[]
  otherTables: Table[]
  orders: Order[]
  getTableStatus: (id: string) => string
  onSelectTable: (id: string) => void
  onMarkDelivered: (id: string) => void
  onClearTable: (id: string) => void
}

export function WaiterTablesTab({ myTables, otherTables, orders, getTableStatus, onSelectTable, onMarkDelivered, onClearTable }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" /> My Assigned Tables ({myTables.length})
        </h3>
        {myTables.length === 0 ? (
          <div className="p-8 border border-dashed border-[var(--surface-border)] rounded-2xl text-center text-xs">No tables assigned to you by manager.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {myTables.map(table => {
              const tableStatus = getTableStatus(table.id)
              const tableReadyOrder = orders.find(o => o.table_id === table.id && o.status === "READY")
              return (
                <Card key={table.id} onClick={() => onSelectTable(table.id)}
                  className={`group relative overflow-hidden transition-all border-[var(--surface-border)] hover:border-blue-500/40 cursor-pointer active:scale-[0.98] ${tableReadyOrder ? "ring-1 ring-emerald-500/25 border-emerald-500/40" : tableStatus === "OCCUPIED" ? "bg-blue-500/5" : "bg-emerald-500/5"}`}>
                  <CardContent className="p-3 sm:p-5 flex flex-col items-center justify-center text-center space-y-2 sm:space-y-3">
                    <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Table {table.table_number}</span>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border shadow-inner"><Users className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[10px] sm:text-xs">{table.capacity} seats</p>
                      {tableReadyOrder ? <p className="text-[10px] sm:text-xs font-black animate-pulse uppercase">READY TO SERVE</p> : <p className="text-[10px] sm:text-xs font-bold">{tableStatus}</p>}
                    </div>
                    <div className="flex flex-col gap-1 w-full mt-1.5 sm:mt-2">
                      {tableStatus === "OCCUPIED" && (
                        <>
                          {tableReadyOrder && <Button onClick={e => { e.stopPropagation(); onMarkDelivered(tableReadyOrder.id) }} size="sm" className="w-full text-[9px] sm:text-[10px] h-6 sm:h-7 bg-emerald-600 hover:bg-emerald-500 font-bold animate-pulse">Serve Order</Button>}
                          <Button onClick={e => { e.stopPropagation(); onClearTable(table.id) }} size="sm" className="w-full text-[9px] sm:text-[10px] h-6 sm:h-7 hover:bg-zinc-600 font-bold">Clear Table</Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t border-[var(--surface-border)]">
        <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" /> Other Tables ({otherTables.length})
        </h3>
        {otherTables.length === 0 ? (
          <div className="p-8 border border-dashed border-[var(--surface-border)] rounded-2xl text-center text-xs">No other tables registered.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 opacity-75">
            {otherTables.map(table => (
              <Card key={table.id} className={`border-[var(--surface-border)] ${getTableStatus(table.id) === "OCCUPIED" ? "bg-blue-500/5" : "bg-zinc-800/10"}`}>
                <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center space-y-1.5 sm:space-y-2.5">
                  <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Table {table.table_number}</span>
                  <p className="text-[13px] sm:text-[15px]">{table.capacity} seats</p>
                  <p className="text-[13px] sm:text-[15px] font-semibold truncate max-w-full">{table.waiter?.full_name || "No waiter"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
