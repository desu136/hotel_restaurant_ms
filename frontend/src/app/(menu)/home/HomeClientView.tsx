"use client"
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useHomeState } from "./components/useHomeState"
import { HomeHeader } from "./components/HomeHeader"
import ServiceCards from "./components/ServiceCards"
import PromotionsSection from "./components/PromotionsSection"
import OutletsSection from "./components/OutletsSection"
import DeliveryForm from "./components/DeliveryForm"
import AccountTab from "./components/AccountTab"
import BranchPickerSheet from "./components/BranchPickerSheet"
import BottomNav from "./components/BottomNav"
import PromoModal from "./components/PromoModal"

export default function HomeClientView() {
  const s = useHomeState()

  const themeBg = s.theme === "dark" ? "bg-[#0c0c0c] text-white" : "bg-[#f8f9fa] text-gray-900"
  const themeCard = s.theme === "dark" ? "bg-[#1c1c1e] border-white/[0.08] text-white shadow-lg" : "bg-white border-gray-100 text-gray-900 shadow-md hover:shadow-lg transition-shadow duration-300"
  const themePanel = s.theme === "dark" ? "bg-[#1c1c1e] border-white/[0.08]" : "bg-white border-gray-100 shadow-lg"
  const themeTextMuted = s.theme === "dark" ? "text-neutral-400" : "text-gray-500"
  const themeTextTitle = s.theme === "dark" ? "text-white" : "text-gray-900"

  return (
    <div className={`min-h-screen font-sans pb-24 flex justify-center transition-colors duration-300 ${themeBg}`}>
      <div className="w-full max-w-md px-4 pt-4 flex flex-col gap-5 relative">

        {/* Toast */}
        <AnimatePresence>
          {s.toast.show && (
            <motion.div
              initial={{ opacity: 0, y: -50, x: "-50%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-6 left-1/2 -translate-x-1/2 shadow-xl rounded-2xl px-5 py-3.5 flex items-center gap-2.5 z-[9999] w-max max-w-[90%] border border-amber-500/20 backdrop-blur-md ${
                s.theme === "dark" ? "bg-gray-900/90 text-white" : "bg-white/90 text-gray-800"
              }`}
            >
              <span className="text-lg">{s.toast.icon}</span>
              <span className="text-xs font-black tracking-wide">{s.toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header (only on home view) */}
        {s.view === "home" && (
          <HomeHeader
            theme={s.theme}
            userProfile={s.userProfile}
            userCoords={s.userCoords}
            showSearch={s.showSearch}
            searchQuery={s.outletSearchQuery}
            onToggleSearch={() => { s.setShowSearch((v: boolean) => !v); if (s.showSearch) s.setOutletSearchQuery("") }}
            onSearchChange={(q: string) => s.setOutletSearchQuery(q)}
            onToggleTheme={() => {
              const next = s.theme === "dark" ? "light" : "dark"
              s.setTheme(next)
              localStorage.setItem("menu-theme", next)
            }}
            onOpenSettings={() => s.setShowSettings((v: boolean) => !v)}
          />
        )}

        {/* Connection Settings Panel */}
        {s.showSettings && (
          <div className={`border rounded-3xl p-5 flex flex-col gap-4 shadow-sm relative transition-all ${themePanel}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-[10px] font-extrabold uppercase tracking-wider ${themeTextMuted}`}>Hub Connections</h3>
              <button onClick={() => s.setShowSettings(false)} className={`p-1 rounded-full ${s.theme === "dark" ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-400"}`}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {[
              { label: "Server IP Address", placeholder: "e.g. 192.168.1.8", value: s.inputIp, onChange: s.setInputIp },
              { label: "Tenant ID Override", placeholder: "UUID (or blank for global)", value: s.inputTenantId, onChange: s.setInputTenantId },
            ].map(({ label, placeholder, value, onChange }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className={`text-[9px] font-bold uppercase tracking-wider ${themeTextMuted}`}>{label}</label>
                <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
                  className={`rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
                    s.theme === "dark" ? "bg-white/5 border-white/5 text-white" : "bg-gray-50 border-gray-100 text-gray-900"
                  }`} />
              </div>
            ))}
            <button onClick={s.applyConnectionSettings} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs py-3.5 rounded-xl shadow-md hover:from-amber-600 active:scale-98 transition-all text-center">
              Apply Connection Updates
            </button>
          </div>
        )}

        {/* HOME TAB */}
        {s.activeTab === "home" ? (
          <>
            {s.view === "home" && (
              <div className="flex flex-col gap-5">
                <ServiceCards
                  onDelivery={() => s.handleServiceSelect("delivery")}
                  onDineIn={() => s.handleServiceSelect("dine-in")}
                  onServiceSelect={s.handleServiceSelect}
                  showToast={s.showToast}
                  activeRestaurant={s.activeRestaurant}
                  theme={s.theme}
                  themeTextMuted={themeTextMuted}
                  themeTextTitle={themeTextTitle}
                />
                <PromotionsSection
                  promotions={s.promotions}
                  promoContainerRef={s.promoContainerRef}
                  activePromoIndex={s.activePromoIndex}
                  setActivePromoIndex={s.setActivePromoIndex}
                  handlePromoScroll={s.handlePromoScroll}
                  setSelectedPromo={s.setSelectedPromo}
                  theme={s.theme}
                  themeTextMuted={themeTextMuted}
                  themeTextTitle={themeTextTitle}
                />
                <OutletsSection
                  sortedRestaurants={s.sortedRestaurants}
                  outletSearchQuery={s.outletSearchQuery}
                  theme={s.theme}
                  themeCard={themeCard}
                  themeTextMuted={themeTextMuted}
                  themeTextTitle={themeTextTitle}
                  onBrandClick={(rest) => s.setPickerBrand(rest)}
                  onBranchSelect={s.handleBranchSelect}
                />
              </div>
            )}
            {s.view === "delivery-form" && (
              <DeliveryForm
                onBack={() => s.setView("home")}
                delivName={s.delivName} setDelivName={s.setDelivName}
                delivPhone={s.delivPhone} setDelivPhone={s.setDelivPhone}
                delivAddress={s.delivAddress} setDelivAddress={s.setDelivAddress}
                onSubmit={s.submitDeliveryAddress}
                theme={s.theme} themePanel={themePanel} themeTextMuted={themeTextMuted} themeTextTitle={themeTextTitle}
              />
            )}
          </>
        ) : (
          <AccountTab
            userProfile={s.userProfile}
            orderHistory={s.orderHistory}
            loadingHistory={s.loadingHistory}
            showToast={s.showToast}
            theme={s.theme}
            themeTextMuted={themeTextMuted}
            themeTextTitle={themeTextTitle}
          />
        )}

        {/* Branch Picker & Modals */}
        <BranchPickerSheet
          pickerBrand={s.pickerBrand}
          setPickerBrand={s.setPickerBrand}
          onBranchSelect={s.handleBranchSelect}
          userCoords={s.userCoords}
          theme={s.theme}
          themeTextMuted={themeTextMuted}
          themeTextTitle={themeTextTitle}
        />

        <BottomNav
          activeTab={s.activeTab}
          setActiveTab={s.setActiveTab}
          setView={s.setView}
          theme={s.theme}
          themeTextMuted={themeTextMuted}
        />

        <PromoModal
          selectedPromo={s.selectedPromo}
          setSelectedPromo={s.setSelectedPromo}
          activeRestaurant={s.activeRestaurant}
          sortedRestaurants={s.sortedRestaurants}
          selectedService={s.selectedService}
          theme={s.theme}
        />
      </div>
    </div>
  )
}
