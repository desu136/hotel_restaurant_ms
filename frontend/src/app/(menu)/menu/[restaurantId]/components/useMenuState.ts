"use client"
import * as React from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { MenuItem, getDefaultCustomizations, areCustsEqual } from "./types"
import { useMenuFetchers } from "./useMenuFetchers"
import { useCartState } from "./useCartState"

export function useMenuState() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const restaurantId = params.restaurantId as string
  const tableId = searchParams.get("tableId") || ""

  const [theme, setTheme] = React.useState<"dark" | "light">("dark")
  const [activeTab, setActiveTab] = React.useState<"home" | "cart" | "history">("home")
  const [activeParentId, setActiveParentId] = React.useState<string>("")
  const [activeSubCategory, setActiveSubCategory] = React.useState<string>("all")
  const [selectedItem, setSelectedItem] = React.useState<MenuItem | null>(null)
  const [itemCustomizations, setItemCustomizations] = React.useState<Record<string, string | string[]>>({})
  const [itemNotes, setItemNotes] = React.useState("")
  const [itemQty, setItemQty] = React.useState(1)
  const [popupVisible, setPopupVisible] = React.useState(false)

  const menuListRef = React.useRef<HTMLDivElement>(null)

  const fetchers = useMenuFetchers(
    restaurantId, tableId, searchParams,
    setSelectedItem, setItemCustomizations, setItemNotes, setItemQty,
    setActiveParentId, setActiveSubCategory
  )

  const cartState = useCartState(fetchers.restaurant?.tenant_id, fetchers.miniAppUser)

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("menu-theme") as "dark" | "light" | null
    if (savedTheme) setTheme(savedTheme)

    const init = async () => {
      await fetchers.loadRestaurantData(restaurantId, true, tableId)
      if (tableId) {
        const tableRes = await fetch(`/api/restaurant/public/table/${tableId}`)
        if (tableRes.ok) {
          const tDetails = await tableRes.json()
          fetchers.setTableDetails(tDetails)
          if (tDetails.branch_id) fetchers.setActiveBranchId(tDetails.branch_id)
        }
      }
    }
    init()

    const savedTenant = localStorage.getItem("hospitality_tenant_id") || ""
    fetch(`/api/restaurant/public/config?tenantId=${savedTenant}`)
      .then(res => res.json())
      .then((data: any) => { if (data?.restaurants) fetchers.setRestaurantsList(data.restaurants) })
      .catch(err => console.error("Error loading popup config", err))

    if (localStorage.getItem("show_restaurants_popup") === "true") {
      setPopupVisible(true)
      localStorage.removeItem("show_restaurants_popup")
    }
  }, [restaurantId, tableId])

  React.useEffect(() => {
    if (tableId) cartState.setOrderType("DINE_IN")
  }, [tableId])

  React.useEffect(() => {
    const branchQuery = tableId ? `?tableId=${tableId}` : ""
    const interval = setInterval(async () => {
      try {
        const [catRes, menuRes] = await Promise.all([
          fetch(`/api/restaurant/public/categories/${fetchers.activeRestaurantId}${branchQuery}`),
          fetch(`/api/restaurant/public/menu/${fetchers.activeRestaurantId}${branchQuery}`)
        ])
        if (catRes.ok) {
          const cats = await catRes.json()
          fetchers.setCategories(cats)
          const parents = cats.filter((c: any) => !c.parent_id)
          if (parents.length > 0 && (!activeParentId || !parents.some((p: any) => p.id === activeParentId))) {
            setActiveParentId(parents[0].id)
          }
        }
        if (menuRes.ok) fetchers.setMenuItems(await menuRes.json())
      } catch (e) {
        console.error("Background sync error:", e)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchers.activeRestaurantId, activeParentId, fetchers.activeBranchId, tableId])

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next); localStorage.setItem("menu-theme", next)
  }

  React.useEffect(() => {
    if (activeTab === "history") fetchers.loadOrderHistory()
  }, [activeTab])

  const parentCategories = fetchers.categories.filter(c => !c.parent_id)
  const filteredSubCategories = fetchers.categories.filter(c => c.parent_id === activeParentId)

  React.useEffect(() => { setActiveSubCategory("all") }, [activeParentId])

  const filteredMenuItems = fetchers.menuItems.filter(item =>
    item.category_id === activeParentId || filteredSubCategories.some(sc => sc.id === item.category_id)
  )

  const scrollToSubCategory = (subCatId: string) => {
    setActiveSubCategory(subCatId)
    if (subCatId === "all") menuListRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    else {
      const element = document.getElementById(`subcat-${subCatId}`)
      const container = menuListRef.current
      if (element && container) {
        const cRect = container.getBoundingClientRect()
        const eRect = element.getBoundingClientRect()
        container.scrollTo({ top: eRect.top - cRect.top + container.scrollTop - 10, behavior: "smooth" })
      }
    }
  }

  const selectedCustomizationBadges = React.useMemo(() => {
    if (!selectedItem || !selectedItem.customizations) return []
    const list: Array<{ name: string; image_url?: string | null; extraPrice: number }> = []
    for (const cust of selectedItem.customizations) {
      const selectedVal = itemCustomizations[cust.key]
      if (!selectedVal) continue
      const valArr = Array.isArray(selectedVal) ? selectedVal : [selectedVal]
      for (const v of valArr) {
        const choice = cust.values.find(c => (typeof c === "string" ? c : c.name) === v)
        if (choice) {
          list.push({
            name: typeof choice === "string" ? choice : choice.name,
            image_url: typeof choice === "string" ? null : choice.image_url,
            extraPrice: typeof choice === "string" ? 0 : choice.extraPrice
          })
        }
      }
    }
    return list
  }, [selectedItem, itemCustomizations])

  const openItemDetail = (item: MenuItem) => {
    setSelectedItem(item)
    const defaults = getDefaultCustomizations(item)
    setItemCustomizations(defaults)
    setItemNotes("")
    const existingInCart = cartState.cart.find(
      c => c.menuItem.id === item.id && areCustsEqual(c.selectedCustomizations, defaults) && !c.notes
    )
    const totalInCart = cartState.cart.filter(c => c.menuItem.id === item.id).reduce((sum, c) => sum + c.quantity, 0)
    setItemQty(existingInCart ? existingInCart.quantity : (totalInCart > 0 ? totalInCart : 1))
  }

  const addToCartFromDetail = () => {
    if (!selectedItem) return
    cartState.setCart(prev => {
      const idx = prev.findIndex(
        c => c.menuItem.id === selectedItem.id &&
        areCustsEqual(c.selectedCustomizations, itemCustomizations) &&
        (c.notes || "") === (itemNotes || "")
      )
      if (idx >= 0) return prev.map((c, i) => i === idx ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { menuItem: selectedItem, quantity: 1, selectedCustomizations: itemCustomizations, notes: itemNotes }]
    })
    // do NOT close the modal — UI transitions to +/- bar automatically via cartItemIdx
  }

  return {
    router, tableId, restaurant: fetchers.restaurant, categories: fetchers.categories, menuItems: fetchers.menuItems,
    tableDetails: fetchers.tableDetails, loading: fetchers.loading, switching: fetchers.switching, theme, toggleTheme,
    activeTab, setActiveTab, activeParentId, setActiveParentId, activeSubCategory, ...cartState, selectedItem,
    setSelectedItem, itemCustomizations, setItemCustomizations, itemNotes, setItemNotes, itemQty, setItemQty,
    miniAppUser: fetchers.miniAppUser, historyOrders: fetchers.historyOrders, loadingHistory: fetchers.loadingHistory,
    activeRestaurantId: fetchers.activeRestaurantId, activeBranchId: fetchers.activeBranchId, popupVisible, setPopupVisible,
    restaurantsList: fetchers.restaurantsList, menuListRef, loadRestaurantData: fetchers.loadRestaurantData,
    parentCategories, filteredSubCategories, filteredMenuItems, scrollToSubCategory, selectedCustomizationBadges,
    openItemDetail, addToCartFromDetail, loadOrderHistory: fetchers.loadOrderHistory,
  }
}
