import * as React from "react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Hotel } from "lucide-react"
import { SignOutButton } from "@/components/sign-out-button"
import { NavLink } from "@/components/ui/nav-link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-[var(--surface-border)] flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-[var(--surface-border)]">
          <Hotel className="w-6 h-6 text-[var(--color-primary-600)] mr-2" />
          <span className="font-bold text-lg tracking-tight">Admin<span className="text-[var(--color-primary-600)]">Hub</span></span>
        </div>

        <nav className="flex-1 py-6 px-4 flex flex-col space-y-2">
          <NavLink href="/tenants">
            <Users className="w-5 h-5 mr-3 text-[var(--muted)]" />
            Tenants
          </NavLink>
          <NavLink href="/subscriptions">
            <CreditCard className="w-5 h-5 mr-3 text-[var(--muted)]" />
            Subscriptions
          </NavLink>
          <NavLink href="/modules">
            <LayoutDashboard className="w-5 h-5 mr-3 text-[var(--muted)]" />
            Modules
          </NavLink>
          <NavLink href="/settings">
            <Settings className="w-5 h-5 mr-3 text-[var(--muted)]" />
            Platform Settings
          </NavLink>
          <NavLink href="/audit-logs">
            <LayoutDashboard className="w-5 h-5 mr-3 text-[var(--muted)]" />
            Audit Logs
          </NavLink>
        </nav>

        <div className="p-4 border-t border-[var(--surface-border)]">
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 glass border-b border-[var(--surface-border)] flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center">
            {/* Mobile Menu Button can go here */}
            <h2 className="text-xl font-semibold tracking-tight hidden sm:block">Super Admin Dashboard</h2>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--color-primary-500)] to-purple-500 border-2 border-[var(--surface)] shadow-sm" />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
