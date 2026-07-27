"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, AlertTriangle, Settings, Calendar, Percent, CheckCircle2 } from "lucide-react"

import { PromoBasicScheduleStep } from "./components/PromoBasicScheduleStep"
import { PromoEligibilityStep, MenuItem, Category } from "./components/PromoEligibilityStep"
import { PromoRewardStep } from "./components/PromoRewardStep"
import { PromoPreviewStep } from "./components/PromoPreviewStep"
import { PROMOTION_TYPES, REWARD_TYPES, STEP_ITEMS } from "./components/promoOptions"

export default function CreatePromotionClientView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const promoId = searchParams.get("id")
  const duplicateId = searchParams.get("duplicate")

  const [currentStep, setCurrentStep] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [termsConditions, setTermsConditions] = React.useState("")
  const [code, setCode] = React.useState("")
  const [bannerUrl, setBannerUrl] = React.useState("")
  const [startDate, setStartDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = React.useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))

  const [promoType, setPromoType] = React.useState("FIRST_ORDER")
  const [minOrderAmount, setMinOrderAmount] = React.useState(0)
  const [allowedOrderTypes, setAllowedOrderTypes] = React.useState<string[]>(["DINE_IN", "TAKEAWAY", "DELIVERY"])
  const [categoryId, setCategoryId] = React.useState("")
  const [menuItemId, setMenuItemId] = React.useState("")
  const [buyItemId, setBuyItemId] = React.useState("")
  const [buyQuantity, setBuyQuantity] = React.useState(1)

  const [rewardType, setRewardType] = React.useState("PERCENTAGE_DISCOUNT")
  const [discountValue, setDiscountValue] = React.useState(10)
  const [maxDiscountAmount, setMaxDiscountAmount] = React.useState(0)
  const [targetItemId, setTargetItemId] = React.useState("")
  const [targetQuantity, setTargetQuantity] = React.useState(1)
  const [comboPrice, setComboPrice] = React.useState(0)

  const [isActive, setIsActive] = React.useState(true)
  const [status, setStatus] = React.useState("ACTIVE")

  const [categories, setCategories] = React.useState<Category[]>([])
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([])

  React.useEffect(() => {
    Promise.all([fetch("/api/categories"), fetch("/api/menu-items")]).then(async ([cRes, mRes]) => {
      if (cRes.ok) setCategories((await cRes.json()).categories || [])
      if (mRes.ok) setMenuItems((await mRes.json()).menuItems || [])
    }).catch(console.error)
  }, [])

  React.useEffect(() => {
    const activeId = promoId || duplicateId
    if (!activeId) return
    setLoading(true)
    fetch(`/api/promotions`).then(res => res.json()).then(data => {
      const p = data.promotions?.find((i: any) => i.id === activeId)
      if (p) {
        setTitle(duplicateId ? `${p.title} (Copy)` : p.title)
        setDescription(p.description || "")
        setCode(p.code || "")
        setBannerUrl(p.banner_url || "")
        setIsActive(p.is_active)
        setStatus(p.status || "ACTIVE")
        if (p.start_date) setStartDate(p.start_date.slice(0, 10))
        if (p.end_date) setEndDate(p.end_date.slice(0, 10))
        setPromoType(p.type || "FIRST_ORDER")
        setRewardType(p.reward_type || "PERCENTAGE_DISCOUNT")
      }
    }).finally(() => setLoading(false))
  }, [promoId, duplicateId])

  const handleSave = async () => {
    if (!title.trim()) { setError("Promotion Title is required."); setCurrentStep(1); return }
    setSubmitting(true)
    setError(null)
    let displayVal = rewardType === 'PERCENTAGE_DISCOUNT' ? `${discountValue}% OFF` : rewardType === 'FIXED_DISCOUNT' ? `-$${discountValue.toFixed(2)}` : 'Free Delivery'
    const payload = {
      title: title.trim(), description: description.trim() || null, terms_conditions: termsConditions.trim() || null,
      code: code.trim() || null, banner_url: bannerUrl.trim() || null, discount_value: displayVal, is_active: isActive, status,
      start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 31536000000).toISOString(),
      type: promoType, reward_type: rewardType,
      scope: promoType === 'CATEGORY_PROMOTION' ? 'CATEGORY' : promoType === 'MENU_ITEM_PROMOTION' ? 'MENU_ITEM' : 'RESTAURANT',
      category_id: promoType === 'CATEGORY_PROMOTION' ? categoryId : null,
      menu_item_id: promoType === 'MENU_ITEM_PROMOTION' ? menuItemId : null,
      eligibility_rules: { min_order_amount: minOrderAmount, order_types: allowedOrderTypes, buy_item_id: buyItemId, buy_quantity: buyQuantity },
      reward_config: { discount_value: discountValue, max_discount_amount: maxDiscountAmount, target_item_id: targetItemId, target_quantity: targetQuantity, combo_price: comboPrice }
    }
    try {
      const res = await fetch(promoId ? `/api/promotions/${promoId}` : `/api/promotions`, { method: promoId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error("Failed to save promotion")
      router.push("/dashboard/manager/promotions")
    } catch (err: any) { setError(err.message || "Failed to save promotion") } finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-[var(--muted)]"><Loader2 className="w-8 h-8 animate-spin" /></div>

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/manager/promotions")} className="p-2 rounded-xl bg-[var(--foreground)] border border-[var(--surface-border)] text-[var(--background)]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black">{promoId ? "Edit Promotion" : duplicateId ? "Duplicate Promotion" : "Create Promotion"}</h1>
            <p className="text-xs text-[var(--muted)] font-medium">Configure flexible, rule-based campaigns</p>
          </div>
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      <div className="flex border-b border-[var(--surface-border)] overflow-x-auto gap-2 scrollbar-none">
        {STEP_ITEMS.map((step) => (
          <button key={step.num} onClick={() => setCurrentStep(step.num)} className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${currentStep === step.num ? "border-[var(--color-primary-600)] text-[var(--color-primary-600)]" : "border-transparent text-[var(--background)] bg-[var(--foreground)]"}`}>
            {step.num === 1 ? <Calendar className="w-4 h-4" /> : step.num === 2 ? <Settings className="w-4 h-4" /> : step.num === 3 ? <Percent className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {step.label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl p-6 flex flex-col gap-6">
        {currentStep === 1 && <PromoBasicScheduleStep title={title} setTitle={setTitle} code={code} setCode={setCode} description={description} setDescription={setDescription} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} bannerUrl={bannerUrl} setBannerUrl={setBannerUrl} termsConditions={termsConditions} setTermsConditions={setTermsConditions} />}
        {currentStep === 2 && <PromoEligibilityStep promoType={promoType} setPromoType={setPromoType} promotionTypes={PROMOTION_TYPES} minOrderAmount={minOrderAmount} setMinOrderAmount={setMinOrderAmount} allowedOrderTypes={allowedOrderTypes} setAllowedOrderTypes={setAllowedOrderTypes} categories={categories} menuItems={menuItems} categoryId={categoryId} setCategoryId={setCategoryId} menuItemId={menuItemId} setMenuItemId={setMenuItemId} buyItemId={buyItemId} setBuyItemId={setBuyItemId} buyQuantity={buyQuantity} setBuyQuantity={setBuyQuantity} />}
        {currentStep === 3 && <PromoRewardStep rewardType={rewardType} setRewardType={setRewardType} rewardTypes={REWARD_TYPES} discountValue={discountValue} setDiscountValue={setDiscountValue} maxDiscountAmount={maxDiscountAmount} setMaxDiscountAmount={setMaxDiscountAmount} targetItemId={targetItemId} setTargetItemId={setTargetItemId} targetQuantity={targetQuantity} setTargetQuantity={setTargetQuantity} comboPrice={comboPrice} setComboPrice={setComboPrice} menuItems={menuItems} />}
        {currentStep === 4 && <PromoPreviewStep title={title} code={code} description={description} promoType={promoType} rewardType={rewardType} startDate={startDate} endDate={endDate} bannerUrl={bannerUrl} isActive={isActive} setIsActive={setIsActive} status={status} setStatus={setStatus} summaryText={`Applies to ${promoType}.`} />}

        <div className="flex items-center justify-between pt-4 border-t border-[var(--surface-border)]">
          {currentStep > 1 ? <button onClick={() => setCurrentStep(currentStep - 1)} className="px-5 py-2.5 rounded-xl border border-[var(--surface-border)] text-xs font-bold">Previous Step</button> : <div />}
          {currentStep < 4 ? <button onClick={() => setCurrentStep(currentStep + 1)} className="px-5 py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--btn-fg)] text-xs font-bold">Next Step</button> : <button onClick={handleSave} disabled={submitting} className="px-6 py-2.5 rounded-xl bg-[var(--color-primary-600)] text-white text-xs font-bold flex items-center gap-2">{submitting && <Loader2 className="w-4 h-4 animate-spin" />}{submitting ? "Saving..." : promoId ? "Update Campaign" : "Publish Campaign"}</button>}
        </div>
      </div>
    </div>
  )
}
