import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// POST /api/orders/public - Customer self-ordering from a table QR code
router.post('/public', async (req: Request, res: Response): Promise<void> => {
  try {
    const { restaurant_id, table_id, items, notes } = req.body;

    if (!restaurant_id) {
      res.status(400).json({ error: 'restaurant_id is required' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one item is required' });
      return;
    }

    // Get tenant and branch from the restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurant_id },
    });

    if (!restaurant) {
      res.status(400).json({ error: 'Restaurant not found' });
      return;
    }

    const tenantId = restaurant.tenant_id;
    const branchId = restaurant.branch_id;

    // Get or create walk-in customer for this tenant
    let walkInCustomer = await prisma.customer.findFirst({
      where: { full_name: 'QR Customer', phone: `qrcustomer-${tenantId}` },
    });
    if (!walkInCustomer) {
      walkInCustomer = await prisma.customer.create({
        data: { full_name: 'QR Customer', phone: `qrcustomer-${tenantId}`, source: 'WEB' },
      });
    }

    // Calculate total amount and prepare items
    let totalAmount = 0;
    const orderItems: { menu_item_id: string; quantity: number; unit_price: number; customizations: any }[] = [];
    
    interface CustomizationValue {
      name: string;
      extraPrice: number;
    }
    interface Customization {
      key: string;
      label: string;
      multiple: boolean;
      values: CustomizationValue[];
    }

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menu_item_id } });
      if (!menuItem) {
        res.status(400).json({ error: `Menu item ${item.menu_item_id} not found` });
        return;
      }
      let unit_price = parseFloat(menuItem.price.toString());
      
      // Calculate extra price from customizations if present
      if (item.customizations && menuItem.customizations) {
        const itemCustomizations = menuItem.customizations as any as Customization[];
        for (const [key, selectedVal] of Object.entries(item.customizations)) {
          const group = itemCustomizations.find(g => g.key === key);
          if (group && group.values) {
            if (Array.isArray(selectedVal)) {
              for (const v of selectedVal) {
                const choice = group.values.find(choiceVal => choiceVal.name === v);
                if (choice && choice.extraPrice) {
                  unit_price += parseFloat(choice.extraPrice.toString());
                }
              }
            } else if (typeof selectedVal === 'string' && selectedVal) {
              const choice = group.values.find(choiceVal => choiceVal.name === selectedVal);
              if (choice && choice.extraPrice) {
                unit_price += parseFloat(choice.extraPrice.toString());
              }
            }
          }
        }
      }

      const qty = parseInt(item.quantity);
      totalAmount += unit_price * qty;
      orderItems.push({
        menu_item_id: item.menu_item_id,
        quantity: qty,
        unit_price,
        customizations: item.customizations || null,
      });
    }

    const order = await prisma.order.create({
      data: {
        tenant_id: tenantId,
        branch_id: branchId,
        customer_id: walkInCustomer.id,
        table_id: table_id || null,
        order_type: 'DINE_IN',
        status: 'PENDING',
        total_amount: totalAmount,
        items: {
          create: orderItems,
        },
        kitchen_tickets: {
          create: { status: 'PENDING' },
        },
      },
      include: {
        items: { include: { menu_item: true } },
        table: true,
        kitchen_tickets: true,
      },
    });

    res.status(201).json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// GET /api/orders/public/:id - Customer self-ordering status check
