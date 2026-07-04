"use client"

import * as React from "react"
import {
  Store, Pencil, Loader2, Check, X, AlertCircle,
  GitBranch, UtensilsCrossed, Table2, Calendar,
  MapPin, Phone, Plus, Trash2, Utensils, Tag, Layers, Users,
  Sliders, ToggleLeft, ToggleRight, Trash,
  Timer
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
  prep_time?: number
  customizations?: any
  image_url?: string | null
  image_urls?: string[] | null
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
  prep_time?: number
  customizations?: any
  image_url?: string | null
  image_urls?: string[] | null
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

interface CustomizationValue {
  name: string
  extraPrice: number
  image_url?: string | null
  recommended?: boolean
}

interface Customization {
  key: string
  label: string
  multiple: boolean
  values: CustomizationValue[]
}

export function EditMenuTab() {
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [masterCategories, setMasterCategories] = React.useState<MasterCategory[]>([])
  const [branchCategories, setBranchCategories] = React.useState<Category[]>([])
  const [masterMenuItems, setMasterMenuItems] = React.useState<MasterMenuItem[]>([])
  const [branchMenuItems, setBranchMenuItems] = React.useState<MenuItem[]>([])

  const [loading, setLoading] = React.useState(true)
  const [tables, setTables] = React.useState<RestaurantTable[]>([])

  // Menu CRUD Modal State
  const [showMenuModal, setShowMenuModal] = React.useState(false)
  const [editMenuTarget, setEditMenuTarget] = React.useState<any | null>(null)
  const [menuForm, setMenuForm] = React.useState({
    displayName: "",
    description: "",
    price: "",
    prepTime: "",
    isMaster: true,
    branchId: "",
    categoryId: "",
    availability: true,
    imageUrl: "",
    imageUrls: [] as string[]
  })

  const [menuImageUploading, setMenuImageUploading] = React.useState(false)
  const [galleryUploading, setGalleryUploading] = React.useState(false)
  const [choiceUploading, setChoiceUploading] = React.useState<Record<string, boolean>>({})
  const [customizations, setCustomizations] = React.useState<Customization[]>([])

  const [menuSubmitting, setMenuSubmitting] = React.useState(false)
  const [menuError, setMenuError] = React.useState("")
  const [deletingMenuId, setDeletingMenuId] = React.useState<string | null>(null)

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
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

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

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (menuForm.imageUrls.length >= 8) {
      setMenuError("Maximum 8 gallery photos allowed")
      return
    }
    setGalleryUploading(true)
    const formData = new FormData()
    formData.append("image", file)
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok && data.success) {
        setMenuForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, data.data.url] }))
      } else {
        setMenuError(data.error || "Failed to upload gallery photo")
      }
    } catch {
      setMenuError("Network error during gallery upload")
    } finally {
      setGalleryUploading(false)
      e.target.value = ""
    }
  }

  const removeGalleryPhoto = (idx: number) => {
    setMenuForm(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== idx) }))
  }

  const openMenuCreate = () => {
    setEditMenuTarget(null)
    setMenuForm({
      displayName: "",
      description: "",
      price: "",
      prepTime: "",
      isMaster: true,
      branchId: branches[0]?.id ?? "",
      categoryId: "",
      availability: true,
      imageUrl: "",
      imageUrls: []
    })
    setCustomizations([])
    setMenuError("")
    setShowMenuModal(true)
  }

  const openMenuEdit = (item: any, isMaster: boolean) => {
    setEditMenuTarget(item)

    // Parse customizations safely
    let initialCustomizations: any[] = []
    if (item.customizations) {
      try {
        initialCustomizations = typeof item.customizations === 'string'
          ? JSON.parse(item.customizations)
          : JSON.parse(JSON.stringify(item.customizations))
      } catch (err) {
        console.error("Failed to parse customizations", err)
      }
    }

    setCustomizations(initialCustomizations)
    setMenuForm({
      displayName: item.display_name,
      description: item.description ?? "",
      price: String(item.price),
      prepTime: item.prep_time ? String(item.prep_time) : "",
      isMaster,
      branchId: isMaster ? "" : item.branch_id,
      categoryId: isMaster ? (item.master_category_id ?? "") : (item.category_id ?? ""),
      availability: item.availability,
      imageUrl: item.image_url ?? "",
      imageUrls: Array.isArray(item.image_urls) ? item.image_urls : []
    })
    setMenuError("")
    setShowMenuModal(true)
  }

  // Customization builder actions
  const addCustomizationGroup = () => {
    setCustomizations(prev => [
      ...prev,
      { key: "", label: "", multiple: false, values: [{ name: "", extraPrice: 0 }] }
    ])
  }

  const removeCustomizationGroup = (index: number) => {
    setCustomizations(prev => prev.filter((_, i) => i !== index))
  }

  const updateCustomizationGroup = (index: number, fields: Partial<Customization>) => {
    setCustomizations(prev => prev.map((c, i) => i === index ? { ...c, ...fields } : c))
  }

  const addCustomizationValue = (index: number) => {
    setCustomizations(prev => prev.map((c, i) => {
      if (i === index) {
        return { ...c, values: [...c.values, { name: "", extraPrice: 0 }] }
      }
      return c
    }))
  }

  const updateCustomizationValue = (groupIndex: number, valIndex: number, fields: Partial<CustomizationValue>) => {
    setCustomizations(prev => prev.map((c, i) => {
      if (i === groupIndex) {
        const newVals = [...c.values]
        newVals[valIndex] = { ...newVals[valIndex], ...fields }
        return { ...c, values: newVals }
      }
      return c
    }))
  }

  const removeCustomizationValue = (groupIndex: number, valIndex: number) => {
    setCustomizations(prev => prev.map((c, i) => {
      if (i === groupIndex) {
        return { ...c, values: c.values.filter((_, vIdx) => vIdx !== valIndex) }
      }
      return c
    }))
  }

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!menuForm.displayName.trim()) { setMenuError("Display name is required."); return }
    if (!menuForm.price.trim()) { setMenuError("Price is required."); return }
    if (!menuForm.isMaster && !menuForm.branchId) { setMenuError("Branch is required for branch-specific menu item."); return }
    if (!restaurant) { setMenuError("Restaurant brand required."); return }

    // Validate customizations
    for (const cust of customizations) {
      if (!cust.key.trim() || !cust.label.trim()) {
        setMenuError("All customizable groups must have a key and label")
        return
      }
      const filledVals = cust.values.filter(v => v.name.trim() !== "")
      if (filledVals.length === 0) {
        setMenuError(`Customizable group "${cust.label}" must have at least one choice value`)
        return
      }
    }

    setMenuSubmitting(true)
    setMenuError("")
    try {
      const isEdit = !!editMenuTarget

      const formattedCustomizations = customizations.map(c => ({
        key: c.key.trim().toLowerCase().replace(/\s+/g, "_"),
        label: c.label.trim(),
        multiple: c.multiple,
        values: c.values.filter(v => v.name.trim() !== "").map(v => ({
          name: v.name.trim(),
          extraPrice: parseFloat(v.extraPrice.toString()) || 0,
          image_url: v.image_url || null,
          recommended: !!v.recommended
        }))
      }))

      const prepTimeParsed = menuForm.prepTime ? parseInt(menuForm.prepTime, 10) || 0 : 0

      const payload = isEdit
        ? {
          display_name: menuForm.displayName.trim(),
          description: menuForm.description.trim() || null,
          price: parseFloat(menuForm.price),
          prep_time: prepTimeParsed,
          category_id: menuForm.categoryId || null,
          availability: menuForm.availability,
          image_url: menuForm.imageUrl || null,
          image_urls: menuForm.imageUrls,
          customizations: formattedCustomizations.length > 0 ? formattedCustomizations : null
        }
        : {
          restaurant_id: restaurant.id,
          branch_id: menuForm.isMaster ? null : menuForm.branchId,
          display_name: menuForm.displayName.trim(),
          description: menuForm.description.trim() || null,
          price: parseFloat(menuForm.price),
          prep_time: prepTimeParsed,
          category_id: menuForm.categoryId || null,
          availability: menuForm.availability,
          image_url: menuForm.imageUrl || null,
          image_urls: menuForm.imageUrls,
          customizations: formattedCustomizations.length > 0 ? formattedCustomizations : null,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Manage Broadcasted Master Menu & Branch Menus</h3>
          <button
            onClick={openMenuCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-600)] text-[var(--background)] text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors shadow-sm"
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
                  <div key={item.id} className="border border-[var(--surface-border)] rounded-xl p-4 flex gap-3 shadow-lg">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.display_name} className="w-16 h-16 object-cover rounded-lg shrink-0 border" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center shrink-0 bg-[var(--surface)]"><UtensilsCrossed className="w-6 h-6 text-[var(--muted)]" /></div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-sm truncate">{item.display_name}</p>
                        <p className="text-xs text-[var(--muted)] line-clamp-1">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-black font-mono">${Number(item.price).toFixed(2)}</p>
                          {(item.prep_time ?? 0) > 0 && (
                            <span className="text-[10px] bg-[var(--foreground)] text-[var(--background)] font-semibold flex flex-row  px-1.5 py-0.5 rounded-full gap-1"><Timer className="" size={12} strokeWidth={3.5} /> {item.prep_time}m</span>
                          )}
                          {Array.isArray(item.image_urls) && item.image_urls.length > 0 && (
                            <span className="text-[10px] text-[var(--muted)]">📷 {item.image_urls.length}</span>
                          )}
                          {Array.isArray(item.customizations) && item.customizations.length > 0 && (
                            <span className="text-[10px] text-[var(--muted)] flex items-center gap-0.5">
                              <Sliders className="w-2.5 h-2.5 inline" /> {item.customizations.length}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--surface-border)]/60">
                        <span className="text-[10px] text-[var(--muted)] font-semibold">Master Item</span>
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
                  <div key={item.id} className="border border-[var(--surface-border)] rounded-xl p-4 flex gap-3 shadow-lg">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.display_name} className="w-16 h-16 object-cover rounded-lg shrink-0 border" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[var(--surface)] flex items-center justify-center shrink-0"><UtensilsCrossed className="w-6 h-6 text-[var(--muted)]" /></div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-sm truncate">{item.display_name}</p>
                        <p className="text-xs text-[var(--muted)] line-clamp-1">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-black font-mono">${Number(item.price).toFixed(2)}</p>
                          {(item.prep_time ?? 0) > 0 && (
                            <span className="text-[10px] bg-[var(--foreground)] text-[var(--background)] font-semibold flex flex-row  px-1.5 py-0.5 rounded-full gap-1"><Timer className="" size={12} strokeWidth={3.5} /> {item.prep_time}m</span>
                          )}
                          {Array.isArray(item.image_urls) && item.image_urls.length > 0 && (
                            <span className="text-[10px] text-[var(--muted)]">📷 {item.image_urls.length}</span>
                          )}
                          {Array.isArray(item.customizations) && item.customizations.length > 0 && (
                            <span className="text-[10px] text-[var(--muted)] flex items-center gap-0.5">
                              <Sliders className="w-2.5 h-2.5 inline" /> {item.customizations.length}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--surface-border)]/60">
                        <span className="text-[10px] text-[var(--foreground)] font-bold px-1.5 py-0.5 rounded bg-[var(--surface-border)]/20">{item.branch?.name}</span>
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

      {/* ─── Add / Edit Menu Item Modal ─── */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMenuModal(false)} />
          <div className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--surface)] flex items-center justify-between p-6 pb-4 border-b border-[var(--surface-border)] z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5" />
                {editMenuTarget ? "Edit Menu Item" : "Add Menu Item"}
              </h2>
              <button onClick={() => setShowMenuModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMenuSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium mb-1.5">Price ($) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={menuForm.price}
                    onChange={e => setMenuForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  ⏱ Prep Time (minutes)
                  <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">How long it takes to prepare this item</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 15"
                  value={menuForm.prepTime}
                  onChange={e => setMenuForm(f => ({ ...f, prepTime: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Availability</label>
                  <select
                    value={String(menuForm.availability)}
                    onChange={e => setMenuForm(f => ({ ...f, availability: e.target.value === "true" }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none"
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>

                {!editMenuTarget && (
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isMasterMenu"
                      checked={menuForm.isMaster}
                      onChange={e => setMenuForm(f => ({ ...f, isMaster: e.target.checked }))}
                      className="w-4 h-4 rounded text-[var(--color-primary-600)]"
                    />
                    <label htmlFor="isMasterMenu" className="text-sm font-semibold cursor-pointer select-none">
                      Broadcast as Master Menu Item
                    </label>
                  </div>
                )}
              </div>

              {!menuForm.isMaster && !editMenuTarget && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Target Branch <span className="text-red-500">*</span></label>
                  <select
                    value={menuForm.branchId}
                    onChange={e => setMenuForm(f => ({ ...f, branchId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none"
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
                  className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none"
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

              {/* Primary Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Primary Image</label>
                <div className="flex items-center gap-3">
                  {menuForm.imageUrl && <img src={menuForm.imageUrl} alt="preview" className="w-14 h-14 object-cover rounded-lg border" />}
                  <label className="flex-1 cursor-pointer">
                    <div className="w-full px-3 py-2 border border-dashed rounded-lg text-sm text-center">
                      {menuImageUploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Upload Primary Image"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleMenuImageUpload} disabled={menuImageUploading} />
                  </label>
                </div>
              </div>

              {/* Gallery Photos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Slideshow Gallery Photos
                    <span className="ml-2 font-normal text-xs text-[var(--muted)]">
                      ({menuForm.imageUrls.length}/8)
                    </span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {menuForm.imageUrls.map((url, idx) => (
                    <div key={idx} className="relative group w-16 h-16 shrink-0">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-[var(--surface-border)]" />
                      <button
                        type="button"
                        onClick={() => removeGalleryPhoto(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {menuForm.imageUrls.length < 8 && (
                    <label className="w-16 h-16 shrink-0 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-[var(--surface-border)] rounded-lg text-[var(--muted)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-500)] transition-colors">
                      {galleryUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          <span className="text-[9px] mt-0.5 font-bold">Photo</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={galleryUploading} />
                    </label>
                  )}
                </div>
              </div>

              {/* Customizable ingredients (JSON customizations builder) */}
              <div className="border-t border-[var(--surface-border)] pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-[var(--color-primary-600)]" />
                      Adjustable Ingredients / Customizations
                    </h4>
                    <p className="text-xs text-[var(--muted)]">Let customers customize levels of ingredients (e.g. sugar, ice, spicy level).</p>
                  </div>
                  <button
                    type="button"
                    onClick={addCustomizationGroup}
                    className="text-xs px-3 py-1.5 border border-[var(--surface-border)] rounded-lg hover:bg-[var(--surface-hover)]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 inline" /> Add Option
                  </button>
                </div>

                <div className="space-y-4">
                  {customizations.map((cust, gIdx) => (
                    <div
                      key={gIdx}
                      className="p-4 rounded-xl border bg-[var(--surface-hover)]/30 border-[var(--surface-border)] space-y-3 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => removeCustomizationGroup(gIdx)}
                        className="absolute right-3 top-3 text-[var(--muted)] hover:text-red-500 transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-6">
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Key (Internal identifier)</label>
                          <input
                            placeholder="e.g. sugar, salt"
                            value={cust.key}
                            onChange={e => updateCustomizationGroup(gIdx, { key: e.target.value })}
                            className="w-full h-8 px-2 text-xs bg-[var(--surface)] border border-[var(--surface-border)] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Display Label</label>
                          <input
                            placeholder="e.g. Sugar Level, Salt Level"
                            value={cust.label}
                            onChange={e => updateCustomizationGroup(gIdx, { label: e.target.value })}
                            className="w-full h-8 px-2 text-xs bg-[var(--surface)] border border-[var(--surface-border)] rounded"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                          <input
                            type="checkbox"
                            id={`multi-${gIdx}`}
                            checked={cust.multiple}
                            onChange={e => updateCustomizationGroup(gIdx, { multiple: e.target.checked })}
                            className="rounded border-[var(--surface-border)] text-[var(--color-primary-600)]"
                          />
                          <label htmlFor={`multi-${gIdx}`} className="text-xs font-semibold text-[var(--muted)] cursor-pointer select-none">
                            Allow Multiple Choices
                          </label>
                        </div>
                      </div>

                      {/* Values/choices inside the group */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Selectable Choices / Values</label>

                        <div className="flex flex-wrap gap-2 items-center">
                          {cust.values.map((val, vIdx) => (
                            <div key={vIdx} className="flex flex-col gap-2 bg-[var(--surface)] border border-[var(--surface-border)] p-2.5 rounded-lg w-full sm:w-auto">
                              <div className="flex items-center gap-1.5">
                                <input
                                  placeholder="Choice Name"
                                  value={val.name || ""}
                                  onChange={e => updateCustomizationValue(gIdx, vIdx, { name: e.target.value })}
                                  className="w-28 text-xs bg-transparent focus:outline-none text-[var(--foreground)] placeholder-gray-500"
                                />
                                <span className="text-[10px] text-[var(--muted)] border-l pl-1 border-[var(--surface-border)]">$</span>
                                <input
                                  placeholder="0.00"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={val.extraPrice || ""}
                                  onChange={e => updateCustomizationValue(gIdx, vIdx, { extraPrice: parseFloat(e.target.value) || 0 })}
                                  className="w-12 text-xs bg-transparent focus:outline-none text-[var(--foreground)] font-bold placeholder-gray-500"
                                />
                                {cust.values.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeCustomizationValue(gIdx, vIdx)}
                                    className="text-red-500 hover:text-red-600 text-[10px] font-bold border-l pl-1 border-[var(--surface-border)]"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center justify-between border-t pt-1.5 border-[var(--surface-border)] gap-3">
                                <div className="flex items-center">
                                  {val.image_url ? (
                                    <div className="relative w-8 h-8 rounded overflow-hidden border border-[var(--surface-border)] shrink-0">
                                      <img src={val.image_url} alt="" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => updateCustomizationValue(gIdx, vIdx, { image_url: null })}
                                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : choiceUploading[`${gIdx}-${vIdx}`] ? (
                                    <div className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                                      <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                                      <span>Uploading...</span>
                                    </div>
                                  ) : (
                                    <label className="text-[10px] text-[var(--muted)] hover:underline cursor-pointer font-bold flex items-center gap-1">
                                      <Plus className="w-3 h-3" /> Add Image
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0]
                                          if (!file) return
                                          const uploadKey = `${gIdx}-${vIdx}`
                                          setChoiceUploading(prev => ({ ...prev, [uploadKey]: true }))
                                          const formData = new FormData()
                                          formData.append("image", file)
                                          try {
                                            const res = await fetch("/api/upload/image", { method: "POST", body: formData })
                                            const data = await res.json()
                                            if (res.ok && data.success) {
                                              updateCustomizationValue(gIdx, vIdx, { image_url: data.data.url })
                                            }
                                          } catch (err) {
                                            console.error("Customization image upload error:", err)
                                          } finally {
                                            setChoiceUploading(prev => ({ ...prev, [uploadKey]: false }))
                                          }
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!cust.multiple) {
                                      // clear other recommended options in this group
                                      cust.values.forEach((_, tempIdx) => {
                                        if (tempIdx !== vIdx) {
                                          updateCustomizationValue(gIdx, tempIdx, { recommended: false })
                                        }
                                      })
                                    }
                                    updateCustomizationValue(gIdx, vIdx, { recommended: !val.recommended })
                                  }}
                                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-all ${val.recommended
                                    ? "bg-neutral-200 dark:bg-neutral-800 text-[var(--foreground)] border border-[var(--surface-border)]"
                                    : "bg-transparent border border-[var(--surface-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                                    }`}
                                >
                                  <span>✨</span>
                                  <span>{val.recommended ? "Default" : "Set Default"}</span>
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addCustomizationValue(gIdx)}
                            className="text-xs h-7 px-2 hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded"
                          >
                            + Add Choice
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {menuError && <p className="text-sm text-red-500">{menuError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowMenuModal(false)} className="flex-1 px-4 py-2.5 border hover:bg-[var(--surface-hover)] hover:cursor-pointer rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={menuSubmitting} className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:cursor-pointer hover:bg-[var(--color-primary-500)] text-[var(--btn-fg)] rounded-lg text-sm">
                  {menuSubmitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-1 font-semibold" /> : <Check className="w-4 h-4 mr-1 inline font-semibold" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
