export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { businessName, businessType, ownerName, email, phone, password } = body

    if (!businessName || !businessType || !ownerName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Hash the password
    const passwordHash = await hash(password, 10)

    // Execute in a transaction to ensure everything is created together
    const newTenant = await prisma.$transaction(async (tx) => {
      // 1. Create the Tenant
      const tenant = await tx.tenant.create({
        data: {
          business_name: businessName,
          business_type: businessType,
          owner_name: ownerName,
          email,
          phone,
          status: "PENDING", // Wait for Super Admin approval
        }
      })

      // 2. Create the User (Admin role implied for owner)
      await tx.user.create({
        data: {
          tenant_id: tenant.id,
          full_name: ownerName,
          email,
          phone,
          password_hash: passwordHash,
          status: "ACTIVE" // User is active, but tenant is pending
        }
      })

      // 3. Look up or create a default "Trial" Subscription Plan
      let plan = await tx.subscriptionPlan.findFirst({
        where: { name: "Trial Plan" }
      })
      
      if (!plan) {
        plan = await tx.subscriptionPlan.create({
          data: {
            name: "Trial Plan",
            monthly_price: 0,
            annual_price: 0,
            trial_days: 14
          }
        })
      }

      // 4. Create the TenantSubscription
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(startDate.getDate() + plan.trial_days)

      await tx.tenantSubscription.create({
        data: {
          tenant_id: tenant.id,
          plan_id: plan.id,
          start_date: startDate,
          end_date: endDate,
          status: "TRIAL"
        }
      })

      return tenant
    })

    return NextResponse.json({ success: true, tenant: newTenant }, { status: 201 })
  } catch (error: any) {
    console.error("Registration error:", error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
