import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'User account is suspended' });
      return;
    }

    const roleCodes = user.roles.map(ur => ur.role.code);

    if (!roleCodes.includes('SUPER_ADMIN') && user.tenant?.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Tenant account is not active' });
      return;
    }

    const token = await signToken({
      userId: user.id,
      tenantId: user.tenant_id,
      branchId: user.branch_id,
      roles: roleCodes,
    });

    let redirectUrl = '/dashboard';
    if (roleCodes.includes('SUPER_ADMIN')) {
      redirectUrl = '/tenants';
    } else if (roleCodes.includes('CHEF')) {
      redirectUrl = '/dashboard/kitchen';
    } else if (roleCodes.includes('WAITER')) {
      redirectUrl = '/dashboard/waiter';
    } else if (roleCodes.includes('CASHIER')) {
      redirectUrl = '/dashboard/cashier';
    }

    res.json({
      success: true,
      token,
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        roles: roleCodes,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        tenant: true,
        roles: { include: { role: true } }
      }
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        roles: user.roles.map(ur => ur.role.code),
        tenant: user.tenant,
        branch_id: user.branch_id
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response): void => {
  res.json({ success: true });
});

export default router;
