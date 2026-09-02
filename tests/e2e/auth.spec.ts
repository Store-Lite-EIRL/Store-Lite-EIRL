import { expect, test } from '@playwright/test';

test('should load auth/login page', async ({ page }) => {
  await page.goto('/auth');
  await expect(page).toHaveTitle(/Store Lite/i);

  // Auth page should show the sign-in section
  await expect(page.locator('h1')).toContainText(/Tu tienda, lista para vender/i);
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

test('should render OAuth providers disabled until consent', async ({ page }) => {
  await page.goto('/auth');

  // Email/password login was removed — the form must not exist at all
  // (email-password-login.r3 removed; only OAuth providers and consent render)
  await expect(page.locator('md-outlined-text-field[type="email"]')).toHaveCount(0);
  await expect(page.locator('md-outlined-text-field[type="password"]')).toHaveCount(0);

  // Google and Facebook buttons render disabled until consent (auth-consent.r5).
  // Note: locate by accessible name, not by CSS — buttons are plain <button>
  // elements, so the `disabled` attribute is rendered directly on the host.
  const google = page.getByRole('button', { name: /continuar con google/i });
  const facebook = page.getByRole('button', { name: /continuar con facebook/i });
  await expect(google).toBeVisible();
  await expect(google).toHaveAttribute('disabled');
  await expect(facebook).toBeVisible();
  await expect(facebook).toHaveAttribute('disabled');

  // Checking consent enables the OAuth providers (auth-consent.r5)
  await page.getByLabel('Accept terms and conditions').check();
  await expect(google).not.toHaveAttribute('disabled');
  await expect(facebook).not.toHaveAttribute('disabled');
});
