import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient({
  log: ['info', 'query', 'error', 'warn']
})

async function main() {
  console.log("Starting database seeding...")

  // 1. Create Default Roles
  console.log("Seeding roles...")
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
  console.log("Seeding SYSTEM tenant...")
  // Using a hardcoded ID or predictable query so we can upsert
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
  console.log("Seeding SUPER_ADMIN user...")
  const adminEmail = 'admin@hospitalityhub.com'
  const adminPassword = await hash('admin123', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {}, // Don't overwrite password if already set
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
  console.log("Seeding default subscription plans...")
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

  console.log("✅ Seeding complete!")
  console.log(`\nSuper Admin Login:\nEmail: ${adminEmail}\nPassword: admin123\n`)
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
