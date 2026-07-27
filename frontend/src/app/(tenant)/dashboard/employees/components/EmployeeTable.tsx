"use client"
import * as React from "react"
import { Users2, Loader2, MoreVertical, Pencil, UserX, UserCheck, Trash2 } from "lucide-react"

export const STATUS_META: Record<string, { label: string; dot: string }> = {
  ACTIVE: { label: "Active", dot: "bg-emerald-500" },
  INACTIVE: { label: "Inactive", dot: "bg-slate-400" },
  SUSPENDED: { label: "Suspended", dot: "bg-red-500" },
}

export interface EmployeeRole { id: string; code: string; name: string }
export interface Employee {
  id: string; fullName: string; email: string; phone?: string | null
  branchId?: string | null; branchName: string; status: string; roles: EmployeeRole[]
  waiter_tables?: { id: string; table_number: string }[]
}

function ActionMenu({ emp, onEdit, onDelete, onToggleSuspend, busy }: {
  emp: Employee; onEdit: () => void; onDelete: () => void; onToggleSuspend: () => void; busy: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const isSuspended = emp.status === "SUSPENDED"

  React.useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative flex justify-center">
      <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)]" title="Actions">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 w-44 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl shadow-xl overflow-hidden py-1">
          <button onClick={() => { onEdit(); setOpen(false) }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-[var(--surface-hover)] text-left">
            <Pencil className="w-3.5 h-3.5 text-[var(--muted)]" /> Edit
          </button>
          <button onClick={() => { onToggleSuspend(); setOpen(false) }} className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-[var(--surface-hover)] text-left ${isSuspended ? "text-emerald-500" : "text-amber-500"}`}>
            {isSuspended ? <><UserCheck className="w-3.5 h-3.5" /> Activate</> : <><UserX className="w-3.5 h-3.5" /> Suspend</>}
          </button>
          <div className="border-t border-[var(--surface-border)] my-1" />
          <button onClick={() => { onDelete(); setOpen(false) }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-red-500/10 text-red-500 text-left">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

interface Props {
  filtered: Employee[]; employees: Employee[]; busyId: string | null
  search: string; filterBranch: string; filterStatus: string
  onEdit: (emp: Employee) => void
  onDelete: (id: string) => void
  onToggleSuspend: (emp: Employee) => void
}

const cols = ["#", "Employee", "Email", "Phone", "Branch", "Roles", "Status", "Actions"]

export function EmployeeTable({ filtered, employees, busyId, search, filterBranch, filterStatus, onEdit, onDelete, onToggleSuspend }: Props) {
  return (
    <div className="rounded-lg overflow-hidden border border-[var(--surface-border)] shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: "var(--surface-hover)" }}>
              {cols.map((h, i) => (
                <th key={h} className={`border border-[var(--surface-border)] px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)] whitespace-nowrap ${i === 0 ? "w-10 text-center" : ""} ${h === "Actions" ? "text-center w-20 sticky right-0 z-10" : ""} ${h === "Status" ? "text-center" : ""}`}
                  style={h === "Actions" ? { background: "var(--surface-hover)" } : {}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={cols.length} className="border border-[var(--surface-border)] px-6 py-14 text-center">
                <Users2 className="w-10 h-10 mx-auto text-[var(--muted)] mb-3 opacity-30" />
                <p className="text-sm font-medium text-[var(--muted)]">
                  {search || filterBranch || filterStatus ? "No employees match your filters." : 'Click "Add Employee" to register your first staff member.'}
                </p>
              </td></tr>
            ) : filtered.map((emp, idx) => {
              const sm = STATUS_META[emp.status] ?? STATUS_META.INACTIVE
              return (
                <tr key={emp.id} className="transition-colors"
                  style={{ background: idx % 2 === 0 ? "var(--surface)" : "color-mix(in srgb, var(--surface-hover) 40%, transparent)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "color-mix(in srgb, var(--color-primary-500) 6%, var(--surface))")}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "var(--surface)" : "color-mix(in srgb, var(--surface-hover) 40%, transparent)")}>
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-center text-xs text-[var(--muted)] font-mono w-10">{idx + 1}</td>
                  <td className="border border-[var(--surface-border)] px-3 py-2 whitespace-nowrap"><span className="font-semibold text-sm">{emp.fullName}</span></td>
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-[var(--muted)] text-xs font-mono">{emp.email}</td>
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-[var(--muted)] text-xs font-mono whitespace-nowrap">{emp.phone || <span className="opacity-40 italic">—</span>}</td>
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-[var(--muted)] text-xs whitespace-nowrap">{emp.branchName || <span className="opacity-40 italic">HQ / All</span>}</td>
                  <td className="border border-[var(--surface-border)] px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {!emp.roles?.length ? <span className="opacity-40 text-xs italic">—</span> : emp.roles.map(r => (
                        <span key={r.id} className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-semibold bg-[var(--surface-hover)]">{r.code}</span>
                      ))}
                    </div>
                  </td>
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-semibold">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sm.dot}`} />{sm.label}
                    </span>
                  </td>
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-center sticky right-0 z-10" style={{ background: "inherit" }}>
                    <ActionMenu emp={emp} onEdit={() => onEdit(emp)} onDelete={() => onDelete(emp.id)} onToggleSuspend={() => onToggleSuspend(emp)} busy={busyId === emp.id} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length > 0 && (
        <div className="px-4 py-2 border-t border-[var(--surface-border)] flex items-center justify-between text-xs text-[var(--muted)]" style={{ background: "var(--surface-hover)" }}>
          <span>Showing <strong>{filtered.length}</strong> of <strong>{employees.length}</strong> employees</span>
          <span className="font-mono opacity-60">employees table</span>
        </div>
      )}
    </div>
  )
}
