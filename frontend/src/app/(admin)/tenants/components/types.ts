import type { CreateTenantInput } from "@/features/admin/types";

export const EMPTY_FORM: CreateTenantInput = {
  business_name: "", owner_name: "", email: "", phone: "",
  business_type: "RESTAURANT", address: "", license_info: "", tax_info: "",
};

export const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIVE:    { label: "Active",    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  PENDING:   { label: "Pending",   cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",        dot: "bg-amber-500"  },
  SUSPENDED: { label: "Suspended", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",    dot: "bg-orange-500" },
  REJECTED:  { label: "Rejected",  cls: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",               dot: "bg-red-500"    },
};

export const TYPE_LABELS: Record<string, string> = {
  RESTAURANT: "Restaurant", COFFEE_SHOP: "Coffee Shop", FAST_FOOD: "Fast Food Center",
};

export const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
