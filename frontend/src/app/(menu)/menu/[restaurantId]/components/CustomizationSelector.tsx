"use client"
import * as React from "react"
import { Check } from "lucide-react"
import { Customization } from "./types"

interface Props {
  customizations: Customization[]
  itemCustomizations: Record<string, string | string[]>
  setItemCustomizations: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>
  themeCard: string
  theme: "dark" | "light"
}

export default function CustomizationSelector({
  customizations,
  itemCustomizations,
  setItemCustomizations,
  themeCard,
  theme,
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Customizations</h3>
      {customizations.map((cust) => {
        const hasImages = cust.values.some((val) => typeof val !== "string" && val.image_url)

        return (
          <div key={cust.key} className={`space-y-3.5 ${themeCard} rounded-2xl p-4 border`}>
            <p className="text-xs font-bold flex items-center gap-1.5">
              <span>{cust.label}</span>
              {cust.multiple && (
                <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">
                  Multi-select
                </span>
              )}
            </p>

            {hasImages ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                {cust.values.map((val) => {
                  const valName = typeof val === "string" ? val : val.name
                  const valPrice = typeof val === "string" ? 0 : val.extraPrice
                  const valImg = typeof val === "string" ? null : val.image_url
                  const valRecommended = typeof val === "string" ? false : !!val.recommended

                  const selected = cust.multiple
                    ? ((itemCustomizations[cust.key] as string[]) || []).includes(valName)
                    : itemCustomizations[cust.key] === valName

                  return (
                    <button
                      key={valName}
                      type="button"
                      onClick={() => {
                        if (cust.multiple) {
                          const current = (itemCustomizations[cust.key] as string[]) || []
                          const updated = selected ? current.filter((v) => v !== valName) : [...current, valName]
                          setItemCustomizations((prev) => ({ ...prev, [cust.key]: updated }))
                        } else {
                          setItemCustomizations((prev) => ({ ...prev, [cust.key]: selected ? "" : valName }))
                        }
                      }}
                      className={`flex h-25 w-full flex-col rounded-xl overflow-hidden border text-left transition-all active:scale-[0.98] ${
                        selected
                          ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500"
                          : `${theme === "dark" ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-300"} hover:opacity-90`
                      }`}
                    >
                      <div className="h-18 w-full bg-gray-900 border-b border-white/5 relative flex items-center justify-center shrink-0">
                        {valImg ? (
                          <img src={valImg} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">🍽️</span>
                        )}
                        {selected && (
                          <div className="absolute top-1.5 right-1.5 bg-amber-500 text-black p-0.5 rounded-full shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        {!selected && valRecommended && (
                          <div className="absolute top-1.5 left-1.5 bg-amber-500 text-black text-[7px] font-black px-1 py-0.5 rounded shadow leading-none">
                            ✨ REC
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <span className={`text-[11px] font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-900"} line-clamp-2 leading-tight flex items-center gap-1`}>
                          {valRecommended && <span className="text-amber-500 shrink-0">✨</span>}
                          <span>{valName}</span>
                        </span>
                        <span className="text-[10px] text-amber-500 font-extrabold mt-1">
                          {valPrice > 0 ? `+$${valPrice.toFixed(2)}` : "Free"}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {cust.values.map((val) => {
                  const valName = typeof val === "string" ? val : val.name
                  const valPrice = typeof val === "string" ? 0 : val.extraPrice
                  const valRecommended = typeof val === "string" ? false : !!val.recommended
                  const selected = cust.multiple
                    ? ((itemCustomizations[cust.key] as string[]) || []).includes(valName)
                    : itemCustomizations[cust.key] === valName
                  return (
                    <button
                      key={valName}
                      type="button"
                      onClick={() => {
                        if (cust.multiple) {
                          const current = (itemCustomizations[cust.key] as string[]) || []
                          const updated = selected ? current.filter((v) => v !== valName) : [...current, valName]
                          setItemCustomizations((prev) => ({ ...prev, [cust.key]: updated }))
                        } else {
                          setItemCustomizations((prev) => ({ ...prev, [cust.key]: selected ? "" : valName }))
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                        selected
                          ? "bg-amber-500 border-amber-500 text-black shadow-md shadow-amber-500/10"
                          : `${theme === "dark" ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-300"} text-gray-300 hover:opacity-85`
                      }`}
                    >
                      {valRecommended && <span className="text-amber-500">✨</span>}
                      <span>{valName}</span>
                      <span className={`text-[9px] font-extrabold ${selected ? "text-black/80" : "text-amber-500"}`}>
                        {valPrice > 0 ? `(+$${valPrice.toFixed(2)})` : ""}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
