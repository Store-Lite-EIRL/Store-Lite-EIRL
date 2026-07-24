import { expect, test } from '@playwright/test';

test('should load landing page', async ({ page }) => {
  await page.goto('/');
  // Basic check for landing page content
  // Since you have a HeroLanding component
  await expect(page).toHaveTitle(/Store Lite/i);
});
