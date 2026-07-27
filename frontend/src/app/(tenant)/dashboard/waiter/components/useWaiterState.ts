"use client"
import * as React from "react"
import type { Table, MenuItem, CartItem, Category, Order, ActivityLog } from "./types"

interface Me { id: string; name: string; email: string; branchId?: string | null; roles?: string[] }

export function useWaiterState() {
  const [me, setMe] = React.useState<Me | null>(null)
  const [restaurants, setRestaurants] = React.useState<{ id: string; name: string }[]>([])
  const [selectedRestId, setSelectedRestId] = React.useState("")
  const [branches, setBranches] = React.useState<{ id: string; name: string; restaurant_id: string }[]>([])
  const [selectedBranchId, setSelectedBranchId] = React.useState("")
  const [tables, setTables] = React.useState<Table[]>([])
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [orders, setOrders] = React.useState<Order[]>([])
  const [prevReadyIds, setPrevReadyIds] = React.useState<string[]>([])
  const [activeTab, setActiveTab] = React.useState<"home" | "tables" | "orders" | "alerts">("home")
  const [showScannerModal, setShowScannerModal] = React.useState(false)
  const [scannerError, setScannerError] = React.useState<string | null>(null)
  const [activeQrOrder, setActiveQrOrder] = React.useState<any | null>(null)
  const [branchWaiters, setBranchWaiters] = React.useState<{ id: string; full_name: string }[]>([])
  const [selectedWaiterId, setSelectedWaiterId] = React.useState<string>("")
  const [activityLogs, setActivityLogs] = React.useState<ActivityLog[]>([
    { id: "1", type: "serve_order", message: "Served Order to Table T1", timestamp: "12m ago" },
    { id: "2", type: "create_order", message: "Created Order for Table T2", timestamp: "25m ago" },
  ])
  const [orderModalView, setOrderModalView] = React.useState<"catalog" | "ticket">("catalog")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [showOrderModal, setShowOrderModal] = React.useState(false)
  const [selectedTable, setSelectedTable] = React.useState<string>("")
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [orderNotes, setOrderNotes] = React.useState("")
  const [activeParentId, setActiveParentId] = React.useState("")
  const [activeSubCatId, setActiveSubCatId] = React.useState("all")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedItem, setSelectedItem] = React.useState<MenuItem | null>(null)
  const [itemCustomizations, setItemCustomizations] = React.useState<Record<string, string | string[]>>({})
  const [itemNotes, setItemNotes] = React.useState("")
  const [itemQty, setItemQty] = React.useState(1)

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain()
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.type = "sine"; osc.frequency.setValueAtTime(587.33, audioCtx.currentTime)
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime); osc.start(); osc.stop(audioCtx.currentTime + 0.35)
    } catch (e) { console.warn("Audio Context blocked:", e) }
  }

  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") Notification.requestPermission()
  }, [])

  const fetchRestaurantData = React.useCallback(async (rId: string, bId: string) => {
    try {
      const suffix = bId ? `?branch_id=${bId}` : rId ? `?restaurant_id=${rId}` : ""
      const [tableRes, catRes, menuRes] = await Promise.all([fetch(`/api/restaurant/tables${suffix}`), fetch(`/api/restaurant/categories${suffix}`), fetch(`/api/restaurant/menu${suffix}`)])
      const tbls = tableRes.ok ? await tableRes.json() : []
      const cats: Category[] = catRes.ok ? await catRes.json() : []
      const menu = menuRes.ok ? await menuRes.json() : []
      setTables(tbls.filter((t: Table) => t.waiter_id !== undefined)); setCategories(cats); setMenuItems(menu)
      const parents = cats.filter(c => !c.parent_id)
      setActiveParentId(parents.length > 0 ? parents[0].id : ""); setActiveSubCatId("all")
    } catch (err) { console.error(err) }
  }, [])

  const loadStationData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [meRes, restRes, branchRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/restaurant/list"), fetch("/api/branches")])
      const meData = meRes.ok ? await meRes.json() : null
      const loggedInUser = meData?.success && meData?.user ? meData.user : null
      const restData = restRes.ok ? await restRes.json() : []
      const branchData = branchRes.ok ? await branchRes.json() : []
      setRestaurants(restData); setBranches(branchData)
      let finalMe: Me | null = null
      if (loggedInUser) { finalMe = { id: loggedInUser.id, name: loggedInUser.name, email: loggedInUser.email, branchId: loggedInUser.branch_id, roles: loggedInUser.roles || [] }; setMe(finalMe) }
      let activeRestId = finalMe?.branchId ? branchData.find((b: any) => b.id === finalMe!.branchId)?.restaurant_id || restData[0]?.id || "" : restData[0]?.id || ""
      let activeBranchId = finalMe?.branchId || branchData.filter((b: any) => b.restaurant_id === activeRestId)[0]?.id || ""
      setSelectedRestId(activeRestId); setSelectedBranchId(activeBranchId)
      const isManagerOrOwner = (finalMe?.roles || []).some((r: string) => ['HOTEL_OWNER', 'HOTEL_MANAGER', 'RESTAURANT_MANAGER'].includes(r))
      if (isManagerOrOwner && activeBranchId) {
        const empRes = await fetch(`/api/employees?branch_id=${activeBranchId}`)
        const empData = empRes.ok ? await empRes.json() : []
        setBranchWaiters(empData.filter((e: any) => (e.roles || []).some((r: any) => (r.role?.code || r) === 'WAITER')).map((e: any) => ({ id: e.id, full_name: e.full_name })))
      }
      if (activeRestId) await fetchRestaurantData(activeRestId, activeBranchId)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [fetchRestaurantData])

  const fetchActiveOrders = React.useCallback(async () => {
    try {
      const res = await fetch("/api/orders?limit=100")
      if (!res.ok) throw new Error()
      const data: Order[] = await res.json()
      const active = data.filter(o => !["COMPLETED", "CANCELLED"].includes(o.status))
      setOrders(active)
      if (me) {
        const waiterReadyOrders = active.filter(o => o.status === "READY" && o.waiter_id === me.id)
        const newReadyOrders = waiterReadyOrders.filter(o => !prevReadyIds.includes(o.id))
        if (newReadyOrders.length > 0) {
          playNotificationSound()
          newReadyOrders.forEach(o => { if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") new Notification(`Order Ready! 🍽️`, { body: `Table ${o.table?.table_number || "Takeaway"} has ready items!` }) })
        }
        setPrevReadyIds(waiterReadyOrders.map(o => o.id))
      }
    } catch (e) { console.error("Failed to poll orders", e) }
  }, [me, prevReadyIds])

  React.useEffect(() => { loadStationData() }, [loadStationData])
  React.useEffect(() => { fetchActiveOrders(); const i = setInterval(fetchActiveOrders, 5000); return () => clearInterval(i) }, [fetchActiveOrders])

  return {
    me, restaurants, selectedRestId, setSelectedRestId, branches, selectedBranchId, setSelectedBranchId,
    tables, menuItems, categories, orders, setOrders, activeTab, setActiveTab, showScannerModal, setShowScannerModal,
    scannerError, setScannerError, activeQrOrder, setActiveQrOrder, branchWaiters, selectedWaiterId, setSelectedWaiterId,
    activityLogs, setActivityLogs, orderModalView, setOrderModalView, loading, error, setError, showOrderModal, setShowOrderModal,
    selectedTable, setSelectedTable, cart, setCart, orderNotes, setOrderNotes, activeParentId, setActiveParentId,
    activeSubCatId, setActiveSubCatId, searchTerm, setSearchTerm, selectedItem, setSelectedItem, itemCustomizations,
    setItemCustomizations, itemNotes, setItemNotes, itemQty, setItemQty, fetchRestaurantData, fetchActiveOrders
  }
}
