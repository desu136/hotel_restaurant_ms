import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/billing/unpaid  – Orders with no paid bill yet
router.get('/unpaid', requireRole('CASHIER', 'RESTAURANT_MANAGER', 'HOTEL_OWNER', 'HOTEL_MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;

    const orders = await prisma.order.findMany({
      where: {
        tenant_id: tenantId as string,
        status: { in: ['READY', 'COMPLETED'] },
        bills: {
          none: { payment_status: 'PAID' },
        },
      },
      include: {
        items: { include: { menu_item: true } },
        table: true,
        bills: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch unpaid orders' });
  }
});

// POST /api/billing/bill  – Create a bill for an order
router.post('/bill', requireRole('CASHIER', 'RESTAURANT_MANAGER', 'HOTEL_OWNER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { order_id, amount, discount_percent = 0 } = req.body;
    if (!order_id || !amount) {
      res.status(400).json({ error: 'order_id and amount are required' });
      return;
    }
    const bill = await prisma.bill.create({
      data: {
        order_id,
        amount: parseFloat(amount),
        payment_status: 'PENDING',
      },
    });
    res.status(201).json(bill);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

// POST /api/billing/bill/:id/pay  – Record a payment
router.post('/bill/:id/pay', requireRole('CASHIER', 'RESTAURANT_MANAGER', 'HOTEL_OWNER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const bill = await prisma.bill.update({
      where: { id: id as string },
      data: { payment_status: 'PAID' },
    });
    // Mark the associated order as COMPLETED
    await prisma.order.update({
      where: { id: bill.order_id as string },
      data: { status: 'COMPLETED' },
    });
    res.json({ success: true, bill });
  } catch (e) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// GET /api/billing/history  – Paid bills today
router.get('/history', requireRole('CASHIER', 'RESTAURANT_MANAGER', 'HOTEL_OWNER', 'HOTEL_MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const bills = await prisma.bill.findMany({
      where: {
        payment_status: 'PAID',
        created_at: { gte: startOfDay },
        order: { tenant_id: tenantId as string },
      },
      include: {
        order: { include: { table: true, items: { include: { menu_item: true } } } },
      },
      orderBy: { updated_at: 'desc' },
    });

    const total = bills.reduce((sum, b) => sum + Number(b.amount), 0);
    res.json({ bills, total_collected: total });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch billing history' });
  }
});

export default router;
