export const dynamic = "force-dynamic"
import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Check } from "lucide-react"

import { cookies } from "next/headers"

async function getSubscriptionPlans() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch("http://localhost:4000/api/subscriptions", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    })
    
    if (!res.ok) {
      console.error("Failed to fetch subscriptions:", res.statusText)
      return []
    }
    
    return await res.json()
  } catch (err) {
    console.error("Error fetching subscriptions:", err)
    return []
  }
}

export default async function SubscriptionsPage() {
  const plans = await getSubscriptionPlans()

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Subscription Plans</h1>
          <p className="text-[var(--muted)]">Configure pricing tiers and features available to tenants.</p>
        </div>
        <Button className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.length === 0 ? (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-[var(--surface-border)] rounded-xl">
            <h3 className="text-lg font-medium text-[var(--foreground)]">No plans configured</h3>
            <p className="text-[var(--muted)] mt-1 mb-4">You need to setup subscription tiers before onboarding tenants.</p>
            <form action={async () => {
              "use server"
              console.log("Mock seed executed")
            }}>
              <Button type="submit">Seed Default Plans</Button>
            </form>
          </div>
        ) : (
          plans.map((plan, index) => (
            <Card key={plan.id} className={`flex flex-col relative overflow-hidden transition-all hover:shadow-md ${index === 1 ? 'border-[var(--color-primary-500)] shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]' : ''}`}>
              {index === 1 && (
                <div className="absolute top-0 inset-x-0 h-1 bg-[var(--color-primary-500)]" />
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <button className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 rounded-md transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <CardDescription>
                  {plan.name === 'Trial Plan' ? 'Free 14-day evaluation.' : 'Standard operational tier.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline text-3xl font-bold">
                  ${plan.monthly_price.toString()}
                  <span className="text-sm font-normal text-[var(--muted)] ml-1">/ mo</span>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium">Features included:</div>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-[var(--muted)]">
                      <Check className="w-4 h-4 mr-2 text-green-500 shrink-0" />
                      {plan.name === 'Trial Plan' ? '14 Days Access' : 'Unlimited Access'}
                    </li>
                    <li className="flex items-center text-sm text-[var(--muted)]">
                      <Check className="w-4 h-4 mr-2 text-green-500 shrink-0" />
                      {plan.name === 'Pro' ? 'Priority Support' : 'Standard Support'}
                    </li>
                    <li className="flex items-center text-sm text-[var(--muted)]">
                      <Check className="w-4 h-4 mr-2 text-green-500 shrink-0" />
                      Dexel Stock Integration
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Button variant={index === 1 ? 'primary' : 'outline'} className="w-full">
                  Edit Pricing Rules
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
