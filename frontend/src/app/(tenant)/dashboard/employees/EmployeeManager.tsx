"use client"
import * as React from "react"
import { Users2, Plus, Pencil, UserX, X, Check, Loader2, Shield } from "lucide-react"

const ALL_ROLES = [
  "HOTEL_OWNER", "HOTEL_MANAGER", "RECEPTIONIST",
  "RESTAURANT_MANAGER", "WAITER", "CHEF", "CASHIER", "DELIVERY_DRIVER",
]

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIVE: { label: "Active", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  INACTIVE: { label: "Inactive", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-400" },
  SUSPENDED: { label: "Suspended", cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
}

interface Branch { id: string; name: string }
interface EmployeeRole { id: string; code: string; name: string }
interface Employee {
  id: string; fullName: string; email: string; phone?: string | null
  branchId?: string | null; branchName: string; status: string; roles: EmployeeRole[]
}
interface Props { initialEmployees: Employee[]; branches: Branch[] }

type FormData = {
  fullName: string; email: string; phone: string; password: string
  branchId: string; roles: string[]; status: string
}
const emptyForm = (): FormData => ({
  fullName: "", email: "", phone: "", password: "", branchId: "", roles: [], status: "ACTIVE",
})

export default function EmployeeManager({ initialEmployees, branches }: Props) {
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees)
  const [showModal, setShowModal] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<Employee | null>(null)
  const [form, setForm] = React.useState<FormData>(emptyForm())
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [deactivatingId, setDeactivatingId] = React.useState<string | null>(null)
  const [filterBranch, setFilterBranch] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("")
  const [search, setSearch] = React.useState("")

  const openCreate = () => {
    setEditTarget(null); setForm(emptyForm()); setError(""); setShowModal(true)
  }
  const openEdit = (emp: Employee) => {
    setEditTarget(emp)
    setForm({
      fullName: emp.fullName, email: emp.email, phone: emp.phone ?? "",
      password: "", branchId: emp.branchId ?? "", roles: emp.roles.map(r => r.code), status: emp.status,
    })
    setError(""); setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setError("") }

  const toggleRole = (code: string) =>
    setForm(f => ({
      ...f,
      roles: f.roles.includes(code) ? f.roles.filter(r => r !== code) : [...f.roles, code],
    }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.email.trim()) { setError("Name and email are required."); return }
    if (!editTarget && !form.password) { setError("Password is required for new employees."); return }
    if (form.roles.length === 0) { setError("Select at least one role."); return }
    setLoading(true); setError("")
    try {
      const isEdit = !!editTarget
      const payload: any = { ...form }
      if (!payload.password) delete payload.password
      if (!payload.branchId) payload.branchId = null

      const res = await fetch(
        isEdit ? `/api/employees/${editTarget!.id}` : "/api/employees",
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      )
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
      if (isEdit) {
        setEmployees(prev => prev.map(e => e.id === data.id ? data : e))
      } else {
        setEmployees(prev => [...prev, data])
      }
      closeModal()
    } catch {
      setError("Network error. Please try again.")
    } finally { setLoading(false) }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this employee? They will lose system access.")) return
    setDeactivatingId(id)
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" })
      if (res.ok) setEmployees(prev => prev.filter(e => e.id !== id))
    } finally { setDeactivatingId(null) }
  }

  const filtered = employees.filter(e => {
    if (filterBranch && e.branchId !== filterBranch) return false
    if (filterStatus && e.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return e.fullName.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    }
    return true
  })

  const cols = ["#", "Employee", "Email", "Phone", "Branch", "Roles", "Status", "Actions"]

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mb-4">
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
        />
        <select
          value={filterBranch}
          onChange={e => setFilterBranch(e.target.value)}
          className="px-3 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
        >
          <option value="">All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-600)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Excel-style Table */}
      <div className="rounded-lg overflow-hidden border border-[var(--surface-border)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-hover)" }}>
                {cols.map((h, i) => (
                  <th
                    key={h}
                    className={`border border-[var(--surface-border)] px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)] whitespace-nowrap select-none
                      ${i === 0 ? "w-10 text-center" : ""}
                      ${h === "Actions" ? "text-center w-28 sticky right-0 z-10" : ""}
                      ${h === "Status" ? "text-center" : ""}
                    `}
                    style={h === "Actions" ? { background: "var(--surface-hover)" } : {}}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={cols.length} className="border border-[var(--surface-border)] px-6 py-14 text-center">
                    <Users2 className="w-10 h-10 mx-auto text-[var(--muted)] mb-3 opacity-30" />
                    <p className="text-sm font-medium text-[var(--muted)]">
                      {search || filterBranch || filterStatus
                        ? "No employees match your filters."
                        : 'Click "Add Employee" to register your first staff member.'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map((emp, idx) => {
                const sm = STATUS_META[emp.status] ?? STATUS_META.INACTIVE
                return (
                  <tr
                    key={emp.id}
                    className="transition-colors"
                    style={{
                      background: idx % 2 === 0
                        ? "var(--surface)"
                        : "color-mix(in srgb, var(--surface-hover) 40%, transparent)"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "color-mix(in srgb, var(--color-primary-500) 6%, var(--surface))")}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "var(--surface)" : "color-mix(in srgb, var(--surface-hover) 40%, transparent)")}
                  >
                    {/* # */}
                    <td className="border border-[var(--surface-border)] px-3 py-2 text-center text-xs text-[var(--muted)] font-mono select-none w-10">
                      {idx + 1}
                    </td>

                    {/* Employee name + avatar */}
                    <td className="border border-[var(--surface-border)] px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary-500)] to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {emp.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-[var(--foreground)] text-sm">{emp.fullName}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="border border-[var(--surface-border)] px-3 py-2 text-[var(--muted)] text-xs font-mono">
                      {emp.email}
                    </td>

                    {/* Phone */}
                    <td className="border border-[var(--surface-border)] px-3 py-2 text-[var(--muted)] text-xs font-mono whitespace-nowrap">
                      {emp.phone || <span className="opacity-40 italic">—</span>}
                    </td>

                    {/* Branch */}
                    <td className="border border-[var(--surface-border)] px-3 py-2 text-[var(--muted)] text-xs whitespace-nowrap">
                      {emp.branchName || <span className="opacity-40 italic">HQ / All</span>}
                    </td>

                    {/* Roles */}
                    <td className="border border-[var(--surface-border)] px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {emp.roles.length === 0
                          ? <span className="text-[var(--muted)] opacity-40 text-xs italic">—</span>
                          : emp.roles.map(r => (
                            <span
                              key={r.code}
                              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-[var(--color-primary-600)]/10 text-[var(--color-primary-600)] rounded font-semibold uppercase tracking-wide whitespace-nowrap"
                            >
                              <Shield className="w-2.5 h-2.5" />
                              {r.code.replace(/_/g, " ")}
                            </span>
                          ))
                        }
                      </div>
                    </td>

                    {/* Status */}
                    <td className="border border-[var(--surface-border)] px-3 py-2 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-semibold ${sm.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sm.dot}`} />
                        {sm.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td
                      className="border border-[var(--surface-border)] px-3 py-2 text-center sticky right-0 z-10"
                      style={{ background: "inherit" }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(emp)}
                          title="Edit"
                          className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)] hover:bg-[var(--color-primary-600)]/10 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeactivate(emp.id)}
                          disabled={deactivatingId === emp.id}
                          title="Deactivate"
                          className="p-1.5 rounded text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        >
                          {deactivatingId === emp.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <UserX className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div
            className="px-4 py-2 border-t border-[var(--surface-border)] flex items-center justify-between text-xs text-[var(--muted)]"
            style={{ background: "var(--surface-hover)" }}
          >
            <span>
              Showing <strong>{filtered.length}</strong> of <strong>{employees.length}</strong> employees
            </span>
            <span className="font-mono opacity-60">employees table</span>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--surface)] flex items-center justify-between p-6 pb-4 border-b border-[var(--surface-border)]">
              <h2 className="text-xl font-bold">{editTarget ? "Edit Employee" : "Add Employee"}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    placeholder="e.g. Abebe Kebede"
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="employee@example.com"
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+251 900 000 000"
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Password {!editTarget && <span className="text-red-500">*</span>}
                    {editTarget && <span className="text-[var(--muted)] font-normal ml-1 text-xs">(leave blank to keep)</span>}
                  </label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 8 characters"
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Assign Branch</label>
                  <select value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
                    <option value="">No specific branch (HQ / All)</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                {editTarget && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Roles <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${form.roles.includes(role)
                          ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]"
                          : "border-[var(--surface-border)] hover:bg-[var(--surface-hover)]"
                        }`}
                    >
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      {role.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-[var(--surface-border)] rounded-lg text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary-600)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-500)] disabled:opacity-60 transition-colors">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editTarget ? "Save Changes" : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
