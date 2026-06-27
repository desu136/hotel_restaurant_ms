"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, Loader2, Clock, ChefHat, Bell, Home } from "lucide-react"
import type { MiniAppUser } from "@/lib/miniapp-bridge"

interface PaymentScreenProps {
  total: number
  onBack: () => void
  onSuccess: (orderId: string) => void
  restaurantId: string
  tableId: string
  cartPayload: { menu_item_id: string; quantity: number; customizations: any }[]
  orderNotes: string
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  deliveryAddress: string
  miniAppUser?: MiniAppUser | null
}

const PAYMENT_METHODS = [
  { id: "telebirr", name: "TeleBirr", logo: "📱", color: "#0066CC", description: "Pay with Ethio Telecom TeleBirr" },
  { id: "cbe", name: "CBE Birr", logo: "🏦", color: "#007A3D", description: "Commercial Bank of Ethiopia" },
  { id: "chapa", name: "Chapa", logo: "💳", color: "#F5A623", description: "Secure online payment gateway" },
  { id: "amole", name: "Amole", logo: "💰", color: "#8B2FC9", description: "Dashen Bank digital wallet" },
]

const STATUS_STEPS = [
  { key: "PENDING",   label: "Order Received",  icon: <Clock className="w-5 h-5" />,    desc: "Your order is confirmed and waiting for the kitchen." },
  { key: "PREPARING", label: "Being Prepared",  icon: <ChefHat className="w-5 h-5" />,  desc: "The kitchen is working on your food right now." },
  { key: "READY",     label: "Ready to Serve",  icon: <Bell className="w-5 h-5" />,     desc: "Your order is ready! A staff member is on the way." },
  { key: "COMPLETED", label: "Delivered",        icon: <CheckCircle className="w-5 h-5" />, desc: "Enjoy your meal! Thank you for dining with us." },
]

