import { Suspense } from "react"
import OrdersClientView from "./OrdersClientView"

export const metadata = { title: "My Orders" }

export default function MyOrdersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-sm text-gray-500">Loading Orders…</div>}>
      <OrdersClientView />
    </Suspense>
  )
}
