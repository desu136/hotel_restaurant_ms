"use client"
import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { GitBranch, MapPin, Phone, Plus, Pencil, Trash2, X, Check, Loader2 } from "lucide-react"

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

  return (
    <>
      {/* Add Branch Button */}
      <button
        onClick={openCreate}
        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-primary-600)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors shadow-sm shrink-0"
      >
        <Plus className="w-4 h-4" />
        Add Branch
      </button>

      {/* Branch Grid */}
      {branches.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 bg-transparent shadow-none mt-6">
          <GitBranch className="w-12 h-12 mx-auto text-[var(--muted)] mb-4 opacity-40" />
          <h3 className="text-lg font-semibold">No branches yet</h3>
          <p className="text-sm text-[var(--muted)] mt-1">Click "Add Branch" to create your first location.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {branches.map(branch => (
            <Card key={branch.id} className="hover:border-[var(--color-primary-500)]/40 transition-all hover:shadow-md group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-600)]/10 flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-[var(--color-primary-600)]" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(branch)}
                      className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      disabled={deletingId === branch.id}
                      className="p-1.5 rounded-md text-[var(--muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      {deletingId === branch.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-lg tracking-tight mb-2">{branch.name}</h3>
                {branch.address && (
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{branch.address}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
