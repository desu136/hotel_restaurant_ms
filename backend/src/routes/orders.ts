import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/orders  – list orders for tenant (filtered by branch if applicable)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const { status, limit = '50' } = req.query;

    const orders = await prisma.order.findMany({
      where: {
        tenant_id: tenantId as string,
        ...(status ? { status: status as any } : {}),
      },
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
    const order = await prisma.order.findFirst({
      where: { id: id as string, tenant_id: tenantId as string },
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

    const order = await prisma.order.update({
      where: { id: id as string },
      data: { status },
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
