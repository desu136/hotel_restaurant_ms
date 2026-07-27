"use client"

import * as React from "react"
import { Loader2, DollarSign, CreditCard, Wallet, Percent, Printer, ShieldCheck } from "lucide-react"
import { CashierOrderList } from "./components/CashierOrderList"
import { CashierBillModal } from "./components/CashierBillModal"

export function CashierClientView() {
  const [unpaidOrders, setUnpaidOrders] = React.useState<any[]>([])
  const [paidHistory, setPaidHistory] = React.useState<any[]>([])
  const [totalCollected, setTotalCollected] = React.useState<number>(0)
  const [selectedOrderId, setSelectedOrderId] = React.useState<string>("")
  const [paymentMethod, setPaymentMethod] = React.useState<"cash" | "card" | "dexel">("card")
  const [discountPercent, setDiscountPercent] = React.useState<number>(0)
  const [receivedCash, setReceivedCash] = React.useState<string>("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showReceiptModal, setShowReceiptModal] = React.useState(false)
  const [lastPaidBill, setLastPaidBill] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  const loadBillingData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [unpaidRes, historyRes] = await Promise.all([fetch("/api/billing/unpaid"), fetch("/api/billing/history")])
      const unpaidData = unpaidRes.ok ? await unpaidRes.json() : []
      const historyData = historyRes.ok ? await historyRes.json() : { bills: [], total_collected: 0 }

      const mappedUnpaid = unpaidData.map((o: any) => {
        const items = (o.items || []).map((it: any) => ({ name: it.menu_item?.display_name || "Item", quantity: it.quantity, price: parseFloat(it.unit_price || "0") }))
        const sub = items.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0)
        return { id: o.id, orderNumber: o.order_number || o.id.slice(-6).toUpperCase(), tableNumber: o.table?.table_number || "Takeaway", waiter: o.waiter_id ? "Staff" : "Customer", items, subtotal: sub, tax: sub * 0.08, serviceCharge: sub * 0.10, total: sub * 1.18 }
      })

      const mappedHistory = (historyData.bills || []).map((b: any) => ({
        id: b.id, orderNumber: b.order?.order_number || b.id.slice(-6).toUpperCase(), tableNumber: b.order?.table?.table_number || "Takeaway", total: parseFloat(b.amount || "0"), method: "Paid", time: new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }))

      setUnpaidOrders(mappedUnpaid); setPaidHistory(mappedHistory); setTotalCollected(historyData.total_collected || 0)
      if (mappedUnpaid.length > 0 && !selectedOrderId) setSelectedOrderId(mappedUnpaid[0].id)
    } finally { setLoading(false) }
  }, [selectedOrderId])

  React.useEffect(() => { loadBillingData() }, [loadBillingData])

  const selectedOrder = unpaidOrders.find(o => o.id === selectedOrderId)
  const subtotal = selectedOrder ? selectedOrder.subtotal : 0
  const discountAmount = subtotal * (discountPercent / 100)
  const taxableAmount = Math.max(0, subtotal - discountAmount)
  const tax = taxableAmount * 0.08; const serviceCharge = taxableAmount * 0.10
  const finalTotal = taxableAmount + tax + serviceCharge

  const changeDue = React.useMemo(() => {
    const cashVal = parseFloat(receivedCash)
    return isNaN(cashVal) ? 0 : Math.max(0, cashVal - finalTotal)
  }, [receivedCash, finalTotal])

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return
    try {
      const res = await fetch("/api/billing/bill", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: selectedOrder.id, payment_method: paymentMethod.toUpperCase(), discount_percent: discountPercent })
      })
      if (res.ok) {
        setLastPaidBill({ ...selectedOrder, total: finalTotal, method: paymentMethod })
        setShowReceiptModal(true); setDiscountPercent(0); setReceivedCash(""); await loadBillingData()
      }
    } catch { alert("Checkout failed") }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" /></div>

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Cashier Counter</h1>
          <p className="text-[var(--muted)]">Settle customer table bills, apply discounts, and generate official receipts.</p>
        </div>
        <div className="px-4 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Total Collected</p>
          <p className="text-lg font-black text-emerald-500">${totalCollected.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CashierOrderList unpaidOrders={unpaidOrders} paidHistory={paidHistory} selectedOrderId={selectedOrderId} onSelectOrder={setSelectedOrderId} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <div className="lg:col-span-2 border border-[var(--surface-border)] rounded-2xl bg-[var(--surface)] p-6 space-y-6">
          {!selectedOrder ? (
            <div className="py-20 text-center text-[var(--muted)]"><p className="text-sm font-medium">Select an order to view checkout bill.</p></div>
          ) : (
            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--surface-border)]">
                <div>
                  <h2 className="text-xl font-bold">Order #{selectedOrder.orderNumber}</h2>
                  <p className="text-xs text-[var(--muted)]">Table {selectedOrder.tableNumber}</p>
                </div>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 font-bold text-xs rounded-full uppercase">Unpaid</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[var(--surface-border)]/40">
                    <span>{it.quantity}x {it.name}</span>
                    <span className="font-bold">${(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[var(--muted)]">Discount (%)</label>
                  <div className="flex items-center gap-2 border border-[var(--surface-border)] rounded-xl px-3 py-2">
                    <Percent className="w-4 h-4 text-[var(--muted)]" />
                    <input type="number" min="0" max="100" value={discountPercent || ""} onChange={e => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} placeholder="0" className="w-full text-xs font-bold bg-transparent outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[var(--muted)]">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["card", "cash", "dexel"] as const).map(m => (
                      <button key={m} type="button" onClick={() => setPaymentMethod(m)} className={`py-2 rounded-xl text-xs font-bold border capitalize ${paymentMethod === m ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)]/10 text-[var(--color-primary-600)]" : "border-[var(--surface-border)]"}`}>{m}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--surface-border)] pt-4 space-y-1.5 text-xs">
                <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-emerald-500"><span>Discount ({discountPercent}%):</span><span>-${discountAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-[var(--muted)]"><span>Tax (8%) + Service (10%):</span><span>${(tax + serviceCharge).toFixed(2)}</span></div>
                <div className="flex justify-between font-black text-base pt-2 border-t text-[var(--color-primary-600)]"><span>Total Amount:</span><span>${finalTotal.toFixed(2)}</span></div>
              </div>

              <button type="submit" className="w-full py-3 bg-[var(--color-primary-600)] text-white font-extrabold text-sm rounded-xl hover:bg-[var(--color-primary-500)] shadow-lg transition-colors">
                Complete Checkout &amp; Settle Bill (${finalTotal.toFixed(2)})
              </button>
            </form>
          )}
        </div>
      </div>

      <CashierBillModal show={showReceiptModal} lastPaidBill={lastPaidBill} onClose={() => setShowReceiptModal(false)} onPrint={() => window.print()} />
    </div>
  )
}
