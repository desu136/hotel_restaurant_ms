export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"

export async function GET() {
  try {
    console.log("Starting database seeding...")

    // 1. Create Default Roles
    const superAdminRole = await prisma.role.upsert({
      where: { code: 'SUPER_ADMIN' },
      update: {},
      create: {
        code: 'SUPER_ADMIN',
        name: 'Super Administrator',
      },
    })

    await prisma.role.upsert({
      where: { code: 'TENANT_ADMIN' },
      update: {},
      create: {
        code: 'TENANT_ADMIN',
        name: 'Tenant Administrator',
      },
    })

    // 2. Create the SYSTEM Tenant
    let systemTenant = await prisma.tenant.findFirst({
      where: { business_name: 'System Admin' }
    })

    if (!systemTenant) {
      systemTenant = await prisma.tenant.create({
        data: {
          business_name: 'System Admin',
          owner_name: 'System',
          phone: '0000000000',
          email: 'system@hospitalityhub.com',
          business_type: 'HOTEL_RESTAURANT',
          status: 'ACTIVE',
        }
      })
    }

    // 3. Create Default Super Admin User
    const adminEmail = 'admin@hospitalityhub.com'
    const adminPassword = await hash('admin123', 10)

    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {}, 
      create: {
        email: adminEmail,
        full_name: 'Super Admin',
        password_hash: adminPassword,
        tenant_id: systemTenant.id,
        status: 'ACTIVE',
        roles: {
          create: {
            role_id: superAdminRole.id
          }
        }
      },
    })

    // 4. Create Default Subscription Plans (if not exist)
    const plansCount = await prisma.subscriptionPlan.count()
    if (plansCount === 0) {
      await prisma.subscriptionPlan.createMany({
        data: [
          { name: 'Trial Plan', monthly_price: 0, annual_price: 0, trial_days: 14 },
          { name: 'Basic', monthly_price: 49.99, annual_price: 499.99, trial_days: 0 },
          { name: 'Pro', monthly_price: 99.99, annual_price: 999.99, trial_days: 0 }
        ]
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Seeding complete!",
      credentials: {
        email: adminEmail,
        password: "admin123"
      }
    })
  } catch (error: any) {
    console.error("Seeding failed:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
