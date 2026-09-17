import { test, expect } from '@playwright/test';

const MOCK_RESTAURANT_ID = '00000000-0000-0000-0000-000000000001';
const MOCK_BRANCH_ID = '00000000-0000-0000-0000-0000000000a1';
const MOCK_TABLE_ID = '00000000-0000-0000-0000-000000000003';

test.describe('Regression @regression', () => {
  test('login form validates required fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-form')).toBeVisible();
  });

  test('invalid credentials stay on login and show an error', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill('nobody@example.com');
    await page.getByTestId('login-password').fill('wrong-password');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('forgot-password page opens from the login screen', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-forgot').click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByTestId('forgot-password-form')).toBeVisible();
    await expect(page.getByText('Reset password')).toBeVisible();
  });

  test('staff kitchen, waiter, and cashier routes require auth', async ({ page }) => {
    for (const path of ['/dashboard/kitchen', '/dashboard/waiter', '/dashboard/cashier', '/dashboard/manager']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('dine-in menu URL with table query loads a page shell', async ({ page }) => {
    await page.goto(`/menu/${MOCK_RESTAURANT_ID}?branch_id=${MOCK_BRANCH_ID}&tableId=${MOCK_TABLE_ID}`);
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('admin tenants route requires auth', async ({ page }) => {
    await page.goto('/tenants');
    await expect(page).toHaveURL(/\/login/);
  });
});
