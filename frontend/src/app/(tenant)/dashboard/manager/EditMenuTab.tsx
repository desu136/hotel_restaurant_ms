"use client"

import * as React from "react"
import { Plus, Loader2, Layers, GitBranch } from "lucide-react"
import { MenuItemCard } from "./menu/components/MenuItemCard"
import { MenuFilterBar } from "./menu/components/MenuFilterBar"
import { MenuItemModal } from "./menu/components/MenuItemModal"

interface Restaurant { id: string; name: string }
interface Branch { id: string; name: string }
interface MasterCategory { id: string; name: string }
interface Category { id: string; name: string; branch_id: string; branch: { id: string; name: string } }
interface MasterMenuItem { id: string; display_name: string; description?: string | null; price: string | number; master_category_id?: string | null; availability: boolean; prep_time?: number; customizations?: any; image_url?: string | null; image_urls?: string[] | null }
interface MenuItem { id: string; display_name: string; description?: string | null; price: string | number; category_id?: string | null; master_menu_item_id?: string | null; availability: boolean; prep_time?: number; customizations?: any; image_url?: string | null; image_urls?: string[] | null; branch_id: string }

export function EditMenuTab() {
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [masterCategories, setMasterCategories] = React.useState<MasterCategory[]>([])
  const [branchCategories, setBranchCategories] = React.useState<Category[]>([])
  const [masterMenuItems, setMasterMenuItems] = React.useState<MasterMenuItem[]>([])
  const [branchMenuItems, setBranchMenuItems] = React.useState<MenuItem[]>([])
  const [currentUser, setCurrentUser] = React.useState<{ branch_id?: string | null } | null>(null)
  const isBranchManager = !!(currentUser?.branch_id)
  const [loading, setLoading] = React.useState(true)

  const [showMenuModal, setShowMenuModal] = React.useState(false)
  const [editMenuTarget, setEditMenuTarget] = React.useState<any | null>(null)
  const [menuForm, setMenuForm] = React.useState({ displayName: "", description: "", price: "", prepTime: "", isMaster: true, branchId: "", categoryId: "", availability: true, imageUrl: "", imageUrls: [] as string[] })
  const [menuImageUploading, setMenuImageUploading] = React.useState(false); const [customizations, setCustomizations] = React.useState<any[]>([])
  const [menuSubmitting, setMenuSubmitting] = React.useState(false); const [menuError, setMenuError] = React.useState("")
  const [deletingMenuId, setDeletingMenuId] = React.useState<string | null>(null); const [togglingId, setTogglingId] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState(""); const [filterBranchId, setFilterBranchId] = React.useState(""); const [filterCategoryId, setFilterCategoryId] = React.useState("")
  const [filterMinPrice, setFilterMinPrice] = React.useState(""); const [filterMaxPrice, setFilterMaxPrice] = React.useState(""); const [filterAvailability, setFilterAvailability] = React.useState("all"); const [sortBy, setSortBy] = React.useState("name-asc")

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [myRes, meRes, branchRes, masterCatRes, branchCatRes, masterMenuRes, branchMenuRes] = await Promise.all([
        fetch("/api/restaurant/my"), fetch("/api/auth/me"), fetch("/api/branches"),
        fetch("/api/restaurant/categories?is_master=true"), fetch("/api/restaurant/categories"),
        fetch("/api/restaurant/menu?is_master=true"), fetch("/api/restaurant/menu")
      ])
      const user = meRes.ok ? (await meRes.json())?.user ?? null : null
      setRestaurant(myRes.ok ? await myRes.json() : null); setCurrentUser(user); setBranches(branchRes.ok ? await branchRes.json() : [])
      setMasterCategories(masterCatRes.ok ? await masterCatRes.json() : []); setBranchCategories(branchCatRes.ok ? await branchCatRes.json() : [])
      setMasterMenuItems(masterMenuRes.ok ? await masterMenuRes.json() : []); setBranchMenuItems(branchMenuRes.ok ? await branchMenuRes.json() : [])
    } finally { setLoading(false) }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const reloadMenu = async () => {
    const [masterMenuRes, branchMenuRes] = await Promise.all([fetch("/api/restaurant/menu?is_master=true"), fetch("/api/restaurant/menu")])
    setMasterMenuItems(masterMenuRes.ok ? await masterMenuRes.json() : [])
    setBranchMenuItems(branchMenuRes.ok ? await branchMenuRes.json() : [])
  }

  const categoryOptions = React.useMemo(() => [
    ...masterCategories.map(c => ({ id: c.id, name: `${c.name} (Master)` })),
    ...branchCategories.map(c => ({ id: c.id, name: `${c.name} (${c.branch?.name ?? "Branch"})` }))
  ], [masterCategories, branchCategories])

  const openMenuCreate = () => {
    setEditMenuTarget(null); setCustomizations([])
    setMenuForm({ displayName: "", description: "", price: "", prepTime: "", isMaster: !isBranchManager, branchId: currentUser?.branch_id ?? branches[0]?.id ?? "", categoryId: "", availability: true, imageUrl: "", imageUrls: [] })
    setMenuError(""); setShowMenuModal(true)
  }

  const openMenuEdit = (item: any, isMaster: boolean) => {
    setEditMenuTarget(item); setCustomizations(Array.isArray(item.customizations) ? item.customizations : [])
    setMenuForm({ displayName: item.display_name, description: item.description ?? "", price: String(item.price), prepTime: item.prep_time ? String(item.prep_time) : "", isMaster, branchId: isMaster ? "" : item.branch_id, categoryId: isMaster ? (item.master_category_id ?? "") : (item.category_id ?? ""), availability: item.availability ?? true, imageUrl: item.image_url ?? "", imageUrls: item.image_urls ?? [] })
    setMenuError(""); setShowMenuModal(true)
  }

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!menuForm.displayName.trim() || !menuForm.price || !restaurant) { setMenuError("Required fields missing"); return }
    setMenuSubmitting(true); setMenuError("")
    try {
      const isEdit = !!editMenuTarget
      const payload: any = {
        display_name: menuForm.displayName.trim(), description: menuForm.description.trim() || null, price: parseFloat(menuForm.price) || 0,
        prep_time: menuForm.prepTime ? parseInt(menuForm.prepTime) : null, availability: menuForm.availability, customizations,
        image_url: menuForm.imageUrl || null, image_urls: menuForm.imageUrls.length > 0 ? menuForm.imageUrls : null
      }
      if (!isEdit) {
        payload.restaurant_id = restaurant.id; payload.is_master = menuForm.isMaster; payload.branch_id = menuForm.isMaster ? null : menuForm.branchId
        if (menuForm.isMaster) payload.master_category_id = menuForm.categoryId || null
        else payload.category_id = menuForm.categoryId || null
      } else {
        if (editMenuTarget.master_category_id !== undefined) payload.master_category_id = menuForm.categoryId || null
        else payload.category_id = menuForm.categoryId || null
      }
      const res = await fetch(isEdit ? `/api/restaurant/menu/${editMenuTarget!.id}` : "/api/restaurant/menu", {
        method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      })
      if (!res.ok) { setMenuError((await res.json()).error ?? "Error"); return }
      await reloadMenu(); setShowMenuModal(false)
    } finally { setMenuSubmitting(false) }
  }

  const handleMenuDelete = async (id: string) => {
    if (!confirm("Delete menu item?")) return
    setDeletingMenuId(id)
    try {
      const res = await fetch(`/api/restaurant/menu/${id}`, { method: "DELETE" })
      if (res.ok) await reloadMenu()
    } finally { setDeletingMenuId(null) }
  }

  const handleToggleAvailability = async (item: any) => {
    setTogglingId(item.id)
    try {
      const res = await fetch(`/api/restaurant/menu/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ availability: !item.availability }) })
      if (res.ok) await reloadMenu()
    } finally { setTogglingId(null) }
  }

  const handleSingleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMenuImageUploading(true)
    const fd = new FormData(); fd.append("image", file)
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok && data.success) setMenuForm(f => ({ ...f, imageUrl: data.data.url }))
    } finally { setMenuImageUploading(false) }
  }

  const filterItem = (item: any) => {
    if (searchQuery.trim() && !item.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) && !item.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    const p = Number(item.price) || 0
    if (filterMinPrice && p < Number(filterMinPrice)) return false
    if (filterMaxPrice && p > Number(filterMaxPrice)) return false
    if (filterAvailability === "available" && !item.availability) return false
    if (filterAvailability === "unavailable" && item.availability) return false
    return true
  }

  const filteredMaster = masterMenuItems.filter(filterItem)
  const filteredBranch = branchMenuItems.filter(i => (!filterBranchId || i.branch_id === filterBranchId) && filterItem(i))

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" /></div>

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Manage Restaurant Menu</h3>
          <button onClick={openMenuCreate} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-600)] text-[var(--background)] text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] shadow-sm">
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
        </div>

        <MenuFilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} filterBranchId={filterBranchId} setFilterBranchId={setFilterBranchId}
          filterCategoryId={filterCategoryId} setFilterCategoryId={setFilterCategoryId} filterMinPrice={filterMinPrice} setFilterMinPrice={setFilterMinPrice}
          filterMaxPrice={filterMaxPrice} setFilterMaxPrice={setFilterMaxPrice} filterAvailability={filterAvailability} setFilterAvailability={setFilterAvailability}
          sortBy={sortBy} setSortBy={setSortBy} branches={branches} categoryOptions={categoryOptions} isBranchManager={isBranchManager} />

        <div className="space-y-6">
          {!filterBranchId && (
            <div className="border border-[var(--surface-border)] rounded-xl p-5 bg-[var(--surface)] space-y-3">
              <h4 className="font-black text-sm text-[var(--color-primary-600)] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" /> Master Menu Items ({filteredMaster.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMaster.map(item => (
                  <MenuItemCard key={item.id} item={item} isMaster={true} onEdit={openMenuEdit} onDelete={handleMenuDelete} deletingId={deletingMenuId} onToggleAvailability={handleToggleAvailability} togglingId={togglingId} />
                ))}
              </div>
            </div>
          )}

          <div className="border border-[var(--surface-border)] rounded-xl p-5 bg-[var(--surface)] space-y-3">
            <h4 className="font-black text-sm text-[var(--muted)] uppercase tracking-wider flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> Branch Menu Items ({filteredBranch.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBranch.map(item => (
                <MenuItemCard key={item.id} item={item} isMaster={false} onEdit={openMenuEdit} onDelete={handleMenuDelete} deletingId={deletingMenuId} onToggleAvailability={handleToggleAvailability} togglingId={togglingId} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <MenuItemModal show={showMenuModal} editTarget={editMenuTarget} isBranchManager={isBranchManager} form={menuForm} setForm={setMenuForm}
        customizations={customizations} setCustomizations={setCustomizations} branches={branches} masterCategories={masterCategories} branchCategories={branchCategories}
        submitting={menuSubmitting} error={menuError} onClose={() => setShowMenuModal(false)} onSubmit={handleMenuSubmit} onSingleImageUpload={handleSingleImageUpload} imageUploading={menuImageUploading} />
    </>
  )
}
