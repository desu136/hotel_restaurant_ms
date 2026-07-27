"use client"

import * as React from "react"
import { motion } from "framer-motion"

interface PromoBasicScheduleStepProps {
  title: string
  setTitle: (val: string) => void
  code: string
  setCode: (val: string) => void
  description: string
  setDescription: (val: string) => void
  startDate: string
  setStartDate: (val: string) => void
  endDate: string
  setEndDate: (val: string) => void
  bannerUrl: string
  setBannerUrl: (val: string) => void
  termsConditions: string
  setTermsConditions: (val: string) => void
}

export function PromoBasicScheduleStep({
  title,
  setTitle,
  code,
  setCode,
  description,
  setDescription,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  bannerUrl,
  setBannerUrl,
  termsConditions,
  setTermsConditions,
}: PromoBasicScheduleStepProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Promotion Title *</label>
          <input
            type="text"
            placeholder="e.g. Happy Hour Draft Special"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--color-primary-600)] transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Custom Coupon Code (Optional)</label>
          <input
            type="text"
            placeholder="e.g. HH15OFF"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--color-primary-600)] transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Short Description</label>
        <textarea
          placeholder="Give customers a brief explanation of how to qualify..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--color-primary-600)] transition-all resize-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)] transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)] transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Banner Image URL</label>
        <input
          type="text"
          placeholder="https://images.unsplash.com/... or any static URL"
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--color-primary-600)] transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Terms & Conditions</label>
        <textarea
          placeholder="e.g. Cannot be combined with other offers. One per table..."
          value={termsConditions}
          onChange={(e) => setTermsConditions(e.target.value)}
          rows={2}
          className="w-full bg-[var(--background)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--color-primary-600)] transition-all resize-none"
        />
      </div>
    </motion.div>
  )
}
