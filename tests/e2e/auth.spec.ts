import { expect, test } from '@playwright/test';

test('should load auth/login page', async ({ page }) => {
  await page.goto('/auth');
  await expect(page).toHaveTitle(/Store Lite/i);

  // Auth page should show the sign-in section
  await expect(page.locator('h1')).toContainText(/Tu tienda global comienza aquí/i);
});

test('should load auth callback page without error', async ({ page }) => {
  const response = await page.goto('/auth/callback');
  // May redirect depending on auth state, but should not 500
  expect(response?.status()).toBeLessThan(500);
});

test('should load customer auth popup', async ({ page }) => {
  const response = await page.goto('/auth/customer');
  expect(response?.status()).toBeLessThan(500);
});
