export const dynamic = "force-dynamic"
import * as React from "react"
import { serverFetch } from "@/lib/server-fetch"
import RolesManager from "./RolesManager"

async function getAllPermissions() {
  return [
    "tenant.create", "tenant.view", "tenant.update", "tenant.approve", "tenant.reject", "tenant.suspend", "tenant.activate",
    "subscription.view", "subscription.create", "subscription.update",
    "plan.view", "plan.create", "plan.update",
    "hotel.view", "hotel.update",
    "branch.create", "branch.view", "branch.update", "branch.delete",
    "employee.create", "employee.view", "employee.update", "employee.activate", "employee.deactivate",
    "role.create", "role.view", "role.update", "role.assign",
    "report.view", "analytics.view", "billing.view",
    "room.create", "room.view", "room.update", "room.delete", "room.assign", "room.transfer",
    "reservation.create", "reservation.view", "reservation.update", "reservation.confirm", "reservation.cancel",
    "guest.create", "guest.view", "guest.update", "guest.checkin", "guest.checkout",
    "category.create", "category.view", "category.update", "category.delete",
    "menu.create", "menu.view", "menu.update", "menu.delete",
    "table.create", "table.view", "table.update", "table.delete", "table.update_status",
    "order.create", "order.view", "order.update", "order.cancel", "order.accept", "order.prepare", "order.ready",
    "kitchen.view", "assigned.order.view",
    "service.request.view", "service.request.resolve",
    "bill.create", "bill.view", "bill.update",
    "payment.view", "payment.record",
    "transaction.view", "finance.daily.view",
    "delivery.view_assigned", "delivery.accept", "delivery.pickup", "delivery.complete", "delivery.status.update",
  ]
}

async function getRoles() {
  try {
    const res = await serverFetch("/api/roles")
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export default async function RolesPage() {
  const [roles, allPermissions] = await Promise.all([getRoles(), getAllPermissions()])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Roles & Permissions</h1>
        <p className="text-[var(--muted)]">Review and configure what each role can do in the system.</p>
      </div>
      <RolesManager initialRoles={roles} allPermissions={allPermissions} />
    </div>
  )
}
