"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Order } from "./types"

interface Props {
  readyOrders: Order[]
  onMarkDelivered: (id: string) => void
  onOpenQr: (o: Order) => void
}

export function WaiterAlertsPanel({ readyOrders, onMarkDelivered, onOpenQr }: Props) {
  return (
    <Card className="glass h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div><CardTitle className="text-lg font-bold">Ready to Serve Alerts</CardTitle><CardDescription>Real-time notifications for your tables.</CardDescription></div>
        {readyOrders.length > 0 && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />}
      </CardHeader>
      <CardContent className="space-y-4">
        {readyOrders.map(o => (
          <div key={o.id} className="p-4 rounded-xl border border-emerald-500/20 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">{o.table ? `Table ${o.table.table_number}` : o.order_type === "DINE_IN" ? "Pre-order Dine-In" : "Delivery"}</span>
                <p className="text-sm font-semibold font-bold">Items Ready!</p>
              </div>
              <p className="text-[10px]">{o.items.length} items • click Serve to deliver.</p>
            </div>
            <Button onClick={() => o.placed_by_staff ? onMarkDelivered(o.id) : onOpenQr(o)} size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 font-semibold">Serve</Button>
          </div>
        ))}
        {readyOrders.length === 0 && <div className="py-12 text-center text-sm">No active serve alerts. Nice job!</div>}
      </CardContent>
    </Card>
  )
}
