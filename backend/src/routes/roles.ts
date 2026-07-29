import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/roles
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const roles = await prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(roles.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      permissions: r.permissions.map(rp => rp.permission.code),
    })));
  } catch (error) {
    console.error('GET /api/roles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// GET /api/roles/:id/permissions
router.get('/:id/permissions', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    const role = await prisma.role.findUnique({
      where: { id: req.params.id as string },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }
    res.json({
      id: role.id,
      code: role.code,
      name: role.name,
      permissions: role.permissions.map((rp: any) => rp.permission.code),
    });
  } catch (error) {
    console.error('GET /api/roles/:id/permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/roles/:id/permissions  (replace all permissions for a role)
router.put('/:id/permissions', async (req: Request, res: Response): Promise<void> => {
  try {
    const isOwner = req.user!.roles.includes('HOTEL_OWNER');
    if (!isOwner) {
      res.status(403).json({ error: 'Forbidden: Only owners can update role permissions.' });
      return;
    }

    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      res.status(400).json({ error: 'permissions must be an array of permission codes' });
      return;
    }

    const role = await prisma.role.findUnique({ where: { id: req.params.id as string } });
    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    const dbPerms = await prisma.permission.findMany({
      where: { code: { in: permissions } },
    });

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { role_id: req.params.id as string } }),
      prisma.rolePermission.createMany({
        data: dbPerms.map(p => ({ role_id: req.params.id as string, permission_id: p.id })),
      }),
    ]);

    const updated = await prisma.role.findUnique({
      where: { id: req.params.id as string },
      include: { permissions: { include: { permission: true } } },
    });

    res.json({
      id: updated!.id,
      code: updated!.code,
      name: updated!.name,
      permissions: updated!.permissions.map((rp: any) => rp.permission.code),
    });
  } catch (error) {
    console.error('PUT /api/roles/:id/permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
