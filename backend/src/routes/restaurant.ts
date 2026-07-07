import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// ─── PUBLIC ENDPOINTS (NO AUTH REQUIRED) ───────────────────────────────────

// GET /api/restaurant/public/details/:restaurantId
router.get('/public/details/:restaurantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantId = req.params.restaurantId as string;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId, deleted_at: null },
      select: {
        id: true,
        name: true,
        logo_url: true,
        banner_url: true,
        parent_id: true,
        branches: {
          where: { deleted_at: null },
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            logo_url: true,
            banner_url: true
          }
        },
      },
    });
    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    const branchId = await resolveBranchId(restaurantId, req);
    let branchInfo = null;
    if (branchId) {
      branchInfo = await prisma.branch.findUnique({
        where: { id: branchId },
        select: {
          id: true,
          name: true,
          logo_url: true,
          banner_url: true
        }
      });
    }

    res.json({
      ...restaurant,
      logo_url: restaurant.logo_url, // Keep it to using the restaurant's logo
      banner_url: (branchInfo && branchInfo.banner_url) || restaurant.banner_url,
      name: restaurant.name,
      branchName: branchInfo ? branchInfo.name : null,
      branchId: branchId
    });
  } catch (e) {
    console.error('Error fetching public details:', e);
    res.status(500).json({ error: 'Failed to fetch restaurant details' });
  }
});

async function resolveBranchId(restaurantId: string, req: Request): Promise<string | null> {
  const { tableId, branchId } = req.query;

  if (tableId && typeof tableId === 'string') {
    const table = await prisma.restaurantTable.findUnique({
      where: { id: tableId },
      select: { branch_id: true }
    });
    if (table) return table.branch_id;
  }

  if (branchId && typeof branchId === 'string') {
    return branchId;
  }

  // Fallback: If restaurantId is actually a branch_id
  const isBranch = await prisma.branch.findUnique({
    where: { id: restaurantId },
    select: { id: true }
  });
  if (isBranch) return isBranch.id;

  // Otherwise, get the first branch of the restaurant
  const firstBranch = await prisma.branch.findFirst({
    where: { restaurant_id: restaurantId, deleted_at: null },
    select: { id: true }
  });
  return firstBranch?.id ?? null;
}

router.get('/public/categories/:restaurantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantId = req.params.restaurantId as string;
    const branchId = await resolveBranchId(restaurantId, req);
    if (!branchId) {
      res.json([]);
      return;
    }

    // Fetch the branch to get tenant_id for master categories
    const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { tenant_id: true } });
    if (!branch) { res.json([]); return; }

    // Get branch-specific categories AND master categories for this tenant (which were broadcast-created)
    // The master-broadcasted categories have branch_id set to the specific branch when broadcast
    const categories = await prisma.category.findMany({
      where: { branch_id: branchId, deleted_at: null },
      orderBy: { created_at: 'asc' },
    });
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/public/menu/:restaurantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantId = req.params.restaurantId as string;
    const branchId = await resolveBranchId(restaurantId, req);
    if (!branchId) {
      res.json([]);
      return;
    }

    // Get both branch-specific items AND master menu items broadcast to this branch
    const items = await prisma.menuItem.findMany({
      where: { branch_id: branchId, availability: true },
      include: {
        category: { select: { id: true, name: true, parent_id: true } },
      },
      orderBy: { created_at: 'asc' },
    });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// GET /api/restaurant/public/table/:id - Customer status table check
router.get('/public/table/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const table = await prisma.restaurantTable.findUnique({
      where: { id: req.params.id as string },
    });
    if (!table) {
      res.status(404).json({ error: 'Table not found' });
      return;
    }
    res.json(table);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch table details' });
  }
});

// GET /api/restaurant/public/list
router.get('/public/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        name: true,
        logo_url: true,
        banner_url: true,
        parent_id: true,
        branches: {
          where: { deleted_at: null },
          select: { id: true, name: true, address: true, phone: true, logo_url: true, banner_url: true }
        },
      },
      orderBy: { created_at: 'asc' },
    });
    res.json(restaurants);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch public restaurant list' });
  }
});

