import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// GET /api/subscriptions  — list all plans with their modules
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      include: { modules: { include: { module: true } } },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('GET /api/subscriptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/subscriptions  — create a new plan
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, monthly_price, annual_price, trial_days, module_ids } = req.body;
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        monthly_price,
        annual_price,
        trial_days: trial_days ?? 0,
        modules: module_ids?.length
          ? { create: (module_ids as string[]).map((id: string) => ({ module_id: id })) }
          : undefined,
      },
      include: { modules: { include: { module: true } } },
    });
    res.status(201).json({ success: true, plan });
  } catch (error) {
    console.error('POST /api/subscriptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/subscriptions/:id  — update plan and replace its modules
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    const { name, description, monthly_price, annual_price, trial_days, module_ids } = req.body;

    const plan = await prisma.$transaction(async (tx) => {
      if (module_ids !== undefined) {
        await tx.planModule.deleteMany({ where: { plan_id: req.params.id as string } });
        if ((module_ids as string[]).length > 0) {
          await tx.planModule.createMany({
            data: (module_ids as string[]).map((mid: string) => ({
              plan_id: req.params.id as string,
              module_id: mid,
            })),
          });
        }
      }
      return tx.subscriptionPlan.update({
        where: { id: req.params.id as string },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(monthly_price !== undefined && { monthly_price }),
          ...(annual_price !== undefined && { annual_price }),
          ...(trial_days !== undefined && { trial_days }),
        },
        include: { modules: { include: { module: true } } },
      });
    });

    res.json({ success: true, plan });
  } catch (error) {
    console.error('PUT /api/subscriptions/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/subscriptions/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUuid(req.params.id as string)) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }
    await prisma.subscriptionPlan.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/subscriptions/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
