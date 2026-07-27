export interface Restaurant {
  id: string
  name: string
  tenant_id?: string | null
  logo_url?: string | null
  banner_url?: string | null
  branchId?: string | null
  branchName?: string | null
  branch?: { name: string; address?: string | null; phone?: string | null } | null
  branches?: Array<{
    id: string
    name: string
    logo_url?: string | null
    banner_url?: string | null
    address?: string | null
    phone?: string | null
  }> | null
}

export interface Category {
  id: string
  name: string
  parent_id?: string | null
}

export interface CustomizationValue {
  name: string
  extraPrice: number
  image_url?: string | null
  recommended?: boolean
}

export interface Customization {
  key: string
  label: string
  multiple: boolean
  values: CustomizationValue[]
}

export interface MenuItem {
  id: string
  display_name: string
  description?: string | null
  price: string | number
  category_id?: string | null
  image_url?: string | null
  image_urls?: string[] | null
  customizations?: Customization[] | null
  prep_time?: number | null
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  selectedCustomizations: Record<string, string | string[]>
  notes?: string
}

export interface OrderHistoryItem {
  id: string
  order_number?: string | null
  status: string
  total_amount: number | string
  created_at: string
  table?: { table_number: string } | null
  items: Array<{
    id: string
    quantity: number
    unit_price: number
    menu_item: MenuItem
    customizations?: Record<string, string | string[]> | null
  }>
}

export interface TableDetails {
  id: string
  table_number: string
  capacity: number
}

export const SLOTS = [
  { top: "10%", right: "12%" },
  { bottom: "12%", right: "8%" },
  { top: "15%", left: "10%" },
  { bottom: "15%", left: "8%" }
]

export const getCategoryEmoji = (name: string): string => {
  const n = name.toLowerCase()
  if (n.includes("burger") || n.includes("sandwich")) return "🍔"
  if (n.includes("fry") || n.includes("potato") || n.includes("chip")) return "🍟"
  if (n.includes("drink") || n.includes("beverage") || n.includes("soda") || n.includes("juice") || n.includes("coke") || n.includes("water")) return "🥤"
  if (n.includes("dessert") || n.includes("ice") || n.includes("shake") || n.includes("sweet") || n.includes("cake")) return "🍦"
  if (n.includes("pizza")) return "🍕"
  if (n.includes("chicken") || n.includes("wing") || n.includes("nugget")) return "🍗"
  if (n.includes("pasta") || n.includes("noodle")) return "🍝"
  if (n.includes("salad") || n.includes("green") || n.includes("veg")) return "🥗"
  if (n.includes("combo") || n.includes("deal") || n.includes("pack") || n.includes("offer")) return "🎁"
  if (n.includes("breakfast") || n.includes("morning") || n.includes("egg")) return "🍳"
  if (n.includes("coffee") || n.includes("tea") || n.includes("latte") || n.includes("espresso")) return "☕"
  if (n.includes("fish") || n.includes("seafood") || n.includes("shrimp")) return "🐟"
  if (n.includes("soup") || n.includes("hot")) return "🍲"
  if (n.includes("wrap") || n.includes("roll") || n.includes("taco")) return "🌯"
  if (n.includes("rice") || n.includes("grain")) return "🍚"
  if (n.includes("steak") || n.includes("beef") || n.includes("meat")) return "🥩"
  if (n.includes("snack") || n.includes("side")) return "🧆"
  return "🍽️"
}

export const getDefaultCustomizations = (item: MenuItem): Record<string, string | string[]> => {
  const defaults: Record<string, string | string[]> = {}
  if (item.customizations) {
    item.customizations.forEach(cust => {
      const recs = cust.values
        .filter(v => typeof v !== "string" && v.recommended)
        .map(v => typeof v === "string" ? v : v.name)
      if (recs.length > 0) defaults[cust.key] = cust.multiple ? recs : recs[0]
    })
  }
  return defaults
}

export const areCustsEqual = (
  a: Record<string, string | string[]> = {},
  b: Record<string, string | string[]> = {}
): boolean => {
  const clean = (obj: Record<string, string | string[]>) =>
    Object.fromEntries(
      Object.entries(obj || {}).filter(([_, v]) => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : v !== ""))
    )
  const cleanA = clean(a)
  const cleanB = clean(b)
  const keysA = Object.keys(cleanA).sort()
  const keysB = Object.keys(cleanB).sort()
  if (keysA.length !== keysB.length) return false
  return keysA.every(k => {
    const vA = cleanA[k]
    const vB = cleanB[k]
    if (Array.isArray(vA) && Array.isArray(vB)) {
      return vA.length === vB.length && vA.slice().sort().every((val, i) => val === vB.slice().sort()[i])
    }
    return vA === vB
  })
}
