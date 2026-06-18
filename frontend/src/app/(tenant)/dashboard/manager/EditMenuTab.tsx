"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, Pencil, Trash2, Loader2, Sparkles, Check, X, Sliders, ToggleLeft, ToggleRight, Trash
} from "lucide-react"

interface Category {
  id: string
  name: string
}

interface Restaurant {
  id: string
  name: string
}

interface Customization {
  key: string
  label: string
  multiple: boolean
  values: string[]
}

interface MenuItem {
  id: string
  display_name: string
  description?: string | null
  price: string | number
  category_id?: string | null
  availability: boolean
  customizations?: Customization[] | null
  image_url?: string | null
  category?: { id: string; name: string } | null
}

export function EditMenuTab() {
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([])
  const [selectedRestaurantId, setSelectedRestaurantId] = React.useState<string>("")
  const [categories, setCategories] = React.useState<Category[]>([])
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([])
  const [loading, setLoading] = React.useState(true)

  // Modals / forms states
  const [showItemModal, setShowItemModal] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null)
  
  const [form, setForm] = React.useState({
    displayName: "",
    description: "",
    price: "",
    categoryId: "",
    availability: true,
    imageUrl: ""
  })
  
  const [imageUploading, setImageUploading] = React.useState(false)
  const [customizations, setCustomizations] = React.useState<Customization[]>([])
  const [formError, setFormError] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  // Fetch initial data
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)
      const restRes = await fetch("/api/restaurant/list")
      const restData = restRes.ok ? await restRes.json() : []
      setRestaurants(restData)

      if (restData.length > 0) {
        const rId = restData[0].id
        setSelectedRestaurantId(rId)
        await fetchRestaurantMenuAndCats(rId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const fetchRestaurantMenuAndCats = async (rId: string) => {
    try {
      const [catRes, menuRes] = await Promise.all([
        fetch(`/api/restaurant/categories?restaurant_id=${rId}`),
        fetch(`/api/restaurant/menu?restaurant_id=${rId}`)
      ])
      const cats = catRes.ok ? await catRes.json() : []
      const menu = menuRes.ok ? await menuRes.json() : []
      setCategories(cats)
      setMenuItems(menu)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRestaurantChange = async (rId: string) => {
    setSelectedRestaurantId(rId)
    if (rId) {
      await fetchRestaurantMenuAndCats(rId)
    } else {
      setCategories([])
      setMenuItems([])
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    const formData = new FormData()
    formData.append("image", file)
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok && data.success) {
        setForm(prev => ({ ...prev, imageUrl: data.data.url }))
      } else {
        setFormError(data.error || "Failed to upload image")
      }
    } catch {
      setFormError("Network error during image upload")
    } finally {
      setImageUploading(false)
    }
  }

  const openAddModal = () => {
    setEditingItem(null)
    setForm({
      displayName: "",
      description: "",
      price: "",
      categoryId: categories[0]?.id || "",
      availability: true,
      imageUrl: ""
    })
    setCustomizations([])
    setFormError("")
    setShowItemModal(true)
  }

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item)
    setForm({
      displayName: item.display_name,
      description: item.description || "",
      price: item.price.toString(),
      categoryId: item.category_id || "",
      availability: item.availability,
      imageUrl: item.image_url || ""
    })
    setCustomizations(item.customizations ? JSON.parse(JSON.stringify(item.customizations)) : [])
    setFormError("")
    setShowItemModal(true)
  }

  // Customization builder actions
  const addCustomizationGroup = () => {
    setCustomizations(prev => [
      ...prev,
      { key: "", label: "", multiple: false, values: [""] }
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
        return { ...c, values: [...c.values, ""] }
      }
      return c
    }))
  }

  const updateCustomizationValue = (groupIndex: number, valIndex: number, text: string) => {
    setCustomizations(prev => prev.map((c, i) => {
      if (i === groupIndex) {
        const newVals = [...c.values]
        newVals[valIndex] = text
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

  // Submit Menu Item Add/Update
  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.displayName.trim() || !form.price || !form.categoryId) {
      setFormError("Display name, price, and category are required")
      return
    }

    // Validate customizations
    for (const cust of customizations) {
      if (!cust.key.trim() || !cust.label.trim()) {
        setFormError("All customizable groups must have a key and label")
        return
      }
      const filledVals = cust.values.filter(v => v.trim() !== "")
      if (filledVals.length === 0) {
        setFormError(`Customizable group "${cust.label}" must have at least one choice value`)
        return
      }
    }

    setSubmitting(true)
    setFormError("")

    // Prepare payload
    const formattedCustomizations = customizations.map(c => ({
      key: c.key.trim().toLowerCase().replace(/\s+/g, "_"),
      label: c.label.trim(),
      multiple: c.multiple,
      values: c.values.filter(v => v.trim() !== "").map(v => v.trim())
    }))

    const payload = {
      restaurant_id: selectedRestaurantId,
      display_name: form.displayName.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      category_id: form.categoryId,
      availability: form.availability,
      customizations: formattedCustomizations.length > 0 ? formattedCustomizations : null,
      image_url: form.imageUrl || null
    }

    try {
      const isEdit = !!editingItem
      const res = await fetch(
        isEdit ? `/api/restaurant/menu/${editingItem.id}` : "/api/restaurant/menu",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      )
      
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error ?? "Failed to save menu item")
        return
      }

      if (isEdit) {
        setMenuItems(prev => prev.map(item => item.id === data.id ? data : item))
      } else {
        setMenuItems(prev => [...prev, data])
      }
      setShowItemModal(false)
    } catch (err) {
      setFormError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return
    try {
      const res = await fetch(`/api/restaurant/menu/${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        setMenuItems(prev => prev.filter(item => item.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
        <p className="text-sm text-[var(--muted)]">Loading menu catalog...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-hover)]/30 p-4 rounded-xl border border-[var(--surface-border)]">
        {restaurants.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-[var(--muted)]">Active Restaurant:</label>
            <select
              value={selectedRestaurantId}
              onChange={e => handleRestaurantChange(e.target.value)}
              className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <Button
          onClick={openAddModal}
          disabled={categories.length === 0}
          className="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white shadow-lg shadow-[var(--color-primary-500)]/10"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Menu Item
        </Button>
      </div>

      {categories.length === 0 && (
        <div className="py-12 text-center text-[var(--muted)] text-sm border-2 border-dashed rounded-xl">
          ⚠️ Please create at least one category under the "Category" tab before adding menu items.
        </div>
      )}

      {/* Menu Catalog Grouped by Category */}
      {categories.map(cat => {
        const items = menuItems.filter(item => item.category_id === cat.id)
        return (
          <div key={cat.id} className="space-y-3">
            <h3 className="text-md font-bold text-[var(--muted)] uppercase tracking-wider pl-2 border-l-2 border-[var(--color-primary-500)]">
              {cat.name} ({items.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => (
                <Card key={item.id} className="glass hover:border-[var(--color-primary-500)]/30 transition-all group">
                  <CardContent className="p-5 flex items-start gap-4">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.display_name} className="w-16 h-16 rounded-lg object-cover border border-[var(--surface-border)] shrink-0" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base">{item.display_name}</h4>
                        <span className="font-black text-sm text-[var(--color-primary-600)]">
                          ${parseFloat(item.price.toString()).toFixed(2)}
                        </span>
                      </div>
                      
                      {item.description && (
                        <p className="text-xs text-[var(--muted)] line-clamp-2">{item.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          item.availability 
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" 
                            : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                        }`}>
                          {item.availability ? "In Stock" : "Out of Stock"}
                        </span>

                        {item.customizations && item.customizations.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full font-bold flex items-center gap-1">
                            <Sliders className="w-2.5 h-2.5" />
                            {item.customizations.length} Customizable(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(item)}
                        className="w-8 h-8 p-0 text-[var(--muted)] hover:text-[var(--foreground)]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-8 h-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {items.length === 0 && (
                <div className="col-span-full py-8 text-center text-[var(--muted)] text-xs border border-dashed rounded-xl bg-[var(--surface)]/20">
                  No items in this category.
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add/Edit Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowItemModal(false)} />
          <div className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--surface)] flex items-center justify-between p-6 pb-4 border-b border-[var(--surface-border)] z-10">
              <h3 className="text-lg font-bold">{editingItem ? "Edit Menu Item" : "Add Menu Item"}</h3>
              <button 
                onClick={() => setShowItemModal(false)} 
                className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitItem} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Display Name *</label>
                  <Input
                    required
                    placeholder="e.g. Macchiato Coffee"
                    value={form.displayName}
                    onChange={e => setForm(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Price ($) *</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    placeholder="e.g. 4.99"
                    value={form.price}
                    onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Item Image</label>
                <div className="flex items-center gap-3">
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="preview" className="w-16 h-16 object-cover rounded-lg border border-[var(--surface-border)] shrink-0" />
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="w-full px-3 py-2 border border-dashed border-[var(--surface-border)] rounded-lg text-xs text-[var(--muted)] hover:border-[var(--color-primary-500)] transition-colors text-center">
                      {imageUploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : (form.imageUrl ? "Click to change image" : "Click to upload item image")}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={imageUploading} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Tell customers about the meal/drink ingredients, origin, etc."
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[var(--surface-hover)]/40 border border-[var(--surface-border)] rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Category *</label>
                  <select
                    value={form.categoryId}
                    onChange={e => setForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full h-10 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, availability: !prev.availability }))}
                    className="flex items-center gap-2 text-sm font-semibold"
                  >
                    {form.availability ? (
                      <ToggleRight className="w-7 h-7 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-[var(--muted)]" />
                    )}
                    Available / In Stock
                  </button>
                </div>
              </div>

              {/* Customizable ingredients (JSON customizations builder) */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-[var(--color-primary-600)]" />
                      Adjustable Ingredients
                    </h4>
                    <p className="text-[10px] text-[var(--muted)]">Let customers adjust ingredients like sugar, salt, milk levels, etc.</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addCustomizationGroup}
                    className="text-xs h-8"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Ingredient Option
                  </Button>
                </div>

                <div className="space-y-4">
                  {customizations.map((cust, gIdx) => (
                    <div 
                      key={gIdx} 
                      className="p-4 rounded-xl border bg-[var(--surface-hover)]/20 border-[var(--surface-border)] space-y-3 relative group"
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
                          <Input
                            placeholder="e.g. sugar, salt"
                            value={cust.key}
                            onChange={e => updateCustomizationGroup(gIdx, { key: e.target.value })}
                            className="h-8 text-xs bg-[var(--surface)]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Display Label</label>
                          <Input
                            placeholder="e.g. Sugar Level, Salt Level"
                            value={cust.label}
                            onChange={e => updateCustomizationGroup(gIdx, { label: e.target.value })}
                            className="h-8 text-xs bg-[var(--surface)]"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                          <input
                            type="checkbox"
                            id={`multi-${gIdx}`}
                            checked={cust.multiple}
                            onChange={e => updateCustomizationGroup(gIdx, { multiple: e.target.checked })}
                            className="rounded border-[var(--surface-border)] text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)]"
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
                            <div key={vIdx} className="flex items-center gap-1 bg-[var(--surface)] border px-2 py-1 rounded-lg">
                              <input
                                placeholder={`State ${vIdx + 1}`}
                                value={val}
                                onChange={e => updateCustomizationValue(gIdx, vIdx, e.target.value)}
                                className="w-24 text-xs bg-transparent focus:outline-none"
                              />
                              {cust.values.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeCustomizationValue(gIdx, vIdx)}
                                  className="text-red-500 hover:text-red-600 text-[10px] font-bold"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => addCustomizationValue(gIdx)}
                            className="text-xs h-7 px-2 hover:bg-[var(--surface)]"
                          >
                            + Add Value
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-2.5 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowItemModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || imageUploading}
                  className="flex-1 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                  {editingItem ? "Save Changes" : "Create Menu Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
