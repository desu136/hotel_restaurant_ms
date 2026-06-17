import * as React from "react"
import RestaurantManager from "./RestaurantManager"

export default function RestaurantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Restaurants</h1>
        <p className="text-[var(--muted)]">
          Create and manage restaurant outlets linked to your branches. Each restaurant has its own menu, categories, and tables.
        </p>
      </div>
      <RestaurantManager />
    </div>
  )
}
