export const dynamic = "force-dynamic"
import * as React from "react"
import { notFound } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Mail, Phone, Calendar, ArrowLeft, CheckCircle2, AlertCircle, PlayCircle, ShieldCheck } from "lucide-react"

import { cookies } from "next/headers"

async function getTenant(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`http://localhost:4000/api/tenants/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    })
    
    if (!res.ok) {
      console.error(`Failed to fetch tenant ${id}:`, res.statusText)
      return null
    }
    
    return await res.json()
  } catch (err) {
    console.error(`Error fetching tenant ${id}:`, err)
    return null
  }
}

export default async function TenantDetailPage({ params }: { params: { id: string } }) {
  // Fix Next 15 page params handling by awaiting params if necessary, but here string is safe
  const tenantId = params.id
  const tenant = await getTenant(tenantId)

  if (!tenant) {
    notFound()
  }

  const activeSubscription = tenant.subscriptions.find(s => s.status === 'ACTIVE' || s.status === 'TRIAL')
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-8">
        <a href="/tenants" className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tenant.business_name}</h1>
          <div className="flex items-center text-sm text-[var(--muted)] mt-1">
            <span className="capitalize">{tenant.business_type.toLowerCase().replace('_', ' & ')}</span>
            <span className="mx-2">•</span>
            <span>Registered on {new Date(tenant.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center space-x-3">
          {tenant.status === 'PENDING' && (
            <>
              <Button variant="danger" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-0">Reject</Button>
              <form action={async () => {
                "use server"
                const cookieStore = await cookies()
                const token = cookieStore.get("token")?.value
                await fetch(`http://localhost:4000/api/tenants/${tenant.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({ status: 'ACTIVE' })
                })
              }}>
                <Button type="submit" className="bg-green-600 hover:bg-green-500 text-white shadow-sm border-0">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Approve Tenant
                </Button>
              </form>
            </>
          )}
          {tenant.status === 'ACTIVE' && (
            <Button variant="outline" className="text-amber-600 border-amber-600/30 hover:bg-amber-50 dark:hover:bg-amber-900/20">
              Suspend Account
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-[var(--color-primary-500)]" />
                Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center mr-3 shrink-0">
                  <span className="font-semibold text-sm">{tenant.owner_name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{tenant.owner_name}</p>
                  <p className="text-xs text-[var(--muted)]">Primary Owner</p>
                </div>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 mr-3 text-[var(--muted)]" />
                {tenant.email}
              </div>
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-3 text-[var(--muted)]" />
                {tenant.phone || 'N/A'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass overflow-hidden relative">
            <div className={`absolute top-0 inset-x-0 h-1 ${tenant.status === 'ACTIVE' ? 'bg-green-500' : tenant.status === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'}`} />
            <CardHeader>
              <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center py-2 border-b border-[var(--surface-border)] last:border-0">
                <span className="text-sm text-[var(--muted)]">Account</span>
                <span className={`text-sm font-medium ${tenant.status === 'ACTIVE' ? 'text-green-600 dark:text-green-400' : tenant.status === 'PENDING' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {tenant.status}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-[var(--muted)]">Subscription</span>
                <span className={`text-sm font-medium ${activeSubscription?.status === 'TRIAL' ? 'text-[var(--color-primary-600)] dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                  {activeSubscription?.status || 'NONE'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle/Right Column: Modules & Subscription */}
        <div className="md:col-span-2 space-y-6">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Subscription Details</CardTitle>
                <CardDescription>Current plan and billing cycle.</CardDescription>
              </div>
              <Button variant="outline" size="sm">Change Plan</Button>
            </CardHeader>
            <CardContent>
              {activeSubscription ? (
                <div className="bg-[var(--surface-hover)] rounded-lg p-6 border border-[var(--surface-border)]">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold">{activeSubscription.plan.name}</h3>
                      <p className="text-sm text-[var(--muted)] mt-1 flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        Valid until {new Date(activeSubscription.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${activeSubscription.plan.monthly_price.toString()}</div>
                      <div className="text-xs text-[var(--muted)]">/ month</div>
                    </div>
                  </div>
                  
                  {activeSubscription.status === 'TRIAL' && (
                    <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-sm">
                      <PlayCircle className="w-5 h-5 mr-2 shrink-0" />
                      Tenant is currently in a 14-day free trial period. Wait for payment setup to activate fully.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--muted)] flex flex-col items-center">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                  <p>No active subscription found.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Module Assignments</CardTitle>
              <CardDescription>Enable or disable specific features for this tenant.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Simulated Module Toggles */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--surface-border)] hover:bg-[var(--surface-hover)] transition-colors">
                  <div>
                    <h4 className="font-medium text-sm">Hotel Management</h4>
                    <p className="text-xs text-[var(--muted)] mt-0.5">Rooms, Bookings, Housekeeping.</p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle1" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-[var(--color-primary-500)] checked:right-0 right-5" checked={tenant.business_type.includes('HOTEL')} readOnly />
                    <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-5 rounded-full bg-[var(--color-primary-500)] cursor-pointer"></label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--surface-border)] hover:bg-[var(--surface-hover)] transition-colors">
                  <div>
                    <h4 className="font-medium text-sm">Restaurant & POS</h4>
                    <p className="text-xs text-[var(--muted)] mt-0.5">Tables, Kitchen Display, Orders.</p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle2" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-[var(--color-primary-500)] checked:right-0 right-5" checked={tenant.business_type.includes('RESTAURANT')} readOnly />
                    <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-5 rounded-full bg-[var(--color-primary-500)] cursor-pointer"></label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--surface-border)] hover:bg-[var(--surface-hover)] transition-colors">
                  <div>
                    <h4 className="font-medium text-sm">Dexel Stock Integration</h4>
                    <p className="text-xs text-[var(--muted)] mt-0.5">Inventory sync and catalog sharing.</p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle3" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-[var(--surface-border)] right-5" readOnly />
                    <label htmlFor="toggle3" className="toggle-label block overflow-hidden h-5 rounded-full bg-[var(--surface-border)] cursor-pointer"></label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
