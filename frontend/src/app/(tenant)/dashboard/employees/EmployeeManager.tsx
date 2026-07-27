"use client"
import * as React from "react"
import { Plus } from "lucide-react"
import { EmployeeTable, type Employee, type EmployeeRole } from "./components/EmployeeTable"
import { EmployeeFormModal, type EmployeeFormData } from "./components/EmployeeFormModal"

interface Props { initialEmployees: Employee[]; branches: { id: string; name: string }[]; roles: EmployeeRole[]; currentUser?: any }

const emptyForm = (defaultBranchId = ""): EmployeeFormData => ({
  fullName: "", email: "", phone: "", password: "", branchId: defaultBranchId, role: "", status: "ACTIVE", tableIds: [],
})

export default function EmployeeManager({ initialEmployees, branches, roles, currentUser }: Props) {
  const isOwner = currentUser?.roles?.includes('HOTEL_OWNER') ?? true
  const myBranchId = currentUser?.branch_id ?? ""
  const myUserId = currentUser?.id ?? ""

  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees.filter(e => e.id !== myUserId))
  const [showModal, setShowModal] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<Employee | null>(null)
  const [form, setForm] = React.useState<EmployeeFormData>(emptyForm(isOwner ? "" : myBranchId))
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [filterBranch, setFilterBranch] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [allTables, setAllTables] = React.useState<{ id: string; table_number: string }[]>([])

  React.useEffect(() => {
    fetch("/api/restaurant/tables")
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setAllTables(data) })
      .catch(() => { })
  }, [])

  const openCreate = () => { setEditTarget(null); setForm(emptyForm(isOwner ? "" : myBranchId)); setError(""); setShowModal(true) }
  const openEdit = (emp: Employee) => {
    setEditTarget(emp)
    setForm({ fullName: emp.fullName, email: emp.email, phone: emp.phone ?? "", password: "", branchId: emp.branchId ?? "", role: emp.roles?.[0]?.code ?? "", status: emp.status, tableIds: emp.waiter_tables?.map(t => t.id) ?? [] })
    setError(""); setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setError("") }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.email.trim()) { setError("Name and email are required."); return }
    if (!editTarget && !form.password) { setError("Password is required for new employees."); return }
    if (!form.role) { setError("Select at least one role."); return }
    setLoading(true); setError("")
    try {
      const isEdit = !!editTarget
      const payload: any = { fullName: form.fullName, email: form.email, phone: form.phone || null, branchId: form.branchId || null, roles: form.role ? [form.role] : [], status: form.status, tableIds: form.role === "WAITER" ? form.tableIds : [] }
      if (form.password) payload.password = form.password
      const res = await fetch(isEdit ? `/api/employees/${editTarget!.id}` : "/api/employees", { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
      setEmployees(prev => isEdit ? prev.map(e => e.id === data.id ? data : e) : [...prev, data])
      closeModal()
    } catch { setError("Network error. Please try again.") }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this employee? This cannot be undone.")) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" })
      if (res.ok) setEmployees(prev => prev.filter(e => e.id !== id))
      else { const d = await res.json(); alert(d.error || "Failed to delete employee") }
    } finally { setBusyId(null) }
  }

  const handleToggleSuspend = async (emp: Employee) => {
    const isSuspended = emp.status === "SUSPENDED"
    const newStatus = isSuspended ? "ACTIVE" : "SUSPENDED"
    if (!confirm(isSuspended ? `Activate ${emp.fullName}?` : `Suspend ${emp.fullName}?`)) return
    setBusyId(emp.id)
    try {
      const res = await fetch(`/api/employees/${emp.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) })
      const data = await res.json()
      if (res.ok) setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: newStatus } : e))
      else alert(data.error || "Failed to update status")
    } finally { setBusyId(null) }
  }

  const filtered = employees.filter(e => {
    if (filterBranch && e.branchId !== filterBranch) return false
    if (filterStatus && e.status !== filterStatus) return false
    if (search) { const q = search.toLowerCase(); return e.fullName.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) }
    return true
  })

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mb-4">
        <input type="text" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
          className="px-3 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none">
          <option value="">All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-600)] text-[var(--background)] text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] shadow-sm shrink-0">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      <EmployeeTable filtered={filtered} employees={employees} busyId={busyId} search={search} filterBranch={filterBranch} filterStatus={filterStatus}
        onEdit={openEdit} onDelete={handleDelete} onToggleSuspend={handleToggleSuspend} />

      <EmployeeFormModal show={showModal} editTarget={editTarget} form={form} setForm={setForm} branches={branches} roles={roles}
        allTables={allTables} isOwner={isOwner} currentUser={currentUser} submitting={loading} error={error} onClose={closeModal} onSubmit={handleSubmit} />
    </>
  )
}
