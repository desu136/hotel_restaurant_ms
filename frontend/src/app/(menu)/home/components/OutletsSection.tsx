"use client"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"

interface Restaurant {
  id: string
  name: string
  logo_url?: string | null
  branch?: { name: string } | null
  distance?: number
  children: any[]
  childrenCount: number
}

interface Props {
  sortedRestaurants: Restaurant[]
  outletSearchQuery: string
  theme: "dark" | "light"
  themeCard: string
  themeTextMuted: string
  themeTextTitle: string
  onBrandClick: (rest: Restaurant) => void
  onBranchSelect: (restaurantId: string, branchId?: string) => void
}

export default function OutletsSection({
  sortedRestaurants,
  outletSearchQuery,
  theme,
  themeCard,
  themeTextMuted,
  themeTextTitle,
  onBrandClick,
  onBranchSelect,
}: Props) {
  return (
    <div className="flex flex-col gap-2 pb-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-[10px] font-extrabold uppercase tracking-wider ${themeTextMuted}`}>Featured Outlets</h3>
        {outletSearchQuery && (
          <span className="text-[9px] font-extrabold text-[#FFC72C] uppercase tracking-wide">
            {sortedRestaurants.length} found
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {sortedRestaurants.length === 0 ? (
          <div className={`border rounded-2xl p-6 text-center text-xs shadow-sm ${
            theme === "dark" ? "bg-white/5 border-white/5" : "bg-white border-gray-100"
          }`}>
            No active dining outlets discovered.
          </div>
        ) : (
          sortedRestaurants.map((rest) => {
            const isBrand = rest.children && rest.children.length > 1
            const onClick = () => {
              if (isBrand) {
                onBrandClick(rest)
              } else {
                onBranchSelect(rest.id, rest.children?.[0]?.id)
              }
            }
            return (
              <motion.div
                key={rest.id}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
                className={`border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${themeCard} hover:border-[#FFC72C]/30`}
              >
                <div className="flex items-center gap-3">
                  {rest.logo_url ? (
                    <img src={rest.logo_url} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/5" alt={rest.name} />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#FFC72C]/10 text-[#FFC72C] flex items-center justify-center font-extrabold text-sm border border-[#FFC72C]/10 shrink-0">
                      {rest.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className={`font-bold text-xs ${themeTextTitle}`}>{rest.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1 text-[9px]">
                      {isBrand ? (
                        <span className="bg-[#FFC72C]/10 text-[#FFC72C] border border-[#FFC72C]/20 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide">
                          {rest.children.length} outlets
                        </span>
                      ) : (
                        <span className={`${themeTextMuted} font-medium`}>{rest.branch?.name || "Main Outlet"}</span>
                      )}
                      {rest.distance !== undefined && (
                        <>
                          <span className={themeTextMuted}>•</span>
                          <span className="text-[#FFC72C] font-extrabold">{rest.distance} km away</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${themeTextMuted} opacity-80`} />
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
