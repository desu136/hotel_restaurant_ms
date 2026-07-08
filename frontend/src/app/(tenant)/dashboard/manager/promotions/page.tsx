"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  X,
  Tag,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Ticket,
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

type FormState = {
  title: string
  description: string
  terms_conditions: string
  code: string
  discount_value: string
  banner_url: string
  type: string
  scope: string
  status: string
  start_date: string
  end_date: string
  restaurant_id: string
  category_id: string
  menu_item_id: string
  is_active: boolean
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  terms_conditions: "",
  code: "",
  discount_value: "",
  banner_url: "",
  type: "PERCENTAGE_DISCOUNT",
  scope: "RESTAURANT",
  status: "ACTIVE",
  start_date: new Date().toISOString().slice(0, 16),
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  restaurant_id: "",
  category_id: "",
  menu_item_id: "",
  is_active: true,
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = React.useState<Promotion[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Panel state
  const [panelOpen, setPanelOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Promotion | null>(null)
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

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

  const [categories, setCategories] = React.useState<any[]>([])
  const [menuItems, setMenuItems] = React.useState<any[]>([])
  const [restaurants, setRestaurants] = React.useState<any[]>([])

  const fetchDependencies = async () => {
    try {
      const [catRes, menuRes, restRes] = await Promise.all([
        fetch("/api/restaurant/categories"),
        fetch("/api/restaurant/menu"),
        fetch("/api/restaurant/list")
      ])
      if (catRes.ok) setCategories(await catRes.json())
      if (menuRes.ok) setMenuItems(await menuRes.json())
      if (restRes.ok) setRestaurants(await restRes.json())
    } catch (e) {
      console.error("Failed to load dependencies", e)
    }
  }

  React.useEffect(() => { 
    fetchPromotions()
    fetchDependencies()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setPanelOpen(true)
  }

  const openEdit = (p: Promotion) => {
    setEditing(p)
    setForm({
      title: p.title,
      description: p.description ?? "",
      terms_conditions: p.terms_conditions ?? "",
      code: p.code ?? "",
      discount_value: p.discount_value ?? "",
      banner_url: p.banner_url ?? "",
      type: p.type || "PERCENTAGE_DISCOUNT",
      scope: p.scope || "RESTAURANT",
      status: p.status || "ACTIVE",
      start_date: p.start_date ? new Date(p.start_date).toISOString().slice(0, 16) : EMPTY_FORM.start_date,
      end_date: p.end_date ? new Date(p.end_date).toISOString().slice(0, 16) : EMPTY_FORM.end_date,
      restaurant_id: p.restaurant_id ?? "",
      category_id: p.category_id ?? "",
      menu_item_id: p.menu_item_id ?? "",
      is_active: p.is_active,
    })
    setFormError(null)
    setPanelOpen(true)
  }

  const closePanel = () => {
    setPanelOpen(false)
    setEditing(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setFormError("Promotion title is required.")
      return
    }
    if (new Date(form.start_date) > new Date(form.end_date)) {
      setFormError("Start date cannot be after end date.")
      return
    }

    setSaving(true)
    setFormError(null)

    const body = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      terms_conditions: form.terms_conditions.trim() || null,
      code: form.code.trim() || null,
      discount_value: form.discount_value.trim() || null,
      banner_url: form.banner_url.trim() || null,
      type: form.type,
      scope: form.scope,
      status: form.status,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      restaurant_id: form.restaurant_id || null,
      category_id: form.category_id || null,
      menu_item_id: form.menu_item_id || null,
      is_active: form.is_active,
    }

    try {
      const url = editing ? `/api/promotions/${editing.id}` : "/api/promotions"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? "Failed to save promotion")
      }
      showToast(editing ? "Promotion updated!" : "Promotion created!")
      closePanel()
      fetchPromotions()
    } catch (err: any) {
      setFormError(err.message ?? "An error occurred")
    } finally {
      setSaving(false)
    }
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

  const field = (
    label: string,
    key: keyof FormState,
    opts?: { placeholder?: string; textarea?: boolean; icon?: React.ReactNode }
  ) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{label}</label>
      {opts?.textarea ? (
        <textarea
          rows={3}
          placeholder={opts.placeholder}
          value={form[key] as string}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="rounded-xl px-4 py-2.5 text-sm bg-[var(--surface-hover)] border border-[var(--surface-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]/40 resize-none transition-all"
        />
      ) : (
        <div className="relative flex items-center">
          {opts?.icon && (
            <span className="absolute left-3 text-[var(--muted)]">{opts.icon}</span>
          )}
          <input
            type="text"
            placeholder={opts?.placeholder}
            value={form[key] as string}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className={`w-full rounded-xl py-2.5 text-sm bg-[var(--surface-hover)] border border-[var(--surface-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]/40 transition-all ${opts?.icon ? "pl-9 pr-4" : "px-4"}`}
          />
        </div>
      )}
    </div>
  )

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
            Create and manage exclusive offers shown to customers on the mini-app home screen.
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
              Create your first promotion — customers will see it on their home screen.
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
                {/* Status badge */}
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
                    Target: {p.scope}
                  </span>
                  {p.code && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Ticket className="w-2.5 h-2.5" />
                      {p.code}
                    </span>
                  )}
                  {p.discount_value && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider bg-[var(--color-primary-600)]/15 text-[var(--color-primary-600)] border border-[var(--color-primary-600)]/20">
                      {p.discount_value}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm leading-snug">{p.title}</h3>
                <p className="text-[10px] text-[var(--muted)] font-mono">
                  {p.start_date ? new Date(p.start_date).toLocaleDateString() : ""} - {p.end_date ? new Date(p.end_date).toLocaleDateString() : ""}
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
                    onClick={() => setDeleteTarget(p)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Side Panel (Create / Edit) ── */}
      <AnimatePresence>
        {panelOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={closePanel}
            />

            {/* Panel */}
            <motion.aside
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col border-l border-[var(--surface-border)] shadow-2xl"
              style={{ background: "var(--surface)" }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--surface-border)]">
                <h2 className="font-bold text-lg">
                  {editing ? "Edit Promotion" : "New Promotion"}
                </h2>
                <button
                  onClick={closePanel}
                  className="p-2 rounded-full hover:bg-[var(--surface-hover)] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Panel body (scrollable) */}
              <form
                id="promo-form"
                onSubmit={handleSave}
                className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5"
              >
                {formError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                {field("Title *", "title", { placeholder: "e.g. 50% Off Your First Order!" })}
                {field("Description", "description", { placeholder: "Short description shown on the offer card...", textarea: true })}

                <div className="grid grid-cols-2 gap-4">
                  {field("Promo Code", "code", {
                    placeholder: "WELCOME50",
                    icon: <Ticket className="w-3.5 h-3.5" />,
                  })}
                  {field("Discount Value", "discount_value", {
                    placeholder: "50% Off",
                    icon: <Tag className="w-3.5 h-3.5" />,
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Start Date</label>
                    <input type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full rounded-xl py-2.5 px-4 text-sm bg-[var(--surface-hover)] border border-[var(--surface-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]/40 transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">End Date</label>
                    <input type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="w-full rounded-xl py-2.5 px-4 text-sm bg-[var(--surface-hover)] border border-[var(--surface-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]/40 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full rounded-xl py-2.5 px-4 text-sm bg-[var(--surface-hover)] border border-[var(--surface-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]/40 transition-all">
                      <option value="PERCENTAGE_DISCOUNT">Percentage Discount</option>
                      <option value="FIXED_DISCOUNT">Fixed Discount</option>
                      <option value="BOGO">Buy One Get One</option>
                      <option value="COMBO_OFFER">Combo Offer</option>
                      <option value="FEATURED_ITEM">Featured Item</option>
                      <option value="SEASONAL_OFFER">Seasonal Offer</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full rounded-xl py-2.5 px-4 text-sm bg-[var(--surface-hover)] border border-[var(--surface-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]/40 transition-all">
                      <option value="DRAFT">Draft</option>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="ACTIVE">Active</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Scope</label>
                  <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value, category_id: "", menu_item_id: "" }))} className="w-full rounded-xl py-2.5 px-4 text-sm bg-[var(--surface-hover)] border border-[var(--surface-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]/40 transition-all">
                    <option value="RESTAURANT">Entire Restaurant</option>
                    <option value="CATEGORY">Specific Category</option>
                    <option value="MENU_ITEM">Specific Menu Item</option>
                  </select>
                </div>

                {form.scope === "CATEGORY" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Target Category</label>
                    <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="w-full rounded-xl py-2.5 px-4 text-sm bg-[var(--surface-hover)] border border-[var(--surface-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]/40 transition-all">
                      <option value="">Select a category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                {form.scope === "MENU_ITEM" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Target Menu Item</label>
                    <select value={form.menu_item_id} onChange={e => setForm(f => ({ ...f, menu_item_id: e.target.value }))} className="w-full rounded-xl py-2.5 px-4 text-sm bg-[var(--surface-hover)] border border-[var(--surface-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]/40 transition-all">
                      <option value="">Select a menu item</option>
                      {menuItems.map(m => <option key={m.id} value={m.id}>{m.display_name}</option>)}
                    </select>
                  </div>
                )}

                {field("Terms & Conditions", "terms_conditions", { placeholder: "Rules, limitations, etc...", textarea: true })}

                {field("Banner Image URL", "banner_url", {
                  placeholder: "https://...",
                  icon: <ImageIcon className="w-3.5 h-3.5" />,
                })}

                {/* Preview */}
                {form.banner_url && (
                  <div className="rounded-xl overflow-hidden border border-[var(--surface-border)] h-32">
                    <img
                      src={form.banner_url}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = "" }}
                    />
                  </div>
                )}

                {/* Active toggle */}
                <div className="flex items-center justify-between rounded-xl border border-[var(--surface-border)] bg-[var(--surface-hover)] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Active</p>
                    <p className="text-xs text-[var(--muted)]">Visible to customers on the home screen</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    className="transition-all"
                  >
                    {form.is_active
                      ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                      : <ToggleLeft className="w-8 h-8 text-[var(--muted)]" />
                    }
                  </button>
                </div>
              </form>

              {/* Panel footer */}
              <div className="px-6 py-4 border-t border-[var(--surface-border)] flex gap-3">
                <button
                  type="button"
                  onClick={closePanel}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--surface-border)] text-sm font-semibold hover:bg-[var(--surface-hover)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="promo-form"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--btn-fg)] text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Saving…" : editing ? "Save Changes" : "Create Promotion"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Dialog ── */}
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
                    "<span className="font-semibold text-[var(--foreground)]">{deleteTarget.title}</span>" will be permanently removed.
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
