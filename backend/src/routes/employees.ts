import { Router, Request, Response } from 'express';
import { hash } from 'bcrypt';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/employees
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required' });
      return;
    }
    const isOwner = req.user!.roles.includes('HOTEL_OWNER');
    const branchFilter = isOwner ? {} : { branch_id: req.user!.branchId || '' };

    const employees = await prisma.user.findMany({
      where: { tenant_id: tenantId, deleted_at: null, ...branchFilter },
      include: {
        branch: true,
        roles: { include: { role: true } },
        waiter_tables: true,
      },
      orderBy: { created_at: 'asc' },
    });

    res.json(employees.map(e => ({
      id: e.id,
      tenantId: e.tenant_id,
      branchId: e.branch_id,
      branchName: e.branch?.name || 'All Branches / HQ',
      fullName: e.full_name,
      email: e.email,
      phone: e.phone,
      status: e.status,
      createdAt: e.created_at,
      roles: e.roles.map(ur => ({ id: ur.role.id, code: ur.role.code, name: ur.role.name })),
      waiter_tables: e.waiter_tables.map(t => ({ id: t.id, table_number: t.table_number })),
    })));
  } catch (error) {
    console.error('GET /api/employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/employees
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required' });
      return;
    }
    const { fullName, email, phone, password, branchId, roles, tableIds } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ error: 'fullName, email, and password are required' });
      return;
    }

    const passwordHash = await hash(password, 10);

    // Enforce branchId requirement for non-owners
    const isOwner = roles && roles.includes('HOTEL_OWNER');
    if (!isOwner && !branchId) {
      res.status(400).json({ error: 'Branch is required for all employees' });
      return;
    }

    // Validate branch belongs to tenant
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, tenant_id: tenantId, deleted_at: null },
      });
      if (!branch) {
        res.status(400).json({ error: 'Invalid branch ID or branch does not belong to this tenant' });
        return;
      }
    }

    // Resolve roles
    let dbRoles: { id: string }[] = [];
    if (roles && Array.isArray(roles) && roles.length > 0) {
      dbRoles = await prisma.role.findMany({ where: { code: { in: roles } } });
    }

    const employee = await prisma.user.create({
      data: {
        tenant_id: tenantId,
        branch_id: branchId || null,
        full_name: fullName,
        email,
        phone: phone || null,
        password_hash: passwordHash,
        status: 'ACTIVE',
        roles: dbRoles.length > 0 ? { create: dbRoles.map(r => ({ role_id: r.id })) } : undefined,
      },
      include: { branch: true, roles: { include: { role: true } }, waiter_tables: true },
    });

    // If tables are assigned and role is WAITER
    if (roles && roles.includes('WAITER') && tableIds && Array.isArray(tableIds)) {
      // Clear waiter_id for these tables from any previous assignments first (optional but good practice)
      await prisma.restaurantTable.updateMany({
        where: { id: { in: tableIds }, tenant_id: tenantId },
        data: { waiter_id: employee.id }
      });
    }

    // Re-fetch tables to return complete user object
    const finalEmployee = await prisma.user.findUnique({
      where: { id: employee.id },
      include: { branch: true, roles: { include: { role: true } }, waiter_tables: true }
    });

    res.status(201).json({
      id: finalEmployee!.id,
      tenantId: finalEmployee!.tenant_id,
      branchId: finalEmployee!.branch_id,
      branchName: finalEmployee!.branch?.name || 'All Branches / HQ',
      fullName: finalEmployee!.full_name,
      email: finalEmployee!.email,
      phone: finalEmployee!.phone,
      status: finalEmployee!.status,
      roles: finalEmployee!.roles.map(ur => ({ id: ur.role.id, code: ur.role.code, name: ur.role.name })),
      waiter_tables: finalEmployee!.waiter_tables.map(t => ({ id: t.id, table_number: t.table_number })),
    });
  } catch (error: any) {
    console.error('POST /api/employees error:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// GET /api/employees/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required' });
      return;
    }

    const isOwner = req.user!.roles.includes('HOTEL_OWNER');
    // Non-owners can only view employees in their own branch
    const branchFilter = isOwner ? {} : { branch_id: req.user!.branchId || '' };

    const employee = await prisma.user.findFirst({
      where: { id: req.params.id as string, tenant_id: tenantId, deleted_at: null, ...branchFilter },
      include: { branch: true, roles: { include: { role: true } }, waiter_tables: true },
    });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    res.json({
      id: employee.id,
      tenantId: employee.tenant_id,
      branchId: employee.branch_id,
      branchName: employee.branch?.name || 'All Branches / HQ',
      fullName: employee.full_name,
      email: employee.email,
      phone: employee.phone,
      status: employee.status,
      createdAt: employee.created_at,
      roles: employee.roles.map(ur => ({ id: ur.role.id, code: ur.role.code, name: ur.role.name })),
      waiter_tables: employee.waiter_tables.map(t => ({ id: t.id, table_number: t.table_number })),
    });
  } catch (error) {
    console.error('GET /api/employees/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/employees/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required' });
      return;
    }
    const { fullName, email, phone, password, branchId, roles, status, tableIds } = req.body;

    const employee = await prisma.user.findFirst({
      where: { id: req.params.id as string, tenant_id: tenantId, deleted_at: null },
    });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    const updateData: any = {};
    if (fullName !== undefined) updateData.full_name = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status;

    if (email !== undefined && email !== employee.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }
      updateData.email = email;
    }

    if (password) {
      updateData.password_hash = await hash(password, 10);
    }

    let isOwner = false;
    if (roles !== undefined && Array.isArray(roles)) {
      isOwner = roles.includes('HOTEL_OWNER');
    } else {
      const userWithRoles = await prisma.user.findUnique({
        where: { id: employee.id },
        include: { roles: { include: { role: true } } }
      });
      isOwner = userWithRoles?.roles.some(ur => ur.role.code === 'HOTEL_OWNER') || false;
    }

    if (!isOwner) {
      const targetBranchId = branchId !== undefined ? branchId : employee.branch_id;
      if (!targetBranchId) {
        res.status(400).json({ error: 'Branch is required for all employees' });
        return;
      }
    }

    if (branchId !== undefined) {
      if (branchId) {
        const branch = await prisma.branch.findFirst({
          where: { id: branchId, tenant_id: tenantId, deleted_at: null },
        });
        if (!branch) {
          res.status(400).json({ error: 'Invalid branch ID or branch does not belong to this tenant' });
          return;
        }
        updateData.branch_id = branchId;
      } else {
        updateData.branch_id = null;
      }
    }

    if (roles !== undefined && Array.isArray(roles)) {
      const dbRoles = await prisma.role.findMany({ where: { code: { in: roles } } });
      if (dbRoles.length === 0) {
        res.status(400).json({ error: 'No valid roles provided' });
        return;
      }
      updateData.roles = {
        deleteMany: {},
        create: dbRoles.map(r => ({ role_id: r.id })),
      };
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id as string },
      data: updateData,
      include: { branch: true, roles: { include: { role: true } }, waiter_tables: true },
    });

    // Handle waiter table assignments if waiter role exists or tableIds is provided
    const isWaiter = roles ? roles.includes('WAITER') : updated.roles.some(ur => ur.role.code === 'WAITER');
    if (tableIds && Array.isArray(tableIds)) {
      // 1. Unassign all tables from this waiter
      await prisma.restaurantTable.updateMany({
        where: { waiter_id: updated.id, tenant_id: tenantId },
        data: { waiter_id: null }
      });
      
      // 2. If user is still a waiter, assign the new tables
      if (isWaiter && tableIds.length > 0) {
        await prisma.restaurantTable.updateMany({
          where: { id: { in: tableIds }, tenant_id: tenantId },
          data: { waiter_id: updated.id }
        });
      }
    }

    // Re-fetch employee with new waiter tables
    const finalEmployee = await prisma.user.findUnique({
      where: { id: updated.id },
      include: { branch: true, roles: { include: { role: true } }, waiter_tables: true }
    });

    res.json({
      id: finalEmployee!.id,
      tenantId: finalEmployee!.tenant_id,
      branchId: finalEmployee!.branch_id,
      branchName: finalEmployee!.branch?.name || 'All Branches / HQ',
      fullName: finalEmployee!.full_name,
      email: finalEmployee!.email,
      phone: finalEmployee!.phone,
      status: finalEmployee!.status,
      roles: finalEmployee!.roles.map(ur => ({ id: ur.role.id, code: ur.role.code, name: ur.role.name })),
      waiter_tables: finalEmployee!.waiter_tables.map(t => ({ id: t.id, table_number: t.table_number })),
    });
  } catch (error) {
    console.error('PUT /api/employees/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/employees/:id  (soft delete)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required' });
      return;
    }
    const employee = await prisma.user.findFirst({
      where: { id: req.params.id as string, tenant_id: tenantId, deleted_at: null },
    });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    await prisma.user.update({
      where: { id: req.params.id as string },
      data: { deleted_at: new Date(), status: 'INACTIVE' },
    });
    res.json({ success: true, message: 'Employee deactivated and soft-deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/employees/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