export default function PaymentScreen({ total, onBack, onSuccess, restaurantId, tableId, cartPayload, orderNotes, orderType, deliveryAddress, miniAppUser }: PaymentScreenProps) {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = React.useState<string | null>(null)
  const [phone, setPhone] = React.useState("")
  const [paying, setPaying] = React.useState(false)
  const [step, setStep] = React.useState<"select" | "confirm" | "success">("select")
  const [orderId, setOrderId] = React.useState("")
  const [orderStatus, setOrderStatus] = React.useState("PENDING")
  const [transactionId] = React.useState(() => `TXN${Date.now().toString(36).toUpperCase()}`)

  // Poll order status every 8s after success
  React.useEffect(() => {
    if (step !== "success" || !orderId) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/public/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          setOrderStatus(data.status || "PENDING")
        }
      } catch (_) {}
    }
    poll()
    const interval = setInterval(poll, 8000)
    return () => clearInterval(interval)
  }, [step, orderId])

  const handlePay = async () => {
    if (!selectedMethod) return
    setPaying(true)
    try {
      const orderBody: Record<string, any> = {
        restaurant_id: restaurantId,
        table_id: tableId || null,
        items: cartPayload,
        notes: orderNotes,
        order_type: orderType,
        delivery_address: deliveryAddress,
      }
      if (miniAppUser?.id) {
        orderBody.userId = miniAppUser.id
        orderBody.userName = miniAppUser.name
        orderBody.userEmail = miniAppUser.email
      }
      const res = await fetch("/api/orders/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderBody),
      })
      if (res.ok) {
        const order = await res.json()
        const localIds = JSON.parse(localStorage.getItem(`placed_orders_${restaurantId}`) || "[]")
        localStorage.setItem(`placed_orders_${restaurantId}`, JSON.stringify([...localIds, order.id]))
        setOrderId(order.id)
        await new Promise(r => setTimeout(r, 1800))
        setStep("success")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPaying(false)
    }
  }

  const method = PAYMENT_METHODS.find(m => m.id === selectedMethod)
  const currentStatusIdx = STATUS_STEPS.findIndex(s => s.key === orderStatus)
  const currentStep = STATUS_STEPS[currentStatusIdx] || STATUS_STEPS[0]

  if (step === "success") {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-[#030712] text-white overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </button>
          <button
            onClick={() => {
              onSuccess(orderId)
              router.push("/home")
            }}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors text-xs font-semibold"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>

        <div className="flex-1 flex flex-col p-5 gap-5 max-w-sm mx-auto w-full pb-10">
          {/* Success Banner */}
          <div className="flex flex-col items-center text-center pt-4 pb-2">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-xl font-black text-white">Order Placed!</h1>
            <p className="text-gray-400 text-xs mt-1">The kitchen has been notified.</p>
            <p className="text-[10px] text-amber-400 font-mono font-bold mt-1.5 bg-amber-500/10 px-3 py-1 rounded-full">
              #{orderId.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* Live Status Tracker */}
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Order Status</p>
            <div className="flex flex-col gap-0">
              {STATUS_STEPS.map((s, idx) => {
                const isDone = idx < currentStatusIdx
                const isCurrent = idx === currentStatusIdx
                const isLast = idx === STATUS_STEPS.length - 1
                return (
                  <div key={s.key} className="flex gap-3">
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isDone ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                        isCurrent ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse" :
                        "bg-white/5 text-gray-600 border border-white/10"
                      }`}>
                        {s.icon}
                      </div>
                      {!isLast && (
                        <div className={`w-px flex-1 my-1 ${isDone ? "bg-green-500/30" : "bg-white/10"}`} style={{ minHeight: 20 }} />
                      )}
                    </div>
                    {/* Label */}
                    <div className={`pb-4 flex-1 ${isLast ? "" : ""}`}>
                      <p className={`text-xs font-bold leading-snug ${
                        isCurrent ? "text-amber-400" : isDone ? "text-green-400" : "text-gray-600"
                      }`}>
                        {s.label}
                        {isCurrent && <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded-full">Now</span>}
                      </p>
                      {isCurrent && (
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-4 space-y-2.5 text-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Details</p>
            <div className="flex justify-between">
              <span className="text-gray-400">Method</span>
              <span className="font-semibold">{method?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Transaction</span>
              <span className="font-mono text-xs text-gray-300">{transactionId}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 mt-1">
              <span className="text-gray-400 font-semibold">Amount Paid</span>
              <span className="font-extrabold text-green-400 text-base">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 mt-auto">
            <button
              onClick={() => {
                onSuccess(orderId)
                router.push("/home?tab=account")
              }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3.5 rounded-xl transition-all text-sm"
            >
              View in Account →
            </button>
            <button
              onClick={onBack}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-all text-sm"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    )
  }


  if (step === "confirm" && method) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-[#030712] text-white overflow-y-auto">
        <div className="flex items-center gap-3 p-4 border-b border-white/5 shrink-0">
          <button onClick={() => setStep("select")} className="p-2 hover:bg-white/5 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-black text-base">Confirm Payment</h2>
        </div>
        <div className="flex-1 flex flex-col p-5 gap-5 max-w-sm mx-auto w-full">
          <div className="flex items-center gap-3 bg-[#0b0f19] border border-white/10 rounded-2xl p-4">
            <span className="text-3xl">{method.logo}</span>
            <div>
              <p className="font-bold">{method.name}</p>
              <p className="text-xs text-gray-400">{method.description}</p>
            </div>
          </div>

          {(selectedMethod === "telebirr" || selectedMethod === "cbe" || selectedMethod === "amole") && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Mobile Phone Number</label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 bg-[#0b0f19] border border-white/10 rounded-xl text-sm text-gray-300 font-semibold">+251</span>
                <input
                  type="tel"
                  placeholder="9XXXXXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/, ""))}
                  maxLength={9}
                  className="flex-1 bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5">You will receive a push notification to approve the payment.</p>
            </div>
          )}

          {selectedMethod === "chapa" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Card Number</label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Expiry</label>
                  <input type="text" placeholder="MM/YY" className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-400 mb-2">CVV</label>
                  <input type="text" placeholder="123" maxLength={3} className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Total</p>
            <p className="text-3xl font-black text-amber-400">${total.toFixed(2)}</p>
            <p className="text-[10px] text-gray-500">Taxes and service charges included</p>
          </div>

          <button
            onClick={handlePay}
            disabled={paying || ((selectedMethod === "telebirr" || selectedMethod === "cbe" || selectedMethod === "amole") && phone.length !== 9)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-auto"
            style={{ backgroundColor: method?.color, color: "white" }}
          >
            {paying ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing Payment…</>
            ) : (
              `Pay ${method?.name} · $${total.toFixed(2)}`
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#030712] text-white overflow-y-auto">
      <div className="flex items-center gap-3 p-4 border-b border-white/5 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-black text-base">Choose Payment Method</h2>
      </div>

      <div className="flex-1 flex flex-col p-5 gap-4 max-w-sm mx-auto w-full">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
          <p className="text-amber-400 font-black text-2xl">${total.toFixed(2)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Total amount to pay</p>
        </div>

        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Payment Method</p>

        <div className="space-y-3">
          {PAYMENT_METHODS.map(pm => (
            <button
              key={pm.id}
              onClick={() => setSelectedMethod(pm.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                selectedMethod === pm.id
                  ? "border-amber-500/60 bg-amber-500/5"
                  : "border-white/10 bg-[#0b0f19] hover:border-white/20"
              }`}
            >
              <span className="text-2xl w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl">{pm.logo}</span>
              <div className="flex-1">
                <p className="font-bold text-sm">{pm.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{pm.description}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 transition-all ${selectedMethod === pm.id ? "border-amber-500 bg-amber-500" : "border-gray-600"}`} />
            </button>
          ))}
        </div>

        <button
          onClick={() => selectedMethod && setStep("confirm")}
          disabled={!selectedMethod}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3.5 rounded-xl transition-all disabled:opacity-40 text-sm mt-auto"
        >
          Continue to Pay
        </button>
      </div>
    </div>
  )
}
