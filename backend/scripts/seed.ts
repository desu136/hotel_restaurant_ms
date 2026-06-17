import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient({
  log: ['info', 'query', 'error', 'warn']
})

const DEFAULT_ROLES = [
  { code: 'SUPER_ADMIN', name: 'Super Administrator' },
  { code: 'HOTEL_OWNER', name: 'Hotel/Restaurant Owner' },
  { code: 'HOTEL_MANAGER', name: 'Hotel Manager' },
  { code: 'RECEPTIONIST', name: 'Receptionist' },
  { code: 'RESTAURANT_MANAGER', name: 'Restaurant Manager' },
  { code: 'WAITER', name: 'Waiter' },
  { code: 'CHEF', name: 'Chef' },
  { code: 'CASHIER', name: 'Cashier' },
  { code: 'DELIVERY_DRIVER', name: 'Delivery Driver' }
]

const PERMISSIONS = [
  // Tenant management
  'tenant.create', 'tenant.view', 'tenant.update', 'tenant.approve', 'tenant.reject', 'tenant.suspend', 'tenant.activate',
  // Subscriptions & Plans
  'subscription.create', 'subscription.update', 'subscription.delete', 'subscription.extend', 'subscription.grant_trial', 'subscription.suspend', 'subscription.view',
  'plan.create', 'plan.update', 'plan.delete', 'plan.view',
  // Module management
  'module.enable', 'module.disable', 'module.assign',
  // Platform settings
  'platform.settings.view', 'platform.settings.update', 'platform.analytics.view',
  
  // Organization Management
  'hotel.view', 'hotel.update',
  'branch.create', 'branch.view', 'branch.update', 'branch.delete',
  // Staff Management
  'employee.create', 'employee.view', 'employee.update', 'employee.activate', 'employee.deactivate',
  // Role Management
  'role.create', 'role.view', 'role.update', 'role.assign',
  // Reporting & Analytics
  'report.view', 'analytics.view', 'restaurant.report.view',
  // Billing
  'billing.view',
  
  // Hotel Modules (Room & Guest)
  'room.create', 'room.view', 'room.update', 'room.delete', 'room.assign', 'room.transfer',
  'reservation.create', 'reservation.view', 'reservation.update', 'reservation.confirm', 'reservation.cancel',
  'guest.create', 'guest.view', 'guest.update', 'guest.checkin', 'guest.checkout',
  
  // Restaurant Modules
  'category.create', 'category.view', 'category.update', 'category.delete',
  'menu.create', 'menu.view', 'menu.update', 'menu.delete',
  'table.create', 'table.view', 'table.update', 'table.delete', 'table.update_status',
  'qr.create', 'qr.view', 'qr.regenerate',
  'order.create', 'order.view', 'order.update', 'order.cancel', 'order.accept', 'order.prepare', 'order.ready',
  'assigned.order.view', 'service.request.view', 'service.request.resolve',
  'kitchen.view',
  
  // Cashier Billing
  'bill.create', 'bill.view', 'bill.update',
  'payment.view', 'payment.record',
  'transaction.view', 'finance.daily.view',
  
  // Delivery
  'delivery.view_assigned', 'delivery.accept', 'delivery.pickup', 'delivery.complete', 'delivery.status.update'
]

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'tenant.create', 'tenant.view', 'tenant.update', 'tenant.approve', 'tenant.reject', 'tenant.suspend', 'tenant.activate',
    'subscription.create', 'subscription.update', 'subscription.delete', 'subscription.extend', 'subscription.grant_trial', 'subscription.suspend', 'subscription.view',
    'plan.create', 'plan.update', 'plan.delete', 'plan.view',
    'module.enable', 'module.disable', 'module.assign',
    'platform.settings.view', 'platform.settings.update', 'platform.analytics.view'
  ],
  HOTEL_OWNER: [
    'hotel.view', 'hotel.update',
    'branch.create', 'branch.view', 'branch.update', 'branch.delete',
    'employee.create', 'employee.view', 'employee.update', 'employee.activate', 'employee.deactivate',
    'role.create', 'role.view', 'role.update', 'role.assign',
    'report.view', 'analytics.view',
    'billing.view', 'subscription.view'
  ],
  HOTEL_MANAGER: [
    'hotel.view', 'branch.view',
    'room.create', 'room.view', 'room.update', 'room.delete',
    'reservation.create', 'reservation.view', 'reservation.update', 'reservation.confirm', 'reservation.cancel',
    'guest.create', 'guest.view', 'guest.update',
    'report.view'
  ],
  RECEPTIONIST: [
    'guest.create', 'guest.view', 'guest.update', 'guest.checkin', 'guest.checkout',
    'reservation.create', 'reservation.view', 'reservation.update', 'reservation.confirm', 'reservation.cancel',
    'room.assign', 'room.transfer'
  ],
  RESTAURANT_MANAGER: [
    'category.create', 'category.view', 'category.update', 'category.delete',
    'menu.create', 'menu.view', 'menu.update', 'menu.delete',
    'table.create', 'table.view', 'table.update', 'table.delete',
    'qr.create', 'qr.view', 'qr.regenerate',
    'order.view', 'order.update', 'order.cancel',
    'kitchen.view',
    'restaurant.report.view'
  ],
  WAITER: [
    'table.view', 'table.update_status',
    'order.create', 'order.view', 'order.update',
    'service.request.view', 'service.request.resolve',
    'reservation.view'
  ],
  CHEF: [
    'kitchen.view',
    'order.accept', 'order.prepare', 'order.ready',
    'assigned.order.view'
  ],
  CASHIER: [
    'bill.create', 'bill.view', 'bill.update',
    'payment.view', 'payment.record',
    'transaction.view', 'finance.daily.view'
  ],
  DELIVERY_DRIVER: [
    'delivery.view_assigned', 'delivery.accept', 'delivery.pickup', 'delivery.complete', 'delivery.status.update'
  ]
}