// GET /api/restaurant/public/config - Retrieve tenant modules configuration & restaurant list
router.get('/public/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantIdQuery = req.query.tenantId as string | undefined;
    let tenant = null;

    if (tenantIdQuery) {
      tenant = await prisma.tenant.findFirst({
        where: { id: tenantIdQuery, deleted_at: null, business_name: { not: 'System Admin' } },
      });
    }

    if (tenant) {
      // Scoped Tenant Mode
      const tenantModules = await prisma.tenantModule.findMany({
        where: { tenant_id: tenant.id, enabled: true },
        include: { module: true },
      });

      const modules = tenantModules.map(tm => tm.module.code);

      const restaurants = await prisma.restaurant.findMany({
        where: { tenant_id: tenant.id, deleted_at: null },
        select: {
          id: true,
          name: true,
          logo_url: true,
          banner_url: true,
          parent_id: true,
          branches: {
            where: { deleted_at: null },
            select: { id: true, name: true, address: true, phone: true, logo_url: true, banner_url: true }
          },
        },
        orderBy: { created_at: 'asc' },
      });

      res.json({
        tenantId: tenant.id,
        business_name: tenant.business_name,
        business_type: tenant.business_type,
        modules,
        restaurants,
      });
    } else {
      // Global Mode - load all active outlets from business tenants
      const restaurants = await prisma.restaurant.findMany({
        where: {
          deleted_at: null,
          tenant: {
            status: 'ACTIVE',
            deleted_at: null,
            business_name: { not: 'System Admin' },
          },
        },
        select: {
          id: true,
          name: true,
          logo_url: true,
          banner_url: true,
          parent_id: true,
          branches: {
            where: { deleted_at: null },
            select: { id: true, name: true, address: true, phone: true, logo_url: true, banner_url: true }
          },
        },
        orderBy: { created_at: 'asc' },
      });

      res.json({
        tenantId: null,
        business_name: "Hospitality Hub",
        business_type: "HOTEL_RESTAURANT",
        modules: ["RESTAURANT", "MENU", "DELIVERY", "HOTEL", "ROOMS"],
        restaurants,
      });
    }
  } catch (e) {
    console.error('Error fetching public config:', e);
    res.status(500).json({ error: 'Failed to fetch public configurations' });
  }
});

router.use(authenticate);

const MANAGER_ROLES = ['RESTAURANT_MANAGER', 'HOTEL_OWNER', 'HOTEL_MANAGER'];
const OWNER_ROLES = ['HOTEL_OWNER'];

/**
 * Returns true if the authenticated user is an owner (cross-branch visibility).
 * Non-owners (managers, waiters, etc.) are branch-scoped.
 */
const isOwnerUser = (req: Request) =>
  req.user!.roles.some(r => OWNER_ROLES.includes(r));

/**
 * Returns true if the user has access to manage broadcasted/master entities.
 * Managers should not create broadcasted things unless they are the overall restaurant manager (i.e. no branchId).
 */
const canManageBroadcasted = (req: Request): boolean => {
  if (isOwnerUser(req)) return true;
  const isOverallManager = req.user!.roles.some(r => ['RESTAURANT_MANAGER', 'HOTEL_MANAGER'].includes(r)) && !req.user!.branchId;
  return isOverallManager;
};

/**
 * Returns true if the user has access to the specified branch.
 * Branch managers only have access to their own branchId.
 */
const hasBranchAccess = (req: Request, branchId: string | null): boolean => {
  if (isOwnerUser(req) || !req.user!.branchId) return true;
  return req.user!.branchId === branchId;
};

/**
 * For non-owner users, verify that a given restaurant belongs to their branch.
 * Throws (returns false + sends 403) if the guard fails.
 */
async function guardRestaurantBranch(
  req: Request,
  res: Response,
  restaurant_id: string,
  tenantId: string
): Promise<boolean> {
  if (isOwnerUser(req)) return true; // owners bypass the check
  const branchId = req.user!.branchId;
  if (!branchId) {
    res.status(403).json({ error: 'You are not assigned to any branch.' });
    return false;
  }
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: restaurant_id,
      tenant_id: tenantId,
      deleted_at: null,
      branches: {
        some: {
          id: branchId,
          deleted_at: null,
        }
      }
    },
  });
  if (!restaurant) {
    res.status(403).json({ error: 'You do not have access to this restaurant branch.' });
    return false;
  }
  return true;
}

// ─── RESTAURANTS ───────────────────────────────────────────────────────────

