"use client"
import { MapPin, Settings, Sun, Moon, Search, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { MiniAppUser, MiniAppLocation } from "@/lib/miniapp-bridge"

interface Props {
  theme: "light" | "dark"
  userProfile: MiniAppUser | null
  userCoords: MiniAppLocation | null
  showSearch: boolean
  searchQuery: string
  onToggleTheme: () => void
  onToggleSearch: () => void
  onSearchChange: (q: string) => void
  onOpenSettings: () => void
}

export function HomeHeader({ theme, userProfile, userCoords, showSearch, searchQuery, onToggleTheme, onToggleSearch, onSearchChange, onOpenSettings }: Props) {
  const themeTitle = theme === "dark" ? "text-white" : "text-gray-900"
  const themeMuted = theme === "dark" ? "text-neutral-400" : "text-gray-500"

  return (
    <div className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${theme === "dark" ? "bg-[#0c0c0c]/80 border-white/[0.08]" : "bg-white/80 border-gray-100 shadow-sm"}`}>
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <MapPin className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`font-black text-xs uppercase tracking-wider truncate ${themeTitle}`}>
                {userProfile?.name ? `Hi, ${userProfile.name}` : "Welcome"}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>
            <p className={`text-[10px] truncate ${themeMuted}`}>
              {userCoords ? `Near ${userCoords.latitude.toFixed(2)}, ${userCoords.longitude.toFixed(2)}` : "Select a restaurant or branch"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={onToggleSearch} className={`p-2 rounded-full border transition-all active:scale-90 ${showSearch ? (theme === "dark" ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600") : (theme === "dark" ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10" : "bg-white border-gray-100 shadow-sm text-gray-500 hover:text-amber-600 hover:bg-gray-50")}`} title="Search Outlets">
            <Search className="w-4 h-4" />
          </button>
          <button onClick={onToggleTheme} className={`p-2 rounded-full border transition-all active:scale-90 ${theme === "dark" ? "bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10" : "bg-white border-gray-100 shadow-sm text-amber-600 hover:bg-gray-50"}`} title="Toggle Theme">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={onOpenSettings} className={`p-2 rounded-full border transition-all active:scale-90 ${theme === "dark" ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10" : "bg-white border-gray-100 shadow-sm text-gray-500 hover:bg-gray-50"}`} title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSearch && (
          <motion.div key="outlet-search" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden px-5 pb-2.5">
            <div className={`relative flex items-center rounded-xl border transition-all ${theme === "dark" ? "bg-white/5 border-white/10 focus-within:border-amber-500/50" : "bg-gray-100 border-gray-200 focus-within:border-amber-500 focus-within:bg-white"}`}>
              <Search className="w-3.5 h-3.5 absolute left-3 text-gray-400 pointer-events-none" />
              <input autoFocus type="text" value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search restaurants or outlets by name..." className={`w-full bg-transparent pl-9 pr-8 py-2 text-xs outline-none ${theme === "dark" ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"}`} />
              {searchQuery && (
                <button onClick={() => onSearchChange("")} className="absolute right-2.5 p-1 rounded-full text-gray-400 hover:text-amber-500">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
