"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Ticket,
  Copy,
} from "lucide-react"

interface Promotion {
  id: string
  title: string
  description: string | null
  terms_conditions: string | null
  code: string | null
  discount_value: string | null
  banner_url: string | null
  type: string
  scope: string
  status: string
  start_date: string
  end_date: string
  restaurant_id: string | null
  category_id: string | null
  menu_item_id: string | null
  is_active: boolean
  created_at: string
}

export default function PromotionsPage() {
  const router = useRouter()
  const [promotions, setPromotions] = React.useState<Promotion[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = React.useState<Promotion | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  // Toast
  const [toast, setToast] = React.useState<{ msg: string; type: "success" | "error" } | null>(null)

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchPromotions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/promotions")
      if (!res.ok) throw new Error("Failed to load promotions")
      const data = await res.json()
      setPromotions(data.promotions ?? [])
    } catch {
      setError("Could not load promotions. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchPromotions()
  }, [])

  const openCreate = () => {
    router.push("/dashboard/manager/promotions/create")
  }

  const openEdit = (p: Promotion) => {
    router.push(`/dashboard/manager/promotions/create?id=${p.id}`)
  }

  const openDuplicate = (p: Promotion) => {
    router.push(`/dashboard/manager/promotions/create?duplicate=${p.id}`)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/promotions/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      showToast("Promotion deleted.")
      setDeleteTarget(null)
      fetchPromotions()
    } catch {
      showToast("Could not delete promotion.", "error")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${
              toast.type === "error"
                ? "bg-red-600 text-white"
                : "bg-emerald-600 text-white"
            }`}
          >
            {toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-[var(--color-primary-600)]" />
            Promotions
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Create and manage rule-based promotions that are automatically applied at checkout.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--foreground)] text-[var(--btn-fg)] rounded-xl font-semibold text-sm shadow-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Promotion
        </motion.button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--muted)]" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      ) : promotions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-dashed border-[var(--surface-border)] bg-[var(--surface)] p-14 flex flex-col items-center gap-4 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-hover)] flex items-center justify-center">
            <Megaphone className="w-7 h-7 text-[var(--muted)]" />
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">No promotions yet</p>
            <p className="text-sm text-[var(--muted)] mt-1">
              Create your first promotion — discounts will be applied automatically at checkout.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="mt-2 flex items-center gap-2 px-4 py-2 bg-[var(--foreground)] text-[var(--btn-fg)] rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Promotion
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {promotions.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative rounded-2xl border overflow-hidden transition-all ${
                p.is_active
                  ? "border-[var(--color-primary-600)]/20 bg-gradient-to-br from-[var(--color-primary-600)]/5 to-transparent"
                  : "border-[var(--surface-border)] bg-[var(--surface)] opacity-60"
              }`}
            >
              {/* Banner image */}
              {p.banner_url && (
                <div className="h-28 overflow-hidden">
                  <img
                    src={p.banner_url}
                    alt={p.title}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                </div>
              )}

              <div className="p-4 flex flex-col gap-2">
                {/* Status badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${
                    p.status === "ACTIVE" && p.is_active
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : p.status === "SCHEDULED"
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                      : "bg-[var(--surface-hover)] text-[var(--muted)] border border-[var(--surface-border)]"
                  }`}>
                    {p.status}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider bg-[var(--surface-hover)] border border-[var(--surface-border)]">
                    {p.type?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider bg-[var(--surface-hover)] border border-[var(--surface-border)] text-[var(--muted)]">
                    {p.scope}
                  </span>
                  {p.code && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Ticket className="w-2.5 h-2.5" />
                      {p.code}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm leading-snug">{p.title}</h3>
                <p className="text-[10px] text-[var(--muted)] font-mono">
                  {p.start_date ? new Date(p.start_date).toLocaleDateString() : ""} – {p.end_date ? new Date(p.end_date).toLocaleDateString() : ""}
                </p>
                {p.description && (
                  <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-2">{p.description}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-1 pt-2 border-t border-[var(--surface-border)]">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-border)] transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => openDuplicate(p)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-border)] transition-all text-amber-400"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              key="del-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              key="del-dialog"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl border border-[var(--surface-border)] shadow-2xl p-6 flex flex-col gap-4"
              style={{ background: "var(--surface)" }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="font-bold">Delete Promotion?</p>
                  <p className="text-sm text-[var(--muted)] mt-1">
                    &ldquo;<span className="font-semibold text-[var(--foreground)]">{deleteTarget.title}</span>&rdquo; will be permanently removed.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--surface-border)] text-sm font-semibold hover:bg-[var(--surface-hover)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {deleting ? "Deleting…" : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
