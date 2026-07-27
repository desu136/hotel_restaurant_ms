import * as React from "react"
import { Loader2 } from "lucide-react"
import { KitchenClientView } from "./KitchenClientView"

export default function KitchenPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
      </div>
    }>
      <KitchenClientView />
    </React.Suspense>
  )
}
