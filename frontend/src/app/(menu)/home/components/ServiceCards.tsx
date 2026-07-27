"use client"
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"

interface ServiceCardProps {
  onDelivery: () => void
  onDineIn: () => void
  onServiceSelect: (id: string) => void
  showToast: (msg: string, icon?: string) => void
  activeRestaurant: { name: string } | null
  theme: "dark" | "light"
  themeTextMuted: string
  themeTextTitle: string
}

const SERVICES = [
  { id: "takeaway", icon: "🛍️", label: "Takeaway" },
  { id: "inroom", icon: "🛌", label: "In-Room Dining", comingSoon: true, msg: "In-Room Dining is coming soon!", toastIcon: "🏨" },
  { id: "reserve", icon: "📅", label: "Reservations", comingSoon: true, msg: "Reservations are coming soon!", toastIcon: "📅" },
  { id: "book", icon: "🏨", label: "Hotel Stay", comingSoon: true, msg: "Hotel booking is coming soon!", toastIcon: "🏨" },
]

export default function ServiceCards({
  onDelivery, onDineIn, onServiceSelect, showToast, activeRestaurant, theme, themeTextMuted, themeTextTitle,
}: ServiceCardProps) {
  const cardClass = theme === "dark"
    ? "bg-[#1c1c1e] border-white/[0.08] hover:border-amber-500/30"
    : "bg-white border-gray-100 hover:shadow-lg"

  return (
    <div className="flex flex-col gap-5">
      {/* Primary cards */}
      <div className="grid grid-cols-2 gap-3.5">
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.96 }}
          onClick={onDelivery}
          className={`relative overflow-hidden rounded-3xl p-4 flex flex-col items-center gap-3 cursor-pointer border text-center transition-all ${cardClass}`}
        >
          <div className="w-full h-24 rounded-2xl overflow-hidden relative group">
            <img
              src="https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=500&q=80"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              alt="Delivery"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute top-2 left-2 bg-[#DA291C] text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow">Fast Delivery</span>
          </div>
          <div>
            <h4 className={`font-black text-sm ${themeTextTitle}`}>Delivery</h4>
            <p className={`text-[10px] ${themeTextMuted} font-medium`}>Fast direct to door</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.96 }}
          onClick={onDineIn}
          className={`relative overflow-hidden rounded-3xl p-4 flex flex-col items-center gap-3 cursor-pointer border text-center transition-all ${cardClass}`}
        >
          <div className="w-full h-24 rounded-2xl overflow-hidden relative group">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              alt="Dine-In"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute top-2 left-2 bg-[#FFC72C] text-black text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow">Eat In Restaurant</span>
          </div>
          <div>
            <h4 className={`font-black text-sm ${themeTextTitle}`}>Dine-In</h4>
            <p className={`text-[10px] ${themeTextMuted} font-medium`}>Instant table service</p>
          </div>
        </motion.div>
      </div>

      {/* Active restaurant banner */}
      <div className={`border rounded-2xl p-3 flex justify-between items-center ${
        theme === "dark" ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
      }`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-500">
          <MapPin className="w-4 h-4 text-[#FFC72C]" />
          <span className="truncate max-w-[220px]">
            {activeRestaurant ? `Ordering from: ${activeRestaurant.name}` : "No restaurant selected"}
          </span>
        </div>
        <button onClick={onDineIn} className="text-[10px] font-black uppercase text-amber-500 hover:text-amber-400 ml-2">
          {activeRestaurant ? "Switch" : "Select"}
        </button>
      </div>

      {/* Other services grid */}
      <div className="flex flex-col gap-2">
        <h3 className={`text-[10px] font-extrabold uppercase tracking-wider ${themeTextMuted}`}>Other Services</h3>
        <div className="grid grid-cols-4 gap-2">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              onClick={() => {
                if (service.comingSoon) showToast(service.msg!, service.toastIcon)
                else onServiceSelect(service.id)
              }}
              className={`border rounded-2xl p-2.5 flex flex-col items-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                theme === "dark" ? "bg-[#1c1c1e] border-white/[0.08] hover:bg-neutral-800" : "bg-white border-gray-100 hover:shadow-md"
              } ${service.comingSoon ? "opacity-55" : ""}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${theme === "dark" ? "bg-white/5" : "bg-gray-50"}`}>
                {service.icon}
              </div>
              <span className={`text-[9px] font-black leading-tight ${themeTextTitle}`}>{service.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
