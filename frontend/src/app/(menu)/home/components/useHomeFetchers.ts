"use client"
import * as React from "react"
import { AppConfig, Promotion } from "./types"

export function useHomeFetchers(hostIp: string, showToast: (msg: string, icon?: string) => void) {
  const [appConfig, setAppConfig] = React.useState<AppConfig>({
    business_name: "Hospitality Hub",
    restaurants: [],
  })
  const [orderHistory, setOrderHistory] = React.useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = React.useState(false)
  const [promotions, setPromotions] = React.useState<Promotion[]>([])

  const fetchOrderHistory = async (userId: string | null) => {
    setLoadingHistory(true)
    try {
      let ssoOrders: any[] = []
      if (userId) {
        try {
          const res = await fetch(`/api/orders/public/history?userId=${encodeURIComponent(userId)}`)
          if (res.ok) ssoOrders = await res.json()
        } catch (e) {
          console.warn("SSO history fetch failed", e)
        }
      }
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
      const ssoIds = new Set(ssoOrders.map((o: any) => o.id))
      const remainingIds = localOrderIds.filter((id) => !ssoIds.has(id))
      let localOrders: any[] = []
      if (remainingIds.length > 0) {
        try {
          const res = await fetch(`/api/orders/public/history?orderIds=${remainingIds.join(",")}`)
          if (res.ok) localOrders = await res.json()
        } catch (e) {
          console.warn("Local order ID history fetch failed", e)
        }
      }
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
      } catch {
        const backendBase = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://hospitalityhub-backend.onrender.com").replace(/\/$/, "")
        const fallbackUrl = `${backendBase}/api/promotions/public?tenantId=${encodeURIComponent(tId)}&_t=${Date.now()}`
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

  const loadConfig = async (ip: string, tenant: string, onResolvedTenant?: (t: string) => void) => {
    try {
      let url = `/api/restaurant/public/config`
      if (tenant) url += `?tenantId=${tenant}`
      let res
      try {
        res = await fetch(url)
        if (!res.ok) throw new Error("Relative fetch failed")
      } catch {
        const backendBase = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://hospitalityhub-backend.onrender.com").replace(/\/$/, "")
        let fallbackUrl = `${backendBase}/api/restaurant/public/config`
        if (tenant) fallbackUrl += `?tenantId=${tenant}`
        res = await fetch(fallbackUrl)
      }
      if (!res.ok) throw new Error("Could not fetch server configuration")
      const data = await res.json()
      setAppConfig(data)
      const resolvedTenantId = data.tenantId || tenant
      if (data.tenantId && data.tenantId !== tenant && onResolvedTenant) {
        onResolvedTenant(data.tenantId)
      }
      if (resolvedTenantId) fetchPromotions(resolvedTenantId)
    } catch (e) {
      console.error(e)
      showToast("Could not load latest server configuration", "🔌")
    }
  }

  return {
    appConfig,
    setAppConfig,
    orderHistory,
    loadingHistory,
    promotions,
    fetchOrderHistory,
    fetchPromotions,
    loadConfig,
  }
}
