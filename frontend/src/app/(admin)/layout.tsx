"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  Users, CreditCard, Settings, LogOut, Hotel,
  Menu, LayoutDashboard, ScrollText, Boxes, ShieldAlert, User,
} from "lucide-react"
import { ProfileDropdown } from "@/components/ui/profile-dropdown"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV: NavItem[] = [
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/modules", label: "Modules", icon: Boxes },
  { href: "/settings", label: "Platform Settings", icon: Settings },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const SidebarContent = () => (
    <aside
      className="flex w-64 flex-col border-r border-[var(--surface-border)] h-full"
      style={{ background: "color-mix(in srgb, var(--surface) 90%, transparent)", backdropFilter: "blur(12px)" }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--surface-border)] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mr-3 shadow-sm">
          <ShieldAlert className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">
          Admin<span className="text-red-500">Hub</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest px-4 mb-3">
          Management
        </p>
        {NAV.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${active
                ? "bg-[var(--color-primary-600)] text-white shadow-sm"
                : "text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                }`}
            >
              <item.icon
                className={`w-4 h-4 mr-3 shrink-0 transition-colors ${active ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--foreground)]"
                  }`}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--surface-border)] shrink-0 space-y-2">
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[var(--surface-hover)]">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">Super Admin</p>
            <p className="text-[10px] text-[var(--muted)] truncate">Platform Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2.5 rounded-lg text-sm font-medium text-[var(--muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4 mr-3 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )

  const currentLabel = NAV.find(n => isActive(n.href))?.label ?? "Super Admin"

  return (
    <div className="h-screen overflow-hidden bg-[var(--background)] flex">
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
          <SidebarContent />
        </div>
      )}

      {/* Desktop sidebar — fixed, never scrolls */}
      <div className="hidden md:flex w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Main area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="h-16 border-b border-[var(--surface-border)] flex items-center justify-between px-6 sticky top-0 z-10 shrink-0"
          style={{ background: "color-mix(in srgb, var(--surface) 90%, transparent)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold tracking-tight hidden sm:block">{currentLabel}</h2>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ProfileDropdown settingsHref="/profile" avatarGradient="from-red-500 to-orange-500" />
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
