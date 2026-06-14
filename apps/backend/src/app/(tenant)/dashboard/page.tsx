import * as React from "react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Building2, LogOut } from "lucide-react"

export default function TenantDashboardStub() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <header className="h-16 glass border-b border-[var(--surface-border)] flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center text-[var(--color-primary-600)] font-bold text-xl">
          <Building2 className="w-6 h-6 mr-2" />
          Tenant Dashboard
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <form action="/api/auth/logout" method="POST">
            <button className="flex items-center text-sm font-medium text-[var(--muted)] hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </form>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-[var(--surface-hover)] rounded-2xl flex items-center justify-center text-[var(--muted)] mb-6">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Coming Soon</h1>
          <p className="text-[var(--muted)]">
            This is the placeholder for the Tenant Dashboard. We will build the Hotel Management and Restaurant POS modules here soon.
          </p>
        </div>
      </main>
    </div>
  )
}
