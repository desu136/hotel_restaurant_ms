"use client"

import * as React from "react"
import { Search, Sliders } from "lucide-react"

interface MenuFilterBarProps {
  searchQuery: string
  setSearchQuery: (v: string) => void
  filterBranchId: string
  setFilterBranchId: (v: string) => void
  filterCategoryId: string
  setFilterCategoryId: (v: string) => void
  filterMinPrice: string
  setFilterMinPrice: (v: string) => void
  filterMaxPrice: string
  setFilterMaxPrice: (v: string) => void
  filterAvailability: string
  setFilterAvailability: (v: string) => void
  sortBy: string
  setSortBy: (v: string) => void
  branches: { id: string; name: string }[]
  categoryOptions: { id: string; name: string }[]
  isBranchManager: boolean
}

export function MenuFilterBar({
  searchQuery, setSearchQuery, filterBranchId, setFilterBranchId,
  filterCategoryId, setFilterCategoryId, filterMinPrice, setFilterMinPrice,
  filterMaxPrice, setFilterMaxPrice, filterAvailability, setFilterAvailability,
  sortBy, setSortBy, branches, categoryOptions, isBranchManager
}: MenuFilterBarProps) {
  return (
    <div className="border border-[var(--surface-border)] rounded-xl p-4 bg-[var(--surface)] shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--surface-border)] pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[var(--muted)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Search &amp; Filters</span>
        </div>
        {(searchQuery || filterBranchId || filterCategoryId || filterMinPrice || filterMaxPrice || filterAvailability !== "all") && (
          <button onClick={() => { setSearchQuery(""); setFilterBranchId(""); setFilterCategoryId(""); setFilterMinPrice(""); setFilterMaxPrice(""); setFilterAvailability("all") }}
            className="text-[11px] font-bold text-red-500 hover:underline">
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative col-span-1 sm:col-span-2">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-2.5" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search dishes by name or description..."
            className="w-full text-xs bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg pl-9 pr-3 py-2 focus:outline-none" />
        </div>

        {!isBranchManager && (
          <select value={filterBranchId} onChange={e => setFilterBranchId(e.target.value)} className="text-xs bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg px-3 py-2 focus:outline-none">
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}

        <select value={filterCategoryId} onChange={e => setFilterCategoryId(e.target.value)} className="text-xs bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg px-3 py-2 focus:outline-none">
          <option value="">All Categories</option>
          {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--surface-border)]/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[var(--muted)] font-medium">Price:</span>
          <input type="number" placeholder="Min" value={filterMinPrice} onChange={e => setFilterMinPrice(e.target.value)} className="w-16 px-2 py-1 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded text-xs" />
          <span className="text-[var(--muted)]">-</span>
          <input type="number" placeholder="Max" value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)} className="w-16 px-2 py-1 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded text-xs" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--muted)] font-medium">Status:</span>
            <select value={filterAvailability} onChange={e => setFilterAvailability(e.target.value)} className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded px-2 py-1 text-xs">
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[var(--muted)] font-medium">Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded px-2 py-1 text-xs">
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
              <option value="prep-asc">Prep Time (Fastest)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
