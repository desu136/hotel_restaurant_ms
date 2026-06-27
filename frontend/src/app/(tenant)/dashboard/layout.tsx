"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  LayoutDashboard,
  GitBranch,
  Users2,
  ShieldCheck,
  LogOut,
  Hotel,
  Menu,
  ChefHat,
  Utensils,
  UtensilsCrossed,
  Receipt,
  User,
  Tag,
  Store,
  Table2,
  QrCode,
  Bell,
} from "lucide-react"
import { ProfileDropdown } from "@/components/ui/profile-dropdown"

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export default function TenantDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [user, setUser] = React.useState<{ name: string; email: string; roles: string[]; branchName?: string | null } | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized")
        return res.json()
      })
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user)
        } else {
          router.push("/login")
        }
      })
      .catch(() => {
        router.push("/login")
      })
      .finally(() => setLoading(false))
  }, [router])

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  // Define navigation sections based on user role
  const isOwner = user?.roles.includes('HOTEL_OWNER');
  const isManager = user?.roles.some(r => ['HOTEL_MANAGER', 'RESTAURANT_MANAGER'].includes(r));
  const isChef = user?.roles.includes('CHEF');
  const isWaiter = user?.roles.includes('WAITER');
  const isCashier = user?.roles.includes('CASHIER');

  const managementNav: NavItem[] = []
  if (isOwner) {
    managementNav.push(
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/restaurants", label: "Restaurant", icon: Store, exact: false },
      { href: "/dashboard/employees", label: "Employees", icon: Users2, exact: false },
      { href: "/dashboard/roles", label: "Roles & Permissions", icon: ShieldCheck, exact: false }
    )
  }

  const operationsNav: NavItem[] = []
  if (isOwner || isManager) {
    operationsNav.push(
      { href: "/dashboard/manager/category", label: "Category", icon: Tag, exact: false },
      { href: "/dashboard/manager/menu", label: "Menu", icon: UtensilsCrossed, exact: false },
      { href: "/dashboard/manager/tables", label: "Tables", icon: Table2, exact: false },
      { href: "/dashboard/manager/qr", label: "QR Codes", icon: QrCode, exact: false },
      { href: "/dashboard/manager/staff", label: "Staff", icon: Users2, exact: false }
    )
  }
  if (isOwner || isWaiter) {
    operationsNav.push({ href: "/dashboard/waiter", label: "Waiter Station", icon: Utensils })
  }
  if (isOwner || isManager) {
    operationsNav.push({ href: "/dashboard/waiter-screen", label: "Waiter Screen", icon: Bell })
  }
  if (isOwner || isChef) {
    operationsNav.push({ href: "/dashboard/kitchen", label: "Kitchen KDS", icon: ChefHat })
  }
  if (isOwner || isCashier) {
    operationsNav.push({ href: "/dashboard/cashier", label: "Cashier Counter", icon: Receipt })
  }

  const allNavItems = [...managementNav, ...operationsNav]

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`${mobile ? "flex" : "flex"} w-64 flex-col border-r border-[var(--surface-border)] h-full`}
      style={{ background: "color-mix(in srgb, var(--surface) 90%, transparent)", backdropFilter: "blur(12px)" }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--surface-border)] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-600)] flex items-center justify-center mr-3 shadow-sm">
          <Hotel className="w-4 h-4 text-[var(--btn-fg)]" />
        </div>
        <span className="font-bold text-lg tracking-tight">
          Hospitality<span className="opacity-60">Hub</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-6 overflow-y-auto">
        {loading ? (
          <div className="space-y-4 px-4">
            <div className="h-4 bg-[var(--surface-hover)] rounded w-2/3 animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 bg-[var(--surface-hover)] rounded animate-pulse" />
              <div className="h-8 bg-[var(--surface-hover)] rounded animate-pulse" />
              <div className="h-8 bg-[var(--surface-hover)] rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {managementNav.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest px-4 mb-3">
                  Management
                </p>
                {managementNav.map((item) => {
                  const active = isActive(item)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${active
                        ? "bg-[var(--color-primary-600)] text-[var(--btn-fg)] shadow-sm"
                        : "text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                        }`}
                    >
                      <item.icon
                      className={`w-4 h-4 mr-3 shrink-0 transition-colors ${active ? "text-[var(--btn-fg)]" : "text-[var(--muted)] group-hover:text-[var(--foreground)]"}`}
                      />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}

            {operationsNav.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest px-4 mb-3">
                  Operations
                </p>
                {operationsNav.map((item) => {
                  const active = isActive(item)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${active
                        ? "bg-[var(--color-primary-600)] text-[var(--btn-fg)] shadow-sm"
                        : "text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                        }`}
                    >
                      <item.icon
                      className={`w-4 h-4 mr-3 shrink-0 transition-colors ${active ? "text-[var(--btn-fg)]" : "text-[var(--muted)] group-hover:text-[var(--foreground)]"}`}
                      />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--surface-border)] shrink-0 flex flex-col gap-3">
        {user && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--surface-border)]/40">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-600)] flex items-center justify-center text-[var(--btn-fg)] font-bold text-sm shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user.name}</p>
              <p className="text-[10px] text-[var(--muted)] truncate">
                {user.roles.join(", ")}
                {user.branchName && ` (${user.branchName})`}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2.5 rounded-lg text-sm font-medium text-[var(--muted)] hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all duration-150"
        >
          <LogOut className="w-4 h-4 mr-3 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )

  const currentNavTitle = allNavItems.find((n) => isActive(n))?.label ?? "Dashboard"

  // Waiter-only users get no sidebar — full screen station experience
  const isWaiterOnly = isWaiter && !isOwner && !isManager && !isChef && !isCashier

  return (
    <div className="tenant-theme h-screen overflow-hidden bg-[var(--background)] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-30 md:hidden h-full">
          <Sidebar mobile />
        </div>
      )}

      {/* Desktop sidebar — hidden for waiter-only users */}
      {!isWaiterOnly && (
        <div className="hidden md:flex w-64 shrink-0 h-screen sticky top-0">
          <Sidebar />
        </div>
      )}

      {/* Main area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="h-16 border-b border-[var(--surface-border)] flex items-center justify-between px-6 sticky top-0 z-10 shrink-0"
          style={{ background: "color-mix(in srgb, var(--surface) 90%, transparent)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center gap-3">
            {!isWaiterOnly && (
              <button
                className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold tracking-tight hidden sm:block">
              {currentNavTitle}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ProfileDropdown settingsHref="/dashboard/settings" avatarGradient="from-[var(--color-primary-600)] to-[var(--color-primary-500)]" />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  )
}
