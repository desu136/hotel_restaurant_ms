"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, GitBranchIcon, Users2, LogOut, UtensilsCrossed, Tag,
  Table2, QrCode, Megaphone, BarChart3, Utensils, Bell, ChefHat, Receipt, Store
} from "lucide-react"

interface NavItem { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }

export function DashboardSidebar({ user, loading, onCloseMobile }: { user: any; loading: boolean; onCloseMobile?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (item: NavItem) => item.exact ? pathname === item.href : pathname.startsWith(item.href)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const isOwner = user?.roles?.includes('HOTEL_OWNER')
  const isManager = user?.roles?.some((r: string) => ['HOTEL_MANAGER', 'RESTAURANT_MANAGER'].includes(r))
  const isChef = user?.roles?.includes('CHEF')
  const isWaiter = user?.roles?.includes('WAITER')
  const isCashier = user?.roles?.includes('CASHIER')

  const managementNav: NavItem[] = []
  if (isOwner) {
    managementNav.push(
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/restaurants", label: "Restaurant", icon: Store, exact: false },
      { href: "/dashboard/employees", label: "Employees", icon: Users2, exact: false }
    )
  }

  const operationsNav: NavItem[] = []
  if (isOwner || isManager) {
    if (isOwner) operationsNav.push({ href: "/dashboard/manager/branches", label: "Branches", icon: GitBranchIcon, exact: false })
    else operationsNav.push({ href: "/dashboard/manager/branch-profile", label: "Branch Profile", icon: Store, exact: false })
    operationsNav.push(
      { href: "/dashboard/manager/category", label: "Category", icon: Tag, exact: false },
      { href: "/dashboard/manager/menu", label: "Menu", icon: UtensilsCrossed, exact: false },
      { href: "/dashboard/manager/tables", label: "Tables", icon: Table2, exact: false },
      { href: "/dashboard/manager/qr", label: "QR Codes", icon: QrCode, exact: false },
    )
    if (!isOwner) {
      operationsNav.push({ href: "/dashboard/manager/staff", label: "Staff", icon: Users2, exact: false })
    }
    operationsNav.push(
      { href: "/dashboard/manager/promotions", label: "Promotions", icon: Megaphone, exact: false },
      { href: "/dashboard/manager/reports", label: "Reports", icon: BarChart3, exact: false }
    )
  }
  if (isOwner || isWaiter || isManager) operationsNav.push({ href: "/dashboard/waiter", label: "Waiters Station", icon: Utensils })
  if (isOwner || isManager) operationsNav.push({ href: "/dashboard/waiter-screen", label: "Waiters Display Screen", icon: Bell })
  if (isOwner || isChef || isManager) operationsNav.push({ href: "/dashboard/kitchen", label: "Kitchen Display Screen", icon: ChefHat })
  if (isOwner || isCashier || isManager) operationsNav.push({ href: "/dashboard/cashier", label: "Cashier Counter", icon: Receipt })

  return (
    <aside className="w-64 flex flex-col border-r border-[var(--surface-border)] h-full"
      style={{ background: "color-mix(in srgb, var(--surface) 90%, transparent)", backdropFilter: "blur(12px)" }}>
      <div className="h-16 flex items-center px-6 border-b border-[var(--surface-border)] shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"><UtensilsCrossed className="w-5 h-5" /></div>
        <span className="font-bold text-lg tracking-tight">RMS</span>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-6 overflow-y-auto">
        {loading ? (
          <div className="space-y-4 px-4">
            <div className="h-4 bg-[var(--surface-hover)] rounded w-2/3 animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 bg-[var(--surface-hover)] rounded animate-pulse" />
              <div className="h-8 bg-[var(--surface-hover)] rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {managementNav.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest px-4 mb-3">Management</p>
                {managementNav.map((item) => {
                  const active = isActive(item)
                  return (
                    <Link key={item.href} href={item.href} onClick={onCloseMobile}
                      className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all group ${active ? "bg-[var(--foreground)] text-[var(--btn-fg)] shadow-sm" : "text-[var(--foreground)] hover:bg-[var(--surface-hover)]"}`}>
                      <item.icon className={`w-4 h-4 mr-3 shrink-0 ${active ? "text-[var(--btn-fg)]" : "text-[var(--muted)]"}`} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}

            {operationsNav.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest px-4 mb-3">Operations</p>
                {operationsNav.map((item) => {
                  const active = isActive(item)
                  return (
                    <Link key={item.href} href={item.href} onClick={onCloseMobile}
                      className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all group ${active ? "bg-[var(--foreground)] text-[var(--btn-fg)] shadow-sm" : "text-[var(--foreground)] hover:bg-[var(--surface-hover)]"}`}>
                      <item.icon className={`w-4 h-4 mr-3 shrink-0 ${active ? "text-[var(--btn-fg)]" : "text-[var(--muted)]"}`} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-[var(--surface-border)] shrink-0 flex flex-col gap-3">
        {user && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--surface-border)]/40">
            <div className="w-8 h-8 rounded-full bg-[var(--foreground)] flex items-center justify-center text-[var(--btn-fg)] font-bold text-sm shrink-0">{user.name?.charAt(0)}</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user.name}</p>
              <p className="text-[10px] flex flex-col truncate"><span className="text-bold">{user.roles?.join(", ")}</span></p>
            </div>
          </div>
        )}
        <button onClick={handleLogout} className="flex items-center w-full px-4 py-2.5 rounded-lg text-sm font-medium text-[var(--muted)] hover:bg-red-600 hover:text-white transition-all">
          <LogOut className="w-4 h-4 mr-3 shrink-0" /> Sign Out
        </button>
      </div>
    </aside>
  )
}
