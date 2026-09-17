import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import bcrypt from 'bcrypt';
import { BusinessType, TenantStatus } from '@prisma/client';
import { coerceEthiopianPhone } from '../lib/ethiopian-phone';

const router = Router();

// All tenants routes require SUPER_ADMIN
router.use(authenticate, requireRole('SUPER_ADMIN'));

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// GET /api/tenants  — with search/status/business_type filters + pagination
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = (req.query.search as string) ?? '';
    const status = req.query.status as string | undefined;
    const business_type = req.query.business_type as string | undefined;
    const page = parseInt(req.query.page as string ?? '1');
    const limit = parseInt(req.query.limit as string ?? '10');

    const where: any = {};
    if (search) {
      where.OR = [
        { business_name: { contains: search, mode: 'insensitive' } },
        { owner_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (business_type) where.business_type = business_type;

    const [total, tenants] = await Promise.all([
      prisma.tenant.count({ where }),
      prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          subscriptions: {
            include: { plan: true },
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    res.json({ data: tenants, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('GET /api/tenants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tenants  — admin-initiated tenant creation with owner account
router.post('/', async (req: Request, res: Response): Promise<void> => {
  let tenantId: string | null = null;

  try {
    const { business_name, owner_name, email, phone, business_type, address, license_info, tax_info, password } = req.body;

    if (!business_name || !owner_name || !email || !phone || !business_type) {
      res.status(400).json({ error: 'business_name, owner_name, email, phone, and business_type are required' });
      return;
    }

    const parsedPhone = coerceEthiopianPhone(phone, true);
    if (!parsedPhone.ok) {
      res.status(400).json({ error: parsedPhone.error });
      return;
    }
    const storedPhone = parsedPhone.phone!;

    const DEFAULT_PASSWORD = password || 'Welcome@1234';
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const cleanEmail = email.trim().toLowerCase();

    // ── Step 1: Create tenant ────────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: {
        business_name,
        owner_name,
        email: cleanEmail,
        phone: storedPhone,
        business_type: business_type as BusinessType,
        address,
        license_info,
        tax_info,
        status: 'ACTIVE' as TenantStatus,
      },
    });
    tenantId = tenant.id;

    // ── Step 2: Get owner role ───────────────────────────────────────────────
    let ownerRole = await prisma.role.findFirst({
      where: { code: 'HOTEL_OWNER' }
    });
    if (!ownerRole) {
      ownerRole = await prisma.role.create({
        data: { code: 'HOTEL_OWNER', name: 'Owner' }
      });
    }

    // ── Step 3: Create or update owner user account ───────────────────────────
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });

    if (existingUser) {
      const userUpdateData: any = {
        tenant_id: tenant.id,
        full_name: owner_name,
        email: cleanEmail,
        phone: storedPhone,
        status: 'ACTIVE',
      };
      if (password || !existingUser.password_hash) {
        userUpdateData.password_hash = passwordHash;
      }
      await prisma.user.update({
        where: { id: existingUser.id },
        data: userUpdateData,
      });
      const hasRole = await prisma.userRole.findFirst({
        where: { user_id: existingUser.id, role_id: ownerRole.id },
      });
      if (!hasRole) {
        await prisma.userRole.create({
          data: { user_id: existingUser.id, role_id: ownerRole.id },
        });
      }
    } else {
      await prisma.user.create({
        data: {
          tenant_id: tenant.id,
          full_name: owner_name,
          email: cleanEmail,
          phone: storedPhone,
          password_hash: passwordHash,
          status: 'ACTIVE',
          roles: { create: { role_id: ownerRole.id } },
        },
      });
    }

    // ── Step 4: Attach a trial subscription ──────────────────────────────────
    let plan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Trial Plan' } });
    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: { name: 'Trial Plan', monthly_price: 0, annual_price: 0, trial_days: 14 },
      });
    }
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.trial_days);
    await prisma.tenantSubscription.create({
      data: { tenant_id: tenant.id, plan_id: plan.id, start_date: startDate, end_date: endDate, status: 'TRIAL' },
    });

    // ── Step 5: Auto-create root restaurant brand profile ────────────────────
    await prisma.restaurant.create({
      data: { tenant_id: tenant.id, name: business_name, parent_id: null },
    });

    res.status(201).json({
      success: true,
      tenant,
      owner_credentials: {
        email,
        temporary_password: DEFAULT_PASSWORD,
        message: 'Please share these credentials with the business owner. They must change the password after first login.',
      },
    });
  } catch (error: any) {
    console.error('POST /api/tenants error:', error);

    // Best-effort cleanup on failure
    if (tenantId) {
      try { await prisma.tenant.delete({ where: { id: tenantId } }); }
      catch (cleanupErr) { console.error('Admin tenant cleanup error:', cleanupErr); }
    }

    if (error.code === 'P2002') {
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tenants/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id as string },
      include: {
        subscriptions: { include: { plan: true }, orderBy: { created_at: 'desc' } },
        modules: { include: { module: true } },
        users: { where: { status: 'ACTIVE' }, take: 1 },
      },
    });
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    res.json(tenant);
  } catch (error) {
    console.error('GET /api/tenants/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/tenants/:id  — update status or any field
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const { business_name, owner_name, email, phone, business_type, address, license_info, tax_info, status } = req.body;
    let storedPhone: string | undefined;
    if (phone !== undefined) {
      const parsedPhone = coerceEthiopianPhone(phone, false);
      if (!parsedPhone.ok) {
        res.status(400).json({ error: parsedPhone.error });
        return;
      }
      storedPhone = parsedPhone.phone ?? undefined;
    }
    const updated = await prisma.tenant.update({
      where: { id: req.params.id as string },
      data: {
        ...(business_name !== undefined && { business_name }),
        ...(owner_name !== undefined && { owner_name }),
        ...(email !== undefined && { email }),
        ...(storedPhone !== undefined && { phone: storedPhone }),
        ...(address !== undefined && { address }),
        ...(license_info !== undefined && { license_info }),
        ...(tax_info !== undefined && { tax_info }),
        ...(business_type !== undefined && { business_type: business_type as BusinessType }),
        ...(status !== undefined && { status: status as TenantStatus }),
      },
    });
    res.json({ success: true, tenant: updated });
  } catch (error: any) {
    console.error('PATCH /api/tenants/:id error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tenants/:id/approve  — full activation flow from remote branch
router.post('/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const tenantId = req.params.id as string;
    const { plan_id } = req.body;
    const actorUserId = req.user!.userId;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    if (tenant.status === 'ACTIVE') {
      res.status(400).json({ error: 'Tenant is already active' });
      return;
    }

    // Resolve plan
    const plan = plan_id
      ? await prisma.subscriptionPlan.findUnique({ where: { id: plan_id }, include: { modules: true } })
      : await prisma.subscriptionPlan.findFirst({ where: { name: 'Trial Plan' }, include: { modules: true } });

    if (!plan) {
      res.status(404).json({ error: 'Subscription plan not found' });
      return;
    }

    // Resolve role (fallback to HOTEL_OWNER / TENANT_ADMIN, or auto-create HOTEL_OWNER if missing)
    let role = await prisma.role.findFirst({
      where: { code: { in: ['HOTEL_OWNER', 'TENANT_ADMIN'] } }
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          code: 'HOTEL_OWNER',
          name: 'Owner',
        }
      });
    }

    const roleIdToAssign = role.id;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (plan.trial_days > 0 ? plan.trial_days : 30));

    // Always generate a fresh temp password on approval so admin has credentials to share
    const tempPassword = 'Welcome@1234';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Activate tenant
      const updatedTenant = await tx.tenant.update({
        where: { id: tenantId },
        data: { status: 'ACTIVE' },
      });

      // 2. Create subscription
      await tx.tenantSubscription.create({
        data: {
          tenant_id: tenantId,
          plan_id: plan.id,
          start_date: startDate,
          end_date: endDate,
          status: plan.trial_days > 0 ? 'TRIAL' : 'ACTIVE',
        },
      });

      // 3. Assign modules (skip duplicates)
      for (const planModule of (plan as any).modules) {
        const exists = await tx.tenantModule.findFirst({
          where: { tenant_id: tenantId, module_id: planModule.module_id },
        });
        if (!exists) {
          await tx.tenantModule.create({
            data: { tenant_id: tenantId, module_id: planModule.module_id, enabled: true },
          });
        }
      }

      // 4. User: activate existing user (PRESERVING their registration password) or create new user if missing
      const cleanTenantEmail = tenant.email.trim().toLowerCase();
      const existingUser = await tx.user.findFirst({
        where: { email: { equals: cleanTenantEmail, mode: 'insensitive' } },
      });
      if (existingUser) {
        // Activate account while preserving password set during self registration
        const userUpdateData: any = { status: 'ACTIVE', tenant_id: tenantId };
        if (!existingUser.password_hash) {
          userUpdateData.password_hash = passwordHash;
        }
        await tx.user.update({
          where: { id: existingUser.id },
          data: userUpdateData,
        });
        // Ensure they have the HOTEL_OWNER role
        const hasRole = await tx.userRole.findFirst({
          where: { user_id: existingUser.id, role_id: roleIdToAssign },
        });
        if (!hasRole) {
          await tx.userRole.create({
            data: { user_id: existingUser.id, role_id: roleIdToAssign },
          });
        }
      } else {
        await tx.user.create({
          data: {
            tenant_id: tenantId,
            full_name: tenant.owner_name,
            email: tenant.email,
            phone: tenant.phone,
            password_hash: passwordHash,
            status: 'ACTIVE',
            roles: { create: { role_id: roleIdToAssign } },
          },
        });
      }

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          user_id: actorUserId,
          tenant_id: tenantId,
          action: 'TENANT_APPROVED',
          resource: 'Tenant',
        },
      });

      return { updatedTenant, userEmail: tenant.email, tempPassword };
    }, { timeout: 30000 });

    res.json({
      success: true,
      message: 'Tenant approved successfully',
      tenant: result.updatedTenant,
      credentials: {
        email: result.userEmail,
        password: tempPassword,
        message: 'Share these credentials with the business owner. They should change the password after first login.',
      },
    });
  } catch (error: any) {
    console.error('POST /api/tenants/:id/approve error:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/tenants/:id  — permanently delete a tenant and all its data
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id as string } });
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    const tenantId = req.params.id as string;
    await prisma.$transaction(async (tx) => {
      // 1. Delete user roles for all users belonging to this tenant
      const tenantUsers = await tx.user.findMany({ where: { tenant_id: tenantId }, select: { id: true } });
      const userIds = tenantUsers.map(u => u.id);
      if (userIds.length > 0) {
        await tx.userRole.deleteMany({ where: { user_id: { in: userIds } } });
      }

      // 2. Delete all users belonging to this tenant
      await tx.user.deleteMany({ where: { tenant_id: tenantId } });

      // 3. Delete order items for orders belonging to this tenant
      const tenantOrders = await tx.order.findMany({ where: { tenant_id: tenantId }, select: { id: true } });
      const orderIds = tenantOrders.map(o => o.id);
      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({ where: { order_id: { in: orderIds } } });
      }

      // 4. Delete orders
      await tx.order.deleteMany({ where: { tenant_id: tenantId } });

      // 5. Delete QR codes for tables belonging to this tenant
      const tenantTables = await tx.restaurantTable.findMany({ where: { tenant_id: tenantId }, select: { id: true } });
      const tableIds = tenantTables.map(t => t.id);
      if (tableIds.length > 0) {
        await tx.qRCode.deleteMany({ where: { table_id: { in: tableIds } } });
      }

      // 6. Delete tables, promotions, reservations, rooms, room_types
      await tx.restaurantTable.deleteMany({ where: { tenant_id: tenantId } });
      await tx.promotion.deleteMany({ where: { tenant_id: tenantId } });
      await tx.reservation.deleteMany({ where: { tenant_id: tenantId } });
      await tx.room.deleteMany({ where: { tenant_id: tenantId } });
      await tx.roomType.deleteMany({ where: { tenant_id: tenantId } });

      // 7. Delete menu items & master menu items
      await tx.menuItem.deleteMany({ where: { tenant_id: tenantId } });
      await tx.masterMenuItem.deleteMany({ where: { tenant_id: tenantId } });

      // 8. Delete categories & master categories
      await tx.category.deleteMany({ where: { tenant_id: tenantId } });
      await tx.masterCategory.deleteMany({ where: { tenant_id: tenantId } });

      // 9. Delete branches & restaurants
      await tx.branch.deleteMany({ where: { tenant_id: tenantId } });
      await tx.restaurant.deleteMany({ where: { tenant_id: tenantId } });

      // 10. Delete subscriptions, modules, and logs
      await tx.tenantSubscription.deleteMany({ where: { tenant_id: tenantId } });
      await tx.tenantModule.deleteMany({ where: { tenant_id: tenantId } });
      await tx.auditLog.deleteMany({ where: { tenant_id: tenantId } });
      await tx.activityLog.deleteMany({ where: { tenant_id: tenantId } });
      await tx.dexelSyncLog.deleteMany({ where: { tenant_id: tenantId } });

      // 11. Delete the tenant record itself
      await tx.tenant.delete({ where: { id: tenantId } });
    }, { timeout: 60000 });

    res.json({ success: true, message: `Tenant "${tenant.business_name}" and all associated accounts/data have been permanently deleted.` });
  } catch (error: any) {
    console.error('DELETE /api/tenants/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
