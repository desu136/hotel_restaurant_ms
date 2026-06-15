export interface Tenant {
  id: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  business_type: "HOTEL" | "RESTAURANT" | "HOTEL_RESTAURANT";
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";
  address?: string | null;
  license_info?: string | null;
  tax_info?: string | null;
  created_at: string;
  updated_at: string;
  subscriptions?: TenantSubscription[];
  modules?: TenantModule[];
  users?: any[];
}

export interface TenantSubscription {
  id: string;
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  start_date: string;
  end_date: string;
  plan: SubscriptionPlan;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  monthly_price: string;
  annual_price: string;
  trial_days: number;
  modules?: PlanModule[];
}

export interface PlanModule {
  module_id: string;
  module: SystemModule;
}

export interface SystemModule {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface TenantModule {
  module_id: string;
  enabled: boolean;
  module: SystemModule;
}

export interface ListTenantsResponse {
  data: Tenant[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateTenantInput {
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  business_type: string;
  address?: string;
  license_info?: string;
  tax_info?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resource?: string;
  timestamp: string;
  user?: { full_name: string; email: string };
  tenant?: { business_name: string };
}

export interface PlatformSetting {
  key: string;
  value: string;
  description?: string;
}
