import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── CATEGORIES ────────────────────────────────────────────────────────────

// GET /api/restaurant/categories
router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const categories = await prisma.category.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      orderBy: { created_at: 'asc' },
    });
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/restaurant/categories
router.post('/categories', requireRole(['RESTAURANT_MANAGER', 'HOTEL_OWNER', 'HOTEL_MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const { name, restaurant_id } = req.body;
    if (!name || !restaurant_id) {
      res.status(400).json({ error: 'name and restaurant_id are required' });
      return;
    }
    const category = await prisma.category.create({
      data: { name, restaurant_id, tenant_id: tenantId! },
    });
    res.status(201).json(category);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// ─── MENU ITEMS ────────────────────────────────────────────────────────────

// GET /api/restaurant/menu
router.get('/menu', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const { restaurant_id } = req.query;
    const items = await prisma.menuItem.findMany({
      where: {
        tenant_id: tenantId,
        ...(restaurant_id ? { restaurant_id: restaurant_id as string } : {}),
      },
      orderBy: { created_at: 'asc' },
    });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// POST /api/restaurant/menu
router.post('/menu', requireRole(['RESTAURANT_MANAGER', 'HOTEL_OWNER', 'HOTEL_MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const { restaurant_id, dexel_product_id, display_name, availability } = req.body;
    if (!restaurant_id || !dexel_product_id || !display_name) {
      res.status(400).json({ error: 'restaurant_id, dexel_product_id, and display_name are required' });
      return;
    }
    const item = await prisma.menuItem.create({
      data: { tenant_id: tenantId!, restaurant_id, dexel_product_id, display_name, availability: availability ?? true },
    });
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// PATCH /api/restaurant/menu/:id
router.patch('/menu/:id', requireRole(['RESTAURANT_MANAGER', 'HOTEL_OWNER', 'HOTEL_MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { display_name, availability } = req.body;
    const item = await prisma.menuItem.update({
      where: { id },
      data: { display_name, availability },
    });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// ─── TABLES ────────────────────────────────────────────────────────────────

// GET /api/restaurant/tables
router.get('/tables', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
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
router.post('/tables', requireRole(['RESTAURANT_MANAGER', 'HOTEL_OWNER', 'HOTEL_MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const { restaurant_id, table_number, capacity } = req.body;
    if (!restaurant_id || !table_number || !capacity) {
      res.status(400).json({ error: 'restaurant_id, table_number, and capacity are required' });
      return;
    }
    const table = await prisma.restaurantTable.create({
      data: { tenant_id: tenantId!, restaurant_id, table_number, capacity: parseInt(capacity) },
    });
    res.status(201).json(table);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create table' });
  }
});

// ─── RESTAURANTS ───────────────────────────────────────────────────────────

// GET /api/restaurant/list
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const restaurants = await prisma.restaurant.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      include: { _count: { select: { tables: true, categories: true, menu_items: true } } },
      orderBy: { created_at: 'asc' },
    });
    res.json(restaurants);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// POST /api/restaurant/list
router.post('/list', requireRole(['HOTEL_OWNER', 'HOTEL_MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const { branch_id, name } = req.body;
    if (!branch_id || !name) {
      res.status(400).json({ error: 'branch_id and name are required' });
      return;
    }
    const restaurant = await prisma.restaurant.create({
      data: { tenant_id: tenantId!, branch_id, name },
    });
    res.status(201).json(restaurant);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

export default router;
