"use client"
import * as React from "react"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, ShoppingCart, Home, Clock, Plus, Minus, AlertCircle, CheckCircle, Sun, Moon, Check } from "lucide-react"
import PaymentScreen from "./PaymentScreen"
import { motion, AnimatePresence } from "framer-motion"

interface Restaurant {
  id: string
  name: string
  logo_url?: string | null
  banner_url?: string | null
}

interface Category {
  id: string
  name: string
  parent_id?: string | null
}

interface CustomizationValue {
  name: string
  extraPrice: number
  image_url?: string | null
  recommended?: boolean
}

interface Customization {
  key: string
  label: string
  multiple: boolean
  values: CustomizationValue[]
}

interface MenuItem {
  id: string
  display_name: string
  description?: string | null
  price: string | number
  category_id?: string | null
  image_url?: string | null
  image_urls?: string[] | null
  customizations?: Customization[] | null
}

interface CartItem {
  menuItem: MenuItem
  quantity: number
  selectedCustomizations: Record<string, string | string[]>
  notes?: string
}

interface OrderHistoryItem {
  id: string
  status: string
  total_amount: number | string
  created_at: string
  table?: { table_number: string } | null
  items: Array<{
    id: string
    quantity: number
    unit_price: number
    menu_item: MenuItem
    customizations?: Record<string, string | string[]> | null
  }>
}

interface TableDetails {
  id: string
  table_number: string
  capacity: number
}

const SLOTS = [
  { top: "10%", right: "12%" },
  { bottom: "12%", right: "8%" },
  { top: "15%", left: "10%" },
  { bottom: "15%", left: "8%" }
]

