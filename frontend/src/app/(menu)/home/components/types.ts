export interface Restaurant {
  id: string
  name: string
  tenant_id?: string | null
  logo_url?: string | null
  branch_id?: string | null
  parent_id?: string | null
  branches?: Array<{
    id: string
    name: string
    address?: string | null
    phone?: string | null
  }> | null
  branch?: {
    name: string
  } | null
  distance?: number
}

export interface AppConfig {
  business_name: string
  business_type?: string
  restaurants: Restaurant[]
}

export interface Promotion {
  id: string
  title: string
  description: string | null
  terms_conditions: string | null
  code: string | null
  discount_value: string | null
  banner_url: string | null
  type: string
  scope: string
  status: string
  start_date: string
  end_date: string
  restaurant_id: string | null
  category_id: string | null
  menu_item_id: string | null
  branch_id: string | null
  is_active: boolean
}

export const RESTAURANT_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  "Grand Horizon Bistro": { latitude: 9.030, longitude: 38.740 },
  "McDonald": { latitude: 9.025, longitude: 38.750 },
  "Burger King": { latitude: 9.040, longitude: 38.760 },
  "Pizza Hut": { latitude: 9.015, longitude: 38.730 },
  "Bole Outlet": { latitude: 9.001, longitude: 38.780 },
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return parseFloat((R * c).toFixed(1))
}