router.get('/public/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id as string },
      include: {
        items: { include: { menu_item: true } },
        table: true,
      },
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});
// GET /api/orders/public/ready/:restaurantId - Unified waiter screen (no auth, publicly pollable)
router.get('/public/ready/:restaurantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantId = req.params.restaurantId as string;
    const orders = await prisma.order.findMany({
      where: {
        status: 'READY',
        table: { restaurant_id: restaurantId },
      },
      include: {
        items: { include: { menu_item: { select: { display_name: true } } } },
        table: {
          include: {
            waiter: { select: { id: true, full_name: true } },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch ready orders' });
  }
});

router.use(authenticate);

// GET /api/orders/my-ready – Waiter sees only READY orders for tables assigned to them
router.get('/my-ready', async (req: Request, res: Response): Promise<void> => {
  try {
    const waiterId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const orders = await prisma.order.findMany({
      where: {
        tenant_id: tenantId as string,
        status: 'READY',
        table: { waiter_id: waiterId },
      },
      include: {
        items: { include: { menu_item: { select: { display_name: true } } } },
        table: { select: { id: true, table_number: true, waiter_id: true } },
      },
      orderBy: { created_at: 'asc' },
    });
    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch waiter ready orders' });
  }
});


// GET /api/orders  – list orders for tenant (filtered by branch if applicable)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const { status, limit = '50' } = req.query;

    const isWaiter = req.user!.roles.includes('WAITER') &&
      !req.user!.roles.some(r => ['HOTEL_OWNER', 'HOTEL_MANAGER', 'RESTAURANT_MANAGER'].includes(r));

    const whereClause: any = {
      tenant_id: tenantId as string,
      ...(status ? { status: status as any } : {}),
    };

    if (isWaiter) {
      whereClause.OR = [
        { waiter_id: req.user!.userId },
        { table: { waiter_id: req.user!.userId } }
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: { include: { menu_item: true } },
        table: true,
        bills: true,
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit as string),
    });
    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    const isWaiter = req.user!.roles.includes('WAITER') &&
      !req.user!.roles.some(r => ['HOTEL_OWNER', 'HOTEL_MANAGER', 'RESTAURANT_MANAGER'].includes(r));

    const order = await prisma.order.findFirst({
      where: {
        id: id as string,
        tenant_id: tenantId as string,
        ...(isWaiter ? {
          OR: [
            { waiter_id: req.user!.userId },
            { table: { waiter_id: req.user!.userId } }
          ]
        } : {})
      },
      include: {
        items: { include: { menu_item: true } },
        table: true,
        bills: true,
        kitchen_tickets: true,
      },
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders  – Waiter creates a new order
router.post('/', requireRole('WAITER', 'RESTAURANT_MANAGER', 'HOTEL_OWNER', 'HOTEL_MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const branchId = req.user!.branchId;
    const waiterId = req.user!.userId;
    const { table_id, order_type = 'DINE_IN', items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one item is required' });
      return;
    }
    if (!branchId) {
      res.status(400).json({ error: 'Waiter must be assigned to a branch' });
      return;
    }

    const isWaiter = req.user!.roles.includes('WAITER') &&
      !req.user!.roles.some(r => ['HOTEL_OWNER', 'HOTEL_MANAGER', 'RESTAURANT_MANAGER'].includes(r));

    if (isWaiter && table_id) {
      const table = await prisma.restaurantTable.findFirst({
        where: { id: table_id, waiter_id: req.user!.userId }
      });
      if (!table) {
        res.status(403).json({ error: 'Forbidden: You are not assigned to this table' });
        return;
      }
    }

    // Need a customer ID – for dine-in we use a generic walk-in customer per tenant
    let walkInCustomer = await prisma.customer.findFirst({
      where: { full_name: 'Walk-in Customer', phone: `walkin-${tenantId}` },
    });
    if (!walkInCustomer) {
      walkInCustomer = await prisma.customer.create({
        data: { full_name: 'Walk-in Customer', phone: `walkin-${tenantId}`, source: 'WEB' },
      });
    }

    // Calculate total
    let totalAmount = 0;
    const orderItems: { menu_item_id: string; quantity: number; unit_price: number }[] = [];
    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menu_item_id } });
      if (!menuItem) {
        res.status(400).json({ error: `Menu item ${item.menu_item_id} not found` });
        return;
      }
      const unit_price = parseFloat(item.unit_price);
      totalAmount += unit_price * item.quantity;
      orderItems.push({ menu_item_id: item.menu_item_id, quantity: item.quantity, unit_price });
    }

    const order = await prisma.order.create({
      data: {
        tenant_id: tenantId!,
        branch_id: branchId,
        customer_id: walkInCustomer.id,
        table_id: table_id || null,
        waiter_id: waiterId,
        order_type,
        status: 'PENDING',
        total_amount: totalAmount,
        items: {
          create: orderItems,
        },
        kitchen_tickets: {
          create: { status: 'PENDING' },
        },
      },
      include: {
        items: { include: { menu_item: true } },
        table: true,
        kitchen_tickets: true,
      },
    });

    res.status(201).json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PATCH /api/orders/:id/status  – Update order/kitchen status
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.user!.tenantId;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: id as string },
      include: { table: true }
    });

    if (!existingOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const isWaiter = req.user!.roles.includes('WAITER') &&
      !req.user!.roles.some(r => ['HOTEL_OWNER', 'HOTEL_MANAGER', 'RESTAURANT_MANAGER'].includes(r));

    if (isWaiter) {
      const isAssigned = existingOrder.waiter_id === req.user!.userId || 
        (existingOrder.table && existingOrder.table.waiter_id === req.user!.userId);
      if (!isAssigned) {
        res.status(403).json({ error: 'Forbidden: You cannot modify this order' });
        return;
      }
    }

    let waiterIdToSet = existingOrder?.waiter_id || null;
    if (!waiterIdToSet && existingOrder?.table?.waiter_id) {
      waiterIdToSet = existingOrder.table.waiter_id;
    }

    const order = await prisma.order.update({
      where: { id: id as string },
      data: {
        status,
        waiter_id: waiterIdToSet,
      },
      include: { items: { include: { menu_item: true } }, table: true },
    });

    // Also update kitchen ticket if relevant
    if (['PREPARING', 'READY'].includes(status)) {
      const ktStatus = status === 'PREPARING' ? 'PREPARING' : 'READY';
      await prisma.kitchenTicket.updateMany({
        where: { order_id: id as string },
        data: { status: ktStatus as any },
      });
    }

    res.json(order);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
