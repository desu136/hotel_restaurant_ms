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
      where: {
        tenant_id: tenantId,
        deleted_at: null,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo_url: true,
            banner_url: true,
          },
        },
        _count: {
          select: {
            categories: true,
            menuItems: true,
            restaurantTables: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    res.json(branches);
  } catch (error) {
    console.error('GET /api/branches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/branches — also auto-creates a restaurant outlet for this branch
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required' });
      return;
    }
    // const { name, address, phone } = req.body;
    // if (!name) {
    //   res.status(400).json({ error: 'Branch name is required' });
    //   return;
    // }

    // // Inherit logo/banner from the root restaurant (the brand) if it exists
    // const rootRestaurant = await prisma.restaurant.findFirst({
    //   where: { tenant_id: tenantId, branch_id: null, deleted_at: null },
    //   select: { logo_url: true, banner_url: true },
    // });

    // const branch = await prisma.branch.create({
    //   data: { tenant_id: tenantId, name, address, phone },
    // });

    // // Auto-create the restaurant outlet for this branch
    // const outlet = await prisma.restaurant.create({
    //   data: {
    //     tenant_id: tenantId,
    //     branch_id: branch.id,
    //     name: name, // outlet name defaults to branch name; editable later
    //     logo_url: rootRestaurant?.logo_url ?? null,
    //     banner_url: rootRestaurant?.banner_url ?? null,
    //   },
    //   select: {
    //     id: true,
    //     name: true,
    //     _count: { select: { categories: true, menu_items: true, tables: true } },
    //   },
    // });
    // 
    // res.status(201).json({ ...branch, outlet });
    const { restaurant_id, name, address, phone } = req.body;

    if (!restaurant_id || !name) {
      res.status(400).json({
        error: "restaurant_id and branch name are required",
      });
      return;
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurant_id,
        tenant_id: tenantId,
        deleted_at: null,
      },
    });

    if (!restaurant) {
      res.status(404).json({
        error: "Restaurant not found",
      });
      return;
    }

    const branch = await prisma.branch.create({
      data: {
        tenant_id: tenantId,
        restaurant_id,
        name,
        address,
        phone,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo_url: true,
            banner_url: true,
          },
        },
      },
    });

    // Broadcast all existing MasterCategory records to the new branch
    const masterCategories = await prisma.masterCategory.findMany({
      where: { restaurant_id, deleted_at: null }
    });

    const categoryMap = new Map<string, string>();
    for (const mc of masterCategories) {
      const cat = await prisma.category.create({
        data: {
          name: mc.name,
          tenant_id: tenantId,
          branch_id: branch.id,
          master_category_id: mc.id,
          parent_id: mc.parent_id
        }
      });
      categoryMap.set(mc.id, cat.id);
    }

    // Broadcast all existing MasterMenuItem records to the new branch
    const masterMenuItems = await prisma.masterMenuItem.findMany({
      where: { restaurant_id, deleted_at: null }
    });

    for (const mmi of masterMenuItems) {
      const localCatId = mmi.master_category_id ? categoryMap.get(mmi.master_category_id) : null;
      await prisma.menuItem.create({
        data: {
          tenant_id: tenantId,
          branch_id: branch.id,
          master_menu_item_id: mmi.id,
          category_id: localCatId || null,
          display_name: mmi.display_name,
          description: mmi.description,
          price: mmi.price,
          availability: mmi.availability,
          customizations: mmi.customizations || undefined,
          image_url: mmi.image_url
        }
      });
    }

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
      include: {
        restaurant: true,
      },
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
      include: {
        restaurant: true,
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('PUT /api/branches/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/branches/:id  (soft delete — also soft-deletes the linked restaurant outlet)
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

    const now = new Date();

    // Soft-delete the linked restaurant outlet
    // await prisma.restaurant.updateMany({
    //   where: { branch_id: req.params.id as string, tenant_id: tenantId, deleted_at: null },
    //   data: { deleted_at: now },
    // });
    // Soft-delete the branch itself
    await prisma.branch.update({
      where: { id: req.params.id as string },
      data: { deleted_at: now },
    });

    res.json({ success: true, message: 'Branch and its restaurant outlet deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/branches/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
