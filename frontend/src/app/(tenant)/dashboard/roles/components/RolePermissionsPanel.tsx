"use client"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert, ChevronDown, ChevronUp, Loader2, Check, RotateCcw } from "lucide-react"

const PERMISSION_GROUPS: Record<string, string[]> = {
  "Tenant & Subscription": [
    "tenant.create", "tenant.view", "tenant.update", "tenant.approve", "tenant.reject", "tenant.suspend", "tenant.activate",
    "subscription.view", "subscription.create", "subscription.update", "plan.view", "plan.create", "plan.update",
  ],
  "Organization": [
    "hotel.view", "hotel.update", "branch.create", "branch.view", "branch.update", "branch.delete",
    "employee.create", "employee.view", "employee.update", "employee.activate", "employee.deactivate",
    "role.create", "role.view", "role.update", "role.assign", "report.view", "analytics.view", "billing.view",
  ],
  "Hotel Operations": [
    "room.create", "room.view", "room.update", "room.delete", "room.assign", "room.transfer",
    "reservation.create", "reservation.view", "reservation.update", "reservation.confirm", "reservation.cancel",
    "guest.create", "guest.view", "guest.update", "guest.checkin", "guest.checkout",
  ],
  "Restaurant Operations": [
    "category.create", "category.view", "category.update", "category.delete",
    "menu.create", "menu.view", "menu.update", "menu.delete",
    "table.create", "table.view", "table.update", "table.delete", "table.update_status",
    "order.create", "order.view", "order.update", "order.cancel", "order.accept", "order.prepare", "order.ready",
    "kitchen.view", "assigned.order.view", "service.request.view", "service.request.resolve",
  ],
  "Billing & Finance": [
    "bill.create", "bill.view", "bill.update", "payment.view", "payment.record", "transaction.view", "finance.daily.view",
  ],
  "Delivery": [
    "delivery.view_assigned", "delivery.accept", "delivery.pickup", "delivery.complete", "delivery.status.update",
  ],
}

export { PERMISSION_GROUPS }

interface Props {
  selectedRole: { id: string; name: string; permissions: string[] }
  allPermissions: string[]
  draft: string[]
  saving: boolean
  savedMsg: boolean
  isDirty: boolean
  expandedGroups: Record<string, boolean>
  onReset: () => void
  onSave: () => void
  onTogglePerm: (perm: string) => void
  onToggleGroup: (group: string) => void
  onToggleGroupExpand: (group: string) => void
}

export function RolePermissionsPanel({ selectedRole, allPermissions, draft, saving, savedMsg, isDirty, expandedGroups, onReset, onSave, onTogglePerm, onToggleGroup, onToggleGroupExpand }: Props) {
  return (
    <div className="flex-1 min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{selectedRole.name}</h2>
          <p className="text-sm text-[var(--muted)]">{draft.length} of {allPermissions.length} permissions enabled</p>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium"><Check className="w-3.5 h-3.5" /> Saved!</span>}
          <button onClick={onReset} disabled={!isDirty} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[var(--surface-border)] rounded-lg hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button onClick={onSave} disabled={!isDirty || saving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[var(--color-primary-600)] text-white rounded-lg hover:bg-[var(--color-primary-500)] disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save Changes
          </button>
        </div>
      </div>

      {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
        const enabledCount = perms.filter(p => draft.includes(p)).length
        const allOn = enabledCount === perms.length
        const expanded = expandedGroups[group] ?? true
        return (
          <Card key={group} className="overflow-hidden">
            <button onClick={() => onToggleGroupExpand(group)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-[var(--muted)]" />
                <span className="font-semibold text-sm">{group}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${allOn ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : enabledCount > 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-[var(--surface-hover)] text-[var(--muted)]"}`}>
                  {enabledCount}/{perms.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={e => { e.stopPropagation(); onToggleGroup(group) }} className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${allOn ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" : "text-[var(--color-primary-600)] hover:bg-[var(--color-primary-600)]/10"}`}>
                  {allOn ? "Disable all" : "Enable all"}
                </button>
                {expanded ? <ChevronUp className="w-4 h-4 text-[var(--muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted)]" />}
              </div>
            </button>
            {expanded && (
              <CardContent className="px-5 pb-5 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {perms.map(perm => {
                    const on = draft.includes(perm)
                    return (
                      <button key={perm} onClick={() => onTogglePerm(perm)} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-all border ${on ? "bg-[var(--color-primary-600)]/8 border-[var(--color-primary-500)]/30 text-[var(--foreground)]" : "border-transparent hover:bg-[var(--surface-hover)] text-[var(--muted)]"}`}>
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${on ? "bg-[var(--color-primary-600)] border-[var(--color-primary-600)]" : "border-[var(--surface-border)]"}`}>
                          {on && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="font-mono">{perm}</span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
