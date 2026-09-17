import { test, expect } from '@playwright/test';

test.describe('Smoke @smoke', () => {
  test('login page renders the sign-in form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('register page is reachable', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test('unauthenticated dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('public menu route does not crash on a bad restaurant id', async ({ page }) => {
    await page.goto('/menu/invalid-restaurant-uuid');
    await expect(page.locator('body')).toBeVisible();
  });

  test('backend health endpoint is up', async ({ request }) => {
    const backend = process.env.BACKEND_URL || 'http://localhost:4000';
    const res = await request.get(`${backend}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
