"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  MapPin, 
  ArrowLeft, 
  User, 
  Home as HomeIcon, 
  ChevronRight, 
  Settings,
  Clock,
  X,
  Sun,
  Moon,
  Search
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  getUserProfile, 
  getUserLocation, 
  getPreferredRestaurantId, 
  setPreferredRestaurantId, 
  MiniAppUser, 
  MiniAppLocation 
} from "@/lib/miniapp-bridge"

interface Restaurant {
  id: string
  name: string
  tenant_id?: string | null
  logo_url?: string | null
  branch_id?: string | null
  parent_id?: string | null
  branches?: Array<{
    id: string
    name: string
    address?: string | null
    phone?: string | null
  }> | null
  branch?: {
    name: string
  } | null
  distance?: number // Distance in km
}

interface AppConfig {
  business_name: string
  business_type?: string
  restaurants: Restaurant[]
}

interface Promotion {
  id: string
  title: string
  description: string | null
  terms_conditions: string | null
  code: string | null
  discount_value: string | null
  banner_url: string | null
  type: string
  scope: string
  status: string
  start_date: string
  end_date: string
  restaurant_id: string | null
  category_id: string | null
  menu_item_id: string | null
  branch_id: string | null
  is_active: boolean
}

// Simulated coordinates for restaurants
const RESTAURANT_COORDINATES: Record<string, { latitude: number, longitude: number }> = {
  "Grand Horizon Bistro": { latitude: 9.030, longitude: 38.740 },
  "McDonald": { latitude: 9.025, longitude: 38.750 },
  "Burger King": { latitude: 9.040, longitude: 38.760 },
  "Pizza Hut": { latitude: 9.015, longitude: 38.730 },
  "Bole Outlet": { latitude: 9.001, longitude: 38.780 },
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return parseFloat((R * c).toFixed(1))
}

