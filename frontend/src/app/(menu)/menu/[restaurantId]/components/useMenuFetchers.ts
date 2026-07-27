"use client"
import * as React from "react"
import { setPreferredRestaurantId, getUserProfile, MiniAppUser } from "@/lib/miniapp-bridge"
import { Restaurant, Category, MenuItem, OrderHistoryItem, TableDetails, Customization, CustomizationValue } from "./types"

export function useMenuFetchers(
  restaurantId: string,
  tableId: string,
  searchParams: any,
  setSelectedItem: (item: MenuItem | null) => void,
  setItemCustomizations: (custs: Record<string, string | string[]>) => void,
  setItemNotes: (n: string) => void,
  setItemQty: (q: number) => void,
  setActiveParentId: (id: string) => void,
  setActiveSubCategory: (sub: string) => void,
) {
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([])
  const [tableDetails, setTableDetails] = React.useState<TableDetails | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [switching, setSwitching] = React.useState(false)
  const [activeRestaurantId, setActiveRestaurantId] = React.useState<string>(restaurantId)
  const [activeBranchId, setActiveBranchId] = React.useState<string>("")
  const [restaurantsList, setRestaurantsList] = React.useState<Restaurant[]>([])
  const [miniAppUser, setMiniAppUser] = React.useState<MiniAppUser | null>(null)
  const [historyOrders, setHistoryOrders] = React.useState<OrderHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = React.useState(false)

  const loadRestaurantData = React.useCallback(async (targetId: string, showLoader = true, forTableId = "", branchId = "") => {
    if (showLoader) setLoading(true)
    else setSwitching(true)
    try {
      let branchQuery = ""
      if (forTableId) branchQuery = `?tableId=${forTableId}`
      else if (branchId) branchQuery = `?branchId=${branchId}`

      const [restRes, catRes, menuRes] = await Promise.all([
        fetch(`/api/restaurant/public/details/${targetId}${branchQuery}`),
        fetch(`/api/restaurant/public/categories/${targetId}${branchQuery}`),
        fetch(`/api/restaurant/public/menu/${targetId}${branchQuery}`)
      ])

      const restData = restRes.ok ? await restRes.json() : null
      setRestaurant(restData)
      if (restData?.branchId) setActiveBranchId(restData.branchId)

      const cats: Category[] = catRes.ok ? await catRes.json() : []
      setCategories(cats)
      const items = menuRes.ok ? await menuRes.json() : []
      setMenuItems(items)

      const targetCategoryId = searchParams.get("categoryId")
      const targetMenuItemId = searchParams.get("menuItemId")

      if (targetMenuItemId) {
        const targetItem = items.find((item: MenuItem) => item.id === targetMenuItemId)
        if (targetItem) {
          setSelectedItem(targetItem)
          const defaults: Record<string, string | string[]> = {}
          if (targetItem.customizations && targetItem.customizations.length > 0) {
            (targetItem.customizations as Customization[]).forEach((cust: Customization) => {
              const recommendedVals = cust.values
                .filter((v: CustomizationValue) => typeof v !== "string" && v.recommended)
                .map((v: CustomizationValue) => typeof v === "string" ? v : v.name)
              if (recommendedVals.length > 0) {
                defaults[cust.key] = cust.multiple ? recommendedVals : recommendedVals[0]
              }
            })
          }
          setItemCustomizations(defaults); setItemNotes(""); setItemQty(1)

          if (targetItem.category_id) {
            const cat = cats.find(c => c.id === targetItem.category_id)
            if (cat) {
              if (cat.parent_id) { setActiveParentId(cat.parent_id); setActiveSubCategory(cat.id) }
              else { setActiveParentId(cat.id); setActiveSubCategory("all") }
            }
          }
        }
      } else if (targetCategoryId) {
        const cat = cats.find(c => c.id === targetCategoryId)
        if (cat) {
          if (cat.parent_id) { setActiveParentId(cat.parent_id); setActiveSubCategory(cat.id) }
          else { setActiveParentId(cat.id); setActiveSubCategory("all") }
        }
      } else {
        const parents = cats.filter(c => !c.parent_id)
        setActiveParentId(parents.length > 0 ? parents[0].id : "")
      }

      setActiveRestaurantId(targetId)
      if (branchId) setActiveBranchId(branchId)
      else if (restData?.branchId) setActiveBranchId(restData.branchId)
      else if (restData?.branches && restData.branches.length > 0) setActiveBranchId(restData.branches[0].id)

      setPreferredRestaurantId(targetId)
    } catch (e) {
      console.error(e)
    } finally {
      if (showLoader) setLoading(false)
      else setSwitching(false)
    }
  }, [searchParams, setSelectedItem, setItemCustomizations, setItemNotes, setItemQty, setActiveParentId, setActiveSubCategory])

  const loadOrderHistory = React.useCallback(async (user?: MiniAppUser | null) => {
    const resolvedUser = user !== undefined ? user : miniAppUser
    setLoadingHistory(true)
    try {
      if (resolvedUser?.id) {
        const res = await fetch(`/api/orders/public/history?userId=${encodeURIComponent(resolvedUser.id)}`)
        if (res.ok) { setHistoryOrders(await res.json()); return }
      }
      const localIds = JSON.parse(localStorage.getItem(`placed_orders_${activeRestaurantId}`) || "[]")
      if (localIds.length === 0) { setHistoryOrders([]); return }
      const fetchedOrders = await Promise.all(
        localIds.map(async (id: string) => {
          const res = await fetch(`/api/orders/public/${id}`)
          return res.ok ? await res.json() : null
        })
      )
      setHistoryOrders(fetchedOrders.filter((o): o is OrderHistoryItem => o !== null))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }, [activeRestaurantId, miniAppUser])

  return {
    restaurant, categories, setCategories, menuItems, setMenuItems, tableDetails, setTableDetails,
    loading, switching, activeRestaurantId, activeBranchId, setActiveBranchId, restaurantsList, setRestaurantsList,
    miniAppUser, setMiniAppUser, historyOrders, loadingHistory, loadRestaurantData, loadOrderHistory,
  }
}
