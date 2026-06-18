"use client"
import * as React from "react"
import { ArrowLeft, CheckCircle, Smartphone, Building2, CreditCard, Loader2 } from "lucide-react"

interface PaymentScreenProps {
  total: number
  onBack: () => void
  onSuccess: (orderId: string) => void
  restaurantId: string
  tableId: string
  cartPayload: { menu_item_id: string; quantity: number; customizations: any }[]
  orderNotes: string
}

const PAYMENT_METHODS = [
  { id: "telebirr", name: "TeleBirr", logo: "📱", color: "#0066CC", description: "Pay with Ethio Telecom TeleBirr" },
  { id: "cbe", name: "CBE Birr", logo: "🏦", color: "#007A3D", description: "Commercial Bank of Ethiopia" },
  { id: "chapa", name: "Chapa", logo: "💳", color: "#F5A623", description: "Secure online payment gateway" },
  { id: "amole", name: "Amole", logo: "💰", color: "#8B2FC9", description: "Dashen Bank digital wallet" },
]

export default function PaymentScreen({ total, onBack, onSuccess, restaurantId, tableId, cartPayload, orderNotes }: PaymentScreenProps) {
  const [selectedMethod, setSelectedMethod] = React.useState<string | null>(null)
  const [phone, setPhone] = React.useState("")
  const [paying, setPaying] = React.useState(false)
  const [step, setStep] = React.useState<"select" | "confirm" | "success">("select")
  const [orderId, setOrderId] = React.useState("")
  const [transactionId] = React.useState(() => `TXN${Date.now().toString(36).toUpperCase()}`)

  const handlePay = async () => {
    if (!selectedMethod) return
    setPaying(true)
    try {
      // Place the real order first
      const res = await fetch("/api/orders/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          table_id: tableId || null,
          items: cartPayload,
          notes: orderNotes,
        }),
      })
      if (res.ok) {
        const order = await res.json()
        // Save order to local storage
        const localIds = JSON.parse(localStorage.getItem(`placed_orders_${restaurantId}`) || "[]")
        localStorage.setItem(`placed_orders_${restaurantId}`, JSON.stringify([...localIds, order.id]))
        setOrderId(order.id)
        // Simulate payment processing delay
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

  if (step === "success") {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#030712] text-white px-6 text-center">
        <div className="space-y-6 max-w-sm mx-auto">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Payment Successful!</h1>
            <p className="text-gray-400 text-sm">Your order has been placed and the kitchen has been notified.</p>
          </div>
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-4 space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Order ID</span>
              <span className="font-mono font-bold text-amber-400 text-xs">#{orderId.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Payment Method</span>
              <span className="font-semibold">{method?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Transaction ID</span>
              <span className="font-mono text-xs text-gray-300">{transactionId}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-2">
              <span className="text-gray-400 font-semibold">Amount Paid</span>
              <span className="font-extrabold text-green-400 text-base">${total.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => onSuccess(orderId)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3.5 rounded-xl transition-all text-sm"
          >
            Track My Order →
          </button>
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
