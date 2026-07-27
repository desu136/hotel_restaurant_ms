"use client"
import * as React from "react"
import { Bell, ClipboardList, RefreshCw, LayoutGrid, Home } from "lucide-react"
import { useWaiterState } from "./components/useWaiterState"
import { WaiterHeader } from "./components/WaiterHeader"
import { WaiterHomeTab } from "./components/WaiterHomeTab"
import { WaiterTablesTab } from "./components/WaiterTablesTab"
import { WaiterOrdersTab } from "./components/WaiterOrdersTab"
import { WaiterAlertsPanel } from "./components/WaiterAlertsPanel"
import { QRScannerModal } from "./components/QRScannerModal"
import { DeliveryVerificationModal } from "./components/DeliveryVerificationModal"
import { OrderModal } from "./components/OrderModal"
import { ItemDetailOverlay } from "./components/ItemDetailOverlay"
import type { Table, MenuItem, Category, Order } from "./components/types"

export default function WaiterClientView() {
  const state = useWaiterState()
  const { me, restaurants, selectedRestId, setSelectedRestId, branches, selectedBranchId, setSelectedBranchId, tables, menuItems, categories, orders, setOrders, activeTab, setActiveTab, showScannerModal, setShowScannerModal, scannerError, setScannerError, activeQrOrder, setActiveQrOrder, branchWaiters, selectedWaiterId, setSelectedWaiterId, activityLogs, setActivityLogs, orderModalView, setOrderModalView, loading, error, setError, showOrderModal, setShowOrderModal, selectedTable, setSelectedTable, cart, setCart, orderNotes, setOrderNotes, activeParentId, setActiveParentId, activeSubCatId, setActiveSubCatId, searchTerm, setSearchTerm, selectedItem, setSelectedItem, itemCustomizations, setItemCustomizations, itemNotes, setItemNotes, itemQty, setItemQty, fetchRestaurantData, fetchActiveOrders } = state

  const isManager = (me?.roles || []).some(r => ['HOTEL_OWNER', 'HOTEL_MANAGER', 'RESTAURANT_MANAGER'].includes(r))
  const myTables = tables.filter(t => t.waiter_id === me?.id)
  const otherTables = tables.filter(t => t.waiter_id !== me?.id)
  const getTableStatus = (tableId: string) => orders.some(o => o.table_id === tableId) ? "OCCUPIED" : "AVAILABLE"
  const filterMyOrUnassigned = (o: Order) => isManager ? (!selectedWaiterId || o.waiter_id === selectedWaiterId || o.waiter?.id === selectedWaiterId || o.table?.waiter?.id === selectedWaiterId) : (o.waiter_id === me?.id || (o.table_id ? myTables.some(t => t.id === o.table_id) : true))

  const parentCategories = categories.filter(c => !c.parent_id)
  const subCategories = categories.filter(c => c.parent_id === activeParentId)
  const filteredMenuItems = menuItems.filter(item => {
    const matchSearch = item.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    if (activeSubCatId === "all") return matchSearch && (item.category_id === activeParentId || subCategories.some(s => s.id === item.category_id))
    return matchSearch && item.category_id === activeSubCatId
  })
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0)
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)

  const getCustomizedPrice = (item: MenuItem, custs: Record<string, string | string[]>) => {
    let price = parseFloat(item.price.toString())
    if (item.customizations) for (const [key, val] of Object.entries(custs)) {
      const group = item.customizations.find(g => g.key === key)
      if (group) { const vals = Array.isArray(val) ? val : [val]; for (const v of vals) { const choice = group.values.find(c => c.name === v); if (choice?.extraPrice) price += choice.extraPrice } }
    }
    return price
  }

  const handleMarkDelivered = React.useCallback(async (orderId: string) => {
    const res = await fetch(`/api/orders/${orderId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "COMPLETED" }) })
    if (res.ok) { const order = orders.find(o => o.id === orderId); const tbl = order?.table_id ? tables.find(t => t.id === order.table_id) : null; setActivityLogs(prev => [{ id: Math.random().toString(), type: "serve_order", message: `Served Order to ${tbl ? `Table T${tbl.table_number}` : "Customer"}`, timestamp: "Just now" }, ...prev]); setOrders(prev => prev.filter(o => o.id !== orderId)) }
  }, [orders, tables, setActivityLogs, setOrders])

  const handleQRScan = React.useCallback((codeString: string) => {
    if (codeString.startsWith("order_delivery:")) { handleMarkDelivered(codeString.substring("order_delivery:".length)); setShowScannerModal(false); setScannerError(null); return }
    let tableId: string | null = null
    try { const url = new URL(codeString); tableId = url.searchParams.get("tableId") } catch { const m = codeString.match(/[?&]tableId=([^&]+)/); tableId = m ? m[1] : null }
    if (!tableId) { const ft = tables.find(t => t.id === codeString || t.table_number === codeString); if (ft) tableId = ft.id }
    if (tableId) {
      const matchedTable = tables.find(t => t.id === tableId)
      if (matchedTable) { setSelectedTable(matchedTable.id); setOrderModalView("catalog"); setCart([]); setShowOrderModal(true); setShowScannerModal(false); setScannerError(null); setActivityLogs(prev => [{ id: Math.random().toString(), type: "create_order", message: `Scanned Table T${matchedTable.table_number} QR Code`, timestamp: "Just now" }, ...prev]); return }
    }
    alert(`Invalid QR code: ${codeString}`)
  }, [tables, handleMarkDelivered, setSelectedTable, setOrderModalView, setCart, setShowOrderModal, setShowScannerModal, setScannerError, setActivityLogs])

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedTable || cart.length === 0) return; setError("")
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table_id: selectedTable, order_type: "DINE_IN", items: cart.map(i => ({ menu_item_id: i.menuItemId, quantity: i.quantity, unit_price: i.price, customizations: Object.keys(i.selectedCustomizations).length > 0 ? i.selectedCustomizations : null })), notes: orderNotes }) })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to place order"); return }
      await fetchActiveOrders(); setCart([]); setOrderNotes(""); setSelectedTable(""); setShowOrderModal(false); setActiveTab("orders")
    } catch { setError("Network error. Please try again.") }
  }

  const addToCartDirectly = (item: MenuItem) => {
    setCart(prev => { const idx = prev.findIndex(c => c.menuItemId === item.id && Object.keys(c.selectedCustomizations).length === 0); if (idx >= 0) return prev.map((c, i) => i === idx ? { ...c, quantity: c.quantity + 1 } : c); return [...prev, { menuItemId: item.id, name: item.display_name, price: parseFloat(item.price.toString()), quantity: 1, selectedCustomizations: {}, notes: "", prepTime: item.prep_time }] })
  }

  const addToCartFromDetail = () => {
    if (!selectedItem) return
    const unitPrice = getCustomizedPrice(selectedItem, itemCustomizations)
    setCart(prev => { const idx = prev.findIndex(c => c.menuItemId === selectedItem.id && JSON.stringify(c.selectedCustomizations) === JSON.stringify(itemCustomizations) && c.notes === itemNotes); if (idx >= 0) return prev.map((c, i) => i === idx ? { ...c, quantity: c.quantity + itemQty } : c); return [...prev, { menuItemId: selectedItem.id, name: selectedItem.display_name, price: unitPrice, quantity: itemQty, selectedCustomizations: itemCustomizations, notes: itemNotes, prepTime: selectedItem.prep_time }] })
    setSelectedItem(null)
  }

  const updateCartQty = (idx: number, delta: number) => setCart(prev => prev[idx].quantity + delta <= 0 ? prev.filter((_, i) => i !== idx) : prev.map((c, i) => i === idx ? { ...c, quantity: c.quantity + delta } : c))

  const handleClearTable = async (tableId: string) => {
    if (!confirm("Mark this table as available?")) return
    const tableOrders = orders.filter(o => o.table_id === tableId)
    await Promise.all(tableOrders.map(o => fetch(`/api/orders/${o.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "COMPLETED" }) })))
    const tbl = tables.find(t => t.id === tableId)
    if (tbl) setActivityLogs(prev => [{ id: Math.random().toString(), type: "clear_table", message: `Cleared Table T${tbl.table_number} (Available)`, timestamp: "Just now" }, ...prev])
    await fetchActiveOrders()
  }

  const handleAssignTable = async (orderId: string, tableId: string) => {
    const res = await fetch(`/api/orders/${orderId}/table`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table_id: tableId }) })
    if (res.ok) await fetchActiveOrders(); else alert("Failed to assign table.")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
      case "PREPARING": return "bg-blue-500/20 text-blue-500 border border-blue-500/30"
      case "READY": return "bg-emerald-500/25 text-emerald-400 border border-emerald-500/35 animate-pulse font-extrabold"
      default: return "bg-zinc-500/20 text-zinc-400"
    }
  }

  const readyOrders = orders.filter(o => filterMyOrUnassigned(o) && o.status === "READY")

  if (loading && restaurants.length === 0) return <div className="flex flex-col items-center justify-center py-20 space-y-4"><RefreshCw className="w-8 h-8 animate-spin" /><p className="text-sm text-[var(--muted)]">Loading Waiter Station…</p></div>

  return (
    <div className="space-y-8 pb-24 md:pb-12">
      <WaiterHeader me={me} restaurants={restaurants} selectedRestId={selectedRestId} branches={branches} selectedBranchId={selectedBranchId} myTables={myTables} orders={orders} readyOrdersCount={readyOrders.length} filterMyOrUnassigned={filterMyOrUnassigned} getTableStatus={getTableStatus} onRestChange={id => { setSelectedRestId(id); const bId = branches.filter((b: any) => b.restaurant_id === id)[0]?.id || ""; setSelectedBranchId(bId); if (id) fetchRestaurantData(id, bId) }} onBranchChange={id => { setSelectedBranchId(id); if (selectedRestId) fetchRestaurantData(selectedRestId, id) }} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-row border-b border-[var(--surface-border)] overflow-x-auto scrollbar-none">
            {(["home", "tables", "orders"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all shrink-0 capitalize ${activeTab === tab ? "border-[var(--color-primary-600)]" : "border-transparent hover:text-[var(--foreground)]"}`}>
                {tab === "orders" ? `Active Orders (${orders.filter(filterMyOrUnassigned).length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
            <button onClick={() => setActiveTab("alerts")} className={`lg:hidden px-6 py-3 font-semibold text-sm border-b-2 transition-all shrink-0 flex items-center gap-2 ${activeTab === "alerts" ? "border-[var(--color-primary-600)]" : "border-transparent hover:text-[var(--foreground)]"}`}>
              <span>Alerts</span>{readyOrders.length > 0 && <span className="bg-red-500 text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">{readyOrders.length}</span>}
            </button>
          </div>

          {activeTab === "home" && <WaiterHomeTab activityLogs={activityLogs} onOpenScanner={() => setShowScannerModal(true)} onGoToTables={() => setActiveTab("tables")} />}
          {activeTab === "tables" && <WaiterTablesTab myTables={myTables} otherTables={otherTables} orders={orders} getTableStatus={getTableStatus} onSelectTable={id => { setSelectedTable(id); setOrderModalView("catalog"); setCart([]); setShowOrderModal(true) }} onMarkDelivered={handleMarkDelivered} onClearTable={handleClearTable} />}
          {activeTab === "orders" && <WaiterOrdersTab orders={orders} tables={tables} isManager={isManager} branchWaiters={branchWaiters} selectedWaiterId={selectedWaiterId} filterMyOrUnassigned={filterMyOrUnassigned} getStatusBadge={getStatusBadge} setSelectedWaiterId={setSelectedWaiterId} onMarkDelivered={handleMarkDelivered} onOpenQr={setActiveQrOrder} onAssignTable={handleAssignTable} />}
          {activeTab === "alerts" && <div className="lg:hidden"><WaiterAlertsPanel readyOrders={readyOrders} onMarkDelivered={handleMarkDelivered} onOpenQr={setActiveQrOrder} /></div>}
        </div>

        <div className="hidden lg:block space-y-6"><WaiterAlertsPanel readyOrders={readyOrders} onMarkDelivered={handleMarkDelivered} onOpenQr={setActiveQrOrder} /></div>
      </div>

      <div className={`fixed bottom-0 left-0 right-0 z-40 bg-[#030712] border-t border-white/10 md:hidden flex items-center justify-around px-2 py-3 pb-safe shadow-2xl ${showOrderModal ? 'hidden' : ''}`}>
        {([{ tab: "home", icon: <Home className="w-5 h-5" />, label: "Home" }, { tab: "tables", icon: <LayoutGrid className="w-5 h-5" />, label: "Tables" }, { tab: "orders", icon: <ClipboardList className="w-5 h-5" />, label: "Orders", badge: orders.filter(filterMyOrUnassigned).length }, { tab: "alerts", icon: <Bell className="w-5 h-5" />, label: "Alerts", badge: readyOrders.length, pulse: true }] as any[]).map(({ tab, icon, label, badge, pulse }) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === tab ? "scale-110" : "hover:text-white"}`}>
            {icon}<span className="text-[10px] font-bold">{label}</span>
            {badge > 0 && <span className={`absolute -top-1 -right-2 text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-black ${pulse ? "animate-pulse" : ""}`}>{badge}</span>}
          </button>
        ))}
      </div>

      <QRScannerModal show={showScannerModal} scannerError={scannerError} myTables={myTables} onScan={handleQRScan} onError={err => setScannerError(err)} onClose={() => { setShowScannerModal(false); setScannerError(null) }} onSimulate={table => { setSelectedTable(table.id); setOrderModalView("catalog"); setCart([]); setShowOrderModal(true); setShowScannerModal(false); setActivityLogs(prev => [{ id: Math.random().toString(), type: "create_order", message: `Scanned Table T${table.table_number} QR Code`, timestamp: "Just now" }, ...prev]) }} />
      <DeliveryVerificationModal activeQrOrder={activeQrOrder} onClose={() => setActiveQrOrder(null)} onScanQR={() => setShowScannerModal(true)} onConfirmManual={id => { handleMarkDelivered(id); setActiveQrOrder(null) }} />
      <OrderModal show={showOrderModal} selectedTable={selectedTable} myTables={myTables} cart={cart} orderNotes={orderNotes} orderModalView={orderModalView} searchTerm={searchTerm} parentCategories={parentCategories} subCategories={subCategories} filteredMenuItems={filteredMenuItems} activeParentId={activeParentId} activeSubCatId={activeSubCatId} cartTotal={cartTotal} cartCount={cartCount} error={error} setSearchTerm={setSearchTerm} setActiveParentId={setActiveParentId} setActiveSubCatId={setActiveSubCatId} setOrderModalView={setOrderModalView} setOrderNotes={setOrderNotes} onClose={() => { setShowOrderModal(false); setCart([]); setOrderNotes(""); setSelectedTable("") }} onSubmit={handleCreateOrder} onAddToCartDirectly={addToCartDirectly} onUpdateCartQty={updateCartQty} onOpenItemDetail={item => { setSelectedItem(item); setItemCustomizations({}); setItemNotes(""); setItemQty(1) }} />
      {showOrderModal && <ItemDetailOverlay selectedItem={selectedItem} categories={categories} itemCustomizations={itemCustomizations} itemNotes={itemNotes} itemQty={itemQty} onClose={() => setSelectedItem(null)} onAddToCart={addToCartFromDetail} setItemQty={setItemQty} setItemNotes={setItemNotes} setItemCustomizations={setItemCustomizations} getCustomizedPrice={getCustomizedPrice} />}
    </div>
  )
}
