"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Receipt, CreditCard, DollarSign, Wallet, CheckCircle2,
  ArrowRight, Search, ClipboardList, ShieldCheck, Printer, Percent
} from "lucide-react"

// Mock Unpaid and Paid Bills
const INITIAL_UNPAID_ORDERS = [
  {
    id: "o1",
    orderNumber: "ORD-9481",
    tableNumber: "102",
    waiter: "Bob Waiter",
    items: [
      { name: "Grand Horizon Burger", quantity: 2, price: 19.99 },
      { name: "Truffle Fries", quantity: 1, price: 12.99 },
      { name: "Craft IPA Beer", quantity: 2, price: 7.99 }
    ],
    subtotal: 68.95,
    tax: 5.52,
    serviceCharge: 6.90,
    total: 81.37
  },
  {
    id: "o2",
    orderNumber: "ORD-9482",
    tableNumber: "105",
    waiter: "Bob Waiter",
    items: [
      { name: "Pan-Seared Salmon", quantity: 1, price: 28.99 },
      { name: "Chardonnay White Wine", quantity: 1, price: 11.99 }
    ],
    subtotal: 40.98,
    tax: 3.28,
    serviceCharge: 4.10,
    total: 48.36
  },
  {
    id: "o5",
    orderNumber: "ORD-9485",
    tableNumber: "203",
    waiter: "Alice Manager",
    items: [
      { name: "Wild Mushroom Risotto", quantity: 2, price: 24.99 },
      { name: "Lava Chocolate Cake", quantity: 2, price: 9.99 }
    ],
    subtotal: 69.96,
    tax: 5.60,
    serviceCharge: 7.00,
    total: 82.56
  }
]

const INITIAL_PAID_HISTORY = [
  {
    id: "h1",
    orderNumber: "ORD-9479",
    tableNumber: "101",
    total: 34.50,
    method: "Card",
    time: "25 mins ago"
  },
  {
    id: "h2",
    orderNumber: "ORD-9480",
    tableNumber: "103",
    total: 112.40,
    method: "Cash",
    time: "48 mins ago"
  }
]

interface CashierOrder {
  id: string
  orderNumber: string
  tableNumber: string
  waiter: string
  items: { name: string; quantity: number; price: number }[]
  subtotal: number
  tax: number
  serviceCharge: number
  total: number
}

