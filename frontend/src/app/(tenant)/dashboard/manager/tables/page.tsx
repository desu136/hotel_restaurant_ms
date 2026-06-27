"use client"
import * as React from "react"
import {
  Loader2, Plus, Trash2, QrCode, Users, Table2, AlertCircle
} from "lucide-react"

interface Restaurant { id: string; name: string }
interface RestaurantTable {
  id: string
  table_number: string
  capacity: number
  branch_id: string
  status?: string
}

export default function TablesPage() {
  const [currentUser, setCurrentUser] = React.useState<{ id: string; email: string; roles: string[] } | null>(null)
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([])
  const [selectedRestaurantId, setSelectedRestaurantId] = React.useState("")
  const [tables, setTables] = React.useState<RestaurantTable[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState("")
  const [form, setForm] = React.useState({ table_number: "", capacity: "2" })
  const [showForm, setShowForm] = React.useState(false)

  const fetchRestaurants = async () => {
    try {
      // Fetch current user
      const meRes = await fetch("/api/auth/me")
      const meData = meRes.ok ? await meRes.json() : null
      if (meData && meData.success && meData.user) {
        setCurrentUser(meData.user)
      }

      const res = await fetch("/api/restaurant/list")
      const data = res.ok ? await res.json() : []
      setRestaurants(data)
      if (data.length > 0) {
        setSelectedRestaurantId(data[0].id)
        await fetchTables(data[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTables = async (restaurantId: string) => {
    const res = await fetch(`/api/restaurant/tables?restaurant_id=${restaurantId}`)
    const data = res.ok ? await res.json() : []
    setTables(data)
  }

  React.useEffect(() => { fetchRestaurants() }, [])

  const handleRestaurantChange = async (id: string) => {
    setSelectedRestaurantId(id)
    setTables([])
    if (id) await fetchTables(id)
  }

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.table_number.trim()) { setError("Table number is required"); return }
    if (!selectedRestaurantId) { setError("Select a restaurant first"); return }
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/restaurant/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: selectedRestaurantId,
          table_number: form.table_number.trim(),
          capacity: parseInt(form.capacity) || 2
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to create table"); return }
      setTables(prev => [...prev, data])
      setForm({ table_number: "", capacity: "2" })
      setShowForm(false)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTable = async (id: string) => {
    if (!confirm("Delete this table? Any linked QR codes will also be deleted.")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/restaurant/tables/${id}`, { method: "DELETE" })
      if (res.ok) setTables(prev => prev.filter(t => t.id !== id))
    } catch { /* ignore */ } finally {
      setDeletingId(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
    </div>
  )

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Table Registration 🪑</h1>
        <p className="text-[var(--muted)]">Register tables for your restaurant. Each table can have its own QR code for customer self-ordering.</p>
      </div>

      {/* Restaurant Selector */}
      {restaurants.length > 0 && (
        <div className="flex items-center gap-3 bg-[var(--surface-hover)]/30 p-4 rounded-xl border border-[var(--surface-border)]">
          <label className="text-sm font-semibold text-[var(--muted)]">Active Restaurant:</label>
          {currentUser?.roles.includes('HOTEL_OWNER') ? (
            <select
              value={selectedRestaurantId}
              onChange={e => handleRestaurantChange(e.target.value)}
              className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-sm font-bold text-[var(--foreground)]">
              {restaurants.find(r => r.id === selectedRestaurantId)?.name || 'Loading outlet details...'}
            </span>
          )}
        </div>
      )}

      {restaurants.length === 0 && (
        <div className="py-12 text-center border-2 border-dashed rounded-xl text-[var(--muted)]">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No restaurants found. Create one first under Restaurants.</p>
        </div>
      )}

      {restaurants.length > 0 && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Table2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-black">{tables.length}</p>
                <p className="text-xs text-[var(--muted)]">Total Tables</p>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-black">{tables.reduce((s, t) => s + t.capacity, 0)}</p>
                <p className="text-xs text-[var(--muted)]">Total Capacity</p>
              </div>
            </div>
          </div>

          {/* Table list header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Tables</h2>
            <button
              onClick={() => { setShowForm(true); setError("") }}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-600)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Table
            </button>
          </div>

          {/* Add Table inline form */}
          {showForm && (
            <div className="rounded-xl border border-[var(--color-primary-500)]/30 bg-[var(--surface)] p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold">Register New Table</h3>
              <form onSubmit={handleAddTable} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Table Number / Name *</label>
                  <input
                    placeholder="e.g. T1, A-01, VIP-1"
                    value={form.table_number}
                    onChange={e => setForm(f => ({ ...f, table_number: e.target.value }))}
                    className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    autoFocus
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Capacity</label>
                  <input
                    type="number" min="1" max="50"
                    value={form.capacity}
                    onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                    className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit" disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-600)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] disabled:opacity-60 transition-colors"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Save
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-sm border border-[var(--surface-border)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
              {error && (
                <p className="text-sm text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> {error}
                </p>
              )}
            </div>
          )}

          {/* Tables Grid */}
          {tables.length === 0 && !showForm ? (
            <div className="py-16 text-center border-2 border-dashed rounded-xl text-[var(--muted)]">
              <Table2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No tables registered yet</p>
              <p className="text-xs mt-1">Click "Add Table" to register your first table</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {tables.map(table => (
                <div
                  key={table.id}
                  className="group relative rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-4 flex flex-col items-center gap-2 hover:border-[var(--color-primary-500)]/40 hover:shadow-sm transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-600)]/10 flex items-center justify-center">
                    <Table2 className="w-6 h-6 text-[var(--color-primary-600)]" />
                  </div>
                  <p className="font-black text-sm">{table.table_number}</p>
                  <p className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                    <Users className="w-3 h-3" /> {table.capacity} seats
                  </p>
                  <a
                    href={`/dashboard/manager/qr?restaurant_id=${selectedRestaurantId}&table_id=${table.id}`}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-[var(--color-primary-600)]/10 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-600)] hover:text-white transition-colors font-semibold"
                  >
                    <QrCode className="w-3 h-3" /> QR Code
                  </a>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    disabled={deletingId === table.id}
                    className="absolute top-2 right-2 p-1 rounded text-[var(--muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    {deletingId === table.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
