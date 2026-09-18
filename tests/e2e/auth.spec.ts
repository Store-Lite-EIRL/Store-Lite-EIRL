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

test('theme toggle switches /auth between dark and light variants (slice 2)', async ({ page }) => {
  // System theme = dark so the effective theme is deterministic before the first flip.
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/auth');

  const body = page.locator('body');
  const root = page.locator('html');
  const toggle = page.getByRole('button', { name: 'Cambiar tema' });
  const formPanel = page.locator('section[aria-labelledby="auth-title"]');
  const marketingPanel = page.getByRole('complementary', { name: 'Store Lite' });

  // Dark variant is the default source of truth (design R5/D6).
  await expect(body).toHaveClass(/\bdark\b/);
  await expect(body).not.toHaveClass(/\blight\b/);
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.06)');
  await expect(formPanel).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.03)');

  // First click → light variant: body class, data-theme, localStorage, and the
  // light --auth-* values from the design table (glass .55, insight .35, toggle white).
  await toggle.click();
  await page.mouse.move(0, 0); // leave the toggle so :hover does not override the token
  await expect(body).toHaveClass(/\blight\b/);
  await expect(body).not.toHaveClass(/\bdark\b/);
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('app-theme'))).toBe('light');
  await expect(toggle).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(formPanel).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.55)');
  await expect(marketingPanel).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.35)');

  // Second click → back to the dark variant.
  await toggle.click();
  await expect(body).toHaveClass(/\bdark\b/);
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect(formPanel).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.03)');
});
