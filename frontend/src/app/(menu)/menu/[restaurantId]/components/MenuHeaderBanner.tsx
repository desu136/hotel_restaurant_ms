"use client"
import * as React from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Sun, Moon } from "lucide-react"
import { Restaurant, Category, TableDetails, getCategoryEmoji } from "./types"

interface Props {
  restaurant: Restaurant
  tableDetails: TableDetails | null
  tableId: string
  theme: "dark" | "light"
  toggleTheme: () => void
  onBack: () => void
  parentCategories: Category[]
  activeParentId: string
  setActiveParentId: (id: string) => void
  themeBg: string
  themeBorder: string
}

export default function MenuHeaderBanner({
  restaurant,
  tableDetails,
  tableId,
  theme,
  toggleTheme,
  onBack,
  parentCategories,
  activeParentId,
  setActiveParentId,
  themeBg,
  themeBorder,
}: Props) {
  return (
    <>
      <div className="relative h-40 sm:h-52 overflow-hidden flex items-end pb-4">
        {restaurant.banner_url ? (
          <motion.img
            src={restaurant.banner_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-0"
            animate={{
              scale: [1, 1.08, 3.03, 1.09, 1],
              x: [0, 50, -30, 3, 0],
              y: [0, -30, 50, -2, 0],
            }}
            transition={{
              duration: 20,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror"
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 z-0" />
        )}

        <div className={`absolute inset-0 z-0 pointer-events-none bg-gradient-to-t ${theme === "dark"
          ? "from-[#0c0c0c] via-[#0c0c0c]/50 to-black/30"
          : "from-[#f8f9fa] via-[#f8f9fa]/50 to-black/10"
          }`} />

        {!tableId && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={onBack}
              className={`p-2.5 rounded-full border transition-all flex items-center justify-center shadow-md ${theme === "dark" ? "bg-black/45 border-white/10 text-white hover:bg-black/60" : "bg-white/85 border-gray-300 text-gray-700 hover:bg-white"
                }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full border transition-all ${theme === "dark" ? "bg-black/40 border-white/10 text-yellow-400" : "bg-white/80 border-gray-300 text-amber-600"
              }`}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="w-full max-w-4xl mx-auto px-4 flex items-center gap-3 relative z-10">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="h-16 w-16 rounded-2xl border-2 border-white/20 object-cover shadow-xl shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shrink-0">
              🍽️
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white drop-shadow-sm">{restaurant.name}</h1>
            {restaurant.branchName && (
              <p className="text-gray-800 text-xs font-bold mt-0.5 drop-shadow-sm">
                {restaurant.branchName}
              </p>
            )}
            {tableDetails ? (
              <p className="text-amber-900 text-xs font-black mt-1 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
                Table {tableDetails.table_number}
              </p>
            ) : tableId ? (
              <p className="text-amber-900 text-xs font-black mt-1 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
                Table {tableId.slice(0, 4).toUpperCase()}
              </p>
            ) : null}
          </div>
        </div>

        <svg
          className="absolute bottom-0 left-0 w-full z-10"
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          style={{ height: 16 }}
        >
          <path d="M0,40 C480,0 960,0 1440,40 L1440,40 L0,40 Z" fill={theme === "dark" ? "#0c0c0c" : "#f8f9fa"} />
        </svg>
      </div>

      <div className={`sticky top-0 z-20 ${themeBg} pt-3 pb-2 border-b ${themeBorder}`}>
        <div className="flex gap-4 overflow-x-auto px-4 scrollbar-none pb-1">
          {parentCategories.map(pc => {
            const isActive = activeParentId === pc.id
            return (
              <button
                key={pc.id}
                onClick={() => setActiveParentId(pc.id)}
                className="shrink-0 flex flex-col items-center outline-none group"
              >
                <span className={`text-[14px] font-black truncate w-16 text-center leading-tight transition-colors ${isActive ? "text-foreground bg-background" : `${theme === "dark" ? "text-neutral-400" : "text-gray-400"}`
                  }`}>
                  {pc.name}
                </span>
              </button>
            )
          })}
          {parentCategories.length === 0 && (
            <p className="text-xs text-gray-400 py-3">No categories yet.</p>
          )}
        </div>
      </div>
    </>
  )
}
