export const dynamic = "force-dynamic"
import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, Search, Filter, MoreVertical, CheckCircle2, XCircle, Clock } from "lucide-react"

import { cookies } from "next/headers"

async function getTenants() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch("http://localhost:4000/api/tenants", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    })
    
    if (!res.ok) {
      console.error("Failed to fetch tenants:", res.statusText)
      return []
    }
    
    return await res.json()
  } catch (err) {
    console.error("Error fetching tenants:", err)
    return []
  }
}

export default async function TenantsPage() {
  const tenants = await getTenants()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Tenants</h1>
        <p className="text-[var(--muted)]">Manage registered businesses and their platform access.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input 
            type="text" 
            placeholder="Search tenants..." 
            className="w-full pl-9 pr-4 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          />
        </div>
        <button className="flex items-center px-4 py-2 border border-[var(--surface-border)] rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-sm font-medium transition-colors">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tenants.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-2 bg-transparent shadow-none">
            <Building2 className="w-12 h-12 mx-auto text-[var(--muted)] mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-[var(--foreground)]">No tenants found</h3>
            <p className="text-sm text-[var(--muted)] mt-1">When users register, they will appear here.</p>
          </Card>
        ) : (
          tenants.map((tenant) => (
            <Card key={tenant.id} className="overflow-hidden hover:border-[var(--color-primary-500)]/50 transition-colors">
              <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                <div className="h-16 w-16 shrink-0 rounded-xl bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-50)] dark:from-[var(--color-primary-900)]/40 dark:to-transparent flex items-center justify-center border border-[var(--color-primary-100)] dark:border-[var(--color-primary-900)]">
                  <Building2 className="w-8 h-8 text-[var(--color-primary-600)] dark:text-blue-400" />
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-1">
                  <h3 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
                    {tenant.business_name}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
                    <span className="flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-500)] mr-2" />
                      {tenant.business_type}
                    </span>
                    <span>•</span>
                    <span>{tenant.owner_name}</span>
                    <span>•</span>
                    <span>{tenant.email}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-6 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium">Status</div>
                    {tenant.status === 'ACTIVE' && (
                      <span className="inline-flex items-center text-green-600 dark:text-green-400 text-sm font-medium mt-1">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Active
                      </span>
                    )}
                    {tenant.status === 'PENDING' && (
                      <span className="inline-flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium mt-1">
                        <Clock className="w-4 h-4 mr-1.5" /> Pending
                      </span>
                    )}
                    {tenant.status === 'SUSPENDED' && (
                      <span className="inline-flex items-center text-red-600 dark:text-red-400 text-sm font-medium mt-1">
                        <XCircle className="w-4 h-4 mr-1.5" /> Suspended
                      </span>
                    )}
                  </div>
                  
                  <div className="h-10 w-px bg-[var(--surface-border)] hidden sm:block" />
                  
                  <div className="flex items-center space-x-2">
                    <a href={`/tenants/${tenant.id}`} className="px-4 py-2 bg-[var(--color-primary-600)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-primary-500)] transition-colors shadow-sm">
                      Manage
                    </a>
                    <button className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
