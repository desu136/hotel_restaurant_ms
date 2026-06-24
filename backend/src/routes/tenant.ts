import { Router, Request, Response } from 'express';
import { hash } from 'bcrypt';
import { prisma } from '../lib/prisma';

const router = Router();

// POST /api/tenant/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessName, businessType, ownerName, email, phone, password } = req.body;

    if (!businessName || !businessType || !ownerName || !email || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const passwordHash = await hash(password, 10);

    const newTenant = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          business_name: businessName,
          business_type: businessType,
          owner_name: ownerName,
          email,
          phone,
          status: 'PENDING',
        },
      });

      const ownerRole = await tx.role.findUnique({ where: { code: 'HOTEL_OWNER' } });

      await tx.user.create({
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

      let plan = await tx.subscriptionPlan.findFirst({ where: { name: 'Trial Plan' } });
      if (!plan) {
        plan = await tx.subscriptionPlan.create({
          data: { name: 'Trial Plan', monthly_price: 0, annual_price: 0, trial_days: 14 },
        });
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + plan.trial_days);

      await tx.tenantSubscription.create({
        data: {
          tenant_id: tenant.id,
          plan_id: plan.id,
          start_date: startDate,
          end_date: endDate,
          status: 'TRIAL',
        },
      });

      return tenant;
    }, { timeout: 30000 });

    res.status(201).json({ success: true, tenant: newTenant });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
