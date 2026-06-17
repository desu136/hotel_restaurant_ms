import { Router, Request, Response } from 'express';
import { hash } from 'bcrypt';
import { prisma } from '../lib/prisma';

const router = Router();

const DEFAULT_ROLES = [
  { code: 'SUPER_ADMIN', name: 'Super Administrator' },
  { code: 'HOTEL_OWNER', name: 'Hotel/Restaurant Owner' },
  { code: 'HOTEL_MANAGER', name: 'Hotel Manager' },
  { code: 'RECEPTIONIST', name: 'Receptionist' },
  { code: 'RESTAURANT_MANAGER', name: 'Restaurant Manager' },
  { code: 'WAITER', name: 'Waiter' },
  { code: 'CHEF', name: 'Chef' },
  { code: 'CASHIER', name: 'Cashier' },
  { code: 'DELIVERY_DRIVER', name: 'Delivery Driver' },
];

const PERMISSIONS = [
  'tenant.create','tenant.view','tenant.update','tenant.approve','tenant.reject','tenant.suspend','tenant.activate',
  'subscription.create','subscription.update','subscription.delete','subscription.extend','subscription.grant_trial','subscription.suspend','subscription.view',
  'plan.create','plan.update','plan.delete','plan.view',
  'module.enable','module.disable','module.assign',
  'platform.settings.view','platform.settings.update','platform.analytics.view',
  'hotel.view','hotel.update',
  'branch.create','branch.view','branch.update','branch.delete',
  'employee.create','employee.view','employee.update','employee.activate','employee.deactivate',
  'role.create','role.view','role.update','role.assign',
  'report.view','analytics.view','restaurant.report.view','billing.view',
  'room.create','room.view','room.update','room.delete','room.assign','room.transfer',
  'reservation.create','reservation.view','reservation.update','reservation.confirm','reservation.cancel',
  'guest.create','guest.view','guest.update','guest.checkin','guest.checkout',
  'category.create','category.view','category.update','category.delete',
  'menu.create','menu.view','menu.update','menu.delete',
  'table.create','table.view','table.update','table.delete','table.update_status',
  'qr.create','qr.view','qr.regenerate',
  'order.create','order.view','order.update','order.cancel','order.accept','order.prepare','order.ready',
  'assigned.order.view','service.request.view','service.request.resolve','kitchen.view',
  'bill.create','bill.view','bill.update','payment.view','payment.record','transaction.view','finance.daily.view',
  'delivery.view_assigned','delivery.accept','delivery.pickup','delivery.complete','delivery.status.update',
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['tenant.create','tenant.view','tenant.update','tenant.approve','tenant.reject','tenant.suspend','tenant.activate','subscription.create','subscription.update','subscription.delete','subscription.extend','subscription.grant_trial','subscription.suspend','subscription.view','plan.create','plan.update','plan.delete','plan.view','module.enable','module.disable','module.assign','platform.settings.view','platform.settings.update','platform.analytics.view'],
  HOTEL_OWNER: ['hotel.view','hotel.update','branch.create','branch.view','branch.update','branch.delete','employee.create','employee.view','employee.update','employee.activate','employee.deactivate','role.create','role.view','role.update','role.assign','report.view','analytics.view','billing.view','subscription.view'],
  HOTEL_MANAGER: ['hotel.view','branch.view','room.create','room.view','room.update','room.delete','reservation.create','reservation.view','reservation.update','reservation.confirm','reservation.cancel','guest.create','guest.view','guest.update','report.view'],
  RECEPTIONIST: ['guest.create','guest.view','guest.update','guest.checkin','guest.checkout','reservation.create','reservation.view','reservation.update','reservation.confirm','reservation.cancel','room.assign','room.transfer'],
  RESTAURANT_MANAGER: ['category.create','category.view','category.update','category.delete','menu.create','menu.view','menu.update','menu.delete','table.create','table.view','table.update','table.delete','qr.create','qr.view','qr.regenerate','order.view','order.update','order.cancel','kitchen.view','restaurant.report.view'],
  WAITER: ['table.view','table.update_status','order.create','order.view','order.update','service.request.view','service.request.resolve','reservation.view'],
  CHEF: ['kitchen.view','order.accept','order.prepare','order.ready','assigned.order.view'],
  CASHIER: ['bill.create','bill.view','bill.update','payment.view','payment.record','transaction.view','finance.daily.view'],
  DELIVERY_DRIVER: ['delivery.view_assigned','delivery.accept','delivery.pickup','delivery.complete','delivery.status.update'],
};

// GET /api/setup/seed  – idempotent database seeding
router.get('/seed', async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Seed Roles
    const roleMap: Record<string, string> = {};
    for (const role of DEFAULT_ROLES) {
      const dbRole = await prisma.role.upsert({
        where: { code: role.code },
        update: {},
        create: { code: role.code, name: role.name },
      });
      roleMap[role.code] = dbRole.id;
    }

    // 2. Seed Permissions
    const permissionMap: Record<string, string> = {};
    for (const permCode of PERMISSIONS) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: permCode },
        update: {},
        create: { code: permCode },
      });
      permissionMap[permCode] = dbPerm.id;
    }

    // 3. Link Roles → Permissions
    for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleMap[roleCode];
      if (!roleId) continue;
      await prisma.rolePermission.deleteMany({ where: { role_id: roleId } });
      await prisma.rolePermission.createMany({
        data: permCodes
          .map(code => ({ role_id: roleId, permission_id: permissionMap[code] }))
          .filter(item => item.permission_id),
      });
    }

    // 4. System Tenant
    let systemTenant = await prisma.tenant.findFirst({ where: { business_name: 'System Admin' } });
    if (!systemTenant) {
      systemTenant = await prisma.tenant.create({
        data: { business_name: 'System Admin', owner_name: 'System', phone: '0000000000', email: 'system@hospitalityhub.com', business_type: 'HOTEL_RESTAURANT', status: 'ACTIVE' },
      });
    }

    // 5. Super Admin user
    const adminEmail = 'admin@hospitalityhub.com';
    const adminPassword = await hash('admin123', 10);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: { email: adminEmail, full_name: 'Super Admin', password_hash: adminPassword, tenant_id: systemTenant.id, status: 'ACTIVE', roles: { create: { role_id: roleMap['SUPER_ADMIN'] } } },
    });

    // 6. Subscription Plans
    const plansCount = await prisma.subscriptionPlan.count();
    if (plansCount === 0) {
      await prisma.subscriptionPlan.createMany({
        data: [
          { name: 'Trial Plan', monthly_price: 0, annual_price: 0, trial_days: 14 },
          { name: 'Basic', monthly_price: 49.99, annual_price: 499.99, trial_days: 0 },
          { name: 'Pro', monthly_price: 99.99, annual_price: 999.99, trial_days: 0 },
        ],
      });
    }

    res.json({ success: true, message: 'Seeding complete!', credentials: { email: adminEmail, password: 'admin123' } });
  } catch (error: any) {
    console.error('Seeding failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
