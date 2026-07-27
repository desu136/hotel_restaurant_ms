"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getUserProfile, getUserLocation, getPreferredRestaurantId, MiniAppUser, MiniAppLocation } from "@/lib/miniapp-bridge"
import { RESTAURANT_COORDINATES, calculateDistance } from "./types"
import { useHomeFetchers } from "./useHomeFetchers"

export function useHomeState() {
  const router = useRouter(), searchParams = useSearchParams()
  const [theme, setTheme] = React.useState<"dark" | "light">("dark")
  const [userProfile, setUserProfile] = React.useState<MiniAppUser | null>(null)
  const [userCoords, setUserCoords] = React.useState<MiniAppLocation | null>(null)
  const [preferredId, setPreferredId] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<"home" | "account">("home")
  const [selectedService, setSelectedService] = React.useState<string>("")
  const [view, setView] = React.useState<"home" | "branch-select" | "delivery-form">("home")
  const [pickerBrand, setPickerBrand] = React.useState<any>(null)
  const [showSettings, setShowSettings] = React.useState(false)
  const [showSearch, setShowSearch] = React.useState(false)
  const [outletSearchQuery, setOutletSearchQuery] = React.useState("")
  const [hostIp, setHostIp] = React.useState<string>("192.168.1.8")
  const [tenantId, setTenantId] = React.useState<string>("")
  const [delivName, setDelivName] = React.useState<string>("")
  const [delivPhone, setDelivPhone] = React.useState<string>("")
  const [delivAddress, setDelivAddress] = React.useState<string>("")
  const [inputIp, setInputIp] = React.useState<string>("")
  const [inputTenantId, setInputTenantId] = React.useState<string>("")
  const promoContainerRef = React.useRef<HTMLDivElement>(null)
  const [selectedPromo, setSelectedPromo] = React.useState<any | null>(null)
  const [activePromoIndex, setActivePromoIndex] = React.useState<number>(0)

  const [toast, setToast] = React.useState<{ show: boolean; message: string; icon: string }>({ show: false, message: "", icon: "✨" })
  const showToast = (message: string, icon: string = "✨") => {
    setToast({ show: true, message, icon })
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000)
  }

  const { appConfig, orderHistory, loadingHistory, promotions, fetchOrderHistory, fetchPromotions, loadConfig } = useHomeFetchers(hostIp, showToast)

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("menu-theme") as "dark" | "light" | null
    if (savedTheme) setTheme(savedTheme)
    let defaultIp = "192.168.1.8"
    if (typeof window !== "undefined" && window.location.hostname && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      defaultIp = window.location.hostname
    }
    const savedIp = localStorage.getItem("hospitality_host_ip") || defaultIp
    const savedTenant = localStorage.getItem("hospitality_tenant_id") || ""
    setHostIp(savedIp); setInputIp(savedIp); setTenantId(savedTenant); setInputTenantId(savedTenant)
    let activeTenant = savedTenant, activeIp = savedIp
    const queryTenantId = searchParams.get("tenantId"), queryHostIp = searchParams.get("hostIp")
    if (queryTenantId) {
      activeTenant = queryTenantId; setTenantId(queryTenantId); setInputTenantId(queryTenantId)
      localStorage.setItem("hospitality_tenant_id", queryTenantId)
    }
    if (queryHostIp) {
      activeIp = queryHostIp; setHostIp(queryHostIp); setInputIp(queryHostIp)
      localStorage.setItem("hospitality_host_ip", queryHostIp)
    }
    loadConfig(activeIp, activeTenant, (newTenant) => {
      setTenantId(newTenant); setInputTenantId(newTenant)
      localStorage.setItem("hospitality_tenant_id", newTenant)
    })
    const initSDKBridge = async () => {
      try {
        const profile = await getUserProfile()
        if (profile) { setUserProfile(profile); setDelivName(profile.name) }
        const location = await getUserLocation()
        if (location) setUserCoords(location)
        const prefId = await getPreferredRestaurantId()
        if (prefId) setPreferredId(prefId)
        fetchOrderHistory(profile?.id || null)
      } catch (err) {
        console.warn("Failed to load SDK bridge initial states:", err); fetchOrderHistory(null)
      }
    }
    initSDKBridge()
  }, [searchParams])

  React.useEffect(() => { if (activeTab === "account") fetchOrderHistory(userProfile?.id || null) }, [activeTab])

  const sortedRestaurants = React.useMemo(() => {
    if (!appConfig.restaurants) return []
    let topLevel = appConfig.restaurants.filter((r) => !r.parent_id)
    if (outletSearchQuery.trim() !== "") {
      const q = outletSearchQuery.toLowerCase().trim()
      topLevel = topLevel.filter((rest) => {
        const nameMatch = rest.name.toLowerCase().includes(q)
        const branchMatch = (rest.branches || []).some((b) => b.name.toLowerCase().includes(q) || (b.address || "").toLowerCase().includes(q))
        return nameMatch || branchMatch
      })
    }
    return topLevel
      .map((rest) => {
        let branches = rest.branches || []
        if (outletSearchQuery.trim() !== "") {
          const q = outletSearchQuery.toLowerCase().trim()
          branches = branches.filter((b) => rest.name.toLowerCase().includes(q) || b.name.toLowerCase().includes(q) || (b.address || "").toLowerCase().includes(q))
        }
        let distance: number | undefined = undefined
        if (branches.length > 0) {
          const branchDistances = branches
            .map((b) => {
              const coords = RESTAURANT_COORDINATES[b.name] || RESTAURANT_COORDINATES[rest.name] || { latitude: 9.032, longitude: 38.742 }
              return userCoords ? calculateDistance(userCoords.latitude, userCoords.longitude, coords.latitude, coords.longitude) : undefined
            })
            .filter((d): d is number => d !== undefined)
          if (branchDistances.length > 0) distance = Math.min(...branchDistances)
        } else {
          const coords = RESTAURANT_COORDINATES[rest.name] || { latitude: 9.032, longitude: 38.742 }
          if (userCoords) distance = calculateDistance(userCoords.latitude, userCoords.longitude, coords.latitude, coords.longitude)
        }
        return { ...rest, distance, childrenCount: branches.length, children: branches }
      })
      .sort((a, b) => {
        if (preferredId) {
          const aMatches = a.id === preferredId || a.children.some((c: any) => c.id === preferredId)
          const bMatches = b.id === preferredId || b.children.some((c: any) => c.id === preferredId)
          if (aMatches && !bMatches) return -1
          if (!aMatches && bMatches) return 1
        }
        if (userCoords && a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance
        return 0
      })
  }, [appConfig.restaurants, userCoords, preferredId, outletSearchQuery])

  const activeRestaurant = sortedRestaurants[0]

  React.useEffect(() => {
    const targetTenantId = tenantId || activeRestaurant?.tenant_id
    if (targetTenantId) fetchPromotions(targetTenantId)
  }, [activeRestaurant, tenantId])

  const handlePromoScroll = () => {
    if (promoContainerRef.current) {
      const container = promoContainerRef.current
      const firstChild = container.children[0] as HTMLElement
      const cardStep = firstChild ? firstChild.offsetWidth + 12 : container.clientWidth * 0.85
      const idx = Math.round(container.scrollLeft / cardStep)
      setActivePromoIndex(Math.min(Math.max(0, idx), promotions.length - 1))
    }
  }

  const applyConnectionSettings = () => {
    const cleanIp = inputIp.trim(), cleanTenant = inputTenantId.trim()
    if (cleanIp) { setHostIp(cleanIp); localStorage.setItem("hospitality_host_ip", cleanIp) }
    setTenantId(cleanTenant); localStorage.setItem("hospitality_tenant_id", cleanTenant)
    showToast("Connection settings applied!", "⚙️")
    loadConfig(cleanIp, cleanTenant)
    setActiveTab("home")
  }

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)
    if (serviceId === "dine-in" || serviceId === "takeaway") {
      const defaultId = sortedRestaurants[0]?.id
      if (defaultId) {
        localStorage.setItem("show_restaurants_popup", "true")
        router.push(`/menu/${defaultId}?orderType=${serviceId.toUpperCase()}`)
      } else showToast("No restaurants available", "⚠️")
    } else if (serviceId === "delivery") {
      setDelivAddress(localStorage.getItem("customer_delivery_address") || "")
      setView("delivery-form")
    }
  }

  const submitDeliveryAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (!delivName.trim() || !delivPhone.trim() || !delivAddress.trim()) { showToast("Please fill in all address details", "⚠️"); return }
    localStorage.setItem("customer_delivery_address", delivAddress.trim())
    const defaultId = sortedRestaurants[0]?.id
    if (defaultId) {
      localStorage.setItem("show_restaurants_popup", "true")
      router.push(`/menu/${defaultId}?orderType=DELIVERY&deliveryAddress=${encodeURIComponent(delivAddress)}`)
    } else showToast("No restaurants available", "⚠️")
  }

  const handleBranchSelect = (restaurantId: string, branchId?: string) => {
    const orderType = selectedService.toUpperCase() || "DINE_IN"
    let target = `/menu/${restaurantId}?orderType=${orderType}`
    if (branchId) target += `&branchId=${branchId}`
    if (orderType === "DELIVERY") target += `&deliveryAddress=${encodeURIComponent(delivAddress)}`
    localStorage.setItem("show_restaurants_popup", "true")
    router.push(target)
  }

  return {
    router, theme, setTheme, userProfile, activeTab, setActiveTab, selectedService, view, setView,
    pickerBrand, setPickerBrand, showSettings, setShowSettings, showSearch, setShowSearch,
    outletSearchQuery, setOutletSearchQuery, delivName, setDelivName, delivPhone, setDelivPhone,
    delivAddress, setDelivAddress, inputIp, setInputIp, inputTenantId, setInputTenantId, orderHistory,
    loadingHistory, promotions, promoContainerRef, selectedPromo, setSelectedPromo, activePromoIndex,
    setActivePromoIndex, toast, sortedRestaurants, activeRestaurant, appConfig, userCoords, handlePromoScroll,
    applyConnectionSettings, handleServiceSelect, submitDeliveryAddress, handleBranchSelect, showToast,
  }
}
