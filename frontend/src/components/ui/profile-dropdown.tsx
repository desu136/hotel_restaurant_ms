"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { LogOut, Settings, User, ChevronDown } from "lucide-react"
import Link from "next/link"

interface ProfileDropdownProps {
  settingsHref: string // e.g. "/dashboard/settings" or "/admin/settings"
  avatarGradient?: string // tailwind gradient classes
}

export function ProfileDropdown({ settingsHref, avatarGradient = "from-violet-500 to-indigo-500" }: ProfileDropdownProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [user, setUser] = React.useState<{ name: string; email: string; roles: string[] } | null>(null)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.user && setUser(d.user))
      .catch(() => null)
  }, [])

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "U"

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-[var(--surface-hover)] transition-colors"
        aria-label="Open profile menu"
      >
        <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${avatarGradient} border-2 border-[var(--surface)] shadow-sm flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {initials}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-[var(--surface-border)] bg-[var(--surface-hover)]/40">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name ?? "User"}</p>
                <p className="text-xs text-[var(--muted)] truncate">{user?.email ?? ""}</p>
                {user?.roles?.[0] && (
                  <p className="text-[10px] text-[var(--color-primary-500)] font-semibold uppercase tracking-wide mt-0.5">
                    {user.roles[0].replace(/_/g, " ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href={settingsHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Settings className="w-4 h-4 text-[var(--muted)]" />
              Account Settings
            </Link>
          </div>

          <div className="border-t border-[var(--surface-border)] py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
