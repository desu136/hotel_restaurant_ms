export interface Table {
  id: string; table_number: string; capacity: number; waiter_id: string | null
  waiter?: { id: string; full_name: string } | null
}

export interface CustomizationValue { name: string; extraPrice: number }
export interface Customization { key: string; label: string; multiple: boolean; values: CustomizationValue[] }

export interface MenuItem {
  id: string; display_name: string; description?: string | null; price: string | number
  image_url?: string | null; category_id?: string | null; customizations?: Customization[] | null
  category?: { id: string; name: string; parent_id?: string | null } | null; prep_time?: number | null
}

export interface CartItem {
  menuItemId: string; name: string; price: number; quantity: number
  selectedCustomizations: Record<string, string | string[]>; notes: string; prepTime?: number | null
}

export interface Category { id: string; name: string; parent_id?: string | null }

export interface OrderItem {
  id: string; quantity: number; unit_price: number | string; menu_item: { display_name: string }
}

export interface Order {
  id: string; order_number?: string | null; status: string; order_type: string
  total_amount: string | number; created_at: string; notes?: string | null
  table_id?: string | null
  table?: { id: string; table_number: string; waiter?: { id: string; full_name: string } | null } | null
  items: OrderItem[]; waiter_id?: string | null; waiter?: { id: string; full_name: string } | null
  placed_by_staff?: boolean
}

export interface ActivityLog {
  id: string
  type: "serve_order" | "create_order" | "clear_table"
  message: string
  timestamp: string
}
