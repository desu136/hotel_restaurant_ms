"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-md border border-[var(--surface-border)] bg-[var(--surface)] opacity-50"></div>
    )
  }

  return (
    <div className="relative inline-flex items-center p-1 rounded-full border border-[var(--surface-border)] bg-[var(--surface)] shadow-sm">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-full transition-colors ${
          theme === "light" ? "bg-[var(--surface-hover)] text-amber-500" : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
        aria-label="Light theme"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-full transition-colors ${
          theme === "system" ? "bg-[var(--surface-hover)] text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
        aria-label="System theme"
      >
        <Monitor className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-full transition-colors ${
          theme === "dark" ? "bg-[var(--surface-hover)] text-blue-400" : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
        aria-label="Dark theme"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  )
}