export default function MiniAppHomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Theme support
  const [theme, setTheme] = React.useState<"dark" | "light">("dark")

  // SDK & Auth state
  const [userProfile, setUserProfile] = React.useState<MiniAppUser | null>(null)
  const [userCoords, setUserCoords] = React.useState<MiniAppLocation | null>(null)
  const [preferredId, setPreferredId] = React.useState<string | null>(null)

  // App state
  const [activeTab, setActiveTab] = React.useState<"home" | "account">("home")
  const [selectedService, setSelectedService] = React.useState<string>("")
  const [view, setView] = React.useState<"home" | "branch-select" | "delivery-form">("home")
  const [pickerBrand, setPickerBrand] = React.useState<any>(null)
  const [showSettings, setShowSettings] = React.useState(false)
  const [showSearch, setShowSearch] = React.useState(false)
  const [outletSearchQuery, setOutletSearchQuery] = React.useState("")
  
  // Connection and client config state
  const [hostIp, setHostIp] = React.useState<string>("192.168.1.8")
  const [tenantId, setTenantId] = React.useState<string>("")
  const [appConfig, setAppConfig] = React.useState<AppConfig>({
    business_name: "Hospitality Hub",
    restaurants: []
  })

  // Delivery details form state
  const [delivName, setDelivName] = React.useState<string>("")
  const [delivPhone, setDelivPhone] = React.useState<string>("")
  const [delivAddress, setDelivAddress] = React.useState<string>("")

  // Local overrides settings inputs
  const [inputIp, setInputIp] = React.useState<string>("")
  const [inputTenantId, setInputTenantId] = React.useState<string>("")

  // Order history (for Account tab)
  const [orderHistory, setOrderHistory] = React.useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = React.useState(false)

  // Promotions (Exclusive Offers)
  const [promotions, setPromotions] = React.useState<Promotion[]>([])
  // Promotions container ref for auto horizontal sliding
  const promoContainerRef = React.useRef<HTMLDivElement>(null)
  const [selectedPromo, setSelectedPromo] = React.useState<Promotion | null>(null)

  // Toast status
  const [toast, setToast] = React.useState<{ show: boolean; message: string; icon: string }>({
    show: false,
    message: "",
    icon: "✨"
  })

  // Theme helper tokens
  const themeBg = theme === "dark" ? "bg-[#0c0c0c] text-white" : "bg-[#f8f9fa] text-gray-900"
  const themeCard = theme === "dark" ? "bg-[#1c1c1e] border-white/[0.08] text-white shadow-lg" : "bg-white border-gray-100 text-gray-900 shadow-md hover:shadow-lg transition-shadow duration-300"
  const themePanel = theme === "dark" ? "bg-[#1c1c1e] border-white/[0.08]" : "bg-white border-gray-100 shadow-lg"
  const themeBorder = theme === "dark" ? "border-white/[0.08]" : "border-gray-100"
  const themeTextMuted = theme === "dark" ? "text-neutral-400" : "text-gray-500"
  const themeTextTitle = theme === "dark" ? "text-white" : "text-gray-900"

  // Helper to trigger custom toasts
  const showToast = (message: string, icon: string = "✨") => {
    setToast({ show: true, message, icon })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  // Load configuration and cached context parameters
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("menu-theme") as "dark" | "light" | null
    if (savedTheme) {
      setTheme(savedTheme)
    }

    let defaultIp = "192.168.1.8"
    if (typeof window !== "undefined" && window.location.hostname) {
      const hostname = window.location.hostname
      if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        defaultIp = hostname
      }
    }

    const savedIp = localStorage.getItem("hospitality_host_ip") || defaultIp
    const savedTenant = localStorage.getItem("hospitality_tenant_id") || ""
    
    setHostIp(savedIp)
    setInputIp(savedIp)
    
    setTenantId(savedTenant)
    setInputTenantId(savedTenant)

    const queryTenantId = searchParams.get("tenantId")
    const queryHostIp = searchParams.get("hostIp")

    let activeTenant = savedTenant
    let activeIp = savedIp

    if (queryTenantId) {
      activeTenant = queryTenantId
      setTenantId(queryTenantId)
      setInputTenantId(queryTenantId)
      localStorage.setItem("hospitality_tenant_id", queryTenantId)
    }

    if (queryHostIp) {
      activeIp = queryHostIp
      setHostIp(queryHostIp)
      setInputIp(queryHostIp)
      localStorage.setItem("hospitality_host_ip", queryHostIp)
    }

    loadConfig(activeIp, activeTenant)

    // Fetch SDK/device state asynchronously
    const initSDKBridge = async () => {
      try {
        const profile = await getUserProfile()
        if (profile) {
          setUserProfile(profile)
          setDelivName(profile.name)
        }

        const location = await getUserLocation()
        if (location) setUserCoords(location)

        const prefId = await getPreferredRestaurantId()
        if (prefId) setPreferredId(prefId)

        // Always fetch order history — uses SSO id + localStorage fallback
        fetchOrderHistory(profile?.id || null)
      } catch (err) {
        console.warn("Failed to load SDK bridge initial states:", err)
        // Still try fetching history from localStorage even if bridge fails
        fetchOrderHistory(null)
      }
    }
    initSDKBridge()
  }, [searchParams])

  const fetchOrderHistory = async (userId: string | null) => {
    setLoadingHistory(true)
    try {
      // --- Strategy 1: SSO userId → linked CustomerIdentity orders ---
      let ssoOrders: any[] = []
      if (userId) {
        try {
          const res = await fetch(`/api/orders/public/history?userId=${encodeURIComponent(userId)}`)
          if (res.ok) ssoOrders = await res.json()
        } catch (e) {
          console.warn("SSO history fetch failed", e)
        }
      }

      // --- Strategy 2: localStorage order IDs (covers guest orders and pre-auth orders) ---
      const localOrderIds: string[] = []
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith("placed_orders_")) {
            try {
              const ids: string[] = JSON.parse(localStorage.getItem(key) || "[]")
              localOrderIds.push(...ids)
            } catch (_) {}
          }
        }
      }

      // Filter out IDs already fetched via SSO
      const ssoIds = new Set(ssoOrders.map((o: any) => o.id))
      const remainingIds = localOrderIds.filter(id => !ssoIds.has(id))

      let localOrders: any[] = []
      if (remainingIds.length > 0) {
        try {
          const res = await fetch(`/api/orders/public/history?orderIds=${remainingIds.join(",")}`)
          if (res.ok) localOrders = await res.json()
        } catch (e) {
          console.warn("Local order ID history fetch failed", e)
        }
      }

      // Merge and sort by date descending
      const all = [...ssoOrders, ...localOrders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setOrderHistory(all)
    } catch (e) {
      console.warn("Could not load order history", e)
    } finally {
      setLoadingHistory(false)
    }
  }

  const fetchPromotions = async (tId: string) => {
    if (!tId) return
    try {
      let url = `/api/promotions/public?tenantId=${encodeURIComponent(tId)}&_t=${Date.now()}`
      let res
      try {
        res = await fetch(url)
        if (!res.ok) throw new Error("Relative fetch failed")
      } catch (err) {
        const useProxy = !hostIp || hostIp === "localhost" || hostIp === "127.0.0.1"
        const fallbackUrl = useProxy 
          ? url 
          : `http://${hostIp}:4000/api/promotions/public?tenantId=${encodeURIComponent(tId)}&_t=${Date.now()}`
        res = await fetch(fallbackUrl)
      }

      if (res.ok) {
        const data = await res.json()
        setPromotions(Array.isArray(data) ? data : (data.promotions ?? []))
      }
    } catch (e) {
      console.warn("Could not load promotions", e)
    }
  }

  // Refresh history every time user opens the Account tab
  React.useEffect(() => {
    if (activeTab === "account") {
      fetchOrderHistory(userProfile?.id || null)
    }
  }, [activeTab])

  const loadConfig = async (ip: string, tenant: string) => {
    try {
      // Try relative API path first (highly reliable via Next.js proxy)
      let url = `/api/restaurant/public/config`
      if (tenant) {
        url += `?tenantId=${tenant}`
      }

      let res
      try {
        res = await fetch(url)
        if (!res.ok) throw new Error("Relative fetch failed")
      } catch (err) {
        // Fallback to absolute URL if relative fetch fails
        const useProxy = !ip || ip === "localhost" || ip === "127.0.0.1"
        let fallbackUrl = useProxy 
          ? `/api/restaurant/public/config` 
          : `http://${ip}:4000/api/restaurant/public/config`
        if (tenant) {
          fallbackUrl += `?tenantId=${tenant}`
        }
        res = await fetch(fallbackUrl)
      }

      if (!res.ok) throw new Error("Could not fetch server configuration")

      const data = await res.json()
      setAppConfig(data)

      // Always resolve and store the canonical tenantId from the config response
      const resolvedTenantId = data.tenantId || tenant
      if (data.tenantId && data.tenantId !== tenant) {
        setTenantId(data.tenantId)
        setInputTenantId(data.tenantId)
        localStorage.setItem("hospitality_tenant_id", data.tenantId)
      }
      // Fetch promotions unconditionally whenever config loads — ensures they
      // always appear regardless of how the tenantId was originally resolved.
      if (resolvedTenantId) {
        fetchPromotions(resolvedTenantId)
      }
    } catch (e) {
      console.error(e)
      showToast("Could not load latest server configuration", "🔌")
    }
  }

  // Re-sort restaurants and group branch outlets under parent brands
  const sortedRestaurants = React.useMemo(() => {
    if (!appConfig.restaurants) return []
    // Filter for top-level outlets (where parent_id is null/undefined)
    let topLevel = appConfig.restaurants.filter(r => !r.parent_id);

    if (outletSearchQuery.trim() !== "") {
      const q = outletSearchQuery.toLowerCase().trim()
      topLevel = topLevel.filter(rest => {
        const nameMatch = rest.name.toLowerCase().includes(q)
        const branchMatch = (rest.branches || []).some(b => 
          b.name.toLowerCase().includes(q) || (b.address || "").toLowerCase().includes(q)
        )
        return nameMatch || branchMatch
      })
    }

    return topLevel.map(rest => {
      // Find branch child outlets (via rest.branches)
      let branches = rest.branches || []
      if (outletSearchQuery.trim() !== "") {
        const q = outletSearchQuery.toLowerCase().trim()
        branches = branches.filter(b => 
          rest.name.toLowerCase().includes(q) || b.name.toLowerCase().includes(q) || (b.address || "").toLowerCase().includes(q)
        )
      }

      let distance: number | undefined = undefined;
      if (branches.length > 0) {
        // Calculate min distance of its branches
        const branchDistances = branches.map(b => {
          const coords = RESTAURANT_COORDINATES[b.name] || RESTAURANT_COORDINATES[rest.name] || { latitude: 9.032, longitude: 38.742 }
          if (userCoords) {
            return calculateDistance(userCoords.latitude, userCoords.longitude, coords.latitude, coords.longitude)
          }
          return undefined;
        }).filter((d): d is number => d !== undefined);

        if (branchDistances.length > 0) {
          distance = Math.min(...branchDistances);
        }
      } else {
        // Fallback for standalone outlet
        const coords = RESTAURANT_COORDINATES[rest.name] || { latitude: 9.032, longitude: 38.742 }
        if (userCoords) {
          distance = calculateDistance(userCoords.latitude, userCoords.longitude, coords.latitude, coords.longitude)
        }
      }

      return {
        ...rest,
        distance,
        childrenCount: branches.length,
        children: branches
      }
    }).sort((a, b) => {
      if (preferredId) {
        // Check if preferredId matches the outlet or any of its branches
        const aMatches = a.id === preferredId || a.children.some(c => c.id === preferredId);
        const bMatches = b.id === preferredId || b.children.some(c => c.id === preferredId);
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
      }
      if (userCoords && a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    })
  }, [appConfig.restaurants, userCoords, preferredId])

  const applyConnectionSettings = () => {
    const cleanIp = inputIp.trim()
    const cleanTenant = inputTenantId.trim()

    if (cleanIp) {
      setHostIp(cleanIp)
      localStorage.setItem("hospitality_host_ip", cleanIp)
    }

    setTenantId(cleanTenant)
    localStorage.setItem("hospitality_tenant_id", cleanTenant)

    showToast("Connection settings applied!", "⚙️")
    loadConfig(cleanIp, cleanTenant)
    setActiveTab("home")
  }

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)

    if (serviceId === "dine-in" || serviceId === "takeaway") {
      const firstOutlet = sortedRestaurants[0]
      const defaultRestaurantId = firstOutlet?.id
      if (defaultRestaurantId) {
        const orderType = serviceId.toUpperCase()
        localStorage.setItem("show_restaurants_popup", "true")
        router.push(`/menu/${defaultRestaurantId}?orderType=${orderType}`)
      } else {
        showToast("No restaurants available", "⚠️")
      }
    } else if (serviceId === "delivery") {
      const savedAddress = localStorage.getItem("customer_delivery_address") || ""
      setDelivAddress(savedAddress)
      setView("delivery-form")
    }
  }

  const submitDeliveryAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (!delivName.trim() || !delivPhone.trim() || !delivAddress.trim()) {
      showToast("Please fill in all address details", "⚠️")
      return
    }

    localStorage.setItem("customer_delivery_address", delivAddress.trim())
    const firstOutlet = sortedRestaurants[0]
    const defaultRestaurantId = firstOutlet?.id
    if (defaultRestaurantId) {
      localStorage.setItem("show_restaurants_popup", "true")
      router.push(`/menu/${defaultRestaurantId}?orderType=DELIVERY&deliveryAddress=${encodeURIComponent(delivAddress)}`)
    } else {
      showToast("No restaurants available", "⚠️")
    }
  }

  const handleBranchSelect = (restaurantId: string, branchId?: string) => {
    const orderType = selectedService.toUpperCase() || "DINE_IN"
    let target = `/menu/${restaurantId}?orderType=${orderType}`
    if (branchId) {
      target += `&branchId=${branchId}`
    }
    if (orderType === "DELIVERY") {
      target += `&deliveryAddress=${encodeURIComponent(delivAddress)}`
    }
    // Set a flag in localStorage so the menu page knows to open the bottom sheet list of restaurants
    localStorage.setItem("show_restaurants_popup", "true")
    router.push(target)
  }

  const firstOutlet = sortedRestaurants[0]
  const activeRestaurant = firstOutlet

  // Automatically fetch promotions for the active restaurant's tenant if no explicit tenantId is resolved
  React.useEffect(() => {
    if (!tenantId && activeRestaurant?.tenant_id) {
      fetchPromotions(activeRestaurant.tenant_id)
    }
  }, [activeRestaurant, tenantId])

  // Horizontal auto-scrolling if more than one promotion is available
  React.useEffect(() => {
    if (promotions.length <= 1) return

    const interval = setInterval(() => {
      if (promoContainerRef.current) {
        const container = promoContainerRef.current
        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth
        const currentScroll = container.scrollLeft
        
        // Calculate the next scroll position
        // Assuming each card has roughly the same width (85% + gap)
        const cardWidth = clientWidth * 0.85 + 12 // 12px gap
        let nextScroll = currentScroll + cardWidth
        
        if (nextScroll >= scrollWidth - 10) {
          // Smooth wrap-around back to the beginning
          nextScroll = 0
        }
        
        container.scrollTo({
          left: nextScroll,
          behavior: 'smooth'
        })
      }
    }, 4000) // Scroll every 4 seconds

    return () => clearInterval(interval)
  }, [promotions])


  return (
    <div className={`min-h-screen font-sans pb-24 flex justify-center transition-colors duration-300 ${themeBg}`}>
      <div className="w-full max-w-md px-4 pt-4 flex flex-col gap-5 relative">
        
        <AnimatePresence>
          {toast.show && (
            <motion.div 
              initial={{ opacity: 0, y: -50, x: "-50%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-6 left-1/2 -translate-x-1/2 shadow-xl rounded-2xl px-5 py-3.5 flex items-center gap-2.5 z-[9999] w-max max-w-[90%] border border-amber-500/20 backdrop-blur-md ${
                theme === "dark" ? "bg-gray-900/90 text-white" : "bg-white/90 text-gray-800"
              }`}
            >
              <span className="text-lg">{toast.icon}</span>
              <span className="text-xs font-black tracking-wide">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {view === "home" && (
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">🍔</span>
              <span className={`font-black text-lg tracking-tight ${themeTextTitle}`}>
                {appConfig.business_name || "Hospitality Hub"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowSearch(s => !s)
                  if (showSearch) setOutletSearchQuery("")
                }}
                className={`p-2 rounded-full border transition-all active:scale-90 ${
                  showSearch
                    ? (theme === "dark" ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600")
                    : (theme === "dark" ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10" : "bg-white border-gray-100 shadow-sm text-gray-500 hover:text-amber-600 hover:bg-gray-50")
                }`}
                title="Search Outlets"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const next = theme === "dark" ? "light" : "dark"
                  setTheme(next)
                  localStorage.setItem("menu-theme", next)
                }}
                className={`p-2 rounded-full border transition-all active:scale-90 ${
                  theme === "dark" 
                    ? "bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10" 
                    : "bg-white border-gray-100 shadow-sm text-amber-600 hover:bg-gray-50"
                }`}
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowSettings(s => !s)}
                className={`p-2 rounded-full border transition-all active:scale-90 ${
                  theme === "dark" 
                    ? "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10" 
                    : "bg-white border-gray-100 shadow-sm text-gray-500 hover:text-amber-600 hover:bg-gray-50"
                }`}
                title="Connection Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Collapsible Search Panel (in-header, no scroll) ── */}
        {view === "home" && (
          <AnimatePresence>
            {showSearch && (
              <motion.div
                key="search-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className={`relative flex items-center rounded-2xl border transition-all ${
                  theme === "dark" 
                    ? "bg-white/5 border-white/10 focus-within:border-amber-500/50" 
                    : "bg-gray-100 border-gray-200 focus-within:border-amber-500 focus-within:bg-white"
                }`}>
                  <Search className={`w-3.5 h-3.5 absolute left-3.5 pointer-events-none ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`} />
                  <input
                    autoFocus
                    type="text"
                    value={outletSearchQuery}
                    onChange={(e) => setOutletSearchQuery(e.target.value)}
                    placeholder="Search outlets, brands, location..."
                    className={`w-full bg-transparent pl-9 pr-9 py-2.5 text-xs outline-none ${
                      theme === "dark" ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                    }`}
                  />
                  {outletSearchQuery && (
                    <button
                      onClick={() => setOutletSearchQuery("")}
                      className={`absolute right-3 p-1 rounded-full transition-colors ${
                        theme === "dark" ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-400 hover:text-gray-800"
                      }`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        {/* ── Collapsible Connection Settings Panel ── */}
        {showSettings && (
          <div className={`border rounded-3xl p-5 flex flex-col gap-4 shadow-sm relative transition-all ${themePanel}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-[10px] font-extrabold uppercase tracking-wider ${themeTextMuted}`}>Hub Connections</h3>
              <button 
                onClick={() => setShowSettings(false)} 
                className={`p-1 rounded-full ${theme === "dark" ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-400"}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={`text-[9px] font-bold uppercase tracking-wider ${themeTextMuted}`}>Server IP Address</label>
              <input
                type="text"
                placeholder="e.g. 192.168.1.8"
                value={inputIp}
                onChange={e => setInputIp(e.target.value)}
                className={`rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
                  theme === "dark" ? "bg-white/5 border-white/5 text-white" : "bg-gray-50 border-gray-100 text-gray-900"
                }`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={`text-[9px] font-bold uppercase tracking-wider ${themeTextMuted}`}>Tenant ID Override</label>
              <input
                type="text"
                placeholder="UUID (or blank for global)"
                value={inputTenantId}
                onChange={e => setInputTenantId(e.target.value)}
                className={`rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
                  theme === "dark" ? "bg-white/5 border-white/5 text-white" : "bg-gray-50 border-gray-100 text-gray-900"
                }`}
              />
            </div>
            <button
              onClick={applyConnectionSettings}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs py-3.5 rounded-xl shadow-md hover:from-amber-600 active:scale-98 transition-all text-center"
            >
              Apply Connection Updates
            </button>
          </div>
        )}

        {activeTab === "home" ? (
          <>
            {view === "home" && (
              <div className="flex flex-col gap-5">

                <div className="grid grid-cols-2 gap-3.5">
                  <motion.div 
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleServiceSelect("delivery")}
                    className={`relative overflow-hidden rounded-3xl p-4 flex flex-col items-center gap-3 cursor-pointer border text-center transition-all ${
                      theme === "dark"
                        ? "bg-[#1c1c1e] border-white/[0.08] hover:border-amber-500/30"
                        : "bg-white border-gray-100 hover:shadow-lg"
                    }`}
                  >
                    <div className="w-full h-24 rounded-2xl overflow-hidden relative group">
                      <img 
                        src="https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=500&q=80" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt="Delivery"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute top-2 left-2 bg-[#DA291C] text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow">
                        Fast Delivery
                      </span>
                    </div>
                    <div>
                      <h4 className={`font-black text-sm ${themeTextTitle}`}>Delivery</h4>
                      <p className={`text-[10px] ${themeTextMuted} font-medium`}>Fast direct to door</p>
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleServiceSelect("dine-in")}
                    className={`relative overflow-hidden rounded-3xl p-4 flex flex-col items-center gap-3 cursor-pointer border text-center transition-all ${
                      theme === "dark"
                        ? "bg-[#1c1c1e] border-white/[0.08] hover:border-amber-500/30"
                        : "bg-white border-gray-100 hover:shadow-lg"
                    }`}
                  >
                    <div className="w-full h-24 rounded-2xl overflow-hidden relative group">
                      <img 
                        src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt="Dine-In"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute top-2 left-2 bg-[#FFC72C] text-black text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow">
                        Eat In Restaurant
                      </span>
                    </div>
                    <div>
                      <h4 className={`font-black text-sm ${themeTextTitle}`}>Dine-In</h4>
                      <p className={`text-[10px] ${themeTextMuted} font-medium`}>Instant table service</p>
                    </div>
                  </motion.div>
                </div>

                <div className={`border rounded-2xl p-3 flex justify-between items-center ${
                  theme === "dark" ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
                }`}>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-500">
                    <MapPin className="w-4 h-4 text-[#FFC72C]" />
                    <span className="truncate max-w-[220px]">
                      {activeRestaurant ? `Ordering from: ${activeRestaurant.name}` : "No restaurant selected"}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleServiceSelect("dine-in")}
                    className="text-[10px] font-black uppercase text-amber-500 hover:text-amber-400 ml-2"
                  >
                    {activeRestaurant ? "Switch" : "Select"}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className={`text-[10px] font-extrabold uppercase tracking-wider ${themeTextMuted}`}>Other Services</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "takeaway", icon: "🛍️", label: "Takeaway" },
                      { id: "inroom", icon: "🛌", label: "In-Room Dining", comingSoon: true, msg: "In-Room Dining is coming soon!", toastIcon: "🏨" },
                      { id: "reserve", icon: "📅", label: "Reservations", comingSoon: true, msg: "Reservations are coming soon!", toastIcon: "📅" },
                      { id: "book", icon: "🏨", label: "Hotel Stay", comingSoon: true, msg: "Hotel booking is coming soon!", toastIcon: "🏨" }
                    ].map(service => (
                      <div 
                        key={service.id}
                        onClick={() => {
                          if (service.comingSoon) {
                            showToast(service.msg, service.toastIcon)
                          } else {
                            handleServiceSelect(service.id)
                          }
                        }}
                        className={`border rounded-2xl p-2.5 flex flex-col items-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                          theme === "dark"
                            ? "bg-[#1c1c1e] border-white/[0.08] hover:bg-neutral-800"
                            : "bg-white border-gray-100 hover:shadow-md"
                        } ${service.comingSoon ? "opacity-55" : ""}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          theme === "dark" ? "bg-white/5" : "bg-gray-50"
                        }`}>
                          {service.icon}
                        </div>
                        <span className={`text-[9px] font-black leading-tight ${themeTextTitle}`}>{service.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className={`text-[10px] font-extrabold uppercase tracking-wider ${themeTextMuted}`}>Exclusive Offers</h3>
                  <div 
                    ref={promoContainerRef}
                    className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory"
                  >
                    {promotions.length > 0 ? (
                      promotions.map(promo => (
                        <div
                          key={promo.id}
                          onClick={() => setSelectedPromo(promo)}
                          className={`min-w-[85%] snap-start border rounded-3xl flex flex-col gap-2 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform ${
                            theme === "dark"
                              ? "bg-gradient-to-br from-[#DA291C]/15 to-transparent border-red-500/10"
                              : "bg-gradient-to-br from-[#FFC72C]/10 to-transparent border-[#FFC72C]/20 shadow-sm"
                          }`}
                        >
                          {/* Banner image */}
                          {promo.banner_url && (
                            <div className="h-28 overflow-hidden">
                              <img
                                src={promo.banner_url}
                                alt={promo.title}
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                              />
                            </div>
                          )}
                          <div className="p-4 flex flex-col gap-2">
                            {/* Decoration */}
                            <div className="absolute top-0 right-0 w-24 h-full bg-[#FFC72C]/10 skew-x-12 transform origin-top-right pointer-events-none" />
                            <div className="flex items-center justify-between z-10 gap-2">
                              <span className="text-[8px] font-black bg-[#DA291C] text-white px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                                {promo.type?.replace(/_/g, ' ') || 'OFFER'}
                              </span>
                              {promo.discount_value && (
                                <span className="text-[8px] font-black bg-[#FFC72C] text-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                                  {promo.discount_value}
                                </span>
                              )}
                            </div>
                            <h4 className={`font-black text-sm z-10 ${themeTextTitle}`}>{promo.title}</h4>
                            {promo.description && (
                              <p className={`text-[10px] leading-relaxed z-10 ${themeTextMuted}`}>{promo.description}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      // Fallback card when no promotions are configured
                      <div className={`min-w-[85%] snap-start border rounded-3xl p-4 flex flex-col gap-2 relative overflow-hidden ${
                        theme === "dark"
                          ? "bg-gradient-to-br from-[#DA291C]/15 to-transparent border-red-500/10"
                          : "bg-gradient-to-br from-[#FFC72C]/10 to-transparent border-[#FFC72C]/20 shadow-sm"
                      }`}>
                        <div className="absolute top-0 right-0 w-24 h-full bg-[#FFC72C]/10 skew-x-12 transform origin-top-right" />
                        <div className="flex items-center justify-between z-10">
                          <span className="text-[8px] font-black bg-[#DA291C] text-white px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                            APP DEBUG COUPON
                          </span>
                          <span className="text-[10px] font-black text-amber-500">Code: DEBUG50</span>
                        </div>
                        <h4 className={`font-black text-sm z-10 ${themeTextTitle}`}>🍔 50% Off Your First Order! (DEBUG)</h4>
                        <p className={`text-[10px] leading-relaxed z-10 ${themeTextMuted}`}>Enjoy half price on your first Takeaway or Delivery order. Exclusions apply. (v2)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pb-6">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-[10px] font-extrabold uppercase tracking-wider ${themeTextMuted}`}>Featured Outlets</h3>
                    {outletSearchQuery && (
                      <span className="text-[9px] font-extrabold text-[#FFC72C] uppercase tracking-wide">
                        {sortedRestaurants.length} found
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {sortedRestaurants.length === 0 ? (
                      <div className={`border rounded-2xl p-6 text-center text-xs shadow-sm ${
                        theme === "dark" ? "bg-white/5 border-white/5" : "bg-white border-gray-100"
                      }`}>
                        No active dining outlets discovered.
                      </div>
                    ) : (
                      sortedRestaurants.map(rest => {
                        const isBrand = rest.children && rest.children.length > 1

                        const onClick = () => {
                          if (isBrand) {
                            setPickerBrand(rest)
                          } else {
                            handleBranchSelect(rest.id, rest.children?.[0]?.id)
                          }
                        }
                        return (
                          <motion.div 
                            key={rest.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClick}
                            className={`border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${themeCard} hover:border-[#FFC72C]/30`}
                          >
                            <div className="flex items-center gap-3">
                              {rest.logo_url ? (
                                <img src={rest.logo_url} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/5" alt={rest.name} />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-[#FFC72C]/10 text-[#FFC72C] flex items-center justify-center font-extrabold text-sm border border-[#FFC72C]/10 shrink-0">
                                  {rest.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <h4 className={`font-bold text-xs ${themeTextTitle}`}>{rest.name}</h4>
                                <div className="flex items-center gap-1.5 mt-1 text-[9px]">
                                  {isBrand ? (
                                    <span className="bg-[#FFC72C]/10 text-[#FFC72C] border border-[#FFC72C]/20 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide">
                                      {rest.children.length} outlets
                                    </span>
                                  ) : (
                                    <span className={`${themeTextMuted} font-medium`}>{rest.branch?.name || "Main Outlet"}</span>
                                  )}
                                  {rest.distance !== undefined && (
                                    <>
                                      <span className={themeTextMuted}>•</span>
                                      <span className="text-[#FFC72C] font-extrabold">{rest.distance} km away</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 ${themeTextMuted} opacity-80`} />
                          </motion.div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {view === "delivery-form" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setView("home")} 
                    className={`p-2 rounded-full border text-gray-600 active:scale-90 transition-all ${
                      theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-gray-100"
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className={`font-extrabold text-lg ${themeTextTitle}`}>Delivery Details</h2>
                </div>
                <form onSubmit={submitDeliveryAddress} className={`border rounded-3xl p-5 flex flex-col gap-4 shadow-sm ${themePanel}`}>
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[9px] font-bold uppercase tracking-wider ${themeTextMuted}`}>Your Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      value={delivName}
                      onChange={e => setDelivName(e.target.value)}
                      className={`rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
                        theme === "dark" ? "bg-white/5 border-white/5 text-white" : "bg-gray-50 border-gray-100 text-gray-900"
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[9px] font-bold uppercase tracking-wider ${themeTextMuted}`}>Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. +251 911..."
                      value={delivPhone}
                      onChange={e => setDelivPhone(e.target.value)}
                      className={`rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
                        theme === "dark" ? "bg-white/5 border-white/5 text-white" : "bg-gray-50 border-gray-100 text-gray-900"
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[9px] font-bold uppercase tracking-wider ${themeTextMuted}`}>Delivery Address</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Room 402, Block B, Main Campus"
                      value={delivAddress}
                      onChange={e => setDelivAddress(e.target.value)}
                      className={`rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
                        theme === "dark" ? "bg-white/5 border-white/5 text-white" : "bg-gray-50 border-gray-100 text-gray-900"
                      }`}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs py-3.5 rounded-xl shadow-md active:scale-98 transition-all text-center mt-2"
                  >
                    Select Restaurant & Open Menu
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          // ── ACCOUNT (MyOwn) TAB ──
          <div className="flex flex-col gap-0 pb-24">

            {/* ── Profile Hero ── */}
            <div className={`relative overflow-hidden rounded-3xl p-6 ${
              theme === "dark" 
                ? "bg-gradient-to-br from-[#FFC72C]/15 via-amber-700/10 to-transparent border border-white/[0.08]" 
                : "bg-gradient-to-br from-[#FFC72C] to-amber-500 text-white"
            }`}>
              {/* Decorative glowing blobs in dark mode */}
              {theme === "dark" && (
                <>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />
                </>
              )}
              {theme === "light" && (
                <>
                  <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/5 translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                </>
              )}

              <div className="relative z-10 flex items-center gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {userProfile?.avatar ? (
                    <img
                      src={userProfile.avatar}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/30 shadow-xl"
                      alt="Avatar"
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl border-2 ${
                      theme === "dark" 
                        ? "bg-white/5 border-white/10 text-white" 
                        : "bg-white/20 backdrop-blur-sm border-white/30 text-white"
                    }`}>
                      {userProfile?.name?.charAt(0).toUpperCase() || <User className="w-7 h-7 text-white" />}
                    </div>
                  )}
                  {userProfile?.id && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FFC72C] text-black flex items-center justify-center shadow-md border-2 border-[#0c0c0c]">
                      <span className="text-[9px] font-black">✓</span>
                    </div>
                  )}
                </div>

                {/* Name + email */}
                <div className="flex-1 min-w-0">
                  <h2 className={`font-black text-lg leading-tight ${theme === "dark" ? "text-white" : "text-white"}`}>
                    {userProfile?.name || "Guest User"}
                  </h2>
                  <p className={`text-[10px] font-semibold mt-0.5 truncate ${theme === "dark" ? "text-gray-400" : "text-white/80"}`}>
                    {userProfile?.email || "eChat Authenticated Guest"}
                  </p>
                  <span className={`inline-block mt-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    theme === "dark" 
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                      : "bg-white/20 text-white border-white/30"
                  }`}>
                    {userProfile?.id ? "Member" : "Guest"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mx-4 -mt-8 relative z-10">
              <div className={`rounded-2xl shadow-xl border grid grid-cols-4 divide-x ${
                theme === "dark" 
                  ? "bg-[#1c1c1e] border-white/[0.08] divide-white/[0.08]" 
                  : "bg-white border-gray-100 divide-gray-100"
              }`}>
                {[
                  { icon: "📋", label: "My Orders", sub: `${orderHistory.length} order${orderHistory.length !== 1 ? "s" : ""}`, action: () => router.push("/orders") },
                  { icon: "❤️", label: "Saved", sub: "Coming soon", action: () => showToast("Saved places coming soon!", "❤️") },
                  { icon: "🎟️", label: "Vouchers", sub: "0 active", action: () => showToast("Vouchers coming soon!", "🎟️") },
                  { icon: "💬", label: "Support", sub: "Help center", action: () => showToast("Support coming soon!", "💬") },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex flex-col items-center gap-1 py-4 px-1 transition-all hover:scale-105 active:scale-95"
                  >
                    <span className="text-xl mb-0.5">{item.icon}</span>
                    <span className={`text-[9px] font-black ${themeTextTitle}`}>{item.label}</span>
                    <span className={`text-[8px] ${themeTextMuted} font-semibold`}>{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── My Orders Section ── */}
            <div className="mt-6 px-4 flex flex-col gap-3">
              <h3 className={`font-extrabold text-sm ${themeTextTitle}`}>My Orders</h3>

              <button
                onClick={() => router.push("/orders")}
                className={`w-full p-4 rounded-2xl border text-[11px] font-extrabold flex items-center justify-between active:scale-95 transition-all ${
                  theme === "dark"
                    ? "bg-[#0b0f19] border-white/5 text-gray-200 hover:bg-white/5"
                    : "bg-white border-gray-100 text-gray-700 hover:bg-gray-50 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <div className="text-left">
                    <p className={`font-bold text-xs ${themeTextTitle}`}>View Recent Orders</p>
                    <p className={`text-[9px] ${themeTextMuted} font-semibold mt-0.5`}>
                      {loadingHistory 
                        ? "Loading your orders..." 
                        : orderHistory.length > 0 
                          ? `Check details of your ${orderHistory.length} orders` 
                          : "View your order history"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {orderHistory.length > 0 && !loadingHistory && (
                    <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      {orderHistory.length} total
                    </span>
                  )}
                  <ChevronRight className={`w-4 h-4 ${themeTextMuted}`} />
                </div>
              </button>
            </div>

            {/* ── Settings List ── */}
            <div className={`mt-6 mx-4 border rounded-2xl overflow-hidden shadow-sm ${
              theme === "dark" ? "bg-[#0b0f19] border-white/5" : "bg-white border-gray-100"
            }`}>
              {[
                { icon: "📍", label: "My Addresses" },
                { icon: "🔔", label: "Notifications" },
                { icon: "🌐", label: "Language" },
                { icon: "⭐", label: "Rate the App" },
              ].map((item, idx, arr) => (
                <button
                  key={item.label}
                  onClick={() => showToast(`${item.label} coming soon!`, item.icon)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-gray-50 transition-colors ${
                    idx < arr.length - 1 
                      ? (theme === "dark" ? "border-b border-white/5" : "border-b border-gray-50") 
                      : ""
                  } ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span className={`text-xs font-semibold ${themeTextTitle}`}>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${themeTextMuted}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Branch picker bottom sheet */}
        {pickerBrand && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ contain: "layout" }}>
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setPickerBrand(null)}
            />
            {/* Sheet */}
            <div className={`relative w-full max-w-md rounded-t-3xl shadow-2xl z-10 pb-safe overflow-hidden border-t ${
              theme === "dark" ? "bg-[#0b0f19] border-white/10" : "bg-white border-gray-200"
            }`}>
              {/* Handle */}
              <div className={`w-10 h-1 rounded-full mx-auto mt-3 mb-4 ${theme === "dark" ? "bg-white/10" : "bg-gray-200"}`} />
              {/* Header */}
              <div className="px-5 pb-3">
                <div className="flex items-center gap-3">
                  {pickerBrand.logo_url ? (
                    <img src={pickerBrand.logo_url} className="w-10 h-10 rounded-xl object-cover" alt={pickerBrand.name} />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-extrabold text-sm border border-amber-500/10">
                      {pickerBrand.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className={`font-black text-sm ${themeTextTitle}`}>{pickerBrand.name}</h3>
                    <p className={`text-[10px] ${themeTextMuted}`}>Select a branch near you</p>
                  </div>
                </div>
              </div>
              <div className={`h-px mx-5 ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`} />
              {/* Branch list */}
              <div className="px-4 py-3 flex flex-col gap-2 max-h-80 overflow-y-auto">
                {(pickerBrand.children || []).map((branch: any) => {
                  const branchCoords = RESTAURANT_COORDINATES[branch.name] || { latitude: 9.032, longitude: 38.742 }
                  const branchDist = userCoords
                    ? calculateDistance(userCoords.latitude, userCoords.longitude, branchCoords.latitude, branchCoords.longitude)
                    : undefined
                  return (
                    <div
                      key={branch.id}
                      onClick={() => {
                        setPickerBrand(null)
                        handleBranchSelect(pickerBrand.id, branch.id)
                      }}
                      className={`flex items-center justify-between border rounded-2xl px-4 py-3.5 cursor-pointer transition-all active:scale-[0.98] ${
                        theme === "dark"
                          ? "bg-white/5 border-white/5 hover:bg-amber-500/5 hover:border-amber-500/30"
                          : "bg-gray-50 border-gray-100 hover:bg-amber-50 hover:border-amber-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {branch.logo_url ? (
                          <img src={branch.logo_url} className="w-9 h-9 rounded-lg object-cover" alt={branch.name} />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-extrabold text-xs border border-amber-500/10">
                            {branch.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className={`text-xs font-bold ${themeTextTitle}`}>{branch.name}</p>
                          {branchDist !== undefined && (
                            <p className="text-[9px] text-amber-500 font-semibold mt-0.5">{branchDist} km away</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${themeTextMuted}`} />
                    </div>
                  )
                })}
              </div>
              <div className="px-4 pb-6 pt-2">
                <button
                  onClick={() => setPickerBrand(null)}
                  className={`w-full py-3 rounded-2xl text-xs font-bold active:scale-95 transition-all ${
                    theme === "dark" ? "bg-white/5 text-gray-300 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className={`w-full max-w-md border-t px-8 py-3.5 pb-6 flex justify-around items-center shadow-lg pointer-events-auto rounded-t-3xl ${
            theme === "dark" ? "bg-[#030712]/95 border-white/5 text-white" : "bg-white/95 border-gray-100 text-gray-900"
          }`} style={{ backdropFilter: "blur(12px)" }}>
            <div 
              onClick={() => {
                setActiveTab("home")
                setView("home")
              }}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                activeTab === "home" ? "text-amber-500 scale-105 font-black" : themeTextMuted
              }`}
            >
              <HomeIcon className="w-5 h-5" />
              <span className="text-[9px] font-extrabold">Home</span>
            </div>

            <div 
              onClick={() => setActiveTab("account")}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                activeTab === "account" ? "text-amber-500 scale-105 font-black" : themeTextMuted
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[9px] font-extrabold">MyOwn</span>
            </div>
          </div>
        </div>

        {/* Promotion Details Modal */}
        <AnimatePresence>
          {selectedPromo && (
            <>
              {/* Overlay */}
              <motion.div
                key="promo-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPromo(null)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
              {/* Modal Dialog */}
              <motion.div
                key="promo-modal"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className={`fixed bottom-0 inset-x-0 z-50 max-w-md mx-auto rounded-t-3xl border-t p-6 pb-8 flex flex-col gap-4 shadow-2xl ${
                  theme === "dark" 
                    ? "bg-[#1c1c1e] border-white/[0.08] text-white" 
                    : "bg-white border-gray-200 text-gray-900"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase bg-[#DA291C] text-white px-2 py-0.5 rounded shadow-sm">
                    {selectedPromo.type?.replace(/_/g, ' ') || 'PROMOTION'}
                  </span>
                  <button
                    onClick={() => setSelectedPromo(null)}
                    className={`p-1.5 rounded-full ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Banner */}
                {selectedPromo.banner_url && (
                  <div className="h-40 rounded-2xl overflow-hidden shadow-md">
                    <img
                      src={selectedPromo.banner_url}
                      alt={selectedPromo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-black leading-snug">{selectedPromo.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {selectedPromo.discount_value && (
                      <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                        {selectedPromo.discount_value}
                      </span>
                    )}
                    {selectedPromo.code && (
                      <span className="text-xs font-mono font-bold bg-[var(--surface-hover)] border border-[var(--surface-border)] px-2 py-0.5 rounded text-neutral-400">
                        Code: {selectedPromo.code}
                      </span>
                    )}
                  </div>
                  {selectedPromo.description && (
                    <p className={`text-xs leading-relaxed mt-2 ${theme === "dark" ? "text-neutral-300" : "text-gray-600"}`}>
                      {selectedPromo.description}
                    </p>
                  )}
                  {selectedPromo.terms_conditions && (
                    <div className="mt-2 border-t pt-2 border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Terms & Conditions</p>
                      <p className={`text-[10px] leading-relaxed mt-1 whitespace-pre-line ${theme === "dark" ? "text-neutral-400" : "text-gray-500"}`}>
                        {selectedPromo.terms_conditions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    setSelectedPromo(null);
                    // Find correct target restaurant ID (scope logic)
                    const targetRestId = selectedPromo.restaurant_id || activeRestaurant?.id || (sortedRestaurants[0]?.id);
                    if (targetRestId) {
                      const orderType = selectedService.toUpperCase() || "DINE_IN";
                      let url = `/menu/${targetRestId}?orderType=${orderType}`;
                      if (selectedPromo.branch_id) {
                        url += `&branchId=${selectedPromo.branch_id}`;
                      }
                      if (selectedPromo.scope === "CATEGORY" && selectedPromo.category_id) {
                        url += `&categoryId=${selectedPromo.category_id}`;
                      } else if (selectedPromo.scope === "MENU_ITEM" && selectedPromo.menu_item_id) {
                        url += `&menuItemId=${selectedPromo.menu_item_id}`;
                      }
                      localStorage.setItem("show_restaurants_popup", "false");
                      router.push(url);
                    }
                  }}
                  className="w-full py-3 bg-[#DA291C] text-white rounded-xl font-bold text-sm shadow-lg hover:bg-[#DA291C]/90 transition-all text-center mt-2"
                >
                  {selectedPromo.scope === "MENU_ITEM"
                    ? "Go to Menu Item"
                    : selectedPromo.scope === "CATEGORY"
                    ? "Go to Category"
                    : "Start Ordering"}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
