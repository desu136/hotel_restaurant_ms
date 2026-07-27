"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

export interface PromotionTypeOption {
  value: string
  label: string
  group: string
  desc: string
}

export interface MenuItem {
  id: string
  display_name: string
  price: number
  category_id?: string
}

export interface Category {
  id: string
  name: string
}

interface PromoEligibilityStepProps {
  promoType: string
  setPromoType: (val: string) => void
  promotionTypes: PromotionTypeOption[]
  minOrderAmount: number
  setMinOrderAmount: (val: number) => void
  allowedOrderTypes: string[]
  setAllowedOrderTypes: React.Dispatch<React.SetStateAction<string[]>>
  categories: Category[]
  menuItems: MenuItem[]
  categoryId: string
  setCategoryId: (val: string) => void
  menuItemId: string
  setMenuItemId: (val: string) => void
  buyItemId: string
  setBuyItemId: (val: string) => void
  buyQuantity: number
  setBuyQuantity: (val: number) => void
}

export function PromoEligibilityStep({
  promoType,
  setPromoType,
  promotionTypes,
  minOrderAmount,
  setMinOrderAmount,
  allowedOrderTypes,
  setAllowedOrderTypes,
  categories,
  menuItems,
  categoryId,
  setCategoryId,
  menuItemId,
  setMenuItemId,
  buyItemId,
  setBuyItemId,
  buyQuantity,
  setBuyQuantity,
}: PromoEligibilityStepProps) {
  const toggleOrderType = (t: string) => {
    setAllowedOrderTypes((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <div>
        <label className="block text-xs font-black uppercase text-[var(--muted)] mb-2">Campaign Category / Trigger Strategy *</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {promotionTypes.map((type) => (
            <div
              key={type.value}
              onClick={() => setPromoType(type.value)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                promoType === type.value
                  ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)]/10"
                  : "border-[var(--surface-border)] bg-[var(--background)] hover:border-[var(--muted)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black">{type.label}</span>
                <span className="text-[10px] font-bold text-[var(--muted)]">{type.group}</span>
              </div>
              <p className="text-xs text-[var(--muted)]">{type.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {promoType === "MINIMUM_SPEND" && (
          <div>
            <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Minimum Order Subtotal ($)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(Number(e.target.value))}
              className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
            />
          </div>
        )}

        {promoType === "CATEGORY_PROMOTION" && (
          <div>
            <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Target Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
            >
              <option value="">Select a Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {promoType === "MENU_ITEM_PROMOTION" && (
          <div>
            <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Target Menu Item *</label>
            <select
              value={menuItemId}
              onChange={(e) => setMenuItemId(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
            >
              <option value="">Select a Menu Item...</option>
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>{item.display_name} (${item.price.toFixed(2)})</option>
              ))}
            </select>
          </div>
        )}

        {promoType === "BUY_X_GET_Y" && (
          <>
            <div>
              <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Required Buy Item *</label>
              <select
                value={buyItemId}
                onChange={(e) => setBuyItemId(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
              >
                <option value="">Select Menu Item to Buy...</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Required Buy Quantity</label>
              <input
                type="number"
                min="1"
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(Number(e.target.value))}
                className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
              />
            </div>
          </>
        )}
      </div>

      <div>
        <label className="block text-xs font-black uppercase text-[var(--muted)] mb-2">Applicable Order Channels *</label>
        <div className="flex flex-wrap gap-3">
          {[
            { id: "DINE_IN", label: "Dine-In" },
            { id: "TAKEAWAY", label: "Takeaway" },
            { id: "DELIVERY", label: "Delivery" },
          ].map((ch) => (
            <button
              type="button"
              key={ch.id}
              onClick={() => toggleOrderType(ch.id)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                allowedOrderTypes.includes(ch.id)
                  ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]"
                  : "bg-[var(--background)] border-[var(--surface-border)] text-[var(--muted)] hover:border-[var(--foreground)]"
              }`}
            >
              {allowedOrderTypes.includes(ch.id) && <Check className="w-3.5 h-3.5" />}
              {ch.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
