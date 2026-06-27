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

export default function MyRestaurant() {
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [masterCategories, setMasterCategories] = React.useState<MasterCategory[]>([])
  const [branchCategories, setBranchCategories] = React.useState<Category[]>([])
  const [masterMenuItems, setMasterMenuItems] = React.useState<MasterMenuItem[]>([])
  const [branchMenuItems, setBranchMenuItems] = React.useState<MenuItem[]>([])

  const [loading, setLoading] = React.useState(true)
  const [tables, setTables] = React.useState<RestaurantTable[]>([])
  const [activeTab, setActiveTab] = React.useState<"branches" | "categories" | "menu" | "tables">("branches")

  // Restaurant Profile Edit Modal State
  const [showRestForm, setShowRestForm] = React.useState(false)
  const [restForm, setRestForm] = React.useState({ name: "", logo_url: "", banner_url: "" })
  const [restSubmitting, setRestSubmitting] = React.useState(false)
  const [restError, setRestError] = React.useState("")
  const [logoUploading, setLogoUploading] = React.useState(false)
  const [bannerUploading, setBannerUploading] = React.useState(false)

  // Branch CRUD Modal State
  const [showBranchModal, setShowBranchModal] = React.useState(false)
  const [editBranchTarget, setEditBranchTarget] = React.useState<Branch | null>(null)
  const [branchForm, setBranchForm] = React.useState<BranchFormData>(emptyBranchForm)
  const [branchSubmitting, setBranchSubmitting] = React.useState(false)
  const [branchError, setBranchError] = React.useState("")
  const [deletingBranchId, setDeletingBranchId] = React.useState<string | null>(null)

  // Categories CRUD Modal State
  const [showCatModal, setShowCatModal] = React.useState(false)
  const [editCatTarget, setEditCatTarget] = React.useState<any | null>(null)
  const [catForm, setCatForm] = React.useState({ name: "", isMaster: true, branchId: "", parentId: "" })
  const [catSubmitting, setCatSubmitting] = React.useState(false)
  const [catError, setCatError] = React.useState("")
  const [deletingCatId, setDeletingCatId] = React.useState<string | null>(null)

  // Menu CRUD Modal State
  const [showMenuModal, setShowMenuModal] = React.useState(false)
  const [editMenuTarget, setEditMenuTarget] = React.useState<any | null>(null)
  const [menuForm, setMenuForm] = React.useState({
    displayName: "",
    description: "",
    price: "",
    isMaster: true,
    branchId: "",
    categoryId: "",
    availability: true,
    imageUrl: ""
  })
  const [menuImageUploading, setMenuImageUploading] = React.useState(false)
  const [menuSubmitting, setMenuSubmitting] = React.useState(false)
  const [menuError, setMenuError] = React.useState("")
  const [deletingMenuId, setDeletingMenuId] = React.useState<string | null>(null)

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

  // Categories Handlers
  const openCatCreate = () => {
    setEditCatTarget(null)
    setCatForm({ name: "", isMaster: true, branchId: branches[0]?.id ?? "", parentId: "" })
    setCatError("")
    setShowCatModal(true)
  }

  const openCatEdit = (cat: any, isMaster: boolean) => {
    setEditCatTarget(cat)
    setCatForm({
      name: cat.name,
      isMaster,
      branchId: isMaster ? "" : cat.branch_id,
      parentId: cat.parent_id ?? ""
    })
    setCatError("")
    setShowCatModal(true)
  }

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catForm.name.trim()) { setCatError("Category name is required."); return }
    if (!catForm.isMaster && !catForm.branchId) { setCatError("Branch is required for branch-specific category."); return }
    if (!restaurant) { setCatError("Restaurant brand required."); return }

    setCatSubmitting(true)
    setCatError("")
    try {
      const isEdit = !!editCatTarget
      const payload = isEdit
        ? { name: catForm.name.trim(), parent_id: catForm.parentId || null }
        : {
          name: catForm.name.trim(),
          parent_id: catForm.parentId || null,
          restaurant_id: restaurant.id,
          branch_id: catForm.isMaster ? null : catForm.branchId,
          is_master: catForm.isMaster
        }

      const res = await fetch(isEdit ? `/api/restaurant/categories/${editCatTarget!.id}` : "/api/restaurant/categories", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setCatError(data.error ?? "Something went wrong"); return }

      // Reload all category datasets to reflect synchronization
      const [masterCatRes, branchCatRes] = await Promise.all([
        fetch("/api/restaurant/categories?is_master=true"),
        fetch("/api/restaurant/categories"),
      ])
      setMasterCategories(await masterCatRes.json())
      setBranchCategories(await branchCatRes.json())
      setShowCatModal(false)
    } catch {
      setCatError("Network error submitting category.")
    } finally {
      setCatSubmitting(false)
    }
  }

  const handleCatDelete = async (id: string) => {
    if (!confirm("Are you sure? Deleting a master category will also delete its broadcasted category versions across all branches!")) return
    setDeletingCatId(id)
    try {
      const res = await fetch(`/api/restaurant/categories/${id}`, { method: "DELETE" })
      if (res.ok) {
        setMasterCategories(prev => prev.filter(c => c.id !== id))
        setBranchCategories(prev => prev.filter(c => c.id !== id))
      }
    } finally {
      setDeletingCatId(null)
    }
  }

  // Menu Handlers
  const handleMenuImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMenuImageUploading(true)
    const formData = new FormData()
    formData.append("image", file)
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok && data.success) setMenuForm(f => ({ ...f, imageUrl: data.data.url }))
      else setMenuError(data.error || "Failed to upload image")
    } catch { setMenuError("Network error uploading image") }
    finally { setMenuImageUploading(false) }
  }

  const openMenuCreate = () => {
    setEditMenuTarget(null)
    setMenuForm({
      displayName: "",
      description: "",
      price: "",
      isMaster: true,
      branchId: branches[0]?.id ?? "",
      categoryId: "",
      availability: true,
      imageUrl: ""
    })
    setMenuError("")
    setShowMenuModal(true)
  }

  const openMenuEdit = (item: any, isMaster: boolean) => {
    setEditMenuTarget(item)
    setMenuForm({
      displayName: item.display_name,
      description: item.description ?? "",
      price: String(item.price),
      isMaster,
      branchId: isMaster ? "" : item.branch_id,
      categoryId: isMaster ? (item.master_category_id ?? "") : (item.category_id ?? ""),
      availability: item.availability,
      imageUrl: item.image_url ?? ""
    })
    setMenuError("")
    setShowMenuModal(true)
  }

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!menuForm.displayName.trim()) { setMenuError("Display name is required."); return }
    if (!menuForm.price.trim()) { setMenuError("Price is required."); return }
    if (!menuForm.isMaster && !menuForm.branchId) { setMenuError("Branch is required for branch-specific menu item."); return }
    if (!restaurant) { setMenuError("Restaurant brand required."); return }

    setMenuSubmitting(true)
    setMenuError("")
    try {
      const isEdit = !!editMenuTarget
      const payload = isEdit
        ? {
          display_name: menuForm.displayName.trim(),
          description: menuForm.description.trim() || null,
          price: parseFloat(menuForm.price),
          category_id: menuForm.categoryId || null,
          availability: menuForm.availability,
          image_url: menuForm.imageUrl || null
        }
        : {
          restaurant_id: restaurant.id,
          branch_id: menuForm.isMaster ? null : menuForm.branchId,
          display_name: menuForm.displayName.trim(),
          description: menuForm.description.trim() || null,
          price: parseFloat(menuForm.price),
          category_id: menuForm.categoryId || null,
          availability: menuForm.availability,
          image_url: menuForm.imageUrl || null,
          is_master: menuForm.isMaster
        }

      const res = await fetch(isEdit ? `/api/restaurant/menu/${editMenuTarget!.id}` : "/api/restaurant/menu", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setMenuError(data.error ?? "Something went wrong"); return }

      // Reload menu datasets
      const [masterMenuRes, branchMenuRes] = await Promise.all([
        fetch("/api/restaurant/menu?is_master=true"),
        fetch("/api/restaurant/menu"),
      ])
      setMasterMenuItems(await masterMenuRes.json())
      setBranchMenuItems(await branchMenuRes.json())
      setShowMenuModal(false)
    } catch {
      setMenuError("Network error submitting menu item.")
    } finally {
      setMenuSubmitting(false)
    }
  }

  const handleMenuDelete = async (id: string) => {
    if (!confirm("Are you sure? Deleting a master menu item will delete its copies from all branches!")) return
    setDeletingMenuId(id)
    try {
      const res = await fetch(`/api/restaurant/menu/${id}`, { method: "DELETE" })
      if (res.ok) {
        setMasterMenuItems(prev => prev.filter(m => m.id !== id))
        setBranchMenuItems(prev => prev.filter(m => m.id !== id))
      }
    } finally {
      setDeletingMenuId(null)
    }
  }

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
            className="relative h-32 bg-gradient-to-br from-[var(--color-primary-600)]/20 to-purple-600/10"
            style={restaurant.banner_url ? {
              backgroundImage: `url(${restaurant.banner_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : {}}
          >
            <div className="absolute inset-0 bg-black/20" />
            <button
              onClick={openRestEdit}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-black/60 text-[var(--foreground)] text-xs font-semibold rounded-lg hover:bg-white dark:hover:bg-black/80 transition-colors shadow"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Brand Profile
            </button>
          </div>

          {/* Identity row */}
          <div className="p-5">
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

      {/* Tabs Selector */}
      {restaurant && (
        <div className="flex border-b border-[var(--surface-border)] gap-6">
          <button
            onClick={() => setActiveTab("branches")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === "branches"
              ? "border-[var(--color-primary-600)] text-[var(--color-primary-600)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
          >
            <GitBranch className="w-4.5 h-4.5" /> Branches
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === "categories"
              ? "border-[var(--color-primary-600)] text-[var(--color-primary-600)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
          >
            <Tag className="w-4.5 h-4.5" /> Categories
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === "menu"
              ? "border-[var(--color-primary-600)] text-[var(--color-primary-600)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
          >
            <UtensilsCrossed className="w-4.5 h-4.5" /> Menu Catalog
          </button>
          <button
            onClick={() => setActiveTab("tables")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === "tables"
              ? "border-[var(--color-primary-600)] text-[var(--color-primary-600)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
          >
            <Table2 className="w-4.5 h-4.5" /> Tables
          </button>
        </div>
      )}

      {/* Tab Contents: Branches */}
      {restaurant && activeTab === "branches" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Manage Restaurant Branch Locations</h3>
            <button
              onClick={openBranchCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-600)] text-black text-sm font-semibold rounded-xl hover:bg-[var(--color-primary-500)] transition-colors shadow-sm"
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
                        <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-600)]/10 flex items-center justify-center shrink-0">
                          <GitBranch className="w-4.5 h-4.5 text-[var(--color-primary-600)]" />
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

      {/* Tab Contents: Categories */}
      {restaurant && activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Manage Broadcasted Master Categories & Branch Categories</h3>
            <button
              onClick={openCatCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-600)] text-black text-sm font-semibold rounded-xl hover:bg-[var(--color-primary-500)] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Master Categories Section */}
            <div className="border border-[var(--surface-border)] rounded-xl p-5 bg-[var(--surface)] space-y-3">
              <h4 className="font-black text-sm text-[var(--color-primary-600)] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4.5 h-4.5" /> Broadcasted Master Categories
              </h4>
              {masterCategories.length === 0 ? (
                <p className="text-xs text-[var(--muted)] italic">No master categories registered. Master categories are broadcasted to all branches.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {masterCategories.map(cat => (
                    <div key={cat.id} className="p-3 border border-[var(--surface-border)] rounded-lg flex items-center justify-between bg-[var(--surface-hover)]">
                      <span className="font-bold text-sm">{cat.name}</span>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openCatEdit(cat, true)} className="p-1 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)]"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleCatDelete(cat.id)} className="p-1 rounded text-[var(--muted)] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Branch Specific Categories Section */}
            <div className="border border-[var(--surface-border)] rounded-xl p-5 bg-[var(--surface)] space-y-3">
              <h4 className="font-black text-sm text-[var(--muted)] uppercase tracking-wider flex items-center gap-2">
                <GitBranch className="w-4.5 h-4.5" /> Branch Specific Categories
              </h4>
              {branchCategories.filter(c => !c.master_category_id).length === 0 ? (
                <p className="text-xs text-[var(--muted)] italic">No branch-specific categories registered. You can add them under specific branches.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {branchCategories.filter(c => !c.master_category_id).map(cat => (
                    <div key={cat.id} className="p-3 border border-[var(--surface-border)] rounded-lg flex flex-col justify-between bg-[var(--surface-hover)]">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm">{cat.name}</span>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => openCatEdit(cat, false)} className="p-1 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)]"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleCatDelete(cat.id)} className="p-1 rounded text-[var(--muted)] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-[var(--muted)] font-bold px-1.5 py-0.5 rounded self-start mt-2">
                        {cat.branch?.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Contents: Menu Catalog */}
      {restaurant && activeTab === "menu" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Manage Broadcasted Master Menu & Branch Menus</h3>
            <button
              onClick={openMenuCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-600)] text-black text-sm font-semibold rounded-xl hover:bg-[var(--color-primary-500)] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Menu Item
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Master Menu Items */}
            <div className="border border-[var(--surface-border)] rounded-xl p-5 bg-[var(--surface)] space-y-3">
              <h4 className="font-black text-sm text-[var(--color-primary-600)] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4.5 h-4.5" /> Broadcasted Master Menu Items
              </h4>
              {masterMenuItems.length === 0 ? (
                <p className="text-xs text-[var(--muted)] italic">No master menu items registered. Master menu items are cloned automatically to all branches.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {masterMenuItems.map(item => (
                    <div key={item.id} className="border border-[var(--surface-border)] rounded-xl p-4 flex gap-3 bg-[var(--surface-hover)]">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.display_name} className="w-16 h-16 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-[var(--color-primary-600)]/10 flex items-center justify-center shrink-0"><UtensilsCrossed className="w-6 h-6 text-[var(--color-primary-600)]" /></div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-sm truncate">{item.display_name}</p>
                          <p className="text-xs text-[var(--muted)] line-clamp-1">{item.description}</p>
                          <p className="text-xs font-black mt-1 font-mono">${Number(item.price).toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--surface-border)]/60">
                          <span className="text-[10px] text-[var(--color-primary-600)] font-bold bg-[var(--color-primary-600)]/5 px-2 py-0.5 rounded">Master Category</span>
                          <div className="flex gap-1">
                            <button onClick={() => openMenuEdit(item, true)} className="p-1 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)]"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleMenuDelete(item.id)} className="p-1 rounded text-[var(--muted)] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Branch Specific Menu Items */}
            <div className="border border-[var(--surface-border)] rounded-xl p-5 bg-[var(--surface)] space-y-3">
              <h4 className="font-black text-sm text-[var(--muted)] uppercase tracking-wider flex items-center gap-2">
                <GitBranch className="w-4.5 h-4.5" /> Branch Specific Menu Items
              </h4>
              {branchMenuItems.filter(i => !i.master_menu_item_id).length === 0 ? (
                <p className="text-xs text-[var(--muted)] italic">No branch-specific menu items registered.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branchMenuItems.filter(i => !i.master_menu_item_id).map(item => (
                    <div key={item.id} className="border border-[var(--surface-border)] rounded-xl p-4 flex gap-3 bg-[var(--surface-hover)]">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.display_name} className="w-16 h-16 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-[var(--color-primary-600)]/10 flex items-center justify-center shrink-0"><UtensilsCrossed className="w-6 h-6 text-[var(--color-primary-600)]" /></div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-sm truncate">{item.display_name}</p>
                          <p className="text-xs text-[var(--muted)] line-clamp-1">{item.description}</p>
                          <p className="text-xs font-black mt-1 font-mono">${Number(item.price).toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--surface-border)]/60">
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-[var(--muted)] font-bold px-1.5 py-0.5 rounded">{item.branch?.name}</span>
                          <div className="flex gap-1">
                            <button onClick={() => openMenuEdit(item, false)} className="p-1 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)]"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleMenuDelete(item.id)} className="p-1 rounded text-[var(--muted)] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Contents: Tables */}
      {restaurant && activeTab === "tables" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg font-black tracking-tight text-[var(--foreground)]">Manage Restaurant Tables</h3>
            <button
              onClick={openTableCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-600)] text-black text-sm font-semibold rounded-xl hover:bg-[var(--color-primary-500)] transition-colors shadow-sm"
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
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-600)]/10 flex items-center justify-center shrink-0">
                          <Table2 className="w-5.5 h-5.5 text-[var(--color-primary-600)]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-base tracking-tight truncate text-[var(--foreground)]">{table.table_number}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--color-primary-600)]/10 text-[var(--color-primary-600)] inline-block mt-0.5">
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
      )}

      {/* ─── Setup / Edit Restaurant Modal ─── */}
      {showRestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRestForm(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Store className="w-5 h-5 text-[var(--color-primary-600)]" />
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
                <button type="button" onClick={() => setShowRestForm(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={restSubmitting} className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] text-black rounded-lg text-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add / Edit Branch Modal ─── */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBranchModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-[var(--color-primary-600)]" />
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
                <button type="button" onClick={() => setShowBranchModal(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={branchSubmitting} className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] text-white rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add / Edit Category Modal ─── */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCatModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Tag className="w-5 h-5 text-[var(--color-primary-600)]" />
                {editCatTarget ? "Edit Category" : "Add Category"}
              </h2>
              <button onClick={() => setShowCatModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCatSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Category Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={catForm.name}
                  onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm"
                  autoFocus
                />
              </div>

              {!editCatTarget && (
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="isMasterCat"
                    checked={catForm.isMaster}
                    onChange={e => setCatForm(f => ({ ...f, isMaster: e.target.checked }))}
                    className="w-4 h-4 rounded text-[var(--color-primary-600)]"
                  />
                  <label htmlFor="isMasterCat" className="text-sm font-semibold cursor-pointer select-none">
                    Broadcast as Master Category to all branches
                  </label>
                </div>
              )}

              {!catForm.isMaster && !editCatTarget && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Target Branch <span className="text-red-500">*</span></label>
                  <select
                    value={catForm.branchId}
                    onChange={e => setCatForm(f => ({ ...f, branchId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {catError && <p className="text-sm text-red-500">{catError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCatModal(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={catSubmitting} className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] text-white rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add / Edit Menu Item Modal ─── */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMenuModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[var(--color-primary-600)]" />
                {editMenuTarget ? "Edit Menu Item" : "Add Menu Item"}
              </h2>
              <button onClick={() => setShowMenuModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMenuSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Item Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={menuForm.displayName}
                  onChange={e => setMenuForm(f => ({ ...f, displayName: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                  value={menuForm.description}
                  onChange={e => setMenuForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Price ($) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={menuForm.price}
                    onChange={e => setMenuForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Availability</label>
                  <select
                    value={String(menuForm.availability)}
                    onChange={e => setMenuForm(f => ({ ...f, availability: e.target.value === "true" }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none"
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              </div>

              {!editMenuTarget && (
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="isMasterMenu"
                    checked={menuForm.isMaster}
                    onChange={e => setMenuForm(f => ({ ...f, isMaster: e.target.checked }))}
                    className="w-4 h-4 rounded text-[var(--color-primary-600)]"
                  />
                  <label htmlFor="isMasterMenu" className="text-sm font-semibold cursor-pointer select-none">
                    Broadcast as Master Menu Item to all branches
                  </label>
                </div>
              )}

              {!menuForm.isMaster && !editMenuTarget && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Target Branch <span className="text-red-500">*</span></label>
                  <select
                    value={menuForm.branchId}
                    onChange={e => setMenuForm(f => ({ ...f, branchId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">Category Association</label>
                <select
                  value={menuForm.categoryId}
                  onChange={e => setMenuForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none"
                >
                  <option value="">No Category</option>
                  {menuForm.isMaster ? (
                    masterCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (Master)</option>
                    ))
                  ) : (
                    branchCategories
                      .filter(c => c.branch_id === menuForm.branchId)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Product Image</label>
                <div className="flex items-center gap-3">
                  {menuForm.imageUrl && <img src={menuForm.imageUrl} alt="preview" className="w-14 h-14 object-cover rounded-lg border" />}
                  <label className="flex-1 cursor-pointer">
                    <div className="w-full px-3 py-2 border border-dashed rounded-lg text-sm text-center">
                      {menuImageUploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Upload Image"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleMenuImageUpload} disabled={menuImageUploading} />
                  </label>
                </div>
              </div>

              {menuError && <p className="text-sm text-red-500">{menuError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowMenuModal(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={menuSubmitting} className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] text-white rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  )
}
