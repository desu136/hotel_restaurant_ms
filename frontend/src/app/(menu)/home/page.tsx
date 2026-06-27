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
  X
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
  logo_url?: string | null
  branch_id?: string | null
  parent_id?: string | null
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

  // Toast status
  const [toast, setToast] = React.useState<{ show: boolean; message: string; icon: string }>({
    show: false,
    message: "",
    icon: "✨"
  })

  // Helper to trigger custom toasts
  const showToast = (message: string, icon: string = "✨") => {
    setToast({ show: true, message, icon })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  // Load configuration and cached context parameters
  React.useEffect(() => {
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

      if (data.tenantId && data.tenantId !== tenant) {
        setTenantId(data.tenantId)
        setInputTenantId(data.tenantId)
        localStorage.setItem("hospitality_tenant_id", data.tenantId)
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
    const topLevel = appConfig.restaurants.filter(r => !r.parent_id);

    return topLevel.map(rest => {
      // Find branch child outlets
      const children = appConfig.restaurants.filter(r => r.parent_id === rest.id);

      let distance: number | undefined = undefined;
      if (rest.branch_id) {
        // Standalone outlet
        const coords = RESTAURANT_COORDINATES[rest.name] || { latitude: 9.032, longitude: 38.742 }
        if (userCoords) {
          distance = calculateDistance(userCoords.latitude, userCoords.longitude, coords.latitude, coords.longitude)
        }
      } else if (children.length > 0) {
        // Brand parent: get min distance of children
        const childDistances = children.map(c => {
          const coords = RESTAURANT_COORDINATES[c.name] || { latitude: 9.032, longitude: 38.742 }
          if (userCoords) {
            return calculateDistance(userCoords.latitude, userCoords.longitude, coords.latitude, coords.longitude)
          }
          return undefined;
        }).filter((d): d is number => d !== undefined);
        
        if (childDistances.length > 0) {
          distance = Math.min(...childDistances);
        }
      }

      return {
        ...rest,
        distance,
        childrenCount: children.length,
        children
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
      const defaultRestaurantId = firstOutlet?.branch_id ? firstOutlet.id : firstOutlet?.children?.[0]?.id
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
    const defaultRestaurantId = firstOutlet?.branch_id ? firstOutlet.id : firstOutlet?.children?.[0]?.id
    if (defaultRestaurantId) {
      localStorage.setItem("show_restaurants_popup", "true")
      router.push(`/menu/${defaultRestaurantId}?orderType=DELIVERY&deliveryAddress=${encodeURIComponent(delivAddress)}`)
    } else {
      showToast("No restaurants available", "⚠️")
    }
  }

  const handleBranchSelect = (restaurantId: string) => {
    const orderType = selectedService.toUpperCase() || "DINE_IN"
    let target = `/menu/${restaurantId}?orderType=${orderType}`
    if (orderType === "DELIVERY") {
      target += `&deliveryAddress=${encodeURIComponent(delivAddress)}`
    }
    // Set a flag in localStorage so the menu page knows to open the bottom sheet list of restaurants
    localStorage.setItem("show_restaurants_popup", "true")
    router.push(target)
  }

  const firstOutlet = sortedRestaurants[0]
  const activeBranch = firstOutlet?.branch_id ? firstOutlet : firstOutlet?.children?.[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 font-sans pb-24 flex justify-center">
      <div className="w-full max-w-md px-4 pt-4 flex flex-col gap-5 relative">
        
        <AnimatePresence>
          {toast.show && (
            <motion.div 
              initial={{ opacity: 0, y: -50, x: "-50%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 bg-white border border-amber-500/25 shadow-lg rounded-2xl px-5 py-3 flex items-center gap-2.5 z-[9999] w-max max-w-[90%]"
            >
              <span className="text-lg">{toast.icon}</span>
              <span className="text-xs font-bold text-gray-800">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {view === "home" && (
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍔</span>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">
                {appConfig.business_name || "Hospitality Hub"}
              </span>
            </div>
            <button
              onClick={() => setShowSettings(s => !s)}
              className="p-2 rounded-full bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-amber-600 active:scale-90 transition-all"
              title="Connection Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Collapsible Connection Settings Panel ── */}
        {showSettings && (
          <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col gap-4 shadow-sm relative">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Hub Connections</h3>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Server IP Address</label>
              <input
                type="text"
                placeholder="e.g. 192.168.1.8"
                value={inputIp}
                onChange={e => setInputIp(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs outline-none focus:border-amber-500 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Tenant ID Override</label>
              <input
                type="text"
                placeholder="UUID (or blank for global)"
                value={inputTenantId}
                onChange={e => setInputTenantId(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs outline-none focus:border-amber-500 transition-all"
              />
            </div>
            <button
              onClick={applyConnectionSettings}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-sm hover:from-amber-600 active:scale-98 transition-all text-center"
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
                  <div 
                    onClick={() => handleServiceSelect("delivery")}
                    className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col items-center gap-3 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-95 text-center overflow-hidden"
                  >
                    <img 
                      src="https://tse1.mm.bing.net/th/id/OIP.f2-mC5CmtuOFuopRSyRPIgHaHa?pid=Api&h=220&P=0" 
                      className="w-full h-24 object-cover rounded-xl"
                      alt="Delivery"
                    />
                    <div>
                      <h4 className="font-black text-sm text-gray-800">Delivery</h4>
                      <p className="text-[10px] text-gray-500">Fast direct to door</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleServiceSelect("dine-in")}
                    className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col items-center gap-3 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-95 text-center overflow-hidden"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=80" 
                      className="w-full h-24 object-cover rounded-xl"
                      alt="Dine-In"
                    />
                    <div>
                      <h4 className="font-black text-sm text-gray-800">Dine-In</h4>
                      <p className="text-[10px] text-gray-500">Eat at our tables</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>
                      {activeBranch ? `Ordering from: ${activeBranch.name}` : "No branch selected"}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleServiceSelect("dine-in")}
                    className="text-[10px] font-black uppercase text-amber-700 hover:text-amber-800"
                  >
                    {activeBranch ? "Switch" : "Select"}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Other Services</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <div 
                      onClick={() => handleServiceSelect("takeaway")}
                      className="bg-white border border-gray-100 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 cursor-pointer hover:shadow-sm text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-lg">
                        🛍️
                      </div>
                      <span className="text-[10px] font-black text-gray-700">Takeaway</span>
                    </div>

                    <div 
                      onClick={() => showToast("In-Room Dining is coming soon!", "🏨")}
                      className="bg-white border border-gray-100 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 opacity-55 cursor-pointer text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-lg">
                        🛌
                      </div>
                      <span className="text-[10px] font-black text-gray-700">In-Room</span>
                    </div>

                    <div 
                      onClick={() => showToast("Reservations are coming soon!", "📅")}
                      className="bg-white border border-gray-100 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 opacity-55 cursor-pointer text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-lg">
                        📅
                      </div>
                      <span className="text-[10px] font-black text-gray-700">Reserve</span>
                    </div>

                    <div 
                      onClick={() => showToast("Hotel booking is coming soon!", "🏨")}
                      className="bg-white border border-gray-100 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 opacity-55 cursor-pointer text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-lg">
                        🏨
                      </div>
                      <span className="text-[10px] font-black text-gray-700">Book Room</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Special Offers</h3>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
                    <div className="min-w-[85%] snap-start bg-gradient-to-br from-pink-500/10 to-amber-500/10 border border-pink-500/5 rounded-3xl p-4 flex flex-col gap-1.5">
                      <span className="text-[9px] font-extrabold bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-md w-fit uppercase">Promotion</span>
                      <h4 className="font-bold text-xs text-gray-800">🍔 50% Off First Dining Order</h4>
                      <p className="text-[10px] text-gray-500">Use code WELCOME50 when placing takeaway or delivery. Valid today only.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pb-6">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Featured Outlets</h3>
                  <div className="flex flex-col gap-2">
                    {sortedRestaurants.length === 0 ? (
                      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-xs text-gray-500 shadow-sm">
                        No active dining outlets discovered.
                      </div>
                    ) : (
                      sortedRestaurants.map(rest => {
                        const isBrand = !rest.branch_id && rest.children && rest.children.length > 0
                        const onClick = () => {
                          if (isBrand) {
                            setPickerBrand(rest)
                          } else {
                            handleBranchSelect(rest.id)
                          }
                        }
                        return (
                          <div 
                            key={rest.id}
                            onClick={onClick}
                            className="bg-white border border-gray-50 rounded-2xl p-3 flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                          >
                            <div className="flex items-center gap-3">
                              {rest.logo_url ? (
                                <img src={rest.logo_url} className="w-12 h-12 rounded-xl object-cover" alt={rest.name} />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-extrabold text-sm border border-amber-500/5">
                                  {rest.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-xs text-gray-800">{rest.name}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-gray-400">
                                  {isBrand ? (
                                    <span className="text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-md">
                                      {rest.children.length} branch{rest.children.length !== 1 ? "es" : ""}
                                    </span>
                                  ) : (
                                    <span>{rest.branch?.name || "Outlet"}</span>
                                  )}
                                  {rest.distance !== undefined && (
                                    <>
                                      <span>•</span>
                                      <span className="text-amber-600 font-semibold">{rest.distance} km away</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                          </div>
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
                  <button onClick={() => setView("home")} className="p-2 rounded-full bg-white border border-gray-100 text-gray-600 active:scale-90 transition-all">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="font-extrabold text-lg text-gray-900">Delivery Details</h2>
                </div>
                <form onSubmit={submitDeliveryAddress} className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Your Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      value={delivName}
                      onChange={e => setDelivName(e.target.value)}
                      className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. +251 911..."
                      value={delivPhone}
                      onChange={e => setDelivPhone(e.target.value)}
                      className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Delivery Address</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Room 402, Block B, Main Campus"
                      value={delivAddress}
                      onChange={e => setDelivAddress(e.target.value)}
                      className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md active:scale-98 transition-all text-center mt-2"
                  >
                    Select Restaurant & Open Menu
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          // ── ACCOUNT TAB — McDonald's style ──
          <div className="flex flex-col gap-0 pb-24">

            {/* ── Profile Hero ── */}
            <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 px-5 pt-8 pb-16">
              {/* Decorative blobs */}
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/5 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="relative z-10 flex items-center gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {userProfile?.avatar ? (
                    <img
                      src={userProfile.avatar}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-xl"
                      alt="Avatar"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-2xl font-black shadow-xl">
                      {userProfile?.name?.charAt(0).toUpperCase() || <User className="w-7 h-7 text-white" />}
                    </div>
                  )}
                  {userProfile?.id && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md">
                      <span className="text-amber-500 text-[9px] font-black">✓</span>
                    </div>
                  )}
                </div>

                {/* Name + email */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-black text-lg leading-tight">
                    {userProfile?.name || "Guest"}
                  </h2>
                  <p className="text-white/75 text-[10px] font-semibold mt-0.5 truncate">
                    {userProfile?.email || "Sign in for the full experience"}
                  </p>
                  {userProfile?.id ? (
                    <span className="inline-block mt-1.5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/25">
                      Member
                    </span>
                  ) : (
                    <span className="inline-block mt-1.5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/15 text-white/70 border border-white/20">
                      Guest
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Quick Action Cards — floats over the hero ── */}
            <div className="mx-4 -mt-8 relative z-10">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 grid grid-cols-4 divide-x divide-gray-100">
                {[
                  { icon: "📋", label: "My Orders", sub: `${orderHistory.length} order${orderHistory.length !== 1 ? "s" : ""}`, action: () => router.push("/orders") },
                  { icon: "❤️", label: "Saved", sub: "Coming soon", action: () => showToast("Saved places coming soon!", "❤️") },
                  { icon: "🎟️", label: "Vouchers", sub: "0 active", action: () => showToast("Vouchers coming soon!", "🎟️") },
                  { icon: "💬", label: "Support", sub: "Help center", action: () => showToast("Support coming soon!", "💬") },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex flex-col items-center gap-1 py-4 px-1 active:bg-gray-50 transition-colors"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-[9px] font-black text-gray-800">{item.label}</span>
                    <span className="text-[8px] text-gray-400 font-semibold">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── My Orders Section ── */}
            <div className="mt-5 px-4 flex flex-col gap-3">
              <button
                onClick={() => router.push("/orders")}
                className="flex items-center justify-between w-full active:opacity-70 transition-opacity"
              >
                <h3 className="font-extrabold text-sm text-gray-900">My Orders</h3>
                <div className="flex items-center gap-1.5">
                  {orderHistory.length > 0 && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                      {orderHistory.length} total
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-7 h-7 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orderHistory.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-8 flex flex-col items-center gap-3 text-center shadow-sm">
                  <span className="text-5xl">🍽️</span>
                  <div>
                    <p className="font-black text-sm text-gray-800">No orders yet</p>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed max-w-[180px] mx-auto">
                      Your order history will appear here once you place your first order.
                    </p>
                  </div>
                  <button
                    onClick={() => { setActiveTab("home"); setView("home"); }}
                    className="mt-1 bg-amber-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm"
                  >
                    Order Now
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {orderHistory.slice(0, 2).map((order: any) => {
                    const restaurantName: string =
                      order.branch?.restaurants?.[0]?.name ||
                      order.branch?.name ||
                      appConfig.business_name ||
                      "Restaurant"
                    const restaurantId: string | null =
                      order.branch?.restaurants?.[0]?.id || null
                    const orderDate = new Date(order.created_at).toLocaleDateString([], { month: "short", day: "numeric" })
                    const orderTime = new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    const totalNum = parseFloat((order.total_amount || 0).toString())
                    const itemCount = (order.items || []).reduce((s: number, it: any) => s + (it.quantity || 1), 0)
                    const firstItem = (order.items || [])[0]
                    const firstImage = firstItem?.menu_item?.image_url

                    const orderTypeLabel =
                      order.order_type === "DINE_IN" ? "Dine-In" :
                      order.order_type === "TAKEAWAY" ? "Takeaway" :
                      order.order_type === "DELIVERY" ? "Delivery" : "Order"

                    const statusLabel =
                      order.status === "PENDING" ? "Pending" :
                      order.status === "PREPARING" ? "Preparing" :
                      order.status === "READY" ? "Ready" :
                      order.status === "COMPLETED" ? "Completed" :
                      order.status === "CANCELLED" ? "Cancelled" : order.status

                    const statusColor =
                      order.status === "PENDING" ? "text-amber-600 bg-amber-50 border-amber-200" :
                      order.status === "PREPARING" ? "text-blue-600 bg-blue-50 border-blue-200" :
                      order.status === "READY" ? "text-green-600 bg-green-50 border-green-200" :
                      order.status === "COMPLETED" ? "text-gray-500 bg-gray-50 border-gray-200" :
                      "text-red-500 bg-red-50 border-red-200"

                    return (
                      <div key={order.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

                        {/* Card Header — Restaurant + order type + status */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/70 border-b border-gray-100">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black text-gray-800 truncate">{restaurantName}</span>
                            <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200">
                              {orderTypeLabel}
                            </span>
                          </div>
                          <span className={`shrink-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Card Body — item image + name + details */}
                        <div className="flex gap-3 px-4 py-3">
                          {/* Food thumbnail */}
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0 flex items-center justify-center">
                            {firstImage ? (
                              <img src={firstImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl">🍽️</span>
                            )}
                          </div>

                          {/* Item details */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-gray-900 leading-snug line-clamp-1">
                              {firstItem?.menu_item?.display_name || "Item"}
                            </p>
                            {order.items?.length > 1 && (
                              <p className="text-[9px] text-gray-400 mt-0.5">
                                + {order.items.length - 1} more item{order.items.length - 1 !== 1 ? "s" : ""}
                              </p>
                            )}
                            <p className="text-[9px] text-gray-400 mt-1">
                              {orderDate} · {orderTime} · {itemCount} item{itemCount !== 1 ? "s" : ""}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="shrink-0 text-right">
                            <p className="font-extrabold text-sm text-gray-900">${totalNum.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Card Footer — action buttons */}
                        <div className="flex items-center gap-2 px-4 pb-3">
                          <button
                            onClick={() => showToast("Invoice feature coming soon!", "🧾")}
                            className="flex-1 py-2 rounded-xl border border-gray-200 text-[10px] font-bold text-gray-600 bg-white active:bg-gray-50 transition-all active:scale-95"
                          >
                            Get Invoice
                          </button>
                          <button
                            onClick={() => {
                              if (restaurantId) {
                                router.push(`/menu/${restaurantId}?orderType=${order.order_type || "DINE_IN"}`)
                              } else {
                                setActiveTab("home")
                                setView("home")
                              }
                            }}
                            className="flex-1 py-2 rounded-xl bg-amber-500 text-[10px] font-extrabold text-white active:bg-amber-600 transition-all active:scale-95 shadow-sm"
                          >
                            Order Again
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {/* View All Orders — shown when there are more than 2 */}
                  {orderHistory.length > 0 && (
                    <button
                      onClick={() => router.push("/orders")}
                      className="w-full py-3 rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 text-[11px] font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      View All Orders ({orderHistory.length})
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Settings List ── */}
            <div className="mt-6 mx-4 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {[
                { icon: "📍", label: "My Addresses" },
                { icon: "🔔", label: "Notifications" },
                { icon: "🌐", label: "Language" },
                { icon: "⭐", label: "Rate the App" },
              ].map((item, idx, arr) => (
                <button
                  key={item.label}
                  onClick={() => showToast(`${item.label} coming soon!`, item.icon)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-gray-50 transition-colors ${idx < arr.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs font-semibold text-gray-800">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        )}


        {/* Branch picker bottom sheet */}
        {pickerBrand && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ contain: "layout" }}>
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setPickerBrand(null)}
            />
            {/* Sheet */}
            <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 pb-safe overflow-hidden">
              {/* Handle */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />
              {/* Header */}
              <div className="px-5 pb-3">
                <div className="flex items-center gap-3">
                  {pickerBrand.logo_url ? (
                    <img src={pickerBrand.logo_url} className="w-10 h-10 rounded-xl object-cover" alt={pickerBrand.name} />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-extrabold text-sm">
                      {pickerBrand.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-black text-sm text-gray-900">{pickerBrand.name}</h3>
                    <p className="text-[10px] text-gray-400">Select a branch near you</p>
                  </div>
                </div>
              </div>
              <div className="h-px bg-gray-100 mx-5" />
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
                        handleBranchSelect(branch.id)
                      }}
                      className="flex items-center justify-between bg-gray-50 hover:bg-amber-50 border border-gray-100 hover:border-amber-200 rounded-2xl px-4 py-3.5 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        {branch.logo_url ? (
                          <img src={branch.logo_url} className="w-9 h-9 rounded-lg object-cover" alt={branch.name} />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-extrabold text-xs">
                            {branch.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-gray-800">{branch.name}</p>
                          {branchDist !== undefined && (
                            <p className="text-[9px] text-amber-600 font-semibold mt-0.5">{branchDist} km away</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  )
                })}
              </div>
              <div className="px-4 pb-6 pt-2">
                <button
                  onClick={() => setPickerBrand(null)}
                  className="w-full py-3 rounded-2xl bg-gray-100 text-gray-600 text-xs font-bold active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-3.5 pb-6 flex justify-around items-center shadow-lg pointer-events-auto rounded-t-3xl">
            <div 
              onClick={() => {
                setActiveTab("home")
                setView("home")
              }}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                activeTab === "home" ? "text-amber-600 scale-105" : "text-gray-400"
              }`}
            >
              <HomeIcon className="w-5 h-5" />
              <span className="text-[9px] font-extrabold">Home</span>
            </div>

            <div 
              onClick={() => setActiveTab("account")}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                activeTab === "account" ? "text-amber-600 scale-105" : "text-gray-400"
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[9px] font-extrabold">Account</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
