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

interface Restaurant {
  id: string
  name: string
  logo_url?: string | null
  branch?: {
    name: string
  } | null
}

interface AppConfig {
  business_name: string
  business_type?: string
  restaurants: Restaurant[]
}

export default function MiniAppHomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // App state
  const [activeTab, setActiveTab] = React.useState<"home" | "account">("home")
  const [selectedService, setSelectedService] = React.useState<string>("")
  const [view, setView] = React.useState<"home" | "branch-select" | "delivery-form">("home")
  
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
    // 1. Detect dynamic IP from address bar first
    let defaultIp = "192.168.1.8"
    if (typeof window !== "undefined" && window.location.hostname) {
      const hostname = window.location.hostname
      if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        defaultIp = hostname
      }
    }

    // 2. Load settings from local storage
    const savedIp = localStorage.getItem("hospitality_host_ip") || defaultIp
    const savedTenant = localStorage.getItem("hospitality_tenant_id") || ""
    
    setHostIp(savedIp)
    setInputIp(savedIp)
    
    setTenantId(savedTenant)
    setInputTenantId(savedTenant)

    // 3. Detect query parameters (which override storage)
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

    // Load dynamic config
    loadConfig(activeIp, activeTenant)
  }, [searchParams])

  const loadConfig = async (ip: string, tenant: string) => {
    try {
      // Connect to custom backend port 4000 directly if using external/LAN IP, 
      // otherwise use relative Next.js API proxy path.
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

      // Sync and store actual resolved tenant ID from backend
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
      setView("branch-select")
    } else if (serviceId === "delivery") {
      // Load saved delivery details if available
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
    setView("branch-select")
  }

  const handleBranchSelect = (restaurantId: string) => {
    const orderType = selectedService.toUpperCase()
    
    // Redirect to Next.js menu page with parameters
    let target = `/menu/${restaurantId}?orderType=${orderType}`
    
    if (orderType === "DELIVERY") {
      target += `&deliveryAddress=${encodeURIComponent(delivAddress)}`
    }

    router.push(target)
  }

  // Layout properties
  const activeBranch = appConfig.restaurants[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 font-sans pb-24 flex justify-center">
      {/* App Shell Container */}
      <div className="w-full max-w-md px-4 pt-4 flex flex-col gap-5 relative">
        
        {/* Custom Toast Alert */}
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

        {/* LOGO HEADER */}
        {view === "home" && (
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍔</span>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">
                {appConfig.business_name || "eChat Hub"}
              </span>
            </div>
          </div>
        )}

        {/* --- CORE TAB SWITCHER VIEW --- */}
        {activeTab === "home" ? (
          <>
            {view === "home" && (
              <div className="flex flex-col gap-5">
                
                {/* 1. Dine-In / Delivery Hero Options */}
                <div className="grid grid-cols-2 gap-3.5">
                  
                  {/* Delivery Card */}
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

                  {/* Dine-In Card */}
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

                {/* 2. Active Branch Display Bar */}
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

                {/* 3. Supplemental Services List */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Other Services</h3>
                  <div className="grid grid-cols-4 gap-2">
                    
                    {/* Takeaway */}
                    <div 
                      onClick={() => handleServiceSelect("takeaway")}
                      className="bg-white border border-gray-100 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 cursor-pointer hover:shadow-sm text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-lg">
                        🛍️
                      </div>
                      <span className="text-[10px] font-black text-gray-700">Takeaway</span>
                    </div>

                    {/* In-Room Dining */}
                    <div 
                      onClick={() => showToast("In-Room Dining is coming soon!", "🏨")}
                      className="bg-white border border-gray-100 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 opacity-55 cursor-pointer text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-lg">
                        🛌
                      </div>
                      <span className="text-[10px] font-black text-gray-700">In-Room</span>
                    </div>

                    {/* Reserve Table */}
                    <div 
                      onClick={() => showToast("Reservations are coming soon!", "📅")}
                      className="bg-white border border-gray-100 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 opacity-55 cursor-pointer text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-lg">
                        📅
                      </div>
                      <span className="text-[10px] font-black text-gray-700">Reserve</span>
                    </div>

                    {/* Book Room */}
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

                {/* 4. Promotional Banner Slider */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Special Offers</h3>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
                    
                    <div className="min-w-[85%] snap-start bg-gradient-to-br from-pink-500/10 to-amber-500/10 border border-pink-500/5 rounded-3xl p-4 flex flex-col gap-1.5">
                      <span className="text-[9px] font-extrabold bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-md w-fit uppercase">Promotion</span>
                      <h4 className="font-bold text-xs text-gray-800">🍔 50% Off First Dining Order</h4>
                      <p className="text-[10px] text-gray-500">Use code WELCOME50 when placing takeaway or delivery. Valid today only.</p>
                    </div>

                    <div className="min-w-[85%] snap-start bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/5 rounded-3xl p-4 flex flex-col gap-1.5">
                      <span className="text-[9px] font-extrabold bg-indigo-500/10 text-indigo-700 px-2 py-0.5 rounded-md w-fit uppercase">Hotel Special</span>
                      <h4 className="font-bold text-xs text-gray-800">✨ Free Room Service Delivery</h4>
                      <p className="text-[10px] text-gray-500">Order anything to your room. Zero service charge for premium members.</p>
                    </div>

                    <div className="min-w-[85%] snap-start bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/5 rounded-3xl p-4 flex flex-col gap-1.5">
                      <span className="text-[9px] font-extrabold bg-green-500/10 text-green-700 px-2 py-0.5 rounded-md w-fit uppercase">Happy Hour</span>
                      <h4 className="font-bold text-xs text-gray-800">🍸 2-for-1 Cocktails</h4>
                      <p className="text-[10px] text-gray-500">Available at our rooftop bar between 5:00 PM and 7:00 PM local time.</p>
                    </div>

                  </div>
                </div>

                {/* 5. Featured Outlets List */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Featured Outlets</h3>
                  <div className="flex flex-col gap-2">
                    {appConfig.restaurants.length === 0 ? (
                      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-xs text-gray-500 shadow-sm">
                        No active dining outlets discovered.
                      </div>
                    ) : (
                      appConfig.restaurants.map(rest => (
                        <div 
                          key={rest.id}
                          onClick={() => handleBranchSelect(rest.id)}
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
                              <p className="text-[9px] text-gray-400 mt-0.5">
                                {rest.branch?.name || "Main Campus Outlet"}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 6. Popular Items Showcase */}
                <div className="flex flex-col gap-2 pb-6">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Popular Items</h3>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                    
                    <div className="flex-shrink-0 w-32 bg-white border border-gray-100 rounded-2xl p-3 flex flex-col gap-1.5 shadow-sm">
                      <div className="w-full h-16 rounded-xl bg-gray-50 flex items-center justify-center text-2xl">🍕</div>
                      <span className="font-bold text-[10px] text-gray-800 block truncate">Pepperoni Pizza</span>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-amber-600">$14.50</span>
                        <button 
                          onClick={() => showToast("Select Dine-In or Delivery first!")}
                          className="w-5 h-5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-32 bg-white border border-gray-100 rounded-2xl p-3 flex flex-col gap-1.5 shadow-sm">
                      <div className="w-full h-16 rounded-xl bg-gray-50 flex items-center justify-center text-2xl">🍔</div>
                      <span className="font-bold text-[10px] text-gray-800 block truncate">Double Smash Burger</span>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-amber-600">$12.00</span>
                        <button 
                          onClick={() => showToast("Select Dine-In or Delivery first!")}
                          className="w-5 h-5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-32 bg-white border border-gray-100 rounded-2xl p-3 flex flex-col gap-1.5 shadow-sm">
                      <div className="w-full h-16 rounded-xl bg-gray-50 flex items-center justify-center text-2xl">🍰</div>
                      <span className="font-bold text-[10px] text-gray-800 block truncate">Cheesecake</span>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-amber-600">$7.50</span>
                        <button 
                          onClick={() => showToast("Select Dine-In or Delivery first!")}
                          className="w-5 h-5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* View: Delivery Address Form */}
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

            {/* View: Branch Selector Grid */}
            {view === "branch-select" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setView("home")} className="p-2 rounded-full bg-white border border-gray-100 text-gray-600 active:scale-90 transition-all">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="font-extrabold text-lg text-gray-900">
                    {selectedService === "dine-in" ? "Select Dine-In Branch" : "Select Takeaway Outlet"}
                  </h2>
                </div>
                <div className="flex flex-col gap-2">
                  {appConfig.restaurants.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-xs text-gray-500 shadow-sm">
                      No outlets available for this service.
                    </div>
                  ) : (
                    appConfig.restaurants.map(rest => (
                      <div 
                        key={rest.id}
                        onClick={() => handleBranchSelect(rest.id)}
                        className="bg-white border border-gray-50 rounded-2xl p-4 flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
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
                            <p className="text-[9px] text-gray-400 mt-0.5">
                              {rest.branch?.name || "Main Campus"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* --- ACCOUNT & CONNECTIONS VIEW --- */
          <div className="flex flex-col gap-5">
            
            {/* Account Greeting Header */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white border border-white/20">
                G
              </div>
              <div>
                <h4 className="font-black text-sm text-gray-800">Guest Customer</h4>
                <p className="text-[9px] text-amber-600 font-extrabold uppercase mt-0.5 tracking-wider">Premium Loyalty Member</p>
              </div>
            </div>

            {/* Connection Settings Override Card */}
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

            {/* Mock Past Orders Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col gap-3 shadow-sm">
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Recent Orders</h3>
              <div className="flex flex-col gap-3 text-xs text-gray-600 pt-1">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">🍕 Pizza & Drink</span>
                    <span className="text-[9px] text-gray-400">Amen Restaurant</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">Delivered</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">🍔 Double Burger</span>
                    <span className="text-[9px] text-gray-400">Horizon Bistro</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded-full font-bold">Cancelled</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --- PERSISTENT BOTTOM TAB NAVIGATION BAR --- */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-3.5 pb-6 flex justify-around items-center shadow-lg pointer-events-auto rounded-t-3xl">
            
            {/* Home Tab */}
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

            {/* My Account Tab */}
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
