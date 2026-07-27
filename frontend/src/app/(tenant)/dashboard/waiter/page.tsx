import { Suspense } from "react"
import WaiterClientView from "./WaiterClientView"

export const metadata = { title: "Waiter Station" }

export default function WaiterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-[var(--muted)]">Loading Waiter Station…</div>}>
      <WaiterClientView />
    </Suspense>
  )
}
