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

test('should render email/password form behind toggle with submit disabled until consent', async ({
  page,
}) => {
  await page.goto('/auth');

  // Form is hidden by default — only the discreet toggle, Google button and
  // consent render (email-password-login.r3, form collapsed by default)
  await expect(page.locator('md-outlined-text-field[type="email"]')).toHaveCount(0);

  // The discreet toggle reveals the form
  await page.getByRole('button', { name: /acceso con correo electrónico/i }).click();
  await expect(page.locator('md-outlined-text-field[type="email"]')).toBeVisible();
  await expect(page.locator('md-outlined-text-field[type="password"]')).toBeVisible();

  // Submit control renders disabled until consent (auth-consent.r5, email-password-login.r4).
  // MD3 custom elements don't expose a `disabled` IDL property, so Playwright's
  // toBeDisabled() reads it as enabled — assert the rendered attribute instead.
  // Note: locate by accessible name, not `md-filled-button[type="submit"]` — React 19
  // sets `type` as a property on the client-mounted custom element, so the attribute
  // never exists on the host (it did only when SSR'd, pre-toggle).
  const submit = page.getByRole('button', { name: 'Iniciar sesión' });
  await expect(submit).toBeVisible();
  await expect(submit).toHaveAttribute('disabled');

  // Checking consent enables the submit control (email-password-login.r4)
  await page.getByLabel('Accept terms and conditions').check();
  await expect(submit).not.toHaveAttribute('disabled');
});
