"use client"
import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users2, Plus, Pencil, UserX, X, Check, Loader2, GitBranch, Shield, Mail, Phone } from "lucide-react"

const ALL_ROLES = [
  "HOTEL_OWNER", "HOTEL_MANAGER", "RECEPTIONIST",
  "RESTAURANT_MANAGER", "WAITER", "CHEF", "CASHIER", "DELIVERY_DRIVER",
]

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  INACTIVE: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  SUSPENDED: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
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

  const filtered = filterBranch
    ? employees.filter(e => e.branchId === filterBranch)
    : employees

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <select
          value={filterBranch}
          onChange={e => setFilterBranch(e.target.value)}
          className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
        >
          <option value="">All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary-600)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Employee Table / Cards */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 bg-transparent shadow-none mt-6">
          <Users2 className="w-12 h-12 mx-auto text-[var(--muted)] mb-4 opacity-40" />
          <h3 className="text-lg font-semibold">No employees found</h3>
          <p className="text-sm text-[var(--muted)] mt-1">
            {filterBranch ? "No employees in this branch." : 'Click "Add Employee" to register your first staff member.'}
          </p>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map(emp => (
            <Card key={emp.id} className="hover:border-[var(--color-primary-500)]/40 transition-all group">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary-500)] to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {emp.fullName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm">{emp.fullName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[emp.status] ?? ""}`}>
                      {emp.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{emp.email}</span>
                    {emp.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{emp.phone}</span>}
                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{emp.branchName}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {emp.roles.map(r => (
                      <span key={r.code} className="text-xs px-2 py-0.5 bg-[var(--color-primary-600)]/10 text-[var(--color-primary-600)] rounded-full font-medium">
                        {r.code.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(emp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--surface-border)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeactivate(emp.id)}
                    disabled={deactivatingId === emp.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-red-800 transition-colors"
                  >
                    {deactivatingId === emp.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <UserX className="w-3.5 h-3.5" />}
                    Deactivate
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="e.g. Abebe Kebede"
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Email <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="employee@example.com"
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+251 900 000 000"
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Password {!editTarget && <span className="text-red-500">*</span>}
                  {editTarget && <span className="text-[var(--muted)] font-normal ml-1">(leave blank to keep current)</span>}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Assign Branch</label>
                <select value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
                  <option value="">No specific branch (HQ / All)</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {/* Roles */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Roles <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${
                        form.roles.includes(role)
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

              {/* Status (edit only) */}
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
