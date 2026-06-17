"use client"
import * as React from "react"
import { GitBranch, MapPin, Phone, Plus, Pencil, Trash2, X, Check, Loader2, Calendar } from "lucide-react"

interface Branch {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  created_at: string
}

interface Props {
  initialBranches: Branch[]
}

type FormData = { name: string; address: string; phone: string }
const emptyForm: FormData = { name: "", address: "", phone: "" }

export default function BranchManager({ initialBranches }: Props) {
  const [branches, setBranches] = React.useState<Branch[]>(initialBranches)
  const [showModal, setShowModal] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<Branch | null>(null)
  const [form, setForm] = React.useState<FormData>(emptyForm)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setError("")
    setShowModal(true)
  }

  const openEdit = (branch: Branch) => {
    setEditTarget(branch)
    setForm({ name: branch.name, address: branch.address ?? "", phone: branch.phone ?? "" })
    setError("")
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError("Branch name is required."); return }
    setLoading(true)
    setError("")
    try {
      const isEdit = !!editTarget
      const res = await fetch(isEdit ? `/api/branches/${editTarget!.id}` : "/api/branches", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
      if (isEdit) {
        setBranches(prev => prev.map(b => b.id === data.id ? data : b))
      } else {
        setBranches(prev => [...prev, data])
      }
      closeModal()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this branch? This action cannot be undone.")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/branches/${id}`, { method: "DELETE" })
      if (res.ok) setBranches(prev => prev.filter(b => b.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <GitBranch className="w-4 h-4" />
          <span>{branches.length} branch{branches.length !== 1 ? "es" : ""}</span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-600)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Branch
        </button>
      </div>

      {/* Excel-style Table */}
      <div className="rounded-lg overflow-hidden border border-[var(--surface-border)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-hover)" }}>
                {["#", "Branch Name", "Address", "Phone", "Created", "Actions"].map((h, i) => (
                  <th
                    key={h}
                    className={`border border-[var(--surface-border)] px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)] whitespace-nowrap select-none ${i === 0 ? "w-10 text-center" : ""} ${h === "Actions" ? "text-center w-28 sticky right-0 z-10" : ""}`}
                    style={h === "Actions" ? { background: "var(--surface-hover)" } : {}}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-[var(--surface-border)] px-6 py-12 text-center">
                    <GitBranch className="w-10 h-10 mx-auto text-[var(--muted)] mb-3 opacity-30" />
                    <p className="text-sm font-medium text-[var(--muted)]">No branches yet. Click <strong>Add Branch</strong> to create your first location.</p>
                  </td>
                </tr>
              ) : branches.map((branch, idx) => (
                <tr
                  key={branch.id}
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
                        <GitBranch className="w-3.5 h-3.5 text-[var(--color-primary-600)]" />
                      </div>
                      {branch.name}
                    </div>
                  </td>

                  {/* Address */}
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-[var(--muted)] max-w-[220px]">
                    {branch.address ? (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0 text-[var(--muted)]" />
                        <span className="truncate">{branch.address}</span>
                      </div>
                    ) : (
                      <span className="text-[var(--muted)] opacity-40 italic">—</span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-[var(--muted)] whitespace-nowrap font-mono text-xs">
                    {branch.phone ? (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 shrink-0 text-[var(--muted)]" />
                        {branch.phone}
                      </div>
                    ) : (
                      <span className="opacity-40 italic">—</span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-[var(--muted)] whitespace-nowrap text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {fmt(branch.created_at)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td
                    className="border border-[var(--surface-border)] px-3 py-2 text-center sticky right-0 z-10"
                    style={{ background: "inherit" }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(branch)}
                        title="Edit"
                        className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)] hover:bg-[var(--color-primary-600)]/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
                        disabled={deletingId === branch.id}
                        title="Delete"
                        className="p-1.5 rounded text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                      >
                        {deletingId === branch.id
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

        {/* Footer row */}
        {branches.length > 0 && (
          <div
            className="px-4 py-2 border-t border-[var(--surface-border)] flex items-center justify-between text-xs text-[var(--muted)]"
            style={{ background: "var(--surface-hover)" }}
          >
            <span>Showing {branches.length} of {branches.length} records</span>
            <span className="font-mono opacity-60">branches table</span>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editTarget ? "Edit Branch" : "New Branch"}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Branch Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Main Branch, Bole Location"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Bole Road, Addis Ababa"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. +251 911 234 567"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] transition-shadow"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
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
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary-600)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-500)] disabled:opacity-60 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editTarget ? "Save Changes" : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
