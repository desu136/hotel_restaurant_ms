import { describe, expect, it } from 'vitest';
import { verifyToken } from '@/lib/auth';

function jwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('verifyToken', () => {
  it('returns payload for a non-expired token', async () => {
    const token = jwt({
      userId: 'u1',
      tenantId: 't1',
      roles: ['WAITER'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const payload = await verifyToken(token);
    expect(payload?.userId).toBe('u1');
    expect(payload?.roles).toContain('WAITER');
  });

  it('returns null for an expired token', async () => {
    const token = jwt({
      userId: 'u1',
      roles: ['WAITER'],
      exp: Math.floor(Date.now() / 1000) - 10,
    });
    expect(await verifyToken(token)).toBeNull();
  });

  it('returns null for malformed tokens', async () => {
    expect(await verifyToken('not-a-jwt')).toBeNull();
  });
});