// GET /api/restaurant/list
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }

    const branchFilter = isOwnerUser(req)
      ? {} // owners see all
      : req.user!.branchId
        ? {
            branches: {
              some: {
                id: req.user!.branchId,
                deleted_at: null,
              }
            }
          } // non-owners see only their branch's restaurant
        : { id: '' }; // no branch assigned → empty result

    const restaurants = await prisma.restaurant.findMany({
      where: { tenant_id: tenantId, deleted_at: null, ...branchFilter },
      include: {
        branches: {
          where: { deleted_at: null },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                categories: true,
                menuItems: true,
                restaurantTables: true,
              }
            }
          }
        },
        parent: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'asc' },
    });
    res.json(restaurants);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// GET /api/restaurant/my — Returns the root restaurant (brand) for the authenticated owner
router.get('/my', requireRole('HOTEL_OWNER', 'HOTEL_MANAGER', 'RESTAURANT_MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const restaurant = await prisma.restaurant.findFirst({
      where: { tenant_id: tenantId, parent_id: null, deleted_at: null },
      select: {
        id: true, name: true, logo_url: true, banner_url: true, created_at: true,
        _count: { select: { children: true } },
      },
    });
    res.json(restaurant ?? null);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch restaurant profile' });
  }
});

// POST /api/restaurant/my — Creates the root restaurant (brand) for the owner — only once
router.post('/my', requireRole('HOTEL_OWNER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { name, logo_url, banner_url } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: 'Restaurant name is required' }); return; }

    // Enforce one root restaurant per tenant
    const existing = await prisma.restaurant.findFirst({
      where: { tenant_id: tenantId, parent_id: null, deleted_at: null },
    });
    if (existing) {
      res.status(409).json({ error: 'You already have a restaurant registered. Edit it instead.' });
      return;
    }

    const restaurant = await prisma.restaurant.create({
      data: { tenant_id: tenantId, name: name.trim(), logo_url: logo_url || null, banner_url: banner_url || null },
      select: { id: true, name: true, logo_url: true, banner_url: true, created_at: true },
    });
    res.status(201).json(restaurant);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create restaurant profile' });
  }
});

// PUT /api/restaurant/my — Updates the root restaurant (brand) profile
router.put('/my', requireRole('HOTEL_OWNER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { name, logo_url, banner_url } = req.body;

    const existing = await prisma.restaurant.findFirst({
      where: { tenant_id: tenantId, parent_id: null, deleted_at: null },
    });
    if (!existing) { res.status(404).json({ error: 'No restaurant profile found. Create one first.' }); return; }

    const updated = await prisma.restaurant.update({
      where: { id: existing.id },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(logo_url !== undefined && { logo_url: logo_url || null }),
        ...(banner_url !== undefined && { banner_url: banner_url || null }),
      },
      select: { id: true, name: true, logo_url: true, banner_url: true, created_at: true },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update restaurant profile' });
  }
});


// POST /api/restaurant/list
router.post('/list', requireRole('HOTEL_OWNER', 'HOTEL_MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { parent_id, name, logo_url, banner_url } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const restaurant = await prisma.restaurant.create({
      data: { 
        tenant_id: tenantId, 
        parent_id: parent_id || null, 
        name, 
        logo_url, 
        banner_url 
      },
      include: { 
        branches: { select: { id: true, name: true } }, 
        parent: { select: { id: true, name: true } }
      },
    });
    res.status(201).json(restaurant);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

