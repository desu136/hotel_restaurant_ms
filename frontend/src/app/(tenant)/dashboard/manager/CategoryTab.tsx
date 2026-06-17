"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, Pencil, Trash2, Users2, Shield, Mail, Phone, Loader2, Tag, Coffee 
} from "lucide-react"

interface Category {
  id: string
  name: string
  restaurant_id: string
}

interface Restaurant {
  id: string
  name: string
  branch_id: string
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

export function CategoryTab() {
  // Common states
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([])
  const [selectedRestaurantId, setSelectedRestaurantId] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)

  // Categories states
  const [categories, setCategories] = React.useState<Category[]>([])
  const [newCatName, setNewCatName] = React.useState("")
  const [editingCatId, setEditingCatId] = React.useState<string | null>(null)
  const [editingCatName, setEditingCatName] = React.useState("")

  // Staff states
  const [staff, setStaff] = React.useState<Employee[]>([])
  const [showStaffModal, setShowStaffModal] = React.useState(false)
  const [staffForm, setStaffForm] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "WAITER", // default
  })
  const [staffError, setStaffError] = React.useState("")
  const [staffSubmitting, setStaffSubmitting] = React.useState(false)

  // Fetch initial data
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch restaurants
      const restRes = await fetch("/api/restaurant/list")
      const restData = restRes.ok ? await restRes.json() : []
      setRestaurants(restData)
      
      let rId = ""
      if (restData.length > 0) {
        rId = restData[0].id
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
        const catData = catRes.ok ? await catRes.json() : []
        setCategories(catData)
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
      return
    }
    try {
      const catRes = await fetch(`/api/restaurant/categories?restaurant_id=${id}`)
      const catData = catRes.ok ? await catRes.json() : []
      setCategories(catData)
    } catch (err) {
      console.error(err)
    }
  }

  // Categories CRUD
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim() || !selectedRestaurantId) return
    try {
      const res = await fetch("/api/restaurant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), restaurant_id: selectedRestaurantId })
      })
      if (res.ok) {
        const newCat = await res.json()
        setCategories(prev => [...prev, newCat])
        setNewCatName("")
      }
    } catch (err) {
      console.error("Failed to add category", err)
    }
  }

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) return
    try {
      const res = await fetch(`/api/restaurant/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingCatName.trim() })
      })
      if (res.ok) {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editingCatName.trim() } : c))
        setEditingCatId(null)
        setEditingCatName("")
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
          roles: [staffForm.role]
        })
      })

      const data = await res.json()
      if (!res.ok) {
        setStaffError(data.error ?? "Failed to create staff account")
        return
      }

      setStaff(prev => [...prev, data])
      setShowStaffModal(false)
      setStaffForm({ fullName: "", email: "", phone: "", password: "", role: "WAITER" })
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

      {/* Grid: Category Left, Staff Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Categories Card */}
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
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <Input
                placeholder="New category name (e.g. Starter, Drink)"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                disabled={!selectedRestaurantId}
                className="bg-[var(--surface)] text-sm"
              />
              <Button 
                type="submit" 
                disabled={!selectedRestaurantId || !newCatName.trim()}
                className="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </form>

            {/* Categories List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-[var(--surface)] hover:border-[var(--color-primary-500)]/40 transition-colors"
                >
                  {editingCatId === cat.id ? (
                    <div className="flex-1 flex gap-2 mr-2">
                      <Input
                        value={editingCatName}
                        onChange={e => setEditingCatName(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateCategory(cat.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white h-8"
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingCatId(null)}
                        className="h-8"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-sm">{cat.name}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCatId(cat.id)
                            setEditingCatName(cat.name)
                          }}
                          className="w-8 h-8 p-0 text-[var(--muted)] hover:text-[var(--foreground)]"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="w-8 h-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {categories.length === 0 && (
                <div className="py-12 text-center text-[var(--muted)] text-sm border-2 border-dashed rounded-xl">
                  No categories found. Start by creating one above!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Staff Card */}
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
                <Input
                  required
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={staffForm.password}
                  onChange={e => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Role *</label>
                <select
                  value={staffForm.role}
                  onChange={e => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full h-10 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="WAITER">Waiter</option>
                  <option value="CHEF">Chef</option>
                  <option value="CASHIER">Cashier</option>
                </select>
              </div>

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
