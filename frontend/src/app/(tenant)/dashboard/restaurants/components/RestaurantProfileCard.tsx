"use client"
import { Store, Pencil, Calendar, Mail, Phone, User, Building2, Utensils, BadgeCheck, Clock } from "lucide-react"

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  RESTAURANT: "Restaurant",
  COFFEE_SHOP: "Coffee Shop",
  FAST_FOOD: "Fast Food Center",
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30",
  PENDING: "text-amber-600 bg-amber-500/10 border-amber-500/30",
  SUSPENDED: "text-red-500 bg-red-500/10 border-red-500/30",
  TRIAL: "text-blue-500 bg-blue-500/10 border-blue-500/30",
}

interface Restaurant {
  id: string; name: string; logo_url?: string | null; banner_url?: string | null; created_at: string
  tenant?: { owner_name: string; email: string; phone?: string | null; business_type: string; status: string } | null
}

export function RestaurantProfileCard({ restaurant, onEdit }: { restaurant: Restaurant; onEdit: () => void }) {
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div className="rounded-xl border border-[var(--surface-border)] overflow-hidden shadow-sm bg-[var(--surface)]">
      <div className="relative h-52 bg-gradient-to-br from-[var(--color-primary-600)]/20 to-purple-600/10"
        style={restaurant.banner_url ? { backgroundImage: `url(${restaurant.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}} />
      <div className="px-6 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-5">
          <div className="flex items-end gap-4">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt="logo" className="w-20 h-20 rounded-xl object-cover border-4 border-[var(--surface)] shadow-md shrink-0 z-10" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-[var(--color-primary-600)]/10 border-4 border-[var(--surface)] shadow-md flex items-center justify-center shrink-0 z-10">
                <Store className="w-9 h-9 text-[var(--color-primary-600)]" />
              </div>
            )}
            <div className="pb-1 mt-10 sm:mt-0">
              <h2 className="text-2xl font-black tracking-tight">{restaurant.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {restaurant.tenant?.business_type && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-primary-600)]/10 text-[var(--color-primary-600)] border border-[var(--color-primary-600)]/20">
                    {BUSINESS_TYPE_LABELS[restaurant.tenant.business_type] ?? restaurant.tenant.business_type}
                  </span>
                )}
                {restaurant.tenant?.status && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[restaurant.tenant.status] ?? "text-gray-500 bg-gray-500/10 border-gray-500/30"}`}>
                    {restaurant.tenant.status === "ACTIVE" ? <><BadgeCheck className="w-3 h-3 inline mr-0.5" />Active</>
                      : restaurant.tenant.status === "PENDING" ? <><Clock className="w-3 h-3 inline mr-0.5" />Pending Approval</>
                        : restaurant.tenant.status}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                  <Calendar className="w-3 h-3" />Registered {fmt(restaurant.created_at)}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] shadow-sm self-start sm:self-auto shrink-0">
            <Pencil className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>

        {restaurant.tenant && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t border-[var(--surface-border)]">
            {[
              { icon: <User className="w-4 h-4 text-[var(--color-primary-600)]" />, bg: "bg-[var(--color-primary-600)]/10", label: "Owner", value: restaurant.tenant.owner_name },
              { icon: <Mail className="w-4 h-4 text-blue-500" />, bg: "bg-blue-500/10", label: "Email", value: restaurant.tenant.email },
              ...(restaurant.tenant.phone ? [{ icon: <Phone className="w-4 h-4 text-emerald-500" />, bg: "bg-emerald-500/10", label: "Phone", value: restaurant.tenant.phone }] : []),
              { icon: <Building2 className="w-4 h-4 text-purple-500" />, bg: "bg-purple-500/10", label: "Business Type", value: BUSINESS_TYPE_LABELS[restaurant.tenant.business_type] ?? restaurant.tenant.business_type },
            ].map(({ icon, bg, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-hover)]/40 border border-[var(--surface-border)]">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-semibold truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function RestaurantEmptyState({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[var(--surface-border)] py-16 bg-[var(--surface)] flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-600)]/10 flex items-center justify-center">
        <Utensils className="w-8 h-8 text-[var(--color-primary-600)]" />
      </div>
      <div>
        <h2 className="text-xl font-bold mb-1">Register Your Restaurant</h2>
        <p className="text-sm text-[var(--muted)] max-w-sm">
          Set up your restaurant brand once. Then add branches under it to start managing menus, categories, and tables.
        </p>
      </div>
      <button onClick={onSetup} className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary-600)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-500)] transition-colors shadow-lg">
        <Store className="w-4 h-4" /> Set Up Restaurant
      </button>
    </div>
  )
}
