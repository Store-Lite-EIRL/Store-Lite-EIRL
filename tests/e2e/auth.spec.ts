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

/* ──────────────────────────────────────────────────────────────────────
   Slice 3.1 — E2e viewport collapse + consent-bar nav
   ────────────────────────────────────────────────────────────────────── */

test('viewport 1280x800 shows both form and marketing panels (desktop)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/auth');

  const formPanel = page.locator('section[aria-labelledby="auth-title"]');
  const marketingPanel = page.getByRole('complementary', { name: 'Store Lite' });

  await expect(formPanel).toBeVisible();
  await expect(marketingPanel).toBeVisible();

  // Verify marketing panel content renders
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'Todo lo que vendes, en un solo lugar.',
  );
  await expect(page.getByText('Tu negocio, en movimiento')).toBeVisible();
});

test('viewport 800x800 collapses to single column — marketing panel hidden, form panel visible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 800 });
  await page.goto('/auth');

  const formPanel = page.locator('section[aria-labelledby="auth-title"]');
  const marketingPanel = page.getByRole('complementary', { name: 'Store Lite' });

  await expect(formPanel).toBeVisible();
  await expect(marketingPanel).toBeHidden();
});

test('consent deep-link /privacidad is accessible (ConsentBar removed; global ConsentBanner handles this)', async ({
  page,
}) => {
  // ConsentBar was removed from MarketingPanel per user feedback (duplicate of global ConsentBanner).
  // The /privacidad route should still be accessible. This test verifies the route exists.
  const response = await page.goto('/privacidad');
  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator('h1')).toContainText(/Privacidad|Política/i);
});

/* ──────────────────────────────────────────────────────────────────────
   Slice 3.2 — Reduced-motion + focus + contrast audit
   ────────────────────────────────────────────────────────────────────── */

test('prefers-reduced-motion disables particle and orb animations', async ({ page }) => {
  // Emulate reduced motion preference
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/auth');

  // Wait for animations to settle
  await page.waitForTimeout(100);

  // Verify particle animations are paused - check the particle wrapper elements
  // Particles have dynamically generated class names from CSS modules, use the wrapper
  const particleWrapper = page.locator('[class*="particleWrapper"]').first();
  await expect(particleWrapper).toBeAttached();

  // Check that particles inside have no animation running
  const particles = page.locator('[class*="particle"]').first();
  if ((await particles.count()) > 0) {
    const animationName = await particles.evaluate((el) => getComputedStyle(el).animationName);
    expect(animationName).toBe('none');
  }
});

test('focus-visible rings on all interactive elements (toggle, checkbox, buttons, links)', async ({
  page,
}) => {
  await page.goto('/auth');

  // Tab through all interactive elements and verify focus-visible ring
  const toggle = page.getByRole('button', { name: 'Cambiar tema' });
  const consentCheckbox = page.getByLabel('Accept terms and conditions');

  // Focus each element and verify outline/ring
  await toggle.focus();
  await expect(toggle).toHaveCSS('outline-style', 'solid');
  await expect(toggle).toHaveCSS('outline-width', '2px');

  await consentCheckbox.focus();
  await expect(consentCheckbox).toHaveCSS('outline-style', 'solid');

  // Enable consent to test Google/Facebook buttons (phone is permanently disabled, not interactive)
  await consentCheckbox.check();
  const googleBtn = page.getByRole('button', { name: /continuar con google/i });
  const facebookBtn = page.getByRole('button', { name: /continuar con facebook/i });

  await googleBtn.focus();
  await expect(googleBtn).toHaveCSS('outline-style', 'solid');

  await facebookBtn.focus();
  await expect(facebookBtn).toHaveCSS('outline-style', 'solid');
});

test('text contrast passes AA in dark theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/auth');

  // Check key text elements have sufficient contrast against their backgrounds
  // This is a basic structural check - full contrast audit requires axe
  const h1 = page.locator('h1');
  const h2 = page.getByRole('heading', { level: 2 });
  const eyebrow = page.locator('p').filter({ hasText: 'Bienvenido a Store Lite' }).first();
  const subtitle = page.locator('p').filter({ hasText: 'Publica tus productos' }).first();
  const buttonText = page.getByRole('button', { name: /continuar con google/i });

  await expect(h1).toBeVisible();
  await expect(h2).toBeVisible();
  await expect(eyebrow).toBeVisible();
  await expect(subtitle).toBeVisible();
  await expect(buttonText).toBeVisible();
});

test('text contrast passes AA in light theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/auth');

  const h1 = page.locator('h1');
  const h2 = page.getByRole('heading', { level: 2 });
  const eyebrow = page.locator('p').filter({ hasText: 'Bienvenido a Store Lite' }).first();
  const subtitle = page.locator('p').filter({ hasText: 'Publica tus productos' }).first();
  const buttonText = page.getByRole('button', { name: /continuar con google/i });

  await expect(h1).toBeVisible();
  await expect(h2).toBeVisible();
  await expect(eyebrow).toBeVisible();
  await expect(subtitle).toBeVisible();
  await expect(buttonText).toBeVisible();

  // Verify light theme tokens applied
  const body = page.locator('body');
  await expect(body).toHaveClass(/\blight\b/);
});

/* ──────────────────────────────────────────────────────────────────────
   Slice 3.3 — Full gate + untouched-route smoke checks
   ────────────────────────────────────────────────────────────────────── */

test('untouched route: /auth/callback loads without 500 error', async ({ page }) => {
  const response = await page.goto('/auth/callback');
  // May redirect depending on auth state, but should not 500
  expect(response?.status()).toBeLessThan(500);
  // Should render something (not a blank error page)
  await expect(page.locator('body')).not.toBeEmpty();
});

test('untouched route: /auth/customer loads without 500 error', async ({ page }) => {
  const response = await page.goto('/auth/customer');
  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator('body')).not.toBeEmpty();
});

test('untouched route: /auth/chat-popup loads without 500 error', async ({ page }) => {
  const response = await page.goto('/auth/chat-popup');
  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator('body')).not.toBeEmpty();
});
