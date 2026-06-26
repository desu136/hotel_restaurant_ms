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
    } else if (roleCodes.includes('HOTEL_MANAGER') || roleCodes.includes('RESTAURANT_MANAGER')) {
      redirectUrl = '/dashboard/manager/category';
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
        phone: user.phone,
        avatar_url: user.avatar_url,
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
        branch: true,
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
        phone: user.phone,
        avatar_url: user.avatar_url,
        roles: user.roles.map(ur => ur.role.code),
        tenant: user.tenant,
        branch_id: user.branch_id,
        branchName: user.branch?.name || null
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

// PATCH /api/auth/me  — update own profile (name, avatar, phone)
router.patch('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, avatar_url, phone } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(name && { full_name: name }),
        ...(avatar_url !== undefined && { avatar_url }),
        ...(phone !== undefined && { phone }),
      },
      select: { id: true, email: true, full_name: true, phone: true, avatar_url: true },
    });
    res.json({ success: true, user: { id: updated.id, email: updated.email, name: updated.full_name, phone: updated.phone, avatar_url: updated.avatar_url } });
  } catch (error) {
    console.error('PATCH /me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/me/password  — change own password
router.post('/me/password', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'currentPassword and newPassword are required' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) { res.status(400).json({ error: 'Current password is incorrect' }); return; }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password_hash: newHash } });
    res.json({ success: true });
  } catch (error) {
    console.error('POST /me/password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auth/me  — delete own account
router.delete('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    if (!password) { res.status(400).json({ error: 'Password confirmation required' }); return; }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) { res.status(400).json({ error: 'Incorrect password' }); return; }

    await prisma.user.delete({ where: { id: user.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
