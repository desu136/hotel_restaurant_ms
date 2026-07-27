"use client"
import * as React from "react"
import { Category } from "./types"

interface Props {
  parentCategories: Category[]
  filteredSubCategories: Category[]
  activeSubCategory: string
  scrollToSubCategory: (subCatId: string) => void
  themeSidebar: string
  themeBorder: string
  themeTextMuted: string
  theme: "dark" | "light"
}

export default function CategorySidebar({
  parentCategories,
  filteredSubCategories,
  activeSubCategory,
  scrollToSubCategory,
  themeSidebar,
  themeBorder,
  themeTextMuted,
  theme,
}: Props) {
  return (
    <div className={`w-19 sm:w-28 ${themeSidebar} overflow-y-auto flex-shrink-0 py-2 border-r ${themeBorder}`}>
      <div className="space-y-0.5">
        {parentCategories.length > 0 && (
          <button
            onClick={() => scrollToSubCategory("all")}
            className={`w-full text-left px-3 py-3.5 text-[11px] font-semibold border-l-[3px] transition-all leading-snug ${activeSubCategory === "all"
              ? "bg-background text-foreground border-[#FFC72C] font-black"
              : `${themeTextMuted} border-transparent ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-gray-100"}`
              }`}
          >
            All Items
          </button>
        )}
        {filteredSubCategories.map(cat => {
          const isActive = activeSubCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => scrollToSubCategory(cat.id)}
              className={`w-full text-left px-3 py-3.5 text-[11px] font-semibold border-l-[3px] transition-all leading-snug ${isActive
                ? "bg-background text-foreground border-[#FFC72C] font-black"
                : `${themeTextMuted} border-transparent ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-gray-100"}`
                }`}
            >
              {cat.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
