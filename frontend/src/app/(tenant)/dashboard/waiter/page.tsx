"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Utensils, Plus, Minus, ShoppingBag, Bell, 
  ClipboardList, CheckCircle2, Users, Search, 
  Sparkles, Coffee, Pizza, Wine, IceCream, MessageSquare
} from "lucide-react"

// Mock Initial Data for Waiter Station
const INITIAL_TABLES = [
  { id: "t1", tableNumber: "101", capacity: 2, status: "AVAILABLE" },
  { id: "t2", tableNumber: "102", capacity: 4, status: "OCCUPIED" },
  { id: "t3", tableNumber: "103", capacity: 4, status: "RESERVED" },
  { id: "t4", tableNumber: "104", capacity: 6, status: "AVAILABLE" },
  { id: "t5", tableNumber: "105", capacity: 2, status: "OCCUPIED" },
  { id: "t6", tableNumber: "201", capacity: 8, status: "AVAILABLE" },
  { id: "t7", tableNumber: "202", capacity: 4, status: "DIRTY" },
  { id: "t8", tableNumber: "203", capacity: 4, status: "AVAILABLE" },
]

const MENU_ITEMS = [
  { id: "m1", name: "Truffle Fries", price: 12.99, category: "Appetizers" },
  { id: "m2", name: "Crispy Calamari", price: 15.99, category: "Appetizers" },
  { id: "m3", name: "Grand Horizon Burger", price: 19.99, category: "Mains" },
  { id: "m4", name: "Pan-Seared Salmon", price: 28.99, category: "Mains" },
  { id: "m5", name: "Wild Mushroom Risotto", price: 24.99, category: "Mains" },
  { id: "m6", name: "Craft IPA Beer", price: 7.99, category: "Drinks" },
  { id: "m7", name: "Chardonnay White Wine", price: 11.99, category: "Drinks" },
  { id: "m8", name: "Lava Chocolate Cake", price: 9.99, category: "Desserts" },
]

const INITIAL_ORDERS = [
  {
    id: "o1",
    orderNumber: "ORD-9481",
    tableNumber: "102",
    status: "PREPARING",
    items: [
      { name: "Grand Horizon Burger", quantity: 2, price: 19.99 },
      { name: "Truffle Fries", quantity: 1, price: 12.99 },
      { name: "Craft IPA Beer", quantity: 2, price: 7.99 }
    ],
    total: 80.95,
    createdAt: "10 mins ago",
    notes: "No onions on one burger"
  },
  {
    id: "o2",
    orderNumber: "ORD-9482",
    tableNumber: "105",
    status: "READY",
    items: [
      { name: "Pan-Seared Salmon", quantity: 1, price: 28.99 },
      { name: "Chardonnay White Wine", quantity: 1, price: 11.99 }
    ],
    total: 40.98,
    createdAt: "22 mins ago",
    notes: ""
  }
]

const INITIAL_REQUESTS = [
  { id: "r1", tableNumber: "102", type: "Needs Water", time: "2 mins ago" },
  { id: "r2", tableNumber: "105", type: "Request Bill", time: "5 mins ago" }
]

