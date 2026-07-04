"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import jsQR from "jsqr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus, Bell, ClipboardList, Users, MessageSquare,
  RefreshCw, ArrowLeft, ShoppingBag, Search, Minus, LayoutGrid,
  Home, QrCode, Camera
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
  prep_time?: number | null
}

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  selectedCustomizations: Record<string, string | string[]>
  notes: string
  prepTime?: number | null
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
  order_number?: string | null
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

interface QRScannerProps {
  onScan: (data: string) => void;
  onError: (error: string) => void;
}

function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      if (typeof window === "undefined" || !navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onError("Camera access requires a secure connection (HTTPS) on mobile. Accessing via HTTP blocks camera APIs. Please use HTTPS (e.g. ngrok) or continue testing with the simulated actions below.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });

        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play().catch(e => {
            console.error("Video play failed:", e);
          });
        }

        animRef.current = requestAnimationFrame(scan);
      } catch (err: any) {
        console.error("Camera capture error:", err);
        onError(err.message || "Failed to access camera. Please verify camera permissions are granted.");
      }
    }

    function scan() {
      if (!isMounted) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          try {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert"
            });
            if (code && code.data) {
              onScan(code.data);
              return; // Stop scan loop
            }
          } catch (e) {
            console.error("jsQR scan error:", e);
          }
        }
      }
      animRef.current = requestAnimationFrame(scan);
    }

    initCamera();

    return () => {
      isMounted = false;
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan, onError]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewfinder Grid Overlay */}
      <div className="absolute inset-0 border-[30px] border-black/80 pointer-events-none z-10" />
      <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative flex items-center justify-center overflow-hidden z-20 pointer-events-none">
        {/* Corners */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-500 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-500 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-500 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-500 rounded-br-lg" />

        {/* Laser Animation */}
        <div className="absolute left-0 right-0 h-1 bg-amber-500 opacity-80 shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse"
          style={{
            animation: "scanner-laser 2s ease-in-out infinite",
            top: "0%"
          }}
        />
      </div>
    </div>
  );
}

