import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN'));

// GET /api/audit-logs
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) ?? '1');
    const limit = parseInt((req.query.limit as string) ?? '20');

    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { full_name: true, email: true } },
          tenant: { select: { business_name: true } },
        },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    res.json({
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/audit-logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
