"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ProfileDropdown } from "@/components/ui/profile-dropdown"
import { DashboardSidebar } from "./components/DashboardSidebar"

export default function TenantDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [user, setUser] = React.useState<{ name: string; email: string; roles: string[]; branchName?: string | null } | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => { if (!res.ok) throw new Error("Unauthorized"); return res.json() })
      .then((data) => { if (data.success && data.user) setUser(data.user); else router.push("/login") })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false))
  }, [router])

  const isOwner = user?.roles?.includes('OWNER')
  const isManager = user?.roles?.some(r => ['HOTEL_MANAGER', 'RESTAURANT_MANAGER'].includes(r))
  const isAdmin = user?.roles?.includes('SUPER_ADMIN')
  const showSidebar = !!(isOwner || isManager || isAdmin)

  return (
    <div className="tenant-theme h-screen overflow-hidden bg-[var(--background)] flex">
      {sidebarOpen && showSidebar && (
        <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {sidebarOpen && showSidebar && (
        <div className="fixed inset-y-0 left-0 z-30 md:hidden h-full">
          <DashboardSidebar user={user} loading={loading} onCloseMobile={() => setSidebarOpen(false)} />
        </div>
      )}

      {showSidebar && (
        <div className="hidden md:flex w-64 shrink-0 h-screen sticky top-0">
          <DashboardSidebar user={user} loading={loading} />
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-[var(--surface-border)] flex items-center justify-between px-6 sticky top-0 z-10 shrink-0"
          style={{ background: "color-mix(in srgb, var(--surface) 90%, transparent)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            {showSidebar && (
              <button className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-hover)]" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold tracking-tight hidden sm:block">Dashboard</h2>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ProfileDropdown settingsHref="/dashboard/settings" avatarGradient="from-[var(--color-primary-600)] to-[var(--color-primary-500)]" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  )
}
