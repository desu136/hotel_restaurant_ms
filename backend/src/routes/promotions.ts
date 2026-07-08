import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

// GET /api/promotions/public?tenantId=...
// Returns active promotions for a given tenant (no auth required)
router.get('/public', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.query;

    if (!tenantId || typeof tenantId !== 'string' || !isUuid(tenantId)) {
      res.status(400).json({ error: 'Valid tenantId query parameter is required' });
      return;
    }

    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: { 
        tenant_id: tenantId, 
        is_active: true,
        status: { not: 'DRAFT' },
        start_date: { lte: now },
        end_date: { gte: now }
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, promotions });
  } catch (error) {
    console.error('GET /api/promotions/public error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── AUTHENTICATED (Owner / Manager only) ────────────────────────────────────

router.use(
  authenticate,
  requireRole('HOTEL_OWNER', 'HOTEL_MANAGER', 'RESTAURANT_MANAGER')
);

// GET /api/promotions
// Returns all promotions for the current user's tenant
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(403).json({ error: 'No tenant associated with this account' });
      return;
    }

    const promotions = await prisma.promotion.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, promotions });
  } catch (error) {
    console.error('GET /api/promotions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/promotions
// Create a new promotion
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(403).json({ error: 'No tenant associated with this account' });
      return;
    }

    const { 
      title, description, code, discount_value, banner_url, is_active,
      start_date, end_date, type, scope, status, terms_conditions,
      restaurant_id, branch_id, category_id, menu_item_id
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const promotion = await prisma.promotion.create({
      data: {
        tenant_id: tenantId,
        title: title.trim(),
        description: description?.trim() ?? null,
        terms_conditions: terms_conditions?.trim() ?? null,
        code: code?.trim() ?? null,
        discount_value: discount_value?.trim() ?? null,
        banner_url: banner_url?.trim() ?? null,
        type: type || 'PERCENTAGE_DISCOUNT',
        scope: scope || 'RESTAURANT',
        status: status || 'ACTIVE',
        start_date: start_date ? new Date(start_date) : new Date(),
        end_date: end_date ? new Date(end_date) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        restaurant_id: restaurant_id || null,
        branch_id: branch_id || null,
        category_id: category_id || null,
        menu_item_id: menu_item_id || null,
      },
    });

    res.status(201).json({ success: true, promotion });
  } catch (error) {
    console.error('POST /api/promotions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/promotions/:id
// Update a promotion
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const tenantId = req.user!.tenantId;

    if (!isUuid(id)) {
      res.status(404).json({ error: 'Promotion not found' });
      return;
    }

    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing || existing.tenant_id !== tenantId) {
      res.status(404).json({ error: 'Promotion not found' });
      return;
    }

    const { 
      title, description, code, discount_value, banner_url, is_active,
      start_date, end_date, type, scope, status, terms_conditions,
      restaurant_id, branch_id, category_id, menu_item_id 
    } = req.body;

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() ?? null }),
        ...(terms_conditions !== undefined && { terms_conditions: terms_conditions?.trim() ?? null }),
        ...(code !== undefined && { code: code?.trim() ?? null }),
        ...(discount_value !== undefined && { discount_value: discount_value?.trim() ?? null }),
        ...(banner_url !== undefined && { banner_url: banner_url?.trim() ?? null }),
        ...(type !== undefined && { type }),
        ...(scope !== undefined && { scope }),
        ...(status !== undefined && { status }),
        ...(start_date !== undefined && { start_date: new Date(start_date) }),
        ...(end_date !== undefined && { end_date: new Date(end_date) }),
        ...(is_active !== undefined && { is_active: Boolean(is_active) }),
        ...(restaurant_id !== undefined && { restaurant_id: restaurant_id || null }),
        ...(branch_id !== undefined && { branch_id: branch_id || null }),
        ...(category_id !== undefined && { category_id: category_id || null }),
        ...(menu_item_id !== undefined && { menu_item_id: menu_item_id || null }),
      },
    });

    res.json({ success: true, promotion });
  } catch (error) {
    console.error('PUT /api/promotions/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/promotions/:id
// Delete a promotion
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const tenantId = req.user!.tenantId;

    if (!isUuid(id)) {
      res.status(404).json({ error: 'Promotion not found' });
      return;
    }

    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing || existing.tenant_id !== tenantId) {
      res.status(404).json({ error: 'Promotion not found' });
      return;
    }

    await prisma.promotion.delete({ where: { id } });
    res.json({ success: true, message: 'Promotion deleted' });
  } catch (error) {
    console.error('DELETE /api/promotions/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
