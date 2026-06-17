import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const MANAGER_ROLES = ['RESTAURANT_MANAGER', 'HOTEL_OWNER', 'HOTEL_MANAGER'];

// ─── RESTAURANTS ───────────────────────────────────────────────────────────

// GET /api/restaurant/list
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const restaurants = await prisma.restaurant.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      include: {
        branch: { select: { id: true, name: true } },
        _count: { select: { tables: true, categories: true, menu_items: true } },
      },
      orderBy: { created_at: 'asc' },
    });
    res.json(restaurants);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});


// POST /api/restaurant/list
router.post('/list', requireRole('HOTEL_OWNER', 'HOTEL_MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { branch_id, name } = req.body;
    if (!branch_id || !name) {
      res.status(400).json({ error: 'branch_id and name are required' });
      return;
    }
    const restaurant = await prisma.restaurant.create({
      data: { tenant_id: tenantId, branch_id, name },
      include: { branch: { select: { id: true, name: true } }, _count: { select: { categories: true, menu_items: true, tables: true } } },
    });
    res.status(201).json(restaurant);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

// PUT /api/restaurant/list/:id
router.put('/list/:id', requireRole('HOTEL_OWNER', 'HOTEL_MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { name, branch_id } = req.body;

    // Verify the restaurant belongs to this tenant
    const existing = await prisma.restaurant.findFirst({
      where: { id: req.params.id, tenant_id: tenantId, deleted_at: null },
    });
    if (!existing) { res.status(404).json({ error: 'Restaurant not found' }); return; }

    const updated = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(branch_id !== undefined && { branch_id }),
      },
      include: { branch: { select: { id: true, name: true } }, _count: { select: { categories: true, menu_items: true, tables: true } } },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// DELETE /api/restaurant/list/:id  (soft delete)
router.delete('/list/:id', requireRole('HOTEL_OWNER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }

    const existing = await prisma.restaurant.findFirst({
      where: { id: req.params.id, tenant_id: tenantId, deleted_at: null },
    });
    if (!existing) { res.status(404).json({ error: 'Restaurant not found' }); return; }

    await prisma.restaurant.update({
      where: { id: req.params.id },
      data: { deleted_at: new Date() },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
});



// ─── CATEGORIES ────────────────────────────────────────────────────────────

// GET /api/restaurant/categories  — optionally ?restaurant_id=...
router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { restaurant_id } = req.query;
    const categories = await prisma.category.findMany({
      where: {
        tenant_id: tenantId,
        deleted_at: null,
        ...(restaurant_id ? { restaurant_id: restaurant_id as string } : {}),
      },
      include: { _count: { select: { menu_items: true } } },
      orderBy: { created_at: 'asc' },
    });
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/restaurant/categories
router.post('/categories', requireRole(...MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { name, restaurant_id } = req.body;
    if (!name || !restaurant_id) {
      res.status(400).json({ error: 'name and restaurant_id are required' });
      return;
    }
    const category = await prisma.category.create({
      data: { name, restaurant_id, tenant_id: tenantId },
    });
    res.status(201).json(category);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PATCH /api/restaurant/categories/:id
router.patch('/categories/:id', requireRole(...MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id as string },
      data: { name },
    });
    res.json(category);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/restaurant/categories/:id  — soft delete
router.delete('/categories/:id', requireRole(...MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.category.update({
      where: { id: req.params.id as string },
      data: { deleted_at: new Date() },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ─── MENU ITEMS ────────────────────────────────────────────────────────────

// GET /api/restaurant/menu  — ?restaurant_id=...&category_id=...
router.get('/menu', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { restaurant_id, category_id } = req.query;
    const items = await prisma.menuItem.findMany({
      where: {
        tenant_id: tenantId,
        ...(restaurant_id ? { restaurant_id: restaurant_id as string } : {}),
        ...(category_id ? { category_id: category_id as string } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { created_at: 'asc' },
    });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// POST /api/restaurant/menu
router.post('/menu', requireRole(...MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { restaurant_id, display_name, description, price, category_id, availability, customizations } = req.body;
    if (!restaurant_id || !display_name) {
      res.status(400).json({ error: 'restaurant_id and display_name are required' });
      return;
    }
    const item = await prisma.menuItem.create({
      data: {
        tenant_id: tenantId,
        restaurant_id,
        display_name,
        description: description ?? null,
        price: price ?? 0,
        category_id: category_id ?? null,
        availability: availability ?? true,
        customizations: customizations ?? null,
      },
      include: { category: { select: { id: true, name: true } } },
    });
    res.status(201).json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// PATCH /api/restaurant/menu/:id
router.patch('/menu/:id', requireRole(...MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const { display_name, description, price, category_id, availability, customizations } = req.body;
    const item = await prisma.menuItem.update({
      where: { id: req.params.id as string },
      data: {
        ...(display_name !== undefined && { display_name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(category_id !== undefined && { category_id }),
        ...(availability !== undefined && { availability }),
        ...(customizations !== undefined && { customizations }),
      },
      include: { category: { select: { id: true, name: true } } },
    });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE /api/restaurant/menu/:id
router.delete('/menu/:id', requireRole(...MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// ─── TABLES ────────────────────────────────────────────────────────────────

// GET /api/restaurant/tables
router.get('/tables', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const tables = await prisma.restaurantTable.findMany({
      where: { tenant_id: tenantId },
      orderBy: { table_number: 'asc' },
    });
    res.json(tables);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// POST /api/restaurant/tables
router.post('/tables', requireRole(...MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { restaurant_id, table_number, capacity } = req.body;
    if (!restaurant_id || !table_number || !capacity) {
      res.status(400).json({ error: 'restaurant_id, table_number, and capacity are required' });
      return;
    }
    const table = await prisma.restaurantTable.create({
      data: { tenant_id: tenantId, restaurant_id, table_number, capacity: parseInt(capacity) },
    });
    res.status(201).json(table);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create table' });
  }
});

export default router;
