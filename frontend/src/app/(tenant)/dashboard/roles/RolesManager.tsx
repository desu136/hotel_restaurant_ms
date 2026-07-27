"use client"
import * as React from "react"
import { ShieldCheck } from "lucide-react"
import { RolePermissionsPanel, PERMISSION_GROUPS } from "./components/RolePermissionsPanel"

interface Role { id: string; code: string; name: string; permissions: string[] }
interface Props { initialRoles: Role[]; allPermissions: string[] }

export default function RolesManager({ initialRoles, allPermissions }: Props) {
  const [roles, setRoles] = React.useState<Role[]>(initialRoles)
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(roles[0] ?? null)
  const [draft, setDraft] = React.useState<string[]>(roles[0]?.permissions ?? [])
  const [saving, setSaving] = React.useState(false)
  const [savedMsg, setSavedMsg] = React.useState(false)
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>(
    Object.fromEntries(Object.keys(PERMISSION_GROUPS).map(g => [g, true]))
  )
  const [currentUser, setCurrentUser] = React.useState<any>(null)

  React.useEffect(() => {
    fetch("/api/auth/me").then(res => res.json()).then(data => { if (data.success && data.user) setCurrentUser(data.user) }).catch(console.error)
  }, [])

  const filteredRoles = React.useMemo(() => {
    return roles.filter(role => {
      if (currentUser?.tenant?.business_type === "RESTAURANT" && role.code === "RECEPTIONIST") return false
      return true
    })
  }, [roles, currentUser])

  React.useEffect(() => {
    if (filteredRoles.length > 0 && (!selectedRole || !filteredRoles.some(r => r.id === selectedRole.id))) {
      setSelectedRole(filteredRoles[0]); setDraft(filteredRoles[0].permissions)
    }
  }, [filteredRoles, selectedRole])

  const isDirty = selectedRole
    ? JSON.stringify([...draft].sort()) !== JSON.stringify([...selectedRole.permissions].sort())
    : false

  const selectRole = (role: Role) => { setSelectedRole(role); setDraft([...role.permissions]); setSavedMsg(false) }
  const togglePerm = (perm: string) => setDraft(d => d.includes(perm) ? d.filter(p => p !== perm) : [...d, perm])
  const toggleGroup = (group: string) => {
    const perms = PERMISSION_GROUPS[group]; const allOn = perms.every(p => draft.includes(p))
    setDraft(d => allOn ? d.filter(p => !perms.includes(p)) : [...new Set([...d, ...perms])])
  }
  const reset = () => { if (selectedRole) setDraft([...selectedRole.permissions]) }
  const toggleGroupExpand = (g: string) => setExpandedGroups(ex => ({ ...ex, [g]: !ex[g] }))

  const save = async () => {
    if (!selectedRole) return
    setSaving(true)
    try {
      const res = await fetch(`/api/roles/${selectedRole.id}/permissions`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissions: draft }) })
      if (res.ok) {
        const updated = await res.json()
        setRoles(prev => prev.map(r => r.id === updated.id ? updated : r))
        setSelectedRole(updated); setDraft([...updated.permissions])
        setSavedMsg(true); setTimeout(() => setSavedMsg(false), 3000)
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Role list sidebar */}
      <div className="lg:w-64 shrink-0 space-y-2">
        {filteredRoles.map(role => {
          const active = selectedRole?.id === role.id
          return (
            <button key={role.id} onClick={() => selectRole(role)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all ${active ? "bg-[var(--color-primary-600)] text-white shadow-sm" : "hover:bg-[var(--surface-hover)] text-[var(--foreground)] bg-[var(--surface)] border border-[var(--surface-border)]"}`}>
              <ShieldCheck className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-[var(--muted)]"}`} />
              <div className="min-w-0">
                <p className="font-semibold text-xs truncate">{role.code.replace(/_/g, " ")}</p>
                <p className={`text-xs truncate ${active ? "text-white/70" : "text-[var(--muted)]"}`}>{role.permissions.length} permissions</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Permissions panel */}
      {selectedRole ? (
        <RolePermissionsPanel selectedRole={selectedRole} allPermissions={allPermissions} draft={draft} saving={saving} savedMsg={savedMsg}
          isDirty={isDirty} expandedGroups={expandedGroups} onReset={reset} onSave={save} onTogglePerm={togglePerm} onToggleGroup={toggleGroup} onToggleGroupExpand={toggleGroupExpand} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--muted)]">
          <ShieldCheck className="w-8 h-8 opacity-30" />
        </div>
      )}
    </div>
  )
}
