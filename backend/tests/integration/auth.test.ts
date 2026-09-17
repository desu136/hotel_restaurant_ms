import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/index';
import { prisma } from '../../src/lib/prisma';
import { authToken, bearer } from '../helpers/tokens';
import { TENANT_A_ID, USER_ID } from '../helpers/ids';

const PASSWORD = 'password123';

function mockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: USER_ID,
    email: 'waiter@test.com',
    full_name: 'Waiter One',
    phone: null,
    avatar_url: null,
    status: 'ACTIVE',
    tenant_id: TENANT_A_ID,
    branch_id: '00000000-0000-0000-0000-0000000000a1',
    password_hash: '',
    tenant: { id: TENANT_A_ID, status: 'ACTIVE', business_name: 'Alpha Hotel' },
    branch: { id: '00000000-0000-0000-0000-0000000000a1', name: 'Main' },
    roles: [{ role: { code: 'WAITER' } }],
    ...overrides,
  };
}

describe('Auth suite', () => {
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    test('rejects missing email or password', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'a@test.com' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email or phone number and password/i);
    });

    test('rejects unknown user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: PASSWORD });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid credentials/i);
    });

    test('rejects wrong password', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(mockUser({ password_hash: passwordHash }));
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'waiter@test.com', password: 'wrong-password' });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid credentials/i);
    });

    test('rejects suspended user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(
        mockUser({ password_hash: passwordHash, status: 'SUSPENDED' })
      );
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'waiter@test.com', password: PASSWORD });
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/suspended/i);
    });

    test('rejects inactive tenant for non-admin', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(
        mockUser({
          password_hash: passwordHash,
          tenant: { id: TENANT_A_ID, status: 'SUSPENDED', business_name: 'Alpha Hotel' },
        })
      );
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'waiter@test.com', password: PASSWORD });
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/tenant account is not active/i);
    });

    test.each(['0912345678', '912345678', '+251912345678', '251912345678'])(
      'logs in with phone %s',
      async (phone) => {
        (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(
          mockUser({ password_hash: passwordHash, phone: '+251912345678' })
        );
        const res = await request(app).post('/api/auth/login').send({ phone, password: PASSWORD });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(prisma.user.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { phone: { in: expect.arrayContaining(['+251912345678', '0912345678']) } },
          })
        );
      }
    );

    test('logs in with identifier set to a phone number', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(
        mockUser({ password_hash: passwordHash, phone: '+251912345678' })
      );
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: '0912345678', password: PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.user.phone).toBe('+251912345678');
    });

    test('rejects an invalid phone identifier without hitting the database', async () => {
      const res = await request(app).post('/api/auth/login').send({ phone: '555-0100', password: PASSWORD });
      expect(res.status).toBe(401);
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });

    test.each([
      ['SUPER_ADMIN', '/tenants'],
      ['HOTEL_OWNER', '/dashboard'],
      ['RESTAURANT_MANAGER', '/dashboard/manager/category'],
      ['HOTEL_MANAGER', '/dashboard/manager/category'],
      ['CHEF', '/dashboard/kitchen'],
      ['WAITER', '/dashboard/waiter'],
      ['CASHIER', '/dashboard/cashier'],
    ] as const)('redirects %s to %s', async (role, redirectUrl) => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(
        mockUser({
          password_hash: passwordHash,
          roles: [{ role: { code: role } }],
        })
      );
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'waiter@test.com', password: PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeTruthy();
      expect(res.body.redirectUrl).toBe(redirectUrl);
      expect(res.body.user.roles).toContain(role);
    });
  });

  describe('GET /api/auth/me', () => {
    test('rejects missing token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    test('returns profile for valid token', async () => {
      const token = await authToken(['WAITER']);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: USER_ID,
        email: 'waiter@test.com',
        full_name: 'Waiter One',
        phone: null,
        avatar_url: null,
        branch_id: '00000000-0000-0000-0000-0000000000a1',
        tenant: { id: TENANT_A_ID, business_name: 'Alpha Hotel', business_type: 'HOTEL', status: 'ACTIVE' },
        branch: { id: '00000000-0000-0000-0000-0000000000a1', name: 'Main' },
        roles: [{ role: { code: 'WAITER' } }],
      });

      const res = await request(app).get('/api/auth/me').set(bearer(token));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('waiter@test.com');
      expect(res.body.user.roles).toContain('WAITER');
      expect(res.body.user.branchName).toBe('Main');
    });

    test('accepts token from cookie', async () => {
      const token = await authToken(['WAITER']);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: USER_ID,
        email: 'waiter@test.com',
        full_name: 'Waiter One',
        phone: null,
        avatar_url: null,
        branch_id: null,
        tenant: null,
        branch: null,
        roles: [{ role: { code: 'WAITER' } }],
      });

      const res = await request(app).get('/api/auth/me').set('Cookie', `token=${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Waiter One');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('returns success', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/auth/me', () => {
    test('requires auth', async () => {
      const res = await request(app).patch('/api/auth/me').send({ name: 'New Name' });
      expect(res.status).toBe(401);
    });

    test('updates own profile', async () => {
      const token = await authToken(['WAITER']);
      const res = await request(app)
        .patch('/api/auth/me')
        .set(bearer(token))
        .send({ name: 'Updated Waiter', phone: '0912345678' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Updated Waiter');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ phone: '+251912345678' }),
        })
      );
    });

    test('rejects a non-Ethiopian phone on profile update', async () => {
      const token = await authToken(['WAITER']);
      const res = await request(app)
        .patch('/api/auth/me')
        .set(bearer(token))
        .send({ phone: '555-0100' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/ethiopian number/i);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/me/password', () => {
    test('requires current and new password', async () => {
      const token = await authToken(['WAITER']);
      const res = await request(app).post('/api/auth/me/password').set(bearer(token)).send({});
      expect(res.status).toBe(400);
    });

    test('rejects short new password', async () => {
      const token = await authToken(['WAITER']);
      const res = await request(app)
        .post('/api/auth/me/password')
        .set(bearer(token))
        .send({ currentPassword: PASSWORD, newPassword: '123' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/at least 6 characters/i);
    });

    test('changes password when current password is valid', async () => {
      const token = await authToken(['WAITER']);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(
        mockUser({ password_hash: passwordHash })
      );
      const res = await request(app)
        .post('/api/auth/me/password')
        .set(bearer(token))
        .send({ currentPassword: PASSWORD, newPassword: 'newpass1' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('Forgot / reset password', () => {
    test('forgot-password requires email', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({});
      expect(res.status).toBe(400);
    });

    test('forgot-password does not leak whether email exists', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'missing@test.com' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.resetCode).toBeUndefined();
      expect(res.body.message).toMatch(/if an account exists/i);
    });

    test('reset-password rejects missing fields and short passwords', async () => {
      const missing = await request(app).post('/api/auth/reset-password').send({ email: 'a@test.com' });
      expect(missing.status).toBe(400);

      const short = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'a@test.com', resetCode: '123456', newPassword: '12' });
      expect(short.status).toBe(400);
      expect(short.body.error).toMatch(/at least 6 characters/i);
    });

    test('reset-password rejects unknown code', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'waiter@test.com', resetCode: '000000', newPassword: 'newpass1' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid or expired/i);
    });

    test('issues a reset code for an active user and accepts it', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(
        mockUser({ password_hash: passwordHash, email: 'reset@test.com' })
      );

      const forgot = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'reset@test.com' });
      expect(forgot.status).toBe(200);
      expect(forgot.body.resetCode).toMatch(/^\d{6}$/);

      const reset = await request(app).post('/api/auth/reset-password').send({
        email: 'reset@test.com',
        resetCode: forgot.body.resetCode,
        newPassword: 'brandnew1',
      });
      expect(reset.status).toBe(200);
      expect(reset.body.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalled();
    });

    test('direct reset requires email, phone, and new password', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'reset@test.com', newPassword: 'brandnew1' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email, phone number, and a new password/i);
    });

    test('direct reset rejects a phone that does not match the account', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(
        mockUser({ email: 'reset@test.com', phone: '+251912345678', status: 'ACTIVE' })
      );
      const res = await request(app).post('/api/auth/forgot-password').send({
        email: 'reset@test.com',
        phone: '0911111111',
        newPassword: 'brandnew1',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email and phone match/i);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    test('direct reset updates the password when email and phone match', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(
        mockUser({ email: 'reset@test.com', phone: '+251912345678', status: 'ACTIVE' })
      );
      const res = await request(app).post('/api/auth/forgot-password').send({
        email: 'reset@test.com',
        phone: '0912345678',
        newPassword: 'brandnew1',
        confirmPassword: 'brandnew1',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });
});
