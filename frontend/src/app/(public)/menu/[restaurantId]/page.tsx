"use client"
import * as React from "react"
import { useParams, useSearchParams } from "next/navigation"

interface Restaurant {
  id: string
  name: string
  logo_url?: string | null
  banner_url?: string | null
}

interface Category { id: string; name: string }

interface Customization {
  key: string
  label: string
  multiple: boolean
  values: string[]
}

interface MenuItem {
  id: string
  display_name: string
  description?: string | null
  price: string | number
  category_id?: string | null
  image_url?: string | null
  customizations?: Customization[] | null
  category?: { id: string; name: string } | null
}

interface CartItem {
  menuItem: MenuItem
  quantity: number
  selectedCustomizations: Record<string, string | string[]>
  notes?: string
}

export default function CustomerMenuPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const restaurantId = params.restaurantId as string
  const tableId = searchParams.get("tableId") || ""
  const qrToken = searchParams.get("qrToken") || ""

  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeCategory, setActiveCategory] = React.useState<string>("all")

  const [cart, setCart] = React.useState<CartItem[]>([])
  const [showCart, setShowCart] = React.useState(false)
  const [orderPlaced, setOrderPlaced] = React.useState(false)
  const [placingOrder, setPlacingOrder] = React.useState(false)

  // Item detail modal
  const [selectedItem, setSelectedItem] = React.useState<MenuItem | null>(null)
  const [itemCustomizations, setItemCustomizations] = React.useState<Record<string, string | string[]>>({})
  const [itemNotes, setItemNotes] = React.useState("")
  const [itemQty, setItemQty] = React.useState(1)

  React.useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const [restRes, catRes, menuRes] = await Promise.all([
          fetch(`/api/restaurant/public/details/${restaurantId}`),
          fetch(`/api/restaurant/public/categories/${restaurantId}`),
          fetch(`/api/restaurant/public/menu/${restaurantId}`)
        ])
        setRestaurant(restRes.ok ? await restRes.json() : null)
        setCategories(catRes.ok ? await catRes.json() : [])
        setMenuItems(menuRes.ok ? await menuRes.json() : [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [restaurantId])

  const filteredItems = activeCategory === "all"
    ? menuItems
    : menuItems.filter(i => i.category_id === activeCategory)

  const cartTotal = cart.reduce((sum, c) => sum + parseFloat(c.menuItem.price.toString()) * c.quantity, 0)
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)

  const openItemModal = (item: MenuItem) => {
    setSelectedItem(item)
    setItemCustomizations({})
    setItemNotes("")
    setItemQty(1)
  }

  const addToCart = () => {
    if (!selectedItem) return
    setCart(prev => {
      const existing = prev.findIndex(c => c.menuItem.id === selectedItem.id)
      if (existing >= 0 && Object.keys(itemCustomizations).length === 0) {
        const updated = [...prev]
        updated[existing].quantity += itemQty
        return updated
      }
      return [...prev, { menuItem: selectedItem, quantity: itemQty, selectedCustomizations: itemCustomizations, notes: itemNotes }]
    })
    setSelectedItem(null)
    setShowCart(false)
  }

  const removeFromCart = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev]
      updated[idx].quantity += delta
      if (updated[idx].quantity <= 0) return prev.filter((_, i) => i !== idx)
      return updated
    })
  }

  const placeOrder = async () => {
    if (cart.length === 0) return
    setPlacingOrder(true)
    try {
      const items = cart.map(c => ({
        menu_item_id: c.menuItem.id,
        quantity: c.quantity,
        customizations: Object.keys(c.selectedCustomizations).length > 0 ? c.selectedCustomizations : null
      }))
      const res = await fetch("/api/orders/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: restaurantId, table_id: tableId || null, items })
      })
      if (res.ok) {
        setOrderPlaced(true)
        setCart([])
        setShowCart(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Loading menu…</p>
      </div>
    </div>
  )

  if (!restaurant) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <p>Restaurant not found.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans pb-32">
      {/* Banner */}
      <div className="relative h-52 bg-gradient-to-br from-amber-600 to-orange-700 overflow-hidden">
        {restaurant.banner_url && (
          <img src={restaurant.banner_url} alt="banner" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-end gap-3">
          {restaurant.logo_url && (
            <img src={restaurant.logo_url} alt="logo" className="w-14 h-14 rounded-2xl border-2 border-white/20 object-cover shadow-xl" />
          )}
          <div>
            <h1 className="text-2xl font-black tracking-tight drop-shadow">{restaurant.name}</h1>
            {tableId && <p className="text-amber-400 text-sm font-semibold">Table {tableId.slice(0, 6).toUpperCase()}</p>}
          </div>
        </div>
      </div>

      {/* Order Confirmed Banner */}
      {orderPlaced && (
        <div className="mx-4 mt-4 bg-green-500/20 border border-green-500/40 rounded-2xl px-4 py-4 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-green-400">Your order has been placed!</p>
          <p className="text-sm text-gray-400 mt-0.5">Our staff will prepare it shortly. Sit back and relax.</p>
          <button onClick={() => setOrderPlaced(false)} className="mt-3 text-xs text-gray-400 underline">Order more</button>
        </div>
      )}

      {/* Category Pills */}
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur-md pt-3 pb-2 px-4 border-b border-white/5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${activeCategory === "all" ? "bg-amber-500 text-black" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${activeCategory === cat.id ? "bg-amber-500 text-black" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-4 space-y-3">
        {filteredItems.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="font-semibold">No items available in this category</p>
          </div>
        )}
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => openItemModal(item)}
            className="w-full text-left bg-gray-900 border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/40 active:scale-[0.99] transition-all shadow-sm"
          >
            <div className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-white">{item.display_name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-amber-400 font-black text-lg">
                    ${parseFloat(item.price.toString()).toFixed(2)}
                  </span>
                  {item.customizations && item.customizations.length > 0 && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                      Customizable
                    </span>
                  )}
                </div>
              </div>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.display_name}
                  className="w-24 h-24 rounded-xl object-cover shrink-0 border border-white/10"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gray-800 shrink-0 flex items-center justify-center text-3xl">
                  🍽️
                </div>
              )}
            </div>
            {/* Quick Add button */}
            <div className="px-4 pb-4 flex justify-end">
              {cart.some(c => c.menuItem.id === item.id) ? (
                <div className="flex items-center gap-2 bg-amber-500 rounded-full px-3 py-1">
                  <button onClick={e => { e.stopPropagation(); updateCartQty(cart.findIndex(c => c.menuItem.id === item.id), -1) }}
                    className="text-black font-black w-5 h-5 flex items-center justify-center">−</button>
                  <span className="text-black font-black text-sm w-4 text-center">
                    {cart.filter(c => c.menuItem.id === item.id).reduce((s, c) => s + c.quantity, 0)}
                  </span>
                  <button onClick={e => { e.stopPropagation(); updateCartQty(cart.findIndex(c => c.menuItem.id === item.id), 1) }}
                    className="text-black font-black w-5 h-5 flex items-center justify-center">+</button>
                </div>
              ) : (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-semibold">
                  + Add to Order
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          <div className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
            {selectedItem.image_url && (
              <img src={selectedItem.image_url} alt={selectedItem.display_name} className="w-full h-52 object-cover rounded-t-3xl sm:rounded-t-3xl" />
            )}
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black">{selectedItem.display_name}</h2>
                  {selectedItem.description && <p className="text-gray-400 text-sm mt-1">{selectedItem.description}</p>}
                </div>
                <span className="text-amber-400 font-black text-xl shrink-0 ml-3">
                  ${parseFloat(selectedItem.price.toString()).toFixed(2)}
                </span>
              </div>

              {/* Customizations */}
              {selectedItem.customizations && selectedItem.customizations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Customize</h3>
                  {selectedItem.customizations.map(cust => (
                    <div key={cust.key} className="space-y-2">
                      <p className="text-sm font-semibold text-white">{cust.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {cust.values.map(val => {
                          const selected = cust.multiple
                            ? (itemCustomizations[cust.key] as string[] || []).includes(val)
                            : itemCustomizations[cust.key] === val
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                if (cust.multiple) {
                                  const current = (itemCustomizations[cust.key] as string[] || [])
                                  const updated = selected ? current.filter(v => v !== val) : [...current, val]
                                  setItemCustomizations(prev => ({ ...prev, [cust.key]: updated }))
                                } else {
                                  setItemCustomizations(prev => ({ ...prev, [cust.key]: selected ? "" : val }))
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                                selected
                                  ? "bg-amber-500 border-amber-500 text-black"
                                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                              }`}
                            >
                              {val}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Special Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Allergies, preferences, extra requests..."
                  value={itemNotes}
                  onChange={e => setItemNotes(e.target.value)}
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>

              {/* Quantity + Add */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-3 bg-gray-800 rounded-full px-4 py-2">
                  <button onClick={() => setItemQty(q => Math.max(1, q - 1))} className="text-white font-black text-lg w-7 h-7 flex items-center justify-center hover:text-amber-400 transition-colors">−</button>
                  <span className="font-black text-lg w-6 text-center">{itemQty}</span>
                  <button onClick={() => setItemQty(q => q + 1)} className="text-white font-black text-lg w-7 h-7 flex items-center justify-center hover:text-amber-400 transition-colors">+</button>
                </div>
                <button
                  onClick={addToCart}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 rounded-2xl transition-colors shadow-lg shadow-amber-500/20"
                >
                  Add to Order — ${(parseFloat(selectedItem.price.toString()) * itemQty).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart FAB */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-6 left-4 right-4 z-40">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-4 rounded-2xl shadow-2xl shadow-amber-500/30 transition-all flex items-center justify-between px-5"
          >
            <span className="bg-black/20 text-black font-black px-2 py-0.5 rounded-lg text-sm">{cartCount}</span>
            <span className="text-base">View Order</span>
            <span className="font-black text-base">${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Cart Sheet */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-gray-900 border border-white/10 rounded-t-3xl shadow-2xl z-10 max-h-[85vh] overflow-y-auto">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">Your Order</h2>
                <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-white transition-colors text-sm">✕ Close</button>
              </div>

              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Your order is empty</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-gray-800/50 rounded-2xl p-3">
                        {item.menuItem.image_url && (
                          <img src={item.menuItem.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-white">{item.menuItem.display_name}</p>
                          {Object.entries(item.selectedCustomizations).map(([k, v]) => (
                            <p key={k} className="text-[10px] text-amber-400">{k}: {Array.isArray(v) ? v.join(", ") : v}</p>
                          ))}
                          {item.notes && <p className="text-[10px] text-gray-400 italic mt-0.5">{item.notes}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-amber-400 font-black text-sm">
                            ${(parseFloat(item.menuItem.price.toString()) * item.quantity).toFixed(2)}
                          </span>
                          <div className="flex items-center gap-2 bg-gray-700 rounded-full px-2 py-1">
                            <button onClick={() => updateCartQty(idx, -1)} className="text-white font-black text-sm w-5 h-5 flex items-center justify-center">−</button>
                            <span className="font-black text-xs w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQty(idx, 1)} className="text-white font-black text-sm w-5 h-5 flex items-center justify-center">+</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-3 space-y-1">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Subtotal</span><span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-lg">
                      <span>Total</span><span className="text-amber-400">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={placeOrder}
                    disabled={placingOrder}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {placingOrder ? (
                      <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> Placing Order…</>
                    ) : (
                      `🛎️ Place Order · $${cartTotal.toFixed(2)}`
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