export default function CashierDashboard() {
  const [unpaidOrders, setUnpaidOrders] = React.useState<CashierOrder[]>([])
  const [paidHistory, setPaidHistory] = React.useState<any[]>([])
  const [totalCollected, setTotalCollected] = React.useState<number>(0)
  const [selectedOrderId, setSelectedOrderId] = React.useState<string>("")
  const [paymentMethod, setPaymentMethod] = React.useState<"cash" | "card" | "dexel">("card")

  // Checkout details state
  const [discountPercent, setDiscountPercent] = React.useState<number>(0)
  const [receivedCash, setReceivedCash] = React.useState<string>("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showReceiptModal, setShowReceiptModal] = React.useState(false)
  const [lastPaidBill, setLastPaidBill] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  const loadBillingData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [unpaidRes, historyRes] = await Promise.all([
        fetch("/api/billing/unpaid"),
        fetch("/api/billing/history")
      ])

      const unpaidData = unpaidRes.ok ? await unpaidRes.json() : []
      const historyData = historyRes.ok ? await historyRes.json() : { bills: [], total_collected: 0 }

      const mappedUnpaid = unpaidData.map((o: any) => {
        const items = (o.items || []).map((it: any) => ({
          name: it.menu_item?.display_name || "Unknown Item",
          quantity: it.quantity,
          price: parseFloat(it.unit_price || "0")
        }))
        const sub = items.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0)
        const t = sub * 0.08
        const s = sub * 0.10
        return {
          id: o.id,
          orderNumber: o.order_number || o.id.slice(-6).toUpperCase(),
          tableNumber: o.table?.table_number || "Takeaway",
          waiter: o.waiter_id ? "Staff" : "Customer",
          items,
          subtotal: sub,
          tax: t,
          serviceCharge: s,
          total: sub + t + s
        }
      })

      const mappedHistory = (historyData.bills || []).map((b: any) => {
        const order = b.order || {}
        const items = (order.items || []).map((it: any) => ({
          name: it.menu_item?.display_name || "Unknown Item",
          quantity: it.quantity,
          price: parseFloat(it.unit_price || "0")
        }))
        return {
          id: b.id,
          orderNumber: order.order_number || order.id?.slice(-6).toUpperCase() || b.id.slice(-6).toUpperCase(),
          tableNumber: order.table?.table_number || "Takeaway",
          total: parseFloat(b.amount || "0"),
          method: "Paid",
          time: new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          items,
          subtotal: parseFloat(b.amount || "0") / 1.18
        }
      })

      setUnpaidOrders(mappedUnpaid)
      setPaidHistory(mappedHistory)
      setTotalCollected(historyData.total_collected || 0)

      if (mappedUnpaid.length > 0 && !selectedOrderId) {
        setSelectedOrderId(mappedUnpaid[0].id)
      } else if (mappedUnpaid.length === 0) {
        setSelectedOrderId("")
      }
    } catch (err) {
      console.error("Failed to load billing data", err)
    } finally {
      setLoading(false)
    }
  }, [selectedOrderId])

  React.useEffect(() => {
    loadBillingData()
  }, [])

  const selectedOrder = unpaidOrders.find(o => o.id === selectedOrderId)

  // Calculations
  const subtotal = selectedOrder ? selectedOrder.subtotal : 0
  const discountAmount = subtotal * (discountPercent / 100)
  const taxableAmount = Math.max(0, subtotal - discountAmount)
  const tax = taxableAmount * 0.08
  const serviceCharge = taxableAmount * 0.10
  const finalTotal = taxableAmount + tax + serviceCharge

  const changeDue = React.useMemo(() => {
    if (!receivedCash) return 0
    const cashVal = parseFloat(receivedCash)
    if (isNaN(cashVal)) return 0
    return Math.max(0, cashVal - finalTotal)
  }, [receivedCash, finalTotal])

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    try {
      // 1. Create a bill
      const billRes = await fetch("/api/billing/bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          amount: parseFloat(finalTotal.toFixed(2)),
          discount_percent: discountPercent
        })
      })
      if (!billRes.ok) throw new Error("Failed to create bill")
      const bill = await billRes.json()

      // 2. Pay the bill
      const payRes = await fetch(`/api/billing/bill/${bill.id}/pay`, {
        method: "POST"
      })
      if (!payRes.ok) throw new Error("Failed to record payment")

      const newPayment = {
        orderNumber: selectedOrder.orderNumber,
        tableNumber: selectedOrder.tableNumber,
        total: parseFloat(finalTotal.toFixed(2)),
        method: paymentMethod === "cash" ? "Cash" : paymentMethod === "card" ? "Card" : "Dexel Pay",
        items: selectedOrder.items,
        subtotal: subtotal,
        discount: discountAmount,
        tax: tax,
        serviceCharge: serviceCharge
      }
      setLastPaidBill(newPayment)

      // Reset values
      setDiscountPercent(0)
      setReceivedCash("")
      setShowReceiptModal(true)

      // Auto-select next unpaid order
      const remaining = unpaidOrders.filter(o => o.id !== selectedOrderId)
      if (remaining.length > 0) {
        setSelectedOrderId(remaining[0].id)
      } else {
        setSelectedOrderId("")
      }

      await loadBillingData()
    } catch (err: any) {
      alert(err.message || "Failed to process checkout")
    }
  }

  const filteredUnpaid = unpaidOrders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.tableNumber.includes(searchQuery)
  )


  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Cashier Station</h1>
        <p className="text-[var(--muted)]">Manage tickets checkout, register payments, and track sales metrics.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs  font-medium">Total Collected</p>
              <p className="text-2xl font-extrabold mt-1 ">${totalCollected.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs  font-medium">Unpaid Tickets</p>
              <p className="text-2xl font-extrabold mt-1">{unpaidOrders.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 " />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Processed Today</p>
              <p className="text-2xl font-extrabold mt-1 ">{paidHistory.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 " />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs  font-medium">Dexel Sync status</p>
              <p className="text-2xl font-extrabold mt-1 text-purple-500">Connected</p>
            </div>
            <div className="w-10 h-10 rounded-lg  flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 " />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Billing Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass overflow-hidden h-full">
            <CardHeader className="pb-3 border-b border-[var(--surface-border)] bg-[var(--surface-hover)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
              <div>
                <CardTitle className="text-base font-bold">Unpaid Billing Queue</CardTitle>
                <CardDescription className="text-xs">Select a ticket to complete checkout.</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted)]" />
                <Input
                  placeholder="Search table or ticket..."
                  className="pl-9 h-9 text-xs bg-[var(--surface)] border-[var(--surface-border)]"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {filteredUnpaid.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${selectedOrderId === order.id
                    ? "border-[var(--color-primary-600)] "
                    : "border-[var(--surface-border)] hover:bg-[var(--surface-hover)]/40"
                    }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm ">{order.orderNumber}</span>
                      <span className="font-bold text-xs text-[var(--muted)] px-2.5 py-0.5 rounded-full border">
                        T-{order.tableNumber}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)]">Waiter: {order.waiter} • {order.items.length} items</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base ">${order.total.toFixed(2)}</span>
                    <ArrowRight className="w-4 h-4 text-white group-hover:text-[var(--muted)] transition-colors" />
                  </div>
                </div>
              ))}

              {filteredUnpaid.length === 0 && (
                <div className="py-12 text-center text-[var(--muted)] text-sm">No unpaid tickets found.</div>
              )}
            </CardContent>
          </Card>

          {/* Transaction History Card */}
          <Card className="glass">
            <CardHeader className="pb-3 border-b border-[var(--surface-border)] bg-[var(--surface-hover)]/30 shrink-0">
              <CardTitle className="text-base font-bold">Recent Checkout History</CardTitle>
              <CardDescription className="text-xs">Successfully processed transactions today.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[var(--surface-border)]">
                {paidHistory.map(hist => (
                  <div key={hist.id} className="p-4 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{hist.orderNumber}</span>
                        <span className="bg-[var(--foreground)] border text-[var(--background)] px-2 py-0.5 rounded-md font-bold">
                          Table {hist.tableNumber}
                        </span>
                      </div>
                      <p className="text-[var(--muted)]">Processed via {hist.method} • {hist.time}</p>
                    </div>
                    <span className="font-bold text-emerald-500 text-sm">+${hist.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Checkout Details */}
        <div className="space-y-4">
          <Card className="glass border-[var(--surface-border)]">
            <CardHeader className="pb-3 border-b border-[var(--surface-border)] bg-[var(--surface-hover)]/30 shrink-0">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Checkout details
              </CardTitle>
              {selectedOrder ? (
                <CardDescription className="text-xs">Closing ticket for Table {selectedOrder.tableNumber}</CardDescription>
              ) : (
                <CardDescription className="text-xs">No ticket selected</CardDescription>
              )}
            </CardHeader>

            {selectedOrder ? (
              <CardContent className="p-6 space-y-6">
                {/* Items Summary */}
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  <span className="text-[10px] font-bold  uppercase tracking-wider block">Ticket items</span>
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-[var(--muted)]">
                      <span>{it.quantity}x {it.name}</span>
                      <span>${(it.price * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Discounts */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider block">Apply Discount</label>
                  <div className="flex items-center gap-2 border border-[var(--surface-border)] rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-[var(--color-primary-500)]">
                    <Percent className="w-4 h-4 text-[var(--muted)]" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent || ""}
                      onChange={e => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      placeholder="0"
                      className="border-0 outline-0 p-0 text-sm w-full  font-bold focus:outline-none focus:ring-0"
                    />
                    <span className="text-sm font-semibold text-[var(--muted)]">%</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Payment Method</span>
                  <div className="grid grid-cols-3 gap-2 ">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`hover:cursor-pointer hover:bg-[var(--surface-hover)]/30 flex flex-col items-center justify-center p-3 rounded-xl border text-xs gap-1.5 transition-all ${paymentMethod === "card"
                        ? "border-[var(--color-primary-600)] "
                        : "border-[var(--surface-border)] "
                        }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`hover:cursor-pointer hover:bg-[var(--surface-hover)]/30 flex flex-col items-center justify-center p-3 rounded-xl border text-xs gap-1.5 transition-all ${paymentMethod === "cash"
                        ? "border-[var(--color-primary-600)] "
                        : "border-[var(--surface-border)] "
                        }`}
                    >
                      <Wallet className="w-4 h-4" />
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("dexel")}
                      className={`hover:cursor-pointer hover:bg-[var(--surface-hover)]/30 flex flex-col items-center justify-center p-3 rounded-xl border text-xs gap-1.5 transition-all ${paymentMethod === "dexel"
                        ? "border-[var(--color-primary-600)] "
                        : "border-[var(--surface-border)] "
                        }`}
                    >
                      <Receipt className="w-4 h-4" />
                      Dexel POS
                    </button>
                  </div>
                </div>

                {/* Cash Drawer input if cash selected */}
                {paymentMethod === "cash" && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-150">
                    <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">Received Cash Amount</label>
                    <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg px-3 py-2">
                      <DollarSign className="w-4 h-4 text-[var(--muted)]" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={receivedCash}
                        onChange={e => setReceivedCash(e.target.value)}
                        placeholder="0.00"
                        className=" border-0 outline-0 p-0 text-sm w-full  font-bold focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                )}

                {/* Financial breakdown */}
                <div className="border-t border-[var(--surface-border)] pt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount ({discountPercent}%):</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>VAT (8%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>Service (10%):</span>
                    <span>${serviceCharge.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold border-t border-[var(--surface-border)] pt-3 text-white">
                    <span>Total Amount:</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>

                  {paymentMethod === "cash" && receivedCash && (
                    <div className="flex justify-between text-sm font-semibold text-emerald-400 pt-1">
                      <span>Change Due:</span>
                      <span>${changeDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <Button
                  onClick={handleCheckout}
                  disabled={paymentMethod === "cash" && (!receivedCash || parseFloat(receivedCash) < finalTotal)}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm gap-2 mt-4"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Close Ticket & Print
                </Button>
              </CardContent>
            ) : (
              <CardContent className="py-20 text-center text-[var(--muted)]">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <p className="text-sm">Select an active ticket from the queue to process checkout.</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {showReceiptModal && lastPaidBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black p-6 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl relative border max-h-[85vh] overflow-y-auto">
            {/* Cut-off close button */}
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute right-4 top-4 w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-xs"
            >
              ✕
            </button>

            {/* Receipt Content */}
            <div className="text-center space-y-1.5 border-b border-dashed border-zinc-300 pb-4">
              <h2 className="text-lg font-black tracking-tight uppercase">Grand Horizon Hotel</h2>
              <p className="text-[10px] text-zinc-500">123 Main Avenue, Addis Ababa, ET</p>
              <p className="text-[10px] text-zinc-500">Tel: +251 11 234 5678</p>
              <div className="pt-2 text-xs font-bold uppercase tracking-wider">
                *** PAID RECEIPT ***
              </div>
            </div>

            {/* Meta details */}
            <div className="py-3 border-b border-dashed border-zinc-300 text-[10px] text-zinc-600 space-y-1">
              <div className="flex justify-between">
                <span>Ticket: {lastPaidBill.orderNumber}</span>
                <span>Table: {lastPaidBill.tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Method: {lastPaidBill.method}</span>
                <span>Status: APPROVED</span>
              </div>
            </div>

            {/* Items list */}
            <div className="py-4 border-b border-dashed border-zinc-300 text-xs space-y-2">
              {lastPaidBill.items?.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span className="font-medium">{it.quantity}x {it.name}</span>
                  <span>${(it.price * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="py-3 border-b border-dashed border-zinc-300 text-xs space-y-1.5 text-zinc-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${lastPaidBill.subtotal?.toFixed(2)}</span>
              </div>
              {lastPaidBill.discount > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Discount:</span>
                  <span>-${lastPaidBill.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>VAT (8%):</span>
                <span>${lastPaidBill.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service (10%):</span>
                <span>${lastPaidBill.serviceCharge?.toFixed(2)}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="py-4 text-center space-y-4">
              <div className="flex justify-between items-center text-sm font-black text-black uppercase">
                <span>Total Paid:</span>
                <span className="text-base">${lastPaidBill.total?.toFixed(2)}</span>
              </div>

              <div className="text-[10px] text-zinc-400 italic">
                Thank you for your visit! Please come again.
              </div>

              <Button
                onClick={() => window.print()}
                className="w-full h-9 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs gap-2"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt Copy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