export default function WaiterDashboard() {
  const [tables, setTables] = React.useState(INITIAL_TABLES)
  const [orders, setOrders] = React.useState(INITIAL_ORDERS)
  const [requests, setRequests] = React.useState(INITIAL_REQUESTS)
  const [activeTab, setActiveTab] = React.useState<"tables" | "orders">("tables")
  
  // New Order Modal State
  const [showOrderModal, setShowOrderModal] = React.useState(false)
  const [selectedTable, setSelectedTable] = React.useState<string>("")
  const [cart, setCart] = React.useState<{ menuItemId: string; name: string; price: number; quantity: number }[]>([])
  const [orderNotes, setOrderNotes] = React.useState("")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("All")

  const handleStatusChange = (tableId: string, newStatus: string) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: newStatus } : t))
  }

  const addToCart = (item: typeof MENU_ITEMS[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id)
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.menuItemId === itemId) {
        const newQty = i.quantity + delta
        return newQty > 0 ? { ...i, quantity: newQty } : null
      }
      return i
    }).filter(Boolean) as typeof cart)
  }

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTable || cart.length === 0) return

    const tableObj = tables.find(t => t.id === selectedTable)
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const newOrder = {
      id: `o_${Date.now()}`,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      tableNumber: tableObj?.tableNumber || "N/A",
      status: "PENDING",
      items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
      total: parseFloat(total.toFixed(2)),
      createdAt: "Just now",
      notes: orderNotes
    }

    setOrders(prev => [newOrder, ...prev])
    setTables(prev => prev.map(t => t.id === selectedTable ? { ...t, status: "OCCUPIED" } : t))
    
    // Reset Cart and Close Modal
    setCart([])
    setOrderNotes("")
    setSelectedTable("")
    setShowOrderModal(false)
    setActiveTab("orders")
  }

  const resolveRequest = (reqId: string) => {
    setRequests(prev => prev.filter(r => r.id !== reqId))
  }

  const handleMarkDelivered = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "COMPLETED" } : o))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
      case "PREPARING":
        return "bg-blue-500/20 text-blue-500 border border-blue-500/30"
      case "READY":
        return "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 animate-pulse"
      case "COMPLETED":
        return "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30"
      default:
        return "bg-zinc-500/20 text-zinc-400"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Appetizers": return <Coffee className="w-4 h-4" />
      case "Mains": return <Pizza className="w-4 h-4" />
      case "Drinks": return <Wine className="w-4 h-4" />
      case "Desserts": return <IceCream className="w-4 h-4" />
      default: return <Utensils className="w-4 h-4" />
    }
  }

  const filteredMenuItems = MENU_ITEMS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = categoryFilter === "All" || item.category === categoryFilter
    return matchesSearch && matchesCat
  })

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Waiter Station 🤵</h1>
          <p className="text-[var(--muted)]">Manage table states, customer assistance requests, and take table orders.</p>
        </div>
        <Button 
          onClick={() => setShowOrderModal(true)} 
          className="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> New Order
        </Button>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted)] font-medium">Occupied Tables</p>
              <p className="text-3xl font-bold mt-1">
                {tables.filter(t => t.status === "OCCUPIED").length} / {tables.length}
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
              <p className="text-sm text-[var(--muted)] font-medium">Active Orders</p>
              <p className="text-3xl font-bold mt-1">
                {orders.filter(o => o.status !== "COMPLETED").length}
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
              <p className="text-sm text-[var(--muted)] font-medium">Pending Assistance</p>
              <p className="text-3xl font-bold mt-1 text-orange-500">
                {requests.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-orange-500" />
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
              Active Orders ({orders.filter(o => o.status !== "COMPLETED").length})
            </button>
          </div>

          {activeTab === "tables" ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {tables.map(table => (
                <Card 
                  key={table.id} 
                  className={`group relative overflow-hidden transition-all duration-300 border-[var(--surface-border)] hover:border-[var(--color-primary-500)]/40 ${
                    table.status === "OCCUPIED" ? "bg-blue-500/5" :
                    table.status === "RESERVED" ? "bg-amber-500/5" :
                    table.status === "DIRTY" ? "bg-red-500/5" : "bg-emerald-500/5"
                  }`}
                >
                  <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[var(--surface-hover)]">
                      Table {table.tableNumber}
                    </span>
                    
                    <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center border shadow-inner">
                      <Users className="w-5 h-5 text-[var(--muted)]" />
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--muted)]">{table.capacity} seats</p>
                      <p className={`text-xs font-bold ${
                        table.status === "AVAILABLE" ? "text-emerald-500" :
                        table.status === "OCCUPIED" ? "text-blue-500" :
                        table.status === "RESERVED" ? "text-amber-500" : "text-red-500"
                      }`}>
                        {table.status}
                      </p>
                    </div>

                    {/* Quick actions for table status */}
                    <div className="flex gap-1 w-full mt-2">
                      {table.status === "AVAILABLE" && (
                        <Button 
                          onClick={() => {
                            setSelectedTable(table.id)
                            setShowOrderModal(true)
                          }} 
                          size="sm" 
                          className="w-full text-[10px] h-7 bg-blue-600 hover:bg-blue-500 text-white"
                        >
                          Seat & Order
                        </Button>
                      )}
                      {table.status === "OCCUPIED" && (
                        <Button 
                          onClick={() => handleStatusChange(table.id, "DIRTY")} 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-[10px] h-7"
                        >
                          Mark Clean-up
                        </Button>
                      )}
                      {table.status === "DIRTY" && (
                        <Button 
                          onClick={() => handleStatusChange(table.id, "AVAILABLE")} 
                          size="sm" 
                          className="w-full text-[10px] h-7 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          Mark Clean
                        </Button>
                      )}
                      {table.status === "RESERVED" && (
                        <Button 
                          onClick={() => handleStatusChange(table.id, "OCCUPIED")} 
                          size="sm" 
                          className="w-full text-[10px] h-7 bg-amber-600 hover:bg-amber-500 text-white"
                        >
                          Arrived
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <Card key={order.id} className="glass overflow-hidden hover:border-blue-500/20 transition-all">
                  <div className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">{order.orderNumber}</span>
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)]">
                        Table {order.tableNumber} • Created {order.createdAt}
                      </p>
                      {order.notes && (
                        <p className="text-xs text-amber-500/90 font-medium flex items-center gap-1.5 bg-amber-500/5 px-2.5 py-1 rounded border border-amber-500/15 w-fit">
                          <MessageSquare className="w-3.5 h-3.5" /> Note: {order.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                      {order.status === "READY" && (
                        <Button 
                          onClick={() => handleMarkDelivered(order.id)} 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Items expansion */}
                  <div className="bg-[var(--surface-hover)]/30 border-t border-[var(--surface-border)] px-5 py-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[var(--muted)]">
                          <span>
                            <span className="text-[var(--foreground)] font-semibold">{it.quantity}x</span> {it.name}
                          </span>
                          <span>${(it.price * it.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}

              {orders.length === 0 && (
                <div className="py-12 text-center text-[var(--muted)]">No orders placed yet.</div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Customer Assistance Notifications */}
        <div className="space-y-6">
          <Card className="glass h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Assistance Requests</CardTitle>
                <CardDescription>Real-time customer requests from tables.</CardDescription>
              </div>
              {requests.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {requests.map(req => (
                <div 
                  key={req.id} 
                  className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 flex items-center justify-between animate-fade-in"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                        T-{req.tableNumber}
                      </span>
                      <p className="text-sm font-semibold">{req.type}</p>
                    </div>
                    <p className="text-[10px] text-[var(--muted)]">{req.time}</p>
                  </div>
                  <Button 
                    onClick={() => resolveRequest(req.id)} 
                    size="sm" 
                    className="h-8 bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3"
                  >
                    Resolve
                  </Button>
                </div>
              ))}

              {requests.length === 0 && (
                <div className="py-12 text-center text-[var(--muted)] text-sm">
                  ✨ No active assistance requests. Nice job!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Place Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--surface-border)] flex justify-between items-center bg-[var(--surface-hover)]/30">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[var(--color-primary-600)]" />
                  Take Table Order
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">Select items to place on table ticket.</p>
              </div>
              <button 
                onClick={() => setShowOrderModal(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-hover)] text-[var(--muted)]"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Column: Menu Picker */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--muted)]" />
                    <Input 
                      placeholder="Search items..." 
                      className="pl-9 h-10 bg-[var(--surface-hover)]/50"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {/* Category filters */}
                  <div className="flex gap-1 overflow-x-auto pb-1 shrink-0">
                    {["All", "Appetizers", "Mains", "Drinks", "Desserts"].map(cat => (
                      <Button
                        key={cat}
                        type="button"
                        variant={categoryFilter === cat ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCategoryFilter(cat)}
                        className="h-10 text-xs px-3"
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredMenuItems.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => addToCart(item)}
                      className="p-4 text-left border rounded-xl hover:border-[var(--color-primary-500)] bg-[var(--surface-hover)]/20 hover:bg-[var(--surface-hover)]/50 transition-all flex items-center justify-between group active:scale-98"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--muted)] group-hover:text-[var(--color-primary-600)] transition-colors">
                            {getCategoryIcon(item.category)}
                          </span>
                          <span className="font-semibold text-sm">{item.name}</span>
                        </div>
                        <p className="text-xs text-[var(--muted)]">{item.category}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-[var(--color-primary-600)]">${item.price.toFixed(2)}</span>
                        <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-600)]/10 text-[var(--color-primary-600)] flex items-center justify-center font-bold text-sm group-hover:bg-[var(--color-primary-600)] group-hover:text-white transition-colors">
                          +
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredMenuItems.length === 0 && (
                    <div className="col-span-full py-8 text-center text-[var(--muted)] text-sm">No items found matching search.</div>
                  )}
                </div>
              </div>

              {/* Right Column: Order Details & Cart */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[var(--surface-border)] bg-[var(--surface-hover)]/10 p-6 flex flex-col">
                <form onSubmit={handleCreateOrder} className="flex flex-col h-full gap-4">
                  {/* Select Table */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Select Table</label>
                    <select 
                      value={selectedTable} 
                      onChange={e => setSelectedTable(e.target.value)}
                      required
                      className="w-full h-10 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    >
                      <option value="">-- Choose table --</option>
                      {tables.map(t => (
                        <option key={t.id} value={t.id}>
                          Table {t.tableNumber} ({t.status === "AVAILABLE" ? "Free" : t.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cart Items */}
                  <div className="flex-1 flex flex-col min-h-[150px] overflow-y-auto space-y-3 pr-1 py-2 border-y border-[var(--surface-border)]">
                    <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block">Order Items</span>
                    {cart.map(item => (
                      <div key={item.menuItemId} className="flex justify-between items-center text-sm">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-medium truncate text-xs">{item.name}</p>
                          <p className="text-[10px] text-[var(--muted)]">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.menuItemId, -1)}
                            className="w-5 h-5 rounded bg-[var(--surface-hover)] flex items-center justify-center hover:bg-[var(--surface-border)] text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.menuItemId, 1)}
                            className="w-5 h-5 rounded bg-[var(--surface-hover)] flex items-center justify-center hover:bg-[var(--surface-border)] text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-[var(--muted)] py-8">
                        <ShoppingBag className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-xs">Ticket is empty</p>
                      </div>
                    )}
                  </div>

                  {/* Order Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Kitchen Notes</label>
                    <Input 
                      placeholder="e.g. Allergy info, spicy level" 
                      value={orderNotes}
                      onChange={e => setOrderNotes(e.target.value)}
                      className="bg-[var(--surface)] text-xs"
                    />
                  </div>

                  {/* Summary & Submit */}
                  <div className="mt-auto pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">Total:</span>
                      <span className="font-black text-lg text-[var(--color-primary-600)]">
                        ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                      </span>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={!selectedTable || cart.length === 0}
                      className="w-full bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white h-11"
                    >
                      Submit Ticket
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
