import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/branches
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required' });
      return;
    }
    const branches = await prisma.branch.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      orderBy: { created_at: 'asc' },
    });
    res.json(branches);
  } catch (error) {
    console.error('GET /api/branches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/branches
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required' });
      return;
    }
    const { name, address, phone } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Branch name is required' });
      return;
    }
    const branch = await prisma.branch.create({
      data: { tenant_id: tenantId, name, address, phone },
    });
    res.status(201).json(branch);
  } catch (error) {
    console.error('POST /api/branches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// GET /api/branches/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }

    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required' });
      return;
    }
    const branch = await prisma.branch.findFirst({
      where: { id: req.params.id as string, tenant_id: tenantId, deleted_at: null },
    });
    if (!branch) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }
    res.json(branch);
  } catch (error) {
    console.error('GET /api/branches/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/branches/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }

    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required' });
      return;
    }
    const { name, address, phone } = req.body;

    const existing = await prisma.branch.findFirst({
      where: { id: req.params.id as string, tenant_id: tenantId, deleted_at: null },
    });
    if (!existing) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }

    const updated = await prisma.branch.update({
      where: { id: req.params.id as string },
      data: {
        name: name ?? existing.name,
        address: address ?? existing.address,
        phone: phone ?? existing.phone,
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('PUT /api/branches/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/branches/:id  (soft delete)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }

    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required' });
      return;
    }
    const existing = await prisma.branch.findFirst({
      where: { id: req.params.id as string, tenant_id: tenantId, deleted_at: null },
    });
    if (!existing) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }
    await prisma.branch.update({
      where: { id: req.params.id as string },
      data: { deleted_at: new Date() },
    });
    res.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/branches/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
