"use client"
import * as React from "react"
import { Tag, UtensilsCrossed } from "lucide-react"
import { CategoryTab } from "./CategoryTab"
import { EditMenuTab } from "./EditMenuTab"

const TABS = [
  { id: "category", label: "Category", icon: Tag },
  { id: "edit_menu", label: "Edit Menu", icon: UtensilsCrossed },
] as const

type TabId = typeof TABS[number]["id"]

export default function ManagerPage() {
  const [tab, setTab] = React.useState<TabId>("category")

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Manager Station 👨‍🍳</h1>
          <p className="text-[var(--muted)]">Manage restaurant staff, menu categories, and dishes.</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[var(--surface-border)]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
              tab === id
                ? "border-[var(--color-primary-600)] text-[var(--color-primary-600)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "category" && <CategoryTab />}
      {tab === "edit_menu" && <EditMenuTab />}
    </div>
  )
}
