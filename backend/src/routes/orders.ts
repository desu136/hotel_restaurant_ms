import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import QRCode from 'qrcode';

const router = Router();

async function generateOrderNumber(branchId: string): Promise<string> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const count = await prisma.order.count({
    where: { branch_id: branchId, created_at: { gte: startOfToday } },
  });
  return String(count + 1).padStart(2, '0');
}

async function calculateEstimatedPrepTime(
  branchId: string,
  items: { menu_item_id: string; quantity: number }[]
): Promise<{ estimatedPrepTimeMinutes: number; estimatedReadyAt: Date }> {
  let maxPrepTimeForOrder = 0;

  for (const item of items) {
    // 1. Get the menu item to find its prep_time
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: item.menu_item_id },
      select: { prep_time: true }
    });
    const prepTime = menuItem?.prep_time ?? 0; // in minutes
    
    // 2. Base prep time for this item in the current order
    const currentItemPrepTime = prepTime * item.quantity;

    // 3. Find preceding orders (same branch, status in PENDING, CONFIRMED, PREPARING)
    // that contain the same menu_item_id
    const precedingOrderItems = await prisma.orderItem.findMany({
      where: {
        menu_item_id: item.menu_item_id,
        order: {
          branch_id: branchId,
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] }
        }
      },
      select: {
        quantity: true
      }
    });

    const precedingQuantity = precedingOrderItems.reduce((sum, poi) => sum + poi.quantity, 0);
    const precedingItemPrepTime = prepTime * precedingQuantity;

    const totalItemPrepTime = precedingItemPrepTime + currentItemPrepTime;
    if (totalItemPrepTime > maxPrepTimeForOrder) {
      maxPrepTimeForOrder = totalItemPrepTime;
    }
  }

  const estimatedReadyAt = new Date(Date.now() + maxPrepTimeForOrder * 60 * 1000);
  return {
    estimatedPrepTimeMinutes: maxPrepTimeForOrder,
    estimatedReadyAt
  };
}

