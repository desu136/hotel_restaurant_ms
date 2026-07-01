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


export default function BranchesPage() {

    const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
    const [branches, setBranches] = React.useState<Branch[]>([])

    const [loading, setLoading] = React.useState(true)
    const [tables, setTables] = React.useState<RestaurantTable[]>([])
    const [activeTab, setActiveTab] = React.useState("branches")


    // Branch CRUD Modal State
    const [showBranchModal, setShowBranchModal] = React.useState(false)
    const [editBranchTarget, setEditBranchTarget] = React.useState<Branch | null>(null)
    const [branchForm, setBranchForm] = React.useState<BranchFormData>(emptyBranchForm)
    const [branchSubmitting, setBranchSubmitting] = React.useState(false)
    const [branchError, setBranchError] = React.useState("")
    const [deletingBranchId, setDeletingBranchId] = React.useState<string | null>(null)
    const [tableForm, setTableForm] = React.useState({
        tableNumber: "",
        capacity: "4",
        branchScope: "single" as "single" | "multiple" | "all",
        branchId: "",
        selectedBranchIds: [] as string[]
    })
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

    // Branch CRUD Handlers
    const openBranchCreate = () => {
        setEditBranchTarget(null)
        setBranchForm(emptyBranchForm)
        setBranchError("")
        setShowBranchModal(true)
    }

    const openBranchEdit = (branch: Branch) => {
        setEditBranchTarget(branch)
        setBranchForm({ name: branch.name, address: branch.address ?? "", phone: branch.phone ?? "" })
        setBranchError("")
        setShowBranchModal(true)
    }

    const handleBranchSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!branchForm.name.trim()) { setBranchError("Branch name is required."); return }
        if (!restaurant) { setBranchError("Root Restaurant Profile is required before adding branches."); return }

        setBranchSubmitting(true)
        setBranchError("")
        try {
            const isEdit = !!editBranchTarget
            const payload = isEdit
                ? { name: branchForm.name.trim(), address: branchForm.address.trim() || null, phone: branchForm.phone.trim() || null }
                : { restaurant_id: restaurant.id, name: branchForm.name.trim(), address: branchForm.address.trim() || null, phone: branchForm.phone.trim() || null }

            const res = await fetch(isEdit ? `/api/branches/${editBranchTarget!.id}` : "/api/branches", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) { setBranchError(data.error ?? "Something went wrong"); return }

            if (isEdit) {
                setBranches(prev => prev.map(b => b.id === data.id ? { ...b, ...data } : b))
            } else {
                setBranches(prev => [...prev, data])
            }
            setShowBranchModal(false)
        } catch {
            setBranchError("Network error. Please try again.")
        } finally {
            setBranchSubmitting(false)
        }
    }

    const handleBranchDelete = async (id: string) => {
        if (!confirm("Delete this branch? All associated staff assignments and local configurations will be affected. This action cannot be undone.")) return
        setDeletingBranchId(id)
        try {
            const res = await fetch(`/api/branches/${id}`, { method: "DELETE" })
            if (res.ok) {
                setBranches(prev => prev.filter(b => b.id !== id))
            } else {
                const errData = await res.json()
                alert(errData.error || "Failed to delete branch")
            }
        } catch {
            alert("Network error deleting branch")
        } finally {
            setDeletingBranchId(null)
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
            {/* Tab Contents: Branches */}
            {restaurant && activeTab === "branches" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">Manage Restaurant Branch Locations</h3>
                        <button
                            onClick={openBranchCreate}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-600)] text-[var(--background)]  text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Add Branch
                        </button>
                    </div>

                    {branches.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-[var(--surface-border)] py-12 bg-[var(--surface)] text-center">
                            <GitBranch className="w-12 h-12 mx-auto text-[var(--muted)] mb-3 opacity-30" />
                            <h4 className="font-bold mb-1">No Branch Outlets Registered</h4>
                            <p className="text-xs text-[var(--muted)] max-w-sm mx-auto mb-4">
                                Add physical branch outlets to broadcast master categories and menu items.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {branches.map(branch => (
                                <div
                                    key={branch.id}
                                    className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 flex flex-col justify-between hover:border-[var(--color-primary-500)]/40 hover:shadow-sm transition-all"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                                                    <GitBranch className="w-4.5 h-4.5 " />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm truncate">{branch.name}</p>
                                                    <p className="text-[10px] text-[var(--muted)] font-mono">ID: {branch.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openBranchEdit(branch)}
                                                    className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--color-primary-600)] hover:bg-[var(--color-primary-600)]/5 transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleBranchDelete(branch.id)}
                                                    disabled={deletingBranchId === branch.id}
                                                    className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/5 transition-colors disabled:opacity-40"
                                                >
                                                    {deletingBranchId === branch.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 text-xs text-[var(--muted)] pt-1 border-t border-[var(--surface-border)]/60">
                                            <div className="flex items-start gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-[var(--muted)] shrink-0 mt-0.5" />
                                                <span className="truncate">{branch.address || "No address added"}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                                                <span>{branch.phone || "No phone added"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-[var(--surface-border)]/60">
                                        <div className="text-center rounded-lg bg-[var(--surface-hover)] py-2 px-1">
                                            <p className="text-base font-black">{branch._count?.categories ?? 0}</p>
                                            <p className="text-[8px] text-[var(--muted)] uppercase font-semibold">Categories</p>
                                        </div>
                                        <div className="text-center rounded-lg bg-[var(--surface-hover)] py-2 px-1">
                                            <p className="text-base font-black">{branch._count?.menuItems ?? 0}</p>
                                            <p className="text-[8px] text-[var(--muted)] uppercase font-semibold">Menu Items</p>
                                        </div>
                                        <div className="text-center rounded-lg bg-[var(--surface-hover)] py-2 px-1">
                                            <p className="text-base font-black">{branch._count?.restaurantTables ?? 0}</p>
                                            <p className="text-[8px] text-[var(--muted)] uppercase font-semibold">Tables</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {/* ─── Add / Edit Branch Modal ─── */}
            {showBranchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBranchModal(false)} />
                    <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <GitBranch className="w-5 h-5" />
                                {editBranchTarget ? "Edit Branch" : "Add Branch"}
                            </h2>
                            <button onClick={() => setShowBranchModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleBranchSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Branch Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={branchForm.name}
                                    onChange={e => setBranchForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Address</label>
                                <input
                                    type="text"
                                    value={branchForm.address}
                                    onChange={e => setBranchForm(f => ({ ...f, address: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                                <input
                                    type="tel"
                                    value={branchForm.phone}
                                    onChange={e => setBranchForm(f => ({ ...f, phone: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm"
                                />
                            </div>

                            {branchError && <p className="text-sm text-red-500">{branchError}</p>}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowBranchModal(false)} className="flex-1 hover:bg-[var(--surface-hover)] hover:cursor-pointer px-4 py-2.5 border rounded-lg text-sm">Cancel</button>
                                <button type="submit" disabled={branchSubmitting} className="flex-1 px-4 py-2.5 hover:bg-[var(--color-primary-500)] hover:cursor-pointer bg-[var(--color-primary-600)] text-white rounded-lg text-sm">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
