import * as React from "react"
import { Loader2 } from "lucide-react"
import { CashierClientView } from "./CashierClientView"

export default function CashierPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
      </div>
    }>
      <CashierClientView />
    </React.Suspense>
  )
}
