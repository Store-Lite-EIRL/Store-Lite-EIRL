import { expect, test } from '@playwright/test';

test('should load pricing page with plan section', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page).toHaveTitle(/Store Lite/i);

  // Page heading should be visible
  await expect(page.locator('h1')).toContainText('Planes y Precios');

  // Plan cards render as h3 elements
  const planHeadings = page.locator('h3.pricing-card-title');
  await expect(planHeadings.first()).toBeVisible({ timeout: 10000 });
});
