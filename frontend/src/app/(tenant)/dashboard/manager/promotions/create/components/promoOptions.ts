import { PromotionTypeOption } from "./PromoEligibilityStep"
import { RewardTypeOption } from "./PromoRewardStep"

export const PROMOTION_TYPES: PromotionTypeOption[] = [
  { value: "FIRST_ORDER", label: "First Order", group: "Customer", desc: "Applies to customer's first completed order." },
  { value: "MINIMUM_SPEND", label: "Minimum Spend", group: "Cart", desc: "Applies when subtotal meets target value." },
  { value: "BUY_X_GET_Y", label: "Buy X Get Y", group: "Cart", desc: "Purchase item X to unlock item Y." },
  { value: "CATEGORY_PROMOTION", label: "Category Discount", group: "Scope", desc: "Applies specifically to menu category." },
  { value: "MENU_ITEM_PROMOTION", label: "Menu Item Specific", group: "Scope", desc: "Applies specifically to single menu item." },
  { value: "FREE_DELIVERY", label: "Free Delivery", group: "Channel", desc: "Applies automatically to delivery orders." }
]

export const REWARD_TYPES: RewardTypeOption[] = [
  { value: "PERCENTAGE_DISCOUNT", label: "Percentage Discount (%)", desc: "Deduct a percentage from order total." },
  { value: "FIXED_DISCOUNT", label: "Fixed Cash Discount ($)", desc: "Deduct flat dollar amount." },
  { value: "FREE_ITEM", label: "Free Menu Item", desc: "Give selected item free." },
  { value: "FREE_DELIVERY", label: "Free Delivery Coverage", desc: "Waive delivery fee." }
]

export const STEP_ITEMS = [
  { num: 1, label: "Basic Info & Schedule" },
  { num: 2, label: "Campaign & Eligibility" },
  { num: 3, label: "Reward Configuration" },
  { num: 4, label: "Preview & Review" }
]
