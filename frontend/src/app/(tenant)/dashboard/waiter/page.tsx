"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus, Bell, ClipboardList, Users, MessageSquare,
  RefreshCw, ArrowLeft, ShoppingBag, Search, Minus
} from "lucide-react"

interface Table {
  id: string
  table_number: string
  capacity: number
  waiter_id: string | null
  waiter?: {
    id: string
    full_name: string
  } | null
}

interface CustomizationValue { name: string; extraPrice: number }
interface Customization { key: string; label: string; multiple: boolean; values: CustomizationValue[] }

interface MenuItem {
  id: string
  display_name: string
  description?: string | null
  price: string | number
  image_url?: string | null
  category_id?: string | null
  customizations?: Customization[] | null
  category?: { id: string; name: string; parent_id?: string | null } | null
}

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  selectedCustomizations: Record<string, string | string[]>
  notes: string
}

interface Category { id: string; name: string; parent_id?: string | null }

interface OrderItem {
  id: string
  quantity: number
  unit_price: number | string
  menu_item: {
    display_name: string
  }
}

interface Order {
  id: string
  status: string
  order_type: string
  total_amount: string | number
  created_at: string
  notes?: string | null
  table_id?: string | null
  table?: {
    id: string
    table_number: string
  } | null
  items: OrderItem[]
  waiter_id?: string | null
}

