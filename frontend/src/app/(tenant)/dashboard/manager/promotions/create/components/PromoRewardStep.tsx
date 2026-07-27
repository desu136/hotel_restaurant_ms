"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { MenuItem } from "./PromoEligibilityStep"

export interface RewardTypeOption {
  value: string
  label: string
  desc: string
}

interface PromoRewardStepProps {
  rewardType: string
  setRewardType: (val: string) => void
  rewardTypes: RewardTypeOption[]
  discountValue: number
  setDiscountValue: (val: number) => void
  maxDiscountAmount: number
  setMaxDiscountAmount: (val: number) => void
  targetItemId: string
  setTargetItemId: (val: string) => void
  targetQuantity: number
  setTargetQuantity: (val: number) => void
  comboPrice: number
  setComboPrice: (val: number) => void
  menuItems: MenuItem[]
}

export function PromoRewardStep({
  rewardType,
  setRewardType,
  rewardTypes,
  discountValue,
  setDiscountValue,
  maxDiscountAmount,
  setMaxDiscountAmount,
  targetItemId,
  setTargetItemId,
  targetQuantity,
  setTargetQuantity,
  comboPrice,
  setComboPrice,
  menuItems,
}: PromoRewardStepProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <div>
        <label className="block text-xs font-black uppercase text-[var(--muted)] mb-2">Reward Action / Concession Type *</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {rewardTypes.map((type) => (
            <div
              key={type.value}
              onClick={() => setRewardType(type.value)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                rewardType === type.value
                  ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)]/10"
                  : "border-[var(--surface-border)] bg-[var(--background)] hover:border-[var(--muted)]"
              }`}
            >
              <span className="text-xs font-black">{type.label}</span>
              <p className="text-xs text-[var(--muted)]">{type.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {rewardType === "PERCENTAGE_DISCOUNT" && (
          <>
            <div>
              <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Discount Percentage (%) *</label>
              <input
                type="number"
                min="1"
                max="100"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Maximum Discount Cap ($) (Optional)</label>
              <input
                type="number"
                min="0"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                placeholder="No limit"
                className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
              />
            </div>
          </>
        )}

        {rewardType === "FIXED_DISCOUNT" && (
          <div>
            <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Flat Cash Discount ($) *</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
            />
          </div>
        )}

        {(rewardType === "FREE_ITEM" || rewardType === "FREE_DRINK" || rewardType === "BOGO") && (
          <>
            <div>
              <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Rewarded Target Item *</label>
              <select
                value={targetItemId}
                onChange={(e) => setTargetItemId(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
              >
                <option value="">Select Item to Give Free...</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.display_name}</option>
                ))}
              </select>
            </div>
            {rewardType !== "BOGO" && (
              <div>
                <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Free Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(Number(e.target.value))}
                  className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
                />
              </div>
            )}
          </>
        )}

        {rewardType === "COMBO_PRICE" && (
          <div>
            <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Special Bundle Combo Total Price ($) *</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={comboPrice}
              onChange={(e) => setComboPrice(Number(e.target.value))}
              className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
