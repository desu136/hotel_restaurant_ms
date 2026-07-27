"use client"
import { ChevronRight } from "lucide-react"
import { RESTAURANT_COORDINATES, calculateDistance } from "./types"

interface Branch {
  id: string
  name: string
  logo_url?: string | null
}

interface PickerBrand {
  id: string
  name: string
  logo_url?: string | null
  children?: Branch[]
}

interface Props {
  pickerBrand: PickerBrand | null
  setPickerBrand: (b: PickerBrand | null) => void
  onBranchSelect: (restaurantId: string, branchId?: string) => void
  userCoords: { latitude: number; longitude: number } | null
  theme: "dark" | "light"
  themeTextMuted: string
  themeTextTitle: string
}

export default function BranchPickerSheet({
  pickerBrand,
  setPickerBrand,
  onBranchSelect,
  userCoords,
  theme,
  themeTextMuted,
  themeTextTitle,
}: Props) {
  if (!pickerBrand) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ contain: "layout" }}>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setPickerBrand(null)}
      />
      <div className={`relative w-full max-w-md rounded-t-3xl shadow-2xl z-10 pb-safe overflow-hidden border-t ${
        theme === "dark" ? "bg-[#0b0f19] border-white/10" : "bg-white border-gray-200"
      }`}>
        <div className={`w-10 h-1 rounded-full mx-auto mt-3 mb-4 ${theme === "dark" ? "bg-white/10" : "bg-gray-200"}`} />
        <div className="px-5 pb-3">
          <div className="flex items-center gap-3">
            {pickerBrand.logo_url ? (
              <img src={pickerBrand.logo_url} className="w-10 h-10 rounded-xl object-cover" alt={pickerBrand.name} />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-extrabold text-sm border border-amber-500/10">
                {pickerBrand.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className={`font-black text-sm ${themeTextTitle}`}>{pickerBrand.name}</h3>
              <p className={`text-[10px] ${themeTextMuted}`}>Select a branch near you</p>
            </div>
          </div>
        </div>
        <div className={`h-px mx-5 ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`} />
        <div className="px-4 py-3 flex flex-col gap-2 max-h-80 overflow-y-auto">
          {(pickerBrand.children || []).map((branch) => {
            const branchCoords = RESTAURANT_COORDINATES[branch.name] || { latitude: 9.032, longitude: 38.742 }
            const branchDist = userCoords
              ? calculateDistance(userCoords.latitude, userCoords.longitude, branchCoords.latitude, branchCoords.longitude)
              : undefined
            return (
              <div
                key={branch.id}
                onClick={() => { setPickerBrand(null); onBranchSelect(pickerBrand.id, branch.id) }}
                className={`flex items-center justify-between border rounded-2xl px-4 py-3.5 cursor-pointer transition-all active:scale-[0.98] ${
                  theme === "dark"
                    ? "bg-white/5 border-white/5 hover:bg-amber-500/5 hover:border-amber-500/30"
                    : "bg-gray-50 border-gray-100 hover:bg-amber-50 hover:border-amber-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {branch.logo_url ? (
                    <img src={branch.logo_url} className="w-9 h-9 rounded-lg object-cover" alt={branch.name} />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-extrabold text-xs border border-amber-500/10">
                      {branch.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className={`text-xs font-bold ${themeTextTitle}`}>{branch.name}</p>
                    {branchDist !== undefined && (
                      <p className="text-[9px] text-amber-500 font-semibold mt-0.5">{branchDist} km away</p>
                    )}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${themeTextMuted}`} />
              </div>
            )
          })}
        </div>
        <div className="px-4 pb-6 pt-2">
          <button
            onClick={() => setPickerBrand(null)}
            className={`w-full py-3 rounded-2xl text-xs font-bold active:scale-95 transition-all ${
              theme === "dark" ? "bg-white/5 text-gray-300 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