// ─── Slideshow component: cycles photos with crossfade + Ken Burns on each ───
function SlideshowImage({
  images,
  alt,
  className,
  interval = 3000,
}: {
  images: string[]
  alt: string
  className?: string
  interval?: number
}) {
  const [idx, setIdx] = React.useState(0)
  const all = images.filter(Boolean)

  React.useEffect(() => {
    if (all.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % all.length), interval)
    return () => clearInterval(t)
  }, [all.length, interval])

  if (all.length === 0) return null

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <AnimatePresence mode="sync">
        <motion.img
          key={all[idx]}
          src={all[idx]}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{
            opacity: 1,
            scale: [1, 1.09, 1.03, 1.10, 1],
            x: [0, 5, -3, 3, 0],
            y: [0, -3, 5, -2, 0],
          }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{
            opacity: { duration: 0.8, ease: "easeInOut" },
            scale: { duration: interval / 1000 + 2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
            x: { duration: interval / 1000 + 2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
            y: { duration: interval / 1000 + 2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
          }}
        />
      </AnimatePresence>
      {/* Dots indicator — only when multiple images */}
      {all.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10 pointer-events-none">
          {all.map((_, i) => (
            <span
              key={i}
              className={`w-1 h-1 rounded-full transition-all duration-500 ${i === idx ? "bg-white w-3" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CustomerMenuPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const restaurantId = params.restaurantId as string
  const tableId = searchParams.get("tableId") || ""

  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([])
  const [tableDetails, setTableDetails] = React.useState<TableDetails | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Theme support
  const [theme, setTheme] = React.useState<"dark" | "light">("dark")

  // Navigation tabs
  const [activeTab, setActiveTab] = React.useState<"home" | "cart" | "history">("home")

  // Dynamic Category selection state
  const [activeParentId, setActiveParentId] = React.useState<string>("")
  const [activeSubCategory, setActiveSubCategory] = React.useState<string>("all")

  // Cart state
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [orderNotes, setOrderNotes] = React.useState("")
  const [showPayment, setShowPayment] = React.useState(false)
  const [orderType, setOrderType] = React.useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY">("DINE_IN")
  const [deliveryAddress, setDeliveryAddress] = React.useState("")

  // Item detail page (fully covered screen)
  const [selectedItem, setSelectedItem] = React.useState<MenuItem | null>(null)
  const [itemCustomizations, setItemCustomizations] = React.useState<Record<string, string | string[]>>({})
  const [itemNotes, setItemNotes] = React.useState("")
  const [itemQty, setItemQty] = React.useState(1)

  // Order history
  const [historyOrders, setHistoryOrders] = React.useState<OrderHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = React.useState(false)

  // Fetch initial data
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("menu-theme") as "dark" | "light" | null
    if (savedTheme) {
      setTheme(savedTheme)
    }

    const init = async () => {
      setLoading(true)
      try {
        const [restRes, catRes, menuRes] = await Promise.all([
          fetch(`/api/restaurant/public/details/${restaurantId}`),
          fetch(`/api/restaurant/public/categories/${restaurantId}`),
          fetch(`/api/restaurant/public/menu/${restaurantId}`)
        ])
        setRestaurant(restRes.ok ? await restRes.json() : null)
        const cats: Category[] = catRes.ok ? await catRes.json() : []
        setCategories(cats)
        setMenuItems(menuRes.ok ? await menuRes.json() : [])

        // Set initial parent category
        const parents = cats.filter(c => !c.parent_id)
        const parentsList = parents
        if (parentsList.length > 0) {
          setActiveParentId(parentsList[0].id)
        }

        // If tableId is present, fetch the real table number
        if (tableId) {
          const tableRes = await fetch(`/api/restaurant/public/table/${tableId}`)
          if (tableRes.ok) {
            setTableDetails(await tableRes.json())
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [restaurantId, tableId])

  React.useEffect(() => {
    if (tableId) {
      setOrderType("DINE_IN")
    }
  }, [tableId])

  // Background polling for changes (reflect modifications quickly)
  React.useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [catRes, menuRes] = await Promise.all([
          fetch(`/api/restaurant/public/categories/${restaurantId}`),
          fetch(`/api/restaurant/public/menu/${restaurantId}`)
        ])
        if (catRes.ok) {
          const cats: Category[] = await catRes.json()
          setCategories(cats)
          // Keep active parent selection valid
          const parents = cats.filter(c => !c.parent_id)
          if (parents.length > 0 && (!activeParentId || !parents.some(p => p.id === activeParentId))) {
            setActiveParentId(parents[0].id)
          }
        }
        if (menuRes.ok) {
          const items = await menuRes.json()
          setMenuItems(items)
        }
      } catch (e) {
        console.error("Background sync error:", e)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [restaurantId, activeParentId])

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    localStorage.setItem("menu-theme", nextTheme)
  }

  // Load history orders
  const loadOrderHistory = React.useCallback(async () => {
    const localIds = JSON.parse(localStorage.getItem(`placed_orders_${restaurantId}`) || "[]")
    if (localIds.length === 0) {
      setHistoryOrders([])
      return
    }
    setLoadingHistory(true)
    try {
      const fetchedOrders = await Promise.all(
        localIds.map(async (id: string) => {
          const res = await fetch(`/api/orders/public/${id}`)
          return res.ok ? await res.json() : null
        })
      )
      setHistoryOrders(fetchedOrders.filter(o => o !== null))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }, [restaurantId])

  React.useEffect(() => {
    if (activeTab === "history") {
      loadOrderHistory()
    }
  }, [activeTab, loadOrderHistory])

  // Get parent categories dynamically from Categories state
  const parentCategories = categories.filter(c => !c.parent_id)

  // Subcategories belonging to the active parent category
  const filteredSubCategories = categories.filter(c => c.parent_id === activeParentId)

  // Auto-set subcategory when parent changes
  React.useEffect(() => {
    if (filteredSubCategories.length > 0) {
      // Default to "all" to show all items under this parent
      setActiveSubCategory("all")
    } else {
      setActiveSubCategory("all")
    }
  }, [activeParentId])

  // Menu items filtered by category hierarchy
  const filteredMenuItems = menuItems.filter(item => {
    if (activeSubCategory === "all") {
      // Show items directly in the parent category OR any of its subcategories
      return item.category_id === activeParentId || filteredSubCategories.some(sc => sc.id === item.category_id)
    }
    return item.category_id === activeSubCategory
  })

  // Get dynamic item price including selected customization option extra charges
  const getCustomizedItemPrice = (item: MenuItem, selectedCusts: Record<string, string | string[]>) => {
    let price = parseFloat(item.price.toString())
    if (item.customizations) {
      for (const [key, selectedVal] of Object.entries(selectedCusts)) {
        const group = item.customizations.find(g => g.key === key)
        if (group && group.values) {
          if (Array.isArray(selectedVal)) {
            for (const v of selectedVal) {
              const choice = group.values.find(choiceVal => {
                const name = typeof choiceVal === "string" ? choiceVal : choiceVal.name
                return name === v
              })
              if (choice && typeof choice !== "string" && choice.extraPrice) {
                price += parseFloat(choice.extraPrice.toString())
              }
            }
          } else if (typeof selectedVal === "string" && selectedVal) {
            const choice = group.values.find(choiceVal => {
              const name = typeof choiceVal === "string" ? choiceVal : choiceVal.name
              return name === selectedVal
            })
            if (choice && typeof choice !== "string" && choice.extraPrice) {
              price += parseFloat(choice.extraPrice.toString())
            }
          }
        }
      }
    }
    return price
  }

  // Cart total calculations
  const cartTotal = cart.reduce((sum, c) => sum + getCustomizedItemPrice(c.menuItem, c.selectedCustomizations) * c.quantity, 0)
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)

  const selectedCustomizationBadges = React.useMemo(() => {
    if (!selectedItem || !selectedItem.customizations) return []
    const list: Array<{ name: string; image_url?: string | null; extraPrice: number }> = []

    for (const cust of selectedItem.customizations) {
      const selectedVal = itemCustomizations[cust.key]
      if (!selectedVal) continue

      if (Array.isArray(selectedVal)) {
        for (const v of selectedVal) {
          const choice = cust.values.find(choiceVal => {
            const name = typeof choiceVal === "string" ? choiceVal : choiceVal.name
            return name === v
          })
          if (choice) {
            list.push({
              name: typeof choice === "string" ? choice : choice.name,
              image_url: typeof choice === "string" ? null : choice.image_url,
              extraPrice: typeof choice === "string" ? 0 : choice.extraPrice
            })
          }
        }
      } else if (typeof selectedVal === "string" && selectedVal) {
        const choice = cust.values.find(choiceVal => {
          const name = typeof choiceVal === "string" ? choiceVal : choiceVal.name
          return name === selectedVal
        })
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

    // Auto-select recommended/default options
    const defaults: Record<string, string | string[]> = {}
    if (item.customizations && item.customizations.length > 0) {
      item.customizations.forEach(cust => {
        const recommendedVals = cust.values
          .filter(v => typeof v !== "string" && v.recommended)
          .map(v => typeof v === "string" ? v : v.name)

        if (recommendedVals.length > 0) {
          if (cust.multiple) {
            defaults[cust.key] = recommendedVals
          } else {
            defaults[cust.key] = recommendedVals[0]
          }
        }
      })
    }

    setItemCustomizations(defaults)
    setItemNotes("")
    setItemQty(1)
  }

  // Add to cart directly from catalog
  const addToCartDirectly = (item: MenuItem) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(
        c => c.menuItem.id === item.id && Object.keys(c.selectedCustomizations).length === 0 && !c.notes
      )
      if (existingIdx >= 0) {
        const updated = [...prev]
        updated[existingIdx].quantity += 1
        return updated
      }
      return [
        ...prev,
        {
          menuItem: item,
          quantity: 1,
          selectedCustomizations: {},
          notes: ""
        }
      ]
    })
  }

  // Add to cart from full screen details view
  const addToCartFromDetail = () => {
    if (!selectedItem) return
    setCart(prev => {
      const existingIdx = prev.findIndex(
        c =>
          c.menuItem.id === selectedItem.id &&
          JSON.stringify(c.selectedCustomizations) === JSON.stringify(itemCustomizations) &&
          c.notes === itemNotes
      )
      if (existingIdx >= 0) {
        const updated = [...prev]
        updated[existingIdx].quantity += itemQty
        return updated
      }
      return [
        ...prev,
        {
          menuItem: selectedItem,
          quantity: itemQty,
          selectedCustomizations: itemCustomizations,
          notes: itemNotes
        }
      ]
    })
    setSelectedItem(null)
  }

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev]
      updated[idx].quantity += delta
      if (updated[idx].quantity <= 0) {
        return prev.filter((_, i) => i !== idx)
      }
      return updated
    })
  }

  const cartPayload = cart.map(c => ({
    menu_item_id: c.menuItem.id,
    quantity: c.quantity,
    customizations: Object.keys(c.selectedCustomizations).length > 0 ? c.selectedCustomizations : null
  }))

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs opacity-75">Loading Menu...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center space-y-2">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-lg font-semibold">Restaurant not found.</p>
        </div>
      </div>
    )
  }

  const themeBg = theme === "dark" ? "bg-[#030712] text-white" : "bg-gray-50 text-gray-900"
  const themePanel = theme === "dark" ? "bg-[#0b0f19] border-white/5" : "bg-white border-gray-200 shadow-sm"
  const themeSidebar = theme === "dark" ? "bg-[#0b0f19] border-white/5" : "bg-gray-100 border-gray-200"
  const themeCard = theme === "dark" ? "bg-[#0b0f19] border-white/5" : "bg-white border-gray-200 shadow-sm"
  const themeFooter = theme === "dark" ? "bg-[#030712]/95 border-white/5" : "bg-white/95 border-gray-200 shadow-lg"
  const themeTextMuted = theme === "dark" ? "text-gray-400" : "text-gray-500"
  const themeTextTitle = theme === "dark" ? "text-white" : "text-gray-900"
  const themeBorder = theme === "dark" ? "border-white/5" : "border-gray-200"

  return (
    <div className={`h-screen ${themeBg} font-sans overflow-hidden flex flex-col pb-36 relative transition-colors duration-200`}>

      {showPayment && (
        <PaymentScreen
          total={cartTotal}
          restaurantId={restaurantId}
          tableId={tableId}
          cartPayload={cartPayload}
          orderNotes={orderNotes}
          orderType={orderType}
          deliveryAddress={deliveryAddress}
          onBack={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false)
            setCart([])
            setOrderNotes("")
            setDeliveryAddress("")
            setActiveTab("history")
            loadOrderHistory()
          }}
        />
      )}

      {activeTab === "home" && (
        <div className="flex-1 flex  flex-col overflow-hidden">
          {/* Banner */}
          <div className="relative h-44 sm:h-52 overflow-hidden flex items-end pb-4">
            {/* Background Banner Image */}
            {restaurant.banner_url ? (
              <motion.img
                src={restaurant.banner_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover z-0"
                animate={{
                  scale: [1, 1.08, 3.03, 1.09, 1],
                  x: [0, 50, -30, 3, 0],
                  y: [0, -30, 50, -2, 0],
                }}
                transition={{
                  duration: 20,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 z-0" />
            )}

            {/* Dark/Light bottom gradient overlay */}
            <div className={`absolute inset-0 z-0 pointer-events-none bg-gradient-to-t ${theme === "dark"
              ? "from-[#030712] via-[#030712]/50 to-black/35"
              : "from-gray-50 via-gray-50/50 to-black/10"
              }`} />

            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full border transition-all ${theme === "dark" ? "bg-black/40 border-white/10 text-yellow-400" : "bg-white/80 border-gray-300 text-amber-600"
                  }`}
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            <div className="w-full max-w-4xl mx-auto px-4 flex items-center gap-3 relative z-10">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="h-16 w-16 rounded-2xl border-2 border-white/20 object-cover shadow-xl shrink-0"
                />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shrink-0">
                  🍽️
                </div>
              )}
              <div>
                <h1 className={`text-xl sm:text-2xl font-black text-white drop-shadow-sm`}>{restaurant.name}</h1>
                {tableDetails ? (
                  <p className="text-amber-500 text-xs font-black mt-0.5 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
                    Table {tableDetails.table_number}
                  </p>
                ) : tableId ? (
                  <p className="text-amber-500 text-xs font-black mt-0.5 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
                    Table {tableId.slice(0, 4).toUpperCase()}
                  </p>
                ) : null}
              </div>
            </div>
            <svg
              className="absolute bottom-0 left-0 w-full z-10"
              viewBox="0 0 1440 40"
              preserveAspectRatio="none"
              style={{ height: 16 }}
            >
              <path d="M0,40 C480,0 960,0 1440,40 L1440,40 L0,40 Z" fill={theme === "dark" ? "#030712" : "#f9fafb"} />
            </svg>
          </div>

          {/* Dynamic Top Horizontal Parent category scroll bar */}
          <div className={`sticky top-0 z-20 ${themeBg} pt-2 pb-1.5 border-b ${themeBorder}`}>
            <div className="flex gap-2 overflow-x-auto px-4 scrollbar-none py-1">
              {parentCategories.map(pc => {
                const isActive = activeParentId === pc.id
                return (
                  <button
                    key={pc.id}
                    onClick={() => setActiveParentId(pc.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all relative flex items-center gap-1.5 ${isActive ? "bg-amber-50 text-black shadow-md shadow-amber-505/20" : `${theme === "dark" ? "bg-white/5 text-gray-300" : "bg-gray-200 text-gray-700"}`
                      }`}
                  >
                    {pc.name}
                  </button>
                )
              })}
              {parentCategories.length === 0 && (
                <p className="text-xs text-gray-400 py-1.5">No parent categories created yet.</p>
              )}
            </div>
          </div>

          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Dynamic Left Vertical Sub-Categories List */}
            <div className={`w-24 sm:w-28 ${themeSidebar} overflow-y-auto flex-shrink-0 py-2 border-r ${themeBorder}`}>
              <div className="space-y-1">
                {parentCategories.length > 0 && (
                  <button
                    onClick={() => setActiveSubCategory("all")}
                    className={`w-full text-left px-3 py-3.5 text-xs font-medium border-l-2 transition-all leading-snug flex items-center justify-between ${activeSubCategory === "all"
                      ? "bg-amber-500/5 text-amber-500 border-amber-500 font-black"
                      : `${themeTextMuted} border-transparent hover:bg-white/5`
                      }`}
                  >
                    <span>All Items</span>
                  </button>
                )}
                {filteredSubCategories.map(cat => {
                  const isActive = activeSubCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveSubCategory(cat.id)}
                      className={`w-full text-left px-3 py-3.5 text-xs font-medium border-l-2 transition-all leading-snug flex items-center justify-between ${isActive
                        ? "bg-amber-500/5 text-amber-500 border-amber-500 font-black"
                        : `${themeTextMuted} border-transparent hover:bg-white/5`
                        }`}
                    >
                      <span>{cat.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right Scrollable Product List */}
            <div className="flex-1 overflow-y-auto px-3 pt-3 pb-32">
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-3xl mb-2">🍽️</p>
                  <p className="text-xs font-semibold">No items available</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* <p className={`text-[10px] ${themeTextMuted} font-bold uppercase tracking-wider px-1`}>
                    {activeSubCategory === "all" ? "All Items" : categories.find(c => c.id === activeSubCategory)?.name}
                  </p> */}
                  <p
                    className={`sticky top-[-12px] z-10 ${themeBg} text-[10px] ${themeTextMuted} font-bold uppercase tracking-wider px-1 py-2`}
                  >
                    {activeSubCategory === "all"
                      ? "All Items"
                      : categories.find(c => c.id === activeSubCategory)?.name}
                  </p>
                  {filteredMenuItems.map(item => {
                    const itemPrice = parseFloat(item.price.toString())
                    const inCartCount = cart
                      .filter(c => c.menuItem.id === item.id)
                      .reduce((sum, cur) => sum + cur.quantity, 0)

                    return (
                      <div
                        key={item.id}
                        onClick={() => openItemDetail(item)}
                        className={`w-full ${themeCard} rounded-xl flex gap-3 p-2.5 border hover:border-amber-500/30 active:scale-[0.99] transition-all cursor-pointer relative group`}
                      >
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0 bg-gray-200 dark:bg-gray-900 border border-white/5 flex items-center justify-center relative overflow-hidden">
                          {(() => {
                            const allImgs = [item.image_url, ...(Array.isArray(item.image_urls) ? item.image_urls : [])].filter(Boolean) as string[]
                            return allImgs.length > 0 ? (
                              <SlideshowImage
                                images={allImgs}
                                alt={item.display_name}
                                className="w-full h-full"
                                interval={2500}
                              />
                            ) : (
                              <span className="text-2xl">🍽️</span>
                            )
                          })()}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h3 className={`font-bold text-sm ${themeTextTitle} leading-tight group-hover:text-amber-500 transition-colors line-clamp-1`}>
                              {item.display_name}
                            </h3>
                            {item.description && (
                              <p className={`text-[10px] ${themeTextMuted} mt-0.5 line-clamp-2 leading-normal`}>
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-amber-500 font-extrabold text-sm">${itemPrice.toFixed(2)}</span>

                            {/* Direct add controls with explicit stopPropagation */}
                            <div onClick={e => e.stopPropagation()}>
                              {inCartCount > 0 ? (
                                <div className="flex items-center gap-2 bg-amber-500 rounded-lg px-2 py-0.5 text-black shadow-sm">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      const cartIdx = cart.findIndex(c => c.menuItem.id === item.id && Object.keys(c.selectedCustomizations).length === 0)
                                      if (cartIdx >= 0) updateCartQty(cartIdx, -1)
                                    }}
                                    className="font-black text-sm w-4 h-4 flex items-center justify-center"
                                  >
                                    −
                                  </button>
                                  <span className="font-black text-xs min-w-[12px] text-center">{inCartCount}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      addToCartDirectly(item)
                                    }}
                                    className="font-black text-sm w-4 h-4 flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    addToCartDirectly(item)
                                  }}
                                  className="bg-amber-500 text-black border border-amber-500/20 hover:bg-amber-400 rounded-lg px-3.5 py-1 text-[10px] font-black transition-all shadow-sm flex items-center justify-center"
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── CART TAB VIEW ─── */}
      {activeTab === "cart" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setActiveTab("home")} className={`p-1.5 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
              <ArrowLeft className={`w-5 h-5 ${themeTextTitle}`} />
            </button>
            <h2 className="text-lg font-black">Your Order Cart</h2>
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 space-y-3">
              <ShoppingCart className="w-14 h-14 opacity-20" />
              <div>
                <p className={`font-bold ${themeTextTitle}`}>Your cart is empty</p>
                <p className={`text-xs ${themeTextMuted} mt-1`}>Explore our categories and add delicious food!</p>
              </div>
              <button
                onClick={() => setActiveTab("home")}
                className="bg-amber-500 text-black font-black px-6 py-2.5 rounded-xl text-xs active:scale-95 transition-all shadow-md"
              >
                Go to Menu
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className={`flex gap-3 ${themeCard} rounded-xl p-3 border`}>
                    <div className="w-14 h-14 rounded-lg bg-gray-200 dark:bg-gray-900 overflow-hidden shrink-0 border border-white/5 flex items-center justify-center">
                      {item.menuItem.image_url ? (
                        <img src={item.menuItem.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🍽️</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${themeTextTitle} leading-tight`}>{item.menuItem.display_name}</p>
                      {Object.entries(item.selectedCustomizations).map(([k, v]) => (
                        <p key={k} className="text-[10px] text-amber-500 mt-0.5 font-semibold">
                          • {k}: {Array.isArray(v) ? v.join(", ") : v}
                        </p>
                      ))}
                      {item.notes && (
                        <p className={`text-[10px] ${themeTextMuted} italic mt-1 bg-white/5 px-2 py-0.5 rounded border-l-2 border-amber-500/40`}>
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between shrink-0">
                      <span className="text-amber-500 font-extrabold text-sm">
                        ${(getCustomizedItemPrice(item.menuItem, item.selectedCustomizations) * item.quantity).toFixed(2)}
                      </span>
                      <div className={`flex items-center gap-2 ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"} rounded-lg px-2 py-0.5`}>
                        <button
                          onClick={() => updateCartQty(idx, -1)}
                          className="font-bold text-xs w-4 h-4 flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="font-bold text-xs min-w-[12px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(idx, 1)}
                          className="font-bold text-xs w-4 h-4 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`border-t ${themeBorder} pt-4 mt-4 space-y-4`}>
                {!tableId && (
                  <div className="space-y-2">
                    <label className={`block text-xs font-black uppercase tracking-wider ${themeTextMuted}`}>Order Option</label>
                    <div className={`grid grid-cols-3 gap-2 p-1 rounded-xl ${theme === "dark" ? "bg-white/5 border border-white/10" : "bg-gray-100 border border-gray-200"}`}>
                      {(["DINE_IN", "TAKEAWAY", "DELIVERY"] as const).map(type => {
                        const isActive = orderType === type;
                        const label = type === "DINE_IN" ? "Dine-In" : type === "TAKEAWAY" ? "Takeaway" : "Delivery";
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setOrderType(type)}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${isActive
                                ? "bg-amber-500 text-black shadow-md"
                                : `${theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"}`
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {orderType === "DELIVERY" && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className={`block text-xs font-black uppercase tracking-wider ${themeTextMuted}`}>Delivery Address</label>
                    <input
                      type="text"
                      placeholder="Enter your complete delivery address..."
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      className={`w-full ${theme === "dark" ? "bg-[#0b0f19]" : "bg-white"} border ${themeBorder} rounded-xl px-3.5 py-2.5 text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50`}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className={`block text-xs font-semibold ${themeTextMuted} mb-1.5`}>Add Chef Instruction Notes</label>
                  <textarea
                    rows={2}
                    placeholder="E.g., no onion, extra spicy, deliver order items together..."
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    className={`w-full ${theme === "dark" ? "bg-[#0b0f19]" : "bg-white"} border ${themeBorder} rounded-xl px-3 py-2 text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none`}
                  />
                </div>

                <div className={`p-3 space-y-2 text-xs rounded-xl ${themeCard} border`}>
                  <div className="flex justify-between opacity-75">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between font-bold text-sm pt-1 border-t ${themeBorder}`}>
                    <span>Total Amount</span>
                    <span className="text-amber-500 text-base font-extrabold">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── HISTORY TAB VIEW ─── */}
      {activeTab === "history" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setActiveTab("home")} className={`p-1.5 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
              <ArrowLeft className={`w-5 h-5 ${themeTextTitle}`} />
            </button>
            <h2 className="text-lg font-black">Your Order Status</h2>
          </div>

          {loadingHistory ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : historyOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 space-y-3">
              <Clock className="w-14 h-14 opacity-20" />
              <div>
                <p className={`font-bold ${themeTextTitle}`}>No recent orders found</p>
                <p className={`text-xs ${themeTextMuted} mt-1`}>Orders placed from this table will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 overflow-y-auto max-h-[70vh] pr-1">
              {historyOrders.map(order => {
                const orderDate = new Date(order.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })
                // Safe numeric conversion to fix Runtime TypeError toFixed on string Decimal types
                const totalAmountNum = parseFloat((order.total_amount || 0).toString())

                return (
                  <div key={order.id} className={`p-3 space-y-2.5 rounded-xl ${themeCard} border`}>
                    <div className={`flex items-center justify-between border-b ${themeBorder} pb-2`}>
                      <div>
                        <p className="font-black text-xs">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className={`text-[10px] ${themeTextMuted} mt-0.5`}>Placed at {orderDate}</p>
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${order.status === "PENDING"
                          ? "bg-amber-505/10 text-amber-505 border-amber-505/20"
                          : order.status === "PREPARING"
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            : order.status === "READY"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                          }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs opacity-90">
                          <span>
                            {item.quantity}x {item.menu_item.display_name}
                          </span>
                          <span>${(item.quantity * parseFloat(item.unit_price.toString())).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className={`flex justify-between items-center pt-2 border-t ${themeBorder} text-xs`}>
                      <span className={themeTextMuted}>Total amount</span>
                      <span className="text-amber-505 font-extrabold">${totalAmountNum.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── FULL COVERED MENU ITEM DETAIL PAGE ─── */}
      {selectedItem && (
        <div className={`fixed inset-0 z-50 ${theme === "dark" ? "bg-[#030712] text-white" : "bg-white text-gray-900"} flex flex-col w-full h-[100dvh] overflow-hidden`}>
          <div className="absolute top-4 left-4 z-30">
            <button
              onClick={() => setSelectedItem(null)}
              className="bg-black/60 backdrop-blur-md hover:bg-black/80 text-white p-2.5 rounded-full shadow-lg border border-white/10 active:scale-90 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="relative h-52 sm:h-80 bg-gray-950 w-full shrink-0 flex items-center justify-center border-b border-white/5 overflow-hidden">
            {selectedItem.image_url ? (
              <motion.div
                className="w-full h-full"
                animate={{
                  scale: selectedCustomizationBadges.length > 0 ? [1, 1.04, 1] : 1,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                key={selectedCustomizationBadges.length}
              >
                {(() => {
                  const allImgs = [selectedItem.image_url, ...(Array.isArray(selectedItem.image_urls) ? selectedItem.image_urls : [])].filter(Boolean) as string[]
                  return (
                    <SlideshowImage
                      images={allImgs}
                      alt={selectedItem.display_name}
                      className="w-full h-full"
                      interval={3000}
                    />
                  )
                })()}
              </motion.div>
            ) : (
              <div className="text-center space-y-2 text-gray-500">
                <span className="text-6xl block animate-pulse">🍽️</span>
                <span className="text-xs font-semibold">No Image Available</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

            {/* Customization side dish / drink floating overlay slots */}
            <AnimatePresence>
              {selectedCustomizationBadges.map((choice, index) => {
                const slot = SLOTS[index % SLOTS.length]
                return (
                  <motion.div
                    key={choice.name}
                    initial={{ scale: 0.1, opacity: 1, y: 600, x: index % 2 === 0 ? 120 : -120 }}
                    animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
                    exit={{ scale: 0, opacity: 2, y: 150 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10, delay: 0.05 * index }}
                    style={{ position: "absolute", ...slot }}
                    className="z-20 flex flex-col items-center pointer-events-none select-none"
                  >
                    {choice.image_url ? (
                      <>
                        <div className="bg-black/85 backdrop-blur-md border border-amber-500/30 text-white px-2 py-0.5 rounded-full text-[9px] font-black shadow-lg mb-1 whitespace-nowrap">
                          {choice.name} {choice.extraPrice > 0 ? `(+$${choice.extraPrice.toFixed(2)})` : ""}
                        </div>
                        <div className="w-14 h-24 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-none bg-gray-900 shadow-2xl p-0.5">
                          <img src={choice.image_url} alt="" className="w-full h-full object-cover rounded-full" />
                        </div>
                      </>
                    ) : (
                      <div className="bg-amber-500 text-black px-3 py-1.5 rounded-full text-[10px] font-black shadow-2xl border border-black/10 flex items-center gap-1.5">
                        <span>✨</span>
                        <span className="whitespace-nowrap">{choice.name}</span>
                        {choice.extraPrice > 0 && <span className="opacity-75">(+${choice.extraPrice.toFixed(2)})</span>}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 max-w-xl mx-auto w-full space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">{selectedItem.display_name}</h2>
                <p className="text-[10px] text-amber-500 font-bold mt-1 uppercase tracking-wider">
                  {categories.find(c => c.id === selectedItem.category_id)?.name || "Dish"}
                </p>
              </div>
              <span className="text-amber-500 font-extrabold text-xl shrink-0">
                ${parseFloat(selectedItem.price.toString()).toFixed(2)}
              </span>
            </div>

            {selectedItem.description && (
              <div className={`space-y-1 ${theme === "dark" ? "bg-white/5" : "bg-gray-100"} rounded-xl p-3.5`}>
                <h4 className="text-xs font-semibold uppercase tracking-widest opacity-60">Description</h4>
                <p className="text-xs leading-relaxed opacity-90">{selectedItem.description}</p>
              </div>
            )}

            {selectedItem.customizations && selectedItem.customizations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Customizations</h3>
                {selectedItem.customizations.map(cust => {
                  const hasImages = cust.values.some(val => typeof val !== "string" && val.image_url)

                  return (
                    <div key={cust.key} className={`space-y-3.5 ${themeCard} rounded-2xl p-4 border`}>
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        <span>{cust.label}</span>
                        {cust.multiple && (
                          <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">
                            Multi-select
                          </span>
                        )}
                      </p>

                      {hasImages ? (
                        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                          {cust.values.map(val => {
                            const valName = typeof val === "string" ? val : val.name
                            const valPrice = typeof val === "string" ? 0 : val.extraPrice
                            const valImg = typeof val === "string" ? null : val.image_url
                            const valRecommended = typeof val === "string" ? false : !!val.recommended

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
                                className={`flex h-25 w-full flex-col rounded-xl overflow-hidden border text-left transition-all active:scale-[0.98] ${selected
                                  ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500"
                                  : `${theme === "dark" ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-300"} hover:opacity-90`
                                  }`}
                              >
                                <div className="h-18 w-full bg-gray-900 border-b border-white/5 relative flex items-center justify-center shrink-0">
                                  {valImg ? (
                                    <img src={valImg} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xl">🍽️</span>
                                  )}
                                  {selected && (
                                    <div className="absolute top-1.5 right-1.5 bg-amber-500 text-black p-0.5 rounded-full shadow">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  )}
                                  {!selected && valRecommended && (
                                    <div className="absolute top-1.5 left-1.5 bg-amber-500 text-black text-[7px] font-black px-1 py-0.5 rounded shadow leading-none">
                                      ✨ REC
                                    </div>
                                  )}
                                </div>
                                <div className="p-2.5 flex-1 flex flex-col justify-between">
                                  <span className={`text-[11px] font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-900"} line-clamp-2 leading-tight flex items-center gap-1`}>
                                    {valRecommended && <span className="text-amber-500 shrink-0">✨</span>}
                                    <span>{valName}</span>
                                  </span>
                                  <span className="text-[10px] text-amber-500 font-extrabold mt-1">
                                    {valPrice > 0 ? `+$${valPrice.toFixed(2)}` : "Free"}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {cust.values.map(val => {
                            const valName = typeof val === "string" ? val : val.name
                            const valPrice = typeof val === "string" ? 0 : val.extraPrice
                            const valRecommended = typeof val === "string" ? false : !!val.recommended
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
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${selected
                                  ? "bg-amber-500 border-amber-500 text-black shadow-md shadow-amber-500/10"
                                  : `${theme === "dark" ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-300"} text-gray-300 hover:opacity-85`
                                  }`}
                              >
                                {valRecommended && <span className="text-amber-500">✨</span>}
                                <span>{valName}</span>
                                <span className={`text-[9px] font-extrabold ${selected ? "text-black/80" : "text-amber-500"}`}>
                                  {valPrice > 0 ? `(+$${valPrice.toFixed(2)})` : ""}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold opacity-60 mb-1.5">Special Instructions</label>
              <textarea
                rows={2}
                placeholder="E.g., no onion, extra spicy, gluten allergy..."
                value={itemNotes}
                onChange={e => setItemNotes(e.target.value)}
                className={`w-full ${theme === "dark" ? "bg-[#0b0f19]" : "bg-white"} border ${themeBorder} rounded-xl px-3.5 py-2.5 text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none`}
              />
            </div>
          </div>

          {/* Sticky action footer at the bottom of the modal */}
          <div className={`shrink-0 border-t ${themeBorder} ${theme === "dark" ? "bg-[#0b0f19]" : "bg-white"} px-5 py-4 w-full`}>
            <div className="max-w-xl mx-auto flex items-center gap-4">
              <div className={`flex items-center gap-3 ${theme === "dark" ? "bg-white/5" : "bg-gray-100"} border ${themeBorder} rounded-xl px-3 py-2`}>
                <button
                  onClick={() => setItemQty(q => Math.max(1, q - 1))}
                  className="font-bold text-base w-7 h-7 flex items-center justify-center hover:text-amber-500 transition-colors"
                >
                  −
                </button>
                <span className="font-extrabold text-sm w-5 text-center">{itemQty}</span>
                <button
                  onClick={() => setItemQty(q => q + 1)}
                  className="font-bold text-base w-7 h-7 flex items-center justify-center hover:text-amber-500 transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={addToCartFromDetail}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl transition-all shadow-md shadow-amber-500/10 text-xs sm:text-sm"
              >
                Add to Cart — ${(getCustomizedItemPrice(selectedItem, itemCustomizations) * itemQty).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Popup */}
      {cart.length > 0 && !showPayment && (
        <div className="fixed bottom-16 left-4 right-4 z-40 bg-amber-500 text-black p-3.5 rounded-2xl flex items-center justify-between shadow-2xl transform transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="relative bg-black/10 p-2 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-black" />
              <span className="absolute -top-1.5 -right-2 bg-black text-amber-500 text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-amber-500">
                {cartCount}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">Cart Total</p>
              <p className="font-extrabold text-base">${cartTotal.toFixed(2)}</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (activeTab === "home") {
                setActiveTab("cart")
              } else if (activeTab === "cart") {
                setShowPayment(true)
              }
            }}
            className="bg-black text-amber-500 hover:bg-black/90 active:scale-95 font-black px-5 py-3 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            {activeTab === "home" ? "Confirm Order" : "Proceed to Payment"}
          </button>
        </div>
      )}

      {/* <footer className={`fixed bottom-0 left-0 right-0 z-30 ${themeFooter} border-t py-2 flex items-center justify-around px-4`}>
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${activeTab === "home" ? "text-amber-500 font-bold" : `${themeTextMuted} hover:text-amber-500`
            }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setActiveTab("cart")}
          className={`flex flex-col items-center justify-center gap-1 transition-all relative ${activeTab === "cart" ? "text-amber-500 font-bold" : `${themeTextMuted} hover:text-amber-500`
            }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px]">Cart</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${activeTab === "history" ? "text-amber-500 font-bold" : `${themeTextMuted} hover:text-amber-500`
            }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px]">History</span>
        </button>
      </footer> */}
    </div>
  )
}
