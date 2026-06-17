import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN'));

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// GET /api/modules
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const modules = await prisma.module.findMany({ orderBy: { created_at: 'asc' } });
    res.json({ success: true, modules });
  } catch (error) {
    console.error('GET /api/modules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/modules
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, description, is_active } = req.body;
    if (!code || !name) {
      res.status(400).json({ error: 'Code and name are required' });
      return;
    }
    const module = await prisma.module.create({
      data: { code, name, description, is_active: is_active ?? true },
    });
    res.status(201).json({ success: true, module });
  } catch (error) {
    console.error('POST /api/modules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/modules/:id
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }
    const { name, description, is_active } = req.body;
    const module = await prisma.module.update({
      where: { id: req.params.id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(is_active !== undefined && { is_active }),
      },
    });
    res.json({ success: true, module });
  } catch (error) {
    console.error('PATCH /api/modules/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
