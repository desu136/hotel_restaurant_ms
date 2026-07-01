"use client"
import * as React from "react"
import {
  Store, Pencil, Loader2, Check, X, AlertCircle,
  GitBranch, UtensilsCrossed, Table2, Calendar,
  MapPin, Phone, Plus, Trash2, Utensils, Tag, Layers, Users
} from "lucide-react"

interface Restaurant {
  id: string
  name: string
  logo_url?: string | null
  banner_url?: string | null
  created_at: string
}

interface Branch {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  created_at: string
  _count?: {
    categories: number
    menuItems: number
    restaurantTables: number
  }
}

interface MasterCategory {
  id: string
  name: string
  parent_id?: string | null
  created_at: string
}

interface Category {
  id: string
  name: string
  branch_id: string
  master_category_id?: string | null
  parent_id?: string | null
  created_at: string
  branch: {
    id: string
    name: string
  }
}

interface MasterMenuItem {
  id: string
  display_name: string
  description?: string | null
  price: string | number
  master_category_id?: string | null
  availability: boolean
  customizations?: any
  image_url?: string | null
  created_at: string
  category?: { id: string; name: string } | null
}

interface MenuItem {
  id: string
  display_name: string
  description?: string | null
  price: string | number
  category_id?: string | null
  master_menu_item_id?: string | null
  availability: boolean
  customizations?: any
  image_url?: string | null
  branch_id: string
  created_at: string
  branch: {
    id: string;
    name: string
  }
  category?: { id: string; name: string } | null
}

interface RestaurantTable {
  id: string
  table_number: string
  capacity: number
  branch_id: string
  branch: {
    id: string
    name: string
  }
}

type BranchFormData = { name: string; address: string; phone: string }
const emptyBranchForm: BranchFormData = { name: "", address: "", phone: "" }


