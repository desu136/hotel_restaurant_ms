"use client"

import * as React from "react"
import {
  Plus, Pencil, Trash2, Loader2, Tag,
  ChevronDown, ChevronRight, Folder, FolderOpen,
  Layers, GitBranch, X, Check
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

export function CategoryTab({ mode = "both" }: { mode?: "category" | "staff" | "both" }) {

  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [masterCategories, setMasterCategories] = React.useState<MasterCategory[]>([])
  const [branchCategories, setBranchCategories] = React.useState<Category[]>([])

  const [loading, setLoading] = React.useState(true)

  // ── Main "Add / Edit" modal state ──
  const [showCatModal, setShowCatModal] = React.useState(false)
  const [editCatTarget, setEditCatTarget] = React.useState<any | null>(null)
  const [catForm, setCatForm] = React.useState({
    name: "",
    isMaster: true,
    branchId: "",
    parentId: ""
  })
  const [catSubmitting, setCatSubmitting] = React.useState(false)
  const [catError, setCatError] = React.useState("")
  const [deletingCatId, setDeletingCatId] = React.useState<string | null>(null)

  // ── Hierarchy / tree UI state ──
  const [expandedCategoryIds, setExpandedCategoryIds] = React.useState<Record<string, boolean>>({})
  const [addingSubcatParentId, setAddingSubcatParentId] = React.useState<string | null>(null)
  const [newSubcatName, setNewSubcatName] = React.useState("")
  const [subcatAdding, setSubcatAdding] = React.useState(false)
  const [editingSubcatId, setEditingSubcatId] = React.useState<string | null>(null)
  const [editingSubcatName, setEditingSubcatName] = React.useState("")

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const myRes = await fetch("/api/restaurant/my")
      const myData = myRes.ok ? await myRes.json() : null
      setRestaurant(myData)

      if (myData) {
        const [branchRes, masterCatRes, branchCatRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/restaurant/categories?is_master=true"),
          fetch("/api/restaurant/categories"),
        ])
        const branchData = branchRes.ok ? await branchRes.json() : []
        setBranches(branchData)
        setMasterCategories(masterCatRes.ok ? await masterCatRes.json() : [])
        setBranchCategories(branchCatRes.ok ? await branchCatRes.json() : [])

        // Initialize default branch in form
        if (branchData.length > 0) {
          setCatForm(prev => ({
            ...prev,
            branchId: branchData[0].id
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

  const reloadCategories = async () => {
    const [masterCatRes, branchCatRes] = await Promise.all([
      fetch("/api/restaurant/categories?is_master=true"),
      fetch("/api/restaurant/categories"),
    ])
    setMasterCategories(masterCatRes.ok ? await masterCatRes.json() : [])
    setBranchCategories(branchCatRes.ok ? await branchCatRes.json() : [])
  }

  // ── Main modal open/close ──
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

      const res = await fetch(
        isEdit ? `/api/restaurant/categories/${editCatTarget!.id}` : "/api/restaurant/categories",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json()
      if (!res.ok) { setCatError(data.error ?? "Something went wrong"); return }

      await reloadCategories()
      setShowCatModal(false)
    } catch {
      setCatError("Network error submitting category.")
    } finally {
      setCatSubmitting(false)
    }
  }

  const handleCatDelete = async (id: string) => {
    if (!confirm("Are you sure? Deleting a category will also delete all subcategories and menu items attached to it!")) return
    setDeletingCatId(id)
    try {
      const res = await fetch(`/api/restaurant/categories/${id}`, { method: "DELETE" })
      if (res.ok) {
        await reloadCategories()
      }
    } finally {
      setDeletingCatId(null)
    }
  }

  // ── Subcategory (hierarchy) handlers ──
  const handleAddSubcategory = async (parentId: string, isMaster: boolean, branchId?: string | null) => {
    if (!newSubcatName.trim() || !restaurant) return
    setSubcatAdding(true)
    try {
      const res = await fetch("/api/restaurant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubcatName.trim(),
          restaurant_id: restaurant.id,
          parent_id: parentId,
          is_master: isMaster,
          branch_id: isMaster ? null : branchId,
        }),
      })
      if (res.ok) {
        setNewSubcatName("")
        setAddingSubcatParentId(null)
        await reloadCategories()
      }
    } catch (err) {
      console.error("Failed to add subcategory", err)
    } finally {
      setSubcatAdding(false)
    }
  }

  const handleUpdateSubcategory = async (id: string, parentId: string) => {
    if (!editingSubcatName.trim()) return
    try {
      const res = await fetch(`/api/restaurant/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingSubcatName.trim(), parent_id: parentId }),
      })
      if (res.ok) {
        await reloadCategories()
        setEditingSubcatId(null)
        setEditingSubcatName("")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Split master categories into roots and children
  const rootMasterCats = masterCategories.filter(c => !c.parent_id)
  const subMasterCats = masterCategories.filter(c => !!c.parent_id)

  // Split branch categories into non-master branch categories
  const nonMasterBranchCats = branchCategories.filter(c => !c.master_category_id)

  // Check if current editing target is already a parent category
  const isAlreadyParent = React.useMemo(() => {
    if (!editCatTarget) return false
    if (catForm.isMaster) {
      return subMasterCats.some(c => c.parent_id === editCatTarget.id)
    } else {
      const branchCats = nonMasterBranchCats.filter(c => c.branch_id === catForm.branchId)
      return branchCats.some(c => c.parent_id === editCatTarget.id)
    }
  }, [editCatTarget, catForm.isMaster, catForm.branchId, subMasterCats, nonMasterBranchCats])

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
          <h3 className="font-bold text-lg">Manage Broadcasted Master Categories &amp; Branch Categories</h3>
          <button
            onClick={openCatCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-600)] text-[var(--background)] text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">

          {/* ── Master Categories — hierarchical tree ── */}
          <div className="border border-[var(--surface-border)] rounded-xl p-5 bg-[var(--surface)] space-y-3">
            <h4 className="font-black text-sm text-[var(--color-primary-600)] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" /> Broadcasted Master Categories
            </h4>

            {rootMasterCats.length === 0 ? (
              <p className="text-xs text-[var(--muted)] italic">
                No master categories registered. Master categories are broadcasted to all branches.
              </p>
            ) : (
              <div className="space-y-2">
                {rootMasterCats.map(mainCat => {
                  const children = subMasterCats.filter(c => c.parent_id === mainCat.id)
                  const isExpanded = !!expandedCategoryIds[mainCat.id]

                  return (
                    <div key={mainCat.id} className="space-y-1.5">
                      {/* ── Root category row ── */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-hover)] hover:border-[var(--color-primary-600)]/30 transition-colors">
                        {/* Expand toggle + icon + name */}
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none flex-1 py-0.5"
                          onClick={() =>
                            setExpandedCategoryIds(prev => ({ ...prev, [mainCat.id]: !prev[mainCat.id] }))
                          }
                        >
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-[var(--color-primary-600)] shrink-0" />
                            : <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0" />
                          }
                          {isExpanded
                            ? <FolderOpen className="w-4 h-4 text-[var(--color-primary-600)] shrink-0" />
                            : <Folder className="w-4 h-4 text-[var(--muted)] shrink-0" />
                          }
                          <span className="font-bold text-sm">{mainCat.name}</span>
                          {children.length > 0 && (
                            <span className="text-[10px] text-[var(--color-primary-600)] font-extrabold px-2 py-0.5 bg-[var(--color-primary-600)]/10 rounded-full border border-[var(--color-primary-600)]/20">
                              {children.length} sub
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Add Subcategory */}
                          <button
                            onClick={() => {
                              setExpandedCategoryIds(prev => ({ ...prev, [mainCat.id]: true }))
                              setAddingSubcatParentId(addingSubcatParentId === mainCat.id ? null : mainCat.id)
                              setNewSubcatName("")
                            }}
                            className="flex items-center gap-1 h-7 px-2.5 text-xs font-bold text-[var(--color-primary-600)] hover:bg-[var(--color-primary-600)]/10 rounded-md transition-colors"
                            title="Add subcategory"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Sub</span>
                          </button>
                          <button
                            onClick={() => openCatEdit(mainCat, true)}
                            className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCatDelete(mainCat.id)}
                            disabled={deletingCatId === mainCat.id}
                            className="p-1.5 rounded text-[var(--muted)] hover:text-red-500 transition-colors"
                          >
                            {deletingCatId === mainCat.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>
                      </div>

                      {/* ── Expanded children block ── */}
                      {isExpanded && (
                        <div className="pl-7 space-y-1.5 border-l-2 border-[var(--color-primary-600)]/15 ml-5">

                          {/* Inline add-subcategory form */}
                          {addingSubcatParentId === mainCat.id && (
                            <form
                              onSubmit={e => { e.preventDefault(); handleAddSubcategory(mainCat.id, true, null) }}
                              className="flex gap-2 items-center p-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-hover)]/40"
                            >
                              <input
                                autoFocus
                                placeholder="Subcategory name…"
                                value={newSubcatName}
                                onChange={e => setNewSubcatName(e.target.value)}
                                className="flex-1 h-8 px-3 text-xs bg-[var(--surface)] border border-[var(--surface-border)] rounded-md focus:outline-none"
                              />
                              <button
                                type="submit"
                                disabled={!newSubcatName.trim() || subcatAdding}
                                className="h-8 px-3 text-xs font-bold bg-[var(--color-primary-600)] text-[var(--background)] rounded-md hover:bg-[var(--color-primary-500)] disabled:opacity-50 transition-colors flex items-center gap-1"
                              >
                                {subcatAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setAddingSubcatParentId(null)}
                                className="h-8 px-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded-md border border-[var(--surface-border)] transition-colors"
                              >
                                Cancel
                              </button>
                            </form>
                          )}

                          {/* Existing subcategories */}
                          {children.map(sub => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-hover)]/20 hover:border-[var(--color-primary-600)]/20 transition-colors"
                            >
                              {editingSubcatId === sub.id ? (
                                <div className="flex-1 flex gap-2 items-center">
                                  <input
                                    autoFocus
                                    value={editingSubcatName}
                                    onChange={e => setEditingSubcatName(e.target.value)}
                                    className="flex-1 h-7 px-2 text-xs bg-[var(--surface)] border border-[var(--surface-border)] rounded focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleUpdateSubcategory(sub.id, mainCat.id)}
                                    className="h-7 px-3 text-xs font-bold bg-[var(--color-primary-600)] text-[var(--background)] rounded hover:bg-[var(--color-primary-500)] transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingSubcatId(null)}
                                    className="h-7 px-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded border border-[var(--surface-border)] transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-xs font-semibold">{sub.name}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => { setEditingSubcatId(sub.id); setEditingSubcatName(sub.name) }}
                                      className="p-1 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)] transition-colors"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleCatDelete(sub.id)}
                                      disabled={deletingCatId === sub.id}
                                      className="p-1 rounded text-[var(--muted)] hover:text-red-500 transition-colors"
                                    >
                                      {deletingCatId === sub.id
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <Trash2 className="w-3 h-3" />
                                      }
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}

                          {children.length === 0 && addingSubcatParentId !== mainCat.id && (
                            <p className="text-[10px] text-[var(--muted)] italic pl-2 py-1">No subcategories yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Branch Specific Categories — hierarchical tree per branch ── */}
          <div className="border border-[var(--surface-border)] rounded-xl p-5 bg-[var(--surface)] space-y-4">
            <h4 className="font-black text-sm text-[var(--muted)] uppercase tracking-wider flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> Branch Specific Categories
            </h4>

            {branches.length === 0 ? (
              <p className="text-xs text-[var(--muted)] italic">No branches registered. Please create a branch first.</p>
            ) : (
              <div className="space-y-4">
                {branches.map(branch => {
                  const branchCats = nonMasterBranchCats.filter(c => c.branch_id === branch.id)
                  const rootBranchCats = branchCats.filter(c => !c.parent_id)
                  const subBranchCats = branchCats.filter(c => !!c.parent_id)

                  return (
                    <div key={branch.id} className="border border-[var(--surface-border)] rounded-xl p-4 bg-[var(--surface-hover)]/30 space-y-3">
                      <h5 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-1.5 border-b border-[var(--surface-border)] pb-2">
                        <GitBranch className="w-4 h-4 text-[var(--color-primary-600)]" />
                        {branch.name}
                      </h5>

                      {rootBranchCats.length === 0 ? (
                        <p className="text-xs text-[var(--muted)] italic pl-2 py-1">No branch-specific categories created yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {rootBranchCats.map(mainCat => {
                            const children = subBranchCats.filter(c => c.parent_id === mainCat.id)
                            const isExpanded = !!expandedCategoryIds[mainCat.id]

                            return (
                              <div key={mainCat.id} className="space-y-1.5">
                                {/* ── Branch category row ── */}
                                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] hover:border-[var(--color-primary-600)]/30 transition-colors">
                                  {/* Expand toggle + icon + name */}
                                  <div
                                    className="flex items-center gap-2 cursor-pointer select-none flex-1 py-0.5"
                                    onClick={() =>
                                      setExpandedCategoryIds(prev => ({ ...prev, [mainCat.id]: !prev[mainCat.id] }))
                                    }
                                  >
                                    {isExpanded
                                      ? <ChevronDown className="w-4 h-4 text-[var(--color-primary-600)] shrink-0" />
                                      : <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0" />
                                    }
                                    {isExpanded
                                      ? <FolderOpen className="w-4 h-4 text-[var(--color-primary-600)] shrink-0" />
                                      : <Folder className="w-4 h-4 text-[var(--muted)] shrink-0" />
                                    }
                                    <span className="font-bold text-sm">{mainCat.name}</span>
                                    {children.length > 0 && (
                                      <span className="text-[10px] text-[var(--color-primary-600)] font-extrabold px-2 py-0.5 bg-[var(--color-primary-600)]/10 rounded-full border border-[var(--color-primary-600)]/20">
                                        {children.length} sub
                                      </span>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Add Subcategory */}
                                    <button
                                      onClick={() => {
                                        setExpandedCategoryIds(prev => ({ ...prev, [mainCat.id]: true }))
                                        setAddingSubcatParentId(addingSubcatParentId === mainCat.id ? null : mainCat.id)
                                        setNewSubcatName("")
                                      }}
                                      className="flex items-center gap-1 h-7 px-2.5 text-xs font-bold text-[var(--color-primary-600)] hover:bg-[var(--color-primary-600)]/10 rounded-md transition-colors"
                                      title="Add subcategory"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Sub</span>
                                    </button>
                                    <button
                                      onClick={() => openCatEdit(mainCat, false)}
                                      className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)] transition-colors"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleCatDelete(mainCat.id)}
                                      disabled={deletingCatId === mainCat.id}
                                      className="p-1.5 rounded text-[var(--muted)] hover:text-red-500 transition-colors"
                                    >
                                      {deletingCatId === mainCat.id
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <Trash2 className="w-3.5 h-3.5" />
                                      }
                                    </button>
                                  </div>
                                </div>

                                {/* ── Expanded branch subcategories ── */}
                                {isExpanded && (
                                  <div className="pl-7 space-y-1.5 border-l-2 border-[var(--color-primary-600)]/15 ml-5">
                                    {/* Inline add-subcategory form */}
                                    {addingSubcatParentId === mainCat.id && (
                                      <form
                                        onSubmit={e => { e.preventDefault(); handleAddSubcategory(mainCat.id, false, branch.id) }}
                                        className="flex gap-2 items-center p-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-hover)]/40"
                                      >
                                        <input
                                          autoFocus
                                          placeholder="Subcategory name…"
                                          value={newSubcatName}
                                          onChange={e => setNewSubcatName(e.target.value)}
                                          className="flex-1 h-8 px-3 text-xs bg-[var(--surface)] border border-[var(--surface-border)] rounded-md focus:outline-none"
                                        />
                                        <button
                                          type="submit"
                                          disabled={!newSubcatName.trim() || subcatAdding}
                                          className="h-8 px-3 text-xs font-bold bg-[var(--color-primary-600)] text-[var(--background)] rounded-md hover:bg-[var(--color-primary-500)] disabled:opacity-50 transition-colors flex items-center gap-1"
                                        >
                                          {subcatAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                          Save
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setAddingSubcatParentId(null)}
                                          className="h-8 px-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded-md border border-[var(--surface-border)] transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </form>
                                    )}

                                    {/* Existing subcategories */}
                                    {children.map(sub => (
                                      <div
                                        key={sub.id}
                                        className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] hover:border-[var(--color-primary-600)]/20 transition-colors"
                                      >
                                        {editingSubcatId === sub.id ? (
                                          <div className="flex-1 flex gap-2 items-center">
                                            <input
                                              autoFocus
                                              value={editingSubcatName}
                                              onChange={e => setEditingSubcatName(e.target.value)}
                                              className="flex-1 h-7 px-2 text-xs bg-[var(--surface)] border border-[var(--surface-border)] rounded focus:outline-none"
                                            />
                                            <button
                                              onClick={() => handleUpdateSubcategory(sub.id, mainCat.id)}
                                              className="h-7 px-3 text-xs font-bold bg-[var(--color-primary-600)] text-[var(--background)] rounded hover:bg-[var(--color-primary-500)] transition-colors"
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() => setEditingSubcatId(null)}
                                              className="h-7 px-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded border border-[var(--surface-border)] transition-colors"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        ) : (
                                          <>
                                            <span className="text-xs font-semibold">{sub.name}</span>
                                            <div className="flex items-center gap-1">
                                              <button
                                                onClick={() => { setEditingSubcatId(sub.id); setEditingSubcatName(sub.name) }}
                                                className="p-1 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)] transition-colors"
                                              >
                                                <Pencil className="w-3 h-3" />
                                              </button>
                                              <button
                                                onClick={() => handleCatDelete(sub.id)}
                                                disabled={deletingCatId === sub.id}
                                                className="p-1 rounded text-[var(--muted)] hover:text-red-500 transition-colors"
                                              >
                                                {deletingCatId === sub.id
                                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                  : <Trash2 className="w-3.5 h-3.5" />
                                                }
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}

                                    {children.length === 0 && addingSubcatParentId !== mainCat.id && (
                                      <p className="text-[10px] text-[var(--muted)] italic pl-2 py-1">No subcategories yet.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ─── Add / Edit Category Modal ─── */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCatModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Tag className="w-5 h-5" />
                {editCatTarget ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setShowCatModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCatSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={catForm.name}
                  onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm"
                  autoFocus
                />
              </div>

              {!editCatTarget && (
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="isMasterCat"
                    checked={catForm.isMaster}
                    onChange={e => setCatForm(f => ({ ...f, isMaster: e.target.checked, parentId: "" }))}
                    className="w-4 h-4 rounded text-[var(--color-primary-600)]"
                  />
                  <label htmlFor="isMasterCat" className="text-sm font-semibold cursor-pointer select-none">
                    Broadcast as Master Category to all branches
                  </label>
                </div>
              )}

              {/* Target branch (only for non-master on create/edit) */}
              {!catForm.isMaster && !editCatTarget && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Target Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={catForm.branchId}
                    onChange={e => setCatForm(f => ({ ...f, branchId: e.target.value, parentId: "" }))}
                    className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Parent category (conditional based on Master vs Branch Category) */}
              {!isAlreadyParent && (
                catForm.isMaster ? (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Parent Category
                      <span className="ml-1 text-xs text-[var(--muted)] font-normal">(optional — creates a subcategory)</span>
                    </label>
                    <select
                      value={catForm.parentId}
                      onChange={e => setCatForm(f => ({ ...f, parentId: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none"
                    >
                      <option value="">None — Top-level category</option>
                      {rootMasterCats
                        .filter(c => !editCatTarget || c.id !== editCatTarget.id)
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))
                      }
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Parent Category
                      <span className="ml-1 text-xs text-[var(--muted)] font-normal">(optional — creates a subcategory)</span>
                    </label>
                    <select
                      value={catForm.parentId}
                      onChange={e => setCatForm(f => ({ ...f, parentId: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none"
                    >
                      <option value="">None — Top-level category</option>
                      {nonMasterBranchCats
                        .filter(c => c.branch_id === catForm.branchId && !c.parent_id)
                        .filter(c => !editCatTarget || c.id !== editCatTarget.id)
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))
                      }
                    </select>
                  </div>
                )
              )}

              {catError && <p className="text-sm text-red-500">{catError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="flex-1 px-4 py-2.5 border hover:bg-[var(--surface-hover)] hover:cursor-pointer rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:cursor-pointer hover:bg-[var(--color-primary-500)] text-[var(--background)] rounded-lg text-sm flex items-center justify-center gap-1"
                >
                  {catSubmitting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Check className="w-4 h-4" />
                  }
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
