import { expect, test } from '@playwright/test';

test('should load auth/login page', async ({ page }) => {
  await page.goto('/auth');
  await expect(page).toHaveTitle(/Store Lite/i);

  // Auth page should show the sign-in call-to-action
  await expect(page.getByText(/Tu tienda global comienza aquí/i)).toBeVisible();
});

test('should load auth callback page without error', async ({ page }) => {
  await page.goto('/auth/callback');
  await expect(page).toHaveTitle(/Store Lite/i);
});

test('should load customer auth popup', async ({ page }) => {
  await page.goto('/auth/customer');
  await expect(page).toHaveTitle(/Store Lite/i);
});
