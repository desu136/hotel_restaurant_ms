"use client"
import { useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, Sun, Moon, Search, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export type FilterTab = "ALL" | "DINE_IN" | "TAKEAWAY" | "DELIVERY"

export const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "DINE_IN", label: "Dine-In" },
  { key: "TAKEAWAY", label: "Takeaway" },
  { key: "DELIVERY", label: "Delivery" },
]

interface Props {
  theme: "light" | "dark"
  showSearch: boolean
  searchQuery: string
  activeFilter: FilterTab
  orders: any[]
  refreshing: boolean
  onToggleTheme: () => void
  onToggleSearch: () => void
  onSearchChange: (q: string) => void
  onFilterChange: (f: FilterTab) => void
  onRefresh: () => void
}

export function OrdersHeader({ theme, showSearch, searchQuery, activeFilter, orders, refreshing, onToggleTheme, onToggleSearch, onSearchChange, onFilterChange, onRefresh }: Props) {
  const router = useRouter()
  const themeTitle = theme === "dark" ? "text-white font-extrabold" : "text-gray-900 font-extrabold"

  return (
    <div className={`sticky top-0 z-40 border-b transition-colors ${theme === "dark" ? "bg-gray-900/80 border-white/5 backdrop-blur-md" : "bg-white border-gray-100 shadow-sm"}`}>
      <div className="flex items-center justify-between px-4 py-3.5">
        <button onClick={() => router.back()} className={`p-2 -ml-1 rounded-full transition-colors ${theme === "dark" ? "hover:bg-white/5 text-white" : "hover:bg-gray-100 text-gray-700"}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`font-black text-sm uppercase tracking-wider ${themeTitle}`}>My Orders</h1>
        <div className="flex items-center gap-1.5">
          <button onClick={onToggleSearch} className={`p-2 rounded-full border transition-all active:scale-90 ${showSearch ? (theme === "dark" ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600") : (theme === "dark" ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10" : "bg-white border-gray-100 shadow-sm text-gray-500 hover:text-amber-600 hover:bg-gray-50")}`} title="Search Orders">
            <Search className="w-4 h-4" />
          </button>
          <button onClick={onToggleTheme} className={`p-2 rounded-full border transition-all active:scale-90 ${theme === "dark" ? "bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10" : "bg-white border-gray-100 shadow-sm text-amber-600 hover:bg-gray-50"}`} title="Toggle Theme">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={onRefresh} disabled={refreshing} className={`p-2 rounded-full transition-colors ${theme === "dark" ? "hover:bg-white/5 text-gray-300" : "hover:bg-gray-100 text-gray-500"}`}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSearch && (
          <motion.div key="orders-search" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden px-4 pb-2">
            <div className={`relative flex items-center rounded-xl border transition-all ${theme === "dark" ? "bg-white/5 border-white/10 focus-within:border-amber-500/50" : "bg-gray-100 border-gray-200 focus-within:border-amber-500 focus-within:bg-white"}`}>
              <Search className="w-3.5 h-3.5 absolute left-3 text-gray-400 pointer-events-none" />
              <input autoFocus type="text" value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search by restaurant, #number, items..." className={`w-full bg-transparent pl-9 pr-8 py-2.5 text-xs outline-none ${theme === "dark" ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"}`} />
              {searchQuery && (
                <button onClick={() => onSearchChange("")} className={`absolute right-2.5 p-1 rounded-full ${theme === "dark" ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-200 text-gray-400"}`}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-0 px-4 pb-0 overflow-x-auto scrollbar-none">
        {FILTER_TABS.map(tab => {
          const count = tab.key === "ALL" ? orders.length : orders.filter(o => o.order_type === tab.key).length
          const isSelected = activeFilter === tab.key
          return (
            <button key={tab.key} onClick={() => onFilterChange(tab.key)} className={`relative shrink-0 px-4 py-3 text-xs font-bold transition-colors ${isSelected ? "text-amber-500" : theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-600"}`}>
              {tab.label}
              {count > 0 && tab.key !== "ALL" && (
                <span className={`ml-1 text-[9px] font-black px-1.5 py-0.5 rounded-full ${isSelected ? "bg-amber-500 text-black" : theme === "dark" ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-400"}`}>{count}</span>
              )}
              {isSelected && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