export default function WaiterDashboard() {
  const [me, setMe] = React.useState<{ id: string; name: string; email: string; branchId?: string | null; roles?: string[] } | null>(null)
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

  const handleQRScan = React.useCallback((codeString: string) => {
    let tableId: string | null = null;
    try {
      const url = new URL(codeString);
      tableId = url.searchParams.get("tableId");
    } catch (e) {
      const match = codeString.match(/[?&]tableId=([^&]+)/);
      tableId = match ? match[1] : null;
    }

    if (!tableId) {
      const foundTable = tables.find(t => t.id === codeString || t.table_number === codeString);
      if (foundTable) {
        tableId = foundTable.id;
      }
    }

    if (tableId) {
      const matchedTable = tables.find(t => t.id === tableId);
      if (matchedTable) {
        setSelectedTable(matchedTable.id);
        setOrderModalView("catalog");
        setCart([]);
        setShowOrderModal(true);
        setShowScannerModal(false);
        setScannerError(null);

        // Add activity log
        setActivityLogs(prev => [
          {
            id: Math.random().toString(),
            type: "create_order",
            message: `Scanned Table T${matchedTable.table_number} QR Code`,
            timestamp: "Just now"
          },
          ...prev
        ]);
        return;
      }
    }

    alert(`Invalid QR code scanned: ${codeString}. No matching table found.`);
  }, [tables]);
  const [activityLogs, setActivityLogs] = React.useState<Array<{
    id: string;
    type: "create_order" | "clear_table" | "serve_order";
    message: string;
    timestamp: string;
  }>>([
    { id: "1", type: "serve_order", message: "Served Order to Table T1", timestamp: "12m ago" },
    { id: "2", type: "create_order", message: "Created Order for Table T2", timestamp: "25m ago" },
    { id: "3", type: "clear_table", message: "Cleared Table T4 (Available)", timestamp: "1h ago" }
  ])
  const [orderModalView, setOrderModalView] = React.useState<"catalog" | "ticket">("catalog")
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

  // Fetch restaurants, menu items, and tables
  const loadStationData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [meRes, restRes, branchRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/restaurant/list"),
        fetch("/api/branches")
      ])

      const meData = meRes.ok ? await meRes.json() : null
      const loggedInUser = meData?.success && meData?.user ? meData.user : null

      const restData = restRes.ok ? await restRes.json() : []
      setRestaurants(restData)

      const branchData = branchRes.ok ? await branchRes.json() : []
      setBranches(branchData)

      let finalMe = null
      if (loggedInUser) {
        finalMe = {
          id: loggedInUser.id,
          name: loggedInUser.name,
          email: loggedInUser.email,
          branchId: loggedInUser.branch_id,
          roles: loggedInUser.roles || []
        }
        setMe(finalMe)
      }

      let activeRestId = ""
      let activeBranchId = ""

      if (finalMe?.branchId) {
        // Look up restaurant for this branch
        const myBranch = branchData.find((b: any) => b.id === finalMe.branchId)
        activeBranchId = finalMe.branchId
        activeRestId = myBranch?.restaurant_id || restData[0]?.id || ""
      } else {
        // Owner or unassigned
        activeRestId = restData[0]?.id || ""
        const restaurantBranches = branchData.filter((b: any) => b.restaurant_id === activeRestId)
        activeBranchId = restaurantBranches[0]?.id || ""
      }

      setSelectedRestId(activeRestId)
      setSelectedBranchId(activeBranchId)

      if (activeRestId) {
        await fetchRestaurantData(activeRestId, activeBranchId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRestaurantData = async (rId: string, bId: string) => {
    try {
      let tablesUrl = "/api/restaurant/tables"
      let catsUrl = "/api/restaurant/categories"
      let menuUrl = "/api/restaurant/menu"

      if (bId) {
        tablesUrl += `?branch_id=${bId}`
        catsUrl += `?branch_id=${bId}`
        menuUrl += `?branch_id=${bId}`
      } else if (rId) {
        tablesUrl += `?restaurant_id=${rId}`
        catsUrl += `?restaurant_id=${rId}`
        menuUrl += `?restaurant_id=${rId}`
      }

      const [tableRes, catRes, menuRes] = await Promise.all([
        fetch(tablesUrl),
        fetch(catsUrl),
        fetch(menuUrl)
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
    const restaurantBranches = branches.filter((b: any) => b.restaurant_id === rId)
    const bId = restaurantBranches[0]?.id || ""
    setSelectedBranchId(bId)
    if (rId) {
      await fetchRestaurantData(rId, bId)
    } else {
      setTables([])
      setCategories([])
      setMenuItems([])
      setActiveParentId("")
      setActiveSubCatId("all")
    }
  }

  const handleBranchChange = async (bId: string) => {
    setSelectedBranchId(bId)
    if (selectedRestId) {
      await fetchRestaurantData(selectedRestId, bId)
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
        return prev.map((c, i) =>
          i === idx ? { ...c, quantity: c.quantity + itemQty } : c
        )
      }
      return [...prev, { menuItemId: selectedItem.id, name: selectedItem.display_name, price: unitPrice, quantity: itemQty, selectedCustomizations: itemCustomizations, notes: itemNotes, prepTime: selectedItem.prep_time }]
    })
    setSelectedItem(null)
  }

  const addToCartDirectly = (item: MenuItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.menuItemId === item.id && Object.keys(c.selectedCustomizations).length === 0)
      if (idx >= 0) {
        return prev.map((c, i) =>
          i === idx ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { menuItemId: item.id, name: item.display_name, price: parseFloat(item.price.toString()), quantity: 1, selectedCustomizations: {}, notes: "", prepTime: item.prep_time }]
    })
  }

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => {
      if (prev[idx].quantity + delta <= 0) {
        return prev.filter((_, i) => i !== idx)
      }
      return prev.map((c, i) =>
        i === idx ? { ...c, quantity: c.quantity + delta } : c
      )
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
    const tbl = tables.find(t => t.id === tableId)
    if (tbl) {
      setActivityLogs(prev => [
        { id: Math.random().toString(), type: "clear_table", message: `Cleared Table T${tbl.table_number} (Available)`, timestamp: "Just now" },
        ...prev
      ])
    }
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

      const tbl = tables.find(t => t.id === selectedTable)
      if (tbl) {
        setActivityLogs(prev => [
          { id: Math.random().toString(), type: "create_order", message: `Placed Order for Table T${tbl.table_number} ($${cartTotal.toFixed(2)})`, timestamp: "Just now" },
          ...prev
        ])
      }

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
        const order = orders.find(o => o.id === orderId)
        const tbl = order?.table_id ? tables.find(t => t.id === order.table_id) : null
        const tblLabel = tbl ? `Table T${tbl.table_number}` : "Customer"
        setActivityLogs(prev => [
          { id: Math.random().toString(), type: "serve_order", message: `Served Order to ${tblLabel}`, timestamp: "Just now" },
          ...prev
        ])
        setOrders(prev => prev.filter(o => o.id !== orderId))
      }
    } catch (err) {
      console.error("Failed to mark order as delivered", err)
    }
  }

  const handleAssignTable = async (orderId: string, tableId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/table`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_id: tableId })
      })
      if (res.ok) {
        await fetchActiveOrders()
      } else {
        alert("Failed to assign table. Please try again.")
      }
    } catch (err) {
      console.error("Failed to assign table to order", err)
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

  const filterMyOrUnassigned = (o: Order) => {
    return o.waiter_id === me?.id || (o.table_id ? myTables.some(t => t.id === o.table_id) : true);
  }

  const renderAlerts = () => {
    const readyOrders = orders.filter(o => filterMyOrUnassigned(o) && o.status === "READY")
    return (
      <Card className="glass h-full">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Ready to Serve Alerts</CardTitle>
            <CardDescription>Real-time notifications for your tables.</CardDescription>
          </div>
          {readyOrders.length > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {readyOrders.map(o => (
            <div
              key={o.id}
              className="p-4 rounded-xl border border-emerald-500/20 flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    {o.table ? `Table ${o.table.table_number}` : o.order_type === "DINE_IN" ? "Pre-order Dine-In" : o.order_type === "DELIVERY" ? "Delivery" : "Takeaway"}
                  </span>
                  <p className="text-sm font-semibold font-bold">Items Ready!</p>
                </div>
                <p className="text-[10px] ">
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

          {readyOrders.length === 0 && (
            <div className="py-12 text-center text-sm">
              No active serve alerts. Nice job!
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading && restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <p className="text-sm text-[var(--muted)]">Loading Waiter Station…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-24 md:pb-12 bg-[var(--background)] text-[var(--foreground)]  ">
      {/* Header and Stats */}
      {activeTab === "home" && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Waiter Station</h1>
            <p className="">
              Active User: <strong className="">{me?.name || "Loading..."}</strong> • Manage your assigned tables and ready orders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!me?.branchId ? (
              <>
                {restaurants.length > 1 && (
                  <select
                    value={selectedRestId}
                    onChange={e => handleRestaurantChange(e.target.value)}
                    className=" border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-xs font-bold  focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {restaurants.map(r => (
                      <option key={r.id} value={r.id} className="">{r.name}</option>
                    ))}
                  </select>
                )}
                <select
                  value={selectedBranchId}
                  onChange={e => handleBranchChange(e.target.value)}
                  className=" border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="" className="">— Select Branch —</option>
                  {branches
                    .filter(b => b.restaurant_id === selectedRestId)
                    .map(b => (
                      <option key={b.id} value={b.id} className="">{b.name}</option>
                    ))
                  }
                </select>
              </>
            ) : (
              <span className="text-xs font-bold  border border-[var(--surface-border)] px-3 py-1.5 rounded-lg">
                {branches.find(b => b.id === me.branchId)?.name || "Assigned Branch"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Compact Status Bar */}
      {activeTab === "home" && (
        <div className=" border border-[var(--surface-border)] backdrop-blur-md rounded-2xl p-4 flex items-center justify-between gap-4 text-xs font-semibold shadow-sm">
          <div className="flex items-center flex-wrap gap-x-6 gap-y-2">
            {/* Tables Status */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" />
              <span className="">Tables:</span>
              <span className="font-bold">
                {myTables.filter(t => getTableStatus(t.id) === "OCCUPIED").length}/{myTables.length}
              </span>
            </div>

            <span className=" hidden sm:inline">|</span>

            {/* Orders Status */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full " />
              <span className="">Orders:</span>
              <span className="text-[var(--foreground)] font-bold">
                {orders.filter(filterMyOrUnassigned).length}
              </span>
            </div>

            <span className=" hidden sm:inline">|</span>

            {/* Ready to Serve Status */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="">Ready:</span>
              <span className=" font-bold">
                {orders.filter(o => filterMyOrUnassigned(o) && o.status === "READY").length}
              </span>
            </div>
          </div>

          <div className="text-[10px]  uppercase tracking-wider font-bold  border border-[var(--surface-border)] px-2.5 py-1 rounded-full">
            Live Station
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column: Tabs & Layouts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Desktop/Tablet Tab buttons */}
          <div className="hidden md:flex border-b border-[var(--surface-border)] overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all shrink-0 ${activeTab === "home"
                ? "border-[var(--color-primary-600)] "
                : "border-transparent hover:text-[var(--foreground)]"
                }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("tables")}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all shrink-0 ${activeTab === "tables"
                ? "border-[var(--color-primary-600)] "
                : "border-transparent  hover:text-[var(--foreground)]"
                }`}
            >
              Tables Layout
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all shrink-0 ${activeTab === "orders"
                ? "border-[var(--color-primary-600)] "
                : "border-transparent hover:text-[var(--foreground)]"
                }`}
            >
              Active Orders ({orders.filter(filterMyOrUnassigned).length})
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`lg:hidden px-6 py-3 font-semibold text-sm border-b-2 transition-all shrink-0 flex items-center gap-2 ${activeTab === "alerts"
                ? "border-[var(--color-primary-600)] "
                : "border-transparent hover:text-[var(--foreground)]"
                }`}
            >
              <span>Alerts</span>
              {orders.filter(o => filterMyOrUnassigned(o) && o.status === "READY").length > 0 && (
                <span className="bg-red-500 text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {orders.filter(o => filterMyOrUnassigned(o) && o.status === "READY").length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "home" && (
            <div className="space-y-6">


              {/* Quick Actions Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SCAN QR CODE BUTTON - EXTREMELY PROMINENT */}
                  <button
                    onClick={() => setShowScannerModal(true)}
                    className="flex items-center gap-4  hover:bg-[var(--surface-hover)] p-5 rounded-2xl shadow-lg transition-all duration-200 active:scale-[0.98] group font-black text-left cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <QrCode className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black">Scan Table QR</h4>
                      <p className="text-[10px]  font-normal mt-0.5">Scan a table QR to order immediately.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("tables")}
                    className="flex items-center gap-4  bg-[var(--foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] text-[var(--background)] p-5 rounded-2xl transition-all duration-200 active:scale-[0.98] group text-left cursor-pointer shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--background)] text-[var(--foreground)] border border-[var(--surface-border)] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-5 h-5 " />
                    </div>
                    <div>
                      <h4 className="text-sm font-black ">New Order</h4>
                      <p className="text-[10px]  mt-0.5">Select an assigned table to start order.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Shift Activity Log */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider">Shift Activity Log</h3>
                <Card className="border-[var(--surface-border)] p-4 shadow-sm">
                  {activityLogs.length === 0 ? (
                    <p className="text-xs text-center py-6">No shift activities recorded yet.</p>
                  ) : (
                    <div className="flow-root">
                      <ul className="space-y-4">
                        {activityLogs.map((log) => (
                          <li key={log.id} className="flex items-center justify-between py-1 border-b border-[var(--surface-border)] last:border-0">
                            <div className="flex items-center gap-3">
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ${log.type === "serve_order"
                                ? "bg-[var(--foreground)] text-[var(--background)]"
                                : log.type === "create_order"
                                  ? "bg-[var(--foreground)] text-[var(--background)]"
                                  : "bg-[var(--foreground)] text-[var(--background)]"
                                }`}>
                                {log.type === "serve_order" ? (
                                  <Bell className="w-4 h-4" />
                                ) : log.type === "create_order" ? (
                                  <Plus className="w-4 h-4" />
                                ) : (
                                  <LayoutGrid className="w-4 h-4" />
                                )}
                              </span>
                              <span className="text-xs font-semibold text-[var(--foreground)]">{log.message}</span>
                            </div>
                            <span className="text-[10px]">{log.timestamp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {activeTab === "tables" && (
            <div className="space-y-6">
              {/* My Tables section */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" /> My Assigned Tables ({myTables.length})
                </h3>
                {myTables.length === 0 ? (
                  <div className="p-8 border border-dashed border-[var(--surface-border)] rounded-2xl text-center  text-xs">
                    No tables assigned to you by manager.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {myTables.map(table => {
                      const tableStatus = getTableStatus(table.id)
                      const tableReadyOrder = orders.find(o => o.table_id === table.id && o.status === "READY")
                      return (
                        <Card
                          key={table.id}
                          onClick={() => {
                            setSelectedTable(table.id)
                            setOrderModalView("catalog")
                            setCart([])
                            setShowOrderModal(true)
                          }}
                          className={`group relative overflow-hidden transition-all duration-300 border-[var(--surface-border)] hover:border-blue-500/40 cursor-pointer active:scale-[0.98] ${tableReadyOrder
                            ? "ring-1 ring-emerald-500/25 border-emerald-500/40"
                            : tableStatus === "OCCUPIED"
                              ? "bg-blue-500/5"
                              : "bg-emerald-500/5"
                            }`}
                        >
                          <CardContent className="p-3 sm:p-5 flex flex-col items-center justify-center text-center space-y-2 sm:space-y-3">
                            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Table {table.table_number}
                            </span>

                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border shadow-inner">
                              <Users className="w-4 h-4 sm:w-5 sm:h-5 " />
                            </div>

                            <div className="space-y-0.5 sm:space-y-1">
                              <p className="text-[10px] sm:text-xs ">{table.capacity} seats</p>
                              {tableReadyOrder ? (
                                <p className="text-[10px] sm:text-xs font-black animate-pulse uppercase">READY TO SERVE</p>
                              ) : (
                                <p className={`text-[10px] sm:text-xs font-bold ${tableStatus === "AVAILABLE" ? "" : ""
                                  }`}>
                                  {tableStatus}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col gap-1 w-full mt-1.5 sm:mt-2">
                              {tableStatus === "OCCUPIED" && (
                                <>
                                  {tableReadyOrder && (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleMarkDelivered(tableReadyOrder.id)
                                      }}
                                      size="sm"
                                      className="w-full text-[9px] sm:text-[10px] h-6 sm:h-7 bg-emerald-600 hover:bg-emerald-500 font-bold animate-pulse"
                                    >
                                      Serve Order
                                    </Button>
                                  )}
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleClearTable(table.id)
                                    }}
                                    size="sm"
                                    className="w-full text-[9px] sm:text-[10px] h-6 sm:h-7 hover:bg-zinc-600 font-bold"
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
              <div className="space-y-3 pt-4 bg-[var(--background)] text-[var(--foreground)] border-t border-[var(--surface-border)]">
                <h3 className="text-sm font-black  uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full " /> Other Tables ({otherTables.length})
                </h3>
                {otherTables.length === 0 ? (
                  <div className="p-8 border border-dashed border-[var(--surface-border)] rounded-2xl text-center  text-xs">
                    No other tables registered.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 opacity-75">
                    {otherTables.map(table => {
                      const tableStatus = getTableStatus(table.id)
                      return (
                        <Card
                          key={table.id}
                          className={`group relative overflow-hidden transition-all duration-300 border-[var(--surface-border)] ${tableStatus === "OCCUPIED" ? "bg-blue-500/5" : "bg-zinc-800/10"
                            }`}
                        >
                          <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center space-y-1.5 sm:space-y-2.5">
                            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ">
                              Table {table.table_number}
                            </span>
                            <p className="text-[13px] sm:text-[15px] ">{table.capacity} seats</p>
                            <p className="text-[13px] sm:text-[15px]  font-semibold truncate max-w-full">
                              {table.waiter?.full_name || "No waiter"}
                            </p>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-3">
              {orders.filter(filterMyOrUnassigned).map(order => (
                <Card key={order.id} className=" border-[var(--surface-border)] overflow-hidden hover:border-blue-500/20 transition-all p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-[var(--foreground)] text-xs uppercase tracking-wider">
                          {order.order_number ? `#${order.order_number} (${order.id.slice(-6).toUpperCase()})` : `#${order.id.slice(-6).toUpperCase()}`}
                        </span>

                        {order.table ? (
                          <span className=" text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                            T{order.table.table_number}
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded capitalize">
                            {order.order_type === "DINE_IN" ? "Pre-order" : order.order_type === "DELIVERY" ? "Delivery" : "Takeaway"}
                          </span>
                        )}

                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>

                        <span className="text-[10px] ">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Items Row: Inline Comma Separated */}
                      <p className="text-[11px] leading-relaxed font-semibold max-w-full">
                        {order.items.map(it => `${it.quantity}x ${it.menu_item.display_name}`).join(" • ")}
                      </p>

                      {order.order_type === "DINE_IN" && !order.table_id && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-semibold">Assign:</span>
                          <select
                            onChange={(e) => {
                              const tId = e.target.value;
                              if (tId) {
                                handleAssignTable(order.id, tId);
                              }
                            }}
                            className="border border-[var(--surface-border)] text-[10px] text-[var(--foreground)] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            defaultValue=""
                          >
                            <option value="" disabled>Select Table...</option>
                            {tables.map(t => (
                              <option key={t.id} value={t.id}>
                                Table {t.table_number} (Cap: {t.capacity})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {order.notes && (
                        <p className="text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/10 w-fit mt-1">
                          <MessageSquare className="w-3 h-3" /> {order.notes}
                        </p>
                      )}
                    </div>

                    {/* Price and Action Row */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="font-extrabold text-xs text-[var(--foreground)]">
                        ${parseFloat(order.total_amount.toString()).toFixed(2)}
                      </span>
                      {order.status === "READY" && (
                        <Button
                          onClick={() => handleMarkDelivered(order.id)}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 font-bold text-[10px] px-2.5 py-1 h-7 rounded-lg"
                        >
                          Serve
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {orders.filter(filterMyOrUnassigned).length === 0 && (
                <div className="py-12 text-center text-xs">No active orders found.</div>
              )}
            </div>
          )}

          {activeTab === "alerts" && (
            <div className="lg:hidden">
              {renderAlerts()}
            </div>
          )}
        </div>

        {/* Right Column: Alerts and Notifications panel (Desktop only) */}
        <div className="hidden lg:block space-y-6">
          {renderAlerts()}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar — hidden when order modal is open */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 bg-[#030712] border-t border-white/10 md:hidden flex items-center justify-around px-2 py-3 pb-safe shadow-2xl ${showOrderModal ? 'hidden' : ''}`}>
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === "home" ? "scale-110" : "hover:text-white"
            }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button
          onClick={() => setActiveTab("tables")}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === "tables" ? "scale-110" : " hover:text-white"
            }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold">Tables</span>
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === "orders" ? "scale-110" : "hover:text-white"
            }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px] font-bold">Orders</span>
          {orders.filter(filterMyOrUnassigned).length > 0 && (
            <span className="absolute -top-1 -right-2 text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-black">
              {orders.filter(filterMyOrUnassigned).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === "alerts" ? "scale-110" : " hover:text-white"
            }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-bold">Alerts</span>
          {orders.filter(o => filterMyOrUnassigned(o) && o.status === "READY").length > 0 && (
            <span className="absolute -top-1 -right-2 text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-black animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              {orders.filter(o => filterMyOrUnassigned(o) && o.status === "READY").length}
            </span>
          )}
        </button>
      </div>

      {/* Place Order — Full Page Overlay (portal to body to escape overflow-y-auto) */}
      {showOrderModal && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[var(--background)] text-[var(--foreground)] w-full h-full flex flex-col overflow-hidden">
          {/* Modal Header */}
          <div className="p-4 border-b border-[var(--surface-border)] flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-[var(--foreground)]">
                {selectedTable ? `Order for Table ${myTables.find(t => t.id === selectedTable)?.table_number || ""}` : "New Table Order"}
              </h2>
              <p className="text-[10px]">Select items from categories and customize to add to ticket.</p>
            </div>
            <button
              onClick={() => {
                setShowOrderModal(false)
                setCart([])
                setOrderNotes("")
                setSelectedTable("")
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">


            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Left Side: Catalog Selector */}
              <div className={`flex-1 flex flex-col min-h-0 bg-[var(--background)] ${orderModalView === "catalog" ? "" : "hidden"}`}>

                {/* Search & Parent Categories Horizontal Scroll */}
                <div className="p-4 border-b border-[var(--surface-border)] space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 " />
                    <Input
                      placeholder="Search menu items..."
                      className="pl-9 h-10 border-[var(--surface-border)] text-[var(--foreground)] placeholder-[var(--muted)] text-xs rounded-xl"
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
                          className={`shrink-0 px-4 py-2 rounded-full text-[11px] font-bold transition-all ${isActive
                            ? "shadow-md shadow-amber-500/10"
                            : "hover:bg-[var(--surface-hover)]/80"
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
                  <div className="w-24 border-r border-[var(--surface-border)] overflow-y-auto shrink-0 py-2">
                    {parentCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveSubCatId("all")}
                        className={`w-full text-left px-3 py-3 text-[11px] font-medium border-l-2 transition-all leading-snug flex items-center justify-between ${activeSubCatId === "all"
                          ? "border-amber-500 font-black"
                          : "border-transparent hover:bg-[var(--surface-hover)]"
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
                          className={`w-full text-left px-3 py-3 text-[11px] font-medium border-l-2 transition-all leading-snug flex items-center justify-between ${isActive
                            ? "border-amber-500 font-black"
                            : "border-transparent hover:bg-[var(--surface-hover)]"
                            }`}
                        >
                          {sc.name}
                        </button>
                      )
                    })}
                  </div>

                  {/* Right: Scrollable Grid list of Menu Items */}
                  <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${cartCount > 0 ? "pb-28" : "pb-4"}`}>
                    {filteredMenuItems.map(item => {
                      const itemPrice = parseFloat(item.price.toString())
                      const inCartCount = cart
                        .filter(c => c.menuItemId === item.id)
                        .reduce((sum, cur) => sum + cur.quantity, 0)

                      return (
                        <div
                          key={item.id}
                          onClick={() => openItemDetail(item)}
                          className="w-full border border-[var(--surface-border)] rounded-2xl flex gap-3.5 p-3 hover:border-amber-500/20 transition-all cursor-pointer relative group select-none min-h-[96px]"
                        >
                          {/* Image */}
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[var(--background)] border border-[var(--surface-border)] flex items-center justify-center">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl">🍽️</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pr-20 flex flex-col justify-between">
                            <div>
                              <h3 className="font-extrabold text-sm text-[var(--foreground)] leading-tight line-clamp-1 group-hover:text-amber-500 transition-colors">
                                {item.display_name}
                              </h3>
                              {item.description && (
                                <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className=" font-black text-sm">${itemPrice.toFixed(2)}</span>
                              {(item.prep_time ?? 0) > 0 && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                                  ⏱ ~{item.prep_time}m
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Add / Qty Control */}
                          <div
                            className="absolute bottom-3 right-3"
                            onClick={e => e.stopPropagation()}
                          >
                            {inCartCount > 0 ? (
                              <div className="flex items-center gap-2 rounded-xl px-2.5 py-1 shadow-lg font-black text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const idx = cart.findIndex(c => c.menuItemId === item.id && Object.keys(c.selectedCustomizations).length === 0)
                                    if (idx >= 0) updateCartQty(idx, -1)
                                  }}
                                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 active:scale-95 transition-all text-sm font-bold"
                                >
                                  −
                                </button>
                                <span className="w-4 text-center font-black">{inCartCount}</span>
                                <button
                                  type="button"
                                  onClick={() => addToCartDirectly(item)}
                                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 active:scale-95 transition-all text-sm font-bold"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToCartDirectly(item)}
                                className="hover:bg-amber-400 active:scale-95 rounded-xl px-4 py-1.5 text-xs font-black shadow-md transition-all flex items-center gap-1"
                              >
                                <span>Add</span>
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {filteredMenuItems.length === 0 && (
                      <div className="text-center py-12 text-xs">
                        No items found matching search filters.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Floating Cart Popup Button — overlays catalog */}
              {orderModalView === "catalog" && cartCount > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] w-[calc(100%-2rem)] max-w-lg">
                  <button
                    type="button"
                    onClick={() => setOrderModalView("ticket")}
                    className="w-full flex items-center justify-between gap-4 hover:bg-amber-400 active:scale-[0.98] px-5 py-4 rounded-2xl shadow-[0_8px_40px_rgba(245,158,11,0.45)] transition-all font-black"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl p-2">
                        <ShoppingBag className="w-5 h-5 text-black" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black leading-none">${cartTotal.toFixed(2)}</p>
                        <p className="text-[11px] font-semibold opacity-75 mt-0.5">A total of {cartCount} item{cartCount !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black">Proceed to Order</span>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </div>
                  </button>
                </div>
              )}

              {/* Right Side: Table Ticket details */}
              <div className={`w-full flex-1 p-5 md:p-8 flex flex-col min-h-0 shrink-0 ${orderModalView === "ticket" ? "flex" : "hidden"}`}>
                <form onSubmit={handleCreateOrder} className="flex flex-col h-full min-h-0 gap-4">
                  {/* Back button */}
                  <Button
                    type="button"
                    onClick={() => setOrderModalView("catalog")}
                    className="w-full sm:w-auto self-start hover:bg-zinc-700 font-extrabold text-xs py-2.5 px-5 rounded-xl mb-4 flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Menu
                  </Button>
                  {/* Selected Table (Read-Only) */}
                  <div className="bg-[var(--background)] border border-[var(--surface-border)] rounded-xl p-3 flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Table</span>
                    <span className="text-xs font-black uppercase">
                      Table {myTables.find(t => t.id === selectedTable)?.table_number || "Selected"}
                    </span>
                  </div>

                  {/* Cart List */}
                  <div className="flex-1 flex flex-col min-h-0 overflow-y-auto py-2 border-y border-[var(--surface-border)] space-y-3">
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">Order Ticket Items</span>
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex gap-2.5 bg-[var(--background)] border border-[var(--surface-border)] rounded-xl p-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-[var(--foreground)] leading-tight truncate">{item.name}</p>
                          {Object.entries(item.selectedCustomizations).map(([k, v]) => (
                            <p key={k} className="text-[9px] font-semibold mt-0.5">
                              • {k}: {Array.isArray(v) ? v.join(", ") : v}
                            </p>
                          ))}
                          {item.notes && (
                            <p className="text-[9px] italic mt-0.5 line-clamp-1">"{item.notes}"</p>
                          )}
                          {(item.prepTime ?? 0) > 0 && (
                            <p className="text-[9px] text-amber-500 font-bold mt-1 flex items-center gap-0.5">
                              <span>⏱ ~{item.prepTime}m</span>
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end justify-between shrink-0">
                          <span className="font-extrabold text-xs">${(item.price * item.quantity).toFixed(2)}</span>
                          <div className="flex items-center gap-1.5 rounded-lg px-1.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateCartQty(idx, -1)}
                              className="font-bold text-[10px] text-[var(--foreground)] w-3.5 h-3.5 flex items-center justify-center hover:text-amber-500"
                            >
                              −
                            </button>
                            <span className="font-bold text-[10px] text-[var(--foreground)] min-w-[8px] text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(idx, 1)}
                              className="font-bold text-[10px] text-[var(--foreground)] w-3.5 h-3.5 flex items-center justify-center hover:text-amber-500"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {cart.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                        <ShoppingBag className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-xs">Cart is empty</p>
                      </div>
                    )}
                  </div>

                  {/* Ticket Instruction Notes */}
                  <div className="space-y-1 shrink-0">
                    <label className="text-[10px] font-bold uppercase tracking-wider">Chef Instructions</label>
                    <Input
                      placeholder="E.g., Extra hot sauce, no sesame..."
                      value={orderNotes}
                      onChange={e => setOrderNotes(e.target.value)}
                      className="bg-[var(--background)] border-[var(--surface-border)] text-xs text-[var(--foreground)]"
                    />
                  </div>

                  {/* Summary & Place Order */}
                  <div className="mt-auto pt-3 border-t border-[var(--surface-border)] space-y-3 shrink-0">
                    {Math.max(...cart.map(c => c.prepTime ?? 0), 0) > 0 && (
                      <div className="flex justify-between items-center text-xs text-[var(--muted)]">
                        <span>Est. Prep Time:</span>
                        <span className="font-bold text-amber-500">~{Math.max(...cart.map(c => c.prepTime ?? 0), 0)} mins</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[var(--foreground)] opacity-80">Total:</span>
                      <span className="font-black text-sm">${cartTotal.toFixed(2)}</span>
                    </div>

                    {error && (
                      <p className="text-[10px] text-red-500 bg-red-950/20 border border-red-500/20 rounded-lg p-2 leading-relaxed">
                        {error}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={!selectedTable || cart.length === 0}
                      className="w-full hover:bg-amber-400 font-black text-xs py-3.5 rounded-xl transition-all"
                    >
                      Place Order · ${cartTotal.toFixed(2)}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* FULL COVERED MENU ITEM DETAIL PAGE OVERLAY */}
          {selectedItem && (
            <div className="absolute inset-0 z-50 bg-[var(--background)] text-[var(--foreground)] flex flex-col w-full h-full overflow-y-auto">
              <div className="absolute top-4 left-4 z-10">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="hover:bg-black/80 text-white p-2 rounded-full border border-white/10 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="relative h-56 w-full shrink-0 flex items-center justify-center border-b border-[var(--surface-border)]">
                {selectedItem.image_url ? (
                  <img src={selectedItem.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">Item image</span>
                )}
                <div className="absolute inset-0 rent" />
              </div>

              <div className="flex-1 px-5 py-6 max-w-xl mx-auto w-full space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black">{selectedItem.display_name}</h2>
                    <p className="text-[9px] font-bold mt-0.5 uppercase tracking-wider">
                      {categories.find(c => c.id === selectedItem.category_id)?.name || "Menu Item"}
                    </p>
                    {(selectedItem.prep_time ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        ⏱ ~{selectedItem.prep_time} min prep
                      </span>
                    )}
                  </div>
                  <span className="font-extrabold text-lg shrink-0">
                    ${parseFloat(selectedItem.price.toString()).toFixed(2)}
                  </span>
                </div>

                {selectedItem.description && (
                  <div className="space-y-1 rounded-xl p-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-60">Description</h4>
                    <p className="text-xs leading-relaxed opacity-90">{selectedItem.description}</p>
                  </div>
                )}

                {selectedItem.customizations && selectedItem.customizations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider opacity-60">Customizations</h3>
                    {selectedItem.customizations.map(cust => (
                      <div key={cust.key} className="space-y-2 border border-[var(--surface-border)] rounded-xl p-3">
                        <p className="text-xs font-bold flex items-center gap-1.5">
                          <span>{cust.label}</span>
                          {cust.multiple && (
                            <span className="text-[8px] border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">
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
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selected
                                  ? "order-amber-500 shadow-md"
                                  : "border-[var(--surface-border)] text-[var(--foreground)] opacity-90 hover:bg-[var(--surface-hover)]/80"
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
                    className="w-full border border-[var(--surface-border)] text-[var(--foreground)] rounded-xl px-3 py-2 text-xs placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none animate-none"
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-3 border border-[var(--surface-border)] rounded-xl px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setItemQty(q => Math.max(1, q - 1))}
                      className="font-bold text-base hover:text-amber-500"
                    >
                      −
                    </button>
                    <span className="font-extrabold text-sm w-4 text-[var(--foreground)] text-center">{itemQty}</span>
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
                    className="flex-1 hover:bg-amber-400 font-black py-3 rounded-xl transition-all shadow-md text-xs sm:text-sm"
                  >
                    Add to Cart — ${(getCustomizedPrice(selectedItem, itemCustomizations) * itemQty).toFixed(2)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* MOCK QR SCANNER MODAL */}
      {showScannerModal && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md border-t sm:border border-[var(--surface-border)] rounded-t-[2.5rem] sm:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[85vh] sm:h-[500px] transition-transform duration-300">
            {/* Header */}
            <div className="p-5 border-b border-[var(--surface-border)] flex justify-between items-center shrink-0">
              <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Scan Table QR Code
              </h3>
              <button
                onClick={() => {
                  setShowScannerModal(false)
                  setScannerError(null)
                }}
                className="hover:text-[var(--foreground)] text-sm px-2 py-1 hover:bg-[var(--surface-hover)] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Viewfinder Area */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              {scannerError ? (
                <div className="p-6 text-center space-y-3 z-20">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-[var(--foreground)] font-bold">Camera Access Failed</p>
                  <p className="text-[11px] leading-relaxed max-w-[280px] mx-auto">
                    {scannerError}
                  </p>
                  <p className="text-[10px] text-amber-500/90 font-medium">
                    Please use HTTPS or allow camera permission. You can still test with simulated actions below.
                  </p>
                </div>
              ) : (
                <>
                  <QRScanner onScan={handleQRScan} onError={(err) => setScannerError(err)} />
                  {/* Hint text */}
                  <div className="absolute bottom-4 left-0 right-0 text-center z-20 pointer-events-none">
                    <span className="text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/5">
                      Point camera at table QR code
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Simulated actions */}
            <div className="p-4 border-t border-[var(--surface-border)] space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider block">
                Simulate Scanning Assigned Table QR Code
              </span>

              {myTables.length === 0 ? (
                <p className="text-[11px] text-center py-2">
                  No assigned tables available to scan. Assign tables first in layouts.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
                  {myTables.map(table => (
                    <button
                      key={table.id}
                      onClick={() => {
                        setSelectedTable(table.id)
                        setOrderModalView("catalog")
                        setCart([])
                        setShowOrderModal(true)
                        setShowScannerModal(false)

                        // Add activity log
                        setActivityLogs(prev => [
                          { id: Math.random().toString(), type: "create_order", message: `Scanned Table T${table.table_number} QR Code`, timestamp: "Just now" },
                          ...prev
                        ])
                      }}
                      className="hover:bg-[var(--surface-hover)] text-[var(--foreground)] hover:text-amber-500 text-xs font-black py-2.5 px-3 rounded-xl border border-[var(--surface-border)] hover:border-amber-500/30 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Table T{table.table_number}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