// POST /api/orders/public - Customer self-ordering from a table QR code
router.post('/public', async (req: Request, res: Response): Promise<void> => {
  try {
    const { restaurant_id, branch_id, table_id, items, notes, order_type = 'DINE_IN', delivery_address, userId, userName, userEmail } = req.body;

    if (!restaurant_id) {
      res.status(400).json({ error: 'restaurant_id is required' });
      return;
    }

    const validOrderTypes = ['DINE_IN', 'ROOM_SERVICE', 'TAKEAWAY', 'DELIVERY'];
    if (!validOrderTypes.includes(order_type)) {
      res.status(400).json({ error: `Invalid order_type. Must be one of: ${validOrderTypes.join(', ')}` });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one item is required' });
      return;
    }

    let resolvedBranchId = branch_id;
    let tenantId = null;

    if (table_id) {
      const table = await prisma.restaurantTable.findUnique({
        where: { id: table_id },
        include: { branch: true }
      });
      if (table) {
        resolvedBranchId = table.branch_id;
        tenantId = table.tenant_id;
      }
    }

    if (!resolvedBranchId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurant_id },
        include: { branches: true }
      });
      if (restaurant && restaurant.branches.length > 0) {
        resolvedBranchId = restaurant.branches[0].id;
        tenantId = restaurant.tenant_id;
      }
    }

    if (!resolvedBranchId) {
      res.status(400).json({ error: 'branch_id or table_id is required' });
      return;
    }

    if (!tenantId) {
      const branch = await prisma.branch.findUnique({
        where: { id: resolvedBranchId },
      });
      if (!branch) {
        res.status(404).json({ error: 'Branch not found' });
        return;
      }
      tenantId = branch.tenant_id;
    }

    const branchId = resolvedBranchId;

    let customerId: string;
    if (userId) {
      const identity = await prisma.customerIdentity.findFirst({
        where: {
          external_user_id: userId,
          provider: 'ECHAT',
        },
        include: { customer: true },
      });

      if (identity) {
        customerId = identity.customer_id;
        if (userName || userEmail) {
          await prisma.customer.update({
            where: { id: customerId },
            data: {
              ...(userName ? { full_name: userName } : {}),
              ...(userEmail ? { email: userEmail } : {}),
            },
          });
        }
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            full_name: userName || 'Mini-App Customer',
            email: userEmail || null,
            source: 'MINI_APP',
            identities: {
              create: {
                external_user_id: userId,
                provider: 'ECHAT',
              },
            },
          },
        });
        customerId = newCustomer.id;
      }
    } else {
      // Get or create walk-in customer for this tenant
      let walkInCustomer = await prisma.customer.findFirst({
        where: { full_name: 'QR Customer', phone: `qrcustomer-${tenantId}` },
      });
      if (!walkInCustomer) {
        walkInCustomer = await prisma.customer.create({
          data: { full_name: 'QR Customer', phone: `qrcustomer-${tenantId}`, source: 'WEB' },
        });
      }
      customerId = walkInCustomer.id;
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

    const { estimatedPrepTimeMinutes, estimatedReadyAt } = await calculateEstimatedPrepTime(resolvedBranchId, orderItems);

    const orderData: any = {
      tenant_id: tenantId,
      branch_id: resolvedBranchId,
      order_number: await generateOrderNumber(resolvedBranchId),
      customer_id: customerId,
      table_id: table_id || null,
      order_type: order_type as any,
      status: 'PENDING',
      total_amount: totalAmount,
      estimated_prep_time: estimatedPrepTimeMinutes,
      estimated_ready_at: estimatedReadyAt,
      items: {
        create: orderItems,
      },
      kitchen_tickets: {
        create: { status: 'PENDING' },
      },
    };

    if (order_type === 'DELIVERY') {
      orderData.deliveries = {
        create: {
          delivery_address: delivery_address || 'No address provided',
          status: 'PENDING',
        }
      };
    }

    const order = await prisma.order.create({
      data: orderData,
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

// ── Specific public routes FIRST (must come before the wildcard /public/:id) ──

// GET /api/orders/public/history - Customer order history by userId or orderIds
router.get('/public/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, orderIds } = req.query;

    const fetchOrders = async (where: object) =>
      prisma.order.findMany({
        where,
        include: {
          items: { include: { menu_item: true } },
          branch: { include: { restaurant: true } },
          table: true,
        },
        orderBy: { created_at: 'desc' },
      });


    // Fallback: fetch by known localStorage order IDs
    if (!userId && orderIds) {
      const ids = (orderIds as string).split(',').filter(Boolean);
      if (ids.length === 0) { res.json([]); return; }
      res.json(await fetchOrders({ id: { in: ids } }));
      return;
    }

    if (!userId) {
      res.status(400).json({ error: 'userId or orderIds is required' });
      return;
    }

    const identity = await prisma.customerIdentity.findFirst({
      where: { external_user_id: userId as string, provider: 'ECHAT' },
    });
    if (!identity) { res.json([]); return; }

    res.json(await fetchOrders({ customer_id: identity.customer_id }));

  } catch (e: any) {
    console.error('[history] Failed:', e?.message, e?.code);
    res.status(500).json({ error: 'Failed to fetch order history', detail: e?.message });
  }
});

// GET /api/orders/public/ready/:restaurantId - Unified waiter screen (no auth, publicly pollable)
router.get('/public/ready/:restaurantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantId = req.params.restaurantId as string;
    const { branch_id } = req.query;

    const whereClause: any = {
      status: 'READY',
    };

    if (branch_id) {
      whereClause.branch_id = branch_id as string;
    } else {
      whereClause.branch = { restaurant_id: restaurantId };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
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

// PATCH /api/orders/public/:id/confirm-delivery - Confirm delivery via scanned QR code
router.patch('/public/:id/confirm-delivery', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    res.status(400).json({ error: 'Invalid order ID' });
    return;
  }
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true }
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.status !== 'READY') {
      res.status(400).json({ error: 'Order is not in READY status' });
      return;
    }
    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'COMPLETED' },
      select: { id: true, status: true }
    });
    res.json({ success: true, order: updated });
  } catch (e: any) {
    console.error('[confirm-delivery] Failed:', e?.message);
    res.status(500).json({ error: 'Failed to confirm delivery' });
  }
});

// GET /api/orders/public/:id - Single order status (wildcard — MUST be last among public routes)
router.get('/public/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  try {
    const order = await prisma.order.findUnique({
      where: { id: id as string },

      select: {
        id: true,
        order_number: true,
        status: true,
        order_type: true,
        total_amount: true,
        created_at: true,
      },
    });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } catch (e: any) {
    console.error('[order/:id] Failed:', e?.message);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});


router.use(authenticate);