export default function TablesPage() {
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [masterCategories, setMasterCategories] = React.useState<MasterCategory[]>([])
  const [branchCategories, setBranchCategories] = React.useState<Category[]>([])
  const [masterMenuItems, setMasterMenuItems] = React.useState<MasterMenuItem[]>([])
  const [branchMenuItems, setBranchMenuItems] = React.useState<MenuItem[]>([])

  const [loading, setLoading] = React.useState(true)
  const [tables, setTables] = React.useState<RestaurantTable[]>([])
  const [activeTab, setActiveTab] = React.useState<"branches" | "categories" | "menu" | "tables">("branches")



  // Tables CRUD Modal State
  const [showTableModal, setShowTableModal] = React.useState(false)
  const [tableForm, setTableForm] = React.useState({
    tableNumber: "",
    capacity: "4",
    branchScope: "single" as "single" | "multiple" | "all",
    branchId: "",
    selectedBranchIds: [] as string[]
  })
  const [tableSubmitting, setTableSubmitting] = React.useState(false)
  const [tableError, setTableError] = React.useState("")
  const [deletingTableId, setDeletingTableId] = React.useState<string | null>(null)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const myRes = await fetch("/api/restaurant/my")
      const myData = myRes.ok ? await myRes.json() : null
      setRestaurant(myData)

      if (myData) {
        const [branchRes, masterCatRes, branchCatRes, masterMenuRes, branchMenuRes, tablesRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/restaurant/categories?is_master=true"),
          fetch("/api/restaurant/categories"),
          fetch("/api/restaurant/menu?is_master=true"),
          fetch("/api/restaurant/menu"),
          fetch(`/api/restaurant/tables?restaurant_id=${myData.id}`)
        ])

        const branchData = branchRes.ok ? await branchRes.json() : []
        const masterCatData = masterCatRes.ok ? await masterCatRes.json() : []
        const branchCatData = branchCatRes.ok ? await branchCatRes.json() : []
        const masterMenuData = masterMenuRes.ok ? await masterMenuRes.json() : []
        const branchMenuData = branchMenuRes.ok ? await branchMenuRes.json() : []
        const tablesData = tablesRes.ok ? await tablesRes.json() : []

        setBranches(branchData)
        setMasterCategories(masterCatData)
        setBranchCategories(branchCatData)
        setMasterMenuItems(masterMenuData)
        setBranchMenuItems(branchMenuData)
        setTables(tablesData)

        // Initialize default branch in form
        if (branchData.length > 0) {
          setTableForm(prev => ({
            ...prev,
            branchId: branchData[0].id,
            selectedBranchIds: [branchData[0].id]
          }))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  // Tables CRUD Handlers
  const openTableCreate = () => {
    setTableForm({
      tableNumber: "",
      capacity: "4",
      branchScope: "single",
      branchId: branches[0]?.id ?? "",
      selectedBranchIds: branches.map(b => b.id)
    })
    setTableError("")
    setShowTableModal(true)
  }

  const handleTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tableForm.tableNumber.trim()) { setTableError("Table name/number is required."); return }
    if (!restaurant) { setTableError("Restaurant brand required."); return }

    setTableSubmitting(true)
    setTableError("")

    try {
      const payload: any = {
        restaurant_id: restaurant.id,
        table_number: tableForm.tableNumber.trim(),
        capacity: parseInt(tableForm.capacity) || 4
      }

      if (tableForm.branchScope === "all") {
        payload.all_branches = true
      } else if (tableForm.branchScope === "multiple") {
        if (tableForm.selectedBranchIds.length === 0) {
          setTableError("Please select at least one branch.")
          setTableSubmitting(false)
          return
        }
        payload.branch_ids = tableForm.selectedBranchIds
      } else {
        if (!tableForm.branchId) {
          setTableError("Branch selection is required.")
          setTableSubmitting(false)
          return
        }
        payload.branch_id = tableForm.branchId
      }

      const res = await fetch("/api/restaurant/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) { setTableError(data.error ?? "Failed to create table"); return }

      // Reload tables list
      const tablesRes = await fetch(`/api/restaurant/tables?restaurant_id=${restaurant.id}`)
      const tablesData = tablesRes.ok ? await tablesRes.json() : []
      setTables(tablesData)
      setShowTableModal(false)
    } catch {
      setTableError("Network error. Please try again.")
    } finally {
      setTableSubmitting(false)
    }
  }

  const handleTableDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this table? All associated QR codes will be deleted.")) return
    setDeletingTableId(id)
    try {
      const res = await fetch(`/api/restaurant/tables/${id}`, { method: "DELETE" })
      if (res.ok) {
        setTables(prev => prev.filter(t => t.id !== id))
      }
    } finally {
      setDeletingTableId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
      </div>
    )
  }
  return (
    <>
      {/* Tab Contents: Tables */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg font-black tracking-tight text-[var(--foreground)]">Manage Restaurant Tables</h3>
          <button
            onClick={openTableCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-600)] text-[var(--background)] text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Table
          </button>
        </div>

        {tables.length === 0 ? (
          <div className="rounded-2xl border border-[var(--surface-border)] py-16 bg-[var(--surface)] text-center">
            <Table2 className="w-12 h-12 mx-auto text-[var(--muted)] mb-3 opacity-35" />
            <h4 className="font-bold text-base mb-1">No Tables Registered</h4>
            <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
              Create tables for a single branch, selected branches, or broadcast across all branches of your restaurant brand.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map(table => (
              <div
                key={table.id}
                className="group relative rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 flex flex-col justify-between hover:border-[var(--color-primary-500)]/45 hover:shadow-md transition-all duration-300"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                        <Table2 className="w-5.5 h-5.5 text-[var(--foreground)]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-base tracking-tight truncate text-[var(--foreground)]">{table.table_number}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded  inline-block mt-0.5">
                          {table.branch?.name || "All Branches"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-4 text-xs text-[var(--muted)] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[var(--muted)]" />
                      <span>{table.capacity} Seats capacity</span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleTableDelete(table.id)}
                    disabled={deletingTableId === table.id}
                    className="p-2 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    {deletingTableId === table.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Add Table Modal ─── */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTableModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Table2 className="w-5 h-5 text-[var(--color-primary-600)]" />
                Add Restaurant Table
              </h2>
              <button onClick={() => setShowTableModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTableSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-[var(--foreground)]">Table Number / Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. T-1, VIP-2"
                  value={tableForm.tableNumber}
                  onChange={e => setTableForm(f => ({ ...f, tableNumber: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-[var(--foreground)]">Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tableForm.capacity}
                  onChange={e => setTableForm(f => ({ ...f, capacity: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-[var(--foreground)]">Branch Distribution Scope</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["single", "multiple", "all"] as const).map(scope => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => setTableForm(f => ({ ...f, branchScope: scope }))}
                      className={`px-3 py-2 text-xs font-bold rounded-lg border capitalize transition-all ${tableForm.branchScope === scope
                        ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)]/5 text-[var(--color-primary-600)]"
                        : "border-[var(--surface-border)] hover:bg-[var(--surface-hover)]"
                        }`}
                    >
                      {scope === "all" ? "All Branches" : scope === "multiple" ? "Select Some" : "Single Branch"}
                    </button>
                  ))}
                </div>
              </div>

              {tableForm.branchScope === "single" && (
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-[var(--foreground)]">Target Branch Outlet <span className="text-red-500">*</span></label>
                  <select
                    value={tableForm.branchId}
                    onChange={e => setTableForm(f => ({ ...f, branchId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  >
                    <option value="" disabled>Select Branch</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {tableForm.branchScope === "multiple" && (
                <div className="space-y-2 border border-[var(--surface-border)] rounded-xl p-3 bg-[var(--surface-hover)]/30">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Choose Branches <span className="text-red-500">*</span></label>
                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                    {branches.map(b => {
                      const checked = tableForm.selectedBranchIds.includes(b.id)
                      return (
                        <label key={b.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setTableForm(f => {
                                const exists = f.selectedBranchIds.includes(b.id)
                                return {
                                  ...f,
                                  selectedBranchIds: exists
                                    ? f.selectedBranchIds.filter(id => id !== b.id)
                                    : [...f.selectedBranchIds, b.id]
                                }
                              })
                            }}
                            className="w-4 h-4 rounded text-[var(--color-primary-600)]"
                          />
                          <span className="text-xs font-semibold">{b.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {tableError && <p className="text-sm text-red-500">{tableError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTableModal(false)} className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-semibold hover:bg-[var(--surface-hover)]">Cancel</button>
                <button type="submit" disabled={tableSubmitting} className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-500)] disabled:opacity-60 flex items-center justify-center gap-1.5">
                  {tableSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
