import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import bcrypt from 'bcrypt';
import { BusinessType, TenantStatus } from '@prisma/client';

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

// POST /api/tenants  — admin-initiated tenant creation
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { business_name, owner_name, email, phone, business_type, address, license_info, tax_info } = req.body;
    const tenant = await prisma.tenant.create({
      data: {
        business_name,
        owner_name,
        email,
        phone,
        business_type: business_type as BusinessType,
        address,
        license_info,
        tax_info,
        status: 'PENDING' as TenantStatus,
      },
    });
    res.status(201).json({ success: true, tenant });
  } catch (error) {
    console.error('POST /api/tenants error:', error);
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
    const updated = await prisma.tenant.update({
      where: { id: req.params.id as string },
      data: {
        ...(business_name !== undefined && { business_name }),
        ...(owner_name !== undefined && { owner_name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
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

    // Resolve role
    const ownerRole = await prisma.role.findUnique({ where: { code: 'HOTEL_OWNER' } });
    const tenantAdminRole = await prisma.role.findUnique({ where: { code: 'TENANT_ADMIN' } });
    const roleIdToAssign = ownerRole?.id || tenantAdminRole?.id;
    if (!roleIdToAssign) {
      res.status(500).json({ error: 'System roles not configured' });
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (plan.trial_days > 0 ? plan.trial_days : 30));

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

      // 4. User: activate existing or create new
      let tempPassword: string | null = null;
      const existingUser = await tx.user.findUnique({ where: { email: tenant.email } });

      if (existingUser) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: { status: 'ACTIVE', tenant_id: tenantId },
        });
      } else {
        tempPassword = Math.random().toString(36).slice(-10);
        const passwordHash = await bcrypt.hash(tempPassword, 10);
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
    });

    res.json({
      success: true,
      message: 'Tenant approved successfully',
      tenant: result.updatedTenant,
      credentials: result.tempPassword
        ? { email: result.userEmail, password: result.tempPassword }
        : null,
    });
  } catch (error: any) {
    console.error('POST /api/tenants/:id/approve error:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
