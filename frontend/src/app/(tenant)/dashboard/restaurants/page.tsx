import * as React from "react"
import MyRestaurant from "./MyRestaurant"

export default function RestaurantsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Restaurant</h1>
        <p className="text-[var(--muted)]">
          Your restaurant profile. Add branches to create physical outlet locations with their own menus, tables, and staff.
        </p>
      </div>
      <MyRestaurant />
    </div>
  )
}
