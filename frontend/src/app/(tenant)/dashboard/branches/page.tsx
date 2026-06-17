export const dynamic = "force-dynamic"
import * as React from "react"
import { serverFetch } from "@/lib/server-fetch"
import { Card, CardContent } from "@/components/ui/card"
import { GitBranch, MapPin, Phone } from "lucide-react"
import BranchManager from "./BranchManager"

async function getBranches() {
  try {
    const res = await serverFetch("/api/branches")
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export default async function BranchesPage() {
  const branches = await getBranches()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Branches</h1>
        <p className="text-[var(--muted)]">Manage your hotel and restaurant locations.</p>
      </div>
      <BranchManager initialBranches={branches} />
    </div>
  )
}
