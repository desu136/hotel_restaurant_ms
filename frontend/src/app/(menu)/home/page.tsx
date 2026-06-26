"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  MapPin, 
  ArrowLeft, 
  User, 
  Home as HomeIcon, 
  ChevronRight, 
  Phone, 
  Map, 
  Activity, 
  Award, 
  Calendar, 
  Bed, 
  ShoppingBag, 
  Coffee,
  CheckCircle,
  AlertCircle
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
          setDelivName(profile.name) // prefill delivery name
        }

        const location = await getUserLocation()
        if (location) {
          setUserCoords(location)
        }

        const prefId = await getPreferredRestaurantId()
        if (prefId) {
          setPreferredId(prefId)
        }
      } catch (err) {
        console.warn("Failed to load SDK bridge initial states:", err)
      }
    }
    initSDKBridge()
  }, [searchParams])

  const loadConfig = async (ip: string, tenant: string) => {
    try {
      const useProxy = !ip || ip === "localhost" || ip === "127.0.0.1"
      let url = useProxy 
        ? `/api/restaurant/public/config` 
        : `http://${ip}:4000/api/restaurant/public/config`

      if (tenant) {
        url += `?tenantId=${tenant}`
      }

      const res = await fetch(url)
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
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} className="w-14 h-14 rounded-full object-cover border border-white/20" alt="Avatar" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white border border-white/20">
                  {userProfile?.name?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}
              <div>
                <h4 className="font-black text-sm text-gray-800">{userProfile?.name || "Guest Customer"}</h4>
                <p className="text-[9px] text-amber-600 font-extrabold uppercase mt-0.5 tracking-wider">
                  {userProfile?.email || "Premium Loyalty Member"}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Hub Connections</h3>
              
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
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-sm hover:from-amber-600 active:scale-98 transition-all text-center mt-2"
              >
                Apply Connection Updates
              </button>
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
