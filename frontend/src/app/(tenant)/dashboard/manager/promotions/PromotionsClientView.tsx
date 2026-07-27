"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Megaphone, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { PromotionCard, Promotion } from "./components/PromotionCard"
import { DeletePromoModal } from "./components/DeletePromoModal"

export default function PromotionsClientView() {
  const router = useRouter()
  const [promotions, setPromotions] = React.useState<Promotion[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Promotion | null>(null)
  const [deleting, setDeleting] = React.useState(false)
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
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${
              toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
            }`}
          >
            {toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

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
          onClick={() => router.push("/dashboard/manager/promotions/create")}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--foreground)] text-[var(--btn-fg)] rounded-xl font-semibold text-sm shadow-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Promotion
        </motion.button>
      </div>

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
            onClick={() => router.push("/dashboard/manager/promotions/create")}
            className="mt-2 flex items-center gap-2 px-4 py-2 bg-[var(--foreground)] text-[var(--btn-fg)] rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Promotion
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {promotions.map((p, i) => (
            <PromotionCard
              key={p.id}
              promotion={p}
              index={i}
              onEdit={(promo) => router.push(`/dashboard/manager/promotions/create?id=${promo.id}`)}
              onDuplicate={(promo) => router.push(`/dashboard/manager/promotions/create?duplicate=${promo.id}`)}
              onDelete={(promo) => setDeleteTarget(promo)}
            />
          ))}
        </div>
      )}

      <DeletePromoModal
        target={deleteTarget}
        deleting={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
