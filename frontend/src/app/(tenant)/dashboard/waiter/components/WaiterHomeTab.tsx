"use client"
import { Card } from "@/components/ui/card"
import { Bell, Plus, QrCode } from "lucide-react"

interface Props {
  activityLogs: Array<{ id: string; type: "serve_order" | "create_order" | "clear_table"; message: string; timestamp: string }>
  onOpenScanner: () => void
  onGoToTables: () => void
}

export function WaiterHomeTab({ activityLogs, onOpenScanner, onGoToTables }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={onOpenScanner} className="flex items-center gap-4 hover:bg-[var(--surface-hover)] p-5 rounded-2xl shadow-lg transition-all group font-black text-left cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center group-hover:scale-110 transition-transform"><QrCode className="w-6 h-6 animate-pulse" /></div>
            <div><h4 className="text-sm font-black">Scan Table QR</h4><p className="text-[10px] font-normal mt-0.5">Scan a table QR to order immediately.</p></div>
          </button>
          <button onClick={onGoToTables} className="flex items-center gap-4 bg-[var(--foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] text-[var(--background)] p-5 rounded-2xl transition-all group text-left cursor-pointer shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[var(--background)] text-[var(--foreground)] border border-[var(--surface-border)] flex items-center justify-center group-hover:scale-110 transition-transform"><Plus className="w-5 h-5" /></div>
            <div><h4 className="text-sm font-black">New Order</h4><p className="text-[10px] mt-0.5">Select an assigned table to start order.</p></div>
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider">Shift Activity Log</h3>
        <Card className="border-[var(--surface-border)] p-4 shadow-sm">
          {activityLogs.length === 0 ? <p className="text-xs text-center py-6">No shift activities recorded yet.</p> : (
            <ul className="space-y-4">
              {activityLogs.map(log => (
                <li key={log.id} className="flex items-center justify-between py-1 border-b border-[var(--surface-border)] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center">
                      {log.type === "serve_order" ? <Bell className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </span>
                    <span className="text-xs font-semibold">{log.message}</span>
                  </div>
                  <span className="text-[10px]">{log.timestamp}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
