import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN'));

// GET /api/settings
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.platformSetting.findMany();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('GET /api/settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/settings
router.patch('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) {
      res.status(400).json({ error: 'Invalid settings format' });
      return;
    }
    const updated = [];
    for (const s of settings as { key: string; value: string }[]) {
      const result = await prisma.platformSetting.update({
        where: { key: s.key },
        data: { value: s.value.toString() },
      });
      updated.push(result);
    }
    res.json({ success: true, settings: updated });
  } catch (error) {
    console.error('PATCH /api/settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
