"use client"

import * as React from "react"
import { Loader2, Table2, Plus } from "lucide-react"
import { TableModal } from "./components/TableModal"
import { TableGridCard, RestaurantTable } from "./components/TableGridCard"

interface Restaurant { id: string; name: string }
interface Branch { id: string; name: string }

type TableForm = {
  tableNumber: string; capacity: string
  branchScope: "single" | "multiple" | "all"
  branchId: string; selectedBranchIds: string[]
}

export default function TablesPage() {
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [tables, setTables] = React.useState<RestaurantTable[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showModal, setShowModal] = React.useState(false)
  const [tableForm, setTableForm] = React.useState<TableForm>({ tableNumber: "", capacity: "4", branchScope: "single", branchId: "", selectedBranchIds: [] })
  const [submitting, setSubmitting] = React.useState(false)
  const [tableError, setTableError] = React.useState("")
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const myRes = await fetch("/api/restaurant/my")
      const myData = myRes.ok ? await myRes.json() : null
      setRestaurant(myData)
      if (myData) {
        const [branchRes, tablesRes] = await Promise.all([
          fetch("/api/branches"),
          fetch(`/api/restaurant/tables?restaurant_id=${myData.id}`)
        ])
        const branchData = branchRes.ok ? await branchRes.json() : []
        setBranches(branchData)
        setTables(tablesRes.ok ? await tablesRes.json() : [])
        if (branchData.length > 0) {
          setTableForm(prev => ({ ...prev, branchId: branchData[0].id, selectedBranchIds: [branchData[0].id] }))
        }
      }
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const openCreate = () => {
    setTableForm({ tableNumber: "", capacity: "4", branchScope: "single", branchId: branches[0]?.id ?? "", selectedBranchIds: branches.map(b => b.id) })
    setTableError("")
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tableForm.tableNumber.trim()) { setTableError("Table name/number is required."); return }
    if (!restaurant) { setTableError("Restaurant brand required."); return }
    setSubmitting(true)
    setTableError("")
    try {
      const payload: any = { restaurant_id: restaurant.id, table_number: tableForm.tableNumber.trim(), capacity: parseInt(tableForm.capacity) || 4 }
      if (tableForm.branchScope === "all") payload.all_branches = true
      else if (tableForm.branchScope === "multiple") {
        if (tableForm.selectedBranchIds.length === 0) { setTableError("Please select at least one branch."); setSubmitting(false); return }
        payload.branch_ids = tableForm.selectedBranchIds
      } else {
        if (!tableForm.branchId) { setTableError("Branch selection is required."); setSubmitting(false); return }
        payload.branch_id = tableForm.branchId
      }
      const res = await fetch("/api/restaurant/tables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { setTableError(data.error ?? "Failed to create table"); return }
      const tablesRes = await fetch(`/api/restaurant/tables?restaurant_id=${restaurant.id}`)
      setTables(tablesRes.ok ? await tablesRes.json() : [])
      setShowModal(false)
    } catch { setTableError("Network error. Please try again.") } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this table? All associated QR codes will be deleted.")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/restaurant/tables/${id}`, { method: "DELETE" })
      if (res.ok) setTables(prev => prev.filter(t => t.id !== id))
    } finally { setDeletingId(null) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" /></div>

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg tracking-tight">Manage Restaurant Tables</h3>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-600)] text-[var(--background)] text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Table
          </button>
        </div>

        {tables.length === 0 ? (
          <div className="rounded-2xl border border-[var(--surface-border)] py-16 bg-[var(--surface)] text-center">
            <Table2 className="w-12 h-12 mx-auto text-[var(--muted)] mb-3 opacity-35" />
            <h4 className="font-bold text-base mb-1">No Tables Registered</h4>
            <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">Create tables for a single branch, selected branches, or broadcast across all branches of your restaurant brand.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map(table => (
              <TableGridCard key={table.id} table={table} deletingId={deletingId} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <TableModal
        show={showModal} branches={branches} form={tableForm} setForm={setTableForm}
        submitting={submitting} error={tableError}
        onClose={() => setShowModal(false)} onSubmit={handleSubmit}
      />
    </>
  )
}