export default function WaiterDashboard() {
  const [me, setMe] = React.useState<{ id: string; name: string; email: string } | null>(null)
  const [restaurants, setRestaurants] = React.useState<{ id: string; name: string }[]>([])
  const [selectedRestId, setSelectedRestId] = React.useState("")
  const [tables, setTables] = React.useState<Table[]>([])
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [orders, setOrders] = React.useState<Order[]>([])
  const [prevReadyIds, setPrevReadyIds] = React.useState<string[]>([])
  const [activeTab, setActiveTab] = React.useState<"tables" | "orders">("tables")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  // Order Modal
  const [showOrderModal, setShowOrderModal] = React.useState(false)
  const [selectedTable, setSelectedTable] = React.useState<string>("")
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [orderNotes, setOrderNotes] = React.useState("")

  // Category hierarchy
  const [activeParentId, setActiveParentId] = React.useState("")
  const [activeSubCatId, setActiveSubCatId] = React.useState("all")
  const [searchTerm, setSearchTerm] = React.useState("")

  // Item detail overlay
  const [selectedItem, setSelectedItem] = React.useState<MenuItem | null>(null)
  const [itemCustomizations, setItemCustomizations] = React.useState<Record<string, string | string[]>>({})
  const [itemNotes, setItemNotes] = React.useState("")
  const [itemQty, setItemQty] = React.useState(1)

  // Notification sound
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.type = "sine"
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.35)
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e)
    }
  }

  // Request browser notification permissions
  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }
  }, [])

  // Fetch initial auth user info
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.success && data?.user) {
          setMe({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email
          })
        }
      })
      .catch(() => {})
  }, [])

  // Fetch restaurants, menu items, and tables
  const loadStationData = React.useCallback(async () => {
    try {
      setLoading(true)
      const restRes = await fetch("/api/restaurant/list")
      const restData = restRes.ok ? await restRes.json() : []
      setRestaurants(restData)

      if (restData.length > 0) {
        const rId = restData[0].id
        setSelectedRestId(rId)
        await fetchRestaurantData(rId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRestaurantData = async (rId: string) => {
    try {
      const [tableRes, catRes, menuRes] = await Promise.all([
        fetch("/api/restaurant/tables"),
        fetch(`/api/restaurant/categories?restaurant_id=${rId}`),
        fetch(`/api/restaurant/menu?restaurant_id=${rId}`)
      ])
      const tbls = tableRes.ok ? await tableRes.json() : []
      const cats: Category[] = catRes.ok ? await catRes.json() : []
      const menu = menuRes.ok ? await menuRes.json() : []

      setTables(tbls.filter((t: Table) => t.waiter_id !== undefined))
      setCategories(cats)
      setMenuItems(menu)

      const parents = cats.filter(c => !c.parent_id)
      if (parents.length > 0) {
        setActiveParentId(parents[0].id)
      } else {
        setActiveParentId("")
      }
      setActiveSubCatId("all")
    } catch (err) {
      console.error(err)
    }
  }

  React.useEffect(() => {
    loadStationData()
  }, [loadStationData])

  const handleRestaurantChange = async (rId: string) => {
    setSelectedRestId(rId)
    if (rId) {
      await fetchRestaurantData(rId)
    } else {
      setTables([])
      setCategories([])
      setMenuItems([])
      setActiveParentId("")
      setActiveSubCatId("all")
    }
  }

  // Poll active orders & check for newly READY orders to notify the waiter
  const fetchActiveOrders = React.useCallback(async () => {
    try {
      const res = await fetch("/api/orders?limit=100")
      if (!res.ok) throw new Error()
      const data: Order[] = await res.json()
      
      // Filter active (non-completed) orders
      const active = data.filter(o => !["COMPLETED", "CANCELLED"].includes(o.status))
      setOrders(active)

      // Notify waiter about any newly READY orders belonging to their assigned tables
      if (me) {
        const waiterReadyOrders = active.filter(o => 
          o.status === "READY" && 
          o.waiter_id === me.id
        )
        const currentReadyIds = waiterReadyOrders.map(o => o.id)
        const newReadyOrders = waiterReadyOrders.filter(o => !prevReadyIds.includes(o.id))

        if (newReadyOrders.length > 0) {
          playNotificationSound()
          newReadyOrders.forEach(o => {
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification(`Order Ready to Serve! 🍽️`, {
                body: `Table ${o.table?.table_number || "Takeaway"} has ready items!`,
              })
            }
          })
        }
        setPrevReadyIds(currentReadyIds)
      }
    } catch (e) {
      console.error("Failed to poll active orders", e)
    }
  }, [me, prevReadyIds])

  React.useEffect(() => {
    fetchActiveOrders()
    const interval = setInterval(fetchActiveOrders, 5000)
    return () => clearInterval(interval)
  }, [fetchActiveOrders])

  const getTableStatus = (tableId: string) => {
    const hasActiveOrder = orders.some(o => o.table_id === tableId)
    return hasActiveOrder ? "OCCUPIED" : "AVAILABLE"
  }

  const getCustomizedPrice = (item: MenuItem, custs: Record<string, string | string[]>) => {
    let price = parseFloat(item.price.toString())
    if (item.customizations) {
      for (const [key, val] of Object.entries(custs)) {
        const group = item.customizations.find(g => g.key === key)
        if (group) {
          const vals = Array.isArray(val) ? val : [val]
          for (const v of vals) {
            const choice = group.values.find(c => c.name === v)
            if (choice?.extraPrice) price += choice.extraPrice
          }
        }
      }
    }
    return price
  }

  const openItemDetail = (item: MenuItem) => {
    setSelectedItem(item)
    setItemCustomizations({})
    setItemNotes("")
    setItemQty(1)
  }

  const addToCartFromDetail = () => {
    if (!selectedItem) return
    const unitPrice = getCustomizedPrice(selectedItem, itemCustomizations)
    setCart(prev => {
      const idx = prev.findIndex(c =>
        c.menuItemId === selectedItem.id &&
        JSON.stringify(c.selectedCustomizations) === JSON.stringify(itemCustomizations) &&
        c.notes === itemNotes
      )
      if (idx >= 0) {
        const u = [...prev]
        u[idx].quantity += itemQty
        return u
      }
      return [...prev, { menuItemId: selectedItem.id, name: selectedItem.display_name, price: unitPrice, quantity: itemQty, selectedCustomizations: itemCustomizations, notes: itemNotes }]
    })
    setSelectedItem(null)
  }

  const addToCartDirectly = (item: MenuItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.menuItemId === item.id && Object.keys(c.selectedCustomizations).length === 0)
      if (idx >= 0) { const u = [...prev]; u[idx].quantity++; return u }
      return [...prev, { menuItemId: item.id, name: item.display_name, price: parseFloat(item.price.toString()), quantity: 1, selectedCustomizations: {}, notes: "" }]
    })
  }

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => {
      const u = [...prev]
      u[idx].quantity += delta
      if (u[idx].quantity <= 0) return prev.filter((_, i) => i !== idx)
      return u
    })
  }

  const handleClearTable = async (tableId: string) => {
    if (!confirm("Mark this table as available? All active orders will be completed.")) return
    const tableOrders = orders.filter(o => o.table_id === tableId)
    await Promise.all(
      tableOrders.map(o =>
        fetch(`/api/orders/${o.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED" })
        })
      )
    )
    await fetchActiveOrders()
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTable || cart.length === 0) return
    setError("")
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_id: selectedTable,
          order_type: "DINE_IN",
          items: cart.map(i => ({
            menu_item_id: i.menuItemId,
            quantity: i.quantity,
            unit_price: i.price,
            customizations: Object.keys(i.selectedCustomizations).length > 0 ? i.selectedCustomizations : null
          })),
          notes: orderNotes
        })
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to place order"); return }
      await fetchActiveOrders()
      setCart([]); setOrderNotes(""); setSelectedTable(""); setShowOrderModal(false); setActiveTab("orders")
    } catch { setError("Network error. Please try again.") }
  }

  const handleMarkDelivered = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" })
      })
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId))
      }
    } catch (err) {
      console.error("Failed to mark order as delivered", err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
      case "PREPARING":
        return "bg-blue-500/20 text-blue-500 border border-blue-500/30"
      case "READY":
        return "bg-emerald-500/25 text-emerald-400 border border-emerald-500/35 animate-pulse font-extrabold"
      case "COMPLETED":
        return "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30"
      default:
        return "bg-zinc-500/20 text-zinc-400"
    }
  }

  // Category hierarchy computed values
  const parentCategories = categories.filter(c => !c.parent_id)
  const subCategories = categories.filter(c => c.parent_id === activeParentId)

  const filteredMenuItems = menuItems.filter(item => {
    const matchSearch = item.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    if (activeSubCatId === "all") {
      return matchSearch && (item.category_id === activeParentId || subCategories.some(s => s.id === item.category_id))
    }
    return matchSearch && item.category_id === activeSubCatId
  })

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)

  // Group tables into My Tables and Other Tables
  const myTables = tables.filter(t => t.waiter_id === me?.id)
  const otherTables = tables.filter(t => t.waiter_id !== me?.id)

  if (loading && restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm text-[var(--muted)]">Loading Waiter Station…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Waiter Station 🤵</h1>
          <p className="text-[var(--muted)]">
            Active User: <strong className="text-white">{me?.name || "Loading..."}</strong> • Manage your assigned tables and ready orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {restaurants.length > 0 && (
            <select
              value={selectedRestId}
              onChange={e => handleRestaurantChange(e.target.value)}
              className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}

          <Button 
            onClick={() => setShowOrderModal(true)} 
            className="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white shadow-lg font-bold"
          >
            <Plus className="w-4 h-4 mr-2" /> New Order
          </Button>
        </div>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--muted)] font-bold uppercase tracking-wider">My Tables</p>
              <p className="text-3xl font-black mt-1">
                {myTables.filter(t => getTableStatus(t.id) === "OCCUPIED").length} / {myTables.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--muted)] font-bold uppercase tracking-wider">My Active Orders</p>
              <p className="text-3xl font-black mt-1">
                {orders.filter(o => o.waiter_id === me?.id || (o.table_id && myTables.some(t => t.id === o.table_id))).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--muted)] font-bold uppercase tracking-wider">Ready to Serve</p>
              <p className="text-3xl font-black mt-1 text-emerald-400 animate-pulse">
                {orders.filter(o => (o.waiter_id === me?.id || (o.table_id && myTables.some(t => t.id === o.table_id))) && o.status === "READY").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column: Tabs & Layouts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab buttons */}
          <div className="flex border-b border-[var(--surface-border)]">
            <button
              onClick={() => setActiveTab("tables")}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
                activeTab === "tables" 
                  ? "border-[var(--color-primary-600)] text-[var(--color-primary-600)]" 
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Tables Layout
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
                activeTab === "orders" 
                  ? "border-[var(--color-primary-600)] text-[var(--color-primary-600)]" 
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Active Orders ({orders.filter(o => o.waiter_id === me?.id || (o.table_id && myTables.some(t => t.id === o.table_id))).length})
            </button>
          </div>

          {activeTab === "tables" ? (
            <div className="space-y-6">
              {/* My Tables section */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> My Assigned Tables ({myTables.length})
                </h3>
                {myTables.length === 0 ? (
                  <div className="p-8 border border-dashed border-[var(--surface-border)] rounded-2xl text-center text-[var(--muted)] text-xs">
                    No tables assigned to you by manager.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {myTables.map(table => {
                      const tableStatus = getTableStatus(table.id)
                      const tableReadyOrder = orders.find(o => o.table_id === table.id && o.status === "READY")
                      return (
                        <Card 
                          key={table.id} 
                          className={`group relative overflow-hidden transition-all duration-300 border-[var(--surface-border)] hover:border-blue-500/40 ${
                            tableReadyOrder
                              ? "bg-emerald-500/5 ring-1 ring-emerald-500/25 border-emerald-500/40"
                              : tableStatus === "OCCUPIED" 
                              ? "bg-blue-500/5" 
                              : "bg-emerald-500/5"
                          }`}
                        >
                          <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-3">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[var(--surface-hover)]">
                              Table {table.table_number}
                            </span>
                            
                            <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center border shadow-inner">
                              <Users className="w-5 h-5 text-[var(--muted)]" />
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-xs text-[var(--muted)]">{table.capacity} seats</p>
                              {tableReadyOrder ? (
                                <p className="text-xs font-black text-emerald-400 animate-pulse uppercase">READY TO SERVE</p>
                              ) : (
                                <p className={`text-xs font-bold ${
                                  tableStatus === "AVAILABLE" ? "text-emerald-500" : "text-blue-500"
                                }`}>
                                  {tableStatus}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col gap-1 w-full mt-2">
                              {tableStatus === "AVAILABLE" && (
                                <Button 
                                  onClick={() => {
                                    setSelectedTable(table.id)
                                    setShowOrderModal(true)
                                  }} 
                                  size="sm" 
                                  className="w-full text-[10px] h-7 bg-blue-600 hover:bg-blue-500 text-white font-bold"
                                >
                                  Take Order
                                </Button>
                              )}
                              {tableStatus === "OCCUPIED" && (
                                <>
                                  {tableReadyOrder && (
                                    <Button 
                                      onClick={() => handleMarkDelivered(tableReadyOrder.id)} 
                                      size="sm" 
                                      className="w-full text-[10px] h-7 bg-emerald-600 hover:bg-emerald-500 text-white font-bold animate-pulse"
                                    >
                                      Serve Order
                                    </Button>
                                  )}
                                  <Button 
                                    onClick={() => handleClearTable(table.id)} 
                                    size="sm" 
                                    className="w-full text-[10px] h-7 bg-zinc-700 hover:bg-zinc-600 text-white font-bold"
                                  >
                                    Clear Table
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Other Tables section */}
              <div className="space-y-3 pt-4 border-t border-[var(--surface-border)]">
                <h3 className="text-sm font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--muted)]" /> Other Tables ({otherTables.length})
                </h3>
                {otherTables.length === 0 ? (
                  <div className="p-8 border border-dashed border-[var(--surface-border)] rounded-2xl text-center text-[var(--muted)] text-xs">
                    No other tables registered.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 opacity-75">
                    {otherTables.map(table => {
                      const tableStatus = getTableStatus(table.id)
                      return (
                        <Card 
                          key={table.id} 
                          className={`group relative overflow-hidden transition-all duration-300 border-[var(--surface-border)] ${
                            tableStatus === "OCCUPIED" ? "bg-blue-500/5" : "bg-zinc-800/10"
                          }`}
                        >
                          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2.5">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[var(--surface-hover)]">
                              Table {table.table_number}
                            </span>
                            <p className="text-[10px] text-[var(--muted)]">{table.capacity} seats</p>
                            <p className="text-[10px] text-zinc-500 font-semibold truncate max-w-full">
                              Waiter: {table.waiter?.full_name || "None"}
                            </p>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.filter(o => o.waiter_id === me?.id || (o.table_id && myTables.some(t => t.id === o.table_id))).map(order => (
                <Card key={order.id} className="glass overflow-hidden hover:border-blue-500/20 transition-all">
                  <div className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-white text-md">ORDER #{order.id.slice(-6).toUpperCase()}</span>
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)]">
                        {order.table ? `Table ${order.table.table_number}` : "Takeaway"} • Placed {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {order.notes && (
                        <p className="text-xs text-amber-500/90 font-medium flex items-center gap-1.5 bg-amber-500/5 px-2.5 py-1 rounded border border-amber-500/15 w-fit">
                          <MessageSquare className="w-3.5 h-3.5" /> Note: {order.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 items-end shrink-0">
                      <p className="font-black text-lg text-white">${parseFloat(order.total_amount.toString()).toFixed(2)}</p>
                      {order.status === "READY" && (
                        <Button 
                          onClick={() => handleMarkDelivered(order.id)} 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                          Mark Served & Complete
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Items list */}
                  <div className="bg-[var(--surface-hover)]/30 border-t border-[var(--surface-border)] px-5 py-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[var(--muted)]">
                          <span>
                            <span className="text-[var(--foreground)] font-semibold">{it.quantity}x</span> {it.menu_item.display_name}
                          </span>
                          <span>${(parseFloat(it.unit_price.toString()) * it.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}

              {orders.filter(o => o.waiter_id === me?.id || (o.table_id && myTables.some(t => t.id === o.table_id))).length === 0 && (
                <div className="py-12 text-center text-[var(--muted)]">No active orders found.</div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Alerts and Notifications panel */}
        <div className="space-y-6">
          <Card className="glass h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Ready to Serve Alerts</CardTitle>
                <CardDescription>Real-time notifications for your tables.</CardDescription>
              </div>
              {orders.filter(o => (o.waiter_id === me?.id || (o.table_id && myTables.some(t => t.id === o.table_id))) && o.status === "READY").length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {orders.filter(o => (o.waiter_id === me?.id || (o.table_id && myTables.some(t => t.id === o.table_id))) && o.status === "READY").map(o => (
                <div 
                  key={o.id} 
                  className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between animate-fade-in"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Table {o.table?.table_number || "Takeaway"}
                      </span>
                      <p className="text-sm font-semibold text-white">Items Ready!</p>
                    </div>
                    <p className="text-[10px] text-[var(--muted)]">
                      {o.items.length} items • click Serve to deliver.
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleMarkDelivered(o.id)} 
                    size="sm" 
                    className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 font-semibold"
                  >
                    Serve
                  </Button>
                </div>
              ))}

              {orders.filter(o => o.waiter_id === me?.id && o.status === "READY").length === 0 && (
                <div className="py-12 text-center text-[var(--muted)] text-sm">
                  ✨ No active serve alerts. Nice job!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Place Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-55 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#030712] border border-white/5 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0b0f19]">
              <div>
                <h2 className="text-lg font-black text-white">New Table Order</h2>
                <p className="text-[10px] text-gray-400">Select items from categories and customize to add to ticket.</p>
              </div>
              <button 
                onClick={() => {
                  setShowOrderModal(false)
                  setCart([])
                  setOrderNotes("")
                  setSelectedTable("")
                }} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Left Side: Catalog Selector */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#030712]">
                
                {/* Search & Parent Categories Horizontal Scroll */}
                <div className="p-4 border-b border-white/5 space-y-3 bg-[#0b0f19]/30">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                    <Input 
                      placeholder="Search menu items..." 
                      className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder-gray-500 text-xs rounded-xl"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Horizontal Scroll Parent Categories */}
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {parentCategories.map(pc => {
                      const isActive = activeParentId === pc.id
                      return (
                        <button
                          key={pc.id}
                          type="button"
                          onClick={() => {
                            setActiveParentId(pc.id)
                            setActiveSubCatId("all")
                          }}
                          className={`shrink-0 px-4 py-2 rounded-full text-[11px] font-bold transition-all ${
                            isActive 
                              ? "bg-amber-500 text-black shadow-md shadow-amber-500/10" 
                              : "bg-white/5 text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          {pc.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Subcategory Sidebar + Menu Items Grid */}
                <div className="flex-1 flex overflow-hidden min-h-0">
                  {/* Left Sidebar: Subcategories */}
                  <div className="w-24 border-r border-white/5 bg-[#0b0f19]/40 overflow-y-auto shrink-0 py-2">
                    {parentCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveSubCatId("all")}
                        className={`w-full text-left px-3 py-3 text-[11px] font-medium border-l-2 transition-all leading-snug flex items-center justify-between ${
                          activeSubCatId === "all"
                            ? "bg-amber-500/5 text-amber-500 border-amber-500 font-black"
                            : "text-gray-400 border-transparent hover:bg-white/5"
                        }`}
                      >
                        All Items
                      </button>
                    )}
                    {subCategories.map(sc => {
                      const isActive = activeSubCatId === sc.id
                      return (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => setActiveSubCatId(sc.id)}
                          className={`w-full text-left px-3 py-3 text-[11px] font-medium border-l-2 transition-all leading-snug flex items-center justify-between ${
                            isActive
                              ? "bg-amber-500/5 text-amber-500 border-amber-500 font-black"
                              : "text-gray-400 border-transparent hover:bg-white/5"
                          }`}
                        >
                          {sc.name}
                        </button>
                      )
                    })}
                  </div>

                  {/* Right: Scrollable Grid list of Menu Items */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredMenuItems.map(item => {
                      const itemPrice = parseFloat(item.price.toString())
                      const inCartCount = cart
                        .filter(c => c.menuItemId === item.id)
                        .reduce((sum, cur) => sum + cur.quantity, 0)

                      return (
                        <div
                          key={item.id}
                          onClick={() => openItemDetail(item)}
                          className="w-full bg-[#0b0f19] border border-white/5 rounded-xl flex gap-3 p-2.5 hover:border-amber-500/20 transition-all cursor-pointer relative group"
                        >
                          {/* Image */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#030712] border border-white/5 flex items-center justify-center">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">🍽️</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-xs text-white leading-tight line-clamp-1 group-hover:text-amber-500 transition-colors">
                                {item.display_name}
                              </h3>
                              {item.description && (
                                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 leading-normal">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-1.5" onClick={e => e.stopPropagation()}>
                              <span className="text-amber-500 font-extrabold text-xs">${itemPrice.toFixed(2)}</span>
                              
                              <div>
                                {inCartCount > 0 ? (
                                  <div className="flex items-center gap-2 bg-amber-500 rounded-lg px-2 py-0.5 text-black">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const idx = cart.findIndex(c => c.menuItemId === item.id && Object.keys(c.selectedCustomizations).length === 0)
                                        if (idx >= 0) updateCartQty(idx, -1)
                                      }}
                                      className="font-black text-xs w-4 h-4 flex items-center justify-center"
                                    >
                                      −
                                    </button>
                                    <span className="font-black text-xs">{inCartCount}</span>
                                    <button
                                      type="button"
                                      onClick={() => addToCartDirectly(item)}
                                      className="font-black text-xs w-4 h-4 flex items-center justify-center"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => addToCartDirectly(item)}
                                    className="bg-amber-500 hover:bg-amber-400 text-black rounded-lg px-3 py-1 text-[10px] font-black transition-all"
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {filteredMenuItems.length === 0 && (
                      <div className="text-center py-12 text-gray-500 text-xs">
                        No items found matching search filters.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Table Ticket details */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 bg-[#0b0f19] p-5 flex flex-col min-h-0 shrink-0">
                <form onSubmit={handleCreateOrder} className="flex flex-col h-full min-h-0 gap-4">
                  {/* Choose Table */}
                  <div className="space-y-1.5 shrink-0">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Table</label>
                    <select
                      value={selectedTable}
                      onChange={e => setSelectedTable(e.target.value)}
                      required
                      className="w-full h-10 bg-[#030712] border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">-- Choose table --</option>
                      {myTables.map(t => (
                        <option key={t.id} value={t.id}>
                          Table {t.table_number} ({getTableStatus(t.id) === "AVAILABLE" ? "Free" : "Occupied"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cart List */}
                  <div className="flex-1 flex flex-col min-h-0 overflow-y-auto py-2 border-y border-white/5 space-y-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Order Ticket Items</span>
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex gap-2.5 bg-[#030712] border border-white/5 rounded-xl p-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-white leading-tight truncate">{item.name}</p>
                          {Object.entries(item.selectedCustomizations).map(([k, v]) => (
                            <p key={k} className="text-[9px] text-amber-500 font-semibold mt-0.5">
                              • {k}: {Array.isArray(v) ? v.join(", ") : v}
                            </p>
                          ))}
                          {item.notes && (
                            <p className="text-[9px] text-gray-400 italic mt-0.5 line-clamp-1">"{item.notes}"</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end justify-between shrink-0">
                          <span className="text-amber-500 font-extrabold text-xs">${(item.price * item.quantity).toFixed(2)}</span>
                          <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-1.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateCartQty(idx, -1)}
                              className="font-bold text-[10px] text-white w-3.5 h-3.5 flex items-center justify-center hover:text-amber-500"
                            >
                              −
                            </button>
                            <span className="font-bold text-[10px] text-white min-w-[8px] text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(idx, 1)}
                              className="font-bold text-[10px] text-white w-3.5 h-3.5 flex items-center justify-center hover:text-amber-500"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {cart.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 py-12">
                        <ShoppingBag className="w-8 h-8 mb-2 opacity-50 text-gray-600" />
                        <p className="text-xs">Cart is empty</p>
                      </div>
                    )}
                  </div>

                  {/* Ticket Instruction Notes */}
                  <div className="space-y-1 shrink-0">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chef Instructions</label>
                    <Input
                      placeholder="E.g., Extra hot sauce, no sesame..."
                      value={orderNotes}
                      onChange={e => setOrderNotes(e.target.value)}
                      className="bg-[#030712] border-white/10 text-xs text-white"
                    />
                  </div>

                  {/* Summary & Place Order */}
                  <div className="mt-auto pt-3 border-t border-white/5 space-y-3 shrink-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-300">Total:</span>
                      <span className="font-black text-sm text-amber-500">${cartTotal.toFixed(2)}</span>
                    </div>

                    {error && (
                      <p className="text-[10px] text-red-500 bg-red-950/20 border border-red-500/20 rounded-lg p-2 leading-relaxed">
                        {error}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={!selectedTable || cart.length === 0}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs py-3.5 rounded-xl transition-all"
                    >
                      Place Order · ${cartTotal.toFixed(2)}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* FULL COVERED MENU ITEM DETAIL PAGE OVERLAY */}
            {selectedItem && (
              <div className="absolute inset-0 z-50 bg-[#030712] text-white flex flex-col w-full h-full overflow-y-auto">
                <div className="absolute top-4 left-4 z-10">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full border border-white/10 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative h-56 bg-gray-900 w-full shrink-0 flex items-center justify-center border-b border-white/5">
                  {selectedItem.image_url ? (
                    <img src={selectedItem.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">🍽️</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="flex-1 px-5 py-6 max-w-xl mx-auto w-full space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black">{selectedItem.display_name}</h2>
                      <p className="text-[9px] text-amber-500 font-bold mt-0.5 uppercase tracking-wider">
                        {categories.find(c => c.id === selectedItem.category_id)?.name || "Menu Item"}
                      </p>
                    </div>
                    <span className="text-amber-500 font-extrabold text-lg shrink-0">
                      ${parseFloat(selectedItem.price.toString()).toFixed(2)}
                    </span>
                  </div>

                  {selectedItem.description && (
                    <div className="space-y-1 bg-white/5 rounded-xl p-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-60">Description</h4>
                      <p className="text-xs leading-relaxed opacity-90">{selectedItem.description}</p>
                    </div>
                  )}

                  {selectedItem.customizations && selectedItem.customizations.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider opacity-60">Customizations</h3>
                      {selectedItem.customizations.map(cust => (
                        <div key={cust.key} className="space-y-2 bg-[#0b0f19] border border-white/5 rounded-xl p-3">
                          <p className="text-xs font-bold flex items-center gap-1.5">
                            <span>{cust.label}</span>
                            {cust.multiple && (
                              <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                Multi-select
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {cust.values.map(val => {
                              const valName = typeof val === "string" ? val : val.name
                              const valPrice = typeof val === "string" ? 0 : val.extraPrice
                              const selected = cust.multiple
                                ? (itemCustomizations[cust.key] as string[] || []).includes(valName)
                                : itemCustomizations[cust.key] === valName
                              return (
                                <button
                                  key={valName}
                                  type="button"
                                  onClick={() => {
                                    if (cust.multiple) {
                                      const current = (itemCustomizations[cust.key] as string[] || [])
                                      const updated = selected ? current.filter(v => v !== valName) : [...current, valName]
                                      setItemCustomizations(prev => ({ ...prev, [cust.key]: updated }))
                                    } else {
                                      setItemCustomizations(prev => ({ ...prev, [cust.key]: selected ? "" : valName }))
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                    selected
                                      ? "bg-amber-500 border-amber-500 text-black shadow-md"
                                      : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                                  }`}
                                >
                                  {valName} {valPrice > 0 ? `(+$${valPrice.toFixed(2)})` : ""}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-semibold opacity-60 mb-1">Item Notes</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. no onions, extra cheese..."
                      value={itemNotes}
                      onChange={e => setItemNotes(e.target.value)}
                      className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2 text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-3 bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setItemQty(q => Math.max(1, q - 1))}
                        className="font-bold text-base hover:text-amber-500"
                      >
                        −
                      </button>
                      <span className="font-extrabold text-sm w-4 text-center">{itemQty}</span>
                      <button
                        type="button"
                        onClick={() => setItemQty(q => q + 1)}
                        className="font-bold text-base hover:text-amber-500"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={addToCartFromDetail}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl transition-all shadow-md text-xs sm:text-sm"
                    >
                      Add to Cart — ${(getCustomizedPrice(selectedItem, itemCustomizations) * itemQty).toFixed(2)}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
