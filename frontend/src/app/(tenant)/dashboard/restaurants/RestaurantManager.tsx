"use client"
import * as React from "react"
import {
  Utensils, GitBranch, Plus, Pencil, Trash2, X, Check,
  Loader2, Calendar, Store, AlertCircle
} from "lucide-react"

interface Branch {
  id: string
  name: string
}

interface Restaurant {
  id: string
  name: string
  branch_id: string
  branch?: { name: string } | null
  created_at: string
  logo_url?: string | null
  banner_url?: string | null
  _count?: { categories: number; menu_items: number; tables: number }
}

const emptyForm = { name: "", branch_id: "", logo_url: "", banner_url: "" }

export default function RestaurantManager() {
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([])
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showModal, setShowModal] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<Restaurant | null>(null)
  const [form, setForm] = React.useState(emptyForm)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const [logoUploading, setLogoUploading] = React.useState(false)
  const [bannerUploading, setBannerUploading] = React.useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    const formData = new FormData()
    formData.append("image", file)
    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setForm(f => ({ ...f, logo_url: data.data.url }))
      } else {
        setError(data.error || "Failed to upload logo")
      }
    } catch {
      setError("Failed to upload logo due to network error")
    } finally {
      setLogoUploading(false)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerUploading(true)
    const formData = new FormData()
    formData.append("image", file)
    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setForm(f => ({ ...f, banner_url: data.data.url }))
      } else {
        setError(data.error || "Failed to upload banner")
      }
    } catch {
      setError("Failed to upload banner due to network error")
    } finally {
      setBannerUploading(false)
    }
  }

  // Load restaurants and branches on mount
  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [restRes, branchRes] = await Promise.all([
        fetch("/api/restaurant/list"),
        fetch("/api/branches"),
      ])
      const restData = restRes.ok ? await restRes.json() : []
      const branchData = branchRes.ok ? await branchRes.json() : []
      setRestaurants(restData)
      setBranches(branchData)
    } catch (err) {
      console.error("Failed to load restaurants/branches", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const openCreate = () => {
    setEditTarget(null)
    setForm({ name: "", branch_id: branches[0]?.id ?? "", logo_url: "", banner_url: "" })
    setError("")
    setShowModal(true)
  }

  const openEdit = (r: Restaurant) => {
    setEditTarget(r)
    setForm({
      name: r.name,
      branch_id: r.branch_id,
      logo_url: r.logo_url || "",
      banner_url: r.banner_url || ""
    })
    setError("")
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setError("") }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError("Restaurant name is required."); return }
    if (!form.branch_id) { setError("Please select a branch."); return }
    setSubmitting(true)
    setError("")
    try {
      const isEdit = !!editTarget
      const url = isEdit ? `/api/restaurant/list/${editTarget.id}` : "/api/restaurant/list"
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          branch_id: form.branch_id,
          logo_url: form.logo_url || null,
          banner_url: form.banner_url || null
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
      // Refresh list from server to get branch name included
      await loadData()
      closeModal()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this restaurant? All categories and menu items linked to it will also be removed.")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/restaurant/list/${id}`, { method: "DELETE" })
      if (res.ok) {
        setRestaurants(prev => prev.filter(r => r.id !== id))
      } else {
        const data = await res.json()
        setError(data.error ?? "Failed to delete restaurant")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
      </div>
    )
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Store className="w-4 h-4" />
          <span>{restaurants.length} restaurant{restaurants.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          {branches.length === 0 && (
            <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Create a branch first
            </span>
          )}
          <button
            onClick={openCreate}
            disabled={branches.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-600)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Restaurant
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden border border-[var(--surface-border)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-hover)" }}>
                {["#", "Restaurant Name", "Branch", "Categories", "Menu Items", "Tables", "Created", "Actions"].map((h, i) => (
                  <th
                    key={h}
                    className={`border border-[var(--surface-border)] px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)] whitespace-nowrap select-none
                      ${i === 0 ? "w-10 text-center" : ""}
                      ${h === "Actions" ? "text-center w-28 sticky right-0 z-10" : ""}
                      ${["Categories", "Menu Items", "Tables"].includes(h) ? "text-center w-24" : ""}
                    `}
                    style={h === "Actions" ? { background: "var(--surface-hover)" } : {}}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {restaurants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-[var(--surface-border)] px-6 py-12 text-center">
                    <Utensils className="w-10 h-10 mx-auto text-[var(--muted)] mb-3 opacity-30" />
                    <p className="text-sm font-medium text-[var(--muted)]">
                      No restaurants yet. Click <strong>Add Restaurant</strong> to create your first one.
                    </p>
                  </td>
                </tr>
              ) : restaurants.map((r, idx) => (
                <tr
                  key={r.id}
                  className="group transition-colors"
                  style={{
                    background: idx % 2 === 0
                      ? "var(--surface)"
                      : "color-mix(in srgb, var(--surface-hover) 40%, transparent)"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "color-mix(in srgb, var(--color-primary-500) 6%, var(--surface))")}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "var(--surface)" : "color-mix(in srgb, var(--surface-hover) 40%, transparent)")}
                >
                  {/* Row number */}
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-center text-xs text-[var(--muted)] font-mono select-none w-10">
                    {idx + 1}
                  </td>

                  {/* Name */}
                  <td className="border border-[var(--surface-border)] px-3 py-2 font-semibold text-[var(--foreground)] whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[var(--color-primary-600)]/10 flex items-center justify-center shrink-0">
                        <Utensils className="w-3.5 h-3.5 text-[var(--color-primary-600)]" />
                      </div>
                      {r.name}
                    </div>
                  </td>

                  {/* Branch */}
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-[var(--muted)] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <GitBranch className="w-3 h-3 shrink-0 text-[var(--muted)]" />
                      {r.branch?.name ?? branches.find(b => b.id === r.branch_id)?.name ?? <span className="italic opacity-40">Unknown</span>}
                    </div>
                  </td>

                  {/* Categories count */}
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-center font-mono text-xs font-bold text-[var(--foreground)]">
                    {r._count?.categories ?? "—"}
                  </td>

                  {/* Menu Items count */}
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-center font-mono text-xs font-bold text-[var(--foreground)]">
                    {r._count?.menu_items ?? "—"}
                  </td>

                  {/* Tables count */}
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-center font-mono text-xs font-bold text-[var(--foreground)]">
                    {r._count?.tables ?? "—"}
                  </td>

                  {/* Created */}
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-[var(--muted)] whitespace-nowrap text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {fmt(r.created_at)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td
                    className="border border-[var(--surface-border)] px-3 py-2 text-center sticky right-0 z-10"
                    style={{ background: "inherit" }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        title="Edit"
                        className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)] hover:bg-[var(--color-primary-600)]/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        title="Delete"
                        className="p-1.5 rounded text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                      >
                        {deletingId === r.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {restaurants.length > 0 && (
          <div
            className="px-4 py-2 border-t border-[var(--surface-border)] flex items-center justify-between text-xs text-[var(--muted)]"
            style={{ background: "var(--surface-hover)" }}
          >
            <span>Showing {restaurants.length} of {restaurants.length} records</span>
            <span className="font-mono opacity-60">restaurants table</span>
          </div>
        )}
      </div>

      {/* Error outside modal */}
      {error && !showModal && (
        <div className="mt-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 border border-red-200 dark:border-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[var(--color-primary-600)]" />
                {editTarget ? "Edit Restaurant" : "New Restaurant"}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Restaurant name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Restaurant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grand Horizon Bistro"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] transition-shadow"
                  autoFocus
                />
              </div>

              {/* Branch selector */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Linked Branch <span className="text-red-500">*</span>
                </label>
                {branches.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg px-3 py-2">
                    No branches available. Please create a branch first under the Branches page.
                  </p>
                ) : (
                  <select
                    value={form.branch_id}
                    onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] transition-shadow"
                  >
                    <option value="">— Select branch —</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Restaurant Logo</label>
                <div className="flex items-center gap-3">
                  {form.logo_url && (
                    <img src={form.logo_url} alt="logo preview" className="w-14 h-14 object-cover rounded-lg border border-[var(--surface-border)] shrink-0" />
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="w-full px-3 py-2 border border-dashed border-[var(--surface-border)] rounded-lg text-sm text-[var(--muted)] hover:border-[var(--color-primary-500)] transition-colors text-center">
                      {logoUploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Click to upload logo"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                  </label>
                </div>
              </div>

              {/* Banner Upload */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Restaurant Banner</label>
                <div className="space-y-2">
                  {form.banner_url && (
                    <img src={form.banner_url} alt="banner preview" className="w-full h-20 object-cover rounded-lg border border-[var(--surface-border)]" />
                  )}
                  <label className="cursor-pointer block">
                    <div className="w-full px-3 py-2 border border-dashed border-[var(--surface-border)] rounded-lg text-sm text-[var(--muted)] hover:border-[var(--color-primary-500)] transition-colors text-center">
                      {bannerUploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Click to upload banner image"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={bannerUploading} />
                  </label>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-[var(--surface-border)] rounded-lg text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || branches.length === 0 || logoUploading || bannerUploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary-600)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-500)] disabled:opacity-60 transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editTarget ? "Save Changes" : "Create Restaurant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
