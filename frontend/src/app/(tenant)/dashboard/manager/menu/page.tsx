"use client"

import * as React from "react"
import { EditMenuTab } from "../EditMenuTab"

export default function ManagerMenuPage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Menu Catalog</h1>
        <p className="text-[var(--muted)]">Manage your dishes, descriptions, prices, and customizable options.</p>
      </div>

      <EditMenuTab />
    </div>
  )
}
