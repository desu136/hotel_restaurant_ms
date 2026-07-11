"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Settings,
  Calendar,
  Layers,
  Percent,
  Copy,
  Gift,
  HelpCircle,
  Clock,
  MapPin,
  Utensils
} from "lucide-react"

// Types match backend structure
interface ComboItemInput {
  menu_item_id: string;
  quantity: number;
}

interface EligibilityRules {
  min_order_amount?: number;
  specific_menu_items?: string[];
  specific_categories?: string[];
  order_types?: string[];
  buy_item_id?: string;
  buy_quantity?: number;
  combo_items?: ComboItemInput[];
}

interface RewardConfig {
  discount_value?: number;
  max_discount_amount?: number;
  target_item_id?: string;
  target_quantity?: number;
  combo_price?: number;
}

interface ScheduleConfig {
  valid_days?: number[];
  start_time?: string;
  end_time?: string;
  season_name?: string;
}

export default function CreatePromotionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const promoId = searchParams.get("id")
  const duplicateId = searchParams.get("duplicate")

  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // Lookups/Dependencies
  const [categories, setCategories] = React.useState<any[]>([])
  const [menuItems, setMenuItems] = React.useState<any[]>([])
  const [restaurants, setRestaurants] = React.useState<any[]>([])

  // Form Wizard Step
  const [currentStep, setCurrentStep] = React.useState<number>(1)

  // Step 1: Basic Information & Schedule
  const [title, setTitle] = React.useState("")
  const [code, setCode] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [bannerUrl, setBannerUrl] = React.useState("")
  const [termsConditions, setTermsConditions] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)
  const [status, setStatus] = React.useState("ACTIVE")
  const [startDate, setStartDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = React.useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))

  // Step 2: Promotion Type & Eligibility
  const [promoType, setPromoType] = React.useState<string>("FIRST_ORDER")
  const [restaurantId, setRestaurantId] = React.useState("")
  const [branchId, setBranchId] = React.useState("")
  const [allowedOrderTypes, setAllowedOrderTypes] = React.useState<string[]>(["DINE_IN", "TAKEAWAY", "DELIVERY"])
  
  // Dynamic eligibility fields
  const [minOrderAmount, setMinOrderAmount] = React.useState<number>(0)
  const [seasonName, setSeasonName] = React.useState("")
  const [validDays, setValidDays] = React.useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [buyItemId, setBuyItemId] = React.useState("")
  const [buyQuantity, setBuyQuantity] = React.useState<number>(1)
  const [comboItems, setComboItems] = React.useState<ComboItemInput[]>([
    { menu_item_id: "", quantity: 1 }
  ])
  const [categoryId, setCategoryId] = React.useState("")
  const [menuItemId, setMenuItemId] = React.useState("")

  // Step 3: Reward Configuration
  const [rewardType, setRewardType] = React.useState<string>("PERCENTAGE_DISCOUNT")
  const [discountValue, setDiscountValue] = React.useState<number>(0)
  const [maxDiscountAmount, setMaxDiscountAmount] = React.useState<number>(0)
  const [targetItemId, setTargetItemId] = React.useState("")
  const [targetQuantity, setTargetQuantity] = React.useState<number>(1)
  const [comboPrice, setComboPrice] = React.useState<number>(0)

  // Fetch Lookups
  React.useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [catRes, menuRes, restRes] = await Promise.all([
          fetch("/api/restaurant/categories"),
          fetch("/api/restaurant/menu"),
          fetch("/api/restaurant/list")
        ])
        if (catRes.ok) setCategories(await catRes.json())
        if (menuRes.ok) setMenuItems(await menuRes.json())
        if (restRes.ok) setRestaurants(await restRes.json())
      } catch (e) {
        console.error("Failed to load lookups", e)
      }
    }
    fetchDependencies()
  }, [])

  // Fetch Promotion data if editing/duplicating
  React.useEffect(() => {
    const activeId = promoId || duplicateId
    if (!activeId) return

    const fetchPromotion = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/promotions`)
        if (res.ok) {
          const data = await res.json()
          const p = data.promotions?.find((item: any) => item.id === activeId)
          if (p) {
            setTitle(duplicateId ? `${p.title} (Copy)` : p.title)
            setDescription(p.description || "")
            setTermsConditions(p.terms_conditions || "")
            setCode(p.code || "")
            setBannerUrl(p.banner_url || "")
            setIsActive(p.is_active)
            setStatus(p.status || "ACTIVE")
            setStartDate(p.start_date ? p.start_date.slice(0, 10) : "")
            setEndDate(p.end_date ? p.end_date.slice(0, 10) : "")
            setRestaurantId(p.restaurant_id || "")
            setBranchId(p.branch_id || "")

            // Set promo type and reward type
            setPromoType(p.type || "FIRST_ORDER")
            setRewardType(p.reward_type || "PERCENTAGE_DISCOUNT")

            // Parse json rules
            const rules = p.eligibility_rules as EligibilityRules | null
            if (rules) {
              setMinOrderAmount(rules.min_order_amount || 0)
              setAllowedOrderTypes(rules.order_types || ["DINE_IN", "TAKEAWAY", "DELIVERY"])
              setBuyItemId(rules.buy_item_id || "")
              setBuyQuantity(rules.buy_quantity || 1)
              if (rules.combo_items && rules.combo_items.length > 0) {
                setComboItems(rules.combo_items)
              }
            }

            // Set specific IDs
            setCategoryId(p.category_id || "")
            setMenuItemId(p.menu_item_id || "")

            // Parse reward config
            const reward = p.reward_config as RewardConfig | null
            if (reward) {
              setDiscountValue(reward.discount_value || 0)
              setMaxDiscountAmount(reward.max_discount_amount || 0)
              setTargetItemId(reward.target_item_id || "")
              setTargetQuantity(reward.target_quantity || 1)
              setComboPrice(reward.combo_price || 0)
            }

            // Parse schedule config
            const schedule = p.schedule_config as ScheduleConfig | null
            if (schedule) {
              setValidDays(schedule.valid_days || [0,1,2,3,4,5,6])
              setStartTime(schedule.start_time || "")
              setEndTime(schedule.end_time || "")
              setSeasonName(schedule.season_name || "")
            }
          }
        }
      } catch (err) {
        console.error("Failed to load promotion for edit", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPromotion()
  }, [promoId, duplicateId])

  // Handles changing promotion type and sets intelligent defaults
  const handlePromoTypeChange = (type: string) => {
    setPromoType(type)
    
    // Automatically select default reward type for certain promotion types
    if (type === "FREE_DELIVERY") {
      setRewardType("FREE_DELIVERY")
    } else if (type === "BUY_X_GET_Y") {
      setRewardType("BOGO")
    } else if (type === "COMBO_OFFER") {
      setRewardType("COMBO_PRICE")
    } else if (rewardType === "FREE_DELIVERY") {
      setRewardType("PERCENTAGE_DISCOUNT")
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please fill out the title")
      return
    }

    setSaving(true)
    setError(null)

    // 1. Build Eligibility Rules
    const eligibility_rules: EligibilityRules = {}
    eligibility_rules.order_types = allowedOrderTypes

    if (promoType === "MINIMUM_SPEND" && minOrderAmount > 0) {
      eligibility_rules.min_order_amount = Number(minOrderAmount)
    }
    if (promoType === "BUY_X_GET_Y" && buyItemId) {
      eligibility_rules.buy_item_id = buyItemId
      eligibility_rules.buy_quantity = Number(buyQuantity)
    }
    if (promoType === "COMBO_OFFER") {
      eligibility_rules.combo_items = comboItems.filter(item => item.menu_item_id !== "")
    }

    // 2. Build Reward Config
    const reward_config: RewardConfig = {}
    if (rewardType === "PERCENTAGE_DISCOUNT" || rewardType === "FIXED_DISCOUNT" || rewardType === "FREE_DELIVERY") {
      reward_config.discount_value = Number(discountValue)
      if (rewardType === "PERCENTAGE_DISCOUNT" && maxDiscountAmount > 0) {
        reward_config.max_discount_amount = Number(maxDiscountAmount)
      }
    }
    if (rewardType === "FREE_ITEM" || rewardType === "FREE_DRINK" || rewardType === "BOGO") {
      reward_config.target_item_id = targetItemId
      reward_config.target_quantity = Number(targetQuantity)
    }
    if (rewardType === "COMBO_PRICE") {
      reward_config.combo_price = Number(comboPrice)
    }

    // 3. Build Schedule Config
    const schedule_config: ScheduleConfig = {}
    if (validDays.length < 7) {
      schedule_config.valid_days = validDays
    }
    if (startTime && endTime) {
      schedule_config.start_time = startTime
      schedule_config.end_time = endTime
    }
    if ((promoType === "SEASONAL_CAMPAIGN" || promoType === "HOLIDAY_CAMPAIGN") && seasonName) {
      schedule_config.season_name = seasonName
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      terms_conditions: termsConditions.trim() || null,
      code: code.trim() || null,
      banner_url: bannerUrl.trim() || null,
      is_active: isActive,
      status,
      start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      
      // Decoupled types
      type: promoType,
      reward_type: rewardType,
      
      scope: promoType === 'CATEGORY_PROMOTION' ? 'CATEGORY' : promoType === 'MENU_ITEM_PROMOTION' ? 'MENU_ITEM' : 'RESTAURANT',
      restaurant_id: restaurantId || null,
      branch_id: branchId || null,
      category_id: promoType === 'CATEGORY_PROMOTION' ? categoryId : null,
      menu_item_id: promoType === 'MENU_ITEM_PROMOTION' ? menuItemId : null,
      
      eligibility_rules,
      reward_config,
      schedule_config
    }

    try {
      const url = promoId ? `/api/promotions/${promoId}` : `/api/promotions`
      const method = promoId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to save promotion")
      }

      router.push("/dashboard/manager/promotions")
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.")
    } finally {
      setSaving(false)
    }
  }

  // Helper arrays/utilities
  const toggleDay = (day: number) => {
    if (validDays.includes(day)) {
      setValidDays(validDays.filter(d => d !== day))
    } else {
      setValidDays([...validDays, day])
    }
  }

  const toggleOrderType = (type: string) => {
    if (allowedOrderTypes.includes(type)) {
      setAllowedOrderTypes(allowedOrderTypes.filter(t => t !== type))
    } else {
      setAllowedOrderTypes([...allowedOrderTypes, type])
    }
  }

  const addComboItem = () => {
    setComboItems([...comboItems, { menu_item_id: "", quantity: 1 }])
  }

  const removeComboItem = (index: number) => {
    setComboItems(comboItems.filter((_, idx) => idx !== index))
  }

  const updateComboItem = (index: number, field: keyof ComboItemInput, value: any) => {
    const updated = [...comboItems]
    updated[index] = { ...updated[index], [field]: value }
    setComboItems(updated)
  }

  // Generates dynamic summary text in English
  const getPromoSummary = () => {
    let eligibilityText = ""
    let rewardText = ""

    // 1. Eligibility summary
    switch (promoType) {
      case "FIRST_ORDER":
        eligibilityText = "first-time customers on their very first order"
        break;
      case "NEW_CUSTOMER":
        eligibilityText = "new customers with 0 prior completed orders"
        break;
      case "RETURNING_CUSTOMER":
        eligibilityText = "returning customers who have ordered before"
        break;
      case "SEASONAL_CAMPAIGN":
        eligibilityText = `customers during the ${seasonName || "Seasonal"} promotion period`
        break;
      case "HOLIDAY_CAMPAIGN":
        eligibilityText = `customers during the ${seasonName || "Holiday"} campaign period`
        break;
      case "HAPPY_HOUR":
        const days = validDays.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")
        eligibilityText = `customers ordering on ${days || "selected days"} between ${startTime || "00:00"} and ${endTime || "00:00"}`
        break;
      case "WEEKEND_PROMOTION":
        eligibilityText = "customers placing orders on Saturdays or Sundays"
        break;
      case "BUY_X_GET_Y":
        const buyItemObj = menuItems.find(i => i.id === buyItemId)
        eligibilityText = `customers purchasing ${buyQuantity}x "${buyItemObj?.display_name || "selected item"}"`
        break;
      case "MINIMUM_SPEND":
        eligibilityText = `customers placing an order with a subtotal of at least $${minOrderAmount.toFixed(2)}`
        break;
      case "COMBO_OFFER":
        eligibilityText = "customers purchasing all the required items in the Combo package"
        break;
      case "CATEGORY_PROMOTION":
        const catObj = categories.find(c => c.id === categoryId)
        eligibilityText = `customers purchasing items from the "${catObj?.name || "selected category"}" category`
        break;
      case "MENU_ITEM_PROMOTION":
        const itemObj = menuItems.find(i => i.id === menuItemId)
        eligibilityText = `customers purchasing the item "${itemObj?.display_name || "selected item"}"`
        break;
      case "FREE_DELIVERY":
        eligibilityText = "customers placing a Delivery order"
        break;
      default:
        eligibilityText = "qualifying customers"
    }

    // 2. Reward summary
    switch (rewardType) {
      case "PERCENTAGE_DISCOUNT":
        rewardText = `receive a ${discountValue}% discount on their order`
        if (maxDiscountAmount > 0) rewardText += ` (capped at $${maxDiscountAmount})`
        break;
      case "FIXED_DISCOUNT":
        rewardText = `receive a flat $${discountValue.toFixed(2)} discount on their order`
        break;
      case "FREE_ITEM":
      case "FREE_DRINK":
        const rewardItemObj = menuItems.find(i => i.id === targetItemId)
        rewardText = `get ${targetQuantity}x "${rewardItemObj?.display_name || "free item"}" free of charge`
        break;
      case "FREE_DELIVERY":
        rewardText = "get 100% free delivery"
        break;
      case "BOGO":
        const bogoItemObj = menuItems.find(i => i.id === targetItemId)
        rewardText = `get a Buy-One-Get-One-Free (BOGO) deal on "${bogoItemObj?.display_name || "item"}"`
        break;
      case "COMBO_PRICE":
        rewardText = `get the entire package bundle at a special discount price of $${comboPrice.toFixed(2)}`
        break;
      default:
        rewardText = "receive a promotional discount"
    }

    return `This campaign will automatically apply to ${eligibilityText}. They will ${rewardText}.`
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const promotionTypes = [
    { value: "FIRST_ORDER", label: "First Order", group: "Customer Criteria", desc: "Applies only to a customer's first completed order." },
    { value: "NEW_CUSTOMER", label: "New Customer Sign-up", group: "Customer Criteria", desc: "Similar to first order, for new accounts." },
    { value: "RETURNING_CUSTOMER", label: "Returning Customer", group: "Customer Criteria", desc: "Reward customers for placing subsequent orders." },
    { value: "MINIMUM_SPEND", label: "Minimum Spend Threshold", group: "Cart Criteria", desc: "Applies when cart subtotal meets or exceeds a target value." },
    { value: "BUY_X_GET_Y", label: "Buy X Get Y", group: "Cart Criteria", desc: "Purchase item X to unlock item Y for free/discounted." },
    { value: "COMBO_OFFER", label: "Combo Offer Meal", group: "Cart Criteria", desc: "Set special package price when multiple specific items are bought." },
    { value: "CATEGORY_PROMOTION", label: "Category Discount", group: "Scope Criteria", desc: "Apply rewards specifically to a single menu category." },
    { value: "MENU_ITEM_PROMOTION", label: "Menu Item Specific", group: "Scope Criteria", desc: "Apply rewards specifically to a single menu item." },
    { value: "HAPPY_HOUR", label: "Happy Hour Timing", group: "Schedule Criteria", desc: "Applies only within recurring times and days of the week." },
    { value: "WEEKEND_PROMOTION", label: "Weekend Campaign", group: "Schedule Criteria", desc: "Applies automatically on Saturdays and Sundays." },
    { value: "SEASONAL_CAMPAIGN", label: "Seasonal Campaign", group: "Schedule Criteria", desc: "Active during configured season or holiday dates." },
    { value: "FREE_DELIVERY", label: "Free Delivery Run", group: "Channel Criteria", desc: "Applies automatically to delivery order channels." }
  ]

  const rewardTypes = [
    { value: "PERCENTAGE_DISCOUNT", label: "Percentage Discount (%)", desc: "Deduct a percentage from order total or specific item." },
    { value: "FIXED_DISCOUNT", label: "Fixed Cash Discount ($)", desc: "Deduct a flat dollar amount from order total." },
    { value: "FREE_ITEM", label: "Free Menu Item", desc: "Give a selected menu item fully free." },
    { value: "FREE_DRINK", label: "Free Complementary Drink", desc: "Give a beverage item fully free." },
    { value: "BOGO", label: "Buy One Get One (BOGO)", desc: "Buy 1 unit of a menu item, get another of the same item free." },
    { value: "COMBO_PRICE", label: "Special Combo Bundle Price", desc: "Set a special combined total price for combo items." },
    { value: "FREE_DELIVERY", label: "Free Delivery Coverage", desc: "Waive the delivery fee entirely." }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[var(--muted)]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/manager/promotions")}
            className="p-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--surface-border)] text-[var(--muted)] hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black">
              {promoId ? "Edit Promotion Campaign" : duplicateId ? "Duplicate Promotion" : "Create Promotion Campaign"}
            </h1>
            <p className="text-xs text-[var(--muted)] font-medium">Configure flexible, rule-based restaurant campaigns</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--surface-border)] overflow-x-auto gap-2 scrollbar-none">
        {[
          { num: 1, label: "Basic Info & Schedule", icon: <Calendar className="w-4 h-4" /> },
          { num: 2, label: "Campaign & Eligibility", icon: <Settings className="w-4 h-4" /> },
          { num: 3, label: "Reward Configuration", icon: <Percent className="w-4 h-4" /> },
          { num: 4, label: "Preview & Review", icon: <CheckCircle2 className="w-4 h-4" /> }
        ].map(step => (
          <button
            key={step.num}
            onClick={() => setCurrentStep(step.num)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              currentStep === step.num
                ? "border-[var(--color-primary-600)] text-[var(--color-primary-600)]"
                : "border-transparent text-[var(--muted)] hover:text-white"
            }`}
          >
            {step.icon}
            {step.label}
          </button>
        ))}
      </div>

      {/* Steps Content */}
      <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl p-6 flex flex-col gap-6">
        
        {/* Step 1: Basic Info & Schedule */}
        {currentStep === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Promotion Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Happy Hour Draft Special"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--color-primary-600)] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Custom Coupon Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. HH15OFF"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--color-primary-600)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Short Description</label>
              <textarea
                placeholder="Give customers a brief explanation of how to qualify..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--color-primary-600)] transition-all resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary-600)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Banner Image URL</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/... or any static URL"
                value={bannerUrl}
                onChange={e => setBannerUrl(e.target.value)}
                className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--color-primary-600)] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Terms & Conditions</label>
              <textarea
                placeholder="e.g. Cannot be combined with other offers. One per table..."
                value={termsConditions}
                onChange={e => setTermsConditions(e.target.value)}
                rows={2}
                className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--color-primary-600)] transition-all resize-none"
              />
            </div>

            <div className="flex gap-6 border-t border-[var(--surface-border)] pt-4 mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded border-[var(--surface-border)] bg-[var(--surface-hover)] focus:ring-[var(--color-primary-600)]"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-white cursor-pointer select-none">Active Campaign</label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--muted)]">Status:</span>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-xs font-bold px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Campaign & Eligibility */}
        {currentStep === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
            
            {/* Promotion Type Selector */}
            <div>
              <label className="block text-xs font-black uppercase text-[var(--muted)] mb-3">Select Campaign Type</label>
              <div className="grid gap-3 sm:grid-cols-2 max-h-[360px] overflow-y-auto pr-1 border border-[var(--surface-border)] rounded-xl p-3 bg-[var(--surface-hover)]/30">
                {promotionTypes.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handlePromoTypeChange(t.value)}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                      promoType === t.value
                        ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)]/5"
                        : "border-[var(--surface-border)] bg-[var(--surface-hover)] hover:border-[var(--surface-border)]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs">{t.label}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--muted)] font-black">{t.group}</span>
                    </div>
                    <span className="text-[10px] text-[var(--muted)] mt-1.5 leading-relaxed">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* DYNAMIC CONFIGURATION FIELDS BASED ON PROMOTION TYPE */}
            <div className="border-t border-[var(--surface-border)] pt-5">
              <h3 className="text-sm font-bold mb-3 text-white flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-[var(--color-primary-600)]" />
                Campaign Specific Settings
              </h3>

              {/* FIRST_ORDER / NEW_CUSTOMER / RETURNING_CUSTOMER / WEEKEND_PROMOTION */}
              {(promoType === "FIRST_ORDER" || promoType === "NEW_CUSTOMER" || promoType === "RETURNING_CUSTOMER" || promoType === "WEEKEND_PROMOTION") && (
                <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--surface-border)] text-xs text-[var(--muted)]">
                  ⚡ <strong>Automatic Logic:</strong> This promotion is automatically evaluated during cart checkout. You don't need to configure manual rules.
                  {promoType === "FIRST_ORDER" && " The system verifies that the customer has completed 0 previous orders."}
                  {promoType === "NEW_CUSTOMER" && " The system verifies that the customer's completed orders is 0."}
                  {promoType === "RETURNING_CUSTOMER" && " The system verifies that the customer's completed orders is greater than 0."}
                  {promoType === "WEEKEND_PROMOTION" && " The system checks if the current checkout day is Saturday or Sunday."}
                </div>
              )}

              {/* MINIMUM_SPEND */}
              {promoType === "MINIMUM_SPEND" && (
                <div className="flex flex-col gap-3">
                  <label className="block text-xs font-black uppercase text-[var(--muted)]">Minimum Cart Subtotal ($) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={minOrderAmount || ""}
                    onChange={e => setMinOrderAmount(Number(e.target.value))}
                    className="w-full max-w-xs bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                  />
                  <p className="text-[10px] text-[var(--muted)]">The promotion applies only when the customer's order subtotal meets this amount.</p>
                </div>
              )}

              {/* SEASONAL_CAMPAIGN or HOLIDAY_CAMPAIGN */}
              {(promoType === "SEASONAL_CAMPAIGN" || promoType === "HOLIDAY_CAMPAIGN") && (
                <div className="flex flex-col gap-3">
                  <label className="block text-xs font-black uppercase text-[var(--muted)]">Season / Holiday Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Christmas Cheer, Summer Splash"
                    value={seasonName}
                    onChange={e => setSeasonName(e.target.value)}
                    className="w-full max-w-sm bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                  />
                </div>
              )}

              {/* HAPPY_HOUR */}
              {promoType === "HAPPY_HOUR" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-[var(--muted)] mb-2">Recurring Days</label>
                    <div className="flex gap-2 flex-wrap">
                      {weekdays.map((day, idx) => {
                        const active = validDays.includes(idx)
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(idx)}
                            className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                              active
                                ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)]/15 text-white"
                                : "border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--muted)]"
                            }`}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Happy Hour Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Happy Hour End Time</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* BUY_X_GET_Y */}
              {promoType === "BUY_X_GET_Y" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Buy Menu Item X</label>
                    <select
                      value={buyItemId}
                      onChange={e => setBuyItemId(e.target.value)}
                      className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                    >
                      <option value="">-- Select Menu Item --</option>
                      {menuItems.map(item => (
                        <option key={item.id} value={item.id}>{item.display_name} (${item.price})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Required Buy Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={buyQuantity}
                      onChange={e => setBuyQuantity(Number(e.target.value))}
                      className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* COMBO_OFFER */}
              {promoType === "COMBO_OFFER" && (
                <div className="flex flex-col gap-3">
                  <label className="block text-xs font-black uppercase text-[var(--muted)]">Combo Bundle Menu Items</label>
                  <div className="flex flex-col gap-2.5">
                    {comboItems.map((combo, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          value={combo.menu_item_id}
                          onChange={e => updateComboItem(idx, "menu_item_id", e.target.value)}
                          className="flex-1 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                        >
                          <option value="">-- Choose Menu Item --</option>
                          {menuItems.map(item => (
                            <option key={item.id} value={item.id}>{item.display_name} (${item.price})</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          placeholder="Qty"
                          value={combo.quantity}
                          onChange={e => updateComboItem(idx, "quantity", Number(e.target.value))}
                          className="w-20 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                        />
                        {comboItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeComboItem(idx)}
                            className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all text-xs font-bold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addComboItem}
                    className="self-start mt-2 px-3 py-1.5 border border-dashed border-[var(--surface-border)] text-xs rounded-lg text-[var(--color-primary-600)] hover:bg-[var(--surface-hover)] transition-all font-bold"
                  >
                    + Add Bundle Item
                  </button>
                </div>
              )}

              {/* CATEGORY_PROMOTION */}
              {promoType === "CATEGORY_PROMOTION" && (
                <div className="flex flex-col gap-3">
                  <label className="block text-xs font-black uppercase text-[var(--muted)]">Applicable Category *</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full max-w-sm bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-[var(--muted)]">The reward applies only to items purchased from this category.</p>
                </div>
              )}

              {/* MENU_ITEM_PROMOTION */}
              {promoType === "MENU_ITEM_PROMOTION" && (
                <div className="flex flex-col gap-3">
                  <label className="block text-xs font-black uppercase text-[var(--muted)]">Applicable Menu Item *</label>
                  <select
                    value={menuItemId}
                    onChange={e => setMenuItemId(e.target.value)}
                    className="w-full max-w-sm bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                  >
                    <option value="">-- Choose Menu Item --</option>
                    {menuItems.map(item => (
                      <option key={item.id} value={item.id}>{item.display_name} (${item.price})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* FREE_DELIVERY */}
              {promoType === "FREE_DELIVERY" && (
                <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--surface-border)] text-xs text-[var(--muted)]">
                  🚚 Automatically triggered only on Delivery orders. Delivery charges will be fully waived.
                </div>
              )}

            </div>

            {/* Scope / Restaurants */}
            <div className="border-t border-[var(--surface-border)] pt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Specific Restaurant Scope (Optional)</label>
                <select
                  value={restaurantId}
                  onChange={e => setRestaurantId(e.target.value)}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                >
                  <option value="">All Restaurants</option>
                  {restaurants.map(rest => (
                    <option key={rest.id} value={rest.id}>{rest.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-[var(--muted)] mb-2">Order Channels / Types</label>
                <div className="flex gap-2">
                  {["DINE_IN", "TAKEAWAY", "DELIVERY"].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleOrderType(type)}
                      className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        allowedOrderTypes.includes(type)
                          ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)]/15 text-white"
                          : "border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--muted)]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {/* Step 3: Reward Configuration */}
        {currentStep === 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
            
            {/* Reward Type Selection */}
            <div>
              <label className="block text-xs font-black uppercase text-[var(--muted)] mb-3">Select Customer Benefit (Reward Type)</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {rewardTypes.map(t => {
                  // Disable choices that don't match the selected campaign logic
                  const isFreeDeliveryOnly = promoType === "FREE_DELIVERY"
                  const isDisabled = (isFreeDeliveryOnly && t.value !== "FREE_DELIVERY") || (!isFreeDeliveryOnly && t.value === "FREE_DELIVERY")
                  
                  return (
                    <button
                      key={t.value}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setRewardType(t.value)}
                      className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                        rewardType === t.value
                          ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)]/5"
                          : "border-[var(--surface-border)] bg-[var(--surface-hover)] hover:border-[var(--surface-border)]"
                      } ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}`}
                    >
                      <span className="font-bold text-xs">{t.label}</span>
                      <span className="text-[10px] text-[var(--muted)] mt-1.5 leading-relaxed">{t.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* DYNAMIC REWARD CONFIGURATION INPUTS */}
            <div className="border-t border-[var(--surface-border)] pt-5">
              <h3 className="text-sm font-bold mb-3 text-white flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-[var(--color-primary-600)]" />
                Benefit Parameters
              </h3>

              {/* PERCENTAGE_DISCOUNT */}
              {rewardType === "PERCENTAGE_DISCOUNT" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Discount Percentage (%) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 15"
                      value={discountValue || ""}
                      onChange={e => setDiscountValue(Number(e.target.value))}
                      className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Maximum Discount Cap ($) (0 for Unlimited)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15"
                      value={maxDiscountAmount || ""}
                      onChange={e => setMaxDiscountAmount(Number(e.target.value))}
                      className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* FIXED_DISCOUNT */}
              {rewardType === "FIXED_DISCOUNT" && (
                <div>
                  <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Discount Amount ($) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={discountValue || ""}
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    className="w-full max-w-xs bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                  />
                </div>
              )}

              {/* FREE_ITEM or FREE_DRINK */}
              {(rewardType === "FREE_ITEM" || rewardType === "FREE_DRINK") && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Free Menu Item</label>
                    <select
                      value={targetItemId}
                      onChange={e => setTargetItemId(e.target.value)}
                      className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                    >
                      <option value="">-- Choose Menu Item --</option>
                      {menuItems.map(item => (
                        <option key={item.id} value={item.id}>{item.display_name} (${item.price})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Quantity Offered Free</label>
                    <input
                      type="number"
                      min={1}
                      value={targetQuantity}
                      onChange={e => setTargetQuantity(Number(e.target.value))}
                      className="w-full bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* BOGO */}
              {rewardType === "BOGO" && (
                <div className="flex flex-col gap-3">
                  <label className="block text-xs font-black uppercase text-[var(--muted)]">Target BOGO Menu Item</label>
                  <select
                    value={targetItemId}
                    onChange={e => setTargetItemId(e.target.value)}
                    className="w-full max-w-md bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                  >
                    <option value="">-- Choose Menu Item --</option>
                    {menuItems.map(item => (
                      <option key={item.id} value={item.id}>{item.display_name} (${item.price})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                    💡 If a customer places 2 of this item in their cart, the system automatically subtracts the price of one of them.
                  </p>
                </div>
              )}

              {/* COMBO_PRICE */}
              {rewardType === "COMBO_PRICE" && (
                <div>
                  <label className="block text-xs font-black uppercase text-[var(--muted)] mb-1.5">Special Combo Bundle Total Price ($) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 29.99"
                    value={comboPrice || ""}
                    onChange={e => setComboPrice(Number(e.target.value))}
                    className="w-full max-w-xs bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm focus:outline-none"
                  />
                </div>
              )}

              {/* FREE_DELIVERY */}
              {rewardType === "FREE_DELIVERY" && (
                <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--surface-border)] text-xs text-[var(--muted)]">
                  🛵 Waives 100% of delivery charge. No additional discount amount parameters needed.
                </div>
              )}

            </div>
          </motion.div>
        )}

        {/* Step 4: Preview & Review */}
        {currentStep === 4 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
            
            <div className="p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--surface-border)] flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-[var(--color-primary-600)]" />
                Live Campaign Summary
              </h3>

              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] text-sm font-medium leading-relaxed text-white">
                "{getPromoSummary()}"
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Technical breakdown */}
              <div className="p-4 border border-[var(--surface-border)] rounded-xl flex flex-col gap-2 bg-[var(--surface-hover)]/30">
                <span className="text-[10px] font-black uppercase text-[var(--muted)]">Rule Configurations</span>
                <div className="flex flex-col gap-1.5 text-xs text-white">
                  <div className="flex justify-between border-b border-[var(--surface-border)]/50 pb-1">
                    <span className="text-[var(--muted)]">Campaign Type:</span>
                    <span className="font-bold">{promoType}</span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--surface-border)]/50 pb-1">
                    <span className="text-[var(--muted)]">Benefit Reward:</span>
                    <span className="font-bold">{rewardType}</span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--surface-border)]/50 pb-1">
                    <span className="text-[var(--muted)]">Start Date:</span>
                    <span>{startDate}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-[var(--muted)]">End Date:</span>
                    <span>{endDate}</span>
                  </div>
                </div>
              </div>

              {/* Review Check */}
              <div className="p-4 border border-[var(--surface-border)] rounded-xl flex flex-col gap-2 bg-[var(--surface-hover)]/30">
                <span className="text-[10px] font-black uppercase text-[var(--muted)]">Visibility & Status</span>
                <div className="flex flex-col gap-1.5 text-xs text-white">
                  <div className="flex justify-between border-b border-[var(--surface-border)]/50 pb-1">
                    <span className="text-[var(--muted)]">State:</span>
                    <span className="font-bold text-[var(--color-primary-600)]">{status}</span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--surface-border)]/50 pb-1">
                    <span className="text(--muted)">Enabled:</span>
                    <span>{isActive ? "YES" : "NO"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--surface-border)]/50 pb-1">
                    <span className="text-[var(--muted)]">Scope Level:</span>
                    <span>{promoType === 'CATEGORY_PROMOTION' ? 'CATEGORY' : promoType === 'MENU_ITEM_PROMOTION' ? 'MENU_ITEM' : 'RESTAURANT'}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-[var(--muted)]">Coupon Code:</span>
                    <span>{code || "Automatic (No code)"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border border-[var(--surface-border)] rounded-xl bg-blue-500/5 text-blue-400 text-xs leading-relaxed">
              💡 <strong>Ready to Publish:</strong> Once saved, this promotion will instantly become active for the public customer checkout evaluations when meeting the conditions.
            </div>

          </motion.div>
        )}

      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between border-t border-[var(--surface-border)] pt-4 mt-2">
        <button
          type="button"
          onClick={() => {
            if (currentStep > 1) {
              setCurrentStep(currentStep - 1)
            } else {
              router.push("/dashboard/manager/promotions")
            }
          }}
          className="px-5 py-3 rounded-xl border border-[var(--surface-border)] text-xs font-bold hover:bg-[var(--surface-hover)] transition-all"
        >
          {currentStep === 1 ? "Cancel" : "Back"}
        </button>

        <div className="flex gap-2">
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-5 py-3 rounded-xl bg-[var(--color-primary-600)] text-white text-xs font-black hover:opacity-90 transition-all"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-5 py-3 rounded-xl bg-[var(--color-primary-600)] text-white text-xs font-black flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Launch Campaign</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
