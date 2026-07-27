"use client"

import * as React from "react"
import { Loader2, GitBranch, Plus } from "lucide-react"
import { BranchModal, BranchFormData } from "./components/BranchModal"
import { BranchCard, Branch } from "./components/BranchCard"

interface Restaurant {
  id: string
  name: string
  logo_url?: string | null
  banner_url?: string | null
  created_at: string
}

const emptyBranchForm: BranchFormData = { name: "", address: "", phone: "" }

export default function BranchesPage() {
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showModal, setShowModal] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<Branch | null>(null)
  const [branchForm, setBranchForm] = React.useState<BranchFormData>(emptyBranchForm)
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState("")
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const myRes = await fetch("/api/restaurant/my")
      const myData = myRes.ok ? await myRes.json() : null
      setRestaurant(myData)
      if (myData) {
        const branchRes = await fetch("/api/branches")
        setBranches(branchRes.ok ? await branchRes.json() : [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const openCreate = () => {
    setEditTarget(null)
    setBranchForm(emptyBranchForm)
    setFormError("")
    setShowModal(true)
  }

  const openEdit = (branch: Branch) => {
    setEditTarget(branch)
    setBranchForm({ name: branch.name, address: branch.address ?? "", phone: branch.phone ?? "" })
    setFormError("")
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchForm.name.trim()) { setFormError("Branch name is required."); return }
    if (!restaurant) { setFormError("Root Restaurant Profile is required."); return }

    setSubmitting(true)
    setFormError("")
    try {
      const isEdit = !!editTarget
      const payload = {
        ...(isEdit ? {} : { restaurant_id: restaurant.id }),
        name: branchForm.name.trim(),
        address: branchForm.address.trim() || null,
        phone: branchForm.phone.trim() || null,
      }
      const res = await fetch(isEdit ? `/api/branches/${editTarget!.id}` : "/api/branches", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error ?? "Something went wrong"); return }
      setBranches(prev =>
        isEdit ? prev.map(b => b.id === data.id ? { ...b, ...data } : b) : [...prev, data]
      )
      setShowModal(false)
    } catch {
      setFormError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this branch? Action cannot be undone.")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/branches/${id}`, { method: "DELETE" })
      if (res.ok) setBranches(prev => prev.filter(b => b.id !== id))
      else alert("Failed to delete branch")
    } catch {
      alert("Network error deleting branch")
    } finally {
      setDeletingId(null)
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
      {restaurant && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Manage Restaurant Branch Locations</h3>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-600)] text-[var(--background)] text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Branch
            </button>
          </div>

          {branches.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--surface-border)] py-12 bg-[var(--surface)] text-center">
              <GitBranch className="w-12 h-12 mx-auto text-[var(--muted)] mb-3 opacity-30" />
              <h4 className="font-bold mb-1">No Branch Outlets Registered</h4>
              <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
                Add physical branch outlets to broadcast master categories and menu items.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map(branch => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  deletingId={deletingId}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <BranchModal
        show={showModal}
        editTarget={editTarget}
        formData={branchForm}
        setFormData={setBranchForm}
        submitting={submitting}
        error={formError}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
      />
    </>
  )
}
