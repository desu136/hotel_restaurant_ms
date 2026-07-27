"use client"

import * as React from "react"
import { Pencil, Trash2, Loader2, Utensils, Timer, ToggleLeft, ToggleRight } from "lucide-react"

interface MenuItemCardProps {
  item: any
  isMaster: boolean
  onEdit: (item: any, isMaster: boolean) => void
  onDelete: (id: string) => void
  deletingId: string | null
  onToggleAvailability: (item: any, isMaster: boolean) => void
  togglingId: string | null
}

export function MenuItemCard({ item, isMaster, onEdit, onDelete, deletingId, onToggleAvailability, togglingId }: MenuItemCardProps) {
  const images: string[] = item.image_urls && item.image_urls.length > 0 ? item.image_urls : item.image_url ? [item.image_url] : []
  const primaryImage = images[0]

  return (
    <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-4 flex flex-col justify-between hover:border-[var(--color-primary-500)]/40 hover:shadow-sm transition-all">
      <div className="space-y-3">
        {primaryImage ? (
          <div className="relative w-full h-36 rounded-lg overflow-hidden bg-[var(--surface-hover)]">
            <img src={primaryImage} alt={item.display_name} className="w-full h-full object-cover" />
            {images.length > 1 && (
              <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-md">
                +{images.length - 1} photos
              </span>
            )}
          </div>
        ) : (
          <div className="w-full h-28 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center text-[var(--muted)]">
            <Utensils className="w-8 h-8 opacity-30" />
          </div>
        )}

        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-sm text-[var(--foreground)] truncate">{item.display_name}</h4>
            <span className="font-black text-sm text-[var(--color-primary-600)] shrink-0">${Number(item.price).toFixed(2)}</span>
          </div>

          {item.description && (
            <p className="text-xs text-[var(--muted)] line-clamp-2 mt-1">{item.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[var(--muted)]">
          {item.category?.name && (
            <span className="px-2 py-0.5 rounded-md bg-[var(--surface-hover)] font-medium">
              {item.category.name}
            </span>
          )}
          {item.prep_time && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-hover)] font-medium">
              <Timer className="w-3 h-3" /> {item.prep_time}m
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--surface-border)]/60">
        <button
          onClick={() => onToggleAvailability(item, isMaster)}
          disabled={togglingId === item.id}
          className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-opacity"
        >
          {togglingId === item.id ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--muted)]" />
          ) : item.availability ? (
            <ToggleRight className="w-5 h-5 text-emerald-500" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-gray-400" />
          )}
          <span className={item.availability ? "text-emerald-500 font-bold" : "text-gray-400"}>
            {item.availability ? "Available" : "Unavailable"}
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(item, isMaster)} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--color-primary-600)] transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(item.id)} disabled={deletingId === item.id} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-500 transition-colors disabled:opacity-40">
            {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
