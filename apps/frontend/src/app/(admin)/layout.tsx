import * as React from "react"
import Link from "next/link"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Hotel } from "lucide-react"

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
          <Link href="/tenants" className="flex items-center px-4 py-3 rounded-lg text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors text-[var(--foreground)]">
            <Users className="w-5 h-5 mr-3 text-[var(--muted)]" />
            Tenants
          </Link>
          <Link href="/subscriptions" className="flex items-center px-4 py-3 rounded-lg text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors text-[var(--foreground)]">
            <CreditCard className="w-5 h-5 mr-3 text-[var(--muted)]" />
            Subscriptions
          </Link>
          <Link href="/settings" className="flex items-center px-4 py-3 rounded-lg text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors text-[var(--foreground)]">
            <Settings className="w-5 h-5 mr-3 text-[var(--muted)]" />
            Settings
          </Link>
        </nav>
        
        <div className="p-4 border-t border-[var(--surface-border)]">
          <button className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors text-[var(--muted)]">
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
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