async function main() {
  console.log("Starting database seeding...")

  // 1. Seed Roles
  console.log("Seeding default roles...")
  const roleMap: Record<string, string> = {}
  for (const role of DEFAULT_ROLES) {
    const dbRole = await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: {
        code: role.code,
        name: role.name
      }
    })
    roleMap[role.code] = dbRole.id
  }

  // 2. Seed Permissions
  console.log("Seeding default permissions...")
  const permissionMap: Record<string, string> = {}
  for (const permCode of PERMISSIONS) {
    const dbPerm = await prisma.permission.upsert({
      where: { code: permCode },
      update: {},
      create: { code: permCode }
    })
    permissionMap[permCode] = dbPerm.id
  }

  // 3. Link Roles to Permissions
  console.log("Linking roles to permissions...")
  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleCode]
    if (!roleId) continue

    // Clear existing permissions for this role to avoid duplicates or outdated sets
    await prisma.rolePermission.deleteMany({
      where: { role_id: roleId }
    })

    // Create new relations
    await prisma.rolePermission.createMany({
      data: permCodes.map(code => ({
        role_id: roleId,
        permission_id: permissionMap[code]
      })).filter(item => item.permission_id !== undefined)
    })
  }

  // 4. Create the SYSTEM Tenant
  console.log("Seeding SYSTEM tenant...")
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

  // 5. Create Default Super Admin User
  console.log("Seeding SUPER_ADMIN user...")
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
          role_id: roleMap['SUPER_ADMIN']
        }
      }
    },
  })

  // 6. Create Default Subscription Plans (if not exist)
  console.log("Seeding default subscription plans...")
  let trialPlan = await prisma.subscriptionPlan.findFirst({
    where: { name: 'Trial Plan' }
  })
  if (!trialPlan) {
    trialPlan = await prisma.subscriptionPlan.create({
      data: { name: 'Trial Plan', monthly_price: 0, annual_price: 0, trial_days: 14 }
    })
  }

  const plansCount = await prisma.subscriptionPlan.count()
  if (plansCount <= 1) {
    await prisma.subscriptionPlan.createMany({
      data: [
        { name: 'Basic', monthly_price: 49.99, annual_price: 499.99, trial_days: 0 },
        { name: 'Pro', monthly_price: 99.99, annual_price: 999.99, trial_days: 0 }
      ]
    })
  }

  // 7. Create Demo Hotel Owner Tenant (Release 2 testing)
  console.log("Seeding Hotel Owner demo tenant & user...")
  let hotelTenant = await prisma.tenant.findFirst({
    where: { email: 'owner@grandhorizon.com' }
  })

  if (!hotelTenant) {
    hotelTenant = await prisma.tenant.create({
      data: {
        business_name: 'Grand Horizon Hotel',
        owner_name: 'John Doe',
        phone: '1234567890',
        email: 'owner@grandhorizon.com',
        business_type: 'HOTEL',
        status: 'ACTIVE',
      }
    })

    // Create a Trial Subscription for the hotel owner
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + trialPlan.trial_days)

    await prisma.tenantSubscription.create({
      data: {
        tenant_id: hotelTenant.id,
        plan_id: trialPlan.id,
        start_date: startDate,
        end_date: endDate,
        status: 'TRIAL'
      }
    })
  }

  const ownerEmail = 'owner@grandhorizon.com'
  const ownerPassword = await hash('owner123', 10)

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      full_name: 'John Doe (Owner)',
      password_hash: ownerPassword,
      tenant_id: hotelTenant.id,
      status: 'ACTIVE',
      roles: {
        create: {
          role_id: roleMap['HOTEL_OWNER']
        }
      }
    }
  })

  // Create a default branch for this tenant
  let defaultBranch = await prisma.branch.findFirst({
    where: { tenant_id: hotelTenant.id }
  })
  if (!defaultBranch) {
    defaultBranch = await prisma.branch.create({
      data: {
        tenant_id: hotelTenant.id,
        name: 'Main Branch',
        address: 'Addis Ababa, Ethiopia',
        phone: '1234567890'
      }
    })
  }

  // Create test staff accounts for role-specific dashboards
  const staffRoles = [
    { email: 'manager@grandhorizon.com', name: 'Alice Manager', role: 'HOTEL_MANAGER', password: 'manager123' },
    { email: 'waiter@grandhorizon.com', name: 'Bob Waiter', role: 'WAITER', password: 'waiter123' },
    { email: 'chef@grandhorizon.com', name: 'Charlie Chef', role: 'CHEF', password: 'chef123' },
    { email: 'cashier@grandhorizon.com', name: 'David Cashier', role: 'CASHIER', password: 'cashier123' },
  ]

  for (const staff of staffRoles) {
    const passwordHash = await hash(staff.password, 10)
    await prisma.user.upsert({
      where: { email: staff.email },
      update: {},
      create: {
        email: staff.email,
        full_name: staff.name,
        password_hash: passwordHash,
        tenant_id: hotelTenant.id,
        branch_id: defaultBranch.id,
        status: 'ACTIVE',
        roles: {
          create: {
            role_id: roleMap[staff.role]
          }
        }
      }
    })
  }

  // 8. Seed a demo Restaurant, Categories, Menu Items and Tables
  console.log("Seeding demo restaurant data...")
  let demoRestaurant = await prisma.restaurant.findFirst({
    where: { tenant_id: hotelTenant.id }
  })
  if (!demoRestaurant) {
    demoRestaurant = await prisma.restaurant.create({
      data: {
        tenant_id: hotelTenant.id,
        branch_id: defaultBranch.id,
        name: 'Grand Horizon Bistro'
      }
    })
  }

  // Categories
  const categoryData = ['Appetizers', 'Mains', 'Drinks', 'Desserts']
  const categoryMap: Record<string, string> = {}
  for (const catName of categoryData) {
    const existing = await prisma.category.findFirst({
      where: { tenant_id: hotelTenant.id, name: catName }
    })
    const cat = existing ?? await prisma.category.create({
      data: { tenant_id: hotelTenant.id, restaurant_id: demoRestaurant.id, name: catName }
    })
    categoryMap[catName] = cat.id
  }

  // Menu Items (using Dexel product IDs as placeholders)
  const menuItems = [
    { name: 'Truffle Fries', dexel_id: 'DEXEL-001', category: 'Appetizers' },
    { name: 'Crispy Calamari', dexel_id: 'DEXEL-002', category: 'Appetizers' },
    { name: 'Grand Horizon Burger', dexel_id: 'DEXEL-003', category: 'Mains' },
    { name: 'Pan-Seared Salmon', dexel_id: 'DEXEL-004', category: 'Mains' },
    { name: 'Wild Mushroom Risotto', dexel_id: 'DEXEL-005', category: 'Mains' },
    { name: 'Craft IPA Beer', dexel_id: 'DEXEL-006', category: 'Drinks' },
    { name: 'Chardonnay White Wine', dexel_id: 'DEXEL-007', category: 'Drinks' },
    { name: 'Lava Chocolate Cake', dexel_id: 'DEXEL-008', category: 'Desserts' },
  ]
  for (const item of menuItems) {
    const existing = await prisma.menuItem.findFirst({
      where: { tenant_id: hotelTenant.id, dexel_product_id: item.dexel_id }
    })
    if (!existing) {
      await prisma.menuItem.create({
        data: {
          tenant_id: hotelTenant.id,
          restaurant_id: demoRestaurant.id,
          dexel_product_id: item.dexel_id,
          display_name: item.name,
          availability: true
        }
      })
    }
  }

  // Tables
  const tableData = [
    { number: '101', capacity: 2 }, { number: '102', capacity: 4 },
    { number: '103', capacity: 4 }, { number: '104', capacity: 6 },
    { number: '105', capacity: 2 }, { number: '201', capacity: 8 },
    { number: '202', capacity: 4 }, { number: '203', capacity: 4 },
  ]
  for (const t of tableData) {
    const existing = await prisma.restaurantTable.findFirst({
      where: { tenant_id: hotelTenant.id, table_number: t.number }
    })
    if (!existing) {
      await prisma.restaurantTable.create({
        data: {
          tenant_id: hotelTenant.id,
          restaurant_id: demoRestaurant.id,
          table_number: t.number,
          capacity: t.capacity
        }
      })
    }
  }

  console.log("✅ Seeding complete!")
  console.log(`\nSuper Admin Login:\nEmail: ${adminEmail}\nPassword: admin123\n`)
  console.log(`Hotel Owner Login:\nEmail: ${ownerEmail}\nPassword: owner123\n`)
  for (const staff of staffRoles) {
    console.log(`${staff.role} Login:\nEmail: ${staff.email}\nPassword: ${staff.password}\n`)
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
