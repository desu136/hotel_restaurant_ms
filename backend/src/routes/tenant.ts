import { Router, Request, Response } from 'express';
import { hash } from 'bcrypt';
import { prisma } from '../lib/prisma';

const router = Router();

// POST /api/tenant/register
// Uses sequential queries (no $transaction) because Neon's PgBouncer
// connection pooler (pgbouncer=true) does not support interactive transactions.
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  let tenantId: string | null = null;

  try {
    const { businessName, businessType, ownerName, email, phone, password } = req.body;

    if (!businessName || !businessType || !ownerName || !email || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const passwordHash = await hash(password, 10);

    // ── Step 1: Create tenant ────────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: {
        business_name: businessName,
        business_type: businessType,
        owner_name: ownerName,
        email,
        phone,
        status: 'PENDING',
      },
    });
    tenantId = tenant.id;

    // ── Step 2: Look up the owner role ───────────────────────────────────────
    const ownerRole = await prisma.role.findUnique({ where: { code: 'HOTEL_OWNER' } });

    // ── Step 3: Create owner user ────────────────────────────────────────────
    await prisma.user.create({
      data: {
        tenant_id: tenant.id,
        full_name: ownerName,
        email,
        phone,
        password_hash: passwordHash,
        status: 'ACTIVE',
        roles: ownerRole ? { create: { role_id: ownerRole.id } } : undefined,
      },
    });

    // ── Step 4: Resolve trial plan ───────────────────────────────────────────
    let plan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Trial Plan' } });
    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: { name: 'Trial Plan', monthly_price: 0, annual_price: 0, trial_days: 14 },
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.trial_days);

    // ── Step 5: Create trial subscription ───────────────────────────────────
    await prisma.tenantSubscription.create({
      data: {
        tenant_id: tenant.id,
        plan_id: plan.id,
        start_date: startDate,
        end_date: endDate,
        status: 'TRIAL',
      },
    });

    // ── Step 6: Auto-create root restaurant brand profile ────────────────────
    await prisma.restaurant.create({
      data: {
        tenant_id: tenant.id,
        name: businessName,
        parent_id: null,
      },
    });

    res.status(201).json({ success: true, tenant });
  } catch (error: any) {
    console.error('Registration error:', error);

    // Best-effort cleanup: delete the tenant (cascades to users, subscriptions)
    if (tenantId) {
      try {
        await prisma.tenant.delete({ where: { id: tenantId } });
      } catch (cleanupErr) {
        console.error('Cleanup error (tenant delete):', cleanupErr);
      }
    }

    if (error.code === 'P2002') {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

export default router;
