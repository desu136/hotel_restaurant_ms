"use client"
import { Home as HomeIcon, User } from "lucide-react"

interface Props {
  activeTab: "home" | "account"
  setActiveTab: (tab: "home" | "account") => void
  setView: (v: "home") => void
  theme: "dark" | "light"
  themeTextMuted: string
}

export default function BottomNav({ activeTab, setActiveTab, setView, theme, themeTextMuted }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div
        className={`w-full max-w-md border-t px-8 py-3.5 pb-6 flex justify-around items-center shadow-lg pointer-events-auto rounded-t-3xl ${
          theme === "dark" ? "bg-[#030712]/95 border-white/5 text-white" : "bg-white/95 border-gray-100 text-gray-900"
        }`}
        style={{ backdropFilter: "blur(12px)" }}
      >
        <div
          onClick={() => { setActiveTab("home"); setView("home") }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 ${
            activeTab === "home" ? "text-amber-500 scale-105 font-black" : themeTextMuted
          }`}
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-[9px] font-extrabold">Home</span>
        </div>
        <div
          onClick={() => setActiveTab("account")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 ${
            activeTab === "account" ? "text-amber-500 scale-105 font-black" : themeTextMuted
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-extrabold">MyOwn</span>
        </div>
      </div>
    </div>
  )
}
