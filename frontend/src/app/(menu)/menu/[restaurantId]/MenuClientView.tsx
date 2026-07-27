"use client"
import * as React from "react"
import { AlertCircle, Store, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import PaymentScreen from "./PaymentScreen"
import { useMenuState } from "./components/useMenuState"
import MenuHeaderBanner from "./components/MenuHeaderBanner"
import CategorySidebar from "./components/CategorySidebar"
import MenuList from "./components/MenuList"
import CartView from "./components/CartView"
import ItemDetailModal from "./components/ItemDetailModal"
import FloatingCartBar from "./components/FloatingCartBar"
import RestaurantPickerSheet from "./components/RestaurantPickerSheet"

export default function MenuClientView() {
  const m = useMenuState()

  if (m.loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${m.theme === "dark" ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs opacity-75">Loading Menu...</p>
        </div>
      </div>
    )
  }

  if (!m.restaurant) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${m.theme === "dark" ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center space-y-2">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-lg font-semibold">Restaurant not found.</p>
        </div>
      </div>
    )
  }

  const themeBg = m.theme === "dark" ? "bg-[#0c0c0c] text-white" : "bg-[#f8f9fa] text-gray-900"
  const themeSidebar = m.theme === "dark" ? "bg-[#141414] border-white/[0.06]" : "bg-gray-50 border-gray-200"
  const themeCard = m.theme === "dark" ? "bg-[#1c1c1e] border-white/[0.08]" : "bg-white border-gray-200 shadow-sm"
  const themeTextMuted = m.theme === "dark" ? "text-neutral-400" : "text-gray-500"
  const themeTextTitle = m.theme === "dark" ? "text-white" : "text-gray-900"
  const themeBorder = m.theme === "dark" ? "border-white/[0.08]" : "border-gray-200"

  return (
    <div className={`h-screen ${themeBg} font-sans overflow-hidden flex flex-col pb-9 relative transition-colors duration-200`}>
      {m.switching && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none">
          <div className={`flex flex-col items-center gap-2.5 px-6 py-4 rounded-2xl shadow-2xl ${m.theme === "dark" ? "bg-black/70 text-white" : "bg-white/80 text-gray-900"} backdrop-blur-sm border ${m.theme === "dark" ? "border-white/10" : "border-gray-200"}`}>
            <div className="w-6 h-6 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[11px] font-bold opacity-75">Switching restaurant…</p>
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${m.popupVisible ? "blur-[3.5px] brightness-90 pointer-events-none select-none" : ""}`}>
        {m.showPayment && (
          <PaymentScreen
            theme={m.theme} total={m.cartFinalTotal} subtotal={m.cartTotal} discountAmount={m.promoDiscount}
            promotionTitle={m.promoEvaluation.promotion_title} promotionId={m.promoEvaluation.promotion_id}
            restaurantId={m.activeRestaurantId} branchId={m.activeBranchId} tableId={m.tableId}
            cartPayload={m.cartPayload} orderNotes={m.orderNotes} orderType={m.orderType}
            deliveryAddress={m.deliveryAddress} miniAppUser={m.miniAppUser}
            onBack={() => m.setShowPayment(false)}
            onSuccess={() => {
              m.setShowPayment(false); m.setCart([]); m.setOrderNotes(""); m.setDeliveryAddress(""); m.setActiveTab("history"); m.loadOrderHistory(m.miniAppUser)
            }}
          />
        )}

        {m.activeTab === "home" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <MenuHeaderBanner
              restaurant={m.restaurant} tableDetails={m.tableDetails} tableId={m.tableId} theme={m.theme}
              toggleTheme={m.toggleTheme} onBack={() => m.router.push("/home")} parentCategories={m.parentCategories}
              activeParentId={m.activeParentId} setActiveParentId={m.setActiveParentId} themeBg={themeBg} themeBorder={themeBorder}
            />
            <div className="flex-1 flex min-h-0 overflow-hidden">
              <CategorySidebar
                parentCategories={m.parentCategories} filteredSubCategories={m.filteredSubCategories}
                activeSubCategory={m.activeSubCategory} scrollToSubCategory={m.scrollToSubCategory}
                themeSidebar={themeSidebar} themeBorder={themeBorder} themeTextMuted={themeTextMuted} theme={m.theme}
              />
              <MenuList
                menuListRef={m.menuListRef} filteredMenuItems={m.filteredMenuItems} activeParentId={m.activeParentId}
                categories={m.categories} filteredSubCategories={m.filteredSubCategories} cart={m.cart}
                openItemDetail={m.openItemDetail} addToCartDirectly={m.addToCartDirectly} updateCartQty={m.updateCartQty}
                themeCard={themeCard} themeBorder={themeBorder} themeTextTitle={themeTextTitle} themeTextMuted={themeTextMuted} theme={m.theme}
              />
            </div>
          </div>
        )}

        {m.activeTab === "cart" && (
          <CartView
            cart={m.cart} tableId={m.tableId} orderType={m.orderType} setOrderType={m.setOrderType}
            deliveryAddress={m.deliveryAddress} setDeliveryAddress={m.setDeliveryAddress} orderNotes={m.orderNotes}
            setOrderNotes={m.setOrderNotes} promoEvaluation={m.promoEvaluation} promoDiscount={m.promoDiscount}
            cartTotal={m.cartTotal} cartFinalTotal={m.cartFinalTotal} updateCartQty={m.updateCartQty}
            getCustomizedItemPrice={m.getCustomizedItemPrice} setActiveTab={m.setActiveTab} themeCard={themeCard}
            themeBorder={themeBorder} themeTextTitle={themeTextTitle} themeTextMuted={themeTextMuted} theme={m.theme}
          />
        )}

        {m.selectedItem && (
          <ItemDetailModal
            selectedItem={m.selectedItem} setSelectedItem={m.setSelectedItem} categories={m.categories}
            selectedCustomizationBadges={m.selectedCustomizationBadges} itemCustomizations={m.itemCustomizations}
            setItemCustomizations={m.setItemCustomizations} itemNotes={m.itemNotes} setItemNotes={m.setItemNotes}
            addToCartFromDetail={m.addToCartFromDetail}
            getCustomizedItemPrice={m.getCustomizedItemPrice} themeCard={themeCard} themeBorder={themeBorder} theme={m.theme}
            cart={m.cart} updateCartQty={m.updateCartQty}
          />
        )}

        {m.cart.length > 0 && !m.showPayment && (
          <FloatingCartBar
            cartCount={m.cartCount} promoDiscount={m.promoDiscount} cartFinalTotal={m.cartFinalTotal}
            cartTotal={m.cartTotal} activeTab={m.activeTab}
            onAction={() => { if (m.activeTab === "home") m.setActiveTab("cart"); else if (m.activeTab === "cart") m.setShowPayment(true) }}
          />
        )}
      </div>

      <AnimatePresence>
        {!m.tableId && !m.popupVisible && m.activeTab === "home" && (
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            onClick={() => m.setPopupVisible(true)}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#FFC72C] hover:bg-yellow-400 text-black font-black shadow-xl rounded-full px-8 py-2.5 flex items-center gap-2 text-xs transition-all active:scale-95"
          >
            <Store className="w-3.5 h-3.5" /> Change Restaurant <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>

      <RestaurantPickerSheet
        popupVisible={m.popupVisible} setPopupVisible={m.setPopupVisible} restaurantsList={m.restaurantsList}
        activeRestaurantId={m.activeRestaurantId} activeBranchId={m.activeBranchId} loadRestaurantData={m.loadRestaurantData}
        setCart={m.setCart} setOrderNotes={m.setOrderNotes} setActiveTab={m.setActiveTab} themeCard={themeCard}
        themeBorder={themeBorder} themeTextTitle={themeTextTitle} themeTextMuted={themeTextMuted} theme={m.theme}
      />
    </div>
  )
}
