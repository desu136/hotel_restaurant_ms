import * as React from "react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { BrandLogo } from "@/components/brand-logo"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <header className="sticky top-0 z-50 w-full glass border-b-0 border-[var(--surface-border)]/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <BrandLogo className="h-12 w-12 object-contain" />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
