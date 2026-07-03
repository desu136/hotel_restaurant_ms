import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const MANAGER_ROLES = ['HOTEL_OWNER', 'HOTEL_MANAGER', 'RESTAURANT_MANAGER'] as const;

const isOwnerUser = (req: Request) =>
  req.user!.roles.includes('HOTEL_OWNER');

// GET /api/reports/summary
// Returns revenue, order counts, top items, and daily trends for the tenant/branch
router.get(
  '/summary',
  requireRole(...MANAGER_ROLES),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const isOwner = isOwnerUser(req);
      const branchId = req.user!.branchId;
      const { range = '7' } = req.query; // days: 7, 30, 90

      const days = Math.min(parseInt(range as string) || 7, 365);
      const since = new Date();
      since.setDate(since.getDate() - days);
      since.setHours(0, 0, 0, 0);

      const branchFilter = !isOwner && branchId ? { branch_id: branchId } : {};

      // ── 1. All completed/paid orders in range ─────────────────────────────
      const orders = await prisma.order.findMany({
        where: {
          tenant_id: tenantId as string,
          created_at: { gte: since },
          ...branchFilter,
        },
        include: {
          items: { include: { menu_item: { select: { display_name: true } } } },
          bills: { select: { payment_status: true, amount: true } },
        },
        orderBy: { created_at: 'asc' },
      });

      // ── 2. Revenue metrics ────────────────────────────────────────────────
      const completedOrders = orders.filter(o =>
        ['COMPLETED', 'READY'].includes(o.status)
      );
      const paidOrders = orders.filter(o =>
        o.bills.some(b => b.payment_status === 'PAID')
      );
      const totalRevenue = paidOrders.reduce((sum, o) =>
        sum + o.bills
          .filter(b => b.payment_status === 'PAID')
          .reduce((s, b) => s + Number(b.amount), 0), 0
      );
      const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');

      // ── 3. Order status breakdown ─────────────────────────────────────────
      const statusCounts: Record<string, number> = {};
      for (const o of orders) {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      }

      // ── 4. Top 10 menu items by quantity ──────────────────────────────────
      const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};
      for (const o of orders) {
        for (const item of o.items) {
          const key = item.menu_item_id;
          if (!itemMap[key]) {
            itemMap[key] = {
              name: item.menu_item?.display_name ?? 'Unknown',
              qty: 0,
              revenue: 0,
            };
          }
          itemMap[key].qty += item.quantity;
          itemMap[key].revenue += Number(item.unit_price) * item.quantity;
        }
      }
      const topItems = Object.values(itemMap)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);

      // ── 5. Daily revenue trend ────────────────────────────────────────────
      const dailyMap: Record<string, { date: string; revenue: number; orders: number }> = {};
      for (const o of paidOrders) {
        const dateKey = o.created_at.toISOString().split('T')[0];
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
        }
        const paid = o.bills
          .filter(b => b.payment_status === 'PAID')
          .reduce((s, b) => s + Number(b.amount), 0);
        dailyMap[dateKey].revenue += paid;
        dailyMap[dateKey].orders += 1;
      }
      const dailyTrend = Object.values(dailyMap).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      // ── 6. Order type breakdown ───────────────────────────────────────────
      const typeCounts: Record<string, number> = {};
      for (const o of orders) {
        typeCounts[o.order_type] = (typeCounts[o.order_type] || 0) + 1;
      }

      // ── 7. Peak hour breakdown ────────────────────────────────────────────
      const hourMap: Record<number, number> = {};
      for (const o of orders) {
        const hour = new Date(o.created_at).getHours();
        hourMap[hour] = (hourMap[hour] || 0) + 1;
      }
      const peakHours = Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        count: hourMap[h] || 0,
      }));

      // ── 8. Branch breakdown (owner only) ─────────────────────────────────
      let branchBreakdown: { branchId: string; name: string; revenue: number; orders: number }[] = [];
      if (isOwner) {
        const branchMap: Record<string, { name?: string; revenue: number; orders: number }> = {};
        const branches = await prisma.branch.findMany({
          where: { tenant_id: tenantId as string, deleted_at: null },
          select: { id: true, name: true },
        });
        for (const b of branches) branchMap[b.id] = { name: b.name, revenue: 0, orders: 0 };

        for (const o of paidOrders) {
          if (o.branch_id && branchMap[o.branch_id]) {
            branchMap[o.branch_id].orders += 1;
            branchMap[o.branch_id].revenue += o.bills
              .filter(b => b.payment_status === 'PAID')
              .reduce((s, b) => s + Number(b.amount), 0);
          }
        }
        branchBreakdown = Object.entries(branchMap).map(([id, d]) => ({
          branchId: id,
          name: d.name ?? id,
          revenue: d.revenue,
          orders: d.orders,
        }));
      }

      res.json({
        range: days,
        since: since.toISOString(),
        summary: {
          totalOrders: orders.length,
          completedOrders: completedOrders.length,
          cancelledOrders: cancelledOrders.length,
          paidOrders: paidOrders.length,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          avgOrderValue: paidOrders.length
            ? Math.round((totalRevenue / paidOrders.length) * 100) / 100
            : 0,
        },
        statusCounts,
        typeCounts,
        topItems,
        dailyTrend,
        peakHours,
        branchBreakdown,
      });
    } catch (e) {
      console.error('GET /api/reports/summary error:', e);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }
);

export default router;
