import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCurrentUserCache, fetchCurrentUser } from '@/lib/current-user';

describe('fetchCurrentUser', () => {
  beforeEach(() => {
    clearCurrentUserCache();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: 'u1', name: 'Waiter One', email: 'w@test.com', roles: ['WAITER'] },
        }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearCurrentUserCache();
  });

  it('loads the current user from /api/auth/me', async () => {
    const data = await fetchCurrentUser();
    expect(data.success).toBe(true);
    expect(data.user?.email).toBe('w@test.com');
    expect(fetch).toHaveBeenCalledWith('/api/auth/me', { credentials: 'include' });
  });

  it('reuses the in-memory cache within the TTL', async () => {
    await fetchCurrentUser();
    await fetchCurrentUser();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('bypasses cache when force is true', async () => {
    await fetchCurrentUser();
    await fetchCurrentUser(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws when the session is unauthorized', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }));
    await expect(fetchCurrentUser(true)).rejects.toThrow('Unauthorized');
  });
});
