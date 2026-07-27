"use client"

import * as React from "react"
import { Plus, Loader2, Layers, GitBranch, Search } from "lucide-react"
import { CategoryModal } from "./category/components/CategoryModal"
import { CategoryTreeItem } from "./category/components/CategoryTreeItem"

interface Restaurant { id: string; name: string }
interface Branch { id: string; name: string }
interface MasterCategory { id: string; name: string; parent_id?: string | null }
interface Category { id: string; name: string; branch_id: string; master_category_id?: string | null; parent_id?: string | null }

export function CategoryTab({ mode = "both" }: { mode?: "category" | "staff" | "both" }) {
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [masterCategories, setMasterCategories] = React.useState<MasterCategory[]>([])
  const [branchCategories, setBranchCategories] = React.useState<Category[]>([])
  const [currentUser, setCurrentUser] = React.useState<{ branch_id?: string | null } | null>(null)
  const isBranchManager = !!(currentUser?.branch_id)
  const [loading, setLoading] = React.useState(true)

  const [showCatModal, setShowCatModal] = React.useState(false)
  const [editCatTarget, setEditCatTarget] = React.useState<any | null>(null)
  const [catForm, setCatForm] = React.useState({ name: "", isMaster: true, branchId: "", parentId: "" })
  const [catSubmitting, setCatSubmitting] = React.useState(false); const [catError, setCatError] = React.useState(""); const [deletingCatId, setDeletingCatId] = React.useState<string | null>(null)
  const [expandedCategoryIds, setExpandedCategoryIds] = React.useState<Record<string, boolean>>({}); const [addingSubcatParentId, setAddingSubcatParentId] = React.useState<string | null>(null)
  const [newSubcatName, setNewSubcatName] = React.useState(""); const [subcatAdding, setSubcatAdding] = React.useState(false)
  const [editingSubcatId, setEditingSubcatId] = React.useState<string | null>(null); const [editingSubcatName, setEditingSubcatName] = React.useState(""); const [catSearchQuery, setCatSearchQuery] = React.useState("")

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [myRes, meRes, branchRes, masterCatRes, branchCatRes] = await Promise.all([
        fetch("/api/restaurant/my"), fetch("/api/auth/me"), fetch("/api/branches"),
        fetch("/api/restaurant/categories?is_master=true"), fetch("/api/restaurant/categories")
      ])
      const myData = myRes.ok ? await myRes.json() : null
      const user = meRes.ok ? (await meRes.json())?.user ?? null : null
      const branchData = branchRes.ok ? await branchRes.json() : []
      setRestaurant(myData); setCurrentUser(user); setBranches(branchData)
      setMasterCategories(masterCatRes.ok ? await masterCatRes.json() : [])
      setBranchCategories(branchCatRes.ok ? await branchCatRes.json() : [])
      const defBranchId = user?.branch_id ?? branchData[0]?.id ?? ""
      if (defBranchId) setCatForm(prev => ({ ...prev, branchId: defBranchId, isMaster: !user?.branch_id }))
    } finally { setLoading(false) }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const reloadCategories = async () => {
    const [masterCatRes, branchCatRes] = await Promise.all([fetch("/api/restaurant/categories?is_master=true"), fetch("/api/restaurant/categories")])
    setMasterCategories(masterCatRes.ok ? await masterCatRes.json() : [])
    setBranchCategories(branchCatRes.ok ? await branchCatRes.json() : [])
  }

  const openCatCreate = () => {
    setEditCatTarget(null); setCatForm({ name: "", isMaster: !isBranchManager, branchId: currentUser?.branch_id ?? branches[0]?.id ?? "", parentId: "" }); setCatError(""); setShowCatModal(true)
  }

  const openCatEdit = (cat: any, isMaster: boolean) => {
    if (isBranchManager && isMaster) {
      const localCat = branchCategories.find(c => c.master_category_id === cat.id && c.branch_id === currentUser?.branch_id)
      if (localCat) { setEditCatTarget(localCat); setCatForm({ name: localCat.name, isMaster: false, branchId: localCat.branch_id, parentId: localCat.parent_id ?? "" }); setCatError(""); setShowCatModal(true); return }
    }
    setEditCatTarget(cat); setCatForm({ name: cat.name, isMaster, branchId: isMaster ? "" : cat.branch_id, parentId: cat.parent_id ?? "" }); setCatError(""); setShowCatModal(true)
  }

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catForm.name.trim() || (!catForm.isMaster && !catForm.branchId) || !restaurant) { setCatError("Invalid data"); return }
    setCatSubmitting(true); setCatError("")
    try {
      const isEdit = !!editCatTarget
      const payload = isEdit ? { name: catForm.name.trim(), parent_id: catForm.parentId || null }
        : { name: catForm.name.trim(), parent_id: catForm.parentId || null, restaurant_id: restaurant.id, branch_id: catForm.isMaster ? null : catForm.branchId, is_master: catForm.isMaster }
      const res = await fetch(isEdit ? `/api/restaurant/categories/${editCatTarget!.id}` : "/api/restaurant/categories", {
        method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      })
      if (res.ok) { await reloadCategories(); setShowCatModal(false) } else setCatError((await res.json()).error ?? "Error")
    } finally { setCatSubmitting(false) }
  }

  const handleCatDelete = async (id: string) => {
    let targetId = id
    if (isBranchManager && masterCategories.some(c => c.id === id)) {
      const localCat = branchCategories.find(c => c.master_category_id === id && c.branch_id === currentUser?.branch_id)
      if (localCat) targetId = localCat.id
      else { alert("No local copy found."); return }
    }
    if (!confirm("Delete category?")) return
    setDeletingCatId(targetId)
    try {
      const res = await fetch(`/api/restaurant/categories/${targetId}`, { method: "DELETE" })
      if (res.ok) await reloadCategories()
    } finally { setDeletingCatId(null) }
  }

  const handleAddSubcategory = async (parentId: string, isMaster: boolean, branchId?: string | null) => {
    if (!newSubcatName.trim() || !restaurant) return
    setSubcatAdding(true)
    try {
      let targetParentId = parentId; let targetIsMaster = isMaster; let targetBranchId = isMaster ? null : branchId
      if (isBranchManager && isMaster) {
        const localParent = branchCategories.find(c => c.master_category_id === parentId && c.branch_id === currentUser?.branch_id)
        if (localParent) { targetParentId = localParent.id; targetIsMaster = false; targetBranchId = currentUser.branch_id }
        else return
      }
      const res = await fetch("/api/restaurant/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubcatName.trim(), restaurant_id: restaurant.id, parent_id: targetParentId, is_master: targetIsMaster, branch_id: targetBranchId })
      })
      if (res.ok) { setNewSubcatName(""); setAddingSubcatParentId(null); await reloadCategories() }
    } finally { setSubcatAdding(false) }
  }

  const handleUpdateSubcategory = async (id: string, parentId: string) => {
    if (!editingSubcatName.trim()) return
    let targetId = id; let targetParentId = parentId
    if (isBranchManager && masterCategories.some(c => c.id === id)) {
      const localSub = branchCategories.find(c => c.master_category_id === id && c.branch_id === currentUser?.branch_id)
      if (localSub) { targetId = localSub.id; targetParentId = branchCategories.find(c => c.master_category_id === parentId && c.branch_id === currentUser?.branch_id)?.id ?? parentId }
      else return
    }
    const res = await fetch(`/api/restaurant/categories/${targetId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingSubcatName.trim(), parent_id: targetParentId })
    })
    if (res.ok) { await reloadCategories(); setEditingSubcatId(null); setEditingSubcatName("") }
  }

  const rootMasterCats = masterCategories.filter(c => !c.parent_id)
  const subMasterCats = masterCategories.filter(c => !!c.parent_id)
  const nonMasterBranchCats = isBranchManager ? branchCategories : branchCategories.filter(c => !c.master_category_id)
  const isCategoryExpanded = (catId: string) => catSearchQuery.trim() ? true : !!expandedCategoryIds[catId]
  const isAlreadyParent = React.useMemo(() => {
    if (!editCatTarget) return false
    return catForm.isMaster ? subMasterCats.some(c => c.parent_id === editCatTarget.id) : nonMasterBranchCats.filter(c => c.branch_id === catForm.branchId).some(c => c.parent_id === editCatTarget.id)
  }, [editCatTarget, catForm.isMaster, catForm.branchId, subMasterCats, nonMasterBranchCats])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" /></div>

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Manage Master &amp; Branch Categories</h3>
          <button onClick={openCatCreate} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-600)] text-[var(--background)] text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-500)] shadow-sm">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
        <div className="border border-[var(--surface-border)] rounded-xl p-4 bg-[var(--surface)] shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-2.5" />
            <input type="text" value={catSearchQuery} onChange={e => setCatSearchQuery(e.target.value)} placeholder="Search category..." className="w-full text-xs bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg pl-9 pr-3 py-2.5 focus:outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="border border-[var(--surface-border)] rounded-xl p-5 bg-[var(--surface)] space-y-3">
            <h4 className="font-black text-sm text-[var(--color-primary-600)] uppercase tracking-wider flex items-center gap-2"><Layers className="w-4 h-4" /> Master Categories</h4>
            <div className="space-y-2">
              {rootMasterCats.map(mainCat => (
                <CategoryTreeItem key={mainCat.id} mainCat={mainCat} children={subMasterCats.filter(c => c.parent_id === mainCat.id)}
                  isExpanded={isCategoryExpanded(mainCat.id)} onToggleExpand={id => setExpandedCategoryIds(p => ({ ...p, [id]: !p[id] }))}
                  onOpenEdit={cat => openCatEdit(cat, true)} onDelete={handleCatDelete} deletingCatId={deletingCatId}
                  addingSubcatParentId={addingSubcatParentId} onSetAddingSubcatParentId={setAddingSubcatParentId}
                  newSubcatName={newSubcatName} setNewSubcatName={setNewSubcatName} subcatAdding={subcatAdding}
                  onAddSubcategory={id => handleAddSubcategory(id, true, null)} editingSubcatId={editingSubcatId} editingSubcatName={editingSubcatName}
                  setEditingSubcatId={setEditingSubcatId} setEditingSubcatName={setEditingSubcatName} onUpdateSubcategory={handleUpdateSubcategory}
                />
              ))}
            </div>
          </div>
          <div className="border border-[var(--surface-border)] rounded-xl p-5 bg-[var(--surface)] space-y-4">
            <h4 className="font-black text-sm text-[var(--muted)] uppercase tracking-wider flex items-center gap-2"><GitBranch className="w-4 h-4" /> Branch Specific Categories</h4>
            {branches.map(branch => (
              <div key={branch.id} className="border border-[var(--surface-border)] rounded-xl p-4 bg-[var(--surface-hover)]/30 space-y-3">
                <h5 className="font-bold text-sm flex items-center gap-1.5 border-b pb-2"><GitBranch className="w-4 h-4 text-[var(--color-primary-600)]" />{branch.name}</h5>
                <div className="space-y-2">
                  {nonMasterBranchCats.filter(c => c.branch_id === branch.id && !c.parent_id).map(mainCat => (
                    <CategoryTreeItem key={mainCat.id} mainCat={mainCat} children={nonMasterBranchCats.filter(c => c.branch_id === branch.id && c.parent_id === mainCat.id)}
                      isExpanded={isCategoryExpanded(mainCat.id)} onToggleExpand={id => setExpandedCategoryIds(p => ({ ...p, [id]: !p[id] }))}
                      onOpenEdit={cat => openCatEdit(cat, false)} onDelete={handleCatDelete} deletingCatId={deletingCatId}
                      addingSubcatParentId={addingSubcatParentId} onSetAddingSubcatParentId={setAddingSubcatParentId}
                      newSubcatName={newSubcatName} setNewSubcatName={setNewSubcatName} subcatAdding={subcatAdding}
                      onAddSubcategory={id => handleAddSubcategory(id, false, branch.id)} editingSubcatId={editingSubcatId} editingSubcatName={editingSubcatName}
                      setEditingSubcatId={setEditingSubcatId} setEditingSubcatName={setEditingSubcatName} onUpdateSubcategory={handleUpdateSubcategory}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <CategoryModal show={showCatModal} editTarget={editCatTarget} isBranchManager={isBranchManager} form={catForm} setForm={setCatForm}
        branches={branches} rootMasterCats={rootMasterCats} nonMasterBranchCats={nonMasterBranchCats} isAlreadyParent={isAlreadyParent}
        submitting={catSubmitting} error={catError} onClose={() => setShowCatModal(false)} onSubmit={handleCatSubmit} />
    </>
  )
}
