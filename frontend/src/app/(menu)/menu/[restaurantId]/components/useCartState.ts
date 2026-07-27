"use client"
import * as React from "react"
import { MenuItem, CartItem, Customization, getDefaultCustomizations } from "./types"

export function useCartState(restaurantTenantId?: string | null, miniAppUser?: any) {
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [orderNotes, setOrderNotes] = React.useState("")
  const [showPayment, setShowPayment] = React.useState(false)
  const [orderType, setOrderType] = React.useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY">("DINE_IN")
  const [deliveryAddress, setDeliveryAddress] = React.useState("")
  const [promoEvaluation, setPromoEvaluation] = React.useState<{
    promotion_id: string | null
    promotion_title: string | null
    discount_amount: number
    hints: string[]
  }>({ promotion_id: null, promotion_title: null, discount_amount: 0, hints: [] })

  const getCustomizedItemPrice = (item: MenuItem, selectedCusts: Record<string, string | string[]>) => {
    let price = parseFloat(item.price.toString())
    if (item.customizations) {
      for (const [key, selectedVal] of Object.entries(selectedCusts)) {
        const group = item.customizations.find(g => g.key === key)
        if (group && group.values) {
          if (Array.isArray(selectedVal)) {
            for (const v of selectedVal) {
              const choice = group.values.find(choiceVal => (typeof choiceVal === "string" ? choiceVal : choiceVal.name) === v)
              if (choice && typeof choice !== "string" && choice.extraPrice) {
                price += parseFloat(choice.extraPrice.toString())
              }
            }
          } else if (typeof selectedVal === "string" && selectedVal) {
            const choice = group.values.find(choiceVal => (typeof choiceVal === "string" ? choiceVal : choiceVal.name) === selectedVal)
            if (choice && typeof choice !== "string" && choice.extraPrice) {
              price += parseFloat(choice.extraPrice.toString())
            }
          }
        }
      }
    }
    return price
  }

  const cartTotal = cart.reduce((sum, c) => sum + getCustomizedItemPrice(c.menuItem, c.selectedCustomizations) * c.quantity, 0)
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)
  const promoDiscount = promoEvaluation.discount_amount ?? 0
  const cartFinalTotal = Math.max(0, cartTotal - promoDiscount)

  React.useEffect(() => {
    const tenantId = restaurantTenantId || localStorage.getItem("hospitality_tenant_id") || ""
    const customerId = miniAppUser?.id || null
    const items = cart.map(c => ({
      menu_item_id: c.menuItem.id,
      category_id: c.menuItem.category_id || undefined,
      quantity: c.quantity,
      unit_price: getCustomizedItemPrice(c.menuItem, c.selectedCustomizations)
    }))

    if (items.length > 0 && tenantId) {
      fetch("/api/promotions/public/evaluate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, customerId, items, orderType })
      })
      .then(res => res.json())
      .then(data => {
        const r = data?.result
        if (r) {
          setPromoEvaluation({
            promotion_id: r.promotion_id || null, promotion_title: r.promotion_title || null,
            discount_amount: r.discount_amount || 0, hints: r.hints || []
          })
        }
      })
      .catch(err => console.error("Error evaluating promotions:", err))
    } else {
      setPromoEvaluation({ promotion_id: null, promotion_title: null, discount_amount: 0, hints: [] })
    }
  }, [cart, orderType, miniAppUser, restaurantTenantId])

  const addToCartDirectly = (item: MenuItem) => {
    const defaults = getDefaultCustomizations(item)
    setCart(prev => {
      const existingIdx = prev.findIndex(c => c.menuItem.id === item.id && JSON.stringify(c.selectedCustomizations) === JSON.stringify(defaults) && !c.notes)
      if (existingIdx >= 0) {
        return prev.map((c, i) => i === existingIdx ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { menuItem: item, quantity: 1, selectedCustomizations: defaults, notes: "" }]
    })
  }

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => {
      if (prev[idx].quantity + delta <= 0) return prev.filter((_, i) => i !== idx)
      return prev.map((c, i) => i === idx ? { ...c, quantity: c.quantity + delta } : c)
    })
  }

  const cartPayload = cart.map(c => ({
    menu_item_id: c.menuItem.id, quantity: c.quantity,
    customizations: Object.keys(c.selectedCustomizations).length > 0 ? c.selectedCustomizations : null
  }))

  return {
    cart, setCart, orderNotes, setOrderNotes, showPayment, setShowPayment, orderType, setOrderType,
    deliveryAddress, setDeliveryAddress, promoEvaluation, getCustomizedItemPrice, cartTotal, cartCount,
    promoDiscount, cartFinalTotal, addToCartDirectly, updateCartQty, cartPayload,
  }
}