// PUT /api/restaurant/list/:id
router.put('/list/:id', requireRole('HOTEL_OWNER', 'HOTEL_MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { name, parent_id, logo_url, banner_url } = req.body;

    // Verify the restaurant belongs to this tenant
    const existing = await prisma.restaurant.findFirst({
      where: { id: req.params.id as string, tenant_id: tenantId, deleted_at: null },
    });
    if (!existing) { res.status(404).json({ error: 'Restaurant not found' }); return; }

    const updated = await prisma.restaurant.update({
      where: { id: req.params.id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(parent_id !== undefined && { parent_id: parent_id || null }),
        ...(logo_url !== undefined && { logo_url }),
        ...(banner_url !== undefined && { banner_url }),
      },
      include: { 
        branches: { select: { id: true, name: true } }, 
        parent: { select: { id: true, name: true } }
      },
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
      where: { id: req.params.id as string, tenant_id: tenantId, deleted_at: null },
    });
    if (!existing) { res.status(404).json({ error: 'Restaurant not found' }); return; }

    await prisma.restaurant.update({
      where: { id: req.params.id as string },
      data: { deleted_at: new Date() },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
});



// ─── CATEGORIES ────────────────────────────────────────────────────────────

// GET /api/restaurant/categories  — optionally ?restaurant_id=... or ?branch_id=... or ?is_master=...
router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { restaurant_id, branch_id, is_master } = req.query;

    if (is_master === 'true') {
      const masterCategories = await prisma.masterCategory.findMany({
        where: {
          tenant_id: tenantId,
          deleted_at: null,
          ...(restaurant_id ? { restaurant_id: restaurant_id as string } : {}),
        },
        orderBy: { created_at: 'asc' },
      });
      res.json(masterCategories);
      return;
    }

    let branchFilter: any = {};
    if (!isOwnerUser(req) && req.user!.branchId) {
      // Non-owner branch accounts always see only their own branch's categories
      branchFilter = { branch_id: req.user!.branchId };
    } else if (branch_id) {
      branchFilter = { branch_id: branch_id as string };
    } else if (restaurant_id) {
      branchFilter = { branch: { restaurant_id: restaurant_id as string } };
    }

    const categories = await prisma.category.findMany({
      where: {
        tenant_id: tenantId,
        deleted_at: null,
        ...branchFilter,
      },
      include: { 
        _count: { select: { menu_items: true } },
        master_category: true,
        branch: { select: { id: true, name: true } },
      },
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
    const { name, restaurant_id, branch_id, parent_id, is_master } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    if (is_master) {
      if (!canManageBroadcasted(req)) {
        res.status(403).json({ error: 'Forbidden: Only owners or overall restaurant managers can create master categories.' });
        return;
      }
      if (!restaurant_id) {
        res.status(400).json({ error: 'restaurant_id is required for master category' });
        return;
      }
      const masterCat = await prisma.masterCategory.create({
        data: { name, tenant_id: tenantId, restaurant_id, parent_id: parent_id || null }
      });
      
      // Broadcast to all active branches
      const branches = await prisma.branch.findMany({
        where: { restaurant_id, deleted_at: null }
      });
      for (const branch of branches) {
        // If this is a subcategory, resolve the parent_id to the branch-local
        // Category that mirrors the master parent — not the MasterCategory ID.
        let localParentId: string | null = null;
        if (parent_id) {
          const localParent = await prisma.category.findFirst({
            where: { branch_id: branch.id, master_category_id: parent_id, deleted_at: null }
          });
          localParentId = localParent?.id ?? null;
        }
        await prisma.category.create({
          data: {
            name,
            tenant_id: tenantId,
            branch_id: branch.id,
            master_category_id: masterCat.id,
            parent_id: localParentId
          }
        });
      }
      res.status(201).json(masterCat);
      return;
    }

    let resolvedBranchId = branch_id;
    if (!resolvedBranchId) {
      if (req.user!.branchId) {
        resolvedBranchId = req.user!.branchId;
      } else if (restaurant_id) {
        const firstBranch = await prisma.branch.findFirst({
          where: { restaurant_id: restaurant_id as string, deleted_at: null },
        });
        resolvedBranchId = firstBranch?.id;
      }
    }

    if (!resolvedBranchId) {
      res.status(400).json({ error: 'branch_id or restaurant_id with an active branch is required' });
      return;
    }

    // Guard: Ensure user has access to the resolved branch
    if (!hasBranchAccess(req, resolvedBranchId)) {
      res.status(403).json({ error: 'You do not have access to this branch.' });
      return;
    }

    const category = await prisma.category.create({
      data: { name, branch_id: resolvedBranchId, tenant_id: tenantId, parent_id: parent_id || null },
    });
    res.status(201).json(category);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PATCH /api/restaurant/categories/:id
router.patch('/categories/:id', requireRole(...MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, parent_id } = req.body;
    const categoryId = req.params.id as string;

    const isOwner = isOwnerUser(req);
    const userBranchId = req.user!.branchId;

    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (cat) {
      if (!hasBranchAccess(req, cat.branch_id)) {
        res.status(403).json({ error: 'Forbidden: You cannot modify a category belonging to another branch.' });
        return;
      }
      const updatedCat = await prisma.category.update({
        where: { id: categoryId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(parent_id !== undefined ? { parent_id: parent_id || null } : {}),
        },
      });
      res.json(updatedCat);
      return;
    }

    const masterCat = await prisma.masterCategory.findUnique({ where: { id: categoryId } });
    if (masterCat) {
      if (!canManageBroadcasted(req)) {
        res.status(403).json({ error: 'Forbidden: Only owners or overall restaurant managers can modify master categories.' });
        return;
      }
      const updatedMaster = await prisma.masterCategory.update({
        where: { id: categoryId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(parent_id !== undefined ? { parent_id: parent_id || null } : {}),
        },
      });
      if (name !== undefined) {
        await prisma.category.updateMany({
          where: { master_category_id: categoryId },
          data: { name }
        });
      }
      if (parent_id !== undefined) {
        const branches = await prisma.branch.findMany({
          where: { restaurant_id: masterCat.restaurant_id, deleted_at: null }
        });
        for (const branch of branches) {
          let localParentId: string | null = null;
          if (parent_id) {
            const localParent = await prisma.category.findFirst({
              where: { branch_id: branch.id, master_category_id: parent_id, deleted_at: null }
            });
            localParentId = localParent?.id ?? null;
          }
          await prisma.category.updateMany({
            where: { branch_id: branch.id, master_category_id: categoryId },
            data: { parent_id: localParentId }
          });
        }
      }
      res.json(updatedMaster);
      return;
    }

    res.status(404).json({ error: 'Category not found' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/restaurant/categories/:id  — soft delete (recursive for subcategories)
router.delete('/categories/:id', requireRole(...MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryId = req.params.id as string;
    const isOwner = isOwnerUser(req);
    const userBranchId = req.user!.branchId;

    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (cat) {
      if (!hasBranchAccess(req, cat.branch_id)) {
        res.status(403).json({ error: 'Forbidden: You cannot delete a category belonging to another branch.' });
        return;
      }
      
      const now = new Date();
      // Helper function to recursively soft delete a category and its subcategories
      const softDeleteCategoryTree = async (id: string) => {
        // Find subcategories
        const subcategories = await prisma.category.findMany({
          where: { parent_id: id, deleted_at: null },
          select: { id: true }
        });
        
        for (const sub of subcategories) {
          await softDeleteCategoryTree(sub.id);
        }
        
        await prisma.category.update({
          where: { id },
          data: { deleted_at: now }
        });
      };
      
      await softDeleteCategoryTree(categoryId);
      res.json({ success: true });
      return;
    }

    const masterCat = await prisma.masterCategory.findUnique({ where: { id: categoryId } });
    if (masterCat) {
      if (!canManageBroadcasted(req)) {
        res.status(403).json({ error: 'Forbidden: Only owners or overall restaurant managers can delete master categories.' });
        return;
      }
      
      const now = new Date();
      // Helper function to recursively soft delete a master category, its child master categories,
      // and all corresponding branch-specific categories.
      const softDeleteMasterCategoryTree = async (id: string) => {
        // Find sub master categories
        const subMasterCategories = await prisma.masterCategory.findMany({
          where: { parent_id: id, deleted_at: null },
          select: { id: true }
        });
        
        for (const sub of subMasterCategories) {
          await softDeleteMasterCategoryTree(sub.id);
        }
        
        // Soft delete the master category itself
        await prisma.masterCategory.update({
          where: { id },
          data: { deleted_at: now }
        });
        
        // Soft delete all branch-specific categories mapping to this master category
        // And also soft delete any of their local subcategories!
        const localCats = await prisma.category.findMany({
          where: { master_category_id: id, deleted_at: null },
          select: { id: true }
        });
        
        for (const localCat of localCats) {
          const softDeleteLocalCategoryTree = async (lid: string) => {
            const subLocalCats = await prisma.category.findMany({
              where: { parent_id: lid, deleted_at: null },
              select: { id: true }
            });
            for (const subLocal of subLocalCats) {
              await softDeleteLocalCategoryTree(subLocal.id);
            }
            await prisma.category.update({
              where: { id: lid },
              data: { deleted_at: now }
            });
          };
          
          await softDeleteLocalCategoryTree(localCat.id);
        }
      };
      
      await softDeleteMasterCategoryTree(categoryId);
      res.json({ success: true });
      return;
    }

    res.status(404).json({ error: 'Category not found' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ─── MENU ITEMS ────────────────────────────────────────────────────────────

// GET /api/restaurant/menu  — ?restaurant_id=...&branch_id=...&category_id=...&is_master=...
router.get('/menu', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { restaurant_id, branch_id, category_id, is_master } = req.query;

    if (is_master === 'true') {
      const masterItems = await prisma.masterMenuItem.findMany({
        where: {
          tenant_id: tenantId,
          deleted_at: null,
          ...(restaurant_id ? { restaurant_id: restaurant_id as string } : {}),
          ...(category_id ? { master_category_id: category_id as string } : {}),
        },
        include: { category: { select: { id: true, name: true } } },
        orderBy: { created_at: 'asc' },
      });
      res.json(masterItems);
      return;
    }

    let branchFilter: any = {};
    if (!isOwnerUser(req) && req.user!.branchId) {
      // Non-owner branch accounts always see only their own branch's menu items
      branchFilter = { branch_id: req.user!.branchId };
    } else if (branch_id) {
      branchFilter = { branch_id: branch_id as string };
    } else if (restaurant_id) {
      branchFilter = { branch: { restaurant_id: restaurant_id as string } };
    }

    const items = await prisma.menuItem.findMany({
      where: {
        tenant_id: tenantId,
        ...branchFilter,
        ...(category_id ? { category_id: category_id as string } : {}),
      },
      include: { 
        category: { select: { id: true, name: true } },
        master_menu_item: true,
        branch: { select: { id: true, name: true } },
      },
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
    const { restaurant_id, branch_id, display_name, description, price, category_id, availability, customizations, image_url, image_urls, is_master, prep_time } = req.body;
    if (!display_name) {
      res.status(400).json({ error: 'display_name is required' });
      return;
    }

    const prepTimeParsed = prep_time !== undefined ? parseInt(prep_time.toString(), 10) || 0 : 0;

    if (is_master) {
      if (!canManageBroadcasted(req)) {
        res.status(403).json({ error: 'Forbidden: Only owners or overall restaurant managers can create master menu items.' });
        return;
      }
      if (!restaurant_id) {
        res.status(400).json({ error: 'restaurant_id is required for master menu item' });
        return;
      }
      const masterItem = await prisma.masterMenuItem.create({
        data: {
          tenant_id: tenantId,
          restaurant_id,
          master_category_id: category_id || null,
          display_name,
          description: description ?? null,
          price: price ?? 0,
          availability: availability ?? true,
          customizations: customizations ?? null,
          image_url: image_url ?? null,
          image_urls: image_urls ?? null,
          prep_time: prepTimeParsed,
        },
        include: { category: { select: { id: true, name: true } } },
      });

      // Broadcast to all active branches
      const branches = await prisma.branch.findMany({
        where: { restaurant_id, deleted_at: null }
      });
      for (const branch of branches) {
        let localCategoryId = null;
        if (category_id) {
          const localCategory = await prisma.category.findFirst({
            where: { branch_id: branch.id, master_category_id: category_id, deleted_at: null }
          });
          localCategoryId = localCategory?.id || null;
        }
        await prisma.menuItem.create({
          data: {
            tenant_id: tenantId,
            branch_id: branch.id,
            master_menu_item_id: masterItem.id,
            category_id: localCategoryId,
            display_name,
            description: description ?? null,
            price: price ?? 0,
            availability: availability ?? true,
            customizations: customizations ?? null,
            image_url: image_url ?? null,
            image_urls: image_urls ?? null,
            prep_time: prepTimeParsed,
          }
        });
      }

      res.status(201).json(masterItem);
      return;
    }

    let resolvedBranchId = branch_id;
    if (!resolvedBranchId) {
      if (req.user!.branchId) {
        resolvedBranchId = req.user!.branchId;
      } else if (restaurant_id) {
        const firstBranch = await prisma.branch.findFirst({
          where: { restaurant_id: restaurant_id as string, deleted_at: null },
        });
        resolvedBranchId = firstBranch?.id;
      }
    }

    if (!resolvedBranchId) {
      res.status(400).json({ error: 'branch_id or restaurant_id with an active branch is required' });
      return;
    }

    if (!hasBranchAccess(req, resolvedBranchId)) {
      res.status(403).json({ error: 'You do not have access to this branch.' });
      return;
    }

    const item = await prisma.menuItem.create({
      data: {
        tenant_id: tenantId,
        branch_id: resolvedBranchId,
        display_name,
        description: description ?? null,
        price: price ?? 0,
        category_id: category_id ?? null,
        availability: availability ?? true,
        customizations: customizations ?? null,
        image_url: image_url ?? null,
        image_urls: image_urls ?? null,
        prep_time: prepTimeParsed,
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
    const { display_name, description, price, category_id, availability, customizations, image_url, image_urls, prep_time } = req.body;
    const menuItemId = req.params.id as string;

    const prepTimeParsed = prep_time !== undefined ? parseInt(prep_time.toString(), 10) || 0 : undefined;

    const item = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (item) {
      if (!hasBranchAccess(req, item.branch_id)) {
        res.status(403).json({ error: 'Forbidden: You cannot modify a menu item belonging to another branch.' });
        return;
      }
      const updatedItem = await prisma.menuItem.update({
        where: { id: menuItemId },
        data: {
          ...(display_name !== undefined && { display_name }),
          ...(description !== undefined && { description }),
          ...(price !== undefined && { price }),
          ...(category_id !== undefined && { category_id }),
          ...(availability !== undefined && { availability }),
          ...(customizations !== undefined && { customizations }),
          ...(image_url !== undefined && { image_url }),
          ...(image_urls !== undefined && { image_urls }),
          ...(prepTimeParsed !== undefined && { prep_time: prepTimeParsed }),
        },
        include: { category: { select: { id: true, name: true } } },
      });
      res.json(updatedItem);
      return;
    }

    const masterItem = await prisma.masterMenuItem.findUnique({ where: { id: menuItemId } });
    if (masterItem) {
      if (!canManageBroadcasted(req)) {
        res.status(403).json({ error: 'Forbidden: Only owners or overall restaurant managers can modify master menu items.' });
        return;
      }
      const updatedMaster = await prisma.masterMenuItem.update({
        where: { id: menuItemId },
        data: {
          ...(display_name !== undefined && { display_name }),
          ...(description !== undefined && { description }),
          ...(price !== undefined && { price }),
          ...(category_id !== undefined && { master_category_id: category_id }),
          ...(availability !== undefined && { availability }),
          ...(customizations !== undefined && { customizations }),
          ...(image_url !== undefined && { image_url }),
          ...(image_urls !== undefined && { image_urls }),
          ...(prepTimeParsed !== undefined && { prep_time: prepTimeParsed }),
        },
        include: { category: { select: { id: true, name: true } } },
      });

      // Propagate display details to local cloned menu items
      await prisma.menuItem.updateMany({
        where: { master_menu_item_id: menuItemId },
        data: {
          ...(display_name !== undefined && { display_name }),
          ...(description !== undefined && { description }),
          ...(customizations !== undefined && { customizations }),
          ...(image_url !== undefined && { image_url }),
          ...(image_urls !== undefined && { image_urls }),
          ...(price !== undefined && { price }),
          ...(availability !== undefined && { availability }),
          ...(prepTimeParsed !== undefined && { prep_time: prepTimeParsed }),
        }
      });
      res.json(updatedMaster);
      return;
    }

    res.status(404).json({ error: 'Menu item not found' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE /api/restaurant/menu/:id
router.delete('/menu/:id', requireRole(...MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const menuItemId = req.params.id as string;

    const item = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (item) {
      if (!hasBranchAccess(req, item.branch_id)) {
        res.status(403).json({ error: 'Forbidden: You cannot delete a menu item belonging to another branch.' });
        return;
      }
      await prisma.menuItem.delete({ where: { id: menuItemId } });
      res.json({ success: true });
      return;
    }

    const masterItem = await prisma.masterMenuItem.findUnique({ where: { id: menuItemId } });
    if (masterItem) {
      if (!canManageBroadcasted(req)) {
        res.status(403).json({ error: 'Forbidden: Only owners or overall restaurant managers can delete master menu items.' });
        return;
      }
      await prisma.masterMenuItem.update({
        where: { id: menuItemId },
        data: { deleted_at: new Date() },
      });
      await prisma.menuItem.deleteMany({
        where: { master_menu_item_id: menuItemId }
      });
      res.json({ success: true });
      return;
    }

    res.status(404).json({ error: 'Menu item not found' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// ─── TABLES ────────────────────────────────────────────────────────────────

// GET /api/restaurant/tables  — ?restaurant_id=... or ?branch_id=...
router.get('/tables', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { restaurant_id, branch_id } = req.query;

    let branchFilter: any = {};
    if (!isOwnerUser(req) && req.user!.branchId) {
      // Non-owner branch accounts always see only their own branch's tables
      branchFilter = { branch_id: req.user!.branchId };
    } else if (branch_id) {
      branchFilter = { branch_id: branch_id as string };
    } else if (restaurant_id) {
      branchFilter = { branch: { restaurant_id: restaurant_id as string } };
    }

    const tables = await prisma.restaurantTable.findMany({
      where: { tenant_id: tenantId, ...branchFilter },
      include: {
        waiter: { select: { id: true, full_name: true, email: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { table_number: 'asc' },
    });
    res.json(tables);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// POST /api/restaurant/tables
// Owners: pass branch_id (one branch), branch_ids[] (selected branches), or all_branches:true + restaurant_id (all branches).
// Branch managers: creates table in their own branch only.
router.post('/tables', requireRole(...MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const { restaurant_id, branch_id, branch_ids, all_branches, table_number, capacity } = req.body;
    if (!table_number || !capacity) {
      res.status(400).json({ error: 'table_number and capacity are required' });
      return;
    }

    const parsedCapacity = parseInt(capacity);

    // ── Multi-branch creation: owners or overall restaurant managers only ──────
    if (canManageBroadcasted(req) && (all_branches || (Array.isArray(branch_ids) && branch_ids.length > 1))) {
      let targetBranchIds: string[] = [];

      if (all_branches && restaurant_id) {
        const branches = await prisma.branch.findMany({
          where: { restaurant_id: restaurant_id as string, tenant_id: tenantId, deleted_at: null },
          select: { id: true },
        });
        targetBranchIds = branches.map(b => b.id);
      } else if (Array.isArray(branch_ids)) {
        targetBranchIds = branch_ids as string[];
      }

      if (targetBranchIds.length === 0) {
        res.status(400).json({ error: 'No valid branches found for table creation' });
        return;
      }

      const created = await Promise.all(
        targetBranchIds.map(bid =>
          prisma.restaurantTable.create({
            data: { tenant_id: tenantId, branch_id: bid, table_number, capacity: parsedCapacity },
          })
        )
      );
      res.status(201).json(created);
      return;
    }

    // ── Single branch creation (owner/overall-manager specifying one branch, or branch manager) ─
    let resolvedBranchId = branch_id;
    if (!resolvedBranchId) {
      if (req.user!.branchId) {
        resolvedBranchId = req.user!.branchId;
      } else if (restaurant_id) {
        const firstBranch = await prisma.branch.findFirst({
          where: { restaurant_id: restaurant_id as string, deleted_at: null },
        });
        resolvedBranchId = firstBranch?.id;
      }
    }

    if (!resolvedBranchId) {
      res.status(400).json({ error: 'branch_id or restaurant_id with an active branch is required' });
      return;
    }

    if (!hasBranchAccess(req, resolvedBranchId)) {
      res.status(403).json({ error: 'You do not have access to this branch.' });
      return;
    }

    const table = await prisma.restaurantTable.create({
      data: { tenant_id: tenantId, branch_id: resolvedBranchId, table_number, capacity: parsedCapacity },
    });
    res.status(201).json(table);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create table' });
  }
});

// DELETE /api/restaurant/tables/:id
router.delete('/tables/:id', requireRole(...MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }

    const tableId = req.params.id as string;

    const table = await prisma.restaurantTable.findFirst({
      where: { id: tableId, tenant_id: tenantId },
    });
    if (!table) { res.status(404).json({ error: 'Table not found' }); return; }

    // Only allow access to tables in the user's own branch
    if (!hasBranchAccess(req, table.branch_id)) {
      res.status(403).json({ error: 'You do not have access to this branch.' });
      return;
    }

    await prisma.qRCode.deleteMany({ where: { table_id: tableId } });
    await prisma.restaurantTable.delete({ where: { id: tableId } });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

// PATCH /api/restaurant/tables/:id/waiter  – assign/unassign waiter to a table
router.patch('/tables/:id/waiter', requireRole(...MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ error: 'Tenant context required' }); return; }
    const tableId = req.params.id as string;
    const { waiter_id } = req.body;

    const table = await prisma.restaurantTable.findFirst({ where: { id: tableId, tenant_id: tenantId } });
    if (!table) { res.status(404).json({ error: 'Table not found' }); return; }

    // Only allow access to tables in the user's own branch
    if (!hasBranchAccess(req, table.branch_id)) {
      res.status(403).json({ error: 'You do not have access to this branch.' });
      return;
    }

    // Waiter must be in the same branch as the table
    if (waiter_id) {
      const waiter = await prisma.user.findFirst({ where: { id: waiter_id, tenant_id: tenantId, branch_id: table.branch_id } });
      if (!waiter) { res.status(404).json({ error: 'Waiter not found in this branch' }); return; }
    }

    const updated = await prisma.restaurantTable.update({
      where: { id: tableId },
      data: { waiter_id: waiter_id || null },
      include: { waiter: { select: { id: true, full_name: true, email: true } } },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update table waiter assignment' });
  }
});

export default router;

