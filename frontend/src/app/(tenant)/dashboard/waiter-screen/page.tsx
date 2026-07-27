import * as React from "react"
import { Loader2 } from "lucide-react"
import { WaiterScreenClientView } from "./WaiterScreenClientView"

export default function WaiterScreenPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
      </div>
    }>
      <WaiterScreenClientView />
    </React.Suspense>
  )
}
