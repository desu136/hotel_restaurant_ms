"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus, Pencil, Trash2, Users2, Shield, Mail, Phone, Loader2, Tag, Coffee,
  ChevronDown, ChevronRight, Folder, FolderOpen
} from "lucide-react"
import { PasswordInput } from "@/components/ui/password-input"

interface Category {
  id: string
  name: string
  restaurant_id: string
  parent_id?: string | null
}

interface Restaurant {
  id: string
  name: string
  branch_id?: string | null
  parent_id?: string | null
}

interface EmployeeRole {
  id: string
  code: string
  name: string
}

interface Employee {
  id: string
  fullName: string
  email: string
  phone?: string | null
  branchId?: string | null
  branchName: string
  status: string
  roles: EmployeeRole[]
}

interface RestaurantTable {
  id: string
  table_number: string
  capacity: number
  waiter_id?: string | null
}

export function CategoryTab({ mode = "both" }: { mode?: "category" | "staff" | "both" }) {
  // Common states
  const [currentUser, setCurrentUser] = React.useState<{ id: string; email: string; roles: string[] } | null>(null)
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([])
  const [selectedRestaurantId, setSelectedRestaurantId] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)

  // Categories states
  const [categories, setCategories] = React.useState<Category[]>([])
  const [newCatName, setNewCatName] = React.useState("")
  const [newCatParentId, setNewCatParentId] = React.useState("")
  const [catError, setCatError] = React.useState("")
  const [catAdding, setCatAdding] = React.useState(false)
  const [editingCatId, setEditingCatId] = React.useState<string | null>(null)
  const [editingCatName, setEditingCatName] = React.useState("")
  const [editingCatParentId, setEditingCatParentId] = React.useState("")

  // Collapsible & inline subcategories states
  const [expandedCategoryIds, setExpandedCategoryIds] = React.useState<Record<string, boolean>>({})
  const [addingSubcatParentId, setAddingSubcatParentId] = React.useState<string | null>(null)
  const [newSubcatName, setNewSubcatName] = React.useState("")
  const [editingSubcatId, setEditingSubcatId] = React.useState<string | null>(null)
  const [editingSubcatName, setEditingSubcatName] = React.useState("")

  // Staff states
  const [tables, setTables] = React.useState<RestaurantTable[]>([])
  const [staff, setStaff] = React.useState<Employee[]>([])
  const [showStaffModal, setShowStaffModal] = React.useState(false)
  const [staffForm, setStaffForm] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "WAITER", // default
    tableIds: [] as string[],
  })
  const [staffError, setStaffError] = React.useState("")
  const [staffSubmitting, setStaffSubmitting] = React.useState(false)

  // Fetch initial data
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)

      // Fetch current user
      const meRes = await fetch("/api/auth/me")
      const meData = meRes.ok ? await meRes.json() : null
      if (meData && meData.success && meData.user) {
        setCurrentUser(meData.user)
      }

      // Fetch restaurants
      const restRes = await fetch("/api/restaurant/list")
      const restData = restRes.ok ? await restRes.json() : []
      setRestaurants(restData)

      let rId = ""
      const firstSelectable = restData.find((r: any) => r.branch_id !== null)
      if (firstSelectable) {
        rId = firstSelectable.id
        setSelectedRestaurantId(rId)
      }

      // Fetch employees
      const empRes = await fetch("/api/employees")
      const empData: Employee[] = empRes.ok ? await empRes.json() : []
      // Filter out HOTEL_OWNER role
      const filteredStaff = empData.filter(
        emp => !emp.roles.some(r => r.code === "HOTEL_OWNER")
      )
      setStaff(filteredStaff)

      // Fetch categories for the selected restaurant
      if (rId) {
        const catRes = await fetch(`/api/restaurant/categories?restaurant_id=${rId}`)
        if (catRes.ok) {
          const catData = await catRes.json()
          console.log("[CategoryTab] Initial categories loaded:", catData.length, catData.map((c: any) => c.name))
          setCategories(catData)
        } else {
          console.error("[CategoryTab] Failed to load categories:", catRes.status, await catRes.text())
        }

        const tableRes = await fetch(`/api/restaurant/tables?restaurant_id=${rId}`)
        if (tableRes.ok) {
          setTables(await tableRes.json())
        }
      }
    } catch (err) {
      console.error("Failed to load category/staff data", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch categories when restaurant selection changes
  const handleRestaurantChange = async (id: string) => {
    setSelectedRestaurantId(id)
    if (!id) {
      setCategories([])
      setTables([])
      return
    }
    try {
      const catRes = await fetch(`/api/restaurant/categories?restaurant_id=${id}`)
      const catData = catRes.ok ? await catRes.json() : []
      setCategories(catData)

      const tableRes = await fetch(`/api/restaurant/tables?restaurant_id=${id}`)
      const tableData = tableRes.ok ? await tableRes.json() : []
      setTables(tableData)
    } catch (err) {
      console.error(err)
    }
  }


  // Fetch categories for the currently selected restaurant
  const fetchCategories = React.useCallback(async (rId: string) => {
    if (!rId) return
    try {
      const catRes = await fetch(`/api/restaurant/categories?restaurant_id=${rId}`)
      const catData = catRes.ok ? await catRes.json() : []
      setCategories(catData)
    } catch (err) {
      console.error("Failed to fetch categories", err)
    }
  }, [])

  // Categories CRUD
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim() || !selectedRestaurantId) return
    setCatError("")
    setCatAdding(true)
    try {
      const res = await fetch("/api/restaurant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), restaurant_id: selectedRestaurantId, parent_id: newCatParentId || null })
      })
      const data = await res.json()
      if (res.ok) {
        setNewCatName("")
        setNewCatParentId("")
        // Re-fetch from server to get consistent data (including _count etc.)
        await fetchCategories(selectedRestaurantId)
      } else {
        setCatError(data.error ?? `Failed to add category (${res.status})`)
      }
    } catch (err) {
      setCatError("Network error — please try again.")
      console.error("Failed to add category", err)
    } finally {
      setCatAdding(false)
    }
  }

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) return
    try {
      const res = await fetch(`/api/restaurant/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingCatName.trim(), parent_id: editingCatParentId || null })
      })
      if (res.ok) {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editingCatName.trim(), parent_id: editingCatParentId || null } : c))
        setEditingCatId(null)
        setEditingCatName("")
        setEditingCatParentId("")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    try {
      const res = await fetch(`/api/restaurant/categories/${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddSubcategory = async (parentId: string, subcatName: string) => {
    if (!subcatName.trim() || !selectedRestaurantId) return
    try {
      const res = await fetch("/api/restaurant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: subcatName.trim(), restaurant_id: selectedRestaurantId, parent_id: parentId })
      })
      if (res.ok) {
        await fetchCategories(selectedRestaurantId)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateSubcategory = async (id: string, newName: string, parentId: string) => {
    if (!newName.trim()) return
    try {
      const res = await fetch(`/api/restaurant/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), parent_id: parentId })
      })
      if (res.ok) {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName.trim() } : c))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Staff CRUD
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffForm.fullName.trim() || !staffForm.email.trim() || !staffForm.password.trim()) {
      setStaffError("Please fill out all required fields")
      return
    }
    setStaffSubmitting(true)
    setStaffError("")

    try {
      // Find branch associated with the current restaurant to assign to the staff
      const selectedRest = restaurants.find(r => r.id === selectedRestaurantId)
      const branchId = selectedRest ? selectedRest.branch_id : null

      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: staffForm.fullName.trim(),
          email: staffForm.email.trim(),
          phone: staffForm.phone.trim() || null,
          password: staffForm.password,
          branchId,
          roles: [staffForm.role],
          tableIds: staffForm.role === "WAITER" ? staffForm.tableIds : []
        })
      })

      const data = await res.json()
      if (!res.ok) {
        setStaffError(data.error ?? "Failed to create staff account")
        return
      }

      setStaff(prev => [...prev, data])
      setShowStaffModal(false)
      setStaffForm({ fullName: "", email: "", phone: "", password: "", role: "WAITER", tableIds: [] })
    } catch (err) {
      setStaffError("Network error. Please try again.")
    } finally {
      setStaffSubmitting(false)
    }
  }

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" })
      if (res.ok) {
        setStaff(prev => prev.filter(s => s.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
        <p className="text-sm text-[var(--muted)]">Loading categories and staff list...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Restaurant Selector */}
      {restaurants.length > 0 && (
        <div className="flex items-center gap-3 bg-[var(--surface-hover)]/30 p-4 rounded-xl border border-[var(--surface-border)]">
          <label className="text-sm font-semibold text-[var(--muted)]">Active Restaurant:</label>
          {currentUser?.roles.includes('HOTEL_OWNER') ? (
            <select
              value={selectedRestaurantId}
              onChange={e => handleRestaurantChange(e.target.value)}
              className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              <option value="">— Select Active Restaurant —</option>
              {(() => {
                const brandParents = restaurants.filter(r => !r.parent_id && !r.branch_id);
                const standalones = restaurants.filter(r => !r.parent_id && r.branch_id);
                return (
                  <>
                    {brandParents.map(brand => {
                      const children = restaurants.filter(r => r.parent_id === brand.id && r.branch_id);
                      if (children.length === 0) return null;
                      return (
                        <optgroup key={brand.id} label={`${brand.name} (Chain)`}>
                          {children.map(child => (
                            <option key={child.id} value={child.id}>
                              {child.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                    {standalones.length > 0 && (
                      <optgroup label="Standalone Outlets">
                        {standalones.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </>
                );
              })()}
            </select>
          ) : (
            <span className="text-sm font-bold text-[var(--foreground)]">
              {restaurants.find(r => r.id === selectedRestaurantId)?.name || 'Loading outlet details...'}
            </span>
          )}
        </div>
      )}

      {/* Grid: Category Left, Staff Right */}
      <div className={mode === "both" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "grid grid-cols-1 gap-6"}>

        {/* Categories Card */}
        {(mode === "both" || mode === "category") && (
          <Card className="glass">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[var(--color-primary-600)]" />
                    Menu Categories
                  </CardTitle>
                  <CardDescription>Create and arrange categories for your restaurant meals.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="flex gap-2 flex-wrap sm:flex-nowrap">
                <Input
                  placeholder="Category name (e.g. Desserts, Drinks)"
                  value={newCatName}
                  onChange={e => { setNewCatName(e.target.value); setCatError("") }}
                  disabled={!selectedRestaurantId || catAdding}
                  className="bg-[var(--surface)] text-sm flex-1"
                />
                {/* <select
                  value={newCatParentId}
                  onChange={e => setNewCatParentId(e.target.value)}
                  disabled={!selectedRestaurantId || catAdding}
                  className="bg-[var(--surface)] border border-[var(--border)] text-sm rounded-md px-3 py-2 text-gray-300 outline-none focus:ring-1 focus:ring-[var(--color-primary-500)] h-10 min-w-[170px]"
                >
                  <option value="">None (Main Category)</option>
                  {categories.filter(c => !c.parent_id).map(mc => (
                    <option key={mc.id} value={mc.id}>Parent: {mc.name}</option>
                  ))}
                </select> */}
                <Button
                  type="submit"
                  disabled={!selectedRestaurantId || !newCatName.trim() || catAdding}
                  className="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white shrink-0 h-10"
                >
                  {catAdding
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Plus className="w-4 h-4 mr-1" /> Add</>
                  }
                </Button>
              </form>

              {/* Error display */}
              {catError && (
                <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 px-3 py-2 rounded-lg">
                  ⚠️ {catError}
                </div>
              )}

              {/* No restaurant warning */}
              {restaurants.length === 0 && (
                <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 px-3 py-2 rounded-lg">
                  ⚠️ No restaurant found for your account. Ask the owner to create a restaurant first.
                </div>
              )}

              {/* Categories List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {categories.filter(c => !c.parent_id).map(mainCat => {
                  const subCategories = categories.filter(c => c.parent_id === mainCat.id)
                  const isExpanded = !!expandedCategoryIds[mainCat.id]

                  return (
                    <div key={mainCat.id} className="space-y-2">
                      {editingCatId === mainCat.id ? (
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-[var(--surface)] border-[var(--color-primary-500)]">
                          <div className="flex-1 flex gap-2 mr-2 flex-wrap items-center">
                            <Input
                              value={editingCatName}
                              onChange={e => setEditingCatName(e.target.value)}
                              className="h-9 text-sm flex-1 min-w-[150px]"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdateCategory(mainCat.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white h-9"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCatId(null)}
                              className="h-9"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-[var(--surface)] hover:border-[var(--color-primary-500)]/40 transition-colors">
                          <div
                            className="flex items-center gap-2 cursor-pointer select-none flex-1 py-1"
                            onClick={() => setExpandedCategoryIds(prev => ({ ...prev, [mainCat.id]: !prev[mainCat.id] }))}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0" />
                            )}
                            {isExpanded ? (
                              <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : (
                              <Folder className="w-4 h-4 text-[var(--muted)] shrink-0" />
                            )}
                            <span className="font-bold text-sm text-[var(--foreground)]">{mainCat.name}</span>
                            <span className="text-[10px] text-amber-500 font-extrabold px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/25">
                              {subCategories.length} {subCategories.length === 1 ? "subcategory" : "subcategories"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Add subcategory button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setExpandedCategoryIds(prev => ({ ...prev, [mainCat.id]: true }))
                                setAddingSubcatParentId(addingSubcatParentId === mainCat.id ? null : mainCat.id)
                                setNewSubcatName("")
                              }}
                              className="h-8 text-xs text-amber-500 hover:bg-amber-500/10 hover:text-amber-500 gap-1 px-2.5 font-bold"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Add Sub</span>
                            </Button>

                            {/* Edit main category */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCatId(mainCat.id)
                                setEditingCatName(mainCat.name)
                                setEditingCatParentId("")
                              }}
                              className="w-8 h-8 p-0 text-[var(--muted)] hover:text-[var(--foreground)]"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>

                            {/* Delete main category */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCategory(mainCat.id)}
                              className="w-8 h-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Expanded Subcategories block */}
                      {isExpanded && (
                        <div className="pl-6 pr-1 py-1 space-y-2 border-l-2 border-amber-500/20 ml-5 mt-1 mb-3">
                          {/* Inline Subcategory adding form */}
                          {addingSubcatParentId === mainCat.id && (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault()
                                handleAddSubcategory(mainCat.id, newSubcatName)
                                setNewSubcatName("")
                                setAddingSubcatParentId(null)
                              }}
                              className="flex gap-2 items-center bg-[var(--surface-hover)]/20 p-2 rounded-lg border border-[var(--surface-border)]"
                            >
                              <Input
                                placeholder="Subcategory name (e.g. Cold Drinks)"
                                value={newSubcatName}
                                onChange={e => setNewSubcatName(e.target.value)}
                                className="h-8 text-xs flex-1 bg-[var(--surface)]"
                                autoFocus
                              />
                              <Button
                                type="submit"
                                size="sm"
                                disabled={!newSubcatName.trim()}
                                className="bg-amber-500 hover:bg-amber-600 text-black text-xs h-8 px-3 font-bold"
                              >
                                Save
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setAddingSubcatParentId(null)}
                                className="text-xs h-8 px-2"
                              >
                                Cancel
                              </Button>
                            </form>
                          )}

                          {/* Existing Subcategories */}
                          {subCategories.map(sub => {
                            const isEditingThisSub = editingSubcatId === sub.id
                            return (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-hover)]/20 border border-[var(--surface-border)] hover:border-[var(--color-primary-500)]/30 transition-colors"
                              >
                                {isEditingThisSub ? (
                                  <div className="flex-1 flex gap-2 items-center">
                                    <Input
                                      value={editingSubcatName}
                                      onChange={e => setEditingSubcatName(e.target.value)}
                                      className="h-8 text-xs flex-1 bg-[var(--surface)]"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        handleUpdateSubcategory(sub.id, editingSubcatName, mainCat.id)
                                        setEditingSubcatId(null)
                                        setEditingSubcatName("")
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingSubcatId(null)}
                                      className="text-xs h-8 px-2"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-xs font-semibold text-[var(--foreground)]">{sub.name}</span>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingSubcatId(sub.id)
                                          setEditingSubcatName(sub.name)
                                        }}
                                        className="w-7 h-7 p-0 text-[var(--muted)] hover:text-[var(--foreground)]"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteCategory(sub.id)}
                                        className="w-7 h-7 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )
                          })}

                          {subCategories.length === 0 && !addingSubcatParentId && (
                            <p className="text-[10px] text-[var(--muted)] italic pl-2 py-1">No subcategories created yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {categories.length === 0 && (
                  <div className="py-12 text-center text-[var(--muted)] text-sm border-2 border-dashed rounded-xl">
                    No categories found. Start by creating one above!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staff Card */}
        {(mode === "both" || mode === "staff") && (
          <Card className="glass">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-purple-500" />
                    Staff Members
                  </CardTitle>
                  <CardDescription>Manage chefs, waiters, and cashiers for your branch.</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setStaffError("")
                    setShowStaffModal(true)
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Staff
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Staff List */}
              <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                {staff.map(emp => (
                  <div
                    key={emp.id}
                    className="p-3 rounded-lg border bg-[var(--surface)] hover:border-purple-500/30 transition-colors flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{emp.fullName}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full font-bold uppercase">
                          {emp.roles.map(r => r.code).join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {emp.email}</span>
                        {emp.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {emp.phone}</span>}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteStaff(emp.id)}
                      className="w-8 h-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}

                {staff.length === 0 && (
                  <div className="py-12 text-center text-[var(--muted)] text-sm border-2 border-dashed rounded-xl">
                    No staff members managed here. Add one above!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStaffModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl z-10 p-6">
            <h3 className="text-lg font-bold mb-4">Add Staff Member</h3>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. John Doe"
                  value={staffForm.fullName}
                  onChange={e => setStaffForm(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Email *</label>
                <Input
                  required
                  type="email"
                  placeholder="john@example.com"
                  value={staffForm.email}
                  onChange={e => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Phone</label>
                <Input
                  placeholder="+251 912 345 678"
                  value={staffForm.phone}
                  onChange={e => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Password *</label>
                <PasswordInput
                  required
                  placeholder="Minimum 8 characters"
                  value={staffForm.password}
                  onChange={e => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-[var(--surface)] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Role *</label>
                <select
                  value={staffForm.role}
                  onChange={e => setStaffForm(prev => ({ ...prev, role: e.target.value, tableIds: [] }))}
                  className="w-full h-10 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="WAITER">Waiter</option>
                  <option value="CHEF">Chef</option>
                  <option value="CASHIER">Cashier</option>
                </select>
              </div>

              {staffForm.role === "WAITER" && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">
                    Assign Tables
                  </label>
                  {tables.length === 0 ? (
                    <p className="text-xs text-[var(--muted)]">No tables found. Create tables first in Tables tab.</p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto border border-[var(--surface-border)] rounded-lg p-3 space-y-2 bg-[var(--surface-hover)]/10">
                      {tables.map(table => {
                        const isChecked = staffForm.tableIds.includes(table.id)
                        return (
                          <label key={table.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setStaffForm(prev => {
                                  const tableIds = prev.tableIds.includes(table.id)
                                    ? prev.tableIds.filter(id => id !== table.id)
                                    : [...prev.tableIds, table.id]
                                  return { ...prev, tableIds }
                                })
                              }}
                              className="rounded border-[var(--surface-border)] bg-[var(--surface)] text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)]"
                            />
                            <span className="text-white font-medium text-xs">Table {table.table_number}</span>
                            <span className="text-[10px] text-[var(--muted)]">({table.capacity} seats)</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {staffError && (
                <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-2.5 rounded-lg">
                  {staffError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowStaffModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={staffSubmitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {staffSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
