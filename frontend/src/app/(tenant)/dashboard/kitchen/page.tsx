"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChefHat, Play, CheckCircle2, Clock, 
  MessageSquare, Flame, Award, AlertTriangle
} from "lucide-react"

// Mock Initial Data for Kitchen KDS
const INITIAL_ORDERS = [
  {
    id: "o1",
    orderNumber: "ORD-9481",
    tableNumber: "102",
    status: "PREPARING",
    items: [
      { name: "Grand Horizon Burger", quantity: 2, note: "Medium rare" },
      { name: "Truffle Fries", quantity: 1, note: "Extra crispy" },
      { name: "Craft IPA Beer", quantity: 2, note: "" }
    ],
    notes: "No onions on one burger",
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString() // 8 mins ago
  },
  {
    id: "o3",
    orderNumber: "ORD-9483",
    tableNumber: "104",
    status: "PENDING",
    items: [
      { name: "Wild Mushroom Risotto", quantity: 1, note: "Gluten free request" },
      { name: "Crispy Calamari", quantity: 1, note: "" }
    ],
    notes: "Customer has nut allergy",
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString() // 3 mins ago
  },
  {
    id: "o4",
    orderNumber: "ORD-9484",
    tableNumber: "201",
    status: "PENDING",
    items: [
      { name: "Pan-Seared Salmon", quantity: 2, note: "Sauce on the side" },
      { name: "Lava Chocolate Cake", quantity: 1, note: "Serve with dessert" }
    ],
    notes: "",
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString() // 18 mins ago (Late!)
  },
  {
    id: "o2",
    orderNumber: "ORD-9482",
    tableNumber: "105",
    status: "READY",
    items: [
      { name: "Pan-Seared Salmon", quantity: 1, note: "" },
      { name: "Chardonnay White Wine", quantity: 1, note: "" }
    ],
    notes: "",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() // 25 mins ago
  }
]

export default function KitchenDashboard() {
  const [orders, setOrders] = React.useState(INITIAL_ORDERS)
  const [time, setTime] = React.useState(new Date())

  // Keep timers fresh
  React.useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 10000)
    return () => clearInterval(interval)
  }, [])

  const handleUpdateStatus = (orderId: string, nextStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o))
  }

  const getElapsedTime = (createdAtStr: string) => {
    const created = new Date(createdAtStr)
    const diffMs = time.getTime() - created.getTime()
    return Math.floor(diffMs / 60000)
  }

  const getTimerColor = (minutes: number) => {
    if (minutes >= 15) return "text-red-500 font-black"
    if (minutes >= 10) return "text-yellow-500 font-bold"
    return "text-[var(--muted)]"
  }

  const pendingOrders = orders.filter(o => o.status === "PENDING")
  const preparingOrders = orders.filter(o => o.status === "PREPARING")
  const readyOrders = orders.filter(o => o.status === "READY")

  const OrderCard = ({ order, action }: { order: typeof INITIAL_ORDERS[0]; action: React.ReactNode }) => {
    const elapsed = getElapsedTime(order.createdAt)
    const isLate = elapsed >= 15

    return (
      <Card className={`glass overflow-hidden border-[var(--surface-border)] hover:border-[var(--color-primary-500)]/30 transition-all ${
        isLate ? "border-red-500/20 bg-red-500/5" : ""
      }`}>
        <CardContent className="p-4 flex flex-col h-full space-y-3">
          {/* Card Header */}
          <div className="flex justify-between items-start border-b border-[var(--surface-border)] pb-2">
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">{order.orderNumber}</h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">Table {order.tableNumber}</p>
            </div>
            <div className="flex flex-col items-end">
              <span className={`flex items-center gap-1 text-xs ${getTimerColor(elapsed)}`}>
                <Clock className="w-3.5 h-3.5" />
                {elapsed}m
              </span>
              {isLate && (
                <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" /> Late Ticket
                </span>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 space-y-2 py-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-start">
                  <span className="text-white font-medium">
                    <span className="text-[var(--color-primary-500)] font-bold mr-2">{item.quantity}x</span>
                    {item.name}
                  </span>
                </div>
                {item.note && (
                  <p className="text-[10px] text-red-400 italic font-medium ml-6 mt-0.5">
                    → Note: {item.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Ticket Notes */}
          {order.notes && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 flex items-start gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-400/90 font-medium leading-relaxed">
                {order.notes}
              </p>
            </div>
          )}

          {/* Actions Footer */}
          <div className="pt-2 border-t border-[var(--surface-border)]">
            {action}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-500">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Kitchen Display System (KDS)
            </h1>
            <p className="text-xs text-[var(--muted)]">Real-time order ticket queue for kitchen preparation.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs font-semibold">
          <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Active Tickets: {orders.length}
          </span>
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Critical (&gt;15m): {orders.filter(o => getElapsedTime(o.createdAt) >= 15).length}
          </span>
        </div>
      </div>

      {/* Kanban Board columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 min-h-0">
        {/* Column 1: New Tickets */}
        <div className="flex flex-col bg-[var(--surface)]/20 border border-[var(--surface-border)] rounded-2xl overflow-hidden h-full">
          <div className="px-5 py-4 border-b border-[var(--surface-border)] bg-[var(--surface-hover)]/30 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <h2 className="font-bold text-sm tracking-tight text-white uppercase">New Orders</h2>
            </div>
            <span className="bg-[var(--surface-hover)] text-[10px] font-extrabold px-2 py-0.5 rounded-md border text-[var(--muted)]">
              {pendingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {pendingOrders.map(order => (
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
            {pendingOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-[var(--muted)] py-12">
                <ChefHat className="w-8 h-8 opacity-25 mb-2" />
                <p className="text-xs">No pending orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Preparing */}
        <div className="flex flex-col bg-[var(--surface)]/20 border border-[var(--surface-border)] rounded-2xl overflow-hidden h-full">
          <div className="px-5 py-4 border-b border-[var(--surface-border)] bg-[var(--surface-hover)]/30 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="font-bold text-sm tracking-tight text-white uppercase">Preparing</h2>
            </div>
            <span className="bg-blue-500/10 text-blue-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-blue-500/20">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {preparingOrders.map(order => (
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
            {preparingOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-[var(--muted)] py-12">
                <ChefHat className="w-8 h-8 opacity-25 mb-2" />
                <p className="text-xs">No active cooking ticket</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Ready for Pickup */}
        <div className="flex flex-col bg-[var(--surface)]/20 border border-[var(--surface-border)] rounded-2xl overflow-hidden h-full">
          <div className="px-5 py-4 border-b border-[var(--surface-border)] bg-[var(--surface-hover)]/30 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="font-bold text-sm tracking-tight text-white uppercase">Ready / Pickup</h2>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-500/20">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {readyOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                action={
                  <div className="w-full py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-center text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
                    Waiting for Waiter
                  </div>
                } 
              />
            ))}
            {readyOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-[var(--muted)] py-12">
                <Award className="w-8 h-8 opacity-25 mb-2" />
                <p className="text-xs">No food waiting pickup</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
