import * as React from "react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Hotel } from "lucide-react"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[var(--color-primary-500)]/20 to-transparent -z-10 blur-3xl pointer-events-none" />
      
      <header className="sticky top-0 z-50 w-full glass border-b-0 border-[var(--surface-border)]/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-[var(--color-primary-600)] p-2 rounded-lg text-white">
              <Hotel className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">HospitalityHub</span>
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
