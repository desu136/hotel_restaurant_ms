"use client"

import * as React from "react"
import { CategoryTab } from "../CategoryTab"

export default function ManagerCategoryPage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Menu Categories 🏷️</h1>
        <p className="text-[var(--muted)]">Create and organize category tabs for your restaurant dishes.</p>
      </div>

      <CategoryTab mode="category" />
    </div>
  )
}