// GET /api/orders/:id/delivery-qr - Generate delivery QR code for waiter
router.get('/:id/delivery-qr', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    res.status(400).json({ error: 'Invalid order ID' });
    return;
  }
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true }
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.status !== 'READY') {
      res.status(400).json({ error: 'Order is not in READY status' });
      return;
    }

    const qrString = `order_delivery:${order.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    res.json({ qrCodeUrl: qrCodeDataUrl });
  } catch (e: any) {
    console.error('Failed to generate delivery QR:', e);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

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

    const isOwner = req.user!.roles.includes('HOTEL_OWNER');
    const branchId = req.user!.branchId;
    const isWaiter = req.user!.roles.includes('WAITER') &&
      !req.user!.roles.some(r => ['HOTEL_OWNER', 'HOTEL_MANAGER', 'RESTAURANT_MANAGER'].includes(r));

    const whereClause: any = {
      tenant_id: tenantId as string,
      ...(status ? { status: status as any } : {}),
    };

    if (!isOwner && branchId) {
      whereClause.branch_id = branchId;
    }

    if (isWaiter) {
      whereClause.OR = [
        { waiter_id: req.user!.userId },
        { table: { waiter_id: req.user!.userId } },
        { table_id: null }
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: { include: { menu_item: true } },
        table: true,
        bills: true,
        deliveries: true,
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

    const isOwner = req.user!.roles.includes('HOTEL_OWNER');
    if (!isOwner && order.branch_id !== req.user!.branchId) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this order' });
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
    let resolvedBranchId = branchId;
    if (!resolvedBranchId && req.user!.roles.includes('HOTEL_OWNER')) {
      if (table_id) {
        const table = await prisma.restaurantTable.findUnique({
          where: { id: table_id },
          select: { branch_id: true }
        });
        resolvedBranchId = table?.branch_id ?? null;
      }
    }

    if (!resolvedBranchId) {
      res.status(400).json({ error: 'Branch assignment required' });
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

    const { estimatedPrepTimeMinutes, estimatedReadyAt } = await calculateEstimatedPrepTime(resolvedBranchId, orderItems);

    const order = await prisma.order.create({
      data: {
        tenant_id: tenantId!,
        branch_id: resolvedBranchId,
        order_number: await generateOrderNumber(resolvedBranchId),
        customer_id: walkInCustomer.id,
        table_id: table_id || null,
        waiter_id: waiterId,
        order_type,
        status: 'PENDING',
        total_amount: totalAmount,
        placed_by_staff: true,
        estimated_prep_time: estimatedPrepTimeMinutes,
        estimated_ready_at: estimatedReadyAt,
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

    const isOwner = req.user!.roles.includes('HOTEL_OWNER');
    if (!isOwner && existingOrder.branch_id !== req.user!.branchId) {
      res.status(403).json({ error: 'Forbidden: You cannot modify orders from another branch' });
      return;
    }

    const isWaiter = req.user!.roles.includes('WAITER') &&
      !req.user!.roles.some(r => ['HOTEL_OWNER', 'HOTEL_MANAGER', 'RESTAURANT_MANAGER'].includes(r));

    if (isWaiter) {
      // Waiter can only modify orders within their own branch
      if (existingOrder.branch_id !== req.user!.branchId) {
        res.status(403).json({ error: 'Forbidden: You cannot modify orders from another branch' });
        return;
      }

      const isAssigned = existingOrder.waiter_id === req.user!.userId || 
        (existingOrder.table && existingOrder.table.waiter_id === req.user!.userId);
      
      const isTakeawayOrDelivery = existingOrder.order_type === 'TAKEAWAY' || existingOrder.order_type === 'DELIVERY';
      const isUnassignedPreorder = existingOrder.table_id === null && existingOrder.waiter_id === null;

      if (!isAssigned && !isTakeawayOrDelivery && !isUnassignedPreorder) {
        res.status(403).json({ error: 'Forbidden: You cannot modify this order' });
        return;
      }
    }

    let waiterIdToSet = existingOrder?.waiter_id || null;
    if (!waiterIdToSet) {
      if (existingOrder?.table?.waiter_id) {
        waiterIdToSet = existingOrder.table.waiter_id;
      } else if (req.user!.roles.includes('WAITER')) {
        waiterIdToSet = req.user!.userId;
      }
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

// PATCH /api/orders/:id/table - Assign a table to a pre-ordered dine-in record
router.patch('/:id/table', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { table_id } = req.body;

    if (!table_id) {
      res.status(400).json({ error: 'table_id is required' });
      return;
    }

    const table = await prisma.restaurantTable.findUnique({
      where: { id: table_id },
      include: { branch: { include: { restaurant: true } } },
    });

    if (!table) {
      res.status(404).json({ error: 'Table not found' });
      return;
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: id as string },
    });

    if (!existingOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = await prisma.order.update({
      where: { id: id as string },
      data: {
        table_id,
        waiter_id: table.waiter_id || req.user!.userId,
      },
      include: {
        items: { include: { menu_item: true } },
        table: true,
        bills: true,
        deliveries: true,
      },
    });

    res.json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to assign table to order' });
  }
});

export default router;
