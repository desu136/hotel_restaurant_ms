"use client"

import * as React from "react"
import { CategoryTab } from "../CategoryTab"

export default function ManagerStaffPage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Branch Staff 👥</h1>
        <p className="text-[var(--muted)]">Manage waiters, chefs, cashiers, and active staff accounts for your branch.</p>
      </div>

      <CategoryTab mode="staff" />
    </div>
  )
}
