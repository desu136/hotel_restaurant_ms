// [ignoring loop detection]
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

export default function MyRestaurant() {
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [branches, setBranches] = React.useState<Branch[]>([])

  const [loading, setLoading] = React.useState(true)
  const [tables, setTables] = React.useState<RestaurantTable[]>([])
  const [activeTab, setActiveTab] = React.useState("branches")

  // Restaurant Profile Edit Modal State
  const [showRestForm, setShowRestForm] = React.useState(false)
  const [restForm, setRestForm] = React.useState({ name: "", logo_url: "", banner_url: "" })
  const [restSubmitting, setRestSubmitting] = React.useState(false)
  const [restError, setRestError] = React.useState("")
  const [logoUploading, setLogoUploading] = React.useState(false)
  const [bannerUploading, setBannerUploading] = React.useState(false)

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

      // if (myData) {
      //   const [branchRes, masterCatRes, branchCatRes, masterMenuRes, branchMenuRes, tablesRes] = await Promise.all([
      //     fetch("/api/branches"),
      //     fetch("/api/restaurant/categories?is_master=true"),
      //     fetch("/api/restaurant/categories"),
      //     fetch("/api/restaurant/menu?is_master=true"),
      //     fetch("/api/restaurant/menu"),
      //     fetch(`/api/restaurant/tables?restaurant_id=${myData.id}`)
      //   ])

      //   const branchData = branchRes.ok ? await branchRes.json() : []
      //   const tablesData = tablesRes.ok ? await tablesRes.json() : []

      //   setBranches(branchData)
      //   setTables(tablesData)

      //   // Initialize default branch in form
      //   if (branchData.length > 0) {
      //     setTableForm(prev => ({
      //       ...prev,
      //       branchId: branchData[0].id,
      //       selectedBranchIds: [branchData[0].id]
      //     }))
      //   }
      // }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  // Restaurant Handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    const formData = new FormData()
    formData.append("image", file)
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok && data.success) setRestForm(f => ({ ...f, logo_url: data.data.url }))
      else setRestError(data.error || "Failed to upload logo")
    } catch { setRestError("Network error uploading logo") }
    finally { setLogoUploading(false) }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerUploading(true)
    const formData = new FormData()
    formData.append("image", file)
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok && data.success) setRestForm(f => ({ ...f, banner_url: data.data.url }))
      else setRestError(data.error || "Failed to upload banner")
    } catch { setRestError("Network error uploading banner") }
    finally { setBannerUploading(false) }
  }

  const openRestEdit = () => {
    setRestForm({
      name: restaurant?.name ?? "",
      logo_url: restaurant?.logo_url ?? "",
      banner_url: restaurant?.banner_url ?? "",
    })
    setRestError("")
    setShowRestForm(true)
  }

  const handleRestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restForm.name.trim()) { setRestError("Restaurant name is required."); return }
    setRestSubmitting(true)
    setRestError("")
    try {
      const res = await fetch("/api/restaurant/my", {
        method: restaurant ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: restForm.name.trim(),
          logo_url: restForm.logo_url || null,
          banner_url: restForm.banner_url || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setRestError(data.error ?? "Something went wrong"); return }
      setRestaurant(data)
      setShowRestForm(false)
    } catch { setRestError("Network error. Please try again.") }
    finally { setRestSubmitting(false) }
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
    <div className="space-y-8">
      {/* ─── Restaurant Profile Card ─── */}
      {restaurant ? (
        <div className="rounded-xl border border-[var(--surface-border)] overflow-hidden shadow-sm bg-[var(--surface)]">
          {/* Banner */}
          <div
            className="relative h-64 bg-gradient-to-br from-[var(--color-primary-600)]/20 to-purple-600/10"
            style={restaurant.banner_url ? {
              backgroundImage: `url(${restaurant.banner_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : {}}
          >

          </div>
          {/* </div> */}

          {/* Identity row */}
          <div className="p-5 flex flex-row justify-between">
            <div className="flex items-end gap-4 mb-2">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt="logo"
                  className="w-16 h-16 rounded-xl object-cover border-2 border-[var(--surface)] shadow-md shrink-0 -mt-12 z-10"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[var(--color-primary-600)]/10 border-2 border-[var(--surface)] shadow-md flex items-center justify-center shrink-0 -mt-12 z-10">
                  <Store className="w-8 h-8 text-[var(--color-primary-600)]" />
                </div>
              )}
              <div className="pb-1">
                <h2 className="text-2xl font-black tracking-tight">{restaurant.name}</h2>
                <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] mt-0.5">
                  <Calendar className="w-3 h-3" />
                  Brand Brand Registered {fmt(restaurant.created_at)}
                </div>
              </div>
            </div>
            <button
              onClick={openRestEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-[var(--surface-hover)] shadow"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Brand Profile
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[var(--surface-border)] py-16 bg-[var(--surface)] flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-600)]/10 flex items-center justify-center">
            <Utensils className="w-8 h-8 text-[var(--color-primary-600)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">Register Your Restaurant</h2>
            <p className="text-sm text-[var(--muted)] max-w-sm">
              Set up your restaurant brand once. Then add branches under it to start managing menus, categories, and tables.
            </p>
          </div>
          <button
            onClick={() => {
              setRestForm({ name: "", logo_url: "", banner_url: "" })
              setRestError("")
              setShowRestForm(true)
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary-600)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-500)] transition-colors shadow-lg"
          >
            <Store className="w-4 h-4" /> Set Up Restaurant
          </button>
        </div>
      )}
      {/* ─── Setup / Edit Restaurant Modal ─── */}
      {showRestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRestForm(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Store className="w-5 h-5 text-[var(--foreground)]" />
                {restaurant ? "Edit Restaurant Profile" : "Set Up Your Restaurant"}
              </h2>
              <button onClick={() => setShowRestForm(false)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Restaurant Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={restForm.name}
                  onChange={e => setRestForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Logo</label>
                <div className="flex items-center gap-3">
                  {restForm.logo_url && <img src={restForm.logo_url} alt="logo" className="w-14 h-14 object-cover rounded-lg border" />}
                  <label className="flex-1 cursor-pointer">
                    <div className="w-full px-3 py-2 border border-dashed rounded-lg text-sm text-center">
                      {logoUploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Upload Logo"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Banner Image</label>
                <div className="space-y-2">
                  {restForm.banner_url && <img src={restForm.banner_url} alt="banner" className="w-full h-20 object-cover rounded-lg border" />}
                  <label className="cursor-pointer block">
                    <div className="w-full px-3 py-2 border border-dashed rounded-lg text-sm text-center">
                      {bannerUploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Upload Banner"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={bannerUploading} />
                  </label>
                </div>
              </div>

              {restError && <p className="text-sm text-red-500">{restError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRestForm(false)} className="flex-1 px-4 py-2.5 border hover:bg-[var(--surface-hover)] hover:cursor-pointer rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={restSubmitting} className="flex-1 px-4 py-2.5  hover:cursor-pointer hover:bg-[var(--surface-hover)] border rounded-lg text-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
