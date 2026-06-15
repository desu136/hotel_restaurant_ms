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

  await prisma.role.upsert({
    where: { code: 'HOTEL_OWNER' },
    update: {},
    create: {
      code: 'HOTEL_OWNER',
      name: 'Hotel Owner',
    },
  })

  // 1.5 Create Default Platform Settings
  console.log("Seeding platform settings...")
  const defaultSettings = [
    { key: 'TRIAL_DURATION_DAYS', value: '14', description: 'Default trial duration in days' },
    { key: 'GRACE_PERIOD_DAYS', value: '3', description: 'Days before suspension after failed payment' },
    { key: 'SUSPENSION_PERIOD_DAYS', value: '7', description: 'Days before tenant data is locked or scheduled for deletion' },
    { key: 'RENEWAL_REMINDER_DAYS', value: '5', description: 'Days before subscription ends to send reminder' }
  ]

  for (const setting of defaultSettings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    })
  }

  // 2. Create Default Modules
  console.log("Seeding modules...")
  const defaultModules = [
    { code: 'HOTEL', name: 'Hotel Operations', description: 'Core hotel management' },
    { code: 'ROOMS', name: 'Room Reservations', description: 'Room booking system' },
    { code: 'RESTAURANT', name: 'Restaurant POS', description: 'Point of sale for restaurants' },
    { code: 'MENU', name: 'Digital Menu', description: 'QR Code digital menus' },
    { code: 'KITCHEN', name: 'Kitchen Display', description: 'KDS and ticket management' },
    { code: 'DELIVERY', name: 'Delivery Tracking', description: 'Room service and external delivery' }
  ]

  for (const mod of defaultModules) {
    await prisma.module.upsert({
      where: { code: mod.code },
      update: {},
      create: mod
    })
  }

  // 3. Create Default Super Admin User (tenant_id = null)
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
      status: 'ACTIVE',
      // tenant_id is omitted (defaults to null) for super admins
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
    // We need to fetch modules to link them
    const hotelMod = await prisma.module.findUnique({ where: { code: 'HOTEL' } })
    const roomsMod = await prisma.module.findUnique({ where: { code: 'ROOMS' } })
    
    await prisma.subscriptionPlan.create({
      data: { 
        name: 'Trial Plan', 
        description: '14-day free trial with core features.',
        monthly_price: 0, 
        annual_price: 0, 
        trial_days: 14 
      }
    })
    
    await prisma.subscriptionPlan.create({
      data: { 
        name: 'Hotel Basic', 
        description: 'Basic hotel management.',
        monthly_price: 49.99, 
        annual_price: 499.99, 
        trial_days: 0,
        modules: {
          create: [
            ...(hotelMod ? [{ module_id: hotelMod.id }] : []),
            ...(roomsMod ? [{ module_id: roomsMod.id }] : [])
          ]
        }
      }
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
