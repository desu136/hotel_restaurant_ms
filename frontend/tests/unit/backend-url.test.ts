import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBackendUrl } from '@/lib/backend-url';

describe('getBackendUrl', () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
    delete process.env.BACKEND_URL;
    delete process.env.NEXT_PUBLIC_BACKEND_URL;
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('uses localhost in development when no env is set', () => {
    Object.assign(process.env, { NODE_ENV: 'development' });
    expect(getBackendUrl()).toBe('http://localhost:4000');
  });

  it('strips a trailing slash', () => {
    Object.assign(process.env, { NODE_ENV: 'development' });
    process.env.BACKEND_URL = 'http://localhost:4000/';
    expect(getBackendUrl()).toBe('http://localhost:4000');
  });

  it('prefers BACKEND_URL over the public fallback', () => {
    Object.assign(process.env, { NODE_ENV: 'development' });
    process.env.BACKEND_URL = 'http://api.internal:4000';
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://public.example:4000';
    expect(getBackendUrl()).toBe('http://api.internal:4000');
  });

  it('uses the docker backend service in production when no env is set', () => {
    Object.assign(process.env, { NODE_ENV: 'production' });
    expect(getBackendUrl()).toBe('http://backend:4000');
  });

  it('honours BACKEND_URL in production', () => {
    Object.assign(process.env, { NODE_ENV: 'production' });
    process.env.BACKEND_URL = 'http://backend:4000';
    expect(getBackendUrl()).toBe('http://backend:4000');
  });
});
