"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Sparkles, Calendar, Tag, ShieldCheck, Ticket } from "lucide-react"

interface PromoPreviewStepProps {
  title: string
  code: string
  description: string
  promoType: string
  rewardType: string
  startDate: string
  endDate: string
  bannerUrl: string
  isActive: boolean
  setIsActive: (val: boolean) => void
  status: string
  setStatus: (val: string) => void
  summaryText: string
}

export function PromoPreviewStep({
  title,
  code,
  description,
  promoType,
  rewardType,
  startDate,
  endDate,
  bannerUrl,
  isActive,
  setIsActive,
  status,
  setStatus,
  summaryText,
}: PromoPreviewStepProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--background)] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-[var(--color-primary-600)] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Live Rule Summary
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)] font-bold">Campaign Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-[var(--foreground)] font-medium">
          {summaryText}
        </p>

        <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-[var(--surface-border)] text-xs text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--color-primary-600)]" />
            <span>Duration: <strong className="text-[var(--foreground)]">{startDate || "Immediate"}</strong> to <strong className="text-[var(--foreground)]">{endDate || "Ongoing"}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[var(--color-primary-600)]" />
            <span>Type: <strong className="text-[var(--foreground)]">{promoType}</strong> ({rewardType})</span>
          </div>
          {code && (
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-500" />
              <span>Coupon Code: <strong className="text-amber-500 font-mono">{code}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Customer Preview Card Mock */}
      <div>
        <label className="block text-xs font-black uppercase text-[var(--muted)] mb-2">Customer Mini-App Preview Card</label>
        <div className="max-w-sm rounded-3xl border border-[#FFC72C]/20 bg-gradient-to-br from-[#FFC72C]/10 to-transparent p-4 flex flex-col gap-2 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-full bg-[#FFC72C]/10 skew-x-12 transform origin-top-right pointer-events-none" />
          {bannerUrl && (
            <div className="h-24 rounded-2xl overflow-hidden mb-1">
              <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex items-center justify-between z-10">
            <span className="text-[8px] font-black bg-[#DA291C] text-white px-2 py-0.5 rounded uppercase tracking-wider">
              {promoType.replace(/_/g, ' ')}
            </span>
            {code && <span className="text-[10px] font-black text-amber-500 font-mono">{code}</span>}
          </div>
          <h4 className="font-black text-sm z-10">{title || "Campaign Title Placeholder"}</h4>
          <p className="text-[10px] text-[var(--muted)] leading-relaxed z-10">
            {description || "Campaign short description will be displayed here for customers."}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[var(--surface-border)]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span className="text-xs font-bold text-[var(--muted)]">Ready to launch campaign</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-[var(--color-primary-600)]"
          />
          Enable Campaign Immediately
        </label>
      </div>
    </motion.div>
  )
}
