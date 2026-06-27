/**
 * seed_admin.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds ONLY the core system-level data required for the platform to operate.
 * Run this independently from the full seed to reset or restore admin access
 * without touching any business tenant data.
 *
 * Includes:
 *  - All roles & permissions (upserted – safe to re-run)
 *  - System Admin tenant (idempotent)
 *  - Super Admin user (resets password if user already exists)
 *  - Default subscription plans (skipped if already present)
 *
 * Usage:
 *   npx tsx scripts/seed_admin.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient({ log: ['error', 'warn'] })

// ─── ROLES ────────────────────────────────────────────────────────────────────

const DEFAULT_ROLES = [
  { code: 'SUPER_ADMIN',        name: 'Super Administrator' },
  { code: 'HOTEL_OWNER',        name: 'Hotel/Restaurant Owner' },
  { code: 'HOTEL_MANAGER',      name: 'Hotel Manager' },
  { code: 'RECEPTIONIST',       name: 'Receptionist' },
  { code: 'RESTAURANT_MANAGER', name: 'Restaurant Manager' },
  { code: 'WAITER',             name: 'Waiter' },
  { code: 'CHEF',               name: 'Chef' },
  { code: 'CASHIER',            name: 'Cashier' },
  { code: 'DELIVERY_DRIVER',    name: 'Delivery Driver' },
]

// ─── PERMISSIONS ──────────────────────────────────────────────────────────────

const PERMISSIONS = [
  // Tenant management
  'tenant.create', 'tenant.view', 'tenant.update', 'tenant.approve',
  'tenant.reject', 'tenant.suspend', 'tenant.activate',
  // Subscriptions & Plans
  'subscription.create', 'subscription.update', 'subscription.delete',
  'subscription.extend', 'subscription.grant_trial', 'subscription.suspend', 'subscription.view',
  'plan.create', 'plan.update', 'plan.delete', 'plan.view',
  // Module management
  'module.enable', 'module.disable', 'module.assign',
  // Platform settings
  'platform.settings.view', 'platform.settings.update', 'platform.analytics.view',
  // Organization
  'hotel.view', 'hotel.update',
  'branch.create', 'branch.view', 'branch.update', 'branch.delete',
  // Staff
  'employee.create', 'employee.view', 'employee.update',
  'employee.activate', 'employee.deactivate',
  // Roles
  'role.create', 'role.view', 'role.update', 'role.assign',
  // Reporting
  'report.view', 'analytics.view', 'restaurant.report.view',
  // Billing
  'billing.view',
  // Hotel/Room
  'room.create', 'room.view', 'room.update', 'room.delete', 'room.assign', 'room.transfer',
  'reservation.create', 'reservation.view', 'reservation.update',
  'reservation.confirm', 'reservation.cancel',
  'guest.create', 'guest.view', 'guest.update', 'guest.checkin', 'guest.checkout',
  // Restaurant
  'category.create', 'category.view', 'category.update', 'category.delete',
  'menu.create', 'menu.view', 'menu.update', 'menu.delete',
  'table.create', 'table.view', 'table.update', 'table.delete', 'table.update_status',
  'qr.create', 'qr.view', 'qr.regenerate',
  'order.create', 'order.view', 'order.update', 'order.cancel',
  'order.accept', 'order.prepare', 'order.ready',
  'assigned.order.view', 'service.request.view', 'service.request.resolve',
  'kitchen.view',
  // Cashier
  'bill.create', 'bill.view', 'bill.update',
  'payment.view', 'payment.record',
  'transaction.view', 'finance.daily.view',
  // Delivery
  'delivery.view_assigned', 'delivery.accept', 'delivery.pickup',
  'delivery.complete', 'delivery.status.update',
]

// ─── ROLE → PERMISSION MAPPINGS ───────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'tenant.create', 'tenant.view', 'tenant.update', 'tenant.approve',
    'tenant.reject', 'tenant.suspend', 'tenant.activate',
    'subscription.create', 'subscription.update', 'subscription.delete',
    'subscription.extend', 'subscription.grant_trial', 'subscription.suspend', 'subscription.view',
    'plan.create', 'plan.update', 'plan.delete', 'plan.view',
    'module.enable', 'module.disable', 'module.assign',
    'platform.settings.view', 'platform.settings.update', 'platform.analytics.view',
  ],
  HOTEL_OWNER: [
    'hotel.view', 'hotel.update',
    'branch.create', 'branch.view', 'branch.update', 'branch.delete',
    'employee.create', 'employee.view', 'employee.update',
    'employee.activate', 'employee.deactivate',
    'role.create', 'role.view', 'role.update', 'role.assign',
    'report.view', 'analytics.view',
    'billing.view', 'subscription.view',
  ],
  HOTEL_MANAGER: [
    'hotel.view', 'branch.view',
    'room.create', 'room.view', 'room.update', 'room.delete',
    'reservation.create', 'reservation.view', 'reservation.update',
    'reservation.confirm', 'reservation.cancel',
    'guest.create', 'guest.view', 'guest.update',
    'report.view',
  ],
  RECEPTIONIST: [
    'guest.create', 'guest.view', 'guest.update', 'guest.checkin', 'guest.checkout',
    'reservation.create', 'reservation.view', 'reservation.update',
    'reservation.confirm', 'reservation.cancel',
    'room.assign', 'room.transfer',
  ],
  RESTAURANT_MANAGER: [
    'category.create', 'category.view', 'category.update', 'category.delete',
    'menu.create', 'menu.view', 'menu.update', 'menu.delete',
    'table.create', 'table.view', 'table.update', 'table.delete',
    'qr.create', 'qr.view', 'qr.regenerate',
    'order.view', 'order.update', 'order.cancel',
    'kitchen.view', 'restaurant.report.view',
  ],
  WAITER: [
    'table.view', 'table.update_status',
    'order.create', 'order.view', 'order.update',
    'service.request.view', 'service.request.resolve',
    'reservation.view',
  ],
  CHEF: [
    'kitchen.view',
    'order.accept', 'order.prepare', 'order.ready',
    'assigned.order.view',
  ],
  CASHIER: [
    'bill.create', 'bill.view', 'bill.update',
    'payment.view', 'payment.record',
    'transaction.view', 'finance.daily.view',
  ],
  DELIVERY_DRIVER: [
    'delivery.view_assigned', 'delivery.accept', 'delivery.pickup',
    'delivery.complete', 'delivery.status.update',
  ],
}

// ─── SUPER ADMIN CREDENTIALS ──────────────────────────────────────────────────

const ADMIN_EMAIL    = 'admin@hospitalityhub.com'
const ADMIN_PASSWORD = 'admin123'
const ADMIN_NAME     = 'Super Admin'

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔧 HospitalityHub — System Admin Seed')
  console.log('══════════════════════════════════════\n')

  // 1. Roles
  console.log('① Seeding roles...')
  const roleMap: Record<string, string> = {}
  for (const role of DEFAULT_ROLES) {
    const r = await prisma.role.upsert({
      where:  { code: role.code },
      update: { name: role.name },
      create: { code: role.code, name: role.name },
    })
    roleMap[role.code] = r.id
  }
  console.log(`   ✓ ${DEFAULT_ROLES.length} roles upserted`)

  // 2. Permissions
  console.log('② Seeding permissions...')
  const permMap: Record<string, string> = {}
  for (const code of PERMISSIONS) {
    const p = await prisma.permission.upsert({
      where:  { code },
      update: {},
      create: { code },
    })
    permMap[code] = p.id
  }
  console.log(`   ✓ ${PERMISSIONS.length} permissions upserted`)

  // 3. Role ↔ Permission links
  console.log('③ Linking roles to permissions...')
  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleCode]
    if (!roleId) continue
    await prisma.rolePermission.deleteMany({ where: { role_id: roleId } })
    await prisma.rolePermission.createMany({
      data: permCodes
        .map(code => ({ role_id: roleId, permission_id: permMap[code] }))
        .filter(item => !!item.permission_id),
    })
  }
  console.log('   ✓ Role permissions applied')

  // 4. System Tenant
  console.log('④ Ensuring System Admin tenant...')
  let systemTenant = await prisma.tenant.findFirst({
    where: { business_name: 'System Admin' },
  })
  if (!systemTenant) {
    systemTenant = await prisma.tenant.create({
      data: {
        business_name: 'System Admin',
        owner_name:    'System',
        phone:         '0000000000',
        email:         'system@hospitalityhub.com',
        business_type: 'HOTEL_RESTAURANT',
        status:        'ACTIVE',
      },
    })
    console.log('   ✓ System Admin tenant created')
  } else {
    console.log('   ✓ System Admin tenant already exists — skipped')
  }

  // 5. Super Admin user (reset password if already exists)
  console.log('⑤ Seeding / resetting Super Admin user...')
  const passwordHash = await hash(ADMIN_PASSWORD, 10)

  const existingAdmin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (existingAdmin) {
    // Reset password & ensure ACTIVE status
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data:  { password_hash: passwordHash, status: 'ACTIVE', tenant_id: systemTenant.id },
    })
    // Ensure SUPER_ADMIN role is assigned
    const alreadyHasRole = await prisma.userRole.findFirst({
      where: { user_id: existingAdmin.id, role_id: roleMap['SUPER_ADMIN'] },
    })
    if (!alreadyHasRole) {
      await prisma.userRole.create({
        data: { user_id: existingAdmin.id, role_id: roleMap['SUPER_ADMIN'] },
      })
    }
    console.log('   ✓ Super Admin password reset to admin123')
  } else {
    await prisma.user.create({
      data: {
        email:         ADMIN_EMAIL,
        full_name:     ADMIN_NAME,
        password_hash: passwordHash,
        tenant_id:     systemTenant.id,
        status:        'ACTIVE',
        roles: { create: { role_id: roleMap['SUPER_ADMIN'] } },
      },
    })
    console.log('   ✓ Super Admin user created')
  }

  // 6. Subscription Plans
  console.log('⑥ Ensuring subscription plans...')
  const plans = [
    { name: 'Trial Plan', monthly_price: 0,     annual_price: 0,      trial_days: 14 },
    { name: 'Basic',      monthly_price: 49.99,  annual_price: 499.99, trial_days: 0  },
    { name: 'Pro',        monthly_price: 99.99,  annual_price: 999.99, trial_days: 0  },
    { name: 'Enterprise', monthly_price: 199.99, annual_price: 1999.99, trial_days: 0 },
  ]
  let newPlans = 0
  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({ where: { name: plan.name } })
    if (!existing) {
      await prisma.subscriptionPlan.create({ data: plan })
      newPlans++
    }
  }
  console.log(`   ✓ ${newPlans} new plan(s) created (existing ones preserved)`)

  // ─── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════')
  console.log('✅ System Admin Seed Complete!\n')
  console.log('📋 Super Admin Login Credentials:')
  console.log(`   Email:    ${ADMIN_EMAIL}`)
  console.log(`   Password: ${ADMIN_PASSWORD}\n`)
  console.log('ℹ️  No business tenant data was touched.')
  console.log('══════════════════════════════════════\n')
}

main()
  .catch(e => {
    console.error('\n❌ Seed failed:', e.message ?? e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
