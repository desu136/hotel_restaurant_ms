"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import type { MiniAppUser } from "@/lib/miniapp-bridge"
import PaymentSuccessView from "./components/PaymentSuccessView"
import PaymentConfirmationView from "./components/PaymentConfirmationView"

interface PaymentScreenProps {
  theme: "light" | "dark"
  total: number
  subtotal?: number
  discountAmount?: number
  promotionTitle?: string | null
  promotionId?: string | null
  onBack: () => void
  onSuccess: (orderId: string) => void
  restaurantId: string
  branchId?: string
  tableId: string
  cartPayload: { menu_item_id: string; quantity: number; customizations: any }[]
  orderNotes: string
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  deliveryAddress: string
  miniAppUser?: MiniAppUser | null
}

const PAYMENT_METHODS = [
  { id: "telebirr", name: "TeleBirr", logo: "📱", color: "#0066CC", description: "Pay with Ethio Telecom TeleBirr" },
  // { id: "cbe", name: "CBE Birr", logo: "🏦", color: "#007A3D", description: "Commercial Bank of Ethiopia" },
  // { id: "chapa", name: "Chapa", logo: "💳", color: "#F5A623", description: "Secure online payment gateway" },
  // { id: "amole", name: "Amole", logo: "💰", color: "#8B2FC9", description: "Dashen Bank digital wallet" },
]

export default function PaymentScreen({
  theme, total, subtotal = total, discountAmount = 0, promotionTitle = null, promotionId = null,
  onBack, onSuccess, restaurantId, branchId, tableId, cartPayload, orderNotes, orderType, deliveryAddress, miniAppUser
}: PaymentScreenProps) {
  const themeBg = theme === "dark" ? "bg-[#030712] text-white" : "bg-gray-50 text-gray-900"
  const themeCard = theme === "dark" ? "bg-[#0b0f19] border-white/10" : "bg-white border-gray-200 shadow-sm"
  const themeTextMuted = theme === "dark" ? "text-gray-400" : "text-gray-500"
  const themeBorder = theme === "dark" ? "border-white/5" : "border-gray-200"

  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = React.useState<string | null>(null)
  const [phone, setPhone] = React.useState("")
  const [paying, setPaying] = React.useState(false)
  const [step, setStep] = React.useState<"select" | "confirm" | "success">("select")
  const [orderId, setOrderId] = React.useState("")
  const [orderStatus, setOrderStatus] = React.useState("PENDING")
  const [estimatedReadyAt, setEstimatedReadyAt] = React.useState<string | null>(null)
  const [estimatedPrepTime, setEstimatedPrepTime] = React.useState<number>(0)
  const [transactionId] = React.useState(() => `TXN${Date.now().toString(36).toUpperCase()}`)

  React.useEffect(() => {
    if (step !== "success" || !orderId) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/public/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          setOrderStatus(data.status || "PENDING")
        }
      } catch (_) { }
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
        restaurant_id: restaurantId, branch_id: branchId || null, table_id: tableId || null,
        items: cartPayload, notes: orderNotes, order_type: orderType, delivery_address: deliveryAddress,
      }
      if (miniAppUser?.id) {
        orderBody.userId = miniAppUser.id; orderBody.userName = miniAppUser.name; orderBody.userEmail = miniAppUser.email
      }
      const res = await fetch("/api/orders/public", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orderBody),
      })
      if (res.ok) {
        const order = await res.json()
        const localIds = JSON.parse(localStorage.getItem(`placed_orders_${restaurantId}`) || "[]")
        localStorage.setItem(`placed_orders_${restaurantId}`, JSON.stringify([...localIds, order.id]))
        setOrderId(order.id)
        if (order.estimated_ready_at) setEstimatedReadyAt(order.estimated_ready_at)
        if (order.estimated_prep_time) setEstimatedPrepTime(order.estimated_prep_time)
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
      <PaymentSuccessView
        onBack={onBack} onSuccess={onSuccess} router={router} orderId={orderId}
        estimatedPrepTime={estimatedPrepTime} estimatedReadyAt={estimatedReadyAt} orderStatus={orderStatus}
        methodName={method?.name} transactionId={transactionId} discountAmount={discountAmount} subtotal={subtotal}
        promotionTitle={promotionTitle} total={total} themeBg={themeBg} themeCard={themeCard} themeBorder={themeBorder}
        themeTextMuted={themeTextMuted} themeTextTitle={theme === "dark" ? "text-white" : "text-gray-900"} theme={theme}
      />
    )
  }

  if (step === "confirm" && method) {
    return (
      <PaymentConfirmationView
        method={method} onBack={() => setStep("select")} phone={phone} setPhone={setPhone} handlePay={handlePay}
        paying={paying} discountAmount={discountAmount} subtotal={subtotal} promotionTitle={promotionTitle} total={total}
        themeBg={themeBg} themeCard={themeCard} themeBorder={themeBorder} themeTextMuted={themeTextMuted}
        themeTextTitle={theme === "dark" ? "text-white" : "text-gray-900"} theme={theme}
      />
    )
  }

  return (
    <div className={`fixed inset-0 z-[60] flex flex-col ${themeBg} overflow-y-auto`}>
      <div className={`flex items-center gap-3 p-4 border-b ${themeBorder} shrink-0`}>
        <button onClick={onBack} className={`p-2 ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"} rounded-lg`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-black text-base">Choose Payment Method</h2>
      </div>

      <div className="flex-1 flex flex-col p-5 gap-4 max-w-sm mx-auto w-full">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center space-y-1">
          {discountAmount > 0 ? (
            <>
              <p className={`text-xs ${themeTextMuted}`}>Subtotal: <span className="line-through">${subtotal.toFixed(2)}</span></p>
              <p className="text-green-400 text-xs font-bold">Saved ${discountAmount.toFixed(2)} with {promotionTitle}</p>
              <p className="text-amber-400 font-black text-2xl">${total.toFixed(2)}</p>
            </>
          ) : (
            <p className="text-amber-400 font-black text-2xl">${total.toFixed(2)}</p>
          )}
          <p className={`text-[11px] ${themeTextMuted} mt-0.5`}>Total amount to pay</p>
        </div>

        <p className={`text-xs font-bold ${themeTextMuted} uppercase tracking-wider`}>Select Payment Method</p>

        <div className="space-y-3">
          {PAYMENT_METHODS.map(pm => (
            <button
              key={pm.id} onClick={() => setSelectedMethod(pm.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${selectedMethod === pm.id
                  ? "border-amber-500/60 bg-amber-500/5"
                  : `${themeBorder} ${themeCard} ${theme === "dark" ? "hover:border-white/20" : "hover:border-gray-300"}`
                }`}
            >
              <span className={`text-2xl w-10 h-10 flex items-center justify-center ${theme === "dark" ? "bg-white/5" : "bg-gray-100"} rounded-xl`}>{pm.logo}</span>
              <div className="flex-1">
                <p className="font-bold text-sm">{pm.name}</p>
                <p className={`text-[10px] ${themeTextMuted} mt-0.5`}>{pm.description}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 transition-all ${selectedMethod === pm.id ? "border-amber-500 bg-amber-500" : "border-gray-600"}`} />
            </button>
          ))}
        </div>

        <button
          onClick={() => selectedMethod && setStep("confirm")} disabled={!selectedMethod}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3.5 rounded-xl transition-all disabled:opacity-40 text-sm mt-auto"
        >
          Continue to Pay
        </button>
      </div>
    </div>
  )
}
