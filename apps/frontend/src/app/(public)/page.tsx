import Link from "next/link"
import { ArrowRight, Hotel, UtensilsCrossed, ShieldCheck } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32 relative">
        <div className="inline-flex items-center rounded-full border border-[var(--color-primary-500)]/30 bg-[var(--color-primary-500)]/10 px-3 py-1 text-sm font-medium text-[var(--color-primary-600)] dark:text-blue-400 mb-8">
          <span className="flex h-2 w-2 rounded-full bg-[var(--color-primary-600)] mr-2"></span>
          HospitalityHub v1.0 is Live
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight max-w-4xl mb-8 leading-tight">
          Next-Generation Management for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-500)] to-purple-500">Hotels & Restaurants</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-[var(--muted)] max-w-2xl mb-12">
          An all-in-one SaaS platform to manage your bookings, kitchen workflows, table service, and inventory sync—effortlessly.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/register" className="inline-flex items-center justify-center h-14 px-8 rounded-xl font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] transition-colors shadow-lg shadow-[var(--color-primary-500)]/25">
            Start 14-Day Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center h-14 px-8 rounded-xl font-medium text-[var(--foreground)] bg-[var(--surface)] border border-[var(--surface-border)] hover:bg-[var(--surface-hover)] transition-colors shadow-sm">
            Login to Dashboard
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-[var(--surface)] border-t border-[var(--surface-border)] py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to run your business</h2>
            <p className="text-[var(--muted)]">Powerful modules tailored for the hospitality industry.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass rounded-2xl p-8 hover:shadow-md transition-shadow hover:border-[var(--color-primary-500)]/50 border border-[var(--surface-border)]">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                <Hotel className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Hotel Operations</h3>
              <p className="text-[var(--muted)] leading-relaxed">
                Manage room inventory, dynamic pricing policies, check-ins, and guest profiles from a centralized dashboard.
              </p>
            </div>
            
            <div className="glass rounded-2xl p-8 hover:shadow-md transition-shadow hover:border-[var(--color-primary-500)]/50 border border-[var(--surface-border)]">
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Restaurant POS</h3>
              <p className="text-[var(--muted)] leading-relaxed">
                QR-code menus, real-time kitchen display screens (KDS), table management, and seamless order tracking.
              </p>
            </div>
            
            <div className="glass rounded-2xl p-8 hover:shadow-md transition-shadow hover:border-[var(--color-primary-500)]/50 border border-[var(--surface-border)]">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Multi-Tenant Secure</h3>
              <p className="text-[var(--muted)] leading-relaxed">
                Strict data isolation ensures your business data is secure. Role-based access control for all your employees.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
